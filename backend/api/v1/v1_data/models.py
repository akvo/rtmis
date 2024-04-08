from django.db import models

# Create your models here.
from api.v1.v1_data.constants import DataApprovalStatus
from api.v1.v1_forms.constants import (
    QuestionTypes,
    SubmissionTypes,
)
from api.v1.v1_forms.models import Forms, Questions
from api.v1.v1_profile.models import Administration, Levels
from api.v1.v1_users.models import SystemUser
from utils.soft_deletes_model import SoftDeletes
import os
import uuid
import json
from utils import storage


class FormData(models.Model):
    parent = models.ForeignKey('self',
                               on_delete=models.CASCADE,
                               related_name='children',
                               null=True, blank=True)
    name = models.TextField()
    form = models.ForeignKey(to=Forms,
                             on_delete=models.CASCADE,
                             related_name='form_form_data')
    administration = models.ForeignKey(to=Administration,
                                       on_delete=models.PROTECT,
                                       related_name='administration_form_data')
    geo = models.JSONField(null=True, default=None)
    uuid = models.CharField(max_length=255, default=uuid.uuid4, null=True)
    submission_type = models.IntegerField(
        choices=SubmissionTypes.FieldStr.items(),
        default=SubmissionTypes.registration)
    created_by = models.ForeignKey(to=SystemUser,
                                   on_delete=models.CASCADE,
                                   related_name='form_data_created')
    updated_by = models.ForeignKey(to=SystemUser,
                                   on_delete=models.CASCADE,
                                   related_name='form_data_updated',
                                   default=None,
                                   null=True)
    created = models.DateTimeField(auto_now_add=True)
    updated = models.DateTimeField(default=None, null=True)

    def __str__(self):
        return self.name

    @property
    def to_data_frame(self):
        administration = self.administration
        data = {
            "id": self.id,
            "datapoint_name": self.name,
            "administration":
            administration.administration_column if administration else None,
            "uuid": self.uuid,
            "geolocation":
            f"{self.geo[0]}, {self.geo[1]}" if self.geo else None,
            "created_by":
            self.created_by.get_full_name(),
            "updated_by":
            self.updated_by.get_full_name() if self.updated_by else None,
            "created_at":
            self.created.strftime("%B %d, %Y %I:%M %p"),
            "updated_at":
            self.updated.strftime("%B %d, %Y %I:%M %p")
            if self.updated else None,
        }
        for a in self.data_answer.order_by(
                'question__question_group_id',
                'question__order').all():
            data.update(a.to_data_frame)
        return data

    @property
    def save_to_file(self):
        data = {
            "id": self.id,
            "datapoint_name": self.name,
            "administration":
            self.administration.id if self.administration else None,
            "uuid": str(self.uuid),
            "geolocation": self.geo,
            "submission_type": self.submission_type,
        }
        answers = {}
        for a in self.data_answer.order_by(
                'question__question_group_id',
                'question__order').all():
            answers.update(a.to_key)
        data.update({"answers": answers})
        json_data = json.dumps(data)
        file_name = f"{str(self.uuid)}.json"
        # write to json file
        with open(file_name, 'w') as f:
            f.write(json_data)
        storage.upload(file=file_name, folder="datapoints")
        # delete file
        os.remove(file_name)
        return data

    @property
    def loc(self):
        return self.administration.name

    class Meta:
        db_table = 'data'


class PendingDataBatch(models.Model):
    form = models.ForeignKey(to=Forms,
                             on_delete=models.CASCADE,
                             related_name='form_batch_data')
    administration = models.ForeignKey(
        to=Administration,
        on_delete=models.PROTECT,
        related_name='administration_pending_data_batch')
    user = models.ForeignKey(to=SystemUser,
                             on_delete=models.CASCADE,
                             related_name='user_pending_data_batch')
    name = models.TextField()
    uuid = models.UUIDField(default=None, null=True)
    file = models.URLField(default=None, null=True)
    approved = models.BooleanField(default=False)
    created = models.DateTimeField(auto_now_add=True)
    updated = models.DateTimeField(default=None, null=True)

    def __str__(self):
        return self.name

    class Meta:
        db_table = 'batch'


class PendingDataBatchComments(models.Model):
    batch = models.ForeignKey(to=PendingDataBatch,
                              on_delete=models.CASCADE,
                              related_name='batch_batch_comment')
    user = models.ForeignKey(to=SystemUser,
                             on_delete=models.CASCADE,
                             related_name='user_batch_comment')
    comment = models.TextField()
    created = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.comment

    class Meta:
        db_table = 'batch_comment'


