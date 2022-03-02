from faker import Faker

from django.core.management import BaseCommand
from api.v1.v1_users.models import SystemUser
from api.v1.v1_profile.models import Access, Administration
from api.v1.v1_profile.constants import UserRoleTypes

fake = Faker()


class Command(BaseCommand):
    def handle(self, *args, **options):
        administrations = Administration.objects.filter(
                level__level__gt=1).order_by('?')[:50]
        for administration in administrations:
            profile = fake.profile()
            name = profile.get("name").split(" ")
            user = SystemUser.objects.create_user(email=profile.get("mail"),
                                                  password="Test105",
                                                  first_name=name[0],
                                                  last_name=name[1])
            Access.objects.create(user=user,
                                  role=UserRoleTypes.approver,
                                  administration=administration)
