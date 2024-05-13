from django.core import signing
from django.core.signing import BadSignature
from django.utils import timezone
from drf_spectacular.types import OpenApiTypes
from drf_spectacular.utils import extend_schema_field
from rest_framework import serializers
from rest_framework.exceptions import ValidationError

from api.v1.v1_data.constants import DataApprovalStatus
from api.v1.v1_forms.models import FormApprovalAssignment, UserForms, Forms
from api.v1.v1_forms.constants import FormTypes
from api.v1.v1_profile.constants import UserRoleTypes, OrganisationTypes
from api.v1.v1_profile.models import Administration, Access, Levels
from api.v1.v1_users.models import SystemUser, \
        Organisation, OrganisationAttribute
from api.v1.v1_mobile.models import MobileAssignment
from api.v1.v1_forms.models import FormCertificationAssignment
from utils.custom_serializer_fields import CustomEmailField, CustomCharField, \
    CustomPrimaryKeyRelatedField, CustomChoiceField, CustomBooleanField, \
    CustomMultipleChoiceField
from utils.custom_helper import CustomPasscode
from utils.custom_generator import update_sqlite


class OrganisationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Organisation
        fields = ['id', 'name']


class OrganisationAttributeSerializer(serializers.ModelSerializer):
    type_id = serializers.ReadOnlyField(source='type')
    name = serializers.SerializerMethodField()

    @extend_schema_field(OpenApiTypes.STR)
    def get_name(self, instance: OrganisationAttribute):
        return OrganisationTypes.FieldStr.get(instance.type)

    class Meta:
        model = OrganisationAttribute
        fields = ['type_id', 'name']


class OrganisationAttributeChildrenSerializer(serializers.ModelSerializer):
    type_id = serializers.ReadOnlyField(source='type')
    name = serializers.SerializerMethodField()
    children = serializers.SerializerMethodField()

    @extend_schema_field(OpenApiTypes.STR)
    def get_name(self, instance: OrganisationAttribute):
        return OrganisationTypes.FieldStr.get(instance.type)

    @extend_schema_field(OrganisationSerializer(many=True))
    def get_children(self, instance: OrganisationAttribute):
        orgs = Organisation.objects.filter(
            organisation_organisation_attribute__type=instance.type
        ).all()
        return OrganisationSerializer(instance=orgs, many=True).data

    class Meta:
        model = OrganisationAttribute
        fields = ['type_id', 'name', 'children']


class OrganisationListSerializer(serializers.ModelSerializer):
    attributes = serializers.SerializerMethodField()
    users = serializers.SerializerMethodField()

    @extend_schema_field(OrganisationAttributeSerializer(many=True))
    def get_attributes(self, instance: Organisation):
        attr = OrganisationAttribute.objects.filter(
            organisation_id=instance.id).all()
        return OrganisationAttributeSerializer(instance=attr, many=True).data

    @extend_schema_field(OpenApiTypes.INT)
    def get_users(self, instance: Organisation):
        return SystemUser.objects.filter(
            organisation_id=instance.id).count()

    class Meta:
        model = Organisation
        fields = ['id', 'name', 'attributes', 'users']


class UserRoleSerializer(serializers.Serializer):
    id = serializers.IntegerField()
    value = serializers.CharField()


class AddEditOrganisationSerializer(serializers.ModelSerializer):
    attributes = CustomMultipleChoiceField(choices=list(
        OrganisationTypes.FieldStr.keys()),
                                           required=True)

    def create(self, validated_data):
        attributes = validated_data.pop('attributes')
        instance = super(AddEditOrganisationSerializer,
                         self).create(validated_data)
        for attr in attributes:
            OrganisationAttribute.objects.create(organisation=instance,
                                                 type=attr)
        update_sqlite(
            model=Organisation,
            data={
                'id': instance.id,
                'name': instance.name,
            }
        )
        return instance

    def update(self, instance, validated_data):
        attributes = validated_data.pop('attributes')
        instance: Organisation = super(AddEditOrganisationSerializer,
                                       self).update(instance, validated_data)
        instance.save()
        current_attributes = OrganisationAttribute.objects.filter(
            organisation=instance).all()
        for attr in current_attributes:
            if attr.type not in attributes:
                attr.delete()
        for attr in attributes:
            attr, created = OrganisationAttribute.objects.get_or_create(
                organisation=instance, type=attr)
            attr.save()
        update_sqlite(
            model=Organisation,
            data={'name': instance.name},
            id=instance.id
        )
        return instance

    class Meta:
        model = Organisation
        fields = ['name', 'attributes']


