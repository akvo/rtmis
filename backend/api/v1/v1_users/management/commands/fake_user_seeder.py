from faker import Faker
import random

from django.core.management import BaseCommand
from django.db.transaction import atomic
from api.v1.v1_users.models import SystemUser
from api.v1.v1_profile.models import Levels, Access, Administration
from api.v1.v1_profile.constants import UserRoleTypes

fake = Faker()


class Command(BaseCommand):
    def add_arguments(self, parser):
        parser.add_argument("-r",
                            "--repeat",
                            nargs="?",
                            const=1,
                            default=1,
                            type=int)

    @atomic
    def handle(self, *args, **options):
        for a in range(options.get("repeat")):
            profile = fake.profile()
            name = profile.get("name").split(" ")
            role_level = fake.random_int(min=1, max=3)
            roles = [
                UserRoleTypes.super_admin, UserRoleTypes.admin,
                UserRoleTypes.approver, UserRoleTypes.user
            ]
            password = random.choice(["Test105*", None])
            user = SystemUser.objects.create_user(
                email=profile.get("mail"),
                password=password,
                first_name=name[0],
                last_name=name[1])
            level = Levels.objects.filter(level=role_level).first()
            Access.objects.create(user=user,
                                  role=roles[role_level],
                                  administration=Administration.objects.filter(
                                      level=level).order_by('?').first())
