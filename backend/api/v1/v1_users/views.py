# Create your views here.
import datetime
from math import ceil
from pathlib import Path

from django.contrib.auth import authenticate
from django.core import signing
from django.core.management import call_command
from django.core.signing import BadSignature
from django.db.models import Value
from django.db.models.functions import Coalesce
from django.http import HttpResponse
from django.utils import timezone
from drf_spectacular.types import OpenApiTypes
from drf_spectacular.utils import extend_schema, inline_serializer, \
    OpenApiParameter, OpenApiResponse
from jsmin import jsmin
from rest_framework import status, serializers
from rest_framework.decorators import api_view, permission_classes
from rest_framework.generics import get_object_or_404
from rest_framework.pagination import PageNumberPagination
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken

from api.v1.v1_profile.constants import UserRoleTypes
from api.v1.v1_profile.models import Access, Administration, Levels
from api.v1.v1_users.models import SystemUser
from api.v1.v1_users.serializers import LoginSerializer, UserSerializer, \
    VerifyInviteSerializer, SetUserPasswordSerializer, \
    ListAdministrationSerializer, AddEditUserSerializer, ListUserSerializer, \
    ListUserRequestSerializer, ListLevelSerializer, UserDetailSerializer
from rtmis.settings import REST_FRAMEWORK
from utils.custom_permissions import IsSuperAdmin, IsAdmin
from utils.custom_serializer_fields import validate_serializers_message


@extend_schema(description='Use to check System health', tags=['Dev'])
@api_view(['GET'])
def health_check(request, version):
    return Response({'message': 'OK'}, status=status.HTTP_200_OK)


@extend_schema(description='Use to check System health', tags=['Dev'])
@api_view(['GET'])
def get_config_file(request, version):
    if not Path("source/config/config.min.js").exists():
        call_command('generate_config')
    data = jsmin(open("source/config/config.min.js", "r").read())
    response = HttpResponse(
        data, content_type="application/x-javascript; charset=utf-8")
    return response


# TODO: Remove temp user entry and invite key from the response.
@extend_schema(request=LoginSerializer,
               responses={200: UserSerializer},
               tags=['Auth'])
@api_view(['POST'])
def login(request, version):
    serializer = LoginSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(
            {'message': validate_serializers_message(serializer.errors)},
            status=status.HTTP_400_BAD_REQUEST)
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
        response = Response(
            data,
            status=status.HTTP_200_OK,
        )
        response.set_cookie('AUTH_TOKEN', str(refresh.access_token))
        return response
    return Response({'message': 'Invalid login credentials'},
                    status=status.HTTP_401_UNAUTHORIZED)


@extend_schema(responses={200: UserSerializer},
               tags=['Auth'],
               summary='Get user details from token')
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_profile(request, version):
    return Response(UserSerializer(instance=request.user).data,
                    status=status.HTTP_200_OK)


@extend_schema(request=VerifyInviteSerializer,
               responses={
                   (200, 'application/json'):
                       inline_serializer(
                           "Response",
                           fields={"message": serializers.CharField()})
               },
               tags=['User'],
               summary='To verify invitation code')
@api_view(['GET'])
def verify_invite(request, version, invitation_id):
    try:
        pk = signing.loads(invitation_id)
        user = SystemUser.objects.get(pk=pk)
        return Response({'name': user.get_full_name()},
                        status=status.HTTP_200_OK)
    except BadSignature:
        return Response({'message': 'Invalid invite code'},
                        status=status.HTTP_400_BAD_REQUEST)
    except SystemUser.DoesNotExist:
        return Response({'message': 'Invalid invite code'},
                        status=status.HTTP_400_BAD_REQUEST)


@extend_schema(request=SetUserPasswordSerializer,
               responses={200: UserSerializer},
               tags=['User'],
               summary="To set user's password")
