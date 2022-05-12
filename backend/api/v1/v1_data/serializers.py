from django.db.models import Sum
from django.utils import timezone
from drf_spectacular.types import OpenApiTypes
from drf_spectacular.utils import extend_schema_field, inline_serializer
from rest_framework import serializers
from rest_framework.exceptions import ValidationError

from api.v1.v1_data.constants import DataApprovalStatus
from api.v1.v1_data.models import FormData, Answers, PendingFormData, \
    PendingAnswers, PendingDataApproval, PendingDataBatch, \
    PendingDataBatchComments, AnswerHistory
from api.v1.v1_forms.constants import QuestionTypes, FormTypes
from api.v1.v1_forms.models import Questions, QuestionOptions, Forms, \
    FormApprovalAssignment
from api.v1.v1_profile.constants import UserRoleTypes
from api.v1.v1_profile.models import Administration
from api.v1.v1_users.models import SystemUser
from utils.custom_serializer_fields import CustomPrimaryKeyRelatedField, \
    UnvalidatedField, CustomListField, CustomCharField, CustomChoiceField, \
    CustomBooleanField
from utils.email_helper import send_email, EmailTypes
from utils.functions import update_date_time_format, get_answer_value
from utils.functions import get_answer_history


class SubmitFormDataSerializer(serializers.ModelSerializer):
    administration = CustomPrimaryKeyRelatedField(
        queryset=Administration.objects.none())
    name = CustomCharField()

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        self.fields.get(
            'administration').queryset = Administration.objects.all()

    class Meta:
        model = FormData
        fields = ['name', 'geo', 'administration']


class SubmitFormDataAnswerSerializer(serializers.ModelSerializer):
    value = UnvalidatedField(allow_null=False)
    question = CustomPrimaryKeyRelatedField(queryset=Questions.objects.none())

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        self.fields.get('question').queryset = Questions.objects.all()

    def validate_value(self, value):
        return value

    def validate(self, attrs):
        if attrs.get('value') == '':
            raise ValidationError('Value is required for Question:{0}'.format(
                attrs.get('question').id))

        if isinstance(attrs.get('value'), list) and len(
                attrs.get('value')) == 0:
            raise ValidationError('Value is required for Question:{0}'.format(
                attrs.get('question').id))

        if not isinstance(attrs.get('value'),
                          list) and attrs.get('question').type in [
                              QuestionTypes.geo, QuestionTypes.option,
                              QuestionTypes.multiple_option
                          ]:
            raise ValidationError(
                'Valid list value is required for Question:{0}'.format(
                    attrs.get('question').id))
        elif not isinstance(
                attrs.get('value'), str) and attrs.get('question').type in [
                    QuestionTypes.text, QuestionTypes.photo, QuestionTypes.date
                ]:
            raise ValidationError(
                'Valid string value is required for Question:{0}'.format(
                    attrs.get('question').id))

        elif not isinstance(
                attrs.get('value'), int) and attrs.get('question').type in [
                    QuestionTypes.number, QuestionTypes.administration
                ]:

            raise ValidationError(
                'Valid number value is required for Question:{0}'.format(
                    attrs.get('question').id))

        return attrs

    class Meta:
        model = Answers
        fields = ['question', 'value']


