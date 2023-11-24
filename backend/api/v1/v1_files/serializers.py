from django.core.validators import FileExtensionValidator
from rest_framework import serializers
from utils.custom_serializer_fields import CustomFileField


class UploadImagesSerializer(serializers.Serializer):
    file = CustomFileField(
        validators=[FileExtensionValidator(["jpg", "png", "jpeg"])]
    )
