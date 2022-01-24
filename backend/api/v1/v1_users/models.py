from django.contrib.auth.base_user import AbstractBaseUser
from django.contrib.auth.models import PermissionsMixin
from django.core import signing
from django.db import models

# Create your models here.
from utils.custom_manager import UserManager


class SystemUser(AbstractBaseUser, PermissionsMixin):
    email = models.EmailField(max_length=254, unique=True)
    date_joined = models.DateTimeField(auto_now_add=True)
    objects = UserManager()

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = []

    def get_sign_pk(self):
        return signing.dumps(self.pk)

    class Meta:
        db_table = "system_user"
