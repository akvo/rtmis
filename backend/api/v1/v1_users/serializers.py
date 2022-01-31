from django.core import signing
from django.core.signing import BadSignature
from rest_framework import serializers
from rest_framework.exceptions import ValidationError

from api.v1.v1_users.models import SystemUser
from utils.custom_serializer_fields import CustomEmailField, CustomCharField


class LoginSerializer(serializers.Serializer):
    email = CustomEmailField()
    password = CustomCharField()


class VerifyInviteSerializer(serializers.Serializer):
    invite = CustomCharField()

    def validate_invite(self, invite):
        try:
            pk = signing.loads(invite)
            user = SystemUser.objects.get(pk=pk)
        except BadSignature:
            raise ValidationError('Invalid invite code')
        except SystemUser.DoesNotExist:
            raise ValidationError('Invalid invite code')
        return user


class UserSerializer(serializers.ModelSerializer):
    name = serializers.SerializerMethodField()

    # TODO: Replace with dynamic name
    def get_name(self, instance):
        return 'John Doe'

    class Meta:
        model = SystemUser
        fields = ['email', 'name']
