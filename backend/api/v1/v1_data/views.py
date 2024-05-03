# Create your views here.
import pandas as pd
import os
import pathlib

from math import ceil
from collections import defaultdict
from datetime import datetime, date
from wsgiref.util import FileWrapper
from django.utils import timezone

# from operator import or_
# from functools import reduce

from django.contrib.postgres.aggregates import StringAgg
from django.db.models import Count, TextField, F, Sum, Avg, Max
from django.db.models.functions import Cast, Coalesce
from django.http import HttpResponse
from django_q.tasks import async_task
from drf_spectacular.types import OpenApiTypes
from drf_spectacular.utils import (
    extend_schema,
    inline_serializer,
    OpenApiParameter,
    OpenApiResponse,
    OpenApiExample,
)
from rest_framework import serializers, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.generics import get_object_or_404
from rest_framework.pagination import PageNumberPagination
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from api.v1.v1_data.constants import DataApprovalStatus
from api.v1.v1_data.models import (
    FormData,
    Answers,
    PendingFormData,
    PendingDataBatch,
    ViewPendingDataApproval,
    PendingAnswers,
    AnswerHistory,
    PendingAnswerHistory,
    PendingDataApproval,
)
from api.v1.v1_data.serializers import (
    SubmitFormSerializer,
    ListFormDataSerializer,
    ListFormDataRequestSerializer,
    ListDataAnswerSerializer,
    ListMapDataPointSerializer,
    ListMapDataPointRequestSerializer,
    ListChartDataPointRequestSerializer,
    ListChartQuestionDataPointSerializer,
    ListChartAdministrationRequestSerializer,
    ListPendingDataAnswerSerializer,
    ApprovePendingDataRequestSerializer,
    ListBatchSerializer,
    CreateBatchSerializer,
    ListPendingDataBatchSerializer,
    ListPendingFormDataSerializer,
    PendingBatchDataFilterSerializer,
    SubmitPendingFormSerializer,
    ListBatchSummarySerializer,
    ListBatchCommentSerializer,
    BatchListRequestSerializer,
    SubmitFormDataAnswerSerializer,
    ChartDataSerializer,
    ListChartCriteriaRequestSerializer,
    ListMapOverviewDataPointSerializer,
    ListMapOverviewDataPointRequestSerializer,
)
from api.v1.v1_data.functions import (
    get_cache,
    create_cache,
    get_advance_filter_data_ids,
    transform_glass_answer,
)
from api.v1.v1_forms.constants import QuestionTypes, FormTypes, SubmissionTypes
from api.v1.v1_forms.models import Forms, Questions
from api.v1.v1_profile.models import Administration, Levels
from api.v1.v1_users.models import SystemUser
from api.v1.v1_profile.constants import UserRoleTypes
from api.v1.v1_categories.functions import (
    get_category_results,
    get_jmp_config_by_form,
)
from api.v1.v1_categories.models import DataCategory

from rtmis.settings import REST_FRAMEWORK
from utils.custom_permissions import (
    IsSuperAdmin,
    IsAdmin,
    IsApprover,
    IsSubmitter,
    PublicGet,
)
from utils.custom_serializer_fields import validate_serializers_message
from utils.default_serializers import DefaultResponseSerializer
from utils.export_form import blank_data_template

period_length = 60 * 15