class LoginSerializer(serializers.Serializer):
    email = CustomEmailField()
    password = CustomCharField()


class ForgotPasswordSerializer(serializers.Serializer):
    email = CustomEmailField()

    def validate_email(self, email):
        try:
            user = SystemUser.objects.get(email=email, deleted_at=None)
        except SystemUser.DoesNotExist:
            raise ValidationError('Invalid email, user not found')
        return user


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
            user = SystemUser.objects.get(pk=pk, deleted_at=None)
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
    full_name = serializers.SerializerMethodField()

    @extend_schema_field(OpenApiTypes.STR)
    def get_full_name(self, instance: Administration):
        return instance.full_path_name

    class Meta:
        model = Administration
        fields = ['id', 'parent', 'path', 'level', 'name', 'full_name']


class ListAdministrationSerializer(serializers.ModelSerializer):
    full_name = serializers.SerializerMethodField()
    children = serializers.SerializerMethodField()
    level_name = serializers.ReadOnlyField(source='level.name')
    level = serializers.ReadOnlyField(source='level.level')
    children_level_name = serializers.SerializerMethodField()

    @extend_schema_field(ListAdministrationChildrenSerializer(many=True))
    def get_children(self, instance: Administration):
        max_level = self.context.get('max_level')
        filter_children = self.context.get('filter_children')
        if max_level:
            if int(max_level) <= instance.level.level:
                return []
        filter = self.context.get('filter')
        if filter:
            filtered_administration = Administration.objects.filter(
                id=filter).all().order_by('name')
            return ListAdministrationChildrenSerializer(
                filtered_administration, many=True).data
        children = instance.parent_administration.all().order_by('name')
        if len(filter_children):
            children = instance.parent_administration.filter(
                pk__in=filter_children
            ).all().order_by('name')
        return ListAdministrationChildrenSerializer(
            instance=children,
            many=True
        ).data

    @extend_schema_field(OpenApiTypes.STR)
    def get_children_level_name(self, instance: Administration):
        child: Administration = instance.parent_administration.first()
        if child:
            return child.level.name
        return None

    @extend_schema_field(OpenApiTypes.STR)
    def get_full_name(self, instance: Administration):
        return instance.full_path_name

    class Meta:
        model = Administration
        fields = [
            'id', 'full_name', 'path', 'parent', 'name',
            'level_name', 'level', 'children',
            'children_level_name'
        ]


