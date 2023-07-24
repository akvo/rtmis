from rest_framework import serializers
from api.v1.v1_mobile.models import MobileFormAssignment
from api.v1.v1_forms.serializers import ListFormSerializer


class MobileFormAssignmentSerializer(serializers.ModelSerializer):
    """Serializer for MobileFormAssignment model."""

    id = serializers.IntegerField(read_only=True)
    name = serializers.CharField(read_only=True)
    user = serializers.SerializerMethodField()
    forms = serializers.SerializerMethodField()

    def get_user(self, obj):
        """Return user email."""
        return obj.user.email

    def get_forms(self, obj):
        """Return list of forms."""
        return ListFormSerializer(obj.forms.all(), many=True).data

    class Meta:
        model = MobileFormAssignment
        fields = ["id", "name", "user", "forms"]