@api_view(['PUT'])
def set_user_password(request, version):
    serializer = SetUserPasswordSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(
            {'message': validate_serializers_message(serializer.errors)},
            status=status.HTTP_400_BAD_REQUEST)
    user: SystemUser = serializer.validated_data.get('invite')
    user.set_password(serializer.validated_data.get('password'))
    user.updated = timezone.now()
    user.save()
    refresh = RefreshToken.for_user(user)
    data = UserSerializer(instance=user).data
    data['token'] = str(refresh.access_token)
    # TODO: remove invite from response
    data['invite'] = signing.dumps(user.pk)
    return Response(data, status=status.HTTP_200_OK)


@extend_schema(responses={200: ListAdministrationSerializer},
               tags=['Administration'],
               parameters=[
                   OpenApiParameter(name='filter',
                                    required=False,
                                    type=OpenApiTypes.NUMBER,
                                    location=OpenApiParameter.QUERY),
               ],
               summary='Get list of administration')
@api_view(['GET'])
def list_administration(request, version, administration_id):
    instance = get_object_or_404(Administration, pk=administration_id)
    filter = request.GET.get('filter')
    return Response(ListAdministrationSerializer(instance=instance,
                                                 context={
                                                     'filter': filter
                                                 }).data,
                    status=status.HTTP_200_OK)


@extend_schema(responses={200: ListLevelSerializer(many=True)},
               tags=['Administration'],
               summary='Get list of levels')
@api_view(['GET'])
def list_levels(request, version):
    return Response(ListLevelSerializer(instance=Levels.objects.all(),
                                        many=True).data,
                    status=status.HTTP_200_OK)


@extend_schema(request=AddEditUserSerializer,
               responses={
                   (200, 'application/json'):
                       inline_serializer(
                           "Response",
                           fields={"message": serializers.CharField()})
               },
               tags=['User'],
               description='Role Choice are SuperAdmin:1,Admin:2,Approver:3,'
                           'User:4',
               summary='To add user')
@api_view(['POST'])
@permission_classes([IsAuthenticated, IsSuperAdmin | IsAdmin])
def add_user(request, version):
    serializer = AddEditUserSerializer(data=request.data,
                                       context={'user': request.user})
    if not serializer.is_valid():
        return Response(
            {'message': validate_serializers_message(serializer.errors)},
            status=status.HTTP_400_BAD_REQUEST)
    serializer.save()
    return Response({'message': 'User added successfully'},
                    status=status.HTTP_200_OK)


@extend_schema(responses={
    (200, 'application/json'):
        inline_serializer("UserList",
                          fields={
                              "current": serializers.IntegerField(),
                              "total": serializers.IntegerField(),
                              "total_page": serializers.IntegerField(),
                              "data": ListUserSerializer(many=True),
                          })
},
    tags=['User'],
    summary='Get list of users',
    parameters=[
        OpenApiParameter(name='page',
                         required=True,
                         type=OpenApiTypes.NUMBER,
                         location=OpenApiParameter.QUERY),
        OpenApiParameter(name='role',
                         required=False,
                         type=OpenApiTypes.NUMBER,
                         location=OpenApiParameter.QUERY),
        OpenApiParameter(name='administration',
                         required=False,
                         type=OpenApiTypes.NUMBER,
                         location=OpenApiParameter.QUERY),
        OpenApiParameter(name='pending',
                         required=False,
                         type=OpenApiTypes.BOOL,
                         location=OpenApiParameter.QUERY),
        OpenApiParameter(name='descendants',
                         required=False,
                         default=True,
                         type=OpenApiTypes.BOOL,
                         location=OpenApiParameter.QUERY),
    ])