class SubmitFormSerializer(serializers.Serializer):
    data = SubmitFormDataSerializer()
    answer = SubmitFormDataAnswerSerializer(many=True)

    def __init__(self, **kwargs):
        super().__init__(**kwargs)

    def update(self, instance, validated_data):
        user = self.context.get('user')
        user_role = user.user_access.role
        form = self.context.get('form')
        data = validated_data.get('data')  # edited data
        answers = validated_data.get('answer')  # edited answers

        # is_national_form = form.type == FormTypes.national
        is_county_form = form.type == FormTypes.county

        is_super_admin = user_role == UserRoleTypes.super_admin
        is_county_admin = user_role == UserRoleTypes.admin
        is_county_admin_with_county_form = is_county_admin and is_county_form

        # Direct update
        if is_super_admin or is_county_admin_with_county_form:
            # move current answer to answer_history
            for answer in answers:
                form_answer = Answers.objects.get(
                    data=instance, question=answer.get('question'))
                AnswerHistory.objects.create(
                    data=form_answer.data,
                    question=form_answer.question,
                    name=form_answer.name,
                    value=form_answer.value,
                    options=form_answer.options,
                    created_by=form_answer.created_by
                )
                form_answer.delete()
                # add new answer
                name = None
                value = None
                option = None
                if answer.get('question').type in [
                        QuestionTypes.geo, QuestionTypes.option,
                        QuestionTypes.multiple_option
                ]:
                    option = answer.get('value')
                elif answer.get('question').type in [
                    QuestionTypes.text, QuestionTypes.photo, QuestionTypes.date
                ]:
                    name = answer.get('value')
                else:
                    # for administration,number question type
                    value = answer.get('value')
                Answers.objects.create(
                    data=instance,
                    question=answer.get('question'),
                    name=name,
                    value=value,
                    options=option,
                    created_by=user
                )
            # update datapoint
            instance: FormData = instance
            instance.name = data['name']
            instance.administration = data['administration']
            instance.geo = data['geo']
            instance.updated = timezone.now()
            instance.updated_by = user
            instance.save()
            return object
        # Store edit data to pending form data
        pending_data = PendingFormData.objects.create(
            name=data['name'],
            form=instance.form,
            data=instance,
            administration=data['administration'],
            geo=data['geo'],
            batch=None,
            created_by=user
        )
        for answer in answers:
            # store to pending answer
            name = None
            value = None
            option = None
            if answer.get('question').type in [
                    QuestionTypes.geo, QuestionTypes.option,
                    QuestionTypes.multiple_option
            ]:
                option = answer.get('value')
            elif answer.get('question').type in [
                QuestionTypes.text, QuestionTypes.photo, QuestionTypes.date
            ]:
                name = answer.get('value')
            else:
                # for administration,number question type
                value = answer.get('value')
            PendingAnswers.objects.create(
                pending_data=pending_data,
                question=answer.get('question'),
                name=name,
                value=value,
                options=option,
                created_by=user
            )
        return object

    def create(self, validated_data):
        data = validated_data.get('data')
        data['form'] = self.context.get('form')
        data['created_by'] = self.context.get('user')
        data['updated_by'] = self.context.get('user')
        obj_data = self.fields.get('data').create(data)
        """
        Answer value based on Question type
        -geo = 1 #option
        -administration = 2 #value
        -text = 3 #name
        -number = 4 #value
        -option = 5 #option
        -multiple_option = 6 #option
        -cascade = 7 #option
        -photo = 8 #name
        -date = 9 #name
        """

        for answer in validated_data.get('answer'):
            name = None
            value = None
            option = None

            if answer.get('question').type in [
                    QuestionTypes.geo, QuestionTypes.option,
                    QuestionTypes.multiple_option
            ]:
                option = answer.get('value')
            elif answer.get('question').type in [
                    QuestionTypes.text, QuestionTypes.photo, QuestionTypes.date
            ]:
                name = answer.get('value')
            else:
                # for administration,number question type
                value = answer.get('value')

            Answers.objects.create(
                data=obj_data,
                question=answer.get('question'),
                name=name,
                value=value,
                options=option,
                created_by=self.context.get('user'),
            )
        return object


class ListDataAnswerSerializer(serializers.ModelSerializer):
    history = serializers.SerializerMethodField()
    value = serializers.SerializerMethodField()

    def get_history(self, instance):
        answer_history = AnswerHistory.objects.filter(
            data=instance.data, question=instance.question).all()
        history = []
        for h in answer_history:
            history.append(get_answer_history(h))
        return history if history else False

    def get_value(self, instance: Answers):
        return get_answer_value(instance)

    class Meta:
        model = Answers
        fields = ['history', 'question', 'value']


class ListFormDataRequestSerializer(serializers.Serializer):
    administration = CustomPrimaryKeyRelatedField(
        queryset=Administration.objects.none(), required=False)
    questions = CustomListField(
        child=CustomPrimaryKeyRelatedField(queryset=Questions.objects.none()),
        required=False)

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        self.fields.get(
            'administration').queryset = Administration.objects.all()
        self.fields.get('questions').child.queryset = Questions.objects.all()


