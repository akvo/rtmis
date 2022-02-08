# Create your views here.
from django.contrib.auth import authenticate
from django.core import signing
from drf_spectacular.utils import extend_schema, inline_serializer
from rest_framework import status, serializers
from rest_framework.decorators import api_view, permission_classes
from rest_framework.generics import get_object_or_404
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken

from api.v1.v1_profile.constants import UserRoleTypes
from api.v1.v1_profile.models import Access, Administration
from api.v1.v1_users.models import SystemUser
from api.v1.v1_users.serializers import LoginSerializer, UserSerializer, \
    VerifyInviteSerializer, SetUserPasswordSerializer, \
    ListAdministrationSerializer, AddEditUserSerializer, ListUserSerializer
from utils.custom_permissions import IsSuperAdmin, IsAdmin
from utils.custom_serializer_fields import validate_serializers_message


@extend_schema(description='Use to check System health',
               tags=['User'])
@api_view(['GET'])
def health_check(request, version):
    return Response({'message': 'OK'}, status=status.HTTP_200_OK)


# TODO: Remove temp user entry and invite key from the response.
@extend_schema(request=LoginSerializer,
               responses={200: UserSerializer},
               tags=['User'])
@api_view(['POST'])
def login(request, version):
    serializer = LoginSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(
            {'message': validate_serializers_message(serializer.errors)},
            status=status.HTTP_400_BAD_REQUEST
        )
    # Add temp user for development purpose
    if not SystemUser.objects.all().count():
        super_admin = SystemUser.objects.create_superuser(
            email='admin@rtmis.com',
            password='Test105*',
            first_name='Admin',
            last_name='RTMIS')
        Access.objects.create(user=super_admin,
                              role=UserRoleTypes.super_admin,
                              administration=Administration.objects.filter(
                                  parent__isnull=True).first())

    user = authenticate(email=serializer.validated_data['email'],
                        password=serializer.validated_data['password'])

    if user:
        refresh = RefreshToken.for_user(user)
        data = UserSerializer(instance=user).data
        data['token'] = str(refresh.access_token)
        data['invite'] = signing.dumps(user.pk)
        response = Response(data, status=status.HTTP_200_OK, )
        response.set_cookie('AUTH_TOKEN', str(refresh.access_token))
        return response
    return Response({'message': 'Invalid login credentials'},
                    status=status.HTTP_401_UNAUTHORIZED)


@extend_schema(responses={200: UserSerializer},
               tags=['User'])
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_profile(request, version):
    return Response(UserSerializer(instance=request.user).data,
                    status=status.HTTP_200_OK)


@extend_schema(request=VerifyInviteSerializer,
               responses={
                   (200, 'application/json'):
                       inline_serializer("Response", fields={
                           "message": serializers.CharField()
                       })
               },
               tags=['User'])
@api_view(['POST'])
def verify_invite(request, version):
    try:
        serializer = VerifyInviteSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(
                {'message': validate_serializers_message(serializer.errors)},
                status=status.HTTP_400_BAD_REQUEST
            )
        return Response(
            {'name': serializer.validated_data.get('invite').get_full_name()},
            status=status.HTTP_200_OK
        )
    except Exception as ex:
        return Response({'message': ex.args},
                        status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@extend_schema(request=SetUserPasswordSerializer,
               responses={200: UserSerializer},
               tags=['User'])
@api_view(['POST'])
def set_user_password(request, version):
    try:
        serializer = SetUserPasswordSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(
                {'message': validate_serializers_message(serializer.errors)},
                status=status.HTTP_400_BAD_REQUEST
            )
        user: SystemUser = serializer.validated_data.get('invite')
        user.set_password(serializer.validated_data.get('password'))
        user.save()
        refresh = RefreshToken.for_user(user)
        data = UserSerializer(instance=user).data
        data['token'] = str(refresh.access_token)
        # TODO: remove invite from response
        data['invite'] = signing.dumps(user.pk)
        return Response(data, status=status.HTTP_200_OK)

    except Exception as ex:
        return Response({'message': ex.args},
                        status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@extend_schema(responses={200: ListAdministrationSerializer},
               tags=['Administration'])
@api_view(['GET'])
def list_administration(request, version, pk):
    instance = get_object_or_404(Administration, pk=pk)
    return Response(ListAdministrationSerializer(instance=instance).data,
                    status=status.HTTP_200_OK)


@extend_schema(request=AddEditUserSerializer,
               responses={
                   (200, 'application/json'):
                       inline_serializer("Response", fields={
                           "message": serializers.CharField()
                       })
               },
               tags=['User'],
               description='Role Choice are SuperAdmin:1,Admin:2,Approver:3,'
                           'User:4')
@api_view(['POST'])
@permission_classes([IsAuthenticated, IsSuperAdmin | IsAdmin])
def add_user(request, version):
    try:
        serializer = AddEditUserSerializer(data=request.data,
                                           context={'user': request.user})
        if not serializer.is_valid():
            return Response(
                {'message': validate_serializers_message(serializer.errors)},
                status=status.HTTP_400_BAD_REQUEST
            )
        serializer.save()
        return Response({'message': 'User added successfully'},
                        status=status.HTTP_200_OK)
    except Exception as ex:
        return Response({'message': ex.args},
                        status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@extend_schema(responses={200: ListUserSerializer(many=True)},
               tags=['User'])
@api_view(['GET'])
@permission_classes([IsAuthenticated, IsSuperAdmin | IsAdmin])
def list_users(request, version):
    filter_data = {}
    if request.user.user_access.role != UserRoleTypes.super_admin:
        children = Administration.objects.raw(
            'WITH RECURSIVE subordinates AS ('
            'SELECT id FROM administrator WHERE parent_id = {0} UNION '
            'SELECT e.id FROM administrator e '
            'INNER JOIN subordinates s ON s.id = e.parent_id) '
            'SELECT * FROM subordinates;'.format(
                request.user.user_access.administration.id))
        administration_ids = [request.user.user_access.administration]
        for child in children:
            administration_ids.append(child.id)
        filter_data['user_access__administration_id__in'] = administration_ids
    return Response(ListUserSerializer(
        instance=SystemUser.objects.filter(**filter_data),
        many=True).data, status=status.HTTP_200_OK)


@extend_schema(request=AddEditUserSerializer,
               responses={
                   (200, 'application/json'):
                       inline_serializer("Response", fields={
                           "message": serializers.CharField()
                       })
               },
               tags=['User'],
               description='Role Choice are SuperAdmin:1,Admin:2,Approver:3,'
                           'User:4')
@api_view(['PUT'])
@permission_classes([IsAuthenticated, IsSuperAdmin | IsAdmin])
def edit_user(request, version, pk):
    instance = get_object_or_404(SystemUser, pk=pk)
    try:
        serializer = AddEditUserSerializer(data=request.data,
                                           context={'user': request.user},
                                           instance=instance)
        if not serializer.is_valid():
            return Response(
                {'message': validate_serializers_message(serializer.errors)},
                status=status.HTTP_400_BAD_REQUEST
            )
        serializer.save()
        return Response({'message': 'User updated successfully'},
                        status=status.HTTP_200_OK)
    except Exception as ex:
        return Response({'message': ex.args},
                        status=status.HTTP_500_INTERNAL_SERVER_ERROR)
