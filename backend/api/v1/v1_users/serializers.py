from django.core import signing
from django.core.signing import BadSignature
from drf_spectacular.types import OpenApiTypes
from drf_spectacular.utils import extend_schema_field, inline_serializer
from rest_framework import serializers
from rest_framework.exceptions import ValidationError

from api.v1.v1_forms.constants import QuestionTypes
from api.v1.v1_forms.models import Forms, QuestionGroup, Questions, \
    QuestionOptions
from api.v1.v1_profile.models import Administration
from api.v1.v1_users.models import SystemUser
from rtmis.settings import FORM_GEO_VALUE
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


class ListOptionSerializer(serializers.ModelSerializer):
    class Meta:
        model = QuestionOptions
        fields = ['name', 'order']


class ListQuestionSerializer(serializers.ModelSerializer):
    option = serializers.SerializerMethodField()
    type = serializers.SerializerMethodField()
    center = serializers.SerializerMethodField()

    @extend_schema_field(ListOptionSerializer(many=True))
    def get_option(self, instance: Questions):
        if instance.type in [QuestionTypes.administration,
                             QuestionTypes.cascade]:
            return QuestionTypes.FieldStr.get(
                QuestionTypes.administration).lower()
        return ListOptionSerializer(
            instance=instance.question_question_options.all(),
            many=True).data

    @extend_schema_field(OpenApiTypes.STR)
    def get_type(self, instance: Questions):
        if instance.type == QuestionTypes.administration:
            return QuestionTypes.FieldStr.get(QuestionTypes.cascade).lower()
        return QuestionTypes.FieldStr.get(instance.type).lower()

    @extend_schema_field(inline_serializer('center',
                                           fields={
                                               'lat': serializers.FloatField(),
                                               'lng': serializers.FloatField(),
                                           }))
    def get_center(self, instance: Questions):
        if instance.type == QuestionTypes.geo:
            return FORM_GEO_VALUE
        return None

    class Meta:
        model = Questions
        fields = ['id', 'name', 'order', 'type', 'required',
                  'dependency', 'option', 'center', 'meta']


# TODO: confirm Order in QuestionGroup model
class ListQuestionGroupSerializer(serializers.ModelSerializer):
    question = serializers.SerializerMethodField()

    @extend_schema_field(ListQuestionSerializer(many=True))
    def get_question(self, instance: QuestionGroup):
        return ListQuestionSerializer(
            instance=instance.question_group_question.all().order_by('order'),
            many=True).data

    class Meta:
        model = QuestionGroup
        fields = ['name', 'question']


class ListAdministrationCascadeSerializer(serializers.ModelSerializer):
    value = serializers.ReadOnlyField(source='id')
    label = serializers.ReadOnlyField(source='name')
    children = serializers.SerializerMethodField()

    @extend_schema_field(inline_serializer('children', fields={
        'value': serializers.IntegerField(),
        'label': serializers.CharField(),
    }, many=True))
    def get_children(self, instance: Administration):
        return ListAdministrationCascadeSerializer(
            instance=instance.parent_administration.all(), many=True
        ).data

    class Meta:
        model = Administration
        fields = ['value', 'label', 'children']


class FormDetailSerializer(serializers.ModelSerializer):
    question_group = serializers.SerializerMethodField()
    cascade = serializers.SerializerMethodField()

    @extend_schema_field(ListQuestionGroupSerializer(many=True))
    def get_question_group(self, instance: Forms):
        return ListQuestionGroupSerializer(
            instance=instance.form_question_group.all(), many=True).data

    @extend_schema_field(
        inline_serializer('administration', fields={
            'administrator': ListAdministrationCascadeSerializer(
                many=True)}))
    def get_cascade(self, instance):
        return {'administration': ListAdministrationCascadeSerializer(
            instance=Administration.objects.filter(parent__isnull=True),
            many=True).data}

    class Meta:
        model = Forms
        fields = ['name', 'question_group', 'cascade']


class ListFormSerializer(serializers.ModelSerializer):
    class Meta:
        model = Forms
        fields = ['id', 'name']


class UserSerializer(serializers.ModelSerializer):
    name = serializers.SerializerMethodField()

    @extend_schema_field(OpenApiTypes.STR)
    def get_name(self, instance):
        return instance.get_full_name()

    class Meta:
        model = SystemUser
        fields = ['email', 'name']
