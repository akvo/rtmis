from django.db import models
from api.v1.v1_users.models import SystemUser
from api.v1.v1_profile.models import Administration
from api.v1.v1_forms.models import Forms
from utils.custom_helper import generate_random_string, CustomPasscode


class MobileAssignmentManager(models.Manager):
    def create_assignment(self, user, name, passcode=None):
        if not passcode:
            passcode = generate_random_string(8)
        mobile_assignment = self.create(
            user=user,
            name=name,
            passcode=CustomPasscode().encode(passcode),
        )
        return mobile_assignment


class MobileAssignment(models.Model):
    name = models.CharField(max_length=255, null=True, blank=True)
    passcode = models.CharField(max_length=256)
    user = models.ForeignKey(
        SystemUser, on_delete=models.CASCADE, related_name='mobile_assignments'
    )
    token = models.CharField(max_length=500)  # TODO: Unnecessary, remove?
    created_at = models.DateTimeField(auto_now_add=True)

    forms = models.ManyToManyField(Forms)
    administrations = models.ManyToManyField(Administration)

    def set_passcode(self, passcode):
        self.passcode = CustomPasscode().encode(passcode)

    def get_passcode(self):
        return self.passcode

    objects = MobileAssignmentManager()

    def __str__(self):
        return f'{self.token}'

    class Meta:
        db_table = 'mobile_assignments'
        verbose_name = 'Mobile Assignment'
        verbose_name_plural = 'Mobile Assignments'


class MobileApk(models.Model):
    apk_version = models.CharField(max_length=50)
    apk_url = models.CharField(max_length=255)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f'{self.version}'

    class Meta:
        db_table = 'mobile_apks'
        verbose_name = 'Mobile Apk'
        verbose_name_plural = 'Mobile Apks'
