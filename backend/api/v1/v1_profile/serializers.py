import os
import random
import string
from typing import Any, Dict, cast
from rest_framework import serializers
from api.v1.v1_profile.models import (
    Administration, AdministrationAttribute, AdministrationAttributeValue,
    Entity, EntityData, Levels
)
from utils.custom_serializer_fields import CustomPrimaryKeyRelatedField
from utils.custom_generator import update_sqlite
from utils.custom_generator import (
    administration_csv_add,
    administration_csv_update,
)


class RelatedAdministrationField(serializers.PrimaryKeyRelatedField):
    def use_pk_only_optimization(self):
        return False

    def to_representation(self, value: Administration):
        return {
            'id': value.pk,
            'name': value.name,
            'full_name': value.full_name,
            'code': value.code,
        }


class AdministrationLevelsSerializer(serializers.ModelSerializer):
    class Meta:
        model = Levels
        fields = ['id', 'name']


class AdministrationAttributeSerializer(serializers.ModelSerializer):
    class Meta:
        model = AdministrationAttribute
        fields = ['id', 'name', 'type', 'options']

    def validate(self, data: Dict[str, Any]) -> Dict[str, Any]:
        type = data.get('type', AdministrationAttribute.Type.VALUE)
        options = data.get('options', [])
        if type == AdministrationAttribute.Type.VALUE and len(options) > 0:
            error = (
                f'Attribute of type "{AdministrationAttribute.Type.VALUE}" '
                'should not have any options'
            )
            raise serializers.ValidationError(error)
        if type != AdministrationAttribute.Type.VALUE and len(options) < 1:
            error = f'Attribute of type "{type}" should have at least 1 option'
            raise serializers.ValidationError(error)

        return super().validate(data)


class AdministrationAttributeValueSerializer(serializers.ModelSerializer):
    INVALID_VALUE_ERROR = 'Invalid value for attribute "%s"'
    type = serializers.ReadOnlyField(source='attribute.type')

    class Meta:
        model = AdministrationAttributeValue
        fields = ['attribute', 'type', 'value']

    def to_internal_value(self, data: Dict):
        value = data.get('value', None)
        if value:
            data['value'] = {'value': value}
        return super().to_internal_value(data)

    def validate(self, data):
        attribute = cast(AdministrationAttribute, data.get('attribute'))
        value = data.get('value', {}).get('value', None)
        if value:
            if attribute.type == AdministrationAttribute.Type.VALUE:
                self._validate_value_attribute(attribute, value)
            if attribute.type == AdministrationAttribute.Type.OPTION:
                self._validate_option_attribute(attribute, value)
            if attribute.type == AdministrationAttribute.Type.MULTIPLE_OPTION:
                self._validate_multiple_option_attribute(attribute, value)
            if attribute.type == AdministrationAttribute.Type.AGGREGATE:
                self._validate_aggregate_attribute(attribute, value)
        return data

    def _validate_value_attribute(self, attribute, value):
        if type(value) == dict:
            raise serializers.ValidationError(
                    self.INVALID_VALUE_ERROR.format(attribute.name))
        if type(value) == list and len(value) > 0:
            raise serializers.ValidationError(
                    self.INVALID_VALUE_ERROR.format(attribute.name))

    def _validate_option_attribute(self, attribute, value):
        if value not in attribute.options:
            raise serializers.ValidationError(
                    self.INVALID_VALUE_ERROR.format(attribute.name))

    def _validate_multiple_option_attribute(self, attribute, value):
        if type(value) != list:
            raise serializers.ValidationError(
                    self.INVALID_VALUE_ERROR.format(attribute.name))
        for val in value:
            if val not in attribute.options:
                raise serializers.ValidationError(
                        self.INVALID_VALUE_ERROR.format(attribute.name))

    def _validate_aggregate_attribute(self, attribute, value):
        if type(value) != dict:
            raise serializers.ValidationError(
                    self.INVALID_VALUE_ERROR.format(attribute.name))
        for key in value:
            if key not in attribute.options:
                raise serializers.ValidationError(
                        self.INVALID_VALUE_ERROR.format(attribute.name))

    def to_representation(self, instance: AdministrationAttributeValue):
        data = super().to_representation(instance)
        value = self._present_value(data, instance.attribute.type)
        data['value'] = value
        return data

    def _present_value(self, data: Dict, type: str):
        value = data.get('value', {}).get('value', None)
        if value is None and\
                type == AdministrationAttribute.Type.MULTIPLE_OPTION:
            return []
        if value is None and type == AdministrationAttribute.Type.AGGREGATE:
            return {}
        return value


