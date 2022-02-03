import uuid

from django.db import models

# Create your models here.
from api.v1.v1_forms.constants import DataApprovalStatus, QuestionTypes, \
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


class FormData(models.Model):
    name = models.TextField()
    form = models.ForeignKey(to=Forms,
                             on_delete=models.CASCADE,
                             related_name='form_form_data')
    administration = models.ForeignKey(to=Administration,
                                       on_delete=models.CASCADE,
                                       related_name='administration_form_data')
    geo = models.JSONField(null=True, default=None)
    created_by = models.ForeignKey(to=SystemUser,
                                   on_delete=models.CASCADE,
                                   related_name='form_data_created')
    updated_by = models.ForeignKey(to=SystemUser,
                                   on_delete=models.CASCADE,
                                   related_name='form_data_updated')
    created = models.DateTimeField(auto_now_add=True)
    updated = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name

    class Meta:
        db_table = 'data'


class PendingFormData(models.Model):
    name = models.TextField()
    form = models.ForeignKey(to=Forms,
                             on_delete=models.CASCADE,
                             related_name='pending_form_form_data')
    data = models.ForeignKey(to=FormData,
                             on_delete=models.CASCADE,
                             related_name='pending_data_form_data',
                             default=None,
                             null=True)
    administration = models.ForeignKey(
        to=Administration,
        on_delete=models.CASCADE,
        related_name='administration_pending_form_data')  # noqa
    geo = models.JSONField(null=True, default=None)
    approved = models.BooleanField(default=False)
    created_by = models.ForeignKey(to=SystemUser,
                                   on_delete=models.CASCADE,
                                   related_name='pending_form_data_created')

    created = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name

    class Meta:
        db_table = 'pending_data'


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
    updated = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.user.email

    class Meta:
        db_table = 'form_approval_assignment'


class PendingDataApproval(models.Model):
    pending_data = models.ForeignKey(to=PendingFormData,
                                     on_delete=models.CASCADE,
                                     related_name='pending_data_form_approval')
    user = models.ForeignKey(to=SystemUser,
                             on_delete=models.CASCADE,
                             related_name='user_assigned_pending_data')
    status = models.IntegerField(choices=DataApprovalStatus.FieldStr.items(),
                                 default=DataApprovalStatus.pending)

    def __str__(self):
        return self.user.email

    class Meta:
        db_table = 'pending_data_approval'


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


class PendingAnswers(models.Model):
    pending_data = models.ForeignKey(to=PendingFormData,
                                     on_delete=models.CASCADE,
                                     related_name='pending_data_answer')
    question = models.ForeignKey(to=Questions,
                                 on_delete=models.CASCADE,
                                 related_name='question_pending_answer')
    name = models.TextField()
    value = models.BigIntegerField(null=True, default=None)
    options = models.JSONField(default=None, null=True)
    created_by = models.ForeignKey(to=SystemUser,
                                   on_delete=models.CASCADE,
                                   related_name='pending_answer_created')
    created = models.DateTimeField(auto_now_add=True)
    updated = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name

    class Meta:
        db_table = 'pending_answer'


class Answers(models.Model):
    data = models.ForeignKey(to=FormData,
                             on_delete=models.CASCADE,
                             related_name='data_answer')
    question = models.ForeignKey(to=Questions,
                                 on_delete=models.CASCADE,
                                 related_name='question_answer')
    name = models.TextField(null=True, default=None)
    value = models.BigIntegerField(null=True, default=None)
    options = models.JSONField(default=None, null=True)
    created_by = models.ForeignKey(to=SystemUser,
                                   on_delete=models.CASCADE,
                                   related_name='answer_created')
    created = models.DateTimeField(auto_now_add=True)
    updated = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.data.name

    class Meta:
        db_table = 'answer'


class AnswerHistory(models.Model):
    data = models.ForeignKey(to=FormData,
                             on_delete=models.CASCADE,
                             related_name='data_answer_history')
    question = models.ForeignKey(to=Questions,
                                 on_delete=models.CASCADE,
                                 related_name='question_answer_history')
    name = models.TextField()
    value = models.BigIntegerField(null=True, default=None)
    options = models.JSONField(default=None, null=True)
    created_by = models.OneToOneField(to=SystemUser,
                                      on_delete=models.CASCADE,
                                      related_name='answer_history_created')
    created = models.DateTimeField(auto_now_add=True)
    updated = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name

    class Meta:
        db_table = 'answer_history'