class ListFormDataSerializer(serializers.ModelSerializer):
    created_by = serializers.SerializerMethodField()
    updated_by = serializers.SerializerMethodField()
    created = serializers.SerializerMethodField()
    updated = serializers.SerializerMethodField()
    administration = serializers.ReadOnlyField(source='administration.name')
    pending_data = serializers.SerializerMethodField()

    # answer = serializers.SerializerMethodField()

    def get_created_by(self, instance: FormData):
        return instance.created_by.get_full_name()

    def get_updated_by(self, instance: FormData):
        if instance.updated_by:
            return instance.updated_by.get_full_name()
        return None

    def get_created(self, instance: FormData):
        return update_date_time_format(instance.created)

    def get_updated(self, instance: FormData):
        return update_date_time_format(instance.updated)

    def get_pending_data(self, instance: FormData):
        pending_data = PendingFormData.objects.filter(
            data=instance.pk).first()
        if pending_data:
            return {
                "id": pending_data.id,
                "created_by": pending_data.created_by.get_full_name()
            }
        return None

    #
    # @extend_schema_field(ListDataAnswerSerializer(many=True))
    # def get_answer(self, instance: FormData):
    #     filter_data = {}
    #     if self.context.get('questions') and len(
    #             self.context.get('questions')):
    #         filter_data['question__in'] = self.context.get('questions')
    #     return ListDataAnswerSerializer(
    #         instance=instance.data_answer.filter(**filter_data),
    #         many=True).data

    class Meta:
        model = FormData
        fields = [
            'id', 'name', 'form', 'administration', 'geo', 'created_by',
            'updated_by', 'created', 'updated', 'pending_data'
        ]


class ListMapDataPointRequestSerializer(serializers.Serializer):
    marker = CustomPrimaryKeyRelatedField(queryset=Questions.objects.none(),
                                          required=False)
    shape = CustomPrimaryKeyRelatedField(queryset=Questions.objects.none())

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        queryset = self.context.get('form').form_questions.all()
        self.fields.get('marker').queryset = queryset
        self.fields.get('shape').queryset = queryset


class ListMapDataPointSerializer(serializers.ModelSerializer):
    marker = serializers.SerializerMethodField()
    shape = serializers.SerializerMethodField()

    def get_marker(self, instance):
        if self.context.get('marker'):
            return get_answer_value(
                instance.data_answer.get(question=self.context.get('marker')))
        return None

    def get_shape(self, instance: FormData):
        return get_answer_value(
            instance.data_answer.get(question=self.context.get('shape')))

    class Meta:
        model = FormData
        fields = ['id', 'loc', 'name', 'geo', 'marker', 'shape']


class ListChartDataPointRequestSerializer(serializers.Serializer):
    stack = CustomPrimaryKeyRelatedField(queryset=Questions.objects.none(),
                                         required=False)
    question = CustomPrimaryKeyRelatedField(queryset=Questions.objects.none())

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        queryset = self.context.get('form').form_questions.filter(
            type=QuestionTypes.option)
        self.fields.get('question').queryset = queryset
        self.fields.get('stack').queryset = queryset


class ListChartQuestionDataPointSerializer(serializers.ModelSerializer):
    value = serializers.SerializerMethodField()

    def get_value(self, instance: QuestionOptions):
        return instance.question.question_answer.filter(
            options__contains=instance.name).count()

    class Meta:
        model = QuestionOptions
        fields = ['name', 'value']


class ListChartAdministrationRequestSerializer(serializers.Serializer):
    question = CustomPrimaryKeyRelatedField(queryset=Questions.objects.none())
    administration = CustomPrimaryKeyRelatedField(
            queryset=Administration.objects.none())

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        queryset = self.context.get('form').form_questions.filter(
            type=QuestionTypes.option)
        self.fields.get('question').queryset = queryset
        self.fields.get(
            'administration').queryset = Administration.objects.all()


class ListPendingFormDataRequestSerializer(serializers.Serializer):
    administration = CustomPrimaryKeyRelatedField(
        queryset=Administration.objects.none(), required=False)

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        self.fields.get(
            'administration').queryset = Administration.objects.all()


class ListPendingDataAnswerSerializer(serializers.ModelSerializer):
    history = serializers.SerializerMethodField()
    value = serializers.SerializerMethodField()

    def get_history(self, instance):
        return False

    def get_value(self, instance: Answers):
        return get_answer_value(instance)

    class Meta:
        model = PendingAnswers
        fields = ['history', 'question', 'value']


