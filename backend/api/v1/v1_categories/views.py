import pandas as pd
from io import StringIO
from django.http import Http404
from drf_spectacular.types import OpenApiTypes
from drf_spectacular.utils import (
    extend_schema,
    inline_serializer,
    OpenApiParameter,
)
from django.http import HttpResponse
from rest_framework import serializers, status
from rest_framework.decorators import api_view
from rest_framework.response import Response
from utils.custom_serializer_fields import validate_serializers_message
from utils.custom_pagination import Pagination

from api.v1.v1_categories.functions import get_category_results, get_category
from api.v1.v1_categories.models import DataCategory
from api.v1.v1_data.models import FormData, Answers
from api.v1.v1_forms.models import Questions
from api.v1.v1_categories.serializers import (
    ListRawDataSerializer,
    ListRawDataAnswerSerializer,
    ListCsvDataAnswerSerializer,
)

from api.v1.v1_data.functions import get_cache, create_cache

from api.v1.v1_data.serializers import ListFormDataRequestSerializer


@extend_schema(
    description="""
    Get datapoints with computed category
    """,
    responses={
        (200, "application/json"): inline_serializer(
            "ListDataCategorizedPaginated",
            fields={
                "current": serializers.IntegerField(),
                "total": serializers.IntegerField(),
                "total_page": serializers.IntegerField(),
                "data": inline_serializer(
                    "ListDataCategorized",
                    fields={
                        "id": serializers.IntegerField(),
                        "categories": inline_serializer(
                            "ListDataCategorySerializer",
                            fields={"Sanitation": serializers.CharField()},
                        ),
                    },
                ),
            },
            many=True,
        ),
    },
    parameters=[
        OpenApiParameter(
            name="page",
            required=True,
            type=OpenApiTypes.NUMBER,
            location=OpenApiParameter.QUERY,
        ),
    ],
    tags=["Data Categories"],
    summary="Get datapoints with computed category",
)
@api_view(["GET"])
def get_data_with_category(request, version, form_id):
    queryset = FormData.objects.filter(form_id=form_id).values_list(
        "pk", flat=True
    )
    if not len(queryset):
        raise Http404("DataCategory does not exist")
    paginator = Pagination()
    instance = paginator.paginate_queryset(queryset, request)
    categories = DataCategory.objects.filter(data_id__in=instance)
    results = get_category_results(categories)
    return paginator.get_paginated_response(results)


@extend_schema(
    description="""
    Get Multi-purpose schema of datapoints to use with third party applications
    """,
    responses={200: ListRawDataSerializer(many=True)},
    parameters=[
        OpenApiParameter(
            name="page",
            required=True,
            type=OpenApiTypes.NUMBER,
            location=OpenApiParameter.QUERY,
        ),
        OpenApiParameter(
            name="questions",
            required=False,
            type={"type": "array", "items": {"type": "number"}},
            location=OpenApiParameter.QUERY,
        ),
    ],
    tags=["Data Categories"],
    summary="Get Raw data points",
)
@api_view(["GET"])
# @permission_classes([IsAuthenticated])
def get_raw_data_point(request, version, form_id):
    serializer = ListFormDataRequestSerializer(data=request.GET)
    if not serializer.is_valid():
        return Response(
            {"message": validate_serializers_message(serializer.errors)},
            status=status.HTTP_400_BAD_REQUEST,
        )
    instances = FormData.objects.filter(form_id=form_id).order_by("-created")
    paginator = Pagination()
    page = paginator.paginate_queryset(instances, request)
    data = ListRawDataSerializer(
        instance=page,
        context={"questions": serializer.validated_data.get("questions")},
        many=True,
    ).data
    filter_data = {}
    if request.GET.get("questions"):
        filter_data["question_id__in"] = request.GET.getlist("questions")
    categories = DataCategory.objects.filter(
        form_id=form_id, data_id__in=[d["id"] for d in data]
    ).all()
    categories = get_category_results(categories)
    for d in data:
        category = list(filter(lambda x: x["id"] == d["id"], categories))
        filter_data["data_id"] = d["id"]
        answers = Answers.objects.filter(**filter_data).all()
        answers = ListRawDataAnswerSerializer(instance=answers, many=True).data
        data_answers = {}
        for a in answers:
            data_answers.update({a["question"]: a["value"]})
        if category:
            d.update(
                {"data": data_answers, "categories": category[0]["category"]}
            )
        else:
            d.update({"data": data_answers, "categories": {}})
    return paginator.get_paginated_response(data)


