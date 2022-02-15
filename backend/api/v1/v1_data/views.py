# Create your views here.
from math import ceil

from django.core.paginator import InvalidPage, EmptyPage, Paginator
from drf_spectacular.types import OpenApiTypes
from drf_spectacular.utils import extend_schema, inline_serializer, \
    OpenApiParameter
from rest_framework import serializers, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.generics import get_object_or_404
from rest_framework.pagination import PageNumberPagination
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from api.v1.v1_data.models import FormData
from api.v1.v1_data.serializers import SubmitFormSerializer, \
    ListFormDataSerializer, ListFormDataRequestSerializer, \
    ListDataAnswerSerializer, ListMapDataPointSerializer, \
    ListMapDataPointRequestSerializer
from api.v1.v1_forms.models import Forms
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
                {'message': validate_serializers_message(serializer.errors)},
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
            filter_data['administration'] = serializer.validated_data.get(
                'administration')
        page_size = REST_FRAMEWORK.get('PAGE_SIZE')
        page = request.GET.get('page')

        queryset = form.form_form_data.filter(**filter_data).order_by(
            'created', 'updated')
        paginator_temp = Paginator(queryset, page_size)
        paginator_temp.page(request.GET.get('page', page))

        paginator = PageNumberPagination()
        instance = paginator.paginate_queryset(queryset, request)

        data = {
            "current": request.GET.get('page'),
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