class PendingBatchDataFilterSerializer(serializers.Serializer):
    approved = CustomBooleanField(default=False)
    subordinate = CustomBooleanField(default=False)


class ListPendingDataBatchSerializer(serializers.ModelSerializer):
    created_by = serializers.SerializerMethodField()
    created = serializers.SerializerMethodField()
    approver = serializers.SerializerMethodField()
    form = serializers.SerializerMethodField()
    administration = serializers.SerializerMethodField()
    total_data = serializers.SerializerMethodField()

    def get_created_by(self, instance: PendingDataBatch):
        return instance.user.get_full_name()

    @extend_schema_field(OpenApiTypes.INT)
    def get_total_data(self, instance: PendingDataBatch):
        return instance.batch_pending_data_batch.count()

    @extend_schema_field(
        inline_serializer('batch_pending_form',
                          fields={
                              'id': serializers.IntegerField(),
                              'name': serializers.CharField(),
                          }))
    def get_form(self, instance: PendingDataBatch):
        return {
            'id': instance.form.id,
            'name': instance.form.name,
        }

    @extend_schema_field(
        inline_serializer('batch_pending_administration',
                          fields={
                              'id': serializers.IntegerField(),
                              'name': serializers.CharField(),
                          }))
    def get_administration(self, instance: PendingDataBatch):
        return {
            'id': instance.administration_id,
            'name': instance.administration.name,
        }

    def get_created(self, instance: PendingDataBatch):
        return update_date_time_format(instance.created)

    @extend_schema_field(
        inline_serializer('batch_pending_approver',
                          fields={
                              'id': serializers.IntegerField(),
                              'name': serializers.CharField(),
                              'status': serializers.IntegerField(),
                              'status_text': serializers.CharField(),
                              'allow_approve': serializers.BooleanField(),
                          }))
    def get_approver(self, instance: PendingDataBatch):
        user: SystemUser = self.context.get('user')
        data = {}
        approval = instance.batch_approval.filter(
            status__in=[
                DataApprovalStatus.pending, DataApprovalStatus.rejected
            ],
            level__level__gt=user.user_access.administration.level.level
        ).order_by('level__level').first()
        if approval:

            data['id'] = approval.user.pk
            data['name'] = approval.user.get_full_name()
            data['status'] = approval.status
            data['status_text'] = DataApprovalStatus.FieldStr.get(
                approval.status)
            if approval.status == DataApprovalStatus.approved:
                data['allow_approve'] = True
            else:
                data['allow_approve'] = False
            rejected: PendingDataApproval = instance.batch_approval.filter(
                status=DataApprovalStatus.rejected).first()
            if rejected:
                data['rejected'] = {
                    'name': rejected.user.get_full_name(),
                    'id': rejected.user_id,
                    'administration':
                    rejected.user.user_access.administration.name
                }
        else:
            approval = instance.batch_approval.get(user=user)
            data['id'] = approval.user.pk
            data['name'] = approval.user.get_full_name()
            data['status'] = approval.status
            data['status_text'] = DataApprovalStatus.FieldStr.get(
                approval.status)
            data['allow_approve'] = True

        return data

    class Meta:
        model = PendingDataBatch
        fields = [
            'id', 'name', 'form', 'administration', 'created_by', 'created',
            'approver', 'approved', 'total_data'
        ]


class ListPendingFormDataSerializer(serializers.ModelSerializer):
    created_by = serializers.SerializerMethodField()
    created = serializers.SerializerMethodField()
    administration = serializers.ReadOnlyField(source='administration.name')

    def get_created_by(self, instance: PendingFormData):
        return instance.created_by.get_full_name()

    def get_created(self, instance: PendingFormData):
        return update_date_time_format(instance.created)

    class Meta:
        model = PendingFormData
        fields = [
            'id', 'data_id', 'name', 'form', 'administration', 'geo',
            'created_by', 'created'
        ]


