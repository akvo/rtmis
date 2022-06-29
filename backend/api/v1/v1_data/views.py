# Create your views here.
import datetime
from math import ceil
from wsgiref.util import FileWrapper
from django.utils import timezone

from django.contrib.postgres.aggregates import StringAgg
from django.db.models import Count, TextField, Value, F
from django.db.models.functions import Cast, Coalesce
from django.http import HttpResponse
from drf_spectacular.types import OpenApiTypes
from drf_spectacular.utils import extend_schema, inline_serializer, \
    OpenApiParameter, OpenApiResponse
from rest_framework import serializers, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.generics import get_object_or_404
from rest_framework.pagination import PageNumberPagination
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from api.v1.v1_data.constants import DataApprovalStatus
from api.v1.v1_data.models import FormData, Answers, PendingFormData, \
    PendingDataBatch, ViewPendingDataApproval, PendingAnswers, \
    AnswerHistory, ViewDataOptions, PendingAnswerHistory, PendingDataApproval
from api.v1.v1_data.serializers import SubmitFormSerializer, \
    ListFormDataSerializer, ListFormDataRequestSerializer, \
    ListDataAnswerSerializer, ListMapDataPointSerializer, \
    ListMapDataPointRequestSerializer, ListChartDataPointRequestSerializer, \
    ListChartQuestionDataPointSerializer, ListChartOverviewRequestSerializer, \
    ListChartAdministrationRequestSerializer, \
    ListPendingDataAnswerSerializer, \
    ApprovePendingDataRequestSerializer, ListBatchSerializer, \
    CreateBatchSerializer, ListPendingDataBatchSerializer, \
    ListPendingFormDataSerializer, PendingBatchDataFilterSerializer, \
    SubmitPendingFormSerializer, ListBatchSummarySerializer, \
    ListBatchCommentSerializer, BatchListRequestSerializer, \
    SubmitFormDataAnswerSerializer, \
    ChartDataSerializer, ListChartCriteriaRequestSerializer, \
    ListMapOverviewDataPointSerializer, \
    ListMapOverviewDataPointRequestSerializer
from api.v1.v1_forms.constants import QuestionTypes, FormTypes
from api.v1.v1_forms.models import Forms, Questions
from api.v1.v1_profile.models import Administration, Levels
from api.v1.v1_users.models import SystemUser
from api.v1.v1_profile.constants import UserRoleTypes
from rtmis.settings import REST_FRAMEWORK
from utils.custom_permissions import IsAdmin, IsApprover, IsSubmitter
from utils.custom_serializer_fields import validate_serializers_message
from utils.default_serializers import DefaultResponseSerializer
from utils.export_form import generate_excel


