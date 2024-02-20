import requests
from django.db.models import Sum, Q
from django.utils import timezone
from django_q.tasks import async_task
from drf_spectacular.types import OpenApiTypes
from drf_spectacular.utils import extend_schema_field, inline_serializer
from rest_framework import serializers
from rest_framework.exceptions import ValidationError

from api.v1.v1_data.constants import DataApprovalStatus
from api.v1.v1_data.models import (
    FormData,
    Answers,
    PendingFormData,
    PendingAnswers,
    PendingDataApproval,
    PendingDataBatch,
    PendingDataBatchComments,
    AnswerHistory,
    PendingAnswerHistory,
)
from api.v1.v1_forms.constants import QuestionTypes, FormTypes
from api.v1.v1_forms.models import (
    Questions,
    QuestionOptions,
    Forms,
    FormApprovalAssignment,
)
from api.v1.v1_profile.constants import UserRoleTypes
from api.v1.v1_profile.models import Administration, EntityData
from api.v1.v1_users.models import SystemUser, Organisation
from utils.custom_serializer_fields import (
    CustomPrimaryKeyRelatedField,
    UnvalidatedField,
    CustomListField,
    CustomCharField,
    CustomChoiceField,
    CustomBooleanField,
    CustomIntegerField,
)
from utils.default_serializers import CommonDataSerializer
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
            "administration").queryset = Administration.objects.all()

    class Meta:
        model = FormData
        fields = ["name", "geo", "administration"]


class SubmitFormDataAnswerSerializer(serializers.ModelSerializer):
    value = UnvalidatedField(allow_null=False)
    question = CustomPrimaryKeyRelatedField(queryset=Questions.objects.none())

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        self.fields.get("question").queryset = Questions.objects.all()

    def validate_value(self, value):
        return value

    def validate(self, attrs):
        if attrs.get("value") == "":
            raise ValidationError("Value is required for Question:{0}".format(
                attrs.get("question").id))

        if isinstance(attrs.get("value"), list) and len(
                attrs.get("value")) == 0:
            raise ValidationError("Value is required for Question:{0}".format(
                attrs.get("question").id))

        if not isinstance(attrs.get("value"),
                          list) and attrs.get("question").type in [
                              QuestionTypes.geo,
                              QuestionTypes.option,
                              QuestionTypes.multiple_option,
                          ]:
            raise ValidationError(
                "Valid list value is required for Question:{0}".format(
                    attrs.get("question").id))
        elif not isinstance(attrs.get("value"),
                            str) and attrs.get("question").type in [
                                QuestionTypes.text,
                                QuestionTypes.photo,
                                QuestionTypes.date,
                            ]:
            raise ValidationError(
                "Valid string value is required for Question:{0}".format(
                    attrs.get("question").id))
        elif not (isinstance(attrs.get("value"), int) or isinstance(
                attrs.get("value"), float)) and attrs.get("question").type in [
                    QuestionTypes.number,
                    QuestionTypes.administration,
                    QuestionTypes.cascade,
                ]:
            raise ValidationError(
                "Valid number value is required for Question:{0}".format(
                    attrs.get("question").id))

        if attrs.get("question").type == QuestionTypes.administration:
            attrs["value"] = int(float(attrs.get("value")))

        return attrs

    class Meta:
        model = Answers
        fields = ["question", "value"]


class SubmitFormSerializer(serializers.Serializer):
    data = SubmitFormDataSerializer()
    answer = SubmitFormDataAnswerSerializer(many=True)

    def __init__(self, **kwargs):
        super().__init__(**kwargs)

    def update(self, instance, validated_data):
        pass

    def create(self, validated_data):
        data = validated_data.get("data")
        data["form"] = self.context.get("form")
        data["created_by"] = self.context.get("user")
        data["updated_by"] = self.context.get("user")
        obj_data = self.fields.get("data").create(data)
        # Answer value based on Question type
        # - geo = 1 #option
        # - administration = 2 #value
        # - text = 3 #name
        # - number = 4 #value
        # - option = 5 #option
        # - multiple_option = 6 #option
        # - cascade = 7 #option
        # - photo = 8 #name
        # - date = 9 #name
        # - autofield = 10 #name

        for answer in validated_data.get("answer"):
            name = None
            value = None
            option = None

            if answer.get("question").meta_uuid:
                obj_data.uuid = answer.get("value")
                obj_data.save()

            if answer.get("question").type in [
                    QuestionTypes.geo,
                    QuestionTypes.option,
                    QuestionTypes.multiple_option,
            ]:
                option = answer.get("value")
            elif answer.get("question").type in [
                    QuestionTypes.text,
                    QuestionTypes.photo,
                    QuestionTypes.date,
                    QuestionTypes.autofield,
            ]:
                name = answer.get("value")
            elif answer.get("question").type == QuestionTypes.cascade:
                id = answer.get("value")
                ep = answer.get("question").api.get("endpoint")
                val = None
                if "organisation" in ep:
                    val = Organisation.objects.filter(pk=id).first()
                    val = val.name
                else:
                    ep = ep.split("?")[0]
                    ep = f"{ep}?id={id}"
                    val = requests.get(ep).json()
                    val = val[0].get("name")
                name = val
            else:
                # for administration,number question type
                value = answer.get("value")

            Answers.objects.create(
                data=obj_data,
                question=answer.get("question"),
                name=name,
                value=value,
                options=option,
                created_by=self.context.get("user"),
            )
        obj_data.save_to_file

        return object


