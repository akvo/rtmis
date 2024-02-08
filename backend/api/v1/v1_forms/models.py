import uuid

from django.db import models

# Create your models here.
from api.v1.v1_forms.constants import QuestionTypes, \
    FormTypes, AttributeTypes
from api.v1.v1_profile.models import Administration
from api.v1.v1_users.models import SystemUser


class Forms(models.Model):
    name = models.TextField()
    version = models.IntegerField(default=1)
    uuid = models.UUIDField(default=uuid.uuid4, editable=False, unique=True)
    type = models.IntegerField(choices=FormTypes.FieldStr.items(),
                               default=None,
                               null=True)
    approval_instructions = models.JSONField(default=None, null=True)

    def __str__(self):
        return self.name

    class Meta:
        db_table = 'form'


class FormApprovalAssignment(models.Model):
    form = models.ForeignKey(to=Forms,
                             on_delete=models.CASCADE,
                             related_name='form_data_approval')
    administration = models.ForeignKey(
        to=Administration,
        on_delete=models.PROTECT,
        related_name='administration_data_approval')
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
    order = models.BigIntegerField(null=True, default=None)

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
    api = models.JSONField(default=None, null=True)
    extra = models.JSONField(default=None, null=True)
    tooltip = models.JSONField(default=None, null=True)
    fn = models.JSONField(default=None, null=True)
    pre = models.JSONField(default=None, null=True)
    hidden = models.BooleanField(default=False, null=True)
    display_only = models.BooleanField(default=False, null=True)
    monitoring = models.BooleanField(default=False, null=True)
    meta_uuid = models.BooleanField(default=False, null=True)

    def __str__(self):
        return self.text

    def to_definition(self):
        options = [options.name
                   for options in
                   self.question_question_options.all()] \
            if self.question_question_options.count() else False
        return {
            "id": self.id,
            "qg_id": self.question_group.id,
            "order": (self.order or 0) + 1,
            "name": self.name,
            "type": QuestionTypes.FieldStr.get(self.type),
            "required": self.required,
            "hidden": self.hidden,
            "rule": self.rule,
            "dependency": self.dependency,
            "options": options,
            "extra": self.extra,
            "tooltip": self.tooltip,
            "fn": self.fn,
            "pre": self.pre,
            "display_only": self.display_only,
            "monitoring": self.monitoring,
            "meta_uuid": self.meta_uuid,
        }

    @property
    def to_excel_header(self):
        return f"{self.id}|{self.name}"

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
    color = models.TextField(default=None, null=True)

    def __str__(self):
        return self.name

    class Meta:
        db_table = 'option'


class UserForms(models.Model):
    user = models.ForeignKey(to=SystemUser,
                             on_delete=models.CASCADE,
                             related_name='user_form')
    form = models.ForeignKey(to=Forms,
                             on_delete=models.CASCADE,
                             related_name='form_user')

    def __str__(self):
        return self.user.email

    class Meta:
        unique_together = ('user', 'form')
        db_table = 'user_form'


class QuestionAttribute(models.Model):
    name = models.TextField(null=True, default=None)
    question = models.ForeignKey(to=Questions,
                                 on_delete=models.CASCADE,
                                 related_name='question_question_attribute')
    attribute = models.IntegerField(choices=AttributeTypes.FieldStr.items())
    options = models.JSONField(default=None, null=True)

    def __str__(self):
        return self.name

    class Meta:
        unique_together = ('name', 'question', 'attribute', 'options')
        db_table = 'question_attribute'


class ViewJMPCriteria(models.Model):
    id = models.BigIntegerField(primary_key=True)
    form = models.ForeignKey(
        to=Forms,
        on_delete=models.DO_NOTHING,
        related_name='form_view_jmp_criteria')
    name = models.TextField()
    criteria = models.JSONField(default=None, null=True)
    level = models.TextField()
    score = models.IntegerField()

    class Meta:
        managed = False
        db_table = 'view_jmp_criteria'
