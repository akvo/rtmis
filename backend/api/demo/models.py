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
