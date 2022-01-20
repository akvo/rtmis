import json

from django.core.management import BaseCommand

from api.demo.models import City, RegisteredUsers


def create_user():
    data = [{'username': 'Nirav', 'city_id': 1}, {'username': 'Bhavin', 'city_id': 2}]
    for val in data:
        RegisteredUsers.objects.create(
            username=val.get('username'),
            city_id=val.get('city_id'),
        )


class Command(BaseCommand):
    def handle(self, *args, **options):
        City.objects.all().delete()
        RegisteredUsers.objects.all().delete()
        with open('sample_data/country.json', 'r') as f:
            data = json.load(f)
        for val in data.get('features'):
            City.objects.create(
                id=val.get('id'),
                name=val.get('properties').get('name')
            )
        create_user()
