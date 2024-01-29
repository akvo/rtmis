from collections import OrderedDict

from django.db.models import Q
from drf_spectacular.types import OpenApiTypes
from drf_spectacular.utils import extend_schema_field, inline_serializer
from rest_framework import serializers

from api.v1.v1_forms.constants import QuestionTypes, AttributeTypes, FormTypes
from api.v1.v1_forms.models import Forms, QuestionGroup, Questions, \
    QuestionOptions, QuestionAttribute, \
    FormApprovalRule, FormApprovalAssignment
from api.v1.v1_profile.constants import UserRoleTypes
from api.v1.v1_profile.models import Administration, Levels
from api.v1.v1_users.models import SystemUser
from rtmis.settings import FORM_GEO_VALUE
from utils.custom_serializer_fields import CustomChoiceField, \
    CustomPrimaryKeyRelatedField, CustomListField, \
    CustomMultipleChoiceField
from utils.default_serializers import CommonDataSerializer, \
    GeoFormatSerializer


class ListOptionSerializer(serializers.ModelSerializer):
    def to_representation(self, instance):
        result = super(ListOptionSerializer, self).to_representation(instance)
        return OrderedDict([(key, result[key]) for key in result
                            if result[key] is not None])

    class Meta:
        model = QuestionOptions
        fields = ['id', 'name', 'order', 'color']


class ListQuestionSerializer(serializers.ModelSerializer):
    option = serializers.SerializerMethodField()
    type = serializers.SerializerMethodField()
    center = serializers.SerializerMethodField()
    api = serializers.SerializerMethodField()
    name = serializers.SerializerMethodField()
    rule = serializers.SerializerMethodField()
    extra = serializers.SerializerMethodField()
    source = serializers.SerializerMethodField()
    tooltip = serializers.SerializerMethodField()
    fn = serializers.SerializerMethodField()
    pre = serializers.SerializerMethodField()
    displayOnly = serializers.BooleanField(source='display_only')

    @extend_schema_field(ListOptionSerializer(many=True))
    def get_option(self, instance: Questions):
        if instance.type in [
                QuestionTypes.option, QuestionTypes.multiple_option
        ]:
            return ListOptionSerializer(
                instance=instance.question_question_options.all(),
                many=True).data
        return None

    @extend_schema_field(OpenApiTypes.STR)
    def get_type(self, instance: Questions):
        if instance.type == QuestionTypes.administration:
            return QuestionTypes.FieldStr.get(QuestionTypes.cascade).lower()
        return QuestionTypes.FieldStr.get(instance.type).lower()

    @extend_schema_field(
        inline_serializer('CascadeApiFormat',
                          fields={
                              'endpoint': serializers.CharField(),
                              'list': serializers.CharField(),
                              'id': serializers.IntegerField(),
                          }))
    def get_api(self, instance: Questions):
        if instance.type == QuestionTypes.administration:
            user = self.context.get('user')
            administration = user.user_access.administration
            if user.user_access.role == UserRoleTypes.user:
                return {
                    "endpoint": "/api/v1/administration",
                    "list": "children",
                    "initial": "{0}?filter={1}".format(
                        administration.parent_id,
                        administration.id)}
            return {
                "endpoint": "/api/v1/administration",
                "list": "children",
                "initial": administration.id,
            }
        if instance.type == QuestionTypes.cascade:
            return instance.api
        return None

    @extend_schema_field(GeoFormatSerializer)
    def get_center(self, instance: Questions):
        if instance.type == QuestionTypes.geo:
            return FORM_GEO_VALUE
        return None

    @extend_schema_field(GeoFormatSerializer)
    def get_name(self, instance: Questions):
        return instance.text

    @extend_schema_field(
        inline_serializer('QuestionRuleFormat',
                          fields={
                              'min': serializers.FloatField(),
                              'max': serializers.FloatField(),
                              'allowDecimal': serializers.BooleanField(),
                          }))
    def get_rule(self, instance: Questions):
        return instance.rule

    @extend_schema_field(
        inline_serializer('QuestionExtraFormat',
                          fields={
                              'allowOther': serializers.BooleanField()
                          }))
    def get_extra(self, instance: Questions):
        return instance.extra

    @extend_schema_field(
        inline_serializer('QuestionTooltipFormat',
                          fields={
                              'text': serializers.CharField()
                          }))
    def get_tooltip(self, instance: Questions):
        return instance.tooltip

    @extend_schema_field(
        inline_serializer('QuestionFnFormat',
                          fields={
                              'fnColor': serializers.JSONField(),
                              'fnString': serializers.CharField(),
                              'multiline': serializers.BooleanField(),
                          }))
    def get_fn(self, instance: Questions):
        return instance.fn

    @extend_schema_field(
        inline_serializer('QuestionPreFormat',
                          fields={
                              'answer': serializers.CharField(),
                              'fill': serializers.JSONField(),
                          }))
    def get_pre(self, instance: Questions):
        return instance.pre

    def to_representation(self, instance):
        result = super(ListQuestionSerializer,
                       self).to_representation(instance)
        return OrderedDict([(key, result[key]) for key in result
                            if result[key] is not None])

    @extend_schema_field(
        inline_serializer('QuestionSourceFormat',
                          fields={
                            'file': serializers.CharField(),
                            'parent': serializers.IntegerField(),
                          }))
    def get_source(self, instance: Questions):
        user = self.context.get('user')
        assignment = self.context.get('mobile_assignment')
        if instance.type == QuestionTypes.cascade:
            return {
                "file": "organisation.sqlite",
                "parent_id": [0]
            }
        if instance.type == QuestionTypes.administration:
            return {
                "file": "administrator.sqlite",
                "parent_id": [
                    a.id for a in assignment.administrations.all()
                ] if assignment else [user.user_access.administration.id]
            }
        return None

    class Meta:
        model = Questions
        fields = [
            'id', 'name', 'order', 'type', 'required', 'dependency', 'option',
            'center', 'api', 'meta', 'rule', 'extra', 'source', 'tooltip',
            'fn', 'pre', 'hidden', 'displayOnly', 'monitoring', 'meta_uuid'
        ]


