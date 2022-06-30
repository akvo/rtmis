from api.v1.v1_profile.constants import UserDesignationTypes, OrganisationTypes
from django.contrib.auth.base_user import AbstractBaseUser
from django.contrib.auth.models import PermissionsMixin
from django.core import signing
from django.db import models

# Create your models here.
from utils.custom_manager import UserManager


class Organisation(models.Model):
    name = models.CharField(max_length=255, unique=True)

    def __str__(self):
        return self.name

    class Meta:
        db_table = 'organisation'


class OrganisationAttribute(models.Model):
    organisation = models.ForeignKey(
        to=Organisation,
        on_delete=models.CASCADE,
        related_name='organisation_organisation_attribute')
    type = models.IntegerField(choices=OrganisationTypes.FieldStr.items())

    def __str__(self):
        return self.organisation

    class Meta:
        unique_together = ('organisation', 'type')
        db_table = 'organisation_attribute'


class SystemUser(AbstractBaseUser, PermissionsMixin):
    email = models.EmailField(max_length=254, unique=True)
    date_joined = models.DateTimeField(auto_now_add=True)
    first_name = models.CharField(max_length=50)
    last_name = models.CharField(max_length=50)
    phone_number = models.CharField(max_length=15, default=None, null=True)
    designation = models.CharField(max_length=50, default=None, null=True)
    trained = models.BooleanField(default=False)
    updated = models.DateTimeField(default=None, null=True)
    deleted_at = models.DateTimeField(default=None, null=True)
    organisation = models.ForeignKey(to=Organisation,
                                     on_delete=models.SET_NULL,
                                     related_name='user_organisation',
                                     default=None,
                                     null=True)
    objects = UserManager()

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['first_name', 'last_name']

    def get_full_name(self):
        return '{0} {1}'.format(self.first_name, self.last_name)

    @property
    def name(self):
        return '{0} {1}'.format(self.first_name, self.last_name)

    @property
    def designation_name(self):
        if self.designation:
            return UserDesignationTypes.FieldStr.get(int(self.designation))
        return None

    def get_sign_pk(self):
        return signing.dumps(self.pk)

    class Meta:
        db_table = "system_user"
