# Create your views here.
from math import ceil

from django.contrib.postgres.aggregates import StringAgg
from django.core.paginator import InvalidPage, EmptyPage, Paginator
from django.db.models import Count, TextField
from django.db.models.functions import Cast
from drf_spectacular.types import OpenApiTypes
from drf_spectacular.utils import extend_schema, inline_serializer, \
    OpenApiParameter
from rest_framework import serializers, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.generics import get_object_or_404
from rest_framework.pagination import PageNumberPagination
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from api.v1.v1_data.models import FormData, Answers
from api.v1.v1_data.serializers import SubmitFormSerializer, \
    ListFormDataSerializer, ListFormDataRequestSerializer, \
    ListDataAnswerSerializer, ListMapDataPointSerializer, \
    ListMapDataPointRequestSerializer, ListChartDataPointRequestSerializer, \
    ListChartQuestionDataPointSerializer
from api.v1.v1_forms.models import Forms
from api.v1.v1_profile.models import Administration
from rtmis.settings import REST_FRAMEWORK
from utils.custom_serializer_fields import validate_serializers_message


@extend_schema(request=SubmitFormSerializer,
               responses={
                   (200, 'application/json'):
                       inline_serializer("FormSubmit", fields={
                           "message": serializers.CharField()
                       })
               },
               tags=['Form'])
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def submit_form(request, version, pk):
    form = get_object_or_404(Forms, pk=pk)
    try:
        serializer = SubmitFormSerializer(data=request.data,
                                          context={'user': request.user,
                                                   'form': form})
        if not serializer.is_valid():
            return Response(
                {'message': validate_serializers_message(serializer.errors),
                 'details': serializer.errors},
                status=status.HTTP_400_BAD_REQUEST
            )

        serializer.save()
        return Response({'message': 'ok'}, status=status.HTTP_200_OK)
    except Exception as ex:
        return Response({'message': ex.args},
                        status=status.HTTP_500_INTERNAL_SERVER_ERROR)


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
                         type={'type': 'array', 'items': {'type': 'number'}},
                         location=OpenApiParameter.QUERY),
    ])
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def list_form_data(request, version, pk):
    form = get_object_or_404(Forms, pk=pk)
    try:
        serializer = ListFormDataRequestSerializer(data=request.GET)
        if not serializer.is_valid():
            return Response(
                {'message': validate_serializers_message(serializer.errors)},
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
        page = request.GET.get('page')

        queryset = form.form_form_data.filter(**filter_data).order_by(
            'created', 'updated')
        paginator_temp = Paginator(queryset, page_size)
        paginator_temp.page(request.GET.get('page', page))

        paginator = PageNumberPagination()
        instance = paginator.paginate_queryset(queryset, request)

        data = {
            "current": int(request.GET.get('page', '1')),
            "total": queryset.count(),
            "total_page": ceil(queryset.count() / page_size),
            "data": ListFormDataSerializer(
                instance=instance, context={
                    'questions': serializer.validated_data.get('questions')},
                many=True).data,
        }
        return Response(data, status=status.HTTP_200_OK)
    except (InvalidPage, EmptyPage):
        return Response({'message': 'data not found'},
                        status=status.HTTP_404_NOT_FOUND)
    except Exception as ex:
        return Response({'message': ex.args},
                        status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@extend_schema(responses={200: ListDataAnswerSerializer(many=True)},
               tags=['Data'])
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def data_answers(request, version, pk):
    data = get_object_or_404(FormData, pk=pk)
    try:
        return Response(
            ListDataAnswerSerializer(instance=data.data_answer.all(),
                                     many=True).data,
            status=status.HTTP_200_OK)
    except Exception as ex:
        return Response({'message': ex.args},
                        status=status.HTTP_500_INTERNAL_SERVER_ERROR)


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
               tags=['Map'])
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_map_data_point(request, version, pk):
    instance = get_object_or_404(Forms, pk=pk)
    try:
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
    except Exception as ex:
        return Response({'message': ex.args},
                        status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@extend_schema(responses={200: OpenApiTypes.OBJECT},
               parameters=[
                   OpenApiParameter(name='question',
                                    required=True,
                                    type=OpenApiTypes.NUMBER,
                                    location=OpenApiParameter.QUERY),
                   OpenApiParameter(name='stack',
                                    required=False,
                                    type=OpenApiTypes.NUMBER,
                                    location=OpenApiParameter.QUERY),
               ],
               tags=['Chart'])
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_chart_data_point(request, version, pk):
    instance = get_object_or_404(Forms, pk=pk)
    try:
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

        return Response({'type': 'BAR',
                         'data': ListChartQuestionDataPointSerializer(
                             instance=serializer.validated_data.get(
                                 'question').question_question_options.all(),
                             many=True).data},
                        status=status.HTTP_200_OK)
    except Exception as ex:
        return Response({'message': ex.args},
                        status=status.HTTP_500_INTERNAL_SERVER_ERROR)
