from django.core import signing
from django.core.signing import BadSignature
from django.utils import timezone
from drf_spectacular.types import OpenApiTypes
from drf_spectacular.utils import extend_schema_field, inline_serializer
from rest_framework import serializers
from rest_framework.exceptions import ValidationError

from api.v1.v1_data.constants import DataApprovalStatus
from api.v1.v1_forms.models import FormApprovalAssignment, UserForms, Forms
from api.v1.v1_forms.constants import FormTypes
from api.v1.v1_profile.constants import UserRoleTypes
from api.v1.v1_profile.models import Administration, Access, Levels
from api.v1.v1_users.models import SystemUser
from utils.custom_serializer_fields import CustomEmailField, CustomCharField, \
    CustomPrimaryKeyRelatedField, CustomChoiceField, CustomBooleanField


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
                'confirm_password':
                'Confirm password and password'
                ' are not same'
            })
        return attrs


class ListAdministrationChildrenSerializer(serializers.ModelSerializer):
    class Meta:
        model = Administration
        fields = ['id', 'parent', 'name']


class ListAdministrationSerializer(serializers.ModelSerializer):
    children = serializers.SerializerMethodField()
    level_name = serializers.ReadOnlyField(source='level.name')
    level = serializers.ReadOnlyField(source='level.level')
    children_level_name = serializers.SerializerMethodField()

    @extend_schema_field(ListAdministrationChildrenSerializer(many=True))
    def get_children(self, instance: Administration):
        filter = self.context.get('filter')
        if filter:
            filtered_administration = Administration.objects.filter(
                id=filter).all()
            return ListAdministrationChildrenSerializer(
                filtered_administration, many=True).data
        return ListAdministrationChildrenSerializer(
            instance=instance.parent_administration.all(), many=True).data

    def get_children_level_name(self, instance: Administration):
        child: Administration = instance.parent_administration.first()
        if child:
            return child.level.name
        return None

    class Meta:
        model = Administration
        fields = [
            'id', 'parent', 'name', 'level_name', 'level', 'children',
            'children_level_name'
        ]


class AddEditUserSerializer(serializers.ModelSerializer):
    administration = CustomPrimaryKeyRelatedField(
        queryset=Administration.objects.none())
    role = CustomChoiceField(choices=list(UserRoleTypes.FieldStr.keys()))
    forms = CustomPrimaryKeyRelatedField(
        queryset=Forms.objects.all(), many=True)

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        self.fields.get(
            'administration').queryset = Administration.objects.all()

    def validate_role(self, role):
        if self.context.get(
                'user').user_access.role == UserRoleTypes.admin and \
                role not in [UserRoleTypes.approver, UserRoleTypes.user]:
            raise ValidationError({
                'You do not have permission to create/edit '
                'user with selected role.'
            })
        return role

    def validate_administration(self, administration):
        if not self.context.get(
                'user').user_access.role == UserRoleTypes.super_admin \
                and administration.level.level <= self.context.get('user') \
                .user_access.administration.level.level:
            raise ValidationError({
                'You do not have permission to create/edit '
                'user with selected administration.'
            })
        return administration

    def validate_forms(self, forms):
        return forms

    def validate(self, attrs):
        if self.instance:
            if self.instance == self.context.get('user'):
                raise ValidationError(
                    'You do not have permission to edit this user')
            if self.context.get(
                    'user').user_access.role == UserRoleTypes.admin \
                    and self.instance.user_access.role not in \
                    [UserRoleTypes.approver, UserRoleTypes.user]:
                raise ValidationError(
                    'You do not have permission to edit this user')
        if attrs.get('role') != UserRoleTypes.super_admin and attrs.get(
                'administration').level.level == 0:
            raise ValidationError({
                'administration':
                'administration level is not valid with selected role'
            })
        form_types = [f.type for f in attrs.get('forms')]
        if attrs.get('role') == UserRoleTypes.user \
                and FormTypes.national in form_types:
            raise ValidationError({
                'User with role User only allow to '
                'access County forms type'
            })
        return attrs

    def create(self, validated_data):
        administration = validated_data.pop('administration')
        role = validated_data.pop('role')
        forms = validated_data.pop('forms')
        user = super(AddEditUserSerializer, self).create(validated_data)
        Access.objects.create(user=user,
                              administration=administration,
                              role=role)
        # add new user forms
        if forms:
            for form in forms:
                UserForms.objects.create(user=user, form=form)
        return user

    def update(self, instance, validated_data):
        administration = validated_data.pop('administration')
        role = validated_data.pop('role')
        forms = validated_data.pop('forms')
        instance: SystemUser = super(AddEditUserSerializer,
                                     self).update(instance, validated_data)
        instance.updated = timezone.now()
        instance.save()
        instance.user_access.role = role
        instance.user_access.administration = administration
        instance.user_access.save()
        # delete old user forms
        user_forms = UserForms.objects.filter(user=instance).all()
        if user_forms:
            user_forms.delete()
        # add new user forms
        if forms:
            for form in forms:
                UserForms.objects.create(user=instance, form=form)
        return instance

    class Meta:
        model = SystemUser
        fields = [
            'first_name', 'last_name', 'email', 'administration', 'role',
            'phone_number', 'designation', 'forms'
        ]


