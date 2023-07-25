from rest_framework import serializers
from api.v1.v1_mobile.models import MobileFormAssignment
from drf_spectacular.utils import extend_schema_field
from drf_spectacular.types import OpenApiTypes
from api.v1.v1_forms.models import Forms


class MobileFormListFormSerializer(serializers.ModelSerializer):
    """Serializer for Forms model."""

    form_id = serializers.IntegerField(source="id")
    name = serializers.CharField(read_only=True)

    @extend_schema_field(OpenApiTypes.STR)
    def get_name(self, obj):
        """Return form name."""
        return Forms.objects.get(id=obj.id).name

    def create(self, validated_data):
        """Create form."""
        return self.objects.create(**validated_data)

    class Meta:
        model = MobileFormAssignment
        fields = ["form_id", "name"]


class MobileFormAssignmentSerializer(serializers.ModelSerializer):
    """Serializer for MobileFormAssignment model."""

    id = serializers.IntegerField(read_only=True)
    name = serializers.CharField(read_only=True)
    user = serializers.SerializerMethodField()
    forms = MobileFormListFormSerializer(many=True)
    passcode = serializers.CharField(write_only=True)

    @extend_schema_field(OpenApiTypes.STR)
    def get_user(self, obj):
        """Return user email."""
        return obj.user.email

    class Meta:
        model = MobileFormAssignment
        fields = ["id", "name", "user", "forms", "passcode"]
