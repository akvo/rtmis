from rest_framework import serializers
from rest_framework.exceptions import ValidationError

from api.v1.v1_data.models import FormData, Answers
from api.v1.v1_forms.constants import QuestionTypes
from api.v1.v1_profile.models import Administration
from utils.custom_serializer_fields import CustomPrimaryKeyRelatedField, \
    UnvalidatedField


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
                'question').type in [QuestionTypes.number,
                                     QuestionTypes.administration]:
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
        -administration = 2 #value
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
                                               QuestionTypes.option,
                                               QuestionTypes.multiple_option]:
                option = answer.get('value')
            elif answer.get('question').type in [QuestionTypes.text,
                                                 QuestionTypes.photo,
                                                 QuestionTypes.date]:
                name = answer.get('value')
            else:
                # for administration,number question type
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
