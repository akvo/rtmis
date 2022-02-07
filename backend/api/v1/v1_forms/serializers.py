from collections import OrderedDict

from drf_spectacular.types import OpenApiTypes
from drf_spectacular.utils import extend_schema_field, inline_serializer
from rest_framework import serializers
from rest_framework.exceptions import ValidationError

from api.v1.v1_forms.constants import QuestionTypes
from api.v1.v1_forms.models import Forms, QuestionGroup, Questions, \
    QuestionOptions, FormData, Answers
from api.v1.v1_profile.models import Administration
from rtmis.settings import FORM_GEO_VALUE
from utils.custom_serializer_fields import CustomPrimaryKeyRelatedField, \
    UnvalidatedField


class ListOptionSerializer(serializers.ModelSerializer):

    def to_representation(self, instance):
        result = super(ListOptionSerializer, self).to_representation(
            instance)
        return OrderedDict(
            [(key, result[key]) for key in result if result[key] is not None])

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
        if instance.type in [QuestionTypes.geo,
                             QuestionTypes.administration,
                             QuestionTypes.option,
                             QuestionTypes.multiple_option]:
            return ListOptionSerializer(
                instance=instance.question_question_options.all(),
                many=True).data
        return None

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

    def to_representation(self, instance):
        result = super(ListQuestionSerializer, self).to_representation(
            instance)
        return OrderedDict(
            [(key, result[key]) for key in result if result[key] is not None])

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


class SubmitFormDataSerializer(serializers.ModelSerializer):
    administration = CustomPrimaryKeyRelatedField(
        queryset=Administration.objects.none())

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        self.fields.get(
            'administration').queryset = Administration.objects.all()

    class Meta:
        model = FormData
        fields = ['name', 'geo', 'administration']


class SubmitFormDataAnswerSerializer(serializers.ModelSerializer):
    value = UnvalidatedField(allow_null=False)

    def validate_value(self, value):
        if value == '':
            raise ValidationError('Value is required')
        if isinstance(value, list) and len(value) == 0:
            raise ValidationError('Value is required')
        return value

    def validate(self, attrs):
        if not isinstance(attrs.get('value'), list) and attrs.get(
                'question').type in [QuestionTypes.geo,
                                     QuestionTypes.administration,
                                     QuestionTypes.option,
                                     QuestionTypes.multiple_option]:
            raise ValidationError(
                {'value': 'Valid list value is required'})
        elif not isinstance(attrs.get('value'), str) and attrs.get(
                'question').type in [QuestionTypes.text,
                                     QuestionTypes.photo,
                                     QuestionTypes.date]:

            raise ValidationError(
                {'value': 'Valid string value is required'})

        elif not isinstance(attrs.get('value'), int) and attrs.get(
                'question').type == QuestionTypes.number:
            raise ValidationError(
                {'value': 'Valid number value is required'})

        return attrs

    class Meta:
        model = Answers
        fields = ['question', 'value']


class SubmitFormSerializer(serializers.Serializer):
    data = SubmitFormDataSerializer()
    answer = SubmitFormDataAnswerSerializer(many=True)

    def __init__(self, **kwargs):
        super().__init__(**kwargs)

    def update(self, instance, validated_data):
        pass

    def create(self, validated_data):
        data = validated_data.get('data')
        data['form'] = self.context.get('form')
        data['created_by'] = self.context.get('user')
        data['updated_by'] = self.context.get('user')
        obj_data = self.fields.get('data').create(data)

        """
        Answer value based on Question type
        -geo = 1 #option
        -administration = 2 #option
        -text = 3 #name
        -number = 4 #value
        -option = 5 #option
        -multiple_option = 6 #option
        -cascade = 7 #option
        -photo = 8 #name
        -date = 9 #name
        """

        for answer in validated_data.get('answer'):
            name = None
            value = None
            option = None

            if answer.get('question').type in [QuestionTypes.geo,
                                               QuestionTypes.administration,
                                               QuestionTypes.option,
                                               QuestionTypes.multiple_option]:
                option = answer.get('value')
            elif answer.get('question').type in [QuestionTypes.text,
                                                 QuestionTypes.photo,
                                                 QuestionTypes.date]:
                name = answer.get('value')
            else:
                value = answer.get('value')

            Answers.objects.create(
                data=obj_data,
                question=answer.get('question'),
                name=name,
                value=value,
                options=option,
                created_by=self.context.get('user'),
            )
        return object
