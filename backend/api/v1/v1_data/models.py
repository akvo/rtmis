from django.db import models

# Create your models here.
from api.v1.v1_data.constants import DataApprovalStatus
from api.v1.v1_forms.models import Forms, Questions
from api.v1.v1_profile.models import Administration, Levels
from api.v1.v1_users.models import SystemUser


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
                                   related_name='form_data_updated',
                                   default=None, null=True)
    created = models.DateTimeField(auto_now_add=True)
    updated = models.DateTimeField(default=None, null=True)

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
    batch = models.UUIDField(default=None, null=True)
    created_by = models.ForeignKey(to=SystemUser,
                                   on_delete=models.CASCADE,
                                   related_name='pending_form_data_created')

    created = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name

    class Meta:
        db_table = 'pending_data'


class PendingDataApproval(models.Model):
    pending_data = models.ForeignKey(to=PendingFormData,
                                     on_delete=models.CASCADE,
                                     related_name='pending_data_form_approval')
    user = models.ForeignKey(to=SystemUser,
                             on_delete=models.CASCADE,
                             related_name='user_assigned_pending_data')
    level = models.ForeignKey(to=Levels,
                              on_delete=models.CASCADE,
                              related_name='level_assigned_pending_data')
    status = models.IntegerField(choices=DataApprovalStatus.FieldStr.items(),
                                 default=DataApprovalStatus.pending)

    def __str__(self):
        return self.user.email

    class Meta:
        db_table = 'pending_data_approval'


class PendingAnswers(models.Model):
    pending_data = models.ForeignKey(to=PendingFormData,
                                     on_delete=models.CASCADE,
                                     related_name='pending_data_answer')
    question = models.ForeignKey(to=Questions,
                                 on_delete=models.CASCADE,
                                 related_name='question_pending_answer')
    name = models.TextField(null=True, default=None)
    value = models.BigIntegerField(null=True, default=None)
    options = models.JSONField(default=None, null=True)
    created_by = models.ForeignKey(to=SystemUser,
                                   on_delete=models.CASCADE,
                                   related_name='pending_answer_created')
    created = models.DateTimeField(auto_now_add=True)
    updated = models.DateTimeField(default=None, null=True)

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
    updated = models.DateTimeField(default=None, null=True)

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
    updated = models.DateTimeField(default=None, null=True)

    def __str__(self):
        return self.name

    class Meta:
        db_table = 'answer_history'