@extend_schema(
    description="""
    Get PowerBI schema of datapoints to use with Power BI
    """,
    parameters=[
        OpenApiParameter(
            name="cache",
            default="test",
            required=False,
            type=OpenApiTypes.STR,
            location=OpenApiParameter.QUERY,
        ),
    ],
    responses={200: ListRawDataSerializer(many=True)},
    tags=["Data Categories"],
    summary="Get Power BI data points",
)
@api_view(["GET"])
# @permission_classes([IsAuthenticated])
def get_power_bi_data(request, version, form_id):
    cache_name = request.GET.get("cache")
    if cache_name:
        cache_name = f"power_bi-{cache_name}"
        cache_data = get_cache(cache_name)
        if cache_data:
            return Response(cache_data, status=status.HTTP_200_OK)
    instances = (
        FormData.objects.filter(form_id=form_id).order_by("-created").all()
    )
    data = ListRawDataSerializer(
        instance=instances,
        many=True,
    ).data
    categories = DataCategory.objects.filter(
        form_id=form_id, data_id__in=[d["id"] for d in data]
    ).all()
    categories = get_category_results(categories)
    for d in data:
        category = list(filter(lambda x: x["id"] == d["id"], categories))
        answers = Answers.objects.filter(data_id=d["id"]).all()
        answers = ListRawDataAnswerSerializer(instance=answers, many=True).data
        data_answers = {}
        for a in answers:
            data_answers.update({a["question"]: a["value"]})
        if category:
            d.update(
                {"data": data_answers, "categories": category[0]["category"]}
            )
        else:
            d.update({"data": data_answers, "categories": {}})
    if cache_name:
        create_cache(cache_name, data)
    return Response(
        data,
        status=status.HTTP_200_OK,
    )


def generate_data(instances):
    for instance in instances:
        data = ListRawDataSerializer(instance=instance).data
        answers = Answers.objects.filter(data_id=data["id"]).all()
        answers = ListCsvDataAnswerSerializer(instance=answers, many=True).data
        data.update({a["question"]: a["value"] for a in answers})
        categories = DataCategory.objects.filter(data_id=data["id"]).all()
        if categories:
            for c in categories:
                category = get_category(c.options)
                if category:
                    data.update({c.name: category})
        yield data


@extend_schema(
    description="""
    Get csv datapoints along with JMP data
    """,
    parameters=[
        OpenApiParameter(
            name="cache",
            default="test",
            required=False,
            type=OpenApiTypes.STR,
            location=OpenApiParameter.QUERY,
        ),
    ],
    tags=["Data Categories"],
    summary="Get csv datapoints along with JMP data",
)
@api_view(["GET"])
# @permission_classes([IsAuthenticated])
def get_raw_csv_data(request, version, form_id):
    cache_name = request.GET.get("cache")
    if cache_name:
        cache_name = f"power_bi-csv-{cache_name}"
        cache_data = get_cache(cache_name)
        if cache_data:
            response = HttpResponse(cache_data, content_type="text/csv")
            response["Content-Disposition"] = 'attachment; filename="data.csv"'
            return response
    instances = (
        FormData.objects.filter(form_id=form_id).order_by("-created").all()
    )
    data = generate_data(instances)
    df = pd.DataFrame(data)
    questions = Questions.objects.filter(form_id=form_id).all()
    column_names = {}
    for question in questions:
        if question.id not in list(df):
            df[f"{question.id}|{question.name}"] = ""
        else:
            column_names.update(
                {question.id: f"{question.id}|{question.name}"}
            )
    df = df.rename(columns=column_names)
    csv_data = StringIO()
    df.to_csv(csv_data, sep=",", index=False)
    csv_text = csv_data.getvalue()
    if cache_name:
        create_cache(cache_name, csv_text)
    response = HttpResponse(csv_text, content_type="text/csv")
    response["Content-Disposition"] = 'attachment; filename="data.csv"'
    return response