# TODO: confirm Order in QuestionGroup model
class ListQuestionGroupSerializer(serializers.ModelSerializer):
    question = serializers.SerializerMethodField()

    @extend_schema_field(ListQuestionSerializer(many=True))
    def get_question(self, instance: QuestionGroup):
        return ListQuestionSerializer(
            instance=instance.question_group_question.all().order_by('order'),
            context=self.context,
            many=True).data

    class Meta:
        model = QuestionGroup
        fields = ['name', 'question']


class ListAdministrationCascadeSerializer(serializers.ModelSerializer):
    value = serializers.ReadOnlyField(source='id')
    label = serializers.ReadOnlyField(source='name')
    children = serializers.SerializerMethodField()

    @extend_schema_field(
        inline_serializer('children',
                          fields={
                              'value': serializers.IntegerField(),
                              'label': serializers.CharField(),
                          },
                          many=True))
    def get_children(self, instance: Administration):
        return ListAdministrationCascadeSerializer(
            instance=instance.parent_administration.all(), many=True).data

    class Meta:
        model = Administration
        fields = ['value', 'label', 'children']


class WebFormDetailSerializer(serializers.ModelSerializer):
    question_group = serializers.SerializerMethodField()
    cascades = serializers.SerializerMethodField()

    @extend_schema_field(ListQuestionGroupSerializer(many=True))
    def get_question_group(self, instance: Forms):
        return ListQuestionGroupSerializer(
            instance=instance.form_question_group.all().order_by('order'),
            many=True,
            context=self.context
        ).data

    @extend_schema_field(serializers.ListField())
    def get_cascades(self, instance: Forms):
        cascade_questions = Questions.objects.filter(type__in=[
            QuestionTypes.cascade, QuestionTypes.administration
        ], form=instance).all()
        source = []
        for cascade_question in cascade_questions:
            if cascade_question.type == QuestionTypes.administration:
                source.append("/sqlite/administrator.sqlite")
            else:
                source.append("/sqlite/organisation.sqlite")
        return source

    class Meta:
        model = Forms
        fields = [
            'name',
            'version',
            'cascades',
            'question_group',
            'approval_instructions'
        ]


class ListFormRequestSerializer(serializers.Serializer):
    type = CustomChoiceField(choices=list(FormTypes.FieldStr.keys()),
                             required=False)


class ListFormSerializer(serializers.ModelSerializer):
    type_text = serializers.SerializerMethodField()

    @extend_schema_field(CustomChoiceField(
        choices=[FormTypes.FieldStr[d] for d in FormTypes.FieldStr]))
    def get_type_text(self, instance):
        return FormTypes.FieldStr.get(instance.type)

    class Meta:
        model = Forms
        fields = ['id', 'name', 'type', 'version', 'type_text']


class FormDataListQuestionSerializer(serializers.ModelSerializer):
    option = serializers.SerializerMethodField()
    type = serializers.SerializerMethodField()
    attributes = serializers.SerializerMethodField()

    @extend_schema_field(ListOptionSerializer(many=True))
    def get_option(self, instance: Questions):
        if instance.type in [
                QuestionTypes.geo, QuestionTypes.option,
                QuestionTypes.multiple_option
        ]:
            return ListOptionSerializer(
                instance=instance.question_question_options.all(),
                many=True).data
        return None

    @extend_schema_field(CustomChoiceField(
        choices=[
            QuestionTypes.FieldStr[d].lower() for d in QuestionTypes.FieldStr]
        ))
    def get_type(self, instance: Questions):
        if instance.type == QuestionTypes.administration:
            return QuestionTypes.FieldStr.get(QuestionTypes.cascade).lower()
        return QuestionTypes.FieldStr.get(instance.type).lower()

    @extend_schema_field(CustomMultipleChoiceField(choices=[
        AttributeTypes.FieldStr[a] for a in AttributeTypes.FieldStr]))
    def get_attributes(self, instance: Questions):
        attribute_ids = QuestionAttribute.objects.filter(
            question=instance).values_list('attribute', flat=True).distinct()
        if attribute_ids:
            return [AttributeTypes.FieldStr.get(a) for a in attribute_ids]
        return []

    @extend_schema_field(GeoFormatSerializer)
    def to_representation(self, instance):
        result = super(FormDataListQuestionSerializer,
                       self).to_representation(instance)
        return OrderedDict([(key, result[key]) for key in result
                            if result[key] is not None])

    class Meta:
        model = Questions
        fields = [
            'id', 'form', 'question_group', 'name', 'text', 'order', 'meta',
            'api', 'type', 'required', 'rule', 'option', 'dependency',
            'display_only', 'attributes'
        ]