@api_view(['GET'])
@permission_classes([IsAuthenticated, IsSuperAdmin | IsAdmin])
def list_users(request, version):
    serializer = ListUserRequestSerializer(data=request.GET)
    if not serializer.is_valid():
        return Response(
            {'message': validate_serializers_message(serializer.errors)},
            status=status.HTTP_400_BAD_REQUEST)

    user_allowed = request.user.user_access.administration

    if user_allowed.path:
        allowed_path = f"{user_allowed.path}{user_allowed.id}."
    else:
        allowed_path = f"{user_allowed.id}."
    allowed_descendants = list(
        Administration.objects.filter(
            path__startswith=allowed_path).values_list('id', flat=True))
    allowed_descendants.append(user_allowed.id)
    filter_data = {
        'user_access__administration_id__in': allowed_descendants
    }
    exclude_data = {'password__exact': ''}

    if serializer.validated_data.get('administration'):
        filter_administration = serializer.validated_data.get(
            'administration')
        if not serializer.validated_data.get('descendants'):
            filter_descendants = list(
                Administration.objects.filter(
                    parent=filter_administration).values_list('id',
                                                              flat=True))
        else:
            if filter_administration.path:
                filter_path = '{0}{1}.'.format(filter_administration.path,
                                               filter_administration.id)
            else:
                filter_path = f"{filter_administration.id}."
            filter_descendants = list(
                Administration.objects.filter(
                    path__startswith=filter_path).values_list('id',
                                                              flat=True))
            filter_descendants.append(filter_administration.id)

        set1 = set(filter_descendants)
        final_set = set1.intersection(allowed_descendants)
        filter_data['user_access__administration_id__in'] = list(final_set)
    if serializer.validated_data.get('role'):
        filter_data['user_access__role'] = serializer.validated_data.get(
            'role')
    if serializer.validated_data.get('pending'):
        filter_data['password__exact'] = ''
        exclude_data.pop('password__exact')

    page_size = REST_FRAMEWORK.get('PAGE_SIZE')
    the_past = timezone.now() - datetime.timedelta(days=10 * 365)
    queryset = SystemUser.objects.filter(**filter_data).exclude(
        **exclude_data).annotate(
        last_updated=Coalesce('updated', Value(the_past))).order_by(
        '-last_updated', '-date_joined')
    paginator = PageNumberPagination()
    instance = paginator.paginate_queryset(queryset, request)
    data = {
        "current": request.GET.get('page'),
        "data": ListUserSerializer(instance=instance, many=True).data,
        "total": queryset.count(),
        "total_page": ceil(queryset.count() / page_size)
    }
    return Response(data, status=status.HTTP_200_OK)


@extend_schema(responses=inline_serializer('user_role',
                                           fields={
                                               'id':
                                                   serializers.IntegerField(),
                                               'value':
                                                   serializers.CharField(),
                                           },
                                           many=True),
               tags=['User'],
               summary='Get list of roles')
@api_view(['GET'])
def get_user_roles(request, version):
    data = []
    for k, v in UserRoleTypes.FieldStr.items():
        data.append({
            'id': k,
            'value': v,
        })
    return Response(data, status=status.HTTP_200_OK)


class UserEditDeleteView(APIView):
    permission_classes = [IsAuthenticated, IsSuperAdmin | IsAdmin]

    @extend_schema(responses={200: UserDetailSerializer},
                   tags=['User'],
                   summary='To get user details')
    def get(self, request, user_id, version):
        instance = get_object_or_404(SystemUser, pk=user_id)
        return Response(UserDetailSerializer(instance=instance).data,
                        status=status.HTTP_200_OK)

    @extend_schema(responses={
        204:
            OpenApiResponse(description='Deletion with no response')
    },
        tags=['User'],
        summary='To delete user')
    def delete(self, request, user_id, version):
        instance = get_object_or_404(SystemUser, pk=user_id)
        instance.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

    @extend_schema(
        request=AddEditUserSerializer,
        responses={
            (200, 'application/json'):
                inline_serializer("Response",
                                  fields={"message": serializers.CharField()})
        },
        tags=['User'],
        description='Role Choice are SuperAdmin:1,Admin:2,Approver:3,'
                    'User:4',
        summary='To update user')
    def put(self, request, user_id, version):
        instance = get_object_or_404(SystemUser, pk=user_id)
        serializer = AddEditUserSerializer(data=request.data,
                                           context={'user': request.user},
                                           instance=instance)
        if not serializer.is_valid():
            return Response(
                {'message': validate_serializers_message(serializer.errors)},
                status=status.HTTP_400_BAD_REQUEST)
        serializer.save()
        return Response({'message': 'User updated successfully'},
                        status=status.HTTP_200_OK)