class PendingFormData(SoftDeletes):
    name = models.TextField()
    form = models.ForeignKey(to=Forms,
                             on_delete=models.CASCADE,
                             related_name='pending_form_form_data')
    data = models.ForeignKey(to=FormData,
                             on_delete=models.CASCADE,
                             related_name='pending_data_form_data',
                             default=None,
                             null=True)
    submission_type = models.IntegerField(
        choices=SubmissionTypes.FieldStr.items(),
        default=SubmissionTypes.registration)
    administration = models.ForeignKey(
        to=Administration,
        on_delete=models.PROTECT,
        related_name='administration_pending_form_data')  # noqa
    geo = models.JSONField(null=True, default=None)
    uuid = models.CharField(max_length=255, default=uuid.uuid4, null=True)
    batch = models.ForeignKey(to=PendingDataBatch,
                              on_delete=models.SET_NULL,
                              default=None,
                              null=True,
                              related_name='batch_pending_data_batch')
    created_by = models.ForeignKey(to=SystemUser,
                                   on_delete=models.CASCADE,
                                   related_name='pending_form_data_created')
    updated_by = models.ForeignKey(to=SystemUser,
                                   on_delete=models.PROTECT,
                                   related_name='pending_form_data_updated',
                                   default=None,
                                   null=True)
    created = models.DateTimeField(auto_now_add=True)
    updated = models.DateTimeField(default=None, null=True)
    duration = models.IntegerField(default=0)
    submitter = models.CharField(max_length=255, default=None, null=True)

    def __str__(self):
        return self.name

    class Meta:
        db_table = 'pending_data'


class PendingDataApproval(models.Model):
    batch = models.ForeignKey(to=PendingDataBatch,
                              on_delete=models.CASCADE,
                              related_name='batch_approval')
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
    value = models.FloatField(null=True, default=None)
    options = models.JSONField(default=None, null=True)
    created_by = models.ForeignKey(to=SystemUser,
                                   on_delete=models.CASCADE,
                                   related_name='pending_answer_created')
    created = models.DateTimeField(auto_now_add=True)
    updated = models.DateTimeField(default=None, null=True)

    def __str__(self):
        return str(self.id)

    class Meta:
        db_table = 'pending_answer'


class PendingAnswerHistory(models.Model):
    pending_data = models.ForeignKey(
        to=PendingFormData,
        on_delete=models.CASCADE,
        related_name='pending_data_answer_history')
    question = models.ForeignKey(
        to=Questions,
        on_delete=models.CASCADE,
        related_name='question_pending_answer_history')
    name = models.TextField(null=True, default=None)
    value = models.FloatField(null=True, default=None)
    options = models.JSONField(default=None, null=True)
    created_by = models.ForeignKey(
        to=SystemUser,
        on_delete=models.PROTECT,
        related_name='pending_answer_history_created')
    created = models.DateTimeField(auto_now_add=True)
    updated = models.DateTimeField(default=None, null=True)

    def __str__(self):
        return self.name

    class Meta:
        db_table = 'pending_answer_history'


class Answers(models.Model):
    data = models.ForeignKey(to=FormData,
                             on_delete=models.CASCADE,
                             related_name='data_answer')
    question = models.ForeignKey(to=Questions,
                                 on_delete=models.CASCADE,
                                 related_name='question_answer')
    name = models.TextField(null=True, default=None)
    value = models.FloatField(null=True, default=None)
    options = models.JSONField(default=None, null=True)
    created_by = models.ForeignKey(to=SystemUser,
                                   on_delete=models.CASCADE,
                                   related_name='answer_created')
    created = models.DateTimeField(auto_now_add=True)
    updated = models.DateTimeField(default=None, null=True)

    def __str__(self):
        return self.data.name

    @property
    def to_data_frame(self) -> dict:
        q = self.question
        qname = f"{self.question.name}"
        if q.type in [
            QuestionTypes.geo, QuestionTypes.option,
            QuestionTypes.multiple_option
        ]:
            answer = '|'.join(map(str, self.options))
        elif q.type in [
            QuestionTypes.text, QuestionTypes.photo,
            QuestionTypes.date, QuestionTypes.autofield
        ]:
            answer = self.name
        elif q.type == QuestionTypes.administration:
            answer = Administration.objects.filter(
                pk=self.value).first()
            if answer:
                answer = answer.administration_column
        else:
            answer = self.value
        return {qname: answer}

    @property
    def to_key(self) -> dict:
        q = self.question
        if q.type in [
            QuestionTypes.geo, QuestionTypes.option,
            QuestionTypes.multiple_option
        ]:
            answer = self.options
        elif q.type in [
            QuestionTypes.text,
            QuestionTypes.photo,
            QuestionTypes.date,
            QuestionTypes.cascade,
        ]:
            answer = self.name
        else:
            answer = self.value
        return {q.id: answer}

    class Meta:
        db_table = 'answer'


