from typing import Any, Dict
from rest_framework import serializers
from drf_spectacular.utils import extend_schema_field
from rest_framework_simplejwt.tokens import RefreshToken
from api.v1.v1_forms.models import Forms, UserForms
from drf_spectacular.types import OpenApiTypes
from api.v1.v1_profile.models import Administration
from utils.custom_serializer_fields import CustomCharField
from api.v1.v1_profile.constants import UserRoleTypes
from api.v1.v1_mobile.models import MobileAssignment, MobileApk
from utils.custom_helper import CustomPasscode, generate_random_string


class MobileFormSerializer(serializers.ModelSerializer):
    id = serializers.IntegerField()
    version = serializers.CharField()
    url = serializers.SerializerMethodField()

    @extend_schema_field(OpenApiTypes.URI)
    def get_url(self, obj):
        return f'/form/{obj.id}'

    class Meta:
        model = Forms
        fields = ['id', 'version', 'url']


class MobileAssignmentFormsSerializer(serializers.Serializer):
    syncToken = serializers.CharField(source='token', read_only=True)
    formsUrl = serializers.SerializerMethodField()
    code = CustomCharField(max_length=255, write_only=True)

    @extend_schema_field(MobileFormSerializer(many=True))
    def get_formsUrl(self, obj):
        user_forms = UserForms.objects.filter(user=obj.user)
        if obj.user.user_access.role == UserRoleTypes.super_admin:
            return MobileFormSerializer(Forms.objects.all(), many=True).data
        return MobileFormSerializer(
            [form.form for form in user_forms], many=True
        ).data

    def validate_code(self, value):
        passcode = CustomPasscode().encode(value)
        if not MobileAssignment.objects.filter(passcode=passcode).exists():
            raise serializers.ValidationError('Invalid passcode')
        return value

    def to_representation(self, instance):
        data = super().to_representation(instance)
        data.pop('code', None)
        return data

    class Meta:
        fields = ['syncToken', 'formsUrl', 'code']


class IdAndNameRelatedField(serializers.PrimaryKeyRelatedField):
    def use_pk_only_optimization(self) -> bool:
        return False

    def to_representation(self, value):
        return {
            'id': value.pk,
            'name': value.name,
        }


class MobileAssignmentSerializer(serializers.ModelSerializer):
    forms = IdAndNameRelatedField(queryset=Forms.objects.all(), many=True)
    administrations = IdAndNameRelatedField(
            queryset=Administration.objects.all(), many=True)

    class Meta:
        model = MobileAssignment
        fields = [
            'id',
            'name',
            'passcode',
            'forms',
            'administrations'
        ]
        read_only_fields = ['passcode']

    def create(self, validated_data: Dict[str, Any]):
        user = self.context.get('request').user
        token = RefreshToken.for_user(user)
        passcode = CustomPasscode().encode(generate_random_string(8))
        validated_data.update({
            'user': user, 'token': token, 'passcode': passcode})
        instance = super().create(validated_data)
        return instance


class MobileApkSerializer(serializers.Serializer):
    apk_version = serializers.CharField(max_length=50)
    apk_url = serializers.CharField(max_length=255)
    created_at = serializers.DateTimeField(read_only=True)

    def create(self, validated_data):
        return MobileApk.objects.create(**validated_data)

    class Meta:
        model = MobileApk
        fields = ['apk_version', 'apk_url', 'created_at']
