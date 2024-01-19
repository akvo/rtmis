import os
from typing import cast
import requests
import mimetypes
from rest_framework.request import Request

from rest_framework.viewsets import ModelViewSet
from api.v1.v1_mobile.authentication import (
        IsMobileAssignment, MobileAssignmentToken)
from rtmis.settings import (
    MASTER_DATA,
    BASE_DIR,
    APP_NAME,
    APK_UPLOAD_SECRET,
    WEBDOMAIN
)
from drf_spectacular.utils import extend_schema
from django.http import HttpResponse
from rest_framework import status, serializers
from rest_framework.response import Response
from rest_framework.decorators import (
    api_view,
    permission_classes,
    parser_classes,
)
from rest_framework.generics import get_object_or_404
from rest_framework.permissions import IsAuthenticated
from rest_framework.parsers import MultiPartParser
from drf_spectacular.utils import inline_serializer

from utils.custom_pagination import Pagination
from .serializers import (
    MobileAssignmentFormsSerializer,
    MobileApkSerializer,
    MobileAssignmentSerializer,
)
from .models import MobileAssignment, MobileApk
from api.v1.v1_forms.models import Forms, Questions, QuestionTypes
from api.v1.v1_profile.models import Access
from api.v1.v1_forms.serializers import WebFormDetailSerializer
from api.v1.v1_data.serializers import SubmitPendingFormSerializer
from api.v1.v1_files.serializers import UploadImagesSerializer
from api.v1.v1_files.functions import process_image
from utils.custom_helper import CustomPasscode
from utils.default_serializers import DefaultResponseSerializer
from utils.custom_serializer_fields import validate_serializers_message
from utils import storage

apk_path = os.path.join(BASE_DIR, MASTER_DATA)


@extend_schema(
    request=MobileAssignmentFormsSerializer,
    responses={200: MobileAssignmentFormsSerializer},
    tags=['Mobile Device Form'],
    summary='To get list of mobile forms',
    description='To get list of mobile forms',
)
@api_view(['POST'])
def get_mobile_forms(request, version):
    code = request.data.get('code')
    serializer = MobileAssignmentFormsSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(
            {'error': serializer.errors},
            status=status.HTTP_400_BAD_REQUEST,
        )
    try:
        passcode = CustomPasscode().encode(code)
        mobile_assignment = MobileAssignment.objects.get(passcode=passcode)
    except MobileAssignment.DoesNotExist:
        return Response(
            {'error': 'Mobile Assignment not found.'},
            status=status.HTTP_404_NOT_FOUND,
        )
    serializer = MobileAssignmentFormsSerializer(mobile_assignment)
    return Response(serializer.data, status=status.HTTP_200_OK)


@extend_schema(
    responses={200: WebFormDetailSerializer},
    tags=['Mobile Device Form'],
    summary='To get form in mobile form format',
)
@api_view(['GET'])
@permission_classes([IsMobileAssignment])
def get_mobile_form_details(request: Request, version, form_id):
    instance = get_object_or_404(Forms, pk=form_id)
    assignment = cast(MobileAssignmentToken, request.auth).assignment
    data = WebFormDetailSerializer(
        instance=instance,
        context={
            'user': assignment.user,
            'mobile_assignment': assignment,
        }
    ).data
    return Response(data, status=status.HTTP_200_OK)


def get_raw_token(request):
    """
    Extracts an unvalidated JSON web token from the given request.
    """
    encoding = 'iso-8859-1'
    auth_header_bytes = ('Bearer'.encode(encoding),)

    header = request.META.get('HTTP_AUTHORIZATION')
    if isinstance(header, str):
        header = header.encode(encoding)

    parts = header.split()

    if len(parts) == 0:
        # Empty AUTHORIZATION header sent
        return None

    if parts[0] not in auth_header_bytes:
        # Assume the header does not contain a JSON web token
        return None

    if len(parts) != 2:
        return None

    return parts[1].decode('utf-8')


@extend_schema(
    request=inline_serializer(
        name='SyncDeviceFormData',
        fields={
            'formId': serializers.IntegerField(),
            'name': serializers.CharField(),
            'duration': serializers.IntegerField(),
            'submittedAt': serializers.DateTimeField(),
            'submitter': serializers.CharField(),
            'geo': serializers.ListField(child=serializers.IntegerField()),
            'answers': serializers.DictField(),
        },
    ),
    responses={200: DefaultResponseSerializer},
    tags=['Mobile Device Form'],
    summary='Submit pending form data',
)
@api_view(['POST'])
@permission_classes([IsMobileAssignment])
def sync_pending_form_data(request, version):
    form = get_object_or_404(Forms, pk=request.data.get('formId'))
    assignment = cast(MobileAssignmentToken, request.auth).assignment
    user = assignment.user
    administration = Access.objects.filter(user=user).first().administration
    if not request.data.get('answers'):
        return Response(
            {'message': 'Answers is required.'},
            status=status.HTTP_400_BAD_REQUEST,
        )
    answers = []
    qna = request.data.get('answers')
    adm_id = administration.id
    adm_qs = Questions.objects.filter(
        type=QuestionTypes.administration,
        form_id=form.id
    ).first()
    adm_key = str(adm_qs.id) if adm_qs else None
    if adm_key and adm_key in qna:
        adm_id = qna[adm_key]
    for q in list(qna):
        answers.append({'question': q, 'value': qna[q]})
    data = {
        'data': {
            'administration': adm_id,
            'name': request.data.get('name'),
            'geo': request.data.get('geo'),
            'submitter': assignment.name,
            'duration': request.data.get('duration'),
        },
        'answer': answers,
    }
    serializer = SubmitPendingFormSerializer(
        data=data, context={'user': user, 'form': form}
    )
    if not serializer.is_valid():
        return Response(
            {
                'message': validate_serializers_message(serializer.errors),
                'details': serializer.errors,
            },
            status=status.HTTP_400_BAD_REQUEST,
        )
    serializer.save()
    return Response({'message': 'ok'}, status=status.HTTP_200_OK)


