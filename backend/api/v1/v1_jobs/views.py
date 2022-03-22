# Create your views here.
from django.core.management import call_command
from django_q.tasks import result
from drf_spectacular.types import OpenApiTypes
from drf_spectacular.utils import extend_schema, OpenApiParameter, \
    inline_serializer
from rest_framework import status, serializers
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from api.v1.v1_jobs.models import Jobs
from api.v1.v1_jobs.serializers import GenerateDownloadRequestSerializer
from utils.custom_serializer_fields import validate_serializers_message


@extend_schema(parameters=[
    OpenApiParameter(name='administration_id',
                     required=False,
                     type=OpenApiTypes.NUMBER,
                     location=OpenApiParameter.QUERY),
    OpenApiParameter(name='form_id',
                     required=True,
                     type=OpenApiTypes.NUMBER,
                     location=OpenApiParameter.QUERY),
],
    responses={
        (200, 'application/json'): inline_serializer(
            "GenerateDownload",
            fields={
                "task_id": serializers.CharField(),
                "file_url": serializers.CharField(),
            })},
    tags=['Job'],
    summary='To generate download')
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def download_generate(request, version):
    Jobs.objects.all().delete()
    serializer = GenerateDownloadRequestSerializer(data=request.GET)
    if not serializer.is_valid():
        return Response(
            {'message': validate_serializers_message(serializer.errors)},
            status=status.HTTP_400_BAD_REQUEST)
    administration = serializer.validated_data.get('administration_id')
    result = call_command(
        'job_download',
        serializer.validated_data.get('form_id').id,
        request.user.id,
        '-a', administration.id if administration else 0
    )
    job = Jobs.objects.get(pk=result)
    data = {
        'task_id': job.task_id,
        'file_url': '/download/file/{0}'.format(job.result),
    }
    return Response(data, status=status.HTTP_200_OK)


@extend_schema(description='To get the result of job', tags=['Job'],
               parameters=[
                   OpenApiParameter(name='task_id',
                                    required=False,
                                    type=OpenApiTypes.STR,
                                    location=OpenApiParameter.QUERY),
               ])
@api_view(['GET'])
def job_check(request, version):
    r = result(request.GET.get('task_id'))
    if r:
        return Response({'message': r}, status=status.HTTP_200_OK)
    return Response({'message': 'Job is in-progress'},
                    status=status.HTTP_200_OK)
