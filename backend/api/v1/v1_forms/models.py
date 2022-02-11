import uuid

from django.db import models

# Create your models here.
from api.v1.v1_forms.constants import QuestionTypes, \
    FormTypes
from api.v1.v1_profile.models import Administration, Levels
from api.v1.v1_users.models import SystemUser


class Forms(models.Model):
    name = models.TextField()
    version = models.IntegerField(default=1)
    uuid = models.UUIDField(default=uuid.uuid4, editable=False, unique=True)
    type = models.IntegerField(choices=FormTypes.FieldStr.items(),
                               default=None,
                               null=True)

    def __str__(self):
        return self.name

    class Meta:
        db_table = 'form'


class FormApprovalRule(models.Model):
    form = models.ForeignKey(to=Forms,
                             on_delete=models.CASCADE,
                             related_name='form_form_approval_rule')
    administration = models.ForeignKey(
        to=Administration,
        on_delete=models.CASCADE,
        related_name='administration_form_approval')  # noqa
    levels = models.ManyToManyField(to=Levels,
                                    related_name='levels_form_approval')

    def __str__(self):
        return self.form.name

    class Meta:
        db_table = 'form_approval_rule'


class FormApprovalAssignment(models.Model):
    form = models.ForeignKey(to=Forms,
                             on_delete=models.CASCADE,
                             related_name='form_data_approval')
    administration = models.ForeignKey(
        to=Administration,
        on_delete=models.CASCADE,
        related_name='administration_data_approval')  # noqa
    user = models.ForeignKey(to=SystemUser,
                             on_delete=models.CASCADE,
                             related_name='user_data_approval')
    updated = models.DateTimeField(default=None, null=True)

    def __str__(self):
        return self.user.email

    class Meta:
        db_table = 'form_approval_assignment'


class QuestionGroup(models.Model):
    form = models.ForeignKey(to=Forms,
                             on_delete=models.CASCADE,
                             related_name='form_question_group')
    name = models.TextField()

    def __str__(self):
        return self.name

    class Meta:
        db_table = 'question_group'


class Questions(models.Model):
    form = models.ForeignKey(to=Forms,
                             on_delete=models.CASCADE,
                             related_name='form_questions')
    question_group = models.ForeignKey(to=QuestionGroup,
                                       on_delete=models.CASCADE,
                                       related_name='question_group_question')
    order = models.BigIntegerField(null=True, default=None)
    text = models.TextField()
    name = models.CharField(max_length=255)
    type = models.IntegerField(choices=QuestionTypes.FieldStr.items())
    meta = models.BooleanField(default=False)
    required = models.BooleanField(default=True)
    rule = models.JSONField(default=None, null=True)
    dependency = models.JSONField(default=None, null=True)

    def __str__(self):
        return self.text

    class Meta:
        db_table = 'question'


class QuestionOptions(models.Model):
    question = models.ForeignKey(to=Questions,
                                 on_delete=models.CASCADE,
                                 related_name='question_question_options')
    order = models.BigIntegerField(null=True, default=None)
    code = models.CharField(max_length=255, default=None, null=True)
    name = models.TextField()
    other = models.BooleanField(default=False)

    def __str__(self):
        return self.name

    class Meta:
        db_table = 'option'
