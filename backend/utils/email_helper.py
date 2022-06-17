import os
from pathlib import Path

from django.core.mail import EmailMultiAlternatives
from django.template.loader import render_to_string
from rest_framework import serializers
from utils.custom_serializer_fields import CustomChoiceField
from rtmis.settings import EMAIL_FROM


class EmailTypes:
    user_register = 'user_register'
    user_approval = 'user_approval'
    user_forgot_password = 'user_forgot_password'
    user_invite = 'user_invite'
    data_approval = 'data_approval'
    data_rejection = 'data_rejection'
    batch_approval = 'batch_approval'
    batch_rejection = 'batch_rejection'
    inform_batch_rejection_approver = 'inform_batch_rejection_approver'
    pending_approval = 'pending_approval'
    upload_error = 'upload_error'
    new_request = 'new_request'
    unchanged_data = 'unchanged_data'

    FieldStr = {
        user_register: 'user_register',
        user_approval: 'user_approval',
        user_forgot_password: 'user_forgot_password',
        user_invite: 'user_invite',
        data_approval: 'data_approval',
        data_rejection: 'data_rejection',
        batch_approval: 'batch_approval',
        batch_rejection: 'batch_rejection',
        inform_batch_rejection_approver: 'inform_batch_rejection_approver',
        pending_approval: 'pending_approval',
        upload_error: 'upload_error',
        new_request: 'new_request',
        unchanged_data: 'unchanged_data'
    }


class ListEmailTypeRequestSerializer(serializers.Serializer):
    type = CustomChoiceField(choices=list(EmailTypes.FieldStr.keys()),
                             required=True)


