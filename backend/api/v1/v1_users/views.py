# Create your views here.
from django.contrib.auth import authenticate
from django.core import signing
from drf_spectacular.utils import extend_schema, inline_serializer
from rest_framework import status, serializers
from rest_framework.decorators import api_view
from rest_framework.generics import get_object_or_404
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken

from api.v1.v1_forms.models import Forms
from api.v1.v1_profile.constants import UserRoleTypes
from api.v1.v1_profile.models import Access, Administration
from api.v1.v1_users.models import SystemUser
from api.v1.v1_users.serializers import LoginSerializer, UserSerializer, \
    VerifyInviteSerializer, SetUserPasswordSerializer, \
    ListAdministrationSerializer, ListFormSerializer
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
        return Response(data, status=status.HTTP_200_OK)
    return Response({'message': 'Invalid login credentials'},
                    status=status.HTTP_401_UNAUTHORIZED)


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


@extend_schema(responses={200: ListFormSerializer},
               tags=['Form'])
@api_view(['GET'])
def list_form(request, version, pk):
    instance = get_object_or_404(Forms, pk=pk)
    return Response(ListFormSerializer(instance=instance).data,
                    status=status.HTTP_200_OK)
