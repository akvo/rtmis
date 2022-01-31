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


class SetUserPasswordSerializer(serializers.Serializer):
    password = CustomCharField()
    confirm_password = CustomCharField()
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

    def validate(self, attrs):
        if attrs.get('password') != attrs.get('confirm_password'):
            raise ValidationError({
                'confirm_password': 'Confirm password and password'
                                    ' are not same'})
        return attrs


class UserSerializer(serializers.ModelSerializer):
    name = serializers.SerializerMethodField()

    def get_name(self, instance):
        return instance.get_full_name()

    class Meta:
        model = SystemUser
        fields = ['email', 'name']
