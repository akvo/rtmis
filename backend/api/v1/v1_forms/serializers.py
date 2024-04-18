import numpy as np
from collections import OrderedDict

from drf_spectacular.types import OpenApiTypes
from drf_spectacular.utils import extend_schema_field, inline_serializer
from rest_framework import serializers

from api.v1.v1_forms.constants import QuestionTypes, AttributeTypes, FormTypes
from api.v1.v1_forms.models import (
    Forms,
    QuestionGroup,
    Questions,
    QuestionOptions,
    QuestionAttribute,
    FormCertificationAssignment
)
from api.v1.v1_profile.constants import UserRoleTypes
from api.v1.v1_profile.models import Administration, Entity
from api.v1.v1_profile.serializers import RelatedAdministrationField
from api.v1.v1_users.models import SystemUser
from rtmis.settings import FORM_GEO_VALUE
from utils.custom_serializer_fields import CustomChoiceField, \
    CustomPrimaryKeyRelatedField, CustomMultipleChoiceField
from utils.default_serializers import CommonDataSerializer, \
    GeoFormatSerializer


class ListOptionSerializer(serializers.ModelSerializer):
    def to_representation(self, instance):
        result = super(ListOptionSerializer, self).to_representation(instance)
        return OrderedDict([(key, result[key]) for key in result
                            if result[key] is not None])

    class Meta:
        model = QuestionOptions
        fields = ['id', 'value', 'label', 'order', 'color']


class ListQuestionSerializer(serializers.ModelSerializer):
    option = serializers.SerializerMethodField()
    type = serializers.SerializerMethodField()
    center = serializers.SerializerMethodField()
    api = serializers.SerializerMethodField()
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
                instance=instance.options.all(),
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
                              'initial': serializers.CharField(),
                              'query_params': serializers.CharField(),
                          }))
    def get_api(self, instance: Questions):
        if instance.type == QuestionTypes.administration:
            user = self.context.get('user')
            administration = user.user_access.administration
            max_level = instance.form.type == FormTypes.national
            extra_objects = {}
            if max_level:
                extra_objects = {
                    "query_params": "?max_level=2",
                }
            if user.user_access.role == UserRoleTypes.user:
                if max_level:
                    extra_objects = {
                        "query_params": "&max_level=2",
                    }
                return {
                    "endpoint": "/api/v1/administration",
                    "list": "children",
                    "initial": "{0}?filter={1}".format(
                        administration.parent_id,
                        administration.id),
                    **extra_objects
                }
            return {
                "endpoint": "/api/v1/administration",
                "list": "children",
                "initial": administration.id,
                **extra_objects
            }
        if instance.type == QuestionTypes.cascade:
            return instance.api
        return None

    @extend_schema_field(GeoFormatSerializer)
    def get_center(self, instance: Questions):
        if instance.type == QuestionTypes.geo:
            return FORM_GEO_VALUE
        return None

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
                            'parent': serializers.ListField(
                                child=serializers.IntegerField()),
                            'max_level': serializers.IntegerField(),
                          }))
    def get_source(self, instance: Questions):
        user = self.context.get('user')
        assignment = self.context.get('mobile_assignment')
        max_level = instance.form.type == FormTypes.national
        extra_objects = {}
        if instance.type == QuestionTypes.cascade:
            if instance.extra:
                cascade_type = instance.extra.get("type")
                cascade_name = instance.extra.get("name")
                if cascade_type == "entity":
                    entity_type = Entity.objects\
                        .filter(name=cascade_name).first()
                    entity_id = entity_type.id if entity_type else None
                    return {
                        "file": "entity_data.sqlite",
                        "cascade_type": entity_id,
                        "cascade_parent": "administrator.sqlite"
                    }
            return {
                "file": "organisation.sqlite",
                "parent_id": [0]
            }
        if instance.type == QuestionTypes.administration:
            if max_level:
                extra_objects = {
                    "max_level": 1,
                }
            return {
                "file": "administrator.sqlite",
                "parent_id": [
                    a.id for a in assignment.administrations.all()
                ] if assignment else [user.user_access.administration.id],
                **extra_objects
            }
        return None

    class Meta:
        model = Questions
        fields = [
            'id', 'order', 'name', 'label', 'short_label', 'type', 'required',
            'dependency', 'option', 'center', 'api', 'meta', 'meta_uuid',
            'rule', 'extra', 'source', 'tooltip', 'fn', 'pre', 'hidden',
            'displayOnly', 'default_value', 'disabled'
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
        fields = ['name', 'label', 'question']


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
            if (
                cascade_question.extra and
                cascade_question.extra.get('type') == 'entity'
            ):
                source.append("/sqlite/entity_data.sqlite")
            else:
                source.append("/sqlite/organisation.sqlite")
        return np.unique(source)

    class Meta:
        model = Forms
        fields = [
            'id',
            'name',
            'version',
            'cascades',
            'approval_instructions',
            'submission_types',
            'question_group',
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
        fields = [
            'id', 'name', 'type', 'version',
            'type_text', 'submission_types'
        ]


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
                instance=instance.options.all(),
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
            'id', 'form', 'question_group', 'name', 'label', 'short_label',
            'order', 'meta', 'api', 'type', 'required', 'rule', 'option',
            'dependency', 'display_only', 'default_value', 'attributes',
            'disabled',
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
        fields = ['id', 'label', 'name', 'question']


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
        fields = [
            'id', 'name', 'question_group', 'approval_instructions',
            'submission_types'
        ]


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


class FormCertificationAssignmentRequestSerializer(
        serializers.ModelSerializer):
    administrations = serializers.PrimaryKeyRelatedField(
        queryset=Administration.objects.all(), many=True
    )

    class Meta:
        model = FormCertificationAssignment
        fields = ['id', 'assignee', 'administrations']


class FormCertificationAssignmentSerializer(serializers.ModelSerializer):
    county_id = serializers.SerializerMethodField()
    assignee = RelatedAdministrationField(
        queryset=Administration.objects.all()
    )
    administrations = RelatedAdministrationField(
        queryset=Administration.objects.all(), many=True
    )

    @extend_schema_field(OpenApiTypes.INT)
    def get_county_id(self, instance: FormCertificationAssignment):
        return instance.assignee.parent.pk

    class Meta:
        model = FormCertificationAssignment
        fields = ['id', 'assignee', 'administrations', 'updated', 'county_id']
