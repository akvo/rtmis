from django.utils import timezone
from api.v1.v1_profile.constants import UserRoleTypes
from api.v1.v1_forms.models import FormApprovalAssignment


def check_unique_user(role):
    return role in [UserRoleTypes.admin, UserRoleTypes.approver]


def check_form_approval_assigned(role, forms, administration, user=None):
    # if user is None that for add new user
    # else that for update/edit user
    unique_user = check_unique_user(role)
    if not unique_user:
        return False
    # Check if form id x in y administration has approver assignment
    # send a message to FE 403
    form_approval_assignment = FormApprovalAssignment.objects.filter(
        administration=administration)
    if not user:
        form_approval_assignment = form_approval_assignment.filter(
            form__in=forms)
    if user:
        # check if updated user already have form assigned
        form_assigned = form_approval_assignment.filter(
            user=user).distinct('form').values_list('form_id', flat=True)
        form_assigned_to_delete = []
        form_to_assign = [fr.id for fr in forms]
        for fa in form_assigned:
            if fa not in form_to_assign:
                form_assigned_to_delete.append(fa)
            else:
                # remove assigned form from form filter
                form_to_assign.remove(fa)
        form_approval_assignment = form_approval_assignment.filter(
            form_id__in=form_to_assign)
        # delete approval assigned
        if form_assigned_to_delete:
            FormApprovalAssignment.objects.filter(
                administration=administration,
                form_id__in=form_assigned_to_delete,
                user=user).delete()

    form_approval_assignment = form_approval_assignment.distinct(
        'form', 'administration').all()
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
    form_to_assign = forms
    # check if forms already asiggned into user
    check = FormApprovalAssignment.objects.filter(
        administration=administration,
        form__in=forms,
        user=user)
    if check:
        form_to_assign = []
        for fr in forms:
            if fr.id in check.values_list('form_id', flat=True):
                continue
            form_to_assign.append(fr)
        for fa in check.all():
            fa.updated = timezone.now()
            fa.save()
    # Add user value to approval assignment table (approval tree)
    form_approval_obj = [FormApprovalAssignment(
        form=fr,
        administration=administration,
        user=user
    ) for fr in form_to_assign]
    approval = FormApprovalAssignment.objects.bulk_create(form_approval_obj)
    return approval
