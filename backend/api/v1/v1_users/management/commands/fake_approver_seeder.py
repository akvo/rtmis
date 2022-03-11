from faker import Faker
import re
import uuid

from django.core.management import BaseCommand
from api.v1.v1_users.models import SystemUser
from api.v1.v1_profile.models import Access, Levels, Administration
from api.v1.v1_profile.constants import UserRoleTypes

fake = Faker()


def new_user(administrations, roles, last_name):
    for administration in administrations:
        email = ("{}{}@test.com").format(
            re.sub('[^A-Za-z0-9]+', '', administration.name.lower()),
            administration.id)
        email = "{}_{}".format(str(uuid.uuid4())[:4], email)
        user, created = SystemUser.objects.get_or_create(
            email=email, first_name=administration.name, last_name=last_name)
        user.set_password("test")
        user.save()
        Access.objects.create(user=user,
                              role=roles[administration.level.level - 1],
                              administration=administration)


class Command(BaseCommand):
    def handle(self, *args, **options):
        # Admin
        roles = [UserRoleTypes.admin]
        levels = Levels.objects.filter(level__gt=1).all()
        for _ in levels:
            roles.append(UserRoleTypes.approver)
        administrations = Administration.objects.filter(level__level=1).all()
        new_user(administrations, roles, "Admin")
        # Approver
        administrations = Administration.objects.filter(
            level__level__gt=1).order_by('?')[:50]
        new_user(administrations, roles, "Approver")