def validate_parent(obj: Administration):
    sub_level = obj.level.level + 1
    try:
        Levels.objects.get(level=sub_level)
    except Levels.DoesNotExist:
        raise serializers.ValidationError('Invalid parent level')


class AdministrationSerializer(serializers.ModelSerializer):
    parent = RelatedAdministrationField(
            queryset=Administration.objects.all(),
            validators=[validate_parent])  # type: ignore
    level = AdministrationLevelsSerializer(read_only=True)
    children = RelatedAdministrationField(
            source='parent_administration',
            read_only=True, many=True)
    attributes = AdministrationAttributeValueSerializer(
            many=True, required=False)

    class Meta:
        model = Administration
        fields = [
            'id',
            'name',
            'code',
            'parent',
            'level',
            'children',
            'attributes'
        ]

    def __init__(self, *args, **kwargs):
        compact = kwargs.pop('compact', False)
        super().__init__(*args, **kwargs)
        if compact:
            allowed = set(['id', 'name', 'code', 'parent', 'level'])
            existing = set(self.fields)
            for field_name in existing - allowed:
                self.fields.pop(field_name)

    def create(self, validated_data):
        attributes = validated_data.pop('attributes', [])
        self._assign_level(validated_data)
        self._set_code(validated_data)
        instance = super().create(validated_data)
        update_sqlite(
            model=Administration,
            data={
                'id': instance.id,
                'name': instance.name,
                'code': instance.code,
                'parent': instance.parent.id,
                'level': instance.level.id,
                'path': instance.path
            }
        )
        TESTING = os.environ.get("TESTING")
        administration_csv_add(data=instance, test=TESTING)
        for attribute in attributes:
            instance.attributes.create(**attribute)
        return instance

    def update(self, instance, validated_data):
        attributes = validated_data.pop('attributes', [])
        self._assign_level(validated_data)
        instance = super().update(instance, validated_data)
        for it in attributes:
            attribute = it.pop('attribute')
            data = dict(attribute=attribute)
            target, created = instance.attributes.get_or_create(
                    **data, defaults=it)
            if not created:
                AdministrationAttributeValue.objects\
                        .filter(id=target.id).update(**it)
        update_sqlite(
            model=Administration,
            data={
                'name': instance.name,
                'code': instance.code,
                'parent': instance.parent.id,
                'level': instance.level.id,
                'path': instance.path
            },
            id=instance.id
        )
        TESTING = os.environ.get("TESTING")
        administration_csv_update(data=instance, test=TESTING)
        return instance

    def _set_code(self, validated_data):
        if len(validated_data.get('code', '')) > 0:
            return
        code = ''.join([
            random.choice(string.ascii_letters + string.digits+'-_')
            for _ in range(10)
        ])
        validated_data.update({'code': code})

    def _assign_level(self, validated_data):
        parent_level = validated_data.get('parent').level.level
        try:
            sublevel = Levels.objects.get(level=parent_level + 1)
        except Levels.DoesNotExist as e:
            raise ValueError() from e
        validated_data.update({'level': sublevel})


class EntitySerializer(serializers.ModelSerializer):
    class Meta:
        model = Entity
        fields = ['id', 'name']


class RelatedEntityField(serializers.PrimaryKeyRelatedField):
    def use_pk_only_optimization(self):
        return False

    def to_representation(self, value):
        return {
            "id": value.pk,
            "name": value.name,
        }


class EntityDataSerializer(serializers.ModelSerializer):
    administration = RelatedAdministrationField(
            queryset=Administration.objects.all())
    entity = RelatedEntityField(queryset=Entity.objects.all())

    class Meta:
        model = EntityData
        fields = ['id', 'name', 'code', 'administration', 'entity']

    def create(self, validated_data):
        instance = super().create(validated_data)
        update_sqlite(
            model=EntityData,
            data={
                'id': instance.id,
                'name': instance.name,
                'code': instance.code,
                'entity': instance.entity.id,
                'administration': instance.administration.id,
                'parent': instance.administration.id
            }
        )
        return instance

    def update(self, instance, validated_data):
        instance = super().update(instance, validated_data)
        update_sqlite(
            model=EntityData,
            data={
                'name': instance.name,
                'code': instance.code,
                'entity': instance.entity.id,
                'administration': instance.administration.id,
                'parent': instance.administration.id
            },
            id=instance.id
        )
        return instance


class GenerateDownloadRequestSerializer(serializers.Serializer):
    level = CustomPrimaryKeyRelatedField(queryset=Levels.objects.none())
    administration = RelatedAdministrationField(
            queryset=Administration.objects.all())

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        self.fields.get('level').queryset = Levels.objects.all()
