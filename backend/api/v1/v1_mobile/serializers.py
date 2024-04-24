from typing import Any, Dict
from rtmis.settings import WEBDOMAIN
from rest_framework import serializers
from drf_spectacular.utils import extend_schema_field
from api.v1.v1_forms.models import Forms, SubmissionTypes
from drf_spectacular.types import OpenApiTypes
from api.v1.v1_mobile.authentication import MobileAssignmentToken
from api.v1.v1_profile.models import Administration, Entity
from api.v1.v1_profile.serializers import RelatedAdministrationField
from utils.custom_serializer_fields import CustomCharField
from api.v1.v1_mobile.models import MobileAssignment, MobileApk
from api.v1.v1_data.models import FormData
from utils.custom_helper import CustomPasscode, generate_random_string


class MobileDataPointDownloadListSerializer(serializers.Serializer):
    id = serializers.IntegerField()
    form_id = serializers.IntegerField()
    name = serializers.CharField()
    administration_id = serializers.IntegerField()
    url = serializers.SerializerMethodField()
    last_updated = serializers.SerializerMethodField()
    is_certified = serializers.SerializerMethodField()

    @extend_schema_field(OpenApiTypes.URI)
    def get_url(self, obj):
        return f"{WEBDOMAIN}/datapoints/{obj.get('uuid')}.json"

    @extend_schema_field(OpenApiTypes.DATETIME)
    def get_last_updated(self, obj):
        return obj["updated"] if obj["updated"] else obj["created"]

    @extend_schema_field(OpenApiTypes.BOOL)
    def get_is_certified(self, obj):
        certification = FormData.objects.filter(
            uuid=obj["uuid"],
            submission_type=SubmissionTypes.certification
        ).first()
        return True if certification else False

    class Meta:
        fields = [
            "id",
            "form_id",
            "name",
            "administration_id",
            "url",
            "last_updated",
        ]


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
    certifications = serializers.SerializerMethodField()

    @extend_schema_field(MobileFormSerializer(many=True))
    def get_formsUrl(self, obj):
        return MobileFormSerializer(obj.forms.all(), many=True).data

    def get_syncToken(self, obj):
        return str(MobileAssignmentToken.for_assignment(obj))

    def validate_code(self, value):
        passcode = CustomPasscode().encode(value)
        if not MobileAssignment.objects.filter(passcode=passcode).exists():
            raise serializers.ValidationError("Invalid passcode")
        return value

    def get_certifications(self, obj):
        return obj.certifications.values_list("id", flat=True)

    class Meta:
        fields = ["name", "syncToken", "formsUrl", "code", "certifications"]


class IdAndNameRelatedField(serializers.PrimaryKeyRelatedField):
    def use_pk_only_optimization(self) -> bool:
        return False

    def to_representation(self, value):
        return {
            "id": value.pk,
            "name": value.name,
        }


class FormsAndEntityValidation(serializers.PrimaryKeyRelatedField):
    def use_pk_only_optimization(self) -> bool:
        return False

    def to_representation(self, value):
        return {
            "id": value.pk,
            "name": value.name,
        }

    def get_queryset(self):
        queryset = super().get_queryset()
        request = self.context.get("request")
        selected_adm = request.data.get("administrations") if request else None
        selected_forms = request.data.get("forms") if request else None
        entity_forms = queryset.filter(
            pk__in=selected_forms, form_questions__extra__icontains="entity"
        ).distinct()
        if entity_forms.exists():
            forms = entity_forms.all()
            no_data = []
            for f in forms:
                questions = f.form_questions.filter(extra__icontains="entity")
                for q in questions:
                    entity = Entity.objects.filter(
                        name=q.extra.get("name")
                    ).first()
                    if not entity:
                        no_data.append(
                            {
                                "form": f.id,
                                "entity": q.extra.get("name"),
                                "exists": False,
                            }
                        )
                    if entity and selected_adm:
                        entity_has_data = entity.entity_data.filter(
                            administration__in=selected_adm
                        )
                        if not entity_has_data.exists():
                            no_data.append(
                                {
                                    "form": f.id,
                                    "entity": entity.name,
                                    "exists": True,
                                }
                            )
            if len(no_data) > 0:
                raise serializers.ValidationError(no_data)

        return queryset


class MobileAssignmentSerializer(serializers.ModelSerializer):
    forms = FormsAndEntityValidation(queryset=Forms.objects.all(), many=True)
    administrations = IdAndNameRelatedField(
        queryset=Administration.objects.all(), many=True
    )
    certifications = RelatedAdministrationField(
        queryset=Administration.objects.all(), many=True, required=False
    )
    passcode = serializers.SerializerMethodField()
    created_by = serializers.ReadOnlyField(source="user.email")

    class Meta:
        model = MobileAssignment
        fields = [
            "id",
            "name",
            "passcode",
            "forms",
            "administrations",
            "created_by",
            "certifications",
        ]
        read_only_fields = ["passcode"]

    def create(self, validated_data: Dict[str, Any]):
        user = self.context.get("request").user
        passcode = CustomPasscode().encode(generate_random_string(8))
        validated_data.update({"user": user, "passcode": passcode})
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