def email_context(context: dict, type: str):
    webdomain = os.environ["WEBDOMAIN"]
    context.update({
        "webdomain": webdomain,
        "logo": f"{webdomain}/logo.png",
        "site_name": "MOH"
    })
    if type == EmailTypes.user_register:
        context.update({
            "subject": "Registration",
            "body": '''Welcome!,
                You are receiving this email because you Signed up to
                the the National Sanitation and Hygiene Real-Time
                Monitoring System.
                .''',
            "image": f"{webdomain}/email-icons/check-circle.png",
            "success_text": "Successfully Registered",
            "message_list": ["JMP/SDG Status",
                             "CLTS Progress",
                             "Water Infrastructure"],
            "explore_button": True
        })
    if type == EmailTypes.user_approval:
        context.update({
            "subject": "Verified",
            "body": '''Congratulations!! You are now a verified user,
                    with great power comes great responsibility''',
            "image": f"{webdomain}/email-icons/user.png",
            "info_text": "You can now view, upload and export out data from \
                the following regions.",
            "user_credentials": [{
                "location": "Kisumu",
                "credential": "Admin"
            }, {
                "location": "Nakuru",
                "credential": "View Only"
            }],
            "explore_button": True
        })
    if type == EmailTypes.user_forgot_password:
        button_url = "#"
        if context.get("button_url"):
            button_url = context.get("button_url")
        context.update({
            "subject": "Reset Password",
            "body": '''You recently requested a password reset.
                Please disregard this email if it wasn't you and make sure
                you can still login to your account.
                If it was you, please click the following button to
                reset your password
                ''',
            "explore_button": False,
            "button": True,
            "button_url": button_url,
            "button_text": "Reset Password"
        })
    if type == EmailTypes.user_invite:
        button_url = "#"
        admin = ""
        if context.get("button_url"):
            button_url = context.get("button_url")
        if context.get("admin"):
            admin = context.get("admin")
        context.update({
            "subject": "Invitation",
            "body": f'''You have been invited to the Rural Urban Sanitation
            and Hygiene (RUSH) monitoring platform by {admin}''',
            "extend_body": '''Please click on the button below
            to set your password and finalise your account setup.''',
            "align": "left",
            "explore_button": False,
            "button": True,
            "button_url": button_url,
            "button_text": "Set Password"
        })
    if type == EmailTypes.data_approval:
        context.update({
            "subject": "Data Upload Approved",
            "body": '''Your Data Upload has been approved by Administrator''',
            "image": f"{webdomain}/email-icons/check-circle.png",
            "success_text": "Filename Approved",
            "explore_button": True
        })
    if type == EmailTypes.data_rejection:
        context.update({
            "subject": "Data Upload Rejected",
            "body": '''Your Data Upload has been rejected by
                    Your admin''',
            "image": f"{webdomain}/email-icons/close-circle.png",
            "failed_text": "Filename Rejected",
            "feedback": [
                "Donec dictum neque ac cursus sollicitudin.",
                "Vivamus sodales quam at felis scelerisque, ut tincidunt quam \
                    vestibulum.",
                "Nullam sed magna a ligula ultrices rhoncus nec in sapien.",
                "Quisque tincidunt diam in ligula ornare condimentum.",
                "Vivamus sodales quam at felis scelerisque, ut tincidunt quam \
                    vestibulum.",
                "Nullam sed magna a ligula ultrices rhoncus nec in sapien."],
            "explore_button": True
        })
    if type == EmailTypes.batch_approval:
        batch = context.get("batch")
        user = context.get("user")
        body = "{0} of {1} data has been approved by {2}"
        success_text = "{0} Approved"
        if batch and user:
            body = body.format(batch.name, batch.form.name,
                               user.get_full_name())
            success_text = success_text.format(batch.name)
        else:
            body = body.format("Batch name", "Form name", "User email")
            success_text = success_text.format("Batch name")
        context.update({
            "subject": "Batch Approved",
            "body": body,
            "image": f"{webdomain}/email-icons/check-circle.png",
            "success_text": success_text,
            "explore_button": True
        })
    if type == EmailTypes.batch_rejection:
        batch = context.get("batch")
        user = context.get("user")
        body = "{0} of {1} data has been rejected by {2}"
        failed_text = "{0} Rejected"
        if batch and user:
            body = body.format(batch.name, batch.form.name,
                               user.get_full_name())
            failed_text = failed_text.format(batch.name)
        else:
            body = body.format("Batch name", "Form name", "User email")
            failed_text = failed_text.format("Batch name")
        context.update({
            "subject": "Batch Rejected",
            "body": body,
            "image": f"{webdomain}/email-icons/close-circle.png",
            "failed_text": failed_text,
            "explore_button": True
        })
    if type == EmailTypes.inform_batch_rejection_approver:
        batch = context.get("batch")
        user = context.get("user")
        body = "{0} of {1} data has been rejected by {2}"
        failed_text = "{0} Rejected"
        if batch and user:
            body = body.format(batch.name, batch.form.name,
                               user.get_full_name())
            failed_text = failed_text.format(batch.name)
        else:
            body = body.format("Batch name", "Form name", "User email")
            failed_text = failed_text.format("Batch name")
        context.update({
            "subject": "Batch Rejected",
            "body": body,
            "image": f"{webdomain}/email-icons/close-circle.png",
            "failed_text": failed_text,
            "explore_button": True
        })
    if type == EmailTypes.pending_approval:
        form = context.get("form")
        user = context.get("user")
        body = "You have pending approval for {0} data from {1}, {2}"
        info_text = "{0} Pending Approval"
        if form and user:
            body = body.format(form.name, user.get_full_name(),
                               user.user_access.administration.full_name)
            info_text = info_text.format(form.name)
        else:
            body = body.format("Form name", "User email", "Administration")
            info_text = info_text.format("Form name")
        context.update({
            "subject": "Pending Approval",
            "body": body,
            "image": f"{webdomain}/email-icons/info-circle.png",
            "info_text": info_text,
            "explore_button": True
        })
    if type == EmailTypes.new_request:
        context.update({
            "image": f"{webdomain}/email-icons/info-circle.png",
            "info_text": """
            The spreadsheet that you uploaded has been successfully
            validated and submitted.
            """,
            "extend_body": "The appovers for this data will be notified",
            "explore_button": True
        })
    if type == EmailTypes.upload_error:
        context.update({
            "subject": "Upload Error",
            "info_text": '''Your data upload the the RUSH platform failed
            validation checks.''',
            "image": f"{webdomain}/email-icons/close-circle.png",
            "failed_text": "Upload Error",
            "extend_body": """The validation errors are attachedin this email.
            It list all the validation errors that were
            found along with the cell number.
            Do note all data upload will need to conform to the questionnaire.
            Please fix the validation errors and upload again.""",
            "align": "left",
            "explore_button": True
        })
    if type == EmailTypes.unchanged_data:
        context.update({
            "subject": "No Data Updates found",
            "image": f"{webdomain}/email-icons/info-circle.png",
            "info_text": "No updated data found in the last uploaded file",
            "explore_button": True
        })
    # prevent multiline if inside html template
    show_content = context.get('message_list') \
        or context.get('user_credentials') \
        or context.get('feedback')
    context.update({"show_content": show_content})
    return context


def send_email(context: dict, type=str, path=None,
               content_type=None, send=True):
    context = email_context(context=context, type=type)
    try:

        email_html_message = render_to_string("email/main.html", context)
        msg = EmailMultiAlternatives(
            "RUSH - {0}".format(context.get('subject')),
            'Email plain text',
            EMAIL_FROM,
            context.get('send_to'),
        )
        msg.attach_alternative(email_html_message, "text/html")
        if path:
            msg.attach(Path(path).name, open(path).read(),
                       content_type)
        if send:
            msg.send()
        if not send:
            return email_html_message
    except Exception as ex:
        print(ex)
