import random
import re
import uuid

from django.core.management import BaseCommand
from faker import Faker

from api.v1.v1_profile.constants import UserRoleTypes, UserDesignationTypes
from api.v1.v1_profile.constants import OrganisationTypes
from api.v1.v1_profile.models import Levels, Access, Administration
from api.v1.v1_users.models import SystemUser, Organisation

fake = Faker()


def create_user(role, administration, random_password: bool = True):
    profile = fake.profile()
    name = profile.get("name")
    email = ("{}@test.com").format(
        re.sub('[^A-Za-z0-9]+', '', name.lower()))
    email = "{}_{}".format(str(uuid.uuid4())[:4], email)
    name = name.split(" ")
    organisation = Organisation.objects.filter(
        organisation_organisation_attribute=OrganisationTypes.member
    ).order_by('?').first()
    user = SystemUser.objects.create(
        email=email,
        first_name=name[0],
        last_name=name[1],
        phone_number=fake.msisdn(),
        designation=UserDesignationTypes.sa
    )
    if organisation:
        user.organisation = organisation
    if random_password:
        password = random.choice(["test", None])
        if password:
            user.set_password(password)
    if not random_password:
        user.set_password("test")
    user.save()
    Access.objects.create(
        user=user,
        role=role,
        administration=administration
    )
    return user


class Command(BaseCommand):
    def add_arguments(self, parser):
        parser.add_argument("-r",
                            "--repeat",
                            nargs="?",
                            const=1,
                            default=1,
                            type=int)

    def handle(self, *args, **options):
        roles = [
            UserRoleTypes.super_admin, UserRoleTypes.admin,
            UserRoleTypes.approver, UserRoleTypes.user
        ]
        for a in range(options.get("repeat")):
            role_level = fake.random_int(min=1, max=3)
            level = Levels.objects.filter(level=role_level).first()
            administration = Administration.objects.filter(
                level=level
            ).order_by('?').first()
            create_user(
                role=roles[role_level],
                administration=administration,
            )
