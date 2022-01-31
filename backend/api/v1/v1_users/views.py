# Create your views here.
from django.contrib.auth import authenticate
from django.core import signing
from rest_framework import status
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken

from api.v1.v1_profile.constants import UserRoleTypes
from api.v1.v1_profile.models import Access, Administration
from api.v1.v1_users.models import SystemUser
from api.v1.v1_users.serializers import LoginSerializer, UserSerializer, \
    VerifyInviteSerializer
from utils.custom_serializer_fields import validate_serializers_message


@api_view(['GET'])
def health_check(request, version):
    return Response({'message': 'OK'}, status=status.HTTP_200_OK)


# TODO: Remove temp user entry and invite key from the response.
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