class AnswerHistorySerializer(serializers.Serializer):
    value = serializers.FloatField()
    created = CustomCharField()
    created_by = CustomCharField()


class ListDataAnswerSerializer(serializers.ModelSerializer):
    history = serializers.SerializerMethodField()
    value = serializers.SerializerMethodField()

    @extend_schema_field(AnswerHistorySerializer(many=True))
    def get_history(self, instance):
        answer_history = AnswerHistory.objects.filter(
            data=instance.data, question=instance.question).all()
        history = []
        for h in answer_history:
            history.append(get_answer_history(h))
        return history if history else None

    @extend_schema_field(OpenApiTypes.ANY)
    def get_value(self, instance: Answers):
        return get_answer_value(instance)

    class Meta:
        model = Answers
        fields = ["history", "question", "value"]


class ListFormDataRequestSerializer(serializers.Serializer):
    administration = CustomPrimaryKeyRelatedField(
        queryset=Administration.objects.none(), required=False)
    questions = CustomListField(
        child=CustomPrimaryKeyRelatedField(queryset=Questions.objects.none()),
        required=False,
    )
    parent = CustomPrimaryKeyRelatedField(
        queryset=FormData.objects.none(),
        required=False
    )

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        self.fields.get(
            "administration").queryset = Administration.objects.all()
        self.fields.get("questions").child.queryset = Questions.objects.all()
        form_id = self.context.get('form_id')
        self.fields.get("parent").queryset = FormData.objects.filter(
            form_id=form_id
        ).all()


class ListFormDataSerializer(serializers.ModelSerializer):
    created_by = serializers.SerializerMethodField()
    updated_by = serializers.SerializerMethodField()
    created = serializers.SerializerMethodField()
    updated = serializers.SerializerMethodField()
    administration = serializers.ReadOnlyField(source="administration.name")
    pending_data = serializers.SerializerMethodField()

    @extend_schema_field(OpenApiTypes.STR)
    def get_created_by(self, instance: FormData):
        return instance.created_by.get_full_name()

    @extend_schema_field(OpenApiTypes.STR)
    def get_updated_by(self, instance: FormData):
        if instance.updated_by:
            return instance.updated_by.get_full_name()
        return None

    @extend_schema_field(OpenApiTypes.STR)
    def get_created(self, instance: FormData):
        return update_date_time_format(instance.created)

    @extend_schema_field(OpenApiTypes.STR)
    def get_updated(self, instance: FormData):
        return update_date_time_format(instance.updated)

    @extend_schema_field(
        inline_serializer(
            "HasPendingData",
            fields={
                "id": serializers.IntegerField(),
                "created_by": serializers.CharField(),
            },
        ))
    def get_pending_data(self, instance: FormData):
        batch = None
        pending_data = PendingFormData.objects.filter(data=instance.pk).first()
        if pending_data:
            batch = PendingDataBatch.objects.filter(
                pk=pending_data.batch_id).first()
        if pending_data and (not batch or not batch.approved):
            return {
                "id": pending_data.id,
                "created_by": pending_data.created_by.get_full_name(),
            }
        return None

    class Meta:
        model = FormData
        fields = [
            "id",
            "uuid",
            "name",
            "form",
            "administration",
            "geo",
            "created_by",
            "updated_by",
            "created",
            "updated",
            "pending_data"
        ]


