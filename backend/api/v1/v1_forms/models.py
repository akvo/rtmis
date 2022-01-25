import uuid

from django.db import models

# Create your models here.
from api.v1.v1_forms.constants import DataApprovalStatus, QuestionTypes
from api.v1.v1_profile.models import Administration
from api.v1.v1_users.models import SystemUser


class Forms(models.Model):
    name = models.TextField()
    version = models.IntegerField(default=1)
    uuid = models.UUIDField(default=uuid.uuid4(), editable=False, unique=True)
    approval_level = models.JSONField(default=None, null=True)

    def __str__(self):
        return self.name

    class Meta:
        db_table = 'form'


class FormData(models.Model):
    name = models.CharField(max_length=255)
    form = models.ForeignKey(to=Forms, on_delete=models.CASCADE,
                             related_name='form_form_data')
    administration = models.ForeignKey(to=Administration,
                                       on_delete=models.CASCADE,
                                       related_name='administration_form_data')
    geo = models.JSONField(null=True, default=None)
    approved = models.BooleanField(default=False)
    # TODO: confirm relation
    created_by = models.OneToOneField(to=SystemUser, on_delete=models.CASCADE,
                                      related_name='form_data_created')
    updated_by = models.OneToOneField(to=SystemUser, on_delete=models.CASCADE,
                                      related_name='form_data_updated')
    created = models.DateTimeField(auto_now_add=True)
    updated = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name

    class Meta:
        db_table = 'data'


class DataApproval(models.Model):
    data = models.OneToOneField(to=FormData, on_delete=models.CASCADE,
                                related_name='form_data_approval')
    user = models.ForeignKey(to=SystemUser, on_delete=models.CASCADE,
                             related_name='user_data_approval')
    status = models.IntegerField(choices=DataApprovalStatus.FieldStr.items(),
                                 default=DataApprovalStatus.pending)
    updated = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.user.email

    class Meta:
        db_table = 'data_approval'


class QuestionGroup(models.Model):
    form = models.ForeignKey(to=Forms, on_delete=models.CASCADE,
                             related_name='form_question_group')
    name = models.TextField()

    def __str__(self):
        return self.name

    class Meta:
        db_table = 'question_group'


class Questions(models.Model):
    form = models.ForeignKey(to=Forms, on_delete=models.CASCADE,
                             related_name='form_questions')
    question_group = models.ForeignKey(to=QuestionGroup,
                                       on_delete=models.CASCADE,
                                       related_name='question_group_question')
    order = models.BigIntegerField(null=True, default=None)
    text = models.TextField()
    name = models.CharField(max_length=255)
    type = models.IntegerField(choices=QuestionTypes.FieldStr.items())
    required = models.BooleanField(default=True)
    rule = models.JSONField(default=None, null=True)
    dependency = models.JSONField(default=None,
                                  null=True)

    def __str__(self):
        return self.text

    class Meta:
        db_table = 'question'


class QuestionOptions(models.Model):
    question = models.ForeignKey(to=Questions, on_delete=models.CASCADE,
                                 related_name='qustion_question_options')
    order = models.BigIntegerField(null=True, default=None)
    code = models.CharField(max_length=255, default=None, null=True)
    name = models.TextField()
    other = models.BooleanField()
    created = models.DateTimeField(auto_now_add=True)
    updated = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name

    class Meta:
        db_table = 'option'


class Answers(models.Model):
    data = models.ForeignKey(to=FormData, on_delete=models.CASCADE,
                             related_name='data_answer')
    question = models.ForeignKey(to=Questions, on_delete=models.CASCADE,
                                 related_name='question_answer')
    name = models.TextField()
    value = models.BigIntegerField(null=True, default=None)
    options = models.JSONField(default=None, null=True)
    created_by = models.ForeignKey(to=SystemUser, on_delete=models.CASCADE,
                                   related_name='answer_created')
    created = models.DateTimeField(auto_now_add=True)
    updated = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name

    class Meta:
        db_table = 'answer'


class AnswerHistory(models.Model):
    data = models.ForeignKey(to=FormData, on_delete=models.CASCADE,
                             related_name='data_answer_history')
    question = models.ForeignKey(to=Questions, on_delete=models.CASCADE,
                                 related_name='question_answer_history')
    name = models.TextField()
    value = models.BigIntegerField(null=True, default=None)
    options = models.JSONField(default=None, null=True)
    created_by = models.OneToOneField(to=SystemUser, on_delete=models.CASCADE,
                                      related_name='answer_history_created')
    created = models.DateTimeField(auto_now_add=True)
    updated = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name

    class Meta:
        db_table = 'answer_history'
