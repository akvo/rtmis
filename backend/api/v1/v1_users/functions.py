from api.v1.v1_profile.constants import UserRoleTypes
from api.v1.v1_forms.models import FormApprovalAssignment


def check_unique_user(role):
    return role in [UserRoleTypes.admin, UserRoleTypes.approver]


def check_form_approval_assigned(role, forms, administration):
    unique_user = check_unique_user(role)
    if not unique_user:
        return False
    # Check if form id x in y administration has approver assignment
    # send a message to FE 404
    form_approval_assignment = FormApprovalAssignment.objects.filter(
        form__in=forms,
        administration=administration
    ).distinct('form', 'administration').all()
    if form_approval_assignment:
        message_detail = [{
            'form': fa.form.name,
            'administration': fa.administration.name
        } for fa in form_approval_assignment]
        return message_detail
    return False


def assign_form_approval(role, forms, administration, user):
    unique_user = check_unique_user(role)
    if not unique_user:
        return False
    # Add user value to approval assignment table (approval tree)
    form_approval_obj = [FormApprovalAssignment(
        form=fr,
        administration=administration,
        user=user
    ) for fr in forms]
    approval = FormApprovalAssignment.objects.bulk_create(form_approval_obj)
    return approval