class ListMapDataPointRequestSerializer(serializers.Serializer):
    marker = CustomPrimaryKeyRelatedField(queryset=Questions.objects.none(),
                                          required=False)
    shape = CustomPrimaryKeyRelatedField(queryset=Questions.objects.none())

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        queryset = self.context.get("form").form_questions.all()
        self.fields.get("marker").queryset = queryset
        self.fields.get("shape").queryset = queryset


class ListMapDataPointSerializer(serializers.ModelSerializer):
    marker = serializers.SerializerMethodField()
    shape = serializers.SerializerMethodField()

    @extend_schema_field(CustomListField)
    def get_marker(self, instance):
        if self.context.get("marker"):
            return get_answer_value(
                instance.data_answer.get(question=self.context.get("marker")))
        return None

    @extend_schema_field(OpenApiTypes.INT)
    def get_shape(self, instance: FormData):
        return get_answer_value(
            instance.data_answer.get(question=self.context.get("shape")))

    class Meta:
        model = FormData
        fields = ["id", "loc", "name", "geo", "marker", "shape"]


class ListMapOverviewDataPointRequestSerializer(serializers.Serializer):
    shape = CustomPrimaryKeyRelatedField(queryset=Questions.objects.none())

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        queryset = self.context.get("form").form_questions.all()
        self.fields.get("shape").queryset = queryset


class ListMapOverviewDataPointSerializer(serializers.ModelSerializer):
    shape = serializers.SerializerMethodField()

    @extend_schema_field(OpenApiTypes.INT)
    def get_shape(self, instance: FormData):
        return get_answer_value(
            instance.data_answer.get(question=self.context.get("shape")))

    class Meta:
        model = FormData
        fields = ["id", "administration_id", "shape"]


class ListChartDataPointRequestSerializer(serializers.Serializer):
    stack = CustomPrimaryKeyRelatedField(queryset=Questions.objects.none(),
                                         required=False)
    question = CustomPrimaryKeyRelatedField(queryset=Questions.objects.none())

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        queryset = self.context.get("form").form_questions
        self.fields.get("question").queryset = queryset.filter(
            Q(type=QuestionTypes.option)
            | Q(type=QuestionTypes.number)
            | Q(type=QuestionTypes.multiple_option))
        self.fields.get("stack").queryset = queryset.filter(
            Q(type=QuestionTypes.option)
            | Q(type=QuestionTypes.multiple_option))


class ListChartQuestionDataPointSerializer(serializers.ModelSerializer):
    value = serializers.SerializerMethodField()

    @extend_schema_field(OpenApiTypes.INT)
    def get_value(self, instance: QuestionOptions):
        value = instance.question.question_answer.filter(
            options__contains=instance.name)
        if self.context.get("data_ids"):
            value = value.filter(data_id__in=self.context.get("data_ids"))
        return value.count()

    class Meta:
        model = QuestionOptions
        fields = ["name", "value"]


class ChartDataSerializer(serializers.Serializer):
    type = (serializers.CharField(), )
    data = ListChartQuestionDataPointSerializer(many=True)


class ListChartAdministrationRequestSerializer(serializers.Serializer):
    question = CustomPrimaryKeyRelatedField(queryset=Questions.objects.none())
    administration = CustomPrimaryKeyRelatedField(
        queryset=Administration.objects.none())

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        queryset = self.context.get("form").form_questions.filter(
            type=QuestionTypes.option)
        self.fields.get("question").queryset = queryset
        self.fields.get(
            "administration").queryset = Administration.objects.all()


class ListOptionsChartCriteriaSerializer(serializers.Serializer):
    question = CustomPrimaryKeyRelatedField(queryset=Questions.objects.none())
    option = CustomListField()

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        self.fields.get("question").queryset = Questions.objects.all()


class ListChartCriteriaRequestSerializer(serializers.Serializer):
    name = CustomCharField()
    options = ListOptionsChartCriteriaSerializer(many=True)

    def __init__(self, **kwargs):
        super().__init__(**kwargs)


class ListPendingFormDataRequestSerializer(serializers.Serializer):
    administration = CustomPrimaryKeyRelatedField(
        queryset=Administration.objects.none(), required=False)

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        self.fields.get(
            "administration").queryset = Administration.objects.all()