class ApprovePendingDataRequestSerializer(serializers.Serializer):
    batch = CustomPrimaryKeyRelatedField(
        queryset=PendingDataBatch.objects.none())
    status = CustomChoiceField(
        choices=[DataApprovalStatus.approved, DataApprovalStatus.rejected])
    comment = CustomCharField(required=False)

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        user: SystemUser = self.context.get('user')
        if user:
            self.fields.get('batch').queryset = \
                PendingDataBatch.objects.filter(
                    batch_approval__user=user, approved=False)

    def create(self, validated_data):
        batch: PendingDataBatch = validated_data.get('batch')
        approval = PendingDataApproval.objects.get(
            user=self.context.get('user'), batch=batch)
        approval.status = validated_data.get('status')
        approval.save()
        first_data = PendingFormData.objects.filter(batch=batch).first()
        data = {
            'send_to': [first_data.created_by.email],
            'batch': batch,
            'user': self.context.get('user'),
        }
        if approval.status == DataApprovalStatus.approved:
            send_email(context=data, type=EmailTypes.batch_approval)
        else:
            send_email(context=data, type=EmailTypes.batch_rejection)
        if validated_data.get('comment'):
            PendingDataBatchComments.objects.create(
                user=self.context.get('user'),
                batch=batch,
                comment=validated_data.get('comment'))
        if not PendingDataApproval.objects.filter(
                batch=batch,
                status__in=[
                    DataApprovalStatus.pending, DataApprovalStatus.rejected
                ]).count():
            pending_data_list = PendingFormData.objects.filter(
                batch=batch).all()
            for data in pending_data_list:
                if data.data:
                    form_data: FormData = data.data
                    form_data.name = data.name
                    form_data.form = data.form
                    form_data.administration = data.administration
                    form_data.geo = data.geo
                    form_data.updated_by = data.created_by
                    form_data.updated = timezone.now()
                    form_data.save()

                    for answer in data.pending_data_answer.all():
                        form_answer = Answers.objects.get(
                            data=form_data, question=answer.question)

                        AnswerHistory.objects.create(
                            data=form_answer.data,
                            question=form_answer.question,
                            name=form_answer.name,
                            value=form_answer.value,
                            options=form_answer.options,
                            created_by=form_answer.created_by)
                        form_answer.delete()

                else:
                    form_data = FormData.objects.create(
                        name=data.name,
                        form=data.form,
                        administration=data.administration,
                        geo=data.geo,
                        created_by=data.created_by,
                    )
                    data.data = form_data
                    data.approved = True
                    data.save()

                answer: PendingAnswers
                for answer in data.pending_data_answer.all():
                    Answers.objects.create(
                        data=form_data,
                        question=answer.question,
                        name=answer.name,
                        value=answer.value,
                        options=answer.options,
                        created_by=answer.created_by,
                    )
            batch.approved = True
            batch.updated = timezone.now()
            batch.save()
        return object

    def update(self, instance, validated_data):
        pass


class ListBatchSerializer(serializers.ModelSerializer):
    form = serializers.SerializerMethodField()
    administration = serializers.SerializerMethodField()
    file = serializers.SerializerMethodField()
    total_data = serializers.SerializerMethodField()
    status = serializers.ReadOnlyField(source='approved')
    approvers = serializers.SerializerMethodField()
    created = serializers.SerializerMethodField()
    updated = serializers.SerializerMethodField()

    @extend_schema_field(
        inline_serializer('batch_form',
                          fields={
                              'id': serializers.IntegerField(),
                              'name': serializers.CharField(),
                          }))
    def get_form(self, instance: PendingDataBatch):
        return {
            'id': instance.form.id,
            'name': instance.form.name,
        }

    @extend_schema_field(
        inline_serializer('batch_administration',
                          fields={
                              'id': serializers.IntegerField(),
                              'name': serializers.CharField(),
                          }))
    def get_administration(self, instance: PendingDataBatch):
        return {
            'id': instance.administration_id,
            'name': instance.administration.name,
        }

    @extend_schema_field(
        inline_serializer('batch_file',
                          fields={
                              'name': serializers.CharField(),
                              'file': serializers.URLField(),
                          }))
    def get_file(self, instance: PendingDataBatch):
        if instance.file:
            path = instance.file
            first_pos = path.rfind("/")
            last_pos = len(path)
            return {
                'name': path[first_pos + 1:last_pos],
                'file': instance.file
            }
        return None

    @extend_schema_field(OpenApiTypes.INT)
    def get_total_data(self, instance: PendingDataBatch):
        return instance.batch_pending_data_batch.all().count()

    @extend_schema_field(
        inline_serializer('batch_approver',
                          fields={
                              'name': serializers.CharField(),
                              'administration': serializers.CharField(),
                              'status': serializers.IntegerField(),
                              'status_text': serializers.CharField(),
                          },
                          many=True))
    def get_approvers(self, instance: PendingDataBatch):
        data = []
        for approver in instance.batch_approval.all():
            approver_administration = approver.user.user_access.administration
            data.append({
                'name':
                approver.user.get_full_name(),
                'administration':
                approver_administration.name,
                'status':
                approver.status,
                'status_text':
                DataApprovalStatus.FieldStr.get(approver.status)
            })
        return data

    @extend_schema_field(OpenApiTypes.DATE)
    def get_created(self, instance):
        return update_date_time_format(instance.created)

    @extend_schema_field(OpenApiTypes.DATE)
    def get_updated(self, instance):
        return update_date_time_format(instance.updated)

    class Meta:
        model = PendingDataBatch
        fields = [
            'id', 'name', 'form', 'administration', 'file', 'total_data',
            'created', 'updated', 'status', 'approvers'
        ]