class AnswerHistory(models.Model):
    data = models.ForeignKey(to=FormData,
                             on_delete=models.CASCADE,
                             related_name='data_answer_history')
    question = models.ForeignKey(to=Questions,
                                 on_delete=models.CASCADE,
                                 related_name='question_answer_history')
    name = models.TextField(null=True, default=None)
    value = models.FloatField(null=True, default=None)
    options = models.JSONField(default=None, null=True)
    created_by = models.ForeignKey(to=SystemUser,
                                   on_delete=models.CASCADE,
                                   related_name='answer_history_created')
    created = models.DateTimeField(auto_now_add=True)
    updated = models.DateTimeField(default=None, null=True)

    def __str__(self):
        return self.name

    class Meta:
        db_table = 'answer_history'


class ViewPendingDataApproval(models.Model):
    id = models.BigIntegerField(primary_key=True)
    status = models.IntegerField(choices=DataApprovalStatus.FieldStr.items(),
                                 default=DataApprovalStatus.pending)
    user = models.ForeignKey(to=SystemUser,
                             on_delete=models.DO_NOTHING,
                             related_name='user_view_pending_data')
    level = models.ForeignKey(to=Levels,
                              on_delete=models.DO_NOTHING,
                              related_name='level_view_pending_data')
    batch = models.ForeignKey(to=PendingDataBatch,
                              on_delete=models.DO_NOTHING,
                              related_name='batch_view_pending_data')
    pending_level = models.IntegerField()

    class Meta:
        managed = False
        db_table = 'view_pending_approval'


class ViewDataOptions(models.Model):
    id = models.BigIntegerField(primary_key=True)
    data = models.ForeignKey(to=FormData,
                             on_delete=models.DO_NOTHING,
                             related_name='data_view_data_options')
    administration = models.ForeignKey(
        to=Administration,
        on_delete=models.PROTECT,
        related_name='administration_view_data_options')
    form = models.ForeignKey(to=Forms,
                             on_delete=models.DO_NOTHING,
                             related_name='form_view_data_options')
    options = models.JSONField(default=None, null=True)

    class Meta:
        managed = False
        db_table = 'view_data_options'


class ViewOptions(models.Model):
    id = models.BigIntegerField(primary_key=True)
    data = models.ForeignKey(to=FormData,
                             on_delete=models.DO_NOTHING,
                             related_name='data_view_options')
    administration = models.ForeignKey(
        to=Administration,
        on_delete=models.PROTECT,
        related_name='administration_view_options')
    question = models.ForeignKey(to=Questions,
                                 on_delete=models.DO_NOTHING,
                                 related_name='question_view_options')
    answer = models.ForeignKey(to=Answers,
                               on_delete=models.DO_NOTHING,
                               related_name='answer_view_options')
    form = models.ForeignKey(to=Forms,
                             on_delete=models.DO_NOTHING,
                             related_name='form_view_options')
    options = models.TextField()

    class Meta:
        managed = False
        db_table = 'view_options'


class ViewJMPData(models.Model):
    id = models.BigIntegerField(primary_key=True)
    data = models.ForeignKey(to=FormData,
                             on_delete=models.DO_NOTHING,
                             related_name='data_view_jmp_data')
    path = models.TextField(null=True, default=None)
    form = models.ForeignKey(to=Forms,
                             on_delete=models.DO_NOTHING,
                             related_name='form_view_jmp_data')
    name = models.TextField()
    level = models.TextField()
    matches = models.IntegerField()
    score = models.IntegerField()

    @property
    def serialize(self):
        return {
            'data_id': self.data_id,
            'name': self.name,
            'level': self.level
        }

    class Meta:
        managed = False
        db_table = 'view_jmp_data'


class ViewJMPCount(models.Model):
    id = models.BigIntegerField(primary_key=True)
    path = models.TextField(null=True, default=None)
    form = models.ForeignKey(to=Forms,
                             on_delete=models.DO_NOTHING,
                             related_name='form_view_jmp_count')
    name = models.TextField()
    level = models.TextField()
    total = models.IntegerField()

    class Meta:
        managed = False
        db_table = 'view_jmp_count'
