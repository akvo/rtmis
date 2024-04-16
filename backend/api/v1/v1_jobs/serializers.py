from django.core.validators import FileExtensionValidator
from rest_framework import serializers

from drf_spectacular.utils import extend_schema_field
from drf_spectacular.types import OpenApiTypes
from api.v1.v1_forms.models import Forms
from api.v1.v1_jobs.constants import JobTypes, JobStatus, DataDownloadTypes
from api.v1.v1_jobs.models import Jobs
from api.v1.v1_profile.models import Administration, AdministrationAttribute
from utils.custom_serializer_fields import CustomPrimaryKeyRelatedField, \
    CustomFileField, CustomChoiceField


class DownloadDataRequestSerializer(serializers.Serializer):
    form_id = CustomPrimaryKeyRelatedField(queryset=Forms.objects.none())
    administration_id = CustomPrimaryKeyRelatedField(
        queryset=Administration.objects.none(), required=False)
    type = serializers.ChoiceField(
        choices=[
            DataDownloadTypes.FieldStr[d] for d in DataDownloadTypes.FieldStr
        ]
    )

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        self.fields.get('form_id').queryset = Forms.objects.all()
        self.fields.get(
            'administration_id').queryset = Administration.objects.all()


class DownloadListSerializer(serializers.ModelSerializer):
    type = serializers.SerializerMethodField()
    category = serializers.SerializerMethodField()
    status = serializers.SerializerMethodField()
    administration = serializers.SerializerMethodField()
    date = serializers.DateTimeField(
        source='available', format="%B %d, %Y %I:%M %p")
    form = serializers.SerializerMethodField()
    attributes = serializers.SerializerMethodField()

    @extend_schema_field(CustomChoiceField(
        choices=[JobTypes.FieldStr[d] for d in JobTypes.FieldStr]))
    def get_category(self, instance):
        job_type = JobTypes.FieldStr.get(instance.type)
        if job_type == 'download_administration':
            return 'Administration List'
        if job_type == 'download_entities':
            return 'Entities'
        return 'Form Data'

    @extend_schema_field(CustomChoiceField(
        choices=[JobStatus.FieldStr[d] for d in JobStatus.FieldStr]))
    def get_status(self, instance):
        return JobStatus.FieldStr.get(instance.status)

    @extend_schema_field(OpenApiTypes.STR)
    def get_administration(self, instance):
        admin_id = instance.info.get('administration') or instance.info.get(
            'adm_id')
        if admin_id:
            return Administration.objects.get(pk=admin_id).full_name
        return None

    @extend_schema_field(OpenApiTypes.STR)
    def get_form(self, instance):
        form_id = instance.info.get('form_id')
        if form_id:
            return Forms.objects.get(pk=form_id).name
        return None

    @extend_schema_field(CustomChoiceField(
        choices=[JobTypes.FieldStr[d] for d in JobTypes.FieldStr]))
    def get_type(self, instance):
        return JobTypes.FieldStr.get(instance.type)

    @extend_schema_field(OpenApiTypes.ANY)
    def get_attributes(self, instance):
        if instance.type == JobTypes.download_entities:
            return instance.info.get("entities")
        if instance.type == JobTypes.download_administration:
            attributes = AdministrationAttribute.objects.filter(
                pk__in=instance.info.get("attributes")
            ).values("id", "name")
            attributes = [a for a in attributes]
            return attributes
        return instance.info.get("attributes")

    class Meta:
        model = Jobs
        fields = ['id', 'task_id', 'type', 'status', 'form',
                  'category', 'administration', 'date', 'result', 'attributes']


class UploadExcelSerializer(serializers.Serializer):
    file = CustomFileField(validators=[FileExtensionValidator(['xlsx'])])
    is_update = serializers.BooleanField(default=False)