class ListPendingDataAnswerSerializer(serializers.ModelSerializer):
    history = serializers.SerializerMethodField()
    value = serializers.SerializerMethodField()
    last_value = serializers.SerializerMethodField()

    @extend_schema_field(AnswerHistorySerializer(many=True))
    def get_history(self, instance):
        pending_answer_history = PendingAnswerHistory.objects.filter(
            pending_data=instance.pending_data,
            question=instance.question).all()
        history = []
        for h in pending_answer_history:
            history.append(get_answer_history(h))
        return history if history else None

    @extend_schema_field(OpenApiTypes.ANY)
    def get_value(self, instance: Answers):
        return get_answer_value(instance)

    @extend_schema_field(OpenApiTypes.ANY)
    def get_last_value(self, instance: Answers):
        if self.context['last_data']:
            answer = self.context['last_data'].data_answer.filter(
                question=instance.question
            ).first()
            if answer:
                return get_answer_value(answer=answer)
        return None

    class Meta:
        model = PendingAnswers
        fields = ["history", "question", "value", "last_value"]


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

    @extend_schema_field(OpenApiTypes.STR)
    def get_created_by(self, instance: PendingDataBatch):
        return instance.user.get_full_name()

    @extend_schema_field(OpenApiTypes.INT)
    def get_total_data(self, instance: PendingDataBatch):
        return instance.batch_pending_data_batch.count()

    @extend_schema_field(CommonDataSerializer)
    def get_form(self, instance: PendingDataBatch):
        return {
            "id": instance.form.id,
            "name": instance.form.name,
            "approval_instructions": instance.form.approval_instructions,
        }

    @extend_schema_field(CommonDataSerializer)
    def get_administration(self, instance: PendingDataBatch):
        return {
            "id": instance.administration_id,
            "name": instance.administration.name,
        }

    @extend_schema_field(OpenApiTypes.STR)
    def get_created(self, instance: PendingDataBatch):
        return update_date_time_format(instance.created)

    @extend_schema_field(
        inline_serializer(
            "PendingBatchApprover",
            fields={
                "id": serializers.IntegerField(),
                "name": serializers.CharField(),
                "status": serializers.IntegerField(),
                "status_text": serializers.CharField(),
                "allow_approve": serializers.BooleanField(),
            },
        ))
    def get_approver(self, instance: PendingDataBatch):
        user: SystemUser = self.context.get("user")
        data = {}
        approval = instance.batch_approval.filter(
            level__level=user.user_access.administration.level.level - 1
            if user.user_access.administration.level.level > 1 else 1,
        ).order_by("-level__level").first()
        rejected: PendingDataApproval = instance.batch_approval.filter(
            status=DataApprovalStatus.rejected
        ).first()
        if approval:
            data["id"] = approval.user.pk
            data["name"] = approval.user.get_full_name()
            data["status"] = approval.status
            data["status_text"] = DataApprovalStatus.FieldStr.get(
                approval.status)
            if approval.status == DataApprovalStatus.approved:
                data["allow_approve"] = True
            else:
                data["allow_approve"] = False
            if rejected:
                data["name"] = instance.batch_approval.filter(
                    level__level=approval.level.level + 1
                ).first().user.get_full_name()
                data["rejected"] = {
                    "name":
                    rejected.user.get_full_name(),
                    "id":
                    rejected.user_id,
                    "administration":
                    rejected.user.user_access.administration.name,
                }
        else:
            approval = instance.batch_approval.get(user=user)
            data["id"] = approval.user.pk
            data["name"] = approval.user.get_full_name()
            data["status"] = approval.status
            data["status_text"] = DataApprovalStatus.FieldStr.get(
                approval.status)
            data["allow_approve"] = True
        final_approved = instance.batch_approval.filter(
            status=DataApprovalStatus.approved,
            level__level=1
        ).count()
        if final_approved:
            data["name"] = "-"
        return data

    class Meta:
        model = PendingDataBatch
        fields = [
            "id",
            "name",
            "form",
            "administration",
            "created_by",
            "created",
            "approver",
            "approved",
            "total_data",
        ]


class ListPendingFormDataSerializer(serializers.ModelSerializer):
    created_by = serializers.SerializerMethodField()
    created = serializers.SerializerMethodField()
    administration = serializers.ReadOnlyField(source="administration.name")
    pending_answer_history = serializers.SerializerMethodField()
    is_monitoring = serializers.SerializerMethodField()

    @extend_schema_field(OpenApiTypes.STR)
    def get_created_by(self, instance: PendingFormData):
        return instance.created_by.get_full_name()

    @extend_schema_field(OpenApiTypes.STR)
    def get_created(self, instance: PendingFormData):
        return update_date_time_format(instance.created)

    @extend_schema_field(OpenApiTypes.BOOL)
    def get_pending_answer_history(self, instance: PendingFormData):
        history = PendingAnswerHistory.objects.filter(
            pending_data=instance).count()
        return True if history > 0 else False

    @extend_schema_field(OpenApiTypes.BOOL)
    def get_is_monitoring(self, instance: PendingFormData):
        monitoring = FormData.objects.filter(
            uuid=instance.uuid,
            parent=None
        ).first()
        return True if monitoring else False

    class Meta:
        model = PendingFormData
        fields = [
            "id",
            "uuid",
            "data_id",
            "name",
            "form",
            "administration",
            "geo",
            "submitter",
            "duration",
            "created_by",
            "created",
            "pending_answer_history",
            "is_monitoring",
        ]


