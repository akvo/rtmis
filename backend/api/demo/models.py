# Create your models here.
from django.db import models


class CountryMaster(models.Model):
    name = models.CharField(max_length=20)
    code = models.CharField(max_length=4)
    created_ts = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name

    class Meta:
        db_table = 'country_master'


class City(models.Model):
    name = models.CharField(max_length=50)

    def __str__(self):
        return self.name

    class Meta:
        db_table = 'city'


class RegisteredUsers(models.Model):
    username = models.CharField(max_length=50, unique=True)
    city = models.ForeignKey(default=None, null=True, to=City, on_delete=models.SET_NULL, related_name='user_city')

    def __str__(self):
        return self.username

    class Meta:
        db_table = 'registered_users'