class FormDataAddListView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(
        responses={
            (200, "application/json"): inline_serializer(
                "DataList",
                fields={
                    "current": serializers.IntegerField(),
                    "total": serializers.IntegerField(),
                    "total_page": serializers.IntegerField(),
                    "data": ListFormDataSerializer(many=True),
                },
            )
        },
        tags=["Data"],
        parameters=[
            OpenApiParameter(
                name="page",
                required=True,
                type=OpenApiTypes.NUMBER,
                location=OpenApiParameter.QUERY,
            ),
            OpenApiParameter(
                name="administration",
                required=False,
                type=OpenApiTypes.NUMBER,
                location=OpenApiParameter.QUERY,
            ),
            OpenApiParameter(
                name="questions",
                required=False,
                type={"type": "array", "items": {"type": "number"}},
                location=OpenApiParameter.QUERY,
            ),
            OpenApiParameter(
                name="options",
                required=False,
                type={"type": "array", "items": {"type": "string"}},
                location=OpenApiParameter.QUERY,
            ),
            OpenApiParameter(
                name="parent",
                required=False,
                type=OpenApiTypes.NUMBER,
                location=OpenApiParameter.QUERY,
            ),
            OpenApiParameter(
                name="submission_type",
                required=False,
                enum=SubmissionTypes.FieldStr.keys(),
                type=OpenApiTypes.NUMBER,
                location=OpenApiParameter.QUERY,
            ),
        ],
        summary="To get list of form data",
    )
    def get(self, request, form_id, version):
        form = get_object_or_404(Forms, pk=form_id)
        serializer = ListFormDataRequestSerializer(
            data=request.GET, context={"form_id": form_id}
        )
        if not serializer.is_valid():
            return Response(
                {"message": validate_serializers_message(serializer.errors)},
                status=status.HTTP_400_BAD_REQUEST,
            )
        page_size = REST_FRAMEWORK.get("PAGE_SIZE")

        paginator = PageNumberPagination()

        submission_type = request.GET.get(
            "submission_type", SubmissionTypes.registration
        )
        submission_type = int(submission_type)
        parent = serializer.validated_data.get("parent")
        if parent:
            submission_types = [submission_type]
            if submission_type == SubmissionTypes.monitoring:
                submission_types.append(SubmissionTypes.registration)
            queryset = form.form_form_data.filter(
                uuid=parent.uuid,
                submission_type__in=submission_types,
            )
            queryset = queryset.order_by("-created")
            instance = paginator.paginate_queryset(queryset, request)
            data = {
                "current": int(request.GET.get("page", "1")),
                "total": queryset.count(),
                "total_page": ceil(queryset.count() / page_size),
                "data": ListFormDataSerializer(
                    instance=instance,
                    context={
                        "questions": serializer.validated_data.get("questions")
                    },
                    many=True,
                ).data,
            }
            return Response(data, status=status.HTTP_200_OK)

        # get latest data
        latest_ids_per_uuid = (
            form.form_form_data.filter(submission_type=submission_type)
            .values("uuid")
            .annotate(latest_id=Max("id"))
            .values_list("latest_id", flat=True)
        )
        filter_data = {}
        filter_data["pk__in"] = latest_ids_per_uuid
        filter_data["submission_type"] = submission_type

        access = request.user.user_access

        if serializer.validated_data.get("administration"):
            filter_administration = serializer.validated_data.get(
                "administration"
            )
            if filter_administration.path:
                filter_path = "{0}{1}.".format(
                    filter_administration.path, filter_administration.id
                )
            else:
                filter_path = f"{filter_administration.id}."
            filter_descendants = list(
                Administration.objects.filter(
                    path__startswith=filter_path
                ).values_list("id", flat=True)
            )
            filter_descendants.append(filter_administration.id)
            filter_data["administration_id__in"] = filter_descendants
        else:
            user_path = access.administration.path or "1."
            filter_data["administration__path__startswith"] = user_path

        # Advance filter
        data_ids = None
        if request.GET.getlist("options"):
            data_ids = get_advance_filter_data_ids(
                form_id=form_id,
                administration_id=request.GET.get("administration"),
                options=request.GET.getlist("options"),
            )
            filter_data["pk__in"] = data_ids

        queryset = form.form_form_data.filter(**filter_data).order_by(
            "-created"
        )

        instance = paginator.paginate_queryset(queryset, request)
        data = {
            "current": int(request.GET.get("page", "1")),
            "total": queryset.count(),
            "total_page": ceil(queryset.count() / page_size),
            "data": ListFormDataSerializer(
                instance=instance,
                context={
                    "questions": serializer.validated_data.get("questions")
                },
                many=True,
            ).data,
        }
        return Response(data, status=status.HTTP_200_OK)

    @extend_schema(
        request=SubmitFormSerializer,
        responses={200: DefaultResponseSerializer},
        tags=["Data"],
        summary="Submit form data",
    )
    def post(self, request, form_id, version):
        form = get_object_or_404(Forms, pk=form_id)
        serializer = SubmitFormSerializer(
            data=request.data, context={"user": request.user, "form": form}
        )
        if not serializer.is_valid():
            return Response(
                {
                    "message": validate_serializers_message(serializer.errors),
                    "details": serializer.errors,
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        serializer.save()
        return Response({"message": "ok"}, status=status.HTTP_200_OK)

    @extend_schema(
        request=SubmitFormDataAnswerSerializer(many=True),
        responses={200: DefaultResponseSerializer},
        tags=["Data"],
        parameters=[
            OpenApiParameter(
                name="data_id",
                required=True,
                type=OpenApiTypes.NUMBER,
                location=OpenApiParameter.QUERY,
            )
        ],
        summary="Edit form data",
    )
    def put(self, request, form_id, version):
        data_id = request.GET["data_id"]
        user = request.user
        user_role = user.user_access.role
        form = get_object_or_404(Forms, pk=form_id)
        data = get_object_or_404(FormData, pk=data_id)
        serializer = SubmitFormDataAnswerSerializer(
            data=request.data, many=True
        )
        if not serializer.is_valid():
            return Response(
                {
                    "message": validate_serializers_message(serializer.errors),
                    "details": serializer.errors,
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        answers = request.data
        # is_national_form = form.type == FormTypes.national
        is_county_form = form.type == FormTypes.county

        is_super_admin = user_role == UserRoleTypes.super_admin
        is_county_admin = user_role == UserRoleTypes.admin
        is_county_admin_with_county_form = is_county_admin and is_county_form

        # Direct update
        if is_super_admin or is_county_admin_with_county_form:
            # move current answer to answer_history
            for answer in answers:
                form_answer = Answers.objects.filter(
                    data=data, question=answer.get("question")
                ).first()
                if form_answer:
                    AnswerHistory.objects.create(
                        data=form_answer.data,
                        question=form_answer.question,
                        name=form_answer.name,
                        value=form_answer.value,
                        options=form_answer.options,
                        created_by=user,
                    )
                if not form_answer:
                    form_answer = Answers(
                        data=data,
                        question_id=answer.get("question"),
                        created_by=user,
                    )
                # prepare updated answer
                question_id = answer.get("question")
                question = Questions.objects.get(id=question_id)
                name = None
                value = None
                option = None
                if question.type in [
                    QuestionTypes.geo,
                    QuestionTypes.option,
                    QuestionTypes.multiple_option,
                ]:
                    option = answer.get("value")
                elif question.type in [
                    QuestionTypes.text,
                    QuestionTypes.photo,
                    QuestionTypes.date,
                ]:
                    name = answer.get("value")
                else:
                    # for administration,number question type
                    value = answer.get("value")
                # Update answer
                form_answer.data = data
                form_answer.question = question
                form_answer.name = name
                form_answer.value = value
                form_answer.options = option
                form_answer.updated = timezone.now()
                form_answer.save()
            # update datapoint
            data.updated = timezone.now()
            data.updated_by = user
            data.save()
            data.save_to_file
            async_task("api.v1.v1_data.functions.refresh_materialized_data")
            return Response(
                {"message": "direct update success"}, status=status.HTTP_200_OK
            )
        # Store edit data to pending form data
        pending_data = PendingFormData.objects.create(
            name=data.name,
            form=data.form,
            data=data,
            administration=data.administration,
            geo=data.geo,
            batch=None,
            created_by=user,
        )
        for answer in answers:
            # store to pending answer
            question_id = answer.get("question")
            question = Questions.objects.get(id=question_id)
            name = None
            value = None
            option = None
            if question.type in [
                QuestionTypes.geo,
                QuestionTypes.option,
                QuestionTypes.multiple_option,
            ]:
                option = answer.get("value")
            elif question.type in [
                QuestionTypes.text,
                QuestionTypes.photo,
                QuestionTypes.date,
            ]:
                name = answer.get("value")
            else:
                # for administration,number question type
                value = answer.get("value")
            PendingAnswers.objects.create(
                pending_data=pending_data,
                question=question,
                name=name,
                value=value,
                options=option,
                created_by=user,
            )
        return Response(
            {"message": "store to pending data success"},
            status=status.HTTP_200_OK,
        )


class DataAnswerDetailDeleteView(APIView):
    permission_classes = [PublicGet]

    @extend_schema(
        responses={200: ListDataAnswerSerializer(many=True)},
        tags=["Data"],
        summary="To get answers for form data",
    )
    def get(self, request, data_id, version):
        data = get_object_or_404(FormData, pk=data_id)
        return Response(
            ListDataAnswerSerializer(
                instance=data.data_answer.all(), many=True
            ).data,
            status=status.HTTP_200_OK,
        )

    @extend_schema(
        responses={
            204: OpenApiResponse(description="Deletion with no response")
        },
        tags=["Data"],
        summary="Delete datapoint include answer & history",
    )
    def delete(self, request, data_id, version):
        instance = get_object_or_404(FormData, pk=data_id)
        answers = Answers.objects.filter(data_id=data_id)
        answers.delete()
        history = AnswerHistory.objects.filter(data_id=data_id)
        if history.count():
            history.delete()
        instance.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


@extend_schema(
    responses={200: ListMapDataPointSerializer(many=True)},
    parameters=[
        OpenApiParameter(
            name="shape",
            required=True,
            type=OpenApiTypes.NUMBER,
            location=OpenApiParameter.QUERY,
        ),
        OpenApiParameter(
            name="marker",
            required=False,
            type=OpenApiTypes.NUMBER,
            location=OpenApiParameter.QUERY,
        ),
        OpenApiParameter(
            name="options",
            required=False,
            type={"type": "array", "items": {"type": "string"}},
            location=OpenApiParameter.QUERY,
        ),
    ],
    tags=["Visualisation"],
    summary="To get Map data points",
)
@api_view(["GET"])
@permission_classes([IsAuthenticated])
def get_map_data_point(request, version, form_id):
    instance = get_object_or_404(Forms, pk=form_id)
    serializer = ListMapDataPointRequestSerializer(
        data=request.GET, context={"form": instance}
    )
    if not serializer.is_valid():
        return Response(
            {"message": validate_serializers_message(serializer.errors)},
            status=status.HTTP_400_BAD_REQUEST,
        )

    form_data = instance.form_form_data
    if request.GET.getlist("options"):
        data_ids = get_advance_filter_data_ids(
            form_id=form_id,
            administration_id=None,
            options=request.GET.getlist("options"),
        )
        form_data = form_data.filter(pk__in=data_ids)

    return Response(
        ListMapDataPointSerializer(
            instance=form_data.all(),
            context={
                "shape": serializer.validated_data.get("shape"),
                "marker": serializer.validated_data.get("marker"),
            },
            many=True,
        ).data,
        status=status.HTTP_200_OK,
    )


# TODO: MERGE WITH GET MAP DATA POINT
@extend_schema(
    responses={
        (200, "application/json"): inline_serializer(
            "ListMapOverviewData",
            fields={
                "loc": serializers.CharField(),
                "shape": serializers.IntegerField(),
            },
            many=True,
        )
    },
    parameters=[
        OpenApiParameter(
            name="shape",
            required=True,
            type=OpenApiTypes.NUMBER,
            location=OpenApiParameter.QUERY,
        ),
        OpenApiParameter(
            name="options",
            required=False,
            type={"type": "array", "items": {"type": "string"}},
            location=OpenApiParameter.QUERY,
        ),
    ],
    tags=["Visualisation"],
    summary="To get overview Map data points",
)
@api_view(["GET"])
def get_map_county_data_point(request, version, form_id):
    options_query = request.GET.getlist("options")
    cache_name = request.GET.get("shape")
    cache_name = f"ovw_maps-{cache_name}"
    cache_data = get_cache(cache_name)
    if cache_data and not options_query:
        return Response(cache_data, status=status.HTTP_200_OK)
    instance = get_object_or_404(Forms, pk=form_id)
    serializer = ListMapOverviewDataPointRequestSerializer(
        data=request.GET, context={"form": instance}
    )
    if not serializer.is_valid():
        return Response(
            {"message": validate_serializers_message(serializer.errors)},
            status=status.HTTP_400_BAD_REQUEST,
        )
    administrations = Administration.objects.filter(level_id=2).values(
        "id", "name"
    )
    counties = []
    form_data = instance.form_form_data
    if options_query:
        data_ids = get_advance_filter_data_ids(
            form_id=form_id, administration_id=None, options=options_query
        )
        form_data = form_data.filter(pk__in=data_ids)
    data = ListMapOverviewDataPointSerializer(
        instance=form_data.all(),
        context={
            "shape": serializer.validated_data.get("shape"),
            "marker": serializer.validated_data.get("marker"),
        },
        many=True,
    ).data
    for adm in administrations:
        level3 = Administration.objects.filter(
            parent_id=adm.get("id")
        ).values_list("id", flat=True)
        childs = Administration.objects.filter(
            parent_id__in=list(level3)
        ).values_list("id", flat=True)
        filtered = filter(
            lambda d: d.get("administration_id") in list(childs), data
        )
        counties.append(
            {
                "loc": adm.get("name"),
                "shape": sum(fl.get("shape") for fl in list(filtered)),
            }
        )
    create_cache(cache_name, counties)
    return Response(counties, status=status.HTTP_200_OK)


@extend_schema(
    responses={200: ChartDataSerializer},
    parameters=[
        OpenApiParameter(
            name="question",
            required=True,
            type=OpenApiTypes.NUMBER,
            location=OpenApiParameter.QUERY,
        ),
        OpenApiParameter(
            name="stack",
            required=False,
            type=OpenApiTypes.NUMBER,
            location=OpenApiParameter.QUERY,
        ),
        OpenApiParameter(
            name="options",
            required=False,
            type={"type": "array", "items": {"type": "string"}},
            location=OpenApiParameter.QUERY,
        ),
    ],
    tags=["Visualisation"],
    summary="To get Chart data points",
)
@api_view(["GET"])
@permission_classes([IsAuthenticated])
def get_chart_data_point(request, version, form_id):
    instance = get_object_or_404(Forms, pk=form_id)
    serializer = ListChartDataPointRequestSerializer(
        data=request.GET, context={"form": instance}
    )
    if not serializer.is_valid():
        return Response(
            {"message": validate_serializers_message(serializer.errors)},
            status=status.HTTP_400_BAD_REQUEST,
        )

    question = serializer.validated_data.get("question")
    stack = serializer.validated_data.get("stack")
    # Advance filter
    data_ids = None
    if request.GET.getlist("options"):
        data_ids = get_advance_filter_data_ids(
            form_id=form_id,
            administration_id=None,
            options=request.GET.getlist("options"),
        )
    # with stack
    if stack:
        data = []
        stack_options = stack.options.all()
        answers = Answers.objects
        if data_ids:
            answers = answers.filter(data_id__in=data_ids)
        for so in stack_options:
            query_set = (
                answers.filter(question=stack, options__contains=so.value)
                .values("options")
                .annotate(
                    ids=StringAgg(
                        Cast("data_id", TextField()),
                        delimiter=",",
                        output_field=TextField(),
                    )
                )
            )
            # temp values
            values = {"group": so.value, "child": []}
            # get child
            for val in query_set:
                child_query_set = answers.filter(
                    data_id__in=val.get("ids").split(","), question=question
                )
                # Option type
                if question.type == QuestionTypes.option:
                    child_query_set = child_query_set.values(
                        "options"
                    ).annotate(c=Count("options"))
                    for child in child_query_set:
                        values.get("child").append(
                            {
                                "name": child.get("options")[0],
                                "value": child.get("c"),
                            }
                        )
                # Number type
                if question.type == QuestionTypes.number:
                    child_query_set = child_query_set.values("value")
                    for child in child_query_set:
                        values.get("child").append(
                            {"name": "value", "value": child.get("value")}
                        )
                # Multiple option type
                if question.type == QuestionTypes.multiple_option:
                    multiple_options = question.options.all()
                    for mo in multiple_options:
                        count = child_query_set.filter(
                            options__contains=mo.value
                        ).count()
                        values.get("child").append(
                            {"name": mo.value, "value": count}
                        )
            data.append(values)
            del values

        return Response(
            {"type": "BARSTACK", "data": data}, status=status.HTTP_200_OK
        )

    return Response(
        {
            "type": "PIE",
            "data": ListChartQuestionDataPointSerializer(
                instance=question.options.all(),
                context={"data_ids": data_ids},
                many=True,
            ).data,
        },
        status=status.HTTP_200_OK,
    )


@extend_schema(
    responses={200: ChartDataSerializer},
    parameters=[
        OpenApiParameter(
            name="question",
            required=True,
            type=OpenApiTypes.NUMBER,
            location=OpenApiParameter.QUERY,
        ),
        OpenApiParameter(
            name="administration",
            required=True,
            type=OpenApiTypes.NUMBER,
            location=OpenApiParameter.QUERY,
        ),
        OpenApiParameter(
            name="options",
            required=False,
            type={"type": "array", "items": {"type": "string"}},
            location=OpenApiParameter.QUERY,
        ),
    ],
    tags=["Visualisation"],
    summary="To get Chart administration",
)
@api_view(["GET"])
@permission_classes([IsAuthenticated])
def get_chart_administration(request, version, form_id):
    instance = get_object_or_404(Forms, pk=form_id)
    serializer = ListChartAdministrationRequestSerializer(
        data=request.GET, context={"form": instance}
    )
    if not serializer.is_valid():
        return Response(
            {"message": validate_serializers_message(serializer.errors)},
            status=status.HTTP_400_BAD_REQUEST,
        )
    administration = Administration.objects.filter(
        id=request.GET.get("administration")
    ).first()
    max_level = Levels.objects.order_by("-level").first()
    childs = Administration.objects.filter(parent=administration).all()
    if administration.level.level == max_level.level:
        childs = [administration]
    data = []
    form_data = FormData.objects
    # Advance filter
    data_ids = None
    if request.GET.getlist("options"):
        data_ids = get_advance_filter_data_ids(
            form_id=form_id,
            administration_id=request.GET.get("administration"),
            options=request.GET.getlist("options"),
        )
        form_data = form_data.filter(id__in=data_ids)
    for child in childs:
        values = {"group": child.name, "child": []}
        filter_path = child.path
        if child.level.level < max_level.level:
            filter_path = "{0}{1}.".format(child.path, child.id)
        administration_ids = list(
            Administration.objects.filter(
                path__startswith=filter_path
            ).values_list("id", flat=True)
        )
        data_ids = list(
            form_data.filter(
                form_id=form_id, administration_id__in=administration_ids
            ).values_list("id", flat=True)
        )
        query_set = (
            Answers.objects.filter(
                data_id__in=data_ids,
                question=serializer.validated_data.get("question"),
            )
            .values("options")
            .annotate(
                c=Count("options"),
                ids=StringAgg(
                    Cast("data_id", TextField()),
                    delimiter=",",
                    output_field=TextField(),
                ),
            )
        )
        for val in query_set:
            values.get("child").append(
                {"name": val.get("options")[0], "value": val.get("c")}
            )
        data.append(values)
        del values

    return Response(
        {"type": "BARSTACK", "data": data}, status=status.HTTP_200_OK
    )


@extend_schema(
    request=ListChartCriteriaRequestSerializer(many=True),
    responses={200: ChartDataSerializer},
    parameters=[
        OpenApiParameter(
            name="cache",
            default="test",
            required=False,
            type=OpenApiTypes.STR,
            location=OpenApiParameter.QUERY,
        ),
        OpenApiParameter(
            name="administration",
            default=1,
            required=False,
            type=OpenApiTypes.NUMBER,
            location=OpenApiParameter.QUERY,
        ),
        OpenApiParameter(
            name="options",
            required=False,
            type={"type": "array", "items": {"type": "string"}},
            location=OpenApiParameter.QUERY,
        ),
    ],
    tags=["Visualisation"],
    summary="To get Chart by a criteria (e.g JMP)",
)
@api_view(["POST"])
def get_chart_criteria(request, version, form_id):
    cache_name = request.GET.get("cache")
    category_name = None
    if cache_name:
        category_name = cache_name.replace("-", " ")
        cache_name = f"{form_id}-{cache_name}"
        cache_data = get_cache(cache_name)
        if cache_data:
            return Response(cache_data, status=status.HTTP_200_OK)
    # JMP Criteria
    criteria = get_jmp_config_by_form(form=form_id)
    criteria = list(filter(lambda c: c["name"] == category_name, criteria))
    labels = criteria[0]["labels"] if len(criteria) else []
    administration = request.GET.get("administration")
    if not administration:
        administration = 1
    instance = get_object_or_404(Forms, pk=form_id)
    administration = get_object_or_404(Administration, pk=administration)
    serializer = ListChartCriteriaRequestSerializer(
        data=request.data, context={"form": instance}, many=True
    )
    if not serializer.is_valid():
        return Response(
            {"message": validate_serializers_message(serializer.errors)},
            status=status.HTTP_400_BAD_REQUEST,
        )
    max_level = Levels.objects.order_by("-level").first()
    childs = Administration.objects.filter(parent=administration).all()
    if administration.level.level == max_level.level:
        childs = [administration]
    data = []
    for child in childs:
        data_ids = list(
            FormData.objects.filter(
                form_id=form_id,
                administration_id=child.id,
            ).values_list("id", flat=True)
        )
        categories = DataCategory.objects.filter(
            form_id=form_id,
            data_id__in=data_ids,
        )
        categories = get_category_results(categories)
        jmp = []
        for label in labels:
            matched = list(
                filter(
                    lambda c: (
                        c["category"][category_name] == label["name"]
                        if category_name in c["category"]
                        else False
                    ),
                    categories,
                )
            )
            subtotal = len(matched)
            jmp.append({"name": label["name"], "value": subtotal})
        values = {"group": child.name, "child": jmp}
        data.append(values)
    resp = {"type": "BARSTACK", "data": data}
    if cache_name:
        create_cache(f"{form_id}-{cache_name}", resp)
    del data
    return Response(resp, status=status.HTTP_200_OK)


@extend_schema(
    responses={
        (200, "application/json"): inline_serializer(
            "PendingDataBatchResponse",
            fields={
                "current": serializers.IntegerField(),
                "total": serializers.IntegerField(),
                "total_page": serializers.IntegerField(),
                "batch": ListPendingDataBatchSerializer(many=True),
            },
        )
    },
    tags=["Pending Data"],
    parameters=[
        OpenApiParameter(
            name="page",
            required=True,
            type=OpenApiTypes.NUMBER,
            location=OpenApiParameter.QUERY,
        ),
        OpenApiParameter(
            name="approved",
            required=False,
            default=False,
            type=OpenApiTypes.BOOL,
            location=OpenApiParameter.QUERY,
        ),
        OpenApiParameter(
            name="subordinate",
            required=False,
            default=False,
            type=OpenApiTypes.BOOL,
            location=OpenApiParameter.QUERY,
        ),
    ],
    summary="To get list of pending batch",
)
@api_view(["GET"])
@permission_classes([IsAuthenticated, IsApprover | IsAdmin | IsSuperAdmin])
def list_pending_batch(request, version):
    serializer = PendingBatchDataFilterSerializer(data=request.GET)
    if not serializer.is_valid():
        return Response(
            {"message": validate_serializers_message(serializer.errors)},
            status=status.HTTP_400_BAD_REQUEST,
        )
    user: SystemUser = request.user
    page_size = REST_FRAMEWORK.get("PAGE_SIZE")

    subordinate = serializer.validated_data.get("subordinate")
    approved = serializer.validated_data.get("approved")
    queryset = ViewPendingDataApproval.objects.filter(user_id=user.id)
    rejected = ViewPendingDataApproval.objects.filter(
        batch_id__in=queryset.values_list("batch_id", flat=True),
        status=DataApprovalStatus.rejected,
    )
    if approved:
        queryset = queryset.filter(
            status=DataApprovalStatus.approved,
        )
        queryset = queryset.exclude(
            batch_id__in=rejected.values_list("batch_id", flat=True)
        )
    else:
        rejected_by_current_user = ViewPendingDataApproval.objects.filter(
            status=DataApprovalStatus.rejected, user=user
        )
        if subordinate:
            queryset = queryset.filter(
                level_id__lt=F("pending_level"), batch__approved=False
            )
            queryset = queryset.union(
                rejected_by_current_user.values_list("batch_id", flat=True)
            )
        else:
            queryset = queryset.filter(
                level_id=F("pending_level"), batch__approved=False
            )
            queryset = queryset.exclude(
                batch_id__in=rejected_by_current_user.values_list(
                    "batch_id", flat=True
                )
            )
            rejected = rejected.exclude(
                batch_id__in=rejected_by_current_user.values_list(
                    "batch_id", flat=True
                )
            )
            queryset = queryset.union(
                rejected.values_list("batch_id", flat=True)
            )
    queryset = queryset.values_list("batch_id", flat=True).order_by("-id")

    paginator = PageNumberPagination()
    instance = paginator.paginate_queryset(queryset, request)

    values = PendingDataBatch.objects.filter(id__in=list(instance)).order_by(
        "-created"
    )

    data = {
        "current": int(request.GET.get("page", "1")),
        "total": queryset.count(),
        "total_page": ceil(queryset.count() / page_size),
        "batch": ListPendingDataBatchSerializer(
            instance=values,
            context={
                "user": user,
                "approved": approved,
                "subordinate": subordinate,
            },
            many=True,
        ).data,
    }
    return Response(data, status=status.HTTP_200_OK)


@extend_schema(
    responses={200: ListPendingFormDataSerializer(many=True)},
    tags=["Pending Data"],
    summary="To get list of pending data by batch",
)
@api_view(["GET"])
@permission_classes(
    [IsAuthenticated, IsSuperAdmin | IsAdmin | IsApprover | IsSubmitter]
)
def list_pending_data_batch(request, version, batch_id):
    batch = get_object_or_404(PendingDataBatch, pk=batch_id)
    return Response(
        ListPendingFormDataSerializer(
            instance=batch.batch_pending_data_batch.all(), many=True
        ).data,
        status=status.HTTP_200_OK,
    )


class PendingDataDetailDeleteView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(
        responses={200: ListPendingDataAnswerSerializer(many=True)},
        tags=["Pending Data"],
        summary="To get list of answers for pending data",
    )
    def get(self, request, pending_data_id, version):
        data = get_object_or_404(PendingFormData, pk=pending_data_id)
        last_data = (
            FormData.objects.filter(uuid=data.uuid)
            .order_by("-created")
            .first()
        )
        return Response(
            ListPendingDataAnswerSerializer(
                context={"last_data": last_data},
                instance=data.pending_data_answer.all(),
                many=True,
            ).data,
            status=status.HTTP_200_OK,
        )

    @extend_schema(
        responses={
            204: OpenApiResponse(description="Deletion with no response")
        },
        tags=["Pending Data"],
        summary="To delete pending data",
    )
    def delete(self, request, pending_data_id, version):
        instance = get_object_or_404(PendingFormData, pk=pending_data_id)
        if instance.created_by_id != request.user.id:
            return Response(
                {"message": "You are not allowed to perform this action"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        instance.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


@extend_schema(
    request=ApprovePendingDataRequestSerializer(),
    responses={200: DefaultResponseSerializer},
    tags=["Pending Data"],
    summary="Approve pending data",
)
@api_view(["POST"])
@permission_classes([IsAuthenticated, IsApprover | IsAdmin | IsSuperAdmin])
def approve_pending_data(request, version):
    serializer = ApprovePendingDataRequestSerializer(
        data=request.data, context={"user": request.user}
    )
    if not serializer.is_valid():
        return Response(
            {"message": validate_serializers_message(serializer.errors)},
            status=status.HTTP_400_BAD_REQUEST,
        )
    serializer.save()
    return Response({"message": "Ok"}, status=status.HTTP_200_OK)


class BatchView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(
        responses={
            (200, "application/json"): inline_serializer(
                "ListDataBatchResponse",
                fields={
                    "current": serializers.IntegerField(),
                    "total": serializers.IntegerField(),
                    "total_page": serializers.IntegerField(),
                    "data": ListBatchSerializer(many=True),
                },
            )
        },
        tags=["Pending Data"],
        summary="To get list of batch",
        parameters=[
            OpenApiParameter(
                name="page",
                required=True,
                type=OpenApiTypes.NUMBER,
                location=OpenApiParameter.QUERY,
            ),
            OpenApiParameter(
                name="form",
                required=False,
                type=OpenApiTypes.NUMBER,
                location=OpenApiParameter.QUERY,
            ),
            OpenApiParameter(
                name="approved",
                default=False,
                type=OpenApiTypes.BOOL,
                location=OpenApiParameter.QUERY,
            ),
        ],
    )
    def get(self, request, version):
        serializer = BatchListRequestSerializer(data=request.GET)
        if not serializer.is_valid():
            return Response(
                {"message": validate_serializers_message(serializer.errors)},
                status=status.HTTP_400_BAD_REQUEST,
            )
        queryset = PendingDataBatch.objects.filter(
            user=request.user,
            approved=serializer.validated_data.get("approved"),
        ).order_by("-id")
        form_id = serializer.validated_data.get("form")
        if form_id:
            queryset = queryset.filter(form_id=form_id)
        paginator = PageNumberPagination()
        instance = paginator.paginate_queryset(queryset, request)
        page_size = REST_FRAMEWORK.get("PAGE_SIZE")
        data = {
            "current": int(request.GET.get("page", "1")),
            "total": queryset.count(),
            "total_page": ceil(queryset.count() / page_size),
            "data": ListBatchSerializer(instance=instance, many=True).data,
        }
        return Response(data, status=status.HTTP_200_OK)

    @extend_schema(
        request=CreateBatchSerializer(),
        tags=["Pending Data"],
        summary="To create batch",
    )
    def post(self, request, version):
        serializer = CreateBatchSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(
                {"message": validate_serializers_message(serializer.errors)},
                status=status.HTTP_400_BAD_REQUEST,
            )
        serializer.save(user=request.user)
        return Response(
            {"message": "Data updated successfully"}, status=status.HTTP_200_OK
        )


class BatchSummaryView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(
        responses={200: ListBatchSummarySerializer(many=True)},
        tags=["Pending Data"],
        summary="To get batch summary",
    )
    def get(self, request, batch_id, version):
        batch = get_object_or_404(PendingDataBatch, pk=batch_id)
        instance = PendingAnswers.objects.filter(
            pending_data__batch_id=batch.id,
            question__type__in=[
                QuestionTypes.option,
                QuestionTypes.multiple_option,
            ],
        ).distinct("question")
        return Response(
            ListBatchSummarySerializer(
                instance=instance, many=True, context={"batch": batch}
            ).data,
            status=status.HTTP_200_OK,
        )


class BatchCommentView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(
        responses={200: ListBatchCommentSerializer(many=True)},
        tags=["Pending Data"],
        summary="To get batch comment",
    )
    def get(self, request, batch_id, version):
        batch = get_object_or_404(PendingDataBatch, pk=batch_id)
        instance = batch.batch_batch_comment.all().order_by("-id")
        return Response(
            ListBatchCommentSerializer(instance=instance, many=True).data,
            status=status.HTTP_200_OK,
        )


@extend_schema(tags=["File"], summary="Export Form data")
@api_view(["GET"])
@permission_classes([IsAuthenticated])
def export_form_data(request, version, form_id):
    form = get_object_or_404(Forms, pk=form_id)
    form_name = form.name
    filename = f"{form.id}-{form_name}"
    directory = "tmp"
    pathlib.Path(directory).mkdir(parents=True, exist_ok=True)
    filepath = f"./{directory}/{filename}.xlsx"
    if os.path.exists(filepath):
        os.remove(filepath)
    writer = pd.ExcelWriter(filepath, engine="xlsxwriter")
    blank_data_template(form=form, writer=writer)
    writer.save()
    filename = filepath.split("/")[-1].replace(" ", "-")
    zip_file = open(filepath, "rb")
    response = HttpResponse(
        FileWrapper(zip_file),
        content_type="application/vnd.openxmlformats-officedocument"
        ".spreadsheetml.sheet",
    )
    response["Content-Disposition"] = 'attachment; filename="%s"' % filename
    return response


class PendingFormDataView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(
        request=SubmitPendingFormSerializer,
        responses={200: DefaultResponseSerializer},
        tags=["Pending Data"],
        summary="Submit pending form data",
    )
    def post(self, request, form_id, version):
        form = get_object_or_404(Forms, pk=form_id)
        serializer = SubmitPendingFormSerializer(
            data=request.data, context={"user": request.user, "form": form}
        )
        if not serializer.is_valid():
            return Response(
                {
                    "message": validate_serializers_message(serializer.errors),
                    "details": serializer.errors,
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        serializer.save()
        return Response({"message": "ok"}, status=status.HTTP_200_OK)

    @extend_schema(
        responses={
            (200, "application/json"): inline_serializer(
                "PendingDataListResponse",
                fields={
                    "current": serializers.IntegerField(),
                    "total": serializers.IntegerField(),
                    "total_page": serializers.IntegerField(),
                    "data": ListPendingFormDataSerializer(many=True),
                },
            )
        },
        tags=["Pending Data"],
        parameters=[
            OpenApiParameter(
                name="page",
                required=True,
                type=OpenApiTypes.NUMBER,
                location=OpenApiParameter.QUERY,
            )
        ],
        summary="To get list of pending form data",
    )
    def get(self, request, form_id, version):
        form = get_object_or_404(Forms, pk=form_id)
        serializer = ListFormDataRequestSerializer(data=request.GET)
        if not serializer.is_valid():
            return Response(
                {"message": validate_serializers_message(serializer.errors)},
                status=status.HTTP_400_BAD_REQUEST,
            )

        page_size = REST_FRAMEWORK.get("PAGE_SIZE")

        queryset = form.pending_form_form_data.filter(
            created_by=request.user, batch__isnull=True
        ).order_by("-created")

        paginator = PageNumberPagination()
        instance = paginator.paginate_queryset(queryset, request)

        data = {
            "current": int(request.GET.get("page", "1")),
            "total": queryset.count(),
            "total_page": ceil(queryset.count() / page_size),
            "data": ListPendingFormDataSerializer(
                instance=instance, many=True
            ).data,
        }
        return Response(data, status=status.HTTP_200_OK)

    @extend_schema(
        request=SubmitFormDataAnswerSerializer(many=True),
        responses={200: DefaultResponseSerializer},
        tags=["Pending Data"],
        parameters=[
            OpenApiParameter(
                name="pending_data_id",
                required=True,
                type=OpenApiTypes.NUMBER,
                location=OpenApiParameter.QUERY,
            )
        ],
        summary="Edit pending form data",
    )
    def put(self, request, form_id, version):
        get_object_or_404(Forms, pk=form_id)
        pending_data_id = request.GET["pending_data_id"]
        user = request.user
        pending_data = get_object_or_404(PendingFormData, pk=pending_data_id)
        serializer = SubmitFormDataAnswerSerializer(
            data=request.data, many=True
        )
        if not serializer.is_valid():
            return Response(
                {
                    "message": validate_serializers_message(serializer.errors),
                    "details": serializer.errors,
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        pending_answers = request.data
        # move current pending_answer to pending_answer_history
        for answer in pending_answers:
            pending_form_answer = PendingAnswers.objects.get(
                pending_data=pending_data, question=answer.get("question")
            )
            PendingAnswerHistory.objects.create(
                pending_data=pending_form_answer.pending_data,
                question=pending_form_answer.question,
                name=pending_form_answer.name,
                value=pending_form_answer.value,
                options=pending_form_answer.options,
                created_by=user,
            )
            # prepare updated answer
            question_id = answer.get("question")
            question = Questions.objects.get(id=question_id)
            name = None
            value = None
            option = None
            if question.type in [
                QuestionTypes.geo,
                QuestionTypes.option,
                QuestionTypes.multiple_option,
            ]:
                option = answer.get("value")
            elif question.type in [
                QuestionTypes.text,
                QuestionTypes.photo,
                QuestionTypes.date,
            ]:
                name = answer.get("value")
            else:
                # for administration,number question type
                value = answer.get("value")
            # Update answer
            pending_form_answer.pending_data = pending_data
            pending_form_answer.question = question
            pending_form_answer.name = name
            pending_form_answer.value = value
            pending_form_answer.options = option
            pending_form_answer.updated = timezone.now()
            pending_form_answer.save()
        # update datapoint
        pending_data.updated = timezone.now()
        pending_data.updated_by = user
        pending_data.save()

        # if pending_data updated already has batch,
        # update reject status into pending
        if pending_data.batch:
            approvals = PendingDataApproval.objects.filter(
                batch=pending_data.batch
            ).all()
            # change approval status to pending
            for approval in approvals:
                approval.status = DataApprovalStatus.pending
                approval.save()
        return Response(
            {"message": "update success"}, status=status.HTTP_200_OK
        )


@extend_schema(
    responses={
        (200, "application/json"): inline_serializer(
            "GetLastUpdate",
            fields={
                "last_update": serializers.CharField(),
            },
        )
    },
    tags=["Visualisation"],
    summary="To get datapoint last updated by form id",
)
@api_view(["GET"])
def get_last_update_data_point(request, version, form_id):
    form = get_object_or_404(Forms, pk=form_id)
    data = FormData.objects.filter(form=form)
    if not data.exists():
        return Response(
            {"last_update": datetime.now().strftime("%d/%m/%Y")},
            status=status.HTTP_200_OK,
        )
    data = data.annotate(last_update=Coalesce("updated", "created")).latest(
        "last_update"
    )
    last_update = datetime.strftime(data.last_update, "%d/%m/%Y")
    return Response({"last_update": last_update}, status=status.HTTP_200_OK)


@extend_schema(
    responses={
        (200, "application/json"): inline_serializer(
            "ListJMPData",
            fields={
                "loc": serializers.CharField(),
                "data": OpenApiTypes.ANY,
                "total": serializers.IntegerField(),
            },
            many=True,
        )
    },
    examples=[
        OpenApiExample(
            "ListJMPDataExample",
            value=[
                {
                    "loc": "Baringo",
                    "data": {
                        "drinking water service level": {
                            "basic": 10,
                            "limited": 20,
                        }
                    },
                    "total": 30,
                }
            ],
        )
    ],
    parameters=[
        OpenApiParameter(
            name="administration",
            required=False,
            type=OpenApiTypes.NUMBER,
            location=OpenApiParameter.QUERY,
        ),
        OpenApiParameter(
            name="options",
            required=False,
            type={"type": "array", "items": {"type": "string"}},
            location=OpenApiParameter.QUERY,
        ),
        OpenApiParameter(
            name="sum",
            required=False,
            type={"type": "array", "items": {"type": "number"}},
            location=OpenApiParameter.QUERY,
        ),
        OpenApiParameter(
            name="avg",
            required=False,
            type={"type": "array", "items": {"type": "number"}},
            location=OpenApiParameter.QUERY,
        ),
    ],
    tags=["JMP"],
    summary="To get JMP data by location",
)
@api_view(["GET"])
def get_jmp_data(request, version, form_id):
    form = get_object_or_404(Forms, pk=form_id)
    administration = request.GET.get("administration")
    adm_filter = get_object_or_404(Administration, pk=administration)
    if not administration:
        administration = 1
    # Advance filter
    options = request.GET.getlist("options")
    data_ids = None
    if options:
        data_ids = get_advance_filter_data_ids(
            form_id=form_id, administration_id=administration, options=options
        )
    # Check administration filter level
    administration_obj = Administration.objects
    if adm_filter.level_id < 4:
        administration = administration_obj.filter(parent_id=administration)
    else:
        administration = administration_obj.filter(pk=adm_filter.pk)
    administration = administration.all()
    jmp_data = []
    # JMP Criteria
    criteria = get_jmp_config_by_form(form=form_id)

    # Custom Criteria (SUM & AVG)
    sums = []
    opts = defaultdict(dict)
    avgs = []
    if request.GET.getlist("avg"):
        avgs = Questions.objects.filter(
            pk__in=request.GET.getlist("avg")
        ).all()
    if request.GET.getlist("sum"):
        sums = Questions.objects.filter(
            pk__in=request.GET.getlist("sum")
        ).all()
        for q in sums:
            if q.type in [QuestionTypes.option, QuestionTypes.multiple_option]:
                opts[q.id] = list(
                    q.options.order_by("order").values_list("name", flat=True)
                )
    for adm in administration:
        temp = defaultdict(dict)
        adm_path = "{0}{1}.".format(adm.path, adm.id)
        # if adm last level
        filter_total = {"form": form}
        if adm.level_id < 4:
            filter_total.update({"administration__path__startswith": adm_path})
        else:
            filter_total.update({"administration": adm})
            adm_path = adm.path  # use parent adm path if adm lowest level/ward
        if data_ids:
            filter_total.update({"pk__in": data_ids})
        dataset = FormData.objects.filter(**filter_total)
        categories = []
        if dataset.count() and len(categories) == 0:
            ids = data_ids if data_ids else [d.id for d in dataset.all()]
            categories = DataCategory.objects.filter(
                form_id=form_id,
                data_id__in=ids,
            )
            categories = get_category_results(categories)
        total = 0
        for crt in criteria:
            for lb in crt["labels"]:
                matched = list(
                    filter(
                        lambda c: (
                            c["category"][crt["name"]] == lb["name"]
                            if crt["name"] in c["category"]
                            else False
                        ),
                        categories,
                    )
                )
                subtotal = len(matched)
                temp[crt["name"]][lb["name"]] = subtotal
                total += subtotal
        for q in avgs:
            answer = (
                Answers.objects.filter(
                    data__administration__path__startswith=adm_path, question=q
                )
                .exclude(value__isnull=True)
                .aggregate(avg=Avg("value"))
            )
            temp["average"][q.id] = answer["avg"]
        for q in sums:
            if not opts.get(q.id):
                answer = (
                    Answers.objects.filter(
                        data__administration__path__startswith=adm_path,
                        question=q,
                    )
                    .exclude(value__isnull=True)
                    .aggregate(sum=Sum("value"))
                )
                temp["sum"][q.id] = answer["sum"]
            else:
                ov = {}
                for o in opts.get(q.id):
                    answer = Answers.objects.filter(
                        data__administration__path__startswith=adm_path,
                        options__contains=o,
                        question=q,
                    ).aggregate(count=Count("id"))
                    ov.update({o: answer["count"]})
                temp["sum"][q.id] = ov
        jmp_data.append({"loc": adm.name, "data": temp, "total": total})
    return Response(jmp_data, status=status.HTTP_200_OK)


@extend_schema(
    responses={
        (200, "application/json"): inline_serializer(
            "Submission Period",
            fields={
                "name": serializers.CharField(),
                "value": serializers.IntegerField(),
                "total": serializers.IntegerField(),
            },
            many=True,
        )
    },
    examples=[
        OpenApiExample(
            "SubmissionPeriodExample",
            value=[
                {
                    "name": "2020 Jan",
                    "value": 50,
                    "total": 50,
                    "jmp": [
                        {
                            "drinking water service level": {
                                "basic": 10,
                                "limited": 20,
                            }
                        }
                    ],
                },
                {
                    "name": "2020 Jan",
                    "value": 50,
                    "total": 100,
                    "jmp": [
                        {
                            "drinking water service level": {
                                "basic": 10,
                                "limited": 20,
                            }
                        }
                    ],
                },
            ],
        )
    ],
    parameters=[
        OpenApiParameter(
            name="administration",
            required=False,
            type=OpenApiTypes.NUMBER,
            location=OpenApiParameter.QUERY,
        ),
        OpenApiParameter(
            name="options",
            required=False,
            type={"type": "array", "items": {"type": "string"}},
            location=OpenApiParameter.QUERY,
        ),
    ],
    tags=["Visualisation"],
    summary="To get data submission period count",
)
@api_view(["GET"])
def get_period_submission(request, version, form_id):
    form = get_object_or_404(Forms, pk=form_id)
    administration = request.GET.get("administration")
    if not administration:
        administration = 1
    adm = get_object_or_404(Administration, pk=administration)
    # Advanced filter
    data_ids = None
    if request.GET.getlist("options"):
        data_ids = get_advance_filter_data_ids(
            form_id=form_id,
            administration_id=administration,
            options=request.GET.getlist("options"),
        )

    # arbitrary starting dates
    first_fd = FormData.objects.filter(form=form).order_by("created").first()
    if not first_fd:
        return Response([], status.HTTP_200_OK)
    year = first_fd.created.year
    month = first_fd.created.month
    total = 0

    cyear = date.today().year
    cmonth = date.today().month

    adm_path = f"{adm.id}."
    if adm.path:
        adm_path = "{0}{1}.".format(adm.path, adm.id)
    fd = FormData.objects.filter(
        form=form, administration__path__startswith=adm_path
    )
    if data_ids:
        fd = FormData.objects.filter(
            pk__in=data_ids, administration__path__startswith=adm_path
        )

    # JMP Criteria
    criteria = get_jmp_config_by_form(form=form_id)

    data = []
    while year <= cyear:
        while (year < cyear and month <= 12) or (
            year == cyear and month <= cmonth
        ):
            fdp = fd.filter(created__year=year, created__month=month)
            fdp_ids = fdp.values_list("id", flat=True)
            fdp = fdp.aggregate(Count("id"))
            categories = DataCategory.objects.filter(
                form_id=form_id,
                data_id__in=fdp_ids,
            )
            categories = get_category_results(categories)
            jmp_data = defaultdict(dict)
            for crt in criteria:
                # JMP Criteria
                for lb in crt["labels"]:
                    matches_name = f"crt.{form.id}{crt['name']}{lb['name']}"
                    matches = get_cache(matches_name)
                    if not matches:
                        matches = len(
                            list(
                                filter(
                                    lambda c: (
                                        c["category"][crt["name"]]
                                        == lb["name"]
                                    ),
                                    categories,
                                )
                            )
                        )
                        create_cache(matches_name, matches)

                        jmp_data[crt["name"]][lb["name"]] = matches
            month_name = date(1900, month, 1).strftime("%B")
            total += fdp["id__count"]
            data.append(
                {
                    "name": f"{year} {month_name}",
                    "value": fdp["id__count"],
                    "total": total,
                    "jmp": jmp_data,
                }
            )
            month += 1
        month = 1
        year += 1
    return Response(data, status=status.HTTP_200_OK)


@extend_schema(
    responses={
        (200, "application/json"): inline_serializer(
            "ListGlaasData",
            fields={
                "counties": serializers.ListField(),
                "national": serializers.ListField(),
            },
        )
    },
    examples=[
        OpenApiExample(
            "ListGlaasDataExample",
            value=[
                {
                    "counties": [{"loc": "Baringo", "qid": "answer"}],
                    "national": [{"year": "2022", "qid": "answer"}],
                }
            ],
        )
    ],
    parameters=[
        OpenApiParameter(
            name="counties_questions",
            required=True,
            type={"type": "array", "items": {"type": "number"}},
            location=OpenApiParameter.QUERY,
        ),
        OpenApiParameter(
            name="national_questions",
            required=True,
            type={"type": "array", "items": {"type": "number"}},
            location=OpenApiParameter.QUERY,
        ),
        OpenApiParameter(
            name="options",
            required=False,
            type={"type": "array", "items": {"type": "string"}},
            location=OpenApiParameter.QUERY,
        ),
    ],
    tags=["Visualisation"],
    summary="To get Glaas data",
)
@api_view(["GET"])
def get_glaas_data(request, version, form_id):
    form = get_object_or_404(Forms, pk=form_id)
    administration = Administration.objects.filter(level_id=2).all()
    questions = Questions.objects.filter(form=form)
    form_datas = FormData.objects.filter(form=form)

    # get counties data
    counties_questions = questions.filter(
        pk__in=request.GET.getlist("counties_questions")
    ).all()
    counties_data = []
    # Advance filter
    data_ids = None
    if request.GET.getlist("options"):
        data_ids = get_advance_filter_data_ids(
            form_id=form_id,
            administration_id=[adm.id for adm in administration],
            options=request.GET.getlist("options"),
            is_glaas=True,
        )
    for adm in administration:
        # filter form data
        filter_form_data_counties = {"administration_id": adm.id}
        if data_ids:
            filter_form_data_counties.update({"pk__in": data_ids})
        form_data_ids = form_datas.filter(
            **filter_form_data_counties
        ).values_list("id", flat=True)
        if not form_data_ids:
            continue
        temp = {"loc": adm.name}
        temp = transform_glass_answer(
            temp=temp, questions=counties_questions, data_ids=form_data_ids
        )
        counties_data.append(temp)

    # get national data
    administration_id = 1
    national_questions = questions.filter(
        pk__in=request.GET.getlist("national_questions")
    ).all()
    national_data = []
    # Advance filter
    data_ids = None
    if request.GET.getlist("options"):
        data_ids = get_advance_filter_data_ids(
            form_id=form_id,
            administration_id=[administration_id],
            options=request.GET.getlist("options"),
            is_glaas=True,
        )
    # filter form data
    filter_form_data_national = {"administration_id": administration_id}
    if data_ids:
        filter_form_data_national.update({"pk__in": data_ids})
    form_data = form_datas.filter(**filter_form_data_national)
    # arbitrary starting dates
    first_fd = form_data.order_by("created").first()
    if first_fd:
        year = first_fd.created.year
        cyear = date.today().year
        while year <= cyear:
            form_data_ids = form_data.filter(created__year=year).values_list(
                "id", flat=True
            )
            temp = {"year": year}
            temp = transform_glass_answer(
                temp=temp, questions=national_questions, data_ids=form_data_ids
            )
            national_data.append(temp)
            year += 1
    return Response(
        {"counties": counties_data, "national": national_data},
        status=status.HTTP_200_OK,
    )


def get_decendants(administration: Administration):
    path = f"{administration.id}."
    if administration.path:
        path = "{0}{1}.".format(
            administration.path,
            administration.id
        )
    descendants = list(
        Administration.objects.filter(
            path__startswith=path
        ).values_list("id", flat=True)
    )
    descendants.append(administration.id)
    return descendants


@extend_schema(
    responses={
        (200, "application/json"): inline_serializer(
            "DataList",
            fields={
                "current": serializers.IntegerField(),
                "total": serializers.IntegerField(),
                "total_page": serializers.IntegerField(),
                "data": ListFormDataSerializer(many=True),
            },
        )
    },
    tags=["Data"],
    parameters=[
        OpenApiParameter(
            name="page",
            required=True,
            type=OpenApiTypes.NUMBER,
            location=OpenApiParameter.QUERY,
        ),
        OpenApiParameter(
            name="administration",
            required=False,
            type=OpenApiTypes.NUMBER,
            location=OpenApiParameter.QUERY,
        ),
    ],
    summary="To get list of certification data",
)
@api_view(["GET"])
@permission_classes([IsAuthenticated])
def get_certification_data(request, version, form_id):
    form = get_object_or_404(Forms, pk=form_id)
    serializer = ListFormDataRequestSerializer(
        data=request.GET, context={"form_id": form_id}
    )
    if not serializer.is_valid():
        return Response(
            {"message": validate_serializers_message(serializer.errors)},
            status=status.HTTP_400_BAD_REQUEST,
        )

    page_size = REST_FRAMEWORK.get("PAGE_SIZE")
    paginator = PageNumberPagination()

    latest_ids_per_uuid = (
        form.form_form_data.filter(
            submission_type=SubmissionTypes.certification
        )
        .values("uuid")
        .annotate(latest_id=Max("id"))
        .values_list("latest_id", flat=True)
    )
    filter_data = {}
    filter_data["pk__in"] = latest_ids_per_uuid
    filter_data["submission_type"] = SubmissionTypes.certification

    access = request.user.user_access
    user_decendants = get_decendants(administration=access.administration)
    filter_decendants = []
    if serializer.validated_data.get("administration"):
        filter_adm = serializer.validated_data.get(
            "administration"
        )
        filter_decendants = get_decendants(administration=filter_adm)

    filter_adm_key = "created_by__user_access__administration_id__in"
    if access.role != UserRoleTypes.super_admin:
        filter_data[filter_adm_key] = user_decendants
        if len(filter_decendants):
            filter_data[filter_adm_key] = set(filter_decendants) \
                .intersection(user_decendants)

    if access.role == UserRoleTypes.super_admin and len(filter_decendants):
        filter_data["administration_id__in"] = filter_decendants

    queryset = form.form_form_data \
        .filter(**filter_data) \
        .order_by(
            "-created"
        )
    instance = paginator.paginate_queryset(queryset, request)
    data = {
        "current": int(request.GET.get("page", "1")),
        "total": queryset.count(),
        "total_page": ceil(queryset.count() / page_size),
        "data": ListFormDataSerializer(
            instance=instance,
            context={
                "questions": serializer.validated_data.get("questions")
            },
            many=True,
        ).data,
    }
    return Response(data, status=status.HTTP_200_OK)