class ListBatchSummarySerializer(serializers.ModelSerializer):
    id = serializers.ReadOnlyField(source='question.id')
    question = serializers.ReadOnlyField(source='question.text')
    type = serializers.SerializerMethodField()
    value = serializers.SerializerMethodField()

    def get_type(self, instance):
        return QuestionTypes.FieldStr.get(instance.question.type)

    def get_value(self, instance: PendingAnswers):
        batch: PendingDataBatch = self.context.get('batch')
        if instance.question.type == QuestionTypes.number:
            val = PendingAnswers.objects.filter(
                pending_data__batch=batch,
                question_id=instance.question.id).aggregate(Sum('value'))
            return val.get('value__sum')
        elif instance.question.type == QuestionTypes.administration:
            return PendingAnswers.objects.filter(
                pending_data__batch=batch,
                question_id=instance.question.id).distinct('value').count()
        else:
            data = []
            for option in instance.question.question_question_options.all():
                val = PendingAnswers.objects.filter(
                    pending_data__batch=batch,
                    question_id=instance.question.id,
                    options__contains=option.name).count()
                data.append({'type': option.name, 'total': val})
            return data

    class Meta:
        model = PendingAnswers
        fields = ['id', 'question', 'type', 'value']


class ListBatchCommentSerializer(serializers.ModelSerializer):
    user = serializers.SerializerMethodField()
    created = serializers.SerializerMethodField()

    @extend_schema_field(
        inline_serializer('batch_comment_user',
                          fields={
                              'name': serializers.CharField(),
                              'email': serializers.CharField(),
                          }))
    def get_user(self, instance: PendingDataBatchComments):
        return {
            'name': instance.user.get_full_name(),
            'email': instance.user.email
        }

    @extend_schema_field(OpenApiTypes.DATE)
    def get_created(self, instance: PendingDataBatchComments):
        return update_date_time_format(instance.created)

    class Meta:
        model = PendingDataBatchComments
        fields = ['user', 'comment', 'created']


class BatchListRequestSerializer(serializers.Serializer):
    approved = CustomBooleanField(default=False)


class CreateBatchSerializer(serializers.Serializer):
    name = CustomCharField()
    comment = CustomCharField(required=False)
    data = CustomListField(child=CustomPrimaryKeyRelatedField(
        queryset=PendingFormData.objects.none()),
                           required=False)

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        self.fields.get('data').child.queryset = PendingFormData.objects.all()

    def validate_name(self, name):
        if PendingDataBatch.objects.filter(name__iexact=name).exists():
            raise ValidationError('name has already been taken')
        return name

    def validate(self, attrs):
        form = attrs.get('data')[0].form
        for pending in attrs.get('data'):
            if pending.form_id != form.id:
                raise ValidationError(
                    {'data': 'Form id is different for provided data'})
        return attrs

    def create(self, validated_data):
        form_id = validated_data.get('data')[0].form_id
        user: SystemUser = validated_data.get('user')
        path = '{0}{1}'.format(user.user_access.administration.path,
                               user.user_access.administration_id)
        obj = PendingDataBatch.objects.create(
            form_id=form_id,
            administration_id=user.user_access.administration_id,
            user=user,
            name=validated_data.get('name'))
        PendingDataBatchComments.objects.create(
            user=user, batch=obj, comment=validated_data.get('comment'))
        for administration in Administration.objects.filter(
                id__in=path.split('.')):
            assignment = FormApprovalAssignment.objects.filter(
                form_id=form_id, administration=administration).first()
            if assignment:
                level = assignment.user.user_access.administration.level_id
                PendingDataApproval.objects.create(batch=obj,
                                                   user=assignment.user,
                                                   level_id=level)
                data = {
                    'send_to': [assignment.user.email],
                    'form': obj.form,
                    'user': obj.user,
                }
                send_email(context=data, type=EmailTypes.pending_approval)
        for data in validated_data.get('data'):
            data.batch = obj
            data.save()
        return obj

    def update(self, instance, validated_data):
        pass


