from django.db import models
from api.v1.v1_users.models import SystemUser
from api.v1.v1_forms.models import Forms


class Mobile(models.Model):
    name = models.CharField(max_length=50)
    user = models.ForeignKey(SystemUser,
                             on_delete=models.CASCADE,
                             related_name='mobiles')
    mobile_passcode = models.CharField(max_length=10)
    forms = models.ManyToManyField(Forms, related_name='mobiles')

    def __str__(self):
        return f'Mobile: {self.id} {self.name}'