class ApprovePendingDataRequestSerializer(serializers.Serializer):
    batch = CustomPrimaryKeyRelatedField(
        queryset=PendingDataBatch.objects.none())
    status = CustomChoiceField(
        choices=[DataApprovalStatus.approved, DataApprovalStatus.rejected])
    comment = CustomCharField(required=False)

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        user: SystemUser = self.context.get("user")
        if user:
            self.fields.get(
                "batch").queryset = PendingDataBatch.objects.filter(
                    batch_approval__user=user, approved=False)

    def create(self, validated_data):
        batch: PendingDataBatch = validated_data.get("batch")
        user = self.context.get("user")
        comment = validated_data.get("comment")
        user_level = user.user_access.administration.level
        approval = PendingDataApproval.objects.get(user=user, batch=batch)
        approval.status = validated_data.get("status")
        approval.save()
        first_data = PendingFormData.objects.filter(batch=batch).first()
        data_count = PendingFormData.objects.filter(batch=batch).count()
        data = {
            "send_to": [first_data.created_by.email],
            "batch": batch,
            "user": user,
        }
        listing = [
            {
                "name": "Batch Name",
                "value": batch.name,
            },
            {
                "name": "Number of Records",
                "value": data_count,
            },
            {
                "name": "Questionnaire",
                "value": batch.form.name,
            },
        ]
        if approval.status == DataApprovalStatus.approved:
            listing.append({
                "name": "Approver",
                "value": f"{user.name}, {user.designation_name}",
            })
            if comment:
                listing.append({"name": "Comment", "value": comment})
            data.update({
                "listing":
                listing,
                "extend_body":
                """
                Further approvals may be required before data is finalised.
                You can also track your data approval in the RUSH platform
                [My Profile > Data uploads > Pending Approval/Approved]
                """,
            })
            send_email(context=data, type=EmailTypes.batch_approval)
        else:
            listing.append({
                "name": "Rejector",
                "value": f"{user.name}, {user.designation_name}",
            })
            if comment:
                listing.append({"name": "Comment", "value": comment})
            # rejection request change to user
            data.update({
                "listing":
                listing,
                "extend_body":
                """
                You can also access the rejected data in the RUSH platform
                [My Profile > Data uploads > Rejected]
                """,
            })
            send_email(context=data, type=EmailTypes.batch_rejection)
            # send email to lower approval
            lower_approvals = PendingDataApproval.objects.filter(
                batch=batch, level__level__gt=user_level.level).all()
            # filter --> send email only to lower approval
            lower_approval_user_ids = [u.user_id for u in lower_approvals]
            lower_approval_users = SystemUser.objects.filter(
                id__in=lower_approval_user_ids, deleted_at=None).all()
            lower_approval_emails = [
                u.email for u in lower_approval_users if u.email != user.email
            ]
            if lower_approval_emails:
                inform_data = {
                    "send_to":
                    lower_approval_emails,
                    "listing":
                    listing,
                    "extend_body":
                    """
                    The data submitter has also been notified.
                    They can modify the data and submit again for approval
                    """,
                }
                send_email(context=inform_data,
                           type=EmailTypes.inform_batch_rejection_approver)
            # change approval status to pending
            # for la in lower_approvals:
            #     la.status = DataApprovalStatus.pending
            #     la.save()
        if validated_data.get("comment"):
            PendingDataBatchComments.objects.create(
                user=user, batch=batch, comment=validated_data.get("comment"))
        if not PendingDataApproval.objects.filter(
                batch=batch,
                status__in=[
                    DataApprovalStatus.pending, DataApprovalStatus.rejected
                ],
        ).count():
            pending_data_list = PendingFormData.objects.filter(
                batch=batch).all()
            # Seed data via Async Task
            for data in pending_data_list:
                async_task("api.v1.v1_data.tasks.seed_approved_data", data)
            batch.approved = True
            batch.updated = timezone.now()
            batch.save()
            async_task("api.v1.v1_data.functions.refresh_materialized_data")
        return object

    def update(self, instance, validated_data):
        pass


