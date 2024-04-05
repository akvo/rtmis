import typing
from django.core.management.color import no_style
from django.db import connection
from django.test.client import Client
from faker import Faker
from api.v1.v1_profile.constants import UserRoleTypes
from api.v1.v1_profile.models import Access, Administration, Levels
from api.v1.v1_users.models import SystemUser

fake = Faker()


class HasTestClientProtocol(typing.Protocol):
    @property
    def client(self) -> Client:
        ...


class ProfileTestHelperMixin:

    ROLE_SUPER_ADMIN = 0
    ROLE_ADMIN = 1
    ROLE_APPROVER = 2
    ROLE_USER = 3

    ROLES_LEVELS = [
        UserRoleTypes.super_admin,
        UserRoleTypes.admin,
        UserRoleTypes.approver,
        UserRoleTypes.user
    ]

    def create_user(
        self,
        email: str,
        role_level: int,
        password: str = 'password',
        administration: Administration = None
    ) -> SystemUser:
        profile = fake.profile()
        name = profile.get("name")
        name = name.split(" ")
        user = SystemUser.objects.create(
            email=email,
            first_name=name[0],
            last_name=name[1])
        user.set_password(password)
        user.save()

        level = Levels.objects.filter(level=role_level).first()
        administration = administration or Administration.objects.filter(
                level=level).order_by('?').first()
        Access.objects.create(
            user=user,
            role=self.ROLES_LEVELS[role_level],
            administration=administration,
        )
        return user

    @staticmethod
    def reset_db_sequence(*models):
        """
        Auto fields are no longer incrementing after running create with
        explicit id parameter

        see: https://code.djangoproject.com/ticket/11423
        """
        sequence_sql = connection.ops.sequence_reset_sql(no_style(), models)
        with connection.cursor() as cursor:
            for sql in sequence_sql:
                cursor.execute(sql)

    def get_auth_token(self: HasTestClientProtocol,
                       email: str,
                       password: str = 'password') -> str:
        response = self.client.post(
                '/api/v1/login',
                {'email': email, 'password': password},
                content_type='application/json')
        user = response.json()
        return user.get('token')
