from rest_framework import serializers

from api.v1.v1_forms.models import Forms
from api.v1.v1_jobs.constants import JobTypes, JobStatus
from api.v1.v1_jobs.models import Jobs
from api.v1.v1_profile.models import Administration
from utils.custom_serializer_fields import CustomPrimaryKeyRelatedField


class GenerateDownloadRequestSerializer(serializers.Serializer):
    form_id = CustomPrimaryKeyRelatedField(queryset=Forms.objects.none())
    administration_id = CustomPrimaryKeyRelatedField(
        queryset=Administration.objects.none(), required=False)

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        self.fields.get('form_id').queryset = Forms.objects.all()
        self.fields.get(
            'administration_id').queryset = Administration.objects.all()


class DownloadListSerializer(serializers.ModelSerializer):
    type = serializers.SerializerMethodField()
    status = serializers.SerializerMethodField()
    created_by = serializers.ReadOnlyField(source='user.id')

    def get_type(self, instance):
        return JobTypes.FieldStr.get(instance.type)

    def get_status(self, instance):
        return JobStatus.FieldStr.get(instance.status)

    class Meta:
        model = Jobs
        fields = ['id', 'type', 'status', 'info', 'attempt', 'created_by',
                  'created', 'result', 'available']