class FormDataAddListView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(responses={
        (200, 'application/json'):
            inline_serializer("DataList", fields={
                "current": serializers.IntegerField(),
                "total": serializers.IntegerField(),
                "total_page": serializers.IntegerField(),
                "data": ListFormDataSerializer(many=True),
            })},
        tags=['Data'],
        parameters=[
            OpenApiParameter(name='page',
                             required=True,
                             type=OpenApiTypes.NUMBER,
                             location=OpenApiParameter.QUERY),
            OpenApiParameter(name='administration',
                             required=False,
                             type=OpenApiTypes.NUMBER,
                             location=OpenApiParameter.QUERY),
            OpenApiParameter(name='questions',
                             required=False,
                             type={'type': 'array',
                                   'items': {'type': 'number'}},
                             location=OpenApiParameter.QUERY)],
        summary='To get list of form data')
    def get(self, request, form_id, version):
        form = get_object_or_404(Forms, pk=form_id)
        serializer = ListFormDataRequestSerializer(data=request.GET)
        if not serializer.is_valid():
            return Response(
                {'message': validate_serializers_message(
                    serializer.errors)},
                status=status.HTTP_400_BAD_REQUEST
            )
        filter_data = {}
        if serializer.validated_data.get('administration'):
            filter_administration = serializer.validated_data.get(
                'administration')
            if filter_administration.path:
                filter_path = '{0}{1}.'.format(filter_administration.path,
                                               filter_administration.id)
            else:
                filter_path = f"{filter_administration.id}."
            filter_descendants = list(Administration.objects.filter(
                path__startswith=filter_path).values_list('id', flat=True))
            filter_descendants.append(filter_administration.id)

            filter_data['administration_id__in'] = filter_descendants

        page_size = REST_FRAMEWORK.get('PAGE_SIZE')

        the_past = datetime.datetime.now() - datetime.timedelta(
            days=10 * 365)
        queryset = form.form_form_data.filter(**filter_data).annotate(
            last_updated=Coalesce('updated', Value(the_past))).order_by(
            '-last_updated', '-created')

        paginator = PageNumberPagination()
        instance = paginator.paginate_queryset(queryset, request)
        data = {
            "current": int(request.GET.get('page', '1')),
            "total": queryset.count(),
            "total_page": ceil(queryset.count() / page_size),
            "data": ListFormDataSerializer(
                instance=instance, context={
                    'questions': serializer.validated_data.get(
                        'questions')},
                many=True).data,
        }
        return Response(data, status=status.HTTP_200_OK)

    @extend_schema(request=SubmitFormSerializer,
                   responses={200: DefaultResponseSerializer},
                   tags=['Data'],
                   summary='Submit form data')
    def post(self, request, form_id, version):
        form = get_object_or_404(Forms, pk=form_id)
        serializer = SubmitFormSerializer(data=request.data,
                                          context={'user': request.user,
                                                   'form': form})
        if not serializer.is_valid():
            return Response(
                {'message': validate_serializers_message(
                    serializer.errors),
                    'details': serializer.errors},
                status=status.HTTP_400_BAD_REQUEST
            )

        serializer.save()
        return Response({'message': 'ok'}, status=status.HTTP_200_OK)

    @extend_schema(request=SubmitFormDataAnswerSerializer(many=True),
                   responses={200: DefaultResponseSerializer},
                   tags=['Data'],
                   parameters=[
                       OpenApiParameter(name='data_id',
                                        required=True,
                                        type=OpenApiTypes.NUMBER,
                                        location=OpenApiParameter.QUERY)],
                   summary='Edit form data')
    def put(self, request, form_id, version):
        data_id = request.GET['data_id']
        user = request.user
        user_role = user.user_access.role
        form = get_object_or_404(Forms, pk=form_id)
        data = get_object_or_404(FormData, pk=data_id)
        serializer = SubmitFormDataAnswerSerializer(
            data=request.data, many=True)
        if not serializer.is_valid():
            return Response(
                {'message': validate_serializers_message(
                    serializer.errors),
                    'details': serializer.errors},
                status=status.HTTP_400_BAD_REQUEST
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
                form_answer = Answers.objects.get(
                    data=data, question=answer.get('question'))
                AnswerHistory.objects.create(
                    data=form_answer.data,
                    question=form_answer.question,
                    name=form_answer.name,
                    value=form_answer.value,
                    options=form_answer.options,
                    created_by=user
                )
                # prepare updated answer
                question_id = answer.get('question')
                question = Questions.objects.get(
                    id=question_id)
                name = None
                value = None
                option = None
                if question.type in [
                    QuestionTypes.geo, QuestionTypes.option,
                    QuestionTypes.multiple_option
                ]:
                    option = answer.get('value')
                elif question.type in [
                    QuestionTypes.text, QuestionTypes.photo, QuestionTypes.date
                ]:
                    name = answer.get('value')
                else:
                    # for administration,number question type
                    value = answer.get('value')
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
            return Response({'message': 'direct update success'},
                            status=status.HTTP_200_OK)
        # Store edit data to pending form data
        pending_data = PendingFormData.objects.create(
            name=data.name,
            form=data.form,
            data=data,
            administration=data.administration,
            geo=data.geo,
            batch=None,
            created_by=user
        )
        for answer in answers:
            # store to pending answer
            question_id = answer.get('question')
            question = Questions.objects.get(
                id=question_id)
            name = None
            value = None
            option = None
            if question.type in [
                    QuestionTypes.geo, QuestionTypes.option,
                    QuestionTypes.multiple_option
            ]:
                option = answer.get('value')
            elif question.type in [
                QuestionTypes.text, QuestionTypes.photo, QuestionTypes.date
            ]:
                name = answer.get('value')
            else:
                # for administration,number question type
                value = answer.get('value')
            PendingAnswers.objects.create(
                pending_data=pending_data,
                question=question,
                name=name,
                value=value,
                options=option,
                created_by=user
            )
        return Response({'message': 'store to pending data success'},
                        status=status.HTTP_200_OK)


class DataAnswerDetailDeleteView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(
        responses={200: ListDataAnswerSerializer(many=True)},
        tags=['Data'],
        summary='To get answers for form data')
    def get(self, request, data_id, version):
        data = get_object_or_404(FormData, pk=data_id)
        return Response(
            ListDataAnswerSerializer(
                instance=data.data_answer.all(),
                many=True).data,
            status=status.HTTP_200_OK)

    @extend_schema(
        responses={
            204: OpenApiResponse(description='Deletion with no response')},
        tags=['Data'],
        summary='Delete datapoint include answer & history')
    def delete(self, request, data_id, version):
        instance = get_object_or_404(FormData, pk=data_id)
        answers = Answers.objects.filter(data_id=data_id)
        answers.delete()
        history = AnswerHistory.objects.filter(data_id=data_id)
        if history.count():
            history.delete()
        instance.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


@extend_schema(responses={200: ListMapDataPointSerializer(many=True)},
               parameters=[
                   OpenApiParameter(name='shape',
                                    required=True,
                                    type=OpenApiTypes.NUMBER,
                                    location=OpenApiParameter.QUERY),
                   OpenApiParameter(name='marker',
                                    required=False,
                                    type=OpenApiTypes.NUMBER,
                                    location=OpenApiParameter.QUERY),
               ],
               tags=['Visualisation'],
               summary='To get Map data points')
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_map_data_point(request, version, form_id):
    instance = get_object_or_404(Forms, pk=form_id)
    serializer = ListMapDataPointRequestSerializer(data=request.GET,
                                                   context={
                                                       'form': instance})
    if not serializer.is_valid():
        return Response(
            {'message': validate_serializers_message(serializer.errors)},
            status=status.HTTP_400_BAD_REQUEST
        )
    return Response(
        ListMapDataPointSerializer(
            instance=instance.form_form_data.all(),
            context={
                'shape': serializer.validated_data.get('shape'),
                'marker': serializer.validated_data.get('marker')
            },
            many=True).data,
        status=status.HTTP_200_OK)


@extend_schema(responses={200: ListMapOverviewDataPointSerializer(many=True)},
               parameters=[
                   OpenApiParameter(name='shape',
                                    required=True,
                                    type=OpenApiTypes.NUMBER,
                                    location=OpenApiParameter.QUERY)
                ],
               tags=['Visualisation'],
               summary='To get overview Map data points')
@api_view(['GET'])
def get_map_overview_data_point(request, version, form_id):
    instance = get_object_or_404(Forms, pk=form_id)
    serializer = ListMapOverviewDataPointRequestSerializer(
        data=request.GET, context={'form': instance})
    if not serializer.is_valid():
        return Response(
            {'message': validate_serializers_message(serializer.errors)},
            status=status.HTTP_400_BAD_REQUEST
        )
    administrations = Administration.objects.filter(level_id=2).all()
    counties = []
    data = ListMapOverviewDataPointSerializer(
        instance=instance.form_form_data.all(),
        context={
            'shape': serializer.validated_data.get('shape'),
            'marker': serializer.validated_data.get('marker')
        },
        many=True).data
    for adm in administrations:
        level3 = Administration.objects.filter(parent_id=adm.id).all()
        level3_ids = [lv.id for lv in level3]
        level4 = Administration.objects.filter(parent_id__in=level3_ids).all()
        childs = [lv.id for lv in level4]
        filtered = filter(lambda d: d.get('administration_id') in childs, data)
        counties.append({
            'loc': adm.name,
            'shape': sum(fl.get('shape') for fl in list(filtered))
        })
    return Response(counties, status=status.HTTP_200_OK)


@extend_schema(
        responses={200: ChartDataSerializer},
        parameters=[
            OpenApiParameter(
                name='question',
                required=True,
                type=OpenApiTypes.NUMBER,
                location=OpenApiParameter.QUERY),
            OpenApiParameter(
                name='stack',
                required=False,
                type=OpenApiTypes.NUMBER,
                location=OpenApiParameter.QUERY)],
        tags=['Visualisation'],
        summary='To get Chart data points')
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_chart_data_point(request, version, form_id):
    instance = get_object_or_404(Forms, pk=form_id)
    serializer = ListChartDataPointRequestSerializer(data=request.GET,
                                                     context={
                                                         'form': instance
                                                     })
    if not serializer.is_valid():
        return Response(
            {'message': validate_serializers_message(serializer.errors)},
            status=status.HTTP_400_BAD_REQUEST
        )

    if serializer.validated_data.get('stack'):
        query_set = Answers.objects.filter(
            question=serializer.validated_data.get('stack')).values(
            'options').annotate(c=Count('options'),
                                ids=StringAgg(Cast('data_id', TextField()),
                                              delimiter=',',
                                              output_field=TextField()))
        data = []
        for val in query_set:
            values = {
                'group': val.get('options')[0],
                'child': []
            }

            child_query_set = Answers.objects.filter(
                data_id__in=val.get('ids').split(','),
                question=serializer.validated_data.get('question')).values(
                'options').annotate(c=Count('options'))

            for child in child_query_set:
                values.get('child').append({
                    'name': child.get('options')[0],
                    'value': child.get('c')
                })
            data.append(values)

        return Response({'type': 'BARSTACK', 'data': data},
                        status=status.HTTP_200_OK)

    return Response({'type': 'PIE',
                     'data': ListChartQuestionDataPointSerializer(
                         instance=serializer.validated_data.get(
                             'question').question_question_options.all(),
                         many=True).data},
                    status=status.HTTP_200_OK)


@extend_schema(
        responses={200: ChartDataSerializer},
        parameters=[
            OpenApiParameter(
                name='question',
                required=True,
                type=OpenApiTypes.NUMBER,
                location=OpenApiParameter.QUERY),
            OpenApiParameter(
                name='stack',
                required=False,
                type=OpenApiTypes.NUMBER,
                location=OpenApiParameter.QUERY)],
        tags=['Visualisation'],
        summary='To get overview chart at National level')
@api_view(['GET'])
def get_chart_overview(request, version, form_id):
    instance = get_object_or_404(Forms, pk=form_id)
    serializer = ListChartOverviewRequestSerializer(
        data=request.GET, context={'form': instance})
    if not serializer.is_valid():
        return Response(
            {'message': validate_serializers_message(serializer.errors)},
            status=status.HTTP_400_BAD_REQUEST)

    question = serializer.validated_data.get('question')
    stack = serializer.validated_data.get('stack')
    if stack:
        stack_options = stack.question_question_options.all()
        data = []
        for so in stack_options:
            query_set = Answers.objects.filter(
                question=stack, options__contains=so.name).values(
                    'options').annotate(
                        ids=StringAgg(
                            Cast('data_id', TextField()),
                            delimiter=',',
                            output_field=TextField()))
            # temp values
            values = {
                'group': so.name,
                'child': []
            }
            # get child
            for val in query_set:
                child_query_set = Answers.objects.filter(
                    data_id__in=val.get('ids').split(','),
                    question=question)
                # Option type
                if question.type == QuestionTypes.option:
                    child_query_set = child_query_set.values(
                        'options').annotate(c=Count('options'))
                    for child in child_query_set:
                        values.get('child').append({
                            'name': child.get('options')[0],
                            'value': child.get('c')
                        })
                # Number type
                if question.type == QuestionTypes.number:
                    child_query_set = child_query_set.values('value')
                    for child in child_query_set:
                        values.get('child').append({
                            'name': 'value',
                            'value': child.get('value')
                        })
                # Multiple option type
                if question.type == QuestionTypes.multiple_option:
                    multiple_options = question.question_question_options.all()
                    for mo in multiple_options:
                        count = child_query_set.filter(
                            options__contains=mo.name).count()
                        values.get('child').append({
                            'name': mo.name,
                            'value': count
                        })
            data.append(values)

        return Response({'type': 'BARSTACK', 'data': data},
                        status=status.HTTP_200_OK)

    return Response({
        'type': 'BAR',
        'data': ListChartQuestionDataPointSerializer(
            instance=question.question_question_options.all(),
            many=True).data},
        status=status.HTTP_200_OK)


@extend_schema(
        responses={200: ChartDataSerializer},
        parameters=[
            OpenApiParameter(
                name='question',
                required=True,
                type=OpenApiTypes.NUMBER,
                location=OpenApiParameter.QUERY),
            OpenApiParameter(
                name='administration',
                required=True,
                type=OpenApiTypes.NUMBER,
                location=OpenApiParameter.QUERY)],
        tags=['Visualisation'],
        summary='To get Chart administration')
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_chart_administration(request, version, form_id):
    instance = get_object_or_404(Forms, pk=form_id)
    serializer = ListChartAdministrationRequestSerializer(
            data=request.GET, context={'form': instance})
    if not serializer.is_valid():
        return Response(
            {'message': validate_serializers_message(serializer.errors)},
            status=status.HTTP_400_BAD_REQUEST
        )
    administration = Administration.objects.filter(
            id=request.GET.get('administration')).first()
    max_level = Levels.objects.order_by('-level').first()
    childs = Administration.objects.filter(parent=administration).all()
    if administration.level.level == max_level.level:
        childs = [administration]
    data = []
    for child in childs:
        values = {
            'group': child.name,
            'child': []
        }
        filter_path = child.path
        if child.level.level < max_level.level:
            filter_path = "{0}{1}.".format(child.path, child.id)
        administration_ids = list(
                Administration.objects.filter(
                    path__startswith=filter_path).values_list('id',
                                                              flat=True))
        data_ids = list(FormData.objects.filter(
                form_id=form_id,
                administration_id__in=administration_ids).values_list(
                    'id', flat=True))
        query_set = Answers.objects.filter(
            data_id__in=data_ids,
            question=serializer.validated_data.get('question')).values(
            'options').annotate(c=Count('options'),
                                ids=StringAgg(Cast('data_id', TextField()),
                                              delimiter=',',
                                              output_field=TextField()))
        for val in query_set:
            values.get('child').append({
                'name': val.get('options')[0],
                'value': val.get('c')
            })
        data.append(values)

    return Response({'type': 'BARSTACK', 'data': data},
                    status=status.HTTP_200_OK)


@extend_schema(
    request=ListChartCriteriaRequestSerializer(many=True),
    responses={200: ChartDataSerializer},
    parameters=[OpenApiParameter(
        name='administration',
        required=True,
        type=OpenApiTypes.NUMBER,
        location=OpenApiParameter.QUERY)],
    tags=['Visualisation'],
    summary='To get Chart by a criteria')
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def get_chart_criteria(request, version, form_id):
    administration_id = request.GET.get('administration')
    instance = get_object_or_404(Forms, pk=form_id)
    administration = get_object_or_404(Administration, pk=administration_id)
    serializer = ListChartCriteriaRequestSerializer(
        data=request.data, context={'form': instance}, many=True)
    if not serializer.is_valid():
        return Response(
            {'message': validate_serializers_message(serializer.errors)},
            status=status.HTTP_400_BAD_REQUEST
        )
    params = serializer.validated_data
    max_level = Levels.objects.order_by('-level').first()
    childs = Administration.objects.filter(parent=administration).all()
    if administration.level.level == max_level.level:
        childs = [administration]
    data = []
    for child in childs:
        values = {
            'group': child.name,
            'child': []
        }
        filter_path = child.path
        if child.level.level < max_level.level:
            filter_path = "{0}{1}.".format(child.path, child.id)
        administration_ids = list(Administration.objects.filter(
            path__startswith=filter_path).values_list('id', flat=True))
        data_ids = list(ViewDataOptions.objects.filter(
            form_id=form_id,
            administration_id__in=administration_ids
        ).values_list('data_id', flat=True))
        # loop for post params
        for param in params:
            filter_criteria = []
            for index, option in enumerate(param.get('options')):
                question = option.get('question').id
                ids = filter_criteria if filter_criteria else data_ids
                for opt in option.get('option'):
                    option_contains = []
                    option_contains.append(f"{question}||{opt.lower()}")
                    filter_data = list(
                        ViewDataOptions.objects.filter(
                            data_id__in=ids,
                            options__contains=option_contains
                        ).values_list('data_id', flat=True))
                    if filter_criteria and index > 0:
                        # reset filter_criteria for next question
                        # start from second question criteria
                        # support and filter
                        filter_criteria = []
                    for id in filter_data:
                        if id not in filter_criteria:
                            # append filter_criteria to support or filter
                            filter_criteria.append(id)
            values.get('child').append({
                'name': param.get('name'),
                'value': len(filter_criteria)
            })
        data.append(values)
    return Response({'type': 'BARSTACK', 'data': data},
                    status=status.HTTP_200_OK)


@extend_schema(
    request=ListChartCriteriaRequestSerializer(many=True),
    responses={200: ChartDataSerializer},
    parameters=[OpenApiParameter(
        name='administration',
        default=1,
        required=False,
        type=OpenApiTypes.NUMBER,
        location=OpenApiParameter.QUERY)],
    tags=['Visualisation'],
    summary='To get overview with criteria chart at National level')
@api_view(['POST'])
def get_chart_overview_criteria(request, version, form_id):
    administration_id = 1
    if request.GET.get('administration'):
        administration_id = request.GET.get('administration')
    instance = get_object_or_404(Forms, pk=form_id)
    administration = get_object_or_404(Administration, pk=administration_id)
    serializer = ListChartCriteriaRequestSerializer(
        data=request.data, context={'form': instance}, many=True)
    if not serializer.is_valid():
        return Response(
            {'message': validate_serializers_message(serializer.errors)},
            status=status.HTTP_400_BAD_REQUEST
        )
    params = serializer.validated_data
    max_level = Levels.objects.order_by('-level').first()
    # show only national level
    # childs = Administration.objects.filter(level_id=1).all()
    ###
    childs = Administration.objects.filter(parent=administration).all()
    if administration.level.level == max_level.level:
        childs = [administration]
    data = []
    for child in childs:
        values = {
            'group': child.name,
            'child': []
        }
        # show only national level
        # data_ids = list(ViewDataOptions.objects.filter(
        #     form_id=form_id).values_list('data_id', flat=True))
        ###
        filter_path = child.path
        if child.level.level < max_level.level:
            filter_path = "{0}{1}.".format(child.path, child.id)
        administration_ids = list(Administration.objects.filter(
            path__startswith=filter_path).values_list('id', flat=True))
        data_ids = list(ViewDataOptions.objects.filter(
            form_id=form_id,
            administration_id__in=administration_ids
        ).values_list('data_id', flat=True))
        # loop for post params
        for param in params:
            filter_criteria = []
            for index, option in enumerate(param.get('options')):
                question = option.get('question').id
                ids = filter_criteria if filter_criteria else data_ids
                for opt in option.get('option'):
                    option_contains = []
                    option_contains.append(f"{question}||{opt.lower()}")
                    filter_data = list(
                        ViewDataOptions.objects.filter(
                            data_id__in=ids,
                            options__contains=option_contains
                        ).values_list('data_id', flat=True))
                    if filter_criteria and index > 0:
                        # reset filter_criteria for next question
                        # start from second question criteria
                        # support and filter
                        filter_criteria = []
                    for id in filter_data:
                        if id not in filter_criteria:
                            # append filter_criteria to support or filter
                            filter_criteria.append(id)
            values.get('child').append({
                'name': param.get('name'),
                'value': len(filter_criteria)
            })
        data.append(values)
    return Response({'type': 'BARSTACK', 'data': data},
                    status=status.HTTP_200_OK)


@extend_schema(responses={
    (200, 'application/json'):
        inline_serializer("PendingDataBatchResponse", fields={
            "current": serializers.IntegerField(),
            "total": serializers.IntegerField(),
            "total_page": serializers.IntegerField(),
            "batch": ListPendingDataBatchSerializer(many=True),
        })},
    tags=['Pending Data'],
    parameters=[
        OpenApiParameter(name='page',
                         required=True,
                         type=OpenApiTypes.NUMBER,
                         location=OpenApiParameter.QUERY),
        OpenApiParameter(name='approved',
                         required=False,
                         default=False,
                         type=OpenApiTypes.BOOL,
                         location=OpenApiParameter.QUERY),
        OpenApiParameter(name='subordinate',
                         required=False,
                         default=False,
                         type=OpenApiTypes.BOOL,
                         location=OpenApiParameter.QUERY),
    ],
    summary='To get list of pending batch')
@api_view(['GET'])
@permission_classes([IsAuthenticated, IsAdmin | IsApprover])
def list_pending_batch(request, version):
    serializer = PendingBatchDataFilterSerializer(data=request.GET)
    if not serializer.is_valid():
        return Response(
            {'message': validate_serializers_message(serializer.errors)},
            status=status.HTTP_400_BAD_REQUEST
        )
    user: SystemUser = request.user
    page_size = REST_FRAMEWORK.get('PAGE_SIZE')

    subordinate = serializer.validated_data.get('subordinate')
    approved = serializer.validated_data.get('approved')
    queryset = ViewPendingDataApproval.objects.filter(user_id=user.id)

    if approved:
        queryset = queryset.filter(level_id__gt=F('pending_level'))
    else:
        if subordinate:
            queryset = queryset.filter(
                level_id__lt=F('pending_level'),
                batch__approved=False)
        else:
            queryset = queryset.filter(
                level_id=F('pending_level'),
                batch__approved=False)
    queryset = queryset.values_list('batch_id', flat=True).order_by('-id')

    paginator = PageNumberPagination()
    instance = paginator.paginate_queryset(queryset, request)

    values = PendingDataBatch.objects.filter(
        id__in=list(instance)
    ).order_by('-created')

    data = {
        "current": int(request.GET.get('page', '1')),
        "total": queryset.count(),
        "total_page": ceil(queryset.count() / page_size),
        "batch": ListPendingDataBatchSerializer(
            instance=values, context={
                'user': user, },
            many=True).data,
    }
    return Response(data, status=status.HTTP_200_OK)


@extend_schema(responses={200: ListPendingFormDataSerializer(many=True)},
               tags=['Pending Data'],
               summary='To get list of pending data by batch')
@api_view(['GET'])
@permission_classes([IsAuthenticated, IsAdmin | IsApprover | IsSubmitter])
def list_pending_data_batch(request, version, batch_id):
    batch = get_object_or_404(PendingDataBatch, pk=batch_id)
    return Response(ListPendingFormDataSerializer(
        instance=batch.batch_pending_data_batch.all(), many=True
    ).data, status=status.HTTP_200_OK)


class PendingDataDetailDeleteView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(responses={200: ListPendingDataAnswerSerializer(many=True)},
                   tags=['Pending Data'],
                   summary='To get list of answers for pending data')
    def get(self, request, pending_data_id, version):
        data = get_object_or_404(PendingFormData, pk=pending_data_id)
        return Response(
            ListPendingDataAnswerSerializer(
                instance=data.pending_data_answer.all(),
                many=True).data,
            status=status.HTTP_200_OK)

    @extend_schema(
        responses={
            204: OpenApiResponse(description='Deletion with no response')},
        tags=['Pending Data'],
        summary='To delete pending data')
    def delete(self, request, pending_data_id, version):
        instance = get_object_or_404(PendingFormData, pk=pending_data_id)
        if instance.created_by_id != request.user.id:
            return Response(
                {'message': 'You are not allowed to perform this action'},
                status=status.HTTP_400_BAD_REQUEST
            )
        instance.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


@extend_schema(request=ApprovePendingDataRequestSerializer(),
               responses={200: DefaultResponseSerializer},
               tags=['Pending Data'],
               summary='Approve pending data')
@api_view(['POST'])
@permission_classes([IsAuthenticated, IsApprover | IsAdmin])
def approve_pending_data(request, version):
    serializer = ApprovePendingDataRequestSerializer(
        data=request.data,
        context={'user': request.user}
    )
    if not serializer.is_valid():
        return Response(
            {'message': validate_serializers_message(serializer.errors)},
            status=status.HTTP_400_BAD_REQUEST
        )
    serializer.save()
    return Response({'message': 'Ok'},
                    status=status.HTTP_200_OK)


class BatchView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(responses={
        (200, 'application/json'):
            inline_serializer("ListDataBatchResponse", fields={
                "current": serializers.IntegerField(),
                "total": serializers.IntegerField(),
                "total_page": serializers.IntegerField(),
                "data": ListBatchSerializer(many=True),
            })},
        tags=['Pending Data'],
        summary='To get list of batch',
        parameters=[
            OpenApiParameter(name='page',
                             required=True,
                             type=OpenApiTypes.NUMBER,
                             location=OpenApiParameter.QUERY),
            OpenApiParameter(name='approved',
                             default=False,
                             type=OpenApiTypes.BOOL,
                             location=OpenApiParameter.QUERY),
        ])
    def get(self, request, version):
        serializer = BatchListRequestSerializer(data=request.GET)
        if not serializer.is_valid():
            return Response(
                {'message': validate_serializers_message(
                    serializer.errors)},
                status=status.HTTP_400_BAD_REQUEST
            )
        queryset = PendingDataBatch.objects.filter(
            user=request.user,
            approved=serializer.validated_data.get('approved')
        ).order_by('-id')
        paginator = PageNumberPagination()
        instance = paginator.paginate_queryset(queryset, request)
        page_size = REST_FRAMEWORK.get('PAGE_SIZE')
        data = {
            "current": int(request.GET.get('page', '1')),
            "total": queryset.count(),
            "total_page": ceil(queryset.count() / page_size),
            "data": ListBatchSerializer(instance=instance, many=True).data
        }
        return Response(
            data,
            status=status.HTTP_200_OK)

    @extend_schema(request=CreateBatchSerializer(),
                   tags=['Pending Data'],
                   summary='To create batch')
    def post(self, request, version):
        serializer = CreateBatchSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(
                {'message': validate_serializers_message(
                    serializer.errors)},
                status=status.HTTP_400_BAD_REQUEST
            )
        serializer.save(user=request.user)
        return Response({'message': 'Data updated successfully'},
                        status=status.HTTP_200_OK)


class BatchSummaryView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(responses={200: ListBatchSummarySerializer(many=True)},
                   tags=['Pending Data'],
                   summary='To get batch summary')
    def get(self, request, batch_id, version):
        batch = get_object_or_404(PendingDataBatch, pk=batch_id)
        instance = PendingAnswers.objects.filter(
            pending_data__batch_id=batch.id,
            question__type__in=[QuestionTypes.option, QuestionTypes.number,
                                QuestionTypes.administration,
                                QuestionTypes.multiple_option]
        ).distinct('question')
        return Response(
            ListBatchSummarySerializer(
                instance=instance,
                many=True,
                context={'batch': batch}).data,
            status=status.HTTP_200_OK)


class BatchCommentView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(responses={200: ListBatchCommentSerializer(many=True)},
                   tags=['Pending Data'],
                   summary='To get batch comment')
    def get(self, request, batch_id, version):
        batch = get_object_or_404(PendingDataBatch, pk=batch_id)
        instance = batch.batch_batch_comment.all().order_by('-id')
        return Response(
            ListBatchCommentSerializer(
                instance=instance,
                many=True).data,
            status=status.HTTP_200_OK)


@extend_schema(tags=['File'],
               summary='Export Form data')
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def export_form_data(request, version, form_id):
    form = get_object_or_404(Forms, pk=form_id)
    filepath = generate_excel(form=form, user=SystemUser.objects.first())
    filename = filepath.split("/")[-1].replace(" ", "-")
    zip_file = open(filepath, 'rb')
    response = HttpResponse(
        FileWrapper(zip_file),
        content_type='application/vnd.openxmlformats-officedocument'
                     '.spreadsheetml.sheet')
    response[
        'Content-Disposition'] = 'attachment; filename="%s"' % filename
    return response


class PendingFormDataView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(request=SubmitPendingFormSerializer,
                   responses={200: DefaultResponseSerializer},
                   tags=['Pending Data'],
                   summary='Submit pending form data')
    def post(self, request, form_id, version):
        form = get_object_or_404(Forms, pk=form_id)
        serializer = SubmitPendingFormSerializer(data=request.data,
                                                 context={
                                                     'user': request.user,
                                                     'form': form})
        if not serializer.is_valid():
            return Response(
                {'message': validate_serializers_message(
                    serializer.errors),
                    'details': serializer.errors},
                status=status.HTTP_400_BAD_REQUEST
            )

        serializer.save()
        return Response({'message': 'ok'}, status=status.HTTP_200_OK)

    @extend_schema(responses={
        (200, 'application/json'):
            inline_serializer("PendingDataListResponse", fields={
                "current": serializers.IntegerField(),
                "total": serializers.IntegerField(),
                "total_page": serializers.IntegerField(),
                "data": ListPendingFormDataSerializer(many=True),
            })},
        tags=['Pending Data'],
        parameters=[
            OpenApiParameter(name='page',
                             required=True,
                             type=OpenApiTypes.NUMBER,
                             location=OpenApiParameter.QUERY)],
        summary='To get list of pending form data')
    def get(self, request, form_id, version):
        form = get_object_or_404(Forms, pk=form_id)
        serializer = ListFormDataRequestSerializer(data=request.GET)
        if not serializer.is_valid():
            return Response(
                {'message': validate_serializers_message(
                    serializer.errors)},
                status=status.HTTP_400_BAD_REQUEST
            )

        page_size = REST_FRAMEWORK.get('PAGE_SIZE')

        queryset = form.pending_form_form_data.filter(
            created_by=request.user, batch__isnull=True).order_by(
            '-created')

        paginator = PageNumberPagination()
        instance = paginator.paginate_queryset(queryset, request)

        data = {
            "current": int(request.GET.get('page', '1')),
            "total": queryset.count(),
            "total_page": ceil(queryset.count() / page_size),
            "data": ListPendingFormDataSerializer(
                instance=instance,
                many=True).data,
        }
        return Response(data, status=status.HTTP_200_OK)

    @extend_schema(
            request=SubmitFormDataAnswerSerializer(many=True),
            responses={200: DefaultResponseSerializer},
            tags=['Pending Data'],
            parameters=[
                OpenApiParameter(
                    name='pending_data_id',
                    required=True,
                    type=OpenApiTypes.NUMBER,
                    location=OpenApiParameter.QUERY)],
            summary='Edit pending form data')
    def put(self, request, form_id, version):
        get_object_or_404(Forms, pk=form_id)
        pending_data_id = request.GET['pending_data_id']
        user = request.user
        pending_data = get_object_or_404(PendingFormData, pk=pending_data_id)
        serializer = SubmitFormDataAnswerSerializer(
            data=request.data, many=True)
        if not serializer.is_valid():
            return Response(
                {'message': validate_serializers_message(
                    serializer.errors),
                    'details': serializer.errors},
                status=status.HTTP_400_BAD_REQUEST
            )

        pending_answers = request.data
        # move current pending_answer to pending_answer_history
        for answer in pending_answers:
            pending_form_answer = PendingAnswers.objects.get(
                pending_data=pending_data, question=answer.get('question'))
            PendingAnswerHistory.objects.create(
                pending_data=pending_form_answer.pending_data,
                question=pending_form_answer.question,
                name=pending_form_answer.name,
                value=pending_form_answer.value,
                options=pending_form_answer.options,
                created_by=user
            )
            # prepare updated answer
            question_id = answer.get('question')
            question = Questions.objects.get(
                id=question_id)
            name = None
            value = None
            option = None
            if question.type in [
                QuestionTypes.geo, QuestionTypes.option,
                QuestionTypes.multiple_option
            ]:
                option = answer.get('value')
            elif question.type in [
                QuestionTypes.text, QuestionTypes.photo, QuestionTypes.date
            ]:
                name = answer.get('value')
            else:
                # for administration,number question type
                value = answer.get('value')
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
                batch=pending_data.batch).all()
            # change approval status to pending
            for approval in approvals:
                approval.status = DataApprovalStatus.pending
                approval.save()
        return Response({'message': 'update success'},
                        status=status.HTTP_200_OK)
