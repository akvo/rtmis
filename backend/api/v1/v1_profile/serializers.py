from rest_framework import serializers
from api.v1.v1_profile.models import Administration, Levels


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


class AdministrationSerializer(serializers.ModelSerializer):
    parent = RelatedAdministrationField(queryset=Administration.objects.all())  # type: ignore
    level = AdministrationLevelsSerializer(read_only=True)
    children = RelatedAdministrationField(source='parent_administration', read_only=True, many=True)

    class Meta:
        model = Administration
        fields = ['id', 'name', 'code', 'parent', 'level', 'children']

    def __init__(self, *args, **kwargs):
        compact = kwargs.pop('compact', False)
        super().__init__(*args, **kwargs)
        if compact:
            allowed = set(['id', 'name', 'code', 'parent', 'level'])
            existing = set(self.fields)
            for field_name in existing - allowed:
                self.fields.pop(field_name)

    def create(self, validated_data):
        self._assign_level(validated_data)
        return super().create(validated_data)

    def update(self, instance, validated_data):
        self._assign_level(validated_data)
        return super().update(instance, validated_data)

    def _assign_level(self, validated_data):
        parent_level = validated_data.get('parent').level.level
        try:
            sublevel = Levels.objects.get(level=parent_level + 1)
        except Levels.DoesNotExist as e:
            raise ValueError() from e
        validated_data.update({'level': sublevel})
