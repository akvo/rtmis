import json

from django.core.management import BaseCommand

from api.demo.models import City, RegisteredUsers


class Command(BaseCommand):
    def handle(self, *args, **options):
        with open('sample_data/country_new.json', 'r') as f:
            data = json.load(f)
        mapping_list = []
        for feature in data.get('features'):
            try:
                city = City.objects.get(name=feature.get('properties').get('name'))
                users = city.user_city.values_list('pk', flat=True)  # Getting list of users related to the city

                # If city id is updated than process to migrate new data
                if city.pk != feature.get('id'):
                    print('---- Updating City ID from {0} to {1}, affected users are {2}'.format(city.pk,
                                                                                                 feature.get('id'),
                                                                                                 list(users)))
                    mapping_list.append({'new_id': feature.get('id'), 'users': list(users)})
                    city.delete()
                    City.objects.create(
                        id=feature.get('id'),
                        name=feature.get('properties').get('name')
                    )

            except City.DoesNotExist:
                # If city does not exists, create new entry
                City.objects.create(
                    id=feature.get('id'),
                    name=feature.get('properties').get('name')
                )
                print('---- New Record Created -----')
        print(mapping_list)
        for mapping in mapping_list:
            if len(mapping.get('users')):
                RegisteredUsers.objects.filter(pk__in=mapping.get('users')).update(city_id=mapping.get('new_id'))
