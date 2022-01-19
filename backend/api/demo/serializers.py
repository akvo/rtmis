import csv
import io

from rest_framework import serializers

from api.demo.models import CountryMaster


class LoginSerializer(serializers.Serializer):
    username = serializers.CharField()
    password = serializers.CharField()


class ImportCountrySerializer(serializers.Serializer):
    file = serializers.FileField()

    # validate file extension is csv
    def validate_file(self, file):
        name = file.name
        if not name.endswith('.csv'):
            raise serializers.ValidationError('Please upload valid CSV file')
        return file

    def create(self, validated_data):
        # read uploaded file and insert data into DB
        decoded_file = validated_data.get('file').read().decode()
        io_string = io.StringIO(decoded_file)
        reader = csv.reader(io_string)
        for row in reader:
            CountryMaster.objects.create(
                name=row[0],
                code=row[1],
            )
        return object


class ListCountrySerializer(serializers.ModelSerializer):
    class Meta:
        model = CountryMaster
        fields = ['name', 'code']
