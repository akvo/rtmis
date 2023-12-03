# Create your views here.
import typing
from django.contrib.admin.sites import site
from django.core.handlers.wsgi import WSGIRequest
from django.db.models import ProtectedError, Q
from django.contrib.admin.utils import get_deleted_objects
from drf_spectacular.utils import extend_schema, inline_serializer
from rest_framework.viewsets import ModelViewSet
from api.v1.v1_profile.models import (
        Administration, AdministrationAttribute, Levels)
from api.v1.v1_profile.serializers import (
        AdministrationAttributeSerializer, AdministrationSerializer)
from utils.default_serializers import DefaultResponseSerializer
from utils.custom_pagination import Pagination
from rest_framework.decorators import api_view
from rest_framework import serializers, status
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from utils.email_helper import send_email, EmailTypes


@extend_schema(
    request=inline_serializer(
        'BatchUserComment',
        fields={
            'name': serializers.CharField(),
            'email': serializers.CharField(),
            'message': serializers.CharField(),
        }),
    responses={200: DefaultResponseSerializer},
    tags=['Feedback'],
    description='Send feedback',
    summary='Send feedback')
@api_view(['POST'])
def send_feedback(request, version):
    name = request.data.get('name')
    email = request.data.get('email')
    message = request.data.get('message')
    # TODO:: change email
    data = {
        'send_to': ["tech.consultancy@akvo.org"],
        'subject': 'Feedback from {0} <{1}>'.format(name, email),
        'body': 'This is feedback from {0} <{1}>. Message: {2}'.format(
            name, email, message)
    }
    send_email(context=data, type=EmailTypes.feedback)
    return Response({'message': 'Feedback was sent successfully.'},
                    status=status.HTTP_200_OK)


@extend_schema(tags=['Administration'])
class AdministrationViewSet(ModelViewSet):
    serializer_class = AdministrationSerializer
    permission_classes = [IsAuthenticated]
    pagination_class = Pagination

    def get_queryset(self):
        queryset = Administration.objects\
            .prefetch_related('parent_administration', 'attributes')\
            .all()
        search = self.request.query_params.get('search')
        parent_id = self.request.query_params.get('parent')
        level_id = self.request.query_params.get('level')
        if search:
            queryset = queryset.filter(
                    Q(name__icontains=search) | Q(code__icontains=search))
        if parent_id:
            try:
                parent = Administration.objects.get(id=parent_id)
                queryset = queryset.filter(
                        path__startswith=f"{parent.path}{parent.id}.")
            except Administration.DoesNotExist:
                pass
        if level_id:
            try:
                level = Levels.objects.get(id=level_id)
                queryset = queryset.filter(level=level)
            except Levels.DoesNotExist:
                pass
        return queryset.order_by('id')

    def get_serializer(self, *args, **kwargs):
        if (self.action == 'list'):
            kwargs.update({'compact': True})
        return super().get_serializer(*args, **kwargs)

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        try:
            instance.delete()
        except ProtectedError:
            _, _, _, protected = get_deleted_objects(
                    [instance], typing.cast(WSGIRequest, request), site)
            error = (
                f'Cannot delete "Administration: {instance}" because it is '
                'referenced by other data'
            )
            return Response(
                    {'error': error, 'referenced_by': protected},
                    status=status.HTTP_409_CONFLICT)
        return Response(status=status.HTTP_204_NO_CONTENT)


@extend_schema(tags=['Administration'])
class AdministrationAttributeViewSet(ModelViewSet):
    queryset = AdministrationAttribute.objects.order_by('id').all()
    serializer_class = AdministrationAttributeSerializer
    permission_classes = [IsAuthenticated]
    pagination_class = None
