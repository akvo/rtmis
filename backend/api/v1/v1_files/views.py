from rtmis.settings import WEBDOMAIN
from .serializers import UploadImagesSerializer
from rest_framework import serializers
from drf_spectacular.utils import extend_schema, inline_serializer
from rest_framework.decorators import (
    api_view,
    permission_classes,
    parser_classes,
)
from rest_framework.parsers import MultiPartParser
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from .functions import process_image
from utils.custom_serializer_fields import validate_serializers_message


@extend_schema(
    tags=["Files"],
    summary="Upload Images",
    request=UploadImagesSerializer,
    responses={
        (200, "application/json"): inline_serializer(
            "UploadImages", fields={"task_id": serializers.CharField()}
        )
    },
)
@api_view(["POST"])
@permission_classes([IsAuthenticated])
@parser_classes([MultiPartParser])
def upload_images(request, version):
    serializer = UploadImagesSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(
            validate_serializers_message(serializer.errors),
            status=status.HTTP_400_BAD_REQUEST,
        )
    filename = process_image(request)
    return Response(
        {
            "message": "File uploaded successfully",
            "file": f"{WEBDOMAIN}/images/{filename}",
        },
        status=status.HTTP_200_OK,
    )
