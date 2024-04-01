# Create your views here.
from drf_spectacular.types import OpenApiTypes
from drf_spectacular.utils import extend_schema, OpenApiParameter, \
    inline_serializer

from rest_framework import status, serializers
from rest_framework.decorators import api_view, permission_classes
from rest_framework.generics import get_object_or_404
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from api.v1.v1_forms.constants import FormTypes
from api.v1.v1_forms.models import (
    Forms,
    FormApprovalAssignment,
    FormCertificationAssignment,
)
from api.v1.v1_forms.serializers import (
    ListFormSerializer,
    WebFormDetailSerializer,
    FormDataSerializer,
    ListFormRequestSerializer,
    FormApproverRequestSerializer,
    FormApproverResponseSerializer,
    FormCertificationAssignmentSerializer,
    FormCertificationAssignmentRequestSerializer,
)
from django.db.models import Q
from rest_framework.viewsets import ModelViewSet
from api.v1.v1_profile.models import Administration
from api.v1.v1_data.functions import get_cache, create_cache
from utils.custom_permissions import IsSuperAdmin, IsAdmin
from utils.custom_serializer_fields import validate_serializers_message
from utils.custom_pagination import Pagination


@extend_schema(responses={200: ListFormSerializer(many=True)},
               parameters=[
                   OpenApiParameter(name='type',
                                    required=False,
                                    enum=FormTypes.FieldStr.keys(),
                                    type=OpenApiTypes.NUMBER,
                                    location=OpenApiParameter.QUERY),
               ],
               tags=['Form'],
               summary='To get list of forms',
               description='Form type 1=County and 2=National')
@api_view(['GET'])
def list_form(request, version):
    serializer = ListFormRequestSerializer(data=request.GET)
    if not serializer.is_valid():
        return Response(
            {'message': validate_serializers_message(serializer.errors)},
            status=status.HTTP_400_BAD_REQUEST)
    filter_data = {}
    if serializer.validated_data.get('type'):
        filter_data['type'] = serializer.validated_data.get('type')
    instance = Forms.objects.filter(**filter_data)
    return Response(ListFormSerializer(instance=instance, many=True).data,
                    status=status.HTTP_200_OK)


@extend_schema(responses={200: WebFormDetailSerializer},
               tags=['Form'],
               summary='To get form in webform format')
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def web_form_details(request, version, form_id):
    administration = request.user.user_access.administration
    cache_name = f"webform-{form_id}-{administration.id}"
    cache_data = get_cache(cache_name)
    if cache_data:
        return Response(cache_data, content_type="application/json;")
    instance = get_object_or_404(Forms, pk=form_id)
    instance = WebFormDetailSerializer(
            instance=instance,
            context={'user': request.user}).data
    create_cache(cache_name, instance)
    return Response(instance, status=status.HTTP_200_OK)


@extend_schema(responses={200: FormDataSerializer},
               tags=['Form'],
               summary='To get form data')
@api_view(['GET'])
def form_data(request, version, form_id):
    cache_name = f"form-{form_id}"
    cache_data = get_cache(cache_name)
    if cache_data:
        return Response(cache_data, content_type="application/json;")
    instance = get_object_or_404(Forms, pk=form_id)
    instance = FormDataSerializer(instance=instance).data
    create_cache(cache_name, instance)
    return Response(instance, status=status.HTTP_200_OK)


@extend_schema(
        parameters=[
            OpenApiParameter(
                name='administration_id',
                required=True,
                type=OpenApiTypes.NUMBER,
                location=OpenApiParameter.QUERY),
            OpenApiParameter(
                name='form_id',
                required=True,
                type=OpenApiTypes.NUMBER,
                location=OpenApiParameter.QUERY)],
        responses={200: FormApproverResponseSerializer(many=True)},
        tags=['Form'],
        summary='To get approver user list')
@api_view(['GET'])
@permission_classes([IsAuthenticated, IsSuperAdmin | IsAdmin])
def form_approver(request, version):
    serializer = FormApproverRequestSerializer(data=request.GET)
    if not serializer.is_valid():
        return Response(
            {'message': validate_serializers_message(serializer.errors)},
            status=status.HTTP_400_BAD_REQUEST)

    instance = Administration.objects.filter(
        parent=serializer.validated_data.get('administration_id'), )
    return Response(FormApproverResponseSerializer(
        instance=instance, many=True,
        context={'form': serializer.validated_data.get('form_id')}).data,
                    status=status.HTTP_200_OK)


@extend_schema(
    responses={(200, 'application/json'): inline_serializer(
        'CheckFormApproverSerializer', fields={
            'count': serializers.IntegerField(),
        })},
    tags=['Form'],
    summary='To check approver for defined form_id & logged in user')
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def check_form_approver(request, form_id, version):
    form = get_object_or_404(Forms, pk=form_id)
    # find administration id from logged in user
    if not request.user.user_access.administration.path:
        return Response(
            {'message': 'National level does not have an approver'},
            status=status.HTTP_404_NOT_FOUND
        )
    adm_ids = request.user.user_access.administration.path[:-1].split('.')
    adm_ids += [request.user.user_access.administration_id]
    adm_ids = [int(adm) for adm in adm_ids]
    # check into form approval assignment table
    approver = FormApprovalAssignment.objects.filter(
        form=form, administration_id__in=adm_ids).count()
    return Response({'count': approver},
                    status=status.HTTP_200_OK)


@extend_schema(tags=['Certification Assignment'])
class FormCertificationAssignmentViewSet(ModelViewSet):
    serializer_class = FormCertificationAssignmentSerializer
    permission_classes = [IsAuthenticated]
    pagination_class = Pagination

    def get_queryset(self):
        allowed_path = self.request.user.user_access.administration.path
        user_administration_id = self.request\
                                     .user.user_access.administration_id
        if self.request.user.is_superuser:
            queryset = FormCertificationAssignment\
                .objects.all()\
                .order_by('-id')
        else:
            queryset = FormCertificationAssignment.objects\
                .prefetch_related('administrations')\
                .filter(
                    Q(administrations__path__startswith=allowed_path) |
                    Q(administrations__id=user_administration_id)
                ).order_by('-id')
        return queryset

    def get_serializer_class(self):
        if self.action in ['create', 'update']:
            return FormCertificationAssignmentRequestSerializer
        return FormCertificationAssignmentSerializer

    def list(self, request, *args, **kwargs):
        queryset = self.get_queryset()
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        serializer = self.get_serializer(instance)
        return Response(serializer.data)

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    def update(self, request, *args, **kwargs):
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        instance.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
