from rest_framework import serializers
from api.v1.v1_mobile.models import MobileFormAssignment


class MobileFormListFormSerializer(serializers.ModelSerializer):
    """Serializer for Forms model."""

    id = serializers.IntegerField(read_only=True)
    name = serializers.CharField(read_only=True)
    forms = serializers.SerializerMethodField()

    def create(self, validated_data):
        """Create form."""
        return self.objects.create(**validated_data)

    class Meta:
        model = MobileFormAssignment
        fields = ["id", "name"]


class MobileFormAssignmentSerializer(serializers.ModelSerializer):
    """Serializer for MobileFormAssignment model."""

    id = serializers.IntegerField(read_only=True)
    name = serializers.CharField(read_only=True)
    user = serializers.SerializerMethodField()
    forms = serializers.SerializerMethodField()
    passcode = serializers.CharField(write_only=True)

    def get_user(self, obj):
        """Return user email."""
        return obj.user.email

    def get_forms(self, obj):
        """Return list of forms."""
        return MobileFormListFormSerializer(obj.forms.all(), many=True).data

    class Meta:
        model = MobileFormAssignment
        fields = ["id", "name", "user", "forms", "passcode"]
