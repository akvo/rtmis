from django.core import signing
from django.core.signing import BadSignature
from drf_spectacular.types import OpenApiTypes
from drf_spectacular.utils import extend_schema_field
from rest_framework import serializers
from rest_framework.exceptions import ValidationError

from api.v1.v1_forms.constants import QuestionTypes
from api.v1.v1_forms.models import Forms, QuestionGroup, Questions, \
    QuestionOptions
from api.v1.v1_profile.models import Administration
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
    type_text = serializers.SerializerMethodField()

    @extend_schema_field(ListOptionSerializer(many=True))
    def get_option(self, instance: Questions):
        return ListOptionSerializer(
            instance=instance.question_question_options.all(), many=True).data

    @extend_schema_field(OpenApiTypes.STR)
    def get_type_text(self, instance: Questions):
        return QuestionTypes.FieldStr.get(instance.type)

    class Meta:
        model = Questions
        fields = ['id', 'name', 'order', 'type', 'type_text', 'required',
                  'dependency', 'option']


# TODO: confirm Order in QuestionGroup model
class ListQuestionGroupSerializer(serializers.ModelSerializer):
    question = serializers.SerializerMethodField()

    @extend_schema_field(ListQuestionSerializer(many=True))
    def get_question(self, instance: QuestionGroup):
        return ListQuestionSerializer(
            instance=instance.question_group_question.all(), many=True).data

    class Meta:
        model = QuestionGroup
        fields = ['name', 'question']


class FormDetailSerializer(serializers.ModelSerializer):
    question_group = serializers.SerializerMethodField()

    @extend_schema_field(ListQuestionGroupSerializer(many=True))
    def get_question_group(self, instance: Forms):
        return ListQuestionGroupSerializer(
            instance=instance.form_question_group.all(), many=True).data

    class Meta:
        model = Forms
        fields = ['name', 'question_group']


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
