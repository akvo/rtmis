import random
import re

from django.core.management import BaseCommand
from django.db import IntegrityError
from faker import Faker

from api.v1.v1_profile.constants import UserRoleTypes
from api.v1.v1_profile.models import Levels, Access, Administration
from api.v1.v1_users.models import SystemUser

fake = Faker()


class Command(BaseCommand):
    def add_arguments(self, parser):
        parser.add_argument("-r",
                            "--repeat",
                            nargs="?",
                            const=1,
                            default=1,
                            type=int)

    def handle(self, *args, **options):
        for a in range(options.get("repeat")):
            profile = fake.profile()
            name = profile.get("name")
            email = ("{}@test.com").format(
                re.sub('[^A-Za-z0-9]+', '', name.lower()))
            name = name.split(" ")
            role_level = fake.random_int(min=1, max=3)
            roles = [
                UserRoleTypes.super_admin, UserRoleTypes.admin,
                UserRoleTypes.approver, UserRoleTypes.user
            ]
            password = random.choice(["test", None])
            try:
                user = SystemUser.objects.create(
                    email=email,
                    first_name=name[0],
                    last_name=name[1],
                    phone_number=fake.msisdn(),
                    designation=profile.get('job')[:49])
                if password:
                    user.set_password(password)
                    user.save()
                level = Levels.objects.filter(level=role_level).first()
                Access.objects.create(
                    user=user,
                    role=roles[role_level],
                    administration=Administration.objects.filter(
                        level=level).order_by('?').first())
            except IntegrityError:
                pass
