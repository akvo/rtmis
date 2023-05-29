from drf_spectacular.types import OpenApiTypes
from drf_spectacular.utils import extend_schema_field, inline_serializer
from rest_framework import serializers
from api.v1.v1_profile.models import Administration
from api.v1.v1_data.models import FormData, Answers

from utils.functions import update_date_time_format, get_answer_value


class ListRawDataAnswerSerializer(serializers.ModelSerializer):
    question = serializers.SerializerMethodField()
    value = serializers.SerializerMethodField()

    @extend_schema_field(OpenApiTypes.ANY)
    def get_value(self, instance: Answers):
        return get_answer_value(instance)

    @extend_schema_field(OpenApiTypes.STR)
    def get_question(self, instance: Answers):
        qname = "|".join([str(instance.question.id), instance.question.name])
        return qname

    class Meta:
        model = Answers
        fields = ["question", "value"]


class ListRawDataSerializer(serializers.ModelSerializer):
    administration = serializers.SerializerMethodField()
    geo = serializers.SerializerMethodField()

    @extend_schema_field(OpenApiTypes.STR)
    def get_administration(self, instance: FormData):
        administration_path = list(
            filter(lambda x: x != "", instance.administration.path.split("."))
        )
        administration_path = [int(x) for x in administration_path]
        administration_path += [instance.administration.id]
        all_administrations = (
            Administration.objects.filter(pk__in=administration_path)
            .order_by("level")
            .values_list("name", flat=True)
        )
        return " - ".join(all_administrations)

    @extend_schema_field(OpenApiTypes.STR)
    def get_created(self, instance: FormData):
        return update_date_time_format(instance.created)

    @extend_schema_field(
        inline_serializer(
            "Geopoint",
            fields={
                "lat": serializers.FloatField(),
                "lng": serializers.FloatField(),
            },
        )
    )
    def get_geo(self, instance: FormData):
        if instance.geo:
            return {"lat": instance.geo[0], "lng": instance.geo[1]}
        return None

    class Meta:
        model = FormData
        fields = ["id", "name", "administration", "geo"]