class AddEditUserSerializer(serializers.ModelSerializer):
    administration = CustomPrimaryKeyRelatedField(
        queryset=Administration.objects.none())
    organisation = CustomPrimaryKeyRelatedField(
        queryset=Organisation.objects.none(), required=False)
    trained = CustomBooleanField(default=False)
    role = CustomChoiceField(choices=list(UserRoleTypes.FieldStr.keys()))
    forms = CustomPrimaryKeyRelatedField(queryset=Forms.objects.all(),
                                         many=True)
    inform_user = CustomBooleanField(default=True)

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        self.fields.get(
            'administration').queryset = Administration.objects.all()
        self.fields.get('organisation').queryset = Organisation.objects.all()

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
            if self.context.get(
                    'user').user_access.role != UserRoleTypes.super_admin \
                    and self.instance == self.context.get('user'):
                raise ValidationError(
                    'You do not have permission to edit this user')
            if self.context.get(
                    'user').user_access.role == UserRoleTypes.admin \
                    and self.instance.user_access.role not in \
                    [UserRoleTypes.approver, UserRoleTypes.user]:
                raise ValidationError(
                    'You do not have permission to edit this user')
        if (
            attrs.get('role') != UserRoleTypes.super_admin and
            attrs.get('administration').level.level == 0
        ):
            raise ValidationError({
                'administration':
                'administration level is not valid with selected role'
            })
        form_types = [f.type for f in attrs.get('forms')]
        if attrs.get('role') == UserRoleTypes.user \
                and FormTypes.national in form_types:
            raise ValidationError(
                'User with role User only allow to '
                'access County forms type'
            )
        if attrs.get('role') == UserRoleTypes.super_admin \
                and FormTypes.county in form_types:
            raise ValidationError(
                'Super Admin can only approve National Type of form'
            )
        return attrs

    def create(self, validated_data):
        try:
            user_deleted = SystemUser.objects_deleted.get(
                email=validated_data['email']
            )
            if user_deleted:
                user_deleted.restore()
                self.update(
                    instance=user_deleted,
                    validated_data=validated_data
                )
                return user_deleted
        except SystemUser.DoesNotExist:
            # delete inform_user payload
            validated_data.pop('inform_user')
            administration = validated_data.pop('administration')
            role = validated_data.pop('role')
            forms = validated_data.pop('forms')
            user = super(AddEditUserSerializer, self).create(validated_data)
            Access.objects.create(
                user=user,
                administration=administration,
                role=role
            )
            # add new user forms
            if forms:
                for form in forms:
                    UserForms.objects.create(user=user, form=form)
            return user

    def update(self, instance, validated_data):
        # delete inform_user payload
        validated_data.pop('inform_user')
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
            'first_name', 'last_name', 'email', 'administration',
            'organisation', 'trained', 'role', 'phone_number', 'designation',
            'forms', 'inform_user'
        ]


class UserAdministrationSerializer(serializers.ModelSerializer):
    level = serializers.ReadOnlyField(source='level.level')
    full_name = serializers.SerializerMethodField()

    def get_full_name(self, instance: Administration):
        return instance.full_name

    class Meta:
        model = Administration
        fields = ['id', 'name', 'level', 'full_name']


class UserFormSerializer(serializers.ModelSerializer):
    id = serializers.ReadOnlyField(source='form.id')
    name = serializers.ReadOnlyField(source='form.name')

    class Meta:
        model = UserForms
        fields = ['id', 'name']


class ListUserSerializer(serializers.ModelSerializer):
    administration = serializers.SerializerMethodField()
    organisation = serializers.SerializerMethodField()
    trained = CustomBooleanField()
    role = serializers.SerializerMethodField()
    invite = serializers.SerializerMethodField()
    forms = serializers.SerializerMethodField()
    last_login = serializers.SerializerMethodField()

    @extend_schema_field(UserAdministrationSerializer)
    def get_administration(self, instance: SystemUser):
        return UserAdministrationSerializer(
            instance=instance.user_access.administration).data

    @extend_schema_field(OrganisationSerializer)
    def get_organisation(self, instance: SystemUser):
        return OrganisationSerializer(instance=instance.organisation).data

    @extend_schema_field(UserRoleSerializer)
    def get_role(self, instance: SystemUser):
        return {
            'id': instance.user_access.role,
            'value': UserRoleTypes.FieldStr.get(instance.user_access.role)
        }

    @extend_schema_field(OpenApiTypes.STR)
    def get_invite(self, instance: SystemUser):
        return signing.dumps(instance.id)

    @extend_schema_field(UserFormSerializer(many=True))
    def get_forms(self, instance: SystemUser):
        return UserFormSerializer(instance=instance.user_form.all(),
                                  many=True).data

    @extend_schema_field(OpenApiTypes.INT)
    def get_last_login(self, instance):
        if instance.last_login:
            return instance.last_login.timestamp()
        return None

    class Meta:
        model = SystemUser
        fields = [
            'id', 'first_name', 'last_name', 'email', 'administration',
            'organisation', 'trained', 'role', 'phone_number', 'designation',
            'invite', 'forms', 'last_login'
        ]


