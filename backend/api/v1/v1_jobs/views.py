# Create your views here.
import re

from wsgiref.util import FileWrapper

from uuid import uuid4
from django.core.files.storage import FileSystemStorage
from django.core.management import call_command
from django.http import HttpResponse
from django_q.tasks import async_task
from drf_spectacular.types import OpenApiTypes
from drf_spectacular.utils import extend_schema, OpenApiParameter, \
    inline_serializer
from rest_framework import status, serializers
from rest_framework.decorators import api_view, permission_classes, \
    parser_classes
from rest_framework.exceptions import NotFound
from rest_framework.generics import get_object_or_404
from rest_framework.pagination import PageNumberPagination
from rest_framework.parsers import MultiPartParser
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.fields import ChoiceField

from api.v1.v1_forms.models import Forms
from api.v1.v1_jobs.constants import JobStatus, JobTypes
from api.v1.v1_jobs.models import Jobs
from api.v1.v1_jobs.serializers import GenerateDownloadRequestSerializer, \
    DownloadListSerializer, UploadExcelSerializer
from utils import storage
from utils.custom_serializer_fields import validate_serializers_message
from utils.storage import download


@extend_schema(parameters=[
    OpenApiParameter(name='administration_id',
                     required=False,
                     type=OpenApiTypes.NUMBER,
                     location=OpenApiParameter.QUERY),
    OpenApiParameter(name='form_id',
                     required=True,
                     type=OpenApiTypes.NUMBER,
                     location=OpenApiParameter.QUERY)
],
               responses={
                   (200, 'application/json'):
                   inline_serializer("GenerateDownload",
                                     fields={
                                         "task_id": serializers.CharField(),
                                         "file_url": serializers.CharField()
                                     })
               },
               tags=['Job'],
               summary='To generate download')
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def download_generate(request, version):
    serializer = GenerateDownloadRequestSerializer(data=request.GET)
    if not serializer.is_valid():
        return Response(
            {'message': validate_serializers_message(serializer.errors)},
            status=status.HTTP_400_BAD_REQUEST)
    administration = serializer.validated_data.get('administration_id')
    result = call_command('job_download',
                          serializer.validated_data.get('form_id').id,
                          request.user.id, '-a',
                          administration.id if administration else 0)
    job = Jobs.objects.get(pk=result)
    data = {
        'task_id': job.task_id,
        'file_url': '/download/file/{0}'.format(job.result),
    }
    return Response(data, status=status.HTTP_200_OK)


@extend_schema(description='To get the status of download',
               tags=['Job'],
               responses={
                   (200, 'application/json'):
                   inline_serializer("DownloadStatus",
                                     fields={
                                         "status":
                                         ChoiceField(choices=[
                                             JobStatus.FieldStr[d]
                                             for d in JobStatus.FieldStr
                                         ])
                                     })
               })
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def download_status(request, version, task_id):
    job = get_object_or_404(Jobs, task_id=task_id)
    return Response({'status': JobStatus.FieldStr.get(job.status)},
                    status=status.HTTP_200_OK)


@extend_schema(
    tags=['Job'],
    summary='Download file',
)
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def download_file(request, version, file_name):
    job = get_object_or_404(Jobs, result=file_name)
    url = f"download/{job.result}"
    filepath = download(url)
    filename = job.result
    zip_file = open(filepath, 'rb')
    response = HttpResponse(
        FileWrapper(zip_file),
        content_type='application/vnd.openxmlformats-officedocument'
        '.spreadsheetml.sheet')
    response['Content-Disposition'] = 'attachment; filename="%s"' % filename
    return response


@extend_schema(tags=['Job'],
               summary='Download list',
               responses=DownloadListSerializer(many=True),
               parameters=[
                   OpenApiParameter(name='page',
                                    required=True,
                                    type=OpenApiTypes.NUMBER,
                                    location=OpenApiParameter.QUERY)
               ])
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def download_list(request, version):
    queryset = request.user.user_jobs.filter(
        type=JobTypes.download).order_by('-created')
    paginator = PageNumberPagination()
    paginator.page_size = 5
    try:
        instance = paginator.paginate_queryset(queryset, request)
        return Response(DownloadListSerializer(instance=instance,
                                               many=True).data,
                        status=status.HTTP_200_OK)
    except NotFound:
        return Response([], status=status.HTTP_200_OK)


@extend_schema(
    tags=['Job'],
    summary='Upload Excel',
    request=UploadExcelSerializer,
    responses={
        (200, 'application/json'):
        inline_serializer("UploadExcel",
                          fields={"task_id": serializers.CharField()})
    },
)
@api_view(['POST'])
@parser_classes([MultiPartParser])
@permission_classes([IsAuthenticated])
def upload_excel(request, form_id, version):
    form = get_object_or_404(Forms, pk=form_id)
    serializer = UploadExcelSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(
            {'message': validate_serializers_message(serializer.errors)},
            status=status.HTTP_400_BAD_REQUEST)
    fs = FileSystemStorage()
    file = fs.save(f"./tmp/{serializer.validated_data.get('file').name}",
                   serializer.validated_data.get('file'))
    file_path = fs.path(file)
    # filename format: form_name--user_name-<4_digit_autogerated>
    uuid = "_".join(str(uuid4()).split("-")[:-1])
    user_name = "{0}_{1}".format(
        request.user.first_name, request.user.last_name)
    form_name = re.sub(r'[\W_]+', '_', form.name)
    filename = f"{form_name}-{user_name}-{uuid}.xlsx"
    storage.upload(file=file_path, filename=filename, folder='upload')
    job = Jobs.objects.create(type=JobTypes.validate_data,
                              status=JobStatus.on_progress,
                              user=request.user,
                              info={
                                  'file':
                                  filename,
                                  'form':
                                  form_id,
                                  'administration':
                                  request.user.user_access.administration_id
                              })
    task_id = async_task('api.v1.v1_jobs.job.validate_excel',
                         job.id,
                         hook='api.v1.v1_jobs.job.validate_excel_result')
    job.task_id = task_id
    job.save()

    return Response({'task_id': task_id}, status=status.HTTP_200_OK)
