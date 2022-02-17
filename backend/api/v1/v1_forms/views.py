# Create your views here.
from drf_spectacular.types import OpenApiTypes
from drf_spectacular.utils import extend_schema, OpenApiParameter, \
    inline_serializer
from rest_framework import status, serializers
from rest_framework.decorators import api_view, permission_classes
from rest_framework.generics import get_object_or_404
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from api.v1.v1_forms.models import Forms
from api.v1.v1_forms.serializers import ListFormSerializer, \
    WebFormDetailSerializer, FormDataSerializer, ListFormRequestSerializer, \
    EditFormTypeSerializer
from utils.custom_permissions import IsSuperAdmin
from utils.custom_serializer_fields import validate_serializers_message


@extend_schema(responses={200: ListFormSerializer(many=True)},
               parameters=[
                   OpenApiParameter(name='type',
                                    required=False,
                                    type=OpenApiTypes.NUMBER,
                                    location=OpenApiParameter.QUERY), ],
               tags=['Form'])
@api_view(['GET'])
def list_form(request, version):
    serializer = ListFormRequestSerializer(data=request.GET)
    if not serializer.is_valid():
        return Response(
            {'message': validate_serializers_message(serializer.errors)},
            status=status.HTTP_400_BAD_REQUEST
        )
    filter_data = {}
    if serializer.validated_data.get('type'):
        filter_data['type'] = serializer.validated_data.get('type')
    instance = Forms.objects.filter(**filter_data)
    return Response(
        ListFormSerializer(instance=instance, many=True).data,
        status=status.HTTP_200_OK)


@extend_schema(responses={200: WebFormDetailSerializer},
               tags=['Form'])
@api_view(['GET'])
def web_form_details(request, version, pk):
    instance = get_object_or_404(Forms, pk=pk)
    return Response(WebFormDetailSerializer(instance=instance).data,
                    status=status.HTTP_200_OK)


@extend_schema(responses={200: FormDataSerializer},
               tags=['Form'])
@api_view(['GET'])
def form_data(request, version, pk):
    instance = get_object_or_404(Forms, pk=pk)
    return Response(FormDataSerializer(instance=instance).data,
                    status=status.HTTP_200_OK)


@extend_schema(request=EditFormTypeSerializer(many=True),
               responses={
                   (200, 'application/json'):
                       inline_serializer("EditForm", fields={
                           "message": serializers.CharField()
                       })
               },
               tags=['Form'])
@api_view(['PUT'])
@permission_classes([IsAuthenticated, IsSuperAdmin])
def edit_form_type(request, version):
    serializer = EditFormTypeSerializer(data=request.data, many=True)
    if not serializer.is_valid():
        return Response(
            {'message': validate_serializers_message(serializer.errors)},
            status=status.HTTP_400_BAD_REQUEST
        )
    serializer.save()
    return Response({'message': 'Forms updated successfully'},
                    status=status.HTTP_200_OK)
