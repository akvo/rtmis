from django.core import signing
from django.core.signing import BadSignature
from drf_spectacular.types import OpenApiTypes
from drf_spectacular.utils import extend_schema_field
from rest_framework import serializers
from rest_framework.exceptions import ValidationError

from api.v1.v1_profile.constants import UserRoleTypes
from api.v1.v1_profile.models import Administration, Access
from api.v1.v1_users.models import SystemUser
from utils.custom_serializer_fields import CustomEmailField, CustomCharField, \
    CustomPrimaryKeyRelatedField, CustomChoiceField


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


class ListAdministrationChildrenSerializer(serializers.ModelSerializer):
    class Meta:
        model = Administration
        fields = ['id', 'parent', 'name']


class ListAdministrationSerializer(serializers.ModelSerializer):
    children = serializers.SerializerMethodField()
    level_name = serializers.ReadOnlyField(source='level.name')
    level = serializers.ReadOnlyField(source='level.level')

    @extend_schema_field(ListAdministrationChildrenSerializer(many=True))
    def get_children(self, instance: Administration):
        return ListAdministrationChildrenSerializer(
            instance=instance.parent_administration.all(), many=True).data

    class Meta:
        model = Administration
        fields = ['id', 'parent', 'name', 'level_name', 'level', 'children']


class UserSerializer(serializers.ModelSerializer):
    name = serializers.SerializerMethodField()

    @extend_schema_field(OpenApiTypes.STR)
    def get_name(self, instance):
        return instance.get_full_name()

    class Meta:
        model = SystemUser
        fields = ['email', 'name']


class AddUserSerializer(serializers.ModelSerializer):
    administration = CustomPrimaryKeyRelatedField(
        queryset=Administration.objects.none())
    role = CustomChoiceField(choices=list(UserRoleTypes.FieldStr.keys()))

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        self.fields.get(
            'administration').queryset = Administration.objects.all()

    def validate_role(self, role):
        if self.context.get(
                'user').user_access.role == UserRoleTypes.admin and \
                role not in [UserRoleTypes.approver, UserRoleTypes.user]:
            raise ValidationError({'You do not have permission to create '
                                   'user with selected role.'})
        return role

    def validate_administration(self, administration):
        if not self.context.get(
                'user').user_access.role == UserRoleTypes.super_admin \
                and administration.level.level <= self.context.get(
            'user').user_access.administration.level.level:
            raise ValidationError({'You do not have permission to create '
                                   'user with selected administration.'})
        return administration

    def validate(self, attrs):
        if attrs.get('role') != UserRoleTypes.super_admin and attrs.get(
                'administration').level.level == 0:
            raise ValidationError({
                'administration':
                    'administration level is not valid with selected role'})
        return attrs

    def create(self, validated_data):
        administration = validated_data.pop('administration')
        role = validated_data.pop('role')
        user = super(AddUserSerializer, self).create(validated_data)
        Access.objects.create(
            user=user,
            administration=administration,
            role=role
        )
        return user

    class Meta:
        model = SystemUser
        fields = ['first_name', 'last_name', 'email', 'administration', 'role']
