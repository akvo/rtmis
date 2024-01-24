from typing import Any, Dict
from rest_framework import serializers
from drf_spectacular.utils import extend_schema_field
from api.v1.v1_forms.models import Forms
from drf_spectacular.types import OpenApiTypes
from api.v1.v1_mobile.authentication import MobileAssignmentToken
from api.v1.v1_profile.models import Administration, Levels
from utils.custom_serializer_fields import CustomCharField
from api.v1.v1_mobile.models import MobileAssignment, MobileApk
from utils.custom_helper import CustomPasscode, generate_random_string


class MobileAssignmentAdministrationSerializer(serializers.ModelSerializer):
    id = serializers.IntegerField()
    name = serializers.SerializerMethodField()

    def get_name(self, obj):
        return obj.full_path_name

    class Meta:
        model = Administration
        fields = ["id", "name"]


class MobileFormSerializer(serializers.ModelSerializer):
    id = serializers.IntegerField()
    version = serializers.CharField()
    url = serializers.SerializerMethodField()

    @extend_schema_field(OpenApiTypes.URI)
    def get_url(self, obj):
        return f"/form/{obj.id}"

    class Meta:
        model = Forms
        fields = ["id", "version", "url"]


class MobileAssignmentFormsSerializer(serializers.Serializer):
    code = CustomCharField(max_length=255, write_only=True)
    name = serializers.CharField(read_only=True)
    syncToken = serializers.SerializerMethodField()
    formsUrl = serializers.SerializerMethodField()
    administrations = serializers.SerializerMethodField()

    @extend_schema_field(MobileFormSerializer(many=True))
    def get_formsUrl(self, obj):
        return MobileFormSerializer(obj.forms.all(), many=True).data

    @extend_schema_field(MobileAssignmentAdministrationSerializer(many=True))
    def get_administrations(self, obj):
        lowest_level = Levels.objects.order_by("-level").first()
        all_lowest_levels = []
        for adm in obj.administrations.all():
            if adm.level == lowest_level:
                all_lowest_levels.append(adm)
                continue
            administration = Administration.objects.filter(
                path__startswith=adm.path,
                level=lowest_level,
            ).all()
            all_lowest_levels.extend(administration)
        return MobileAssignmentAdministrationSerializer(
            all_lowest_levels, many=True
        ).data

    def get_syncToken(self, obj):
        return str(MobileAssignmentToken.for_assignment(obj))

    def validate_code(self, value):
        passcode = CustomPasscode().encode(value)
        if not MobileAssignment.objects.filter(passcode=passcode).exists():
            raise serializers.ValidationError("Invalid passcode")
        return value

    class Meta:
        fields = ["name", "syncToken", "formsUrl", "code", "administrations"]


class IdAndNameRelatedField(serializers.PrimaryKeyRelatedField):
    def use_pk_only_optimization(self) -> bool:
        return False

    def to_representation(self, value):
        return {
            "id": value.pk,
            "name": value.name,
        }


class MobileAssignmentSerializer(serializers.ModelSerializer):
    forms = IdAndNameRelatedField(queryset=Forms.objects.all(), many=True)
    administrations = IdAndNameRelatedField(
        queryset=Administration.objects.all(), many=True
    )
    passcode = serializers.SerializerMethodField()

    class Meta:
        model = MobileAssignment
        fields = ["id", "name", "passcode", "forms", "administrations"]
        read_only_fields = ["passcode"]

    def create(self, validated_data: Dict[str, Any]):
        user = self.context.get("request").user
        passcode = CustomPasscode().encode(generate_random_string(8))
        validated_data.update({
            "user": user,
            "passcode": passcode
        })
        return super().create(validated_data)

    def get_passcode(self, obj):
        return CustomPasscode().decode(obj.passcode)


class MobileApkSerializer(serializers.Serializer):
    apk_version = serializers.CharField(max_length=50)
    apk_url = serializers.CharField(max_length=255)
    created_at = serializers.DateTimeField(read_only=True)

    def create(self, validated_data):
        return MobileApk.objects.create(**validated_data)

    class Meta:
        model = MobileApk
        fields = ["apk_version", "apk_url", "created_at"]