class UserAdministrationSerializer(serializers.ModelSerializer):
    level = serializers.ReadOnlyField(source='level.level')

    class Meta:
        model = Administration
        fields = ['id', 'name', 'level']


class UserFormSerializer(serializers.ModelSerializer):
    id = serializers.ReadOnlyField(source='form.id')
    name = serializers.ReadOnlyField(source='form.name')

    class Meta:
        model = UserForms
        fields = ['id', 'name']


class ListUserSerializer(serializers.ModelSerializer):
    administration = serializers.SerializerMethodField()
    role = serializers.SerializerMethodField()
    invite = serializers.SerializerMethodField()
    forms = serializers.SerializerMethodField()

    @extend_schema_field(UserAdministrationSerializer)
    def get_administration(self, instance: SystemUser):
        return UserAdministrationSerializer(
            instance=instance.user_access.administration).data

    @extend_schema_field(
        inline_serializer('role',
                          fields={
                              'id': serializers.IntegerField(),
                              'value': serializers.CharField(),
                          }))
    def get_role(self, instance: SystemUser):
        return {
            'id': instance.user_access.role,
            'value': UserRoleTypes.FieldStr.get(instance.user_access.role)
        }

    def get_invite(self, instance: SystemUser):
        return signing.dumps(instance.id)

    @extend_schema_field(UserFormSerializer(many=True))
    def get_forms(self, instance: SystemUser):
        return UserFormSerializer(instance=instance.user_form.all(),
                                  many=True).data

    class Meta:
        model = SystemUser
        fields = [
            'id', 'first_name', 'last_name', 'email', 'administration', 'role',
            'phone_number', 'designation', 'invite', 'forms'
        ]


class ListUserRequestSerializer(serializers.Serializer):
    role = CustomChoiceField(choices=list(UserRoleTypes.FieldStr.keys()),
                             required=False)
    administration = CustomPrimaryKeyRelatedField(
        queryset=Administration.objects.none(), required=False)
    pending = CustomBooleanField(default=False)
    descendants = CustomBooleanField(default=True)

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        self.fields.get(
            'administration').queryset = Administration.objects.all()


class UserSerializer(serializers.ModelSerializer):
    name = serializers.SerializerMethodField()
    administration = serializers.SerializerMethodField()
    role = serializers.SerializerMethodField()
    forms = serializers.SerializerMethodField()

    @extend_schema_field(UserAdministrationSerializer)
    def get_administration(self, instance: SystemUser):
        return UserAdministrationSerializer(
            instance=instance.user_access.administration).data

    @extend_schema_field(
        inline_serializer('role',
                          fields={
                              'id': serializers.IntegerField(),
                              'value': serializers.CharField(),
                          }))
    def get_role(self, instance: SystemUser):
        return {
            'id': instance.user_access.role,
            'value': UserRoleTypes.FieldStr.get(instance.user_access.role)
        }

    @extend_schema_field(OpenApiTypes.STR)
    def get_name(self, instance):
        return instance.get_full_name()

    @extend_schema_field(UserFormSerializer(many=True))
    def get_forms(self, instance: SystemUser):
        return UserFormSerializer(instance=instance.user_form.all(),
                                  many=True).data

    class Meta:
        model = SystemUser
        fields = [
            'email', 'name', 'administration', 'role', 'phone_number',
            'designation', 'forms'
        ]


class ListLevelSerializer(serializers.ModelSerializer):
    class Meta:
        model = Levels
        fields = ['id', 'name', 'level']


class UserApprovalAssignmentSerializer(serializers.ModelSerializer):
    id = serializers.ReadOnlyField(source='form.id')
    name = serializers.ReadOnlyField(source='form.name')

    class Meta:
        model = FormApprovalAssignment
        fields = ['id', 'name']


class UserDetailSerializer(serializers.ModelSerializer):
    administration = serializers.ReadOnlyField(
        source='user_access.administration.id')
    role = serializers.ReadOnlyField(source='user_access.role')
    approval_assignment = serializers.SerializerMethodField()
    forms = serializers.SerializerMethodField()
    pending_approval = serializers.SerializerMethodField()
    data = serializers.SerializerMethodField()

    @extend_schema_field(UserApprovalAssignmentSerializer(many=True))
    def get_approval_assignment(self, instance: SystemUser):
        return UserApprovalAssignmentSerializer(
            instance=instance.user_data_approval.all(), many=True).data

    @extend_schema_field(UserFormSerializer(many=True))
    def get_forms(self, instance: SystemUser):
        return UserFormSerializer(instance=instance.user_form.all(),
                                  many=True).data

    @extend_schema_field(OpenApiTypes.INT)
    def get_pending_approval(self, instance: SystemUser):
        return instance.user_assigned_pending_data.filter(
            status=DataApprovalStatus.pending).count()

    @extend_schema_field(OpenApiTypes.INT)
    def get_data(self, instance: SystemUser):
        return instance.form_data_created.all().count()

    class Meta:
        model = SystemUser
        fields = [
            'first_name', 'last_name', 'email', 'administration', 'role',
            'phone_number', 'designation', 'forms', 'approval_assignment',
            'pending_approval', 'data'
        ]