class ListBatchSerializer(serializers.ModelSerializer):
    form = serializers.SerializerMethodField()
    administration = serializers.SerializerMethodField()
    file = serializers.SerializerMethodField()
    total_data = serializers.SerializerMethodField()
    status = serializers.ReadOnlyField(source="approved")
    approvers = serializers.SerializerMethodField()
    created = serializers.SerializerMethodField()
    updated = serializers.SerializerMethodField()

    @extend_schema_field(CommonDataSerializer)
    def get_form(self, instance: PendingDataBatch):
        return {
            "id": instance.form.id,
            "name": instance.form.name,
            "approval_instructions": instance.form.approval_instructions,
        }

    @extend_schema_field(CommonDataSerializer)
    def get_administration(self, instance: PendingDataBatch):
        return {
            "id": instance.administration_id,
            "name": instance.administration.name,
        }

    @extend_schema_field(
        inline_serializer(
            "BatchFile",
            fields={
                "name": serializers.CharField(),
                "file": serializers.URLField(),
            },
        ))
    def get_file(self, instance: PendingDataBatch):
        if instance.file:
            path = instance.file
            first_pos = path.rfind("/")
            last_pos = len(path)
            return {
                "name": path[first_pos + 1:last_pos],
                "file": instance.file
            }
        return None

    @extend_schema_field(OpenApiTypes.INT)
    def get_total_data(self, instance: PendingDataBatch):
        return instance.batch_pending_data_batch.all().count()

    @extend_schema_field(
        inline_serializer(
            "BatchApprover",
            fields={
                "name": serializers.CharField(),
                "administration": serializers.CharField(),
                "status": serializers.IntegerField(),
                "status_text": serializers.CharField(),
            },
            many=True,
        ))
    def get_approvers(self, instance: PendingDataBatch):
        data = []
        for approver in instance.batch_approval.all():
            approver_administration = approver.user.user_access.administration
            data.append({
                "name":
                approver.user.get_full_name(),
                "administration":
                approver_administration.name,
                "status":
                approver.status,
                "status_text":
                DataApprovalStatus.FieldStr.get(approver.status),
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
            "id",
            "name",
            "form",
            "administration",
            "file",
            "total_data",
            "created",
            "updated",
            "status",
            "approvers",
        ]


class ListBatchSummarySerializer(serializers.ModelSerializer):
    id = serializers.ReadOnlyField(source="question.id")
    question = serializers.ReadOnlyField(source="question.text")
    type = serializers.SerializerMethodField()
    value = serializers.SerializerMethodField()

    @extend_schema_field(
        CustomChoiceField(choices=[
            QuestionTypes.FieldStr[d] for d in QuestionTypes.FieldStr
        ]))
    def get_type(self, instance):
        return QuestionTypes.FieldStr.get(instance.question.type)

    @extend_schema_field(OpenApiTypes.ANY)
    def get_value(self, instance: PendingAnswers):
        batch: PendingDataBatch = self.context.get("batch")
        if instance.question.type == QuestionTypes.number:
            val = PendingAnswers.objects.filter(
                pending_data__batch=batch,
                question_id=instance.question.id).aggregate(Sum("value"))
            return val.get("value__sum")
        elif instance.question.type == QuestionTypes.administration:
            return (PendingAnswers.objects.filter(
                pending_data__batch=batch,
                question_id=instance.question.id).distinct("value").count())
        else:
            data = []
            for option in instance.question.question_question_options.all():
                val = PendingAnswers.objects.filter(
                    pending_data__batch=batch,
                    question_id=instance.question.id,
                    options__contains=option.name,
                ).count()
                data.append({"type": option.name, "total": val})
            return data

    class Meta:
        model = PendingAnswers
        fields = ["id", "question", "type", "value"]


class ListBatchCommentSerializer(serializers.ModelSerializer):
    user = serializers.SerializerMethodField()
    created = serializers.SerializerMethodField()

    @extend_schema_field(
        inline_serializer(
            "BatchUserComment",
            fields={
                "name": serializers.CharField(),
                "email": serializers.CharField(),
            },
        ))
    def get_user(self, instance: PendingDataBatchComments):
        return {
            "name": instance.user.get_full_name(),
            "email": instance.user.email
        }

    @extend_schema_field(OpenApiTypes.DATE)
    def get_created(self, instance: PendingDataBatchComments):
        return update_date_time_format(instance.created)

    class Meta:
        model = PendingDataBatchComments
        fields = ["user", "comment", "created"]


class BatchListRequestSerializer(serializers.Serializer):
    approved = CustomBooleanField(default=False)


class CreateBatchSerializer(serializers.Serializer):
    name = CustomCharField()
    comment = CustomCharField(required=False)
    data = CustomListField(
        child=CustomPrimaryKeyRelatedField(
            queryset=PendingFormData.objects.none()),
        required=False,
    )

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        self.fields.get("data").child.queryset = PendingFormData.objects.all()

    def validate_name(self, name):
        if PendingDataBatch.objects.filter(name__iexact=name).exists():
            raise ValidationError("name has already been taken")
        return name

    def validate(self, attrs):
        form = attrs.get("data")[0].form
        for pending in attrs.get("data"):
            if pending.form_id != form.id:
                raise ValidationError(
                    {"data": "Form id is different for provided data"})
        return attrs

    def create(self, validated_data):
        form_id = validated_data.get("data")[0].form_id
        user: SystemUser = validated_data.get("user")
        path = "{0}{1}".format(user.user_access.administration.path,
                               user.user_access.administration_id)
        obj = PendingDataBatch.objects.create(
            form_id=form_id,
            administration_id=user.user_access.administration_id,
            user=user,
            name=validated_data.get("name"),
        )
        for data in validated_data.get("data"):
            data.batch = obj
            data.save()
        for administration in Administration.objects.filter(
                id__in=path.split(".")):
            assignment = FormApprovalAssignment.objects.filter(
                form_id=form_id, administration=administration).first()
            if assignment:
                level = assignment.user.user_access.administration.level_id
                PendingDataApproval.objects.create(batch=obj,
                                                   user=assignment.user,
                                                   level_id=level)
                number_of_records = PendingFormData.objects.filter(
                    batch=obj).count()
                data = {
                    "send_to": [assignment.user.email],
                    "listing": [
                        {
                            "name": "Batch Name",
                            "value": obj.name
                        },
                        {
                            "name": "Questionnaire",
                            "value": obj.form.name
                        },
                        {
                            "name": "Number of Records",
                            "value": number_of_records
                        },
                        {
                            "name":
                            "Submitter",
                            "value":
                            f"""{obj.user.name},
                        {obj.user.designation_name}""",
                        },
                    ],
                }
                send_email(context=data, type=EmailTypes.pending_approval)
        if validated_data.get("comment"):
            PendingDataBatchComments.objects.create(
                user=user, batch=obj, comment=validated_data.get("comment"))
        return obj

    def update(self, instance, validated_data):
        pass


class SubmitPendingFormDataSerializer(serializers.ModelSerializer):
    administration = CustomPrimaryKeyRelatedField(
        queryset=Administration.objects.none())
    name = CustomCharField()
    geo = CustomListField(required=False, allow_null=True)
    submitter = CustomCharField(required=False)
    duration = CustomIntegerField(required=False)

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        self.fields.get(
            "administration").queryset = Administration.objects.all()

    class Meta:
        model = PendingFormData
        fields = ["name", "geo", "administration", "submitter", "duration"]


class SubmitPendingFormDataAnswerSerializer(serializers.ModelSerializer):
    value = UnvalidatedField(allow_null=False)
    question = CustomPrimaryKeyRelatedField(queryset=Questions.objects.none())

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        self.fields.get("question").queryset = Questions.objects.all()

    def validate_value(self, value):
        return value

    def validate(self, attrs):
        if attrs.get("value") == "":
            raise ValidationError("Value is required for Question:{0}".format(
                attrs.get("question").id))

        if isinstance(attrs.get("value"), list) and len(
                attrs.get("value")) == 0:
            raise ValidationError("Value is required for Question:{0}".format(
                attrs.get("question").id))

        if not isinstance(attrs.get("value"),
                          list) and attrs.get("question").type in [
                              QuestionTypes.geo,
                              QuestionTypes.option,
                              QuestionTypes.multiple_option,
                          ]:
            raise ValidationError(
                "Valid list value is required for Question:{0}".format(
                    attrs.get("question").id))
        elif not isinstance(attrs.get("value"),
                            str) and attrs.get("question").type in [
                                QuestionTypes.text,
                                QuestionTypes.photo,
                                QuestionTypes.date,
                            ]:
            raise ValidationError(
                "Valid string value is required for Question:{0}".format(
                    attrs.get("question").id))
        elif not (isinstance(attrs.get("value"), int) or isinstance(
                attrs.get("value"), float)) and attrs.get("question").type in [
                    QuestionTypes.number,
                    QuestionTypes.administration,
                    QuestionTypes.cascade,
                ]:
            raise ValidationError(
                "Valid number value is required for Question:{0}".format(
                    attrs.get("question").id))

        if attrs.get("question").type == QuestionTypes.administration:
            attrs["value"] = int(float(attrs.get("value")))

        return attrs

    class Meta:
        model = PendingAnswers
        fields = ["question", "value"]


class SubmitPendingFormSerializer(serializers.Serializer):
    data = SubmitPendingFormDataSerializer()
    answer = SubmitPendingFormDataAnswerSerializer(many=True)

    def __init__(self, **kwargs):
        super().__init__(**kwargs)

    def validate(self, attrs):
        form: Forms = self.context.get("form")
        user: SystemUser = self.context.get("user")
        # county admin with county form type directly saved to form-data
        # if form.type == FormTypes.county and \
        #         user.user_access.role == UserRoleTypes.admin:
        #     raise ValidationError(
        #         {'data': 'You do not permission to submit the data'})
        if (form.type == FormTypes.national
                and user.user_access.role == UserRoleTypes.user):
            raise ValidationError(
                {"data": "You do not permission to submit the data"})
        return attrs

    def update(self, instance, validated_data):
        pass

    def create(self, validated_data):
        data = validated_data.get("data")
        data["form"] = self.context.get("form")
        data["created_by"] = self.context.get("user")

        # check user role and form type
        user: SystemUser = self.context.get("user")
        is_super_admin = user.user_access.role == UserRoleTypes.super_admin
        is_county_admin = (user.user_access.role == UserRoleTypes.admin
                           and data["form"].type == FormTypes.county)

        direct_to_data = is_super_admin or is_county_admin

        # save to pending data
        if not direct_to_data:
            obj_data = self.fields.get("data").create(data)

        # save to form data
        if direct_to_data:
            obj_data = FormData.objects.create(
                name=data.get("name"),
                form=data.get("form"),
                administration=data.get("administration"),
                geo=data.get("geo"),
                created_by=data.get("created_by"),
                created=data.get("submitedAt") or timezone.now(),
            )

        for answer in validated_data.get("answer"):
            name = None
            value = None
            option = None

            if answer.get("question").meta_uuid:
                obj_data.uuid = answer.get("value")
                obj_data.save()

            if answer.get("question").type in [
                    QuestionTypes.geo,
                    QuestionTypes.option,
                    QuestionTypes.multiple_option,
            ]:
                option = answer.get("value")
            elif answer.get("question").type in [
                    QuestionTypes.text,
                    QuestionTypes.photo,
                    QuestionTypes.date,
                    QuestionTypes.autofield,
            ]:
                name = answer.get("value")
            elif answer.get("question").type == QuestionTypes.cascade:
                id = answer.get("value")
                val = None
                if answer.get("question").api:
                    ep = answer.get("question").api.get("endpoint")
                    if "organisation" in ep:
                        val = Organisation.objects.filter(pk=id).first()
                        val = val.name
                    else:
                        ep = ep.split("?")[0]
                        ep = f"{ep}?id={id}"
                        val = requests.get(ep).json()
                        val = val[0].get("name")

                if answer.get("question").extra:
                    cs_type = answer.get("question").extra.get("type")
                    if cs_type == "entity":
                        val = EntityData.objects.filter(pk=id).first()
                        val = val.name
                name = val
            else:
                # for administration,number question type
                value = answer.get("value")

            # save to pending answer
            if not direct_to_data:
                PendingAnswers.objects.create(
                    pending_data=obj_data,
                    question=answer.get("question"),
                    name=name,
                    value=value,
                    options=option,
                    created_by=self.context.get("user"),
                    created=data.get("submitedAt") or timezone.now(),
                )

            # save to form data
            if direct_to_data:
                Answers.objects.create(
                    data=obj_data,
                    question=answer.get("question"),
                    name=name,
                    value=value,
                    options=option,
                    created_by=self.context.get("user"),
                )

        if direct_to_data:
            obj_data.save()
            obj_data.save_to_file

        async_task("api.v1.v1_data.functions.refresh_materialized_data")

        return obj_data