class ListUserRequestSerializer(serializers.Serializer):
    trained = CustomCharField(required=False, default=None)
    role = CustomChoiceField(choices=list(UserRoleTypes.FieldStr.keys()),
                             required=False)
    organisation = CustomPrimaryKeyRelatedField(
        queryset=Organisation.objects.none(), required=False)
    administration = CustomPrimaryKeyRelatedField(
        queryset=Administration.objects.none(), required=False)
    pending = CustomBooleanField(default=False)
    descendants = CustomBooleanField(default=True)
    search = CustomCharField(required=False)

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        self.fields.get(
            'administration').queryset = Administration.objects.all()
        self.fields.get('organisation').queryset = Organisation.objects.all()


class UserSerializer(serializers.ModelSerializer):
    name = serializers.SerializerMethodField()
    administration = serializers.SerializerMethodField()
    organisation = serializers.SerializerMethodField()
    trained = CustomBooleanField(default=False)
    role = serializers.SerializerMethodField()
    forms = serializers.SerializerMethodField()
    last_login = serializers.SerializerMethodField()
    passcode = serializers.SerializerMethodField()
    certification = serializers.SerializerMethodField()

    @extend_schema_field(UserAdministrationSerializer)
    def get_administration(self, instance: SystemUser):
        return UserAdministrationSerializer(
            instance=instance.user_access.administration).data

    @extend_schema_field(OrganisationSerializer)
    def get_organisation(self, instance: SystemUser):
        return OrganisationSerializer(instance=instance.organisation).data

    @extend_schema_field(UserRoleSerializer)
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

    @extend_schema_field(OpenApiTypes.INT)
    def get_last_login(self, instance):
        if instance.last_login:
            return instance.last_login.timestamp()
        return None

    @extend_schema_field(OpenApiTypes.STR)
    def get_passcode(self, instance: SystemUser):
        mobile_assignment = MobileAssignment \
            .objects.filter(user=instance).first()
        if mobile_assignment:
            passcode = CustomPasscode().decode(mobile_assignment.passcode)
            return passcode
        return None

    @extend_schema_field(UserAdministrationSerializer(many=True))
    def get_certification(self, instance: SystemUser):
        certify = FormCertificationAssignment.objects\
            .filter(assignee=instance.user_access.administration).first()
        if certify:
            return UserAdministrationSerializer(
                instance=certify.administrations,
                many=True
            ).data
        return None

    class Meta:
        model = SystemUser
        fields = [
            'email', 'name', 'administration', 'trained', 'role',
            'phone_number', 'designation', 'forms', 'organisation',
            'last_login', 'passcode', 'certification'
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
    organisation = serializers.SerializerMethodField()
    trained = CustomBooleanField(default=False)
    role = serializers.ReadOnlyField(source='user_access.role')
    approval_assignment = serializers.SerializerMethodField()
    forms = serializers.SerializerMethodField()
    pending_approval = serializers.SerializerMethodField()
    data = serializers.SerializerMethodField()
    pending_batch = serializers.SerializerMethodField()

    @extend_schema_field(OrganisationSerializer)
    def get_organisation(self, instance: SystemUser):
        return OrganisationSerializer(instance=instance.organisation).data

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

    @extend_schema_field(OpenApiTypes.INT)
    def get_pending_batch(self, instance: SystemUser):
        return instance.user_pending_data_batch.filter(
            approved=False).all().count()

    class Meta:
        model = SystemUser
        fields = [
            'first_name', 'last_name', 'email', 'administration',
            'organisation', 'trained', 'role', 'phone_number', 'designation',
            'forms', 'approval_assignment', 'pending_approval', 'data',
            'pending_batch'
        ]