@extend_schema(tags=['Mobile Device Form'], summary='Get SQLITE File')
@api_view(['GET'])
def download_sqlite_file(request, version, file_name):
    file_path = os.path.join(BASE_DIR, MASTER_DATA, f'{file_name}')

    # Make sure the file exists and is accessible
    if not os.path.exists(file_path):
        return HttpResponse(
            {'message': 'File not found.'}, status=status.HTTP_404_NOT_FOUND
        )

    # Get the file's content type
    content_type, _ = mimetypes.guess_type(file_path)

    # Read the file content into a variable
    with open(file_path, 'rb') as file:
        file_content = file.read()

    # Create the response and set the appropriate headers
    response = HttpResponse(file_content, content_type=content_type)
    response['Content-Length'] = os.path.getsize(file_path)
    response['Content-Disposition'] = 'attachment; filename=%s' % file_name
    return response


@extend_schema(
    tags=['Mobile Device Form'],
    summary='Upload Images from Device',
    request=UploadImagesSerializer,
    responses={
        (200, 'application/json'): inline_serializer(
            'UploadImagesFromDevice',
            fields={'task_id': serializers.CharField()},
        )
    },
)
@api_view(['POST'])
@permission_classes([IsMobileAssignment])
@parser_classes([MultiPartParser])
def upload_image_form_device(request, version):
    serializer = UploadImagesSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(
            validate_serializers_message(serializer.errors),
            status=status.HTTP_400_BAD_REQUEST,
        )
    filename = process_image(request)
    return Response(
        {
            'message': 'File uploaded successfully',
            'file': f'{WEBDOMAIN}/images/{filename}',
        },
        status=status.HTTP_200_OK,
    )


@extend_schema(tags=['Mobile APK'], summary='Get APK File')
@api_view(['GET'])
def download_apk_file(request, version):
    apk = MobileApk.objects.last()
    if not apk:
        return Response(
            {'message': 'APK not found.'}, status=status.HTTP_404_NOT_FOUND
        )
    file_name = f'{APP_NAME}-{apk.apk_version}.apk'
    cache_file_name = os.path.join(apk_path, file_name)
    if os.path.exists(cache_file_name):
        # Get the file's content type
        content_type, _ = mimetypes.guess_type(cache_file_name)
        # Read the file content into a variable
        with open(cache_file_name, 'rb') as file:
            file_content = file.read()
        # Create the response and set the appropriate headers
        response = HttpResponse(file_content, content_type=content_type)
        response['Content-Length'] = os.path.getsize(cache_file_name)
        response['Content-Disposition'] = (
            'attachment; filename=%s' % f'{file_name}'
        )
        return response
    download = requests.get(apk.apk_url)
    if download.status_code != 200:
        return HttpResponse(
            {'message': 'File not found.'}, status=status.HTTP_404_NOT_FOUND
        )
    file_cache = open(cache_file_name, 'wb')
    file_cache.write(download.content)
    file_cache.close()
    # Get the file's content type
    content_type, _ = mimetypes.guess_type(cache_file_name)
    # Read the file content into a variable
    with open(cache_file_name, 'rb') as file:
        file_content = file.read()
    # Read the file content into a variable
    response = HttpResponse(file_content, content_type=content_type)
    response['Content-Length'] = os.path.getsize(cache_file_name)
    response['Content-Disposition'] = (
        'attachment; filename=%s' % f'{file_name}'
    )
    return response


@extend_schema(
    request=inline_serializer(
        name='UploadAPKFile',
        fields={
            'apk_url': serializers.FileField(),
            'apk_version': serializers.CharField(),
            'secret': serializers.CharField(),
        },
    ),
    tags=['Mobile APK'],
    summary='Post APK File',
)
@api_view(['POST'])
def upload_apk_file(request, version):
    if request.data.get('secret') != APK_UPLOAD_SECRET:
        return Response(
            {'message': 'Secret is required.'},
            status=status.HTTP_400_BAD_REQUEST,
        )
    serializer = MobileApkSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(
            {'message': serializer.errors}, status=status.HTTP_400_BAD_REQUEST
        )
    apk_version = serializer.validated_data.get('apk_version')
    download = requests.get(
        request.data.get('apk_url'), allow_redirects=True, stream=True
    )
    if download.status_code != 200:
        return HttpResponse(
            {'message': 'File not found.'}, status=status.HTTP_404_NOT_FOUND
        )
    filename = f'{APP_NAME}-{apk_version}.apk'
    cache_file_name = os.path.join(apk_path, filename)
    file_cache = open(cache_file_name, 'wb')
    file_cache.write(download.content)
    file_cache.close()
    storage.upload(cache_file_name, folder="apk", filename=f'{APP_NAME}.apk')
    serializer.save()
    return Response({'message': 'ok'}, status=status.HTTP_201_CREATED)


@extend_schema(tags=['Mobile Assignment'])
class MobileAssignmentViewSet(ModelViewSet):
    serializer_class = MobileAssignmentSerializer
    permission_classes = [IsAuthenticated]
    pagination_class = Pagination

    def get_queryset(self):
        user = self.request.user
        return MobileAssignment.objects\
            .prefetch_related('administrations', 'forms')\
            .filter(user=user)\
            .order_by('id')
