from django.db import models
from api.v1.v1_users.models import SystemUser
from api.v1.v1_forms.models import Forms, UserForms
from django.contrib.auth.hashers import make_password, check_password


class MobileFormAssignmentManager(models.Manager):
    def create(self, name, user, passcode, forms):
        mobile_assignment = self.model(
            name=name, user=user, passcode=make_password(passcode))
        user_forms = UserForms.objects.filter(user=user).all()
        user_forms = [uf.form for uf in user_forms]
        for form in forms:
            if form in user_forms:
                mobile_assignment.forms.add(form)
        mobile_assignment.save(using=self._db)
        return mobile_assignment

    def add_form(self, user, forms):
        user_forms = UserForms.objects.filter(user=user).all()
        user_forms = [uf.form for uf in user_forms]
        mobile_assignment = self.get(user=user)
        for form in forms:
            if form in user_forms:
                mobile_assignment.forms.add(form)
        mobile_assignment.save(using=self._db)
        return mobile_assignment

    def remove_form(self, user, forms):
        mobile_assignment = self.get(user=user)
        for form in forms:
            mobile_assignment.forms.remove(form)
        mobile_assignment.save(using=self._db)
        return mobile_assignment

    def authenticate(self, user, passcode):
        try:
            mobile_assignment = self.get(user=user)
            if check_password(passcode, mobile_assignment.passcode):
                return mobile_assignment
        except MobileFormAssignment.DoesNotExist:
            return None


class MobileFormAssignment(models.Model):
    name = models.CharField(max_length=50)
    user = models.ForeignKey(
        SystemUser, on_delete=models.CASCADE, related_name="mobiles"
    )
    passcode = models.CharField(max_length=128)
    forms = models.ManyToManyField(Forms, related_name="mobiles")

    objects = MobileFormAssignmentManager()

    def __str__(self):
        return f"Mobile: {self.id} {self.name}"