class SubmitPendingFormDataSerializer(serializers.ModelSerializer):
    administration = CustomPrimaryKeyRelatedField(
        queryset=Administration.objects.none())
    name = CustomCharField()

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        self.fields.get(
            'administration').queryset = Administration.objects.all()

    class Meta:
        model = PendingFormData
        fields = ['name', 'geo', 'administration']


class SubmitPendingFormDataAnswerSerializer(serializers.ModelSerializer):
    value = UnvalidatedField(allow_null=False)
    question = CustomPrimaryKeyRelatedField(queryset=Questions.objects.none())

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        self.fields.get('question').queryset = Questions.objects.all()

    def validate_value(self, value):
        return value

    def validate(self, attrs):
        if attrs.get('value') == '':
            raise ValidationError('Value is required for Question:{0}'.format(
                attrs.get('question').id))

        if isinstance(attrs.get('value'), list) and len(
                attrs.get('value')) == 0:
            raise ValidationError('Value is required for Question:{0}'.format(
                attrs.get('question').id))

        if not isinstance(attrs.get('value'),
                          list) and attrs.get('question').type in [
                              QuestionTypes.geo, QuestionTypes.option,
                              QuestionTypes.multiple_option
                          ]:
            raise ValidationError(
                'Valid list value is required for Question:{0}'.format(
                    attrs.get('question').id))
        elif not isinstance(
                attrs.get('value'), str) and attrs.get('question').type in [
                    QuestionTypes.text, QuestionTypes.photo, QuestionTypes.date
                ]:
            raise ValidationError(
                'Valid string value is required for Question:{0}'.format(
                    attrs.get('question').id))

        elif not isinstance(
                attrs.get('value'), int) and attrs.get('question').type in [
                    QuestionTypes.number, QuestionTypes.administration
                ]:

            raise ValidationError(
                'Valid number value is required for Question:{0}'.format(
                    attrs.get('question').id))

        return attrs

    class Meta:
        model = PendingAnswers
        fields = ['question', 'value']


class SubmitPendingFormSerializer(serializers.Serializer):
    data = SubmitPendingFormDataSerializer()
    answer = SubmitPendingFormDataAnswerSerializer(many=True)

    def __init__(self, **kwargs):
        super().__init__(**kwargs)

    def validate(self, attrs):
        form: Forms = self.context.get('form')
        user: SystemUser = self.context.get('user')
        if form.type == FormTypes.county and \
                user.user_access.role == UserRoleTypes.admin:
            raise ValidationError(
                {'data': 'You do not permission to submit the data'})
        if form.type == FormTypes.national and \
                user.user_access.role == UserRoleTypes.user:
            raise ValidationError(
                {'data': 'You do not permission to submit the data'})
        return attrs

    def update(self, instance, validated_data):
        pass

    def create(self, validated_data):
        data = validated_data.get('data')
        data['form'] = self.context.get('form')
        data['created_by'] = self.context.get('user')
        obj_data = self.fields.get('data').create(data)

        for answer in validated_data.get('answer'):
            name = None
            value = None
            option = None

            if answer.get('question').type in [
                    QuestionTypes.geo, QuestionTypes.option,
                    QuestionTypes.multiple_option
            ]:
                option = answer.get('value')
            elif answer.get('question').type in [
                    QuestionTypes.text, QuestionTypes.photo, QuestionTypes.date
            ]:
                name = answer.get('value')
            else:
                # for administration,number question type
                value = answer.get('value')

            PendingAnswers.objects.create(
                pending_data=obj_data,
                question=answer.get('question'),
                name=name,
                value=value,
                options=option,
                created_by=self.context.get('user'),
            )

        return obj_data
