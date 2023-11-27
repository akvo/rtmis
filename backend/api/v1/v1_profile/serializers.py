from rest_framework import serializers
from api.v1.v1_profile.models import (
        Administration, AdministrationAttribute, AdministrationAttributeValue,
        Levels)


class RelatedAdministrationField(serializers.PrimaryKeyRelatedField):
    def use_pk_only_optimization(self):
        return False

    def to_representation(self, value: Administration):
        return {
            'id': value.pk,
            'name': value.name,
            'code': value.code,
        }


class AdministrationLevelsSerializer(serializers.ModelSerializer):
    class Meta:
        model = Levels
        fields = ['id', 'name']


def validate_parent(obj: Administration):
    sub_level = obj.level.level + 1
    try:
        Levels.objects.get(level=sub_level)
    except Levels.DoesNotExist:
        raise serializers.ValidationError('Invalid parent level')


class AdministrationAttributeSerializer(serializers.ModelSerializer):
    class Meta:
        model = AdministrationAttribute
        fields = ['id', 'name', 'options']


class AdministrationAttributeValueSerializer(serializers.ModelSerializer):
    class Meta:
        model = AdministrationAttributeValue
        fields = ['attribute', 'value', 'options']


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
        instance = super().create(validated_data)
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

        return instance

    def _assign_level(self, validated_data):
        parent_level = validated_data.get('parent').level.level
        try:
            sublevel = Levels.objects.get(level=parent_level + 1)
        except Levels.DoesNotExist as e:
            raise ValueError() from e
        validated_data.update({'level': sublevel})
