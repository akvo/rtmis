from rest_framework import serializers
from rest_framework.exceptions import APIException


class DefaultResponseSerializer(serializers.Serializer):
    message = serializers.CharField(max_length=None,
                                    min_length=None,
                                    allow_blank=False,
                                    trim_whitespace=True)


class DefaultErrorResponseSerializer(APIException):
    message = serializers.CharField(max_length=None,
                                    min_length=None,
                                    required=False,
                                    trim_whitespace=True)
    default_detail = 'Service temporarily unavailable, try again later.'


class CommonDataSerializer(serializers.Serializer):
    id = serializers.IntegerField()
    name = serializers.CharField()


class GeoFormatSerializer(serializers.Serializer):
    lat = serializers.FloatField()
    lng = serializers.FloatField()