class FormDataQuestionGroupSerializer(serializers.ModelSerializer):
    question = serializers.SerializerMethodField()

    @extend_schema_field(FormDataListQuestionSerializer(many=True))
    def get_question(self, instance: QuestionGroup):
        return FormDataListQuestionSerializer(
            instance=instance.question_group_question.all().order_by('order'),
            many=True).data

    class Meta:
        model = QuestionGroup
        fields = ['id', 'name', 'question']


class FormDataSerializer(serializers.ModelSerializer):
    question_group = serializers.SerializerMethodField()

    @extend_schema_field(FormDataQuestionGroupSerializer(many=True))
    def get_question_group(self, instance: Forms):
        return FormDataQuestionGroupSerializer(
            instance=instance.form_question_group.all().order_by('order'),
            many=True
        ).data

    class Meta:
        model = Forms
        fields = ['id', 'name', 'question_group', 'approval_instructions']


class EditFormTypeSerializer(serializers.ModelSerializer):
    form_id = CustomPrimaryKeyRelatedField(queryset=Forms.objects.none())
    type = CustomChoiceField(choices=list(FormTypes.FieldStr.keys()))

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        self.fields.get('form_id').queryset = Forms.objects.all()

    def create(self, validated_data):
        form: Forms = validated_data.get('form_id')
        form.type = validated_data.get('type')
        form.save()
        return form

    class Meta:
        model = Forms
        fields = ['form_id', 'type', 'approval_instructions']


class EditFormApprovalSerializer(serializers.ModelSerializer):
    form_id = CustomPrimaryKeyRelatedField(queryset=Forms.objects.none(),
                                           source='form')
    level_id = CustomListField(
        child=CustomPrimaryKeyRelatedField(queryset=Levels.objects.none()),
        source='levels')

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        self.fields.get('form_id').queryset = Forms.objects.all()
        self.fields.get('level_id').child.queryset = Levels.objects.all()

    def create(self, validated_data):
        administration = self.context.get('user').user_access.administration
        FormApprovalRule.objects.filter(
            form=validated_data.get('form'),
            administration=administration).delete()

        validated_data['administration'] = administration
        rule: FormApprovalRule = super(EditFormApprovalSerializer,
                                       self).create(validated_data)
        if administration.path:
            path = f"{administration.path}{administration.id}."
        else:
            path = f"{administration.id}."

        # Get descendants of current admin with selected level
        descendants = list(
            Administration.objects.filter(
                path__startswith=path,
                level_id__in=rule.levels.all().values_list(
                    'id', flat=True)).values_list('id', flat=True))
        # Delete assignment for the removed levels
        FormApprovalAssignment.objects.filter(
            ~Q(administration_id__in=descendants), form=rule.form).delete()
        return rule

    class Meta:
        model = FormApprovalRule
        fields = ['form_id', 'level_id']


class FormApprovalLevelListSerializer(serializers.ModelSerializer):
    class Meta:
        model = FormApprovalRule
        fields = ['form_id', 'levels']


class FormApproverRequestSerializer(serializers.Serializer):
    administration_id = CustomPrimaryKeyRelatedField(
        queryset=Administration.objects.none())
    form_id = CustomPrimaryKeyRelatedField(queryset=Forms.objects.none())

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        self.fields.get('form_id').queryset = Forms.objects.all()
        self.fields.get(
            'administration_id').queryset = Administration.objects.all()


class FormApproverUserSerializer(serializers.ModelSerializer):
    class Meta:
        model = SystemUser
        fields = ['id', 'first_name', 'last_name', 'email']


class FormApproverResponseSerializer(serializers.ModelSerializer):
    user = serializers.SerializerMethodField()
    administration = serializers.SerializerMethodField()

    @extend_schema_field(FormApproverUserSerializer(many=True))
    def get_user(self, instance: Administration):
        assignment = instance.administration_data_approval.filter(
            form=self.context.get('form')).first()
        if assignment:
            return FormApproverUserSerializer(instance=assignment.user).data
        return None

    @extend_schema_field(CommonDataSerializer)
    def get_administration(self, instance: Administration):
        return {'id': instance.id, 'name': instance.name}

    class Meta:
        model = Administration
        fields = ['user', 'administration']
