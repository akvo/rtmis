from pathlib import Path

from django.core.mail import EmailMultiAlternatives
from django.template.loader import render_to_string
from rest_framework import serializers
from utils.custom_serializer_fields import CustomChoiceField
from rtmis.settings import EMAIL_FROM


class EmailTypes:
    user_register = 'user_register'
    user_approval = 'user_approval'
    data_approval = 'data_approval'
    data_rejection = 'data_rejection'
    batch_approval = 'batch_approval'
    batch_rejection = 'batch_rejection'
    pending_approval = 'pending_approval'
    upload_error = 'upload_error'
    new_request = 'new_request'
    unchanged_data = 'unchanged_data'

    FieldStr = {
        user_register: 'user_register',
        user_approval: 'user_approval',
        data_approval: 'data_approval',
        data_rejection: 'data_rejection',
        batch_approval: 'batch_approval',
        batch_rejection: 'batch_rejection',
        pending_approval: 'pending_approval',
        upload_error: 'upload_error',
        new_request: 'new_request',
        unchanged_data: 'unchanged_data'
    }


class ListEmailTypeRequestSerializer(serializers.Serializer):
    type = CustomChoiceField(choices=list(EmailTypes.FieldStr.keys()),
                             required=True)


def email_context(context: dict, type: str):
    context.update({
        "webdomain": "https://rtmis.akvotest.org",
        "logo": "https://rtmis.akvotest.org/logo.png",
        "site_name": "MOH"
    })
    if type == EmailTypes.user_register:
        context.update({
            "body": '''Welcome to the lore Epsom door sit amen
                some Descriptive welcome copy goes here''',
            "image": "https://rtmis.akvotest.org/email-icons/check-circle.png",
            "success_text": "Successfully Registered",
            "message_list": ["JMP/SDG Status",
                             "CLTS Progress",
                             "Water Infrastructure"]
        })
    if type == EmailTypes.user_approval:
        context.update({
            "body": '''Congratulations!! You are now a verified user,
                    with great power comes great responsibility''',
            "image": "https://rtmis.akvotest.org/email-icons/user.png",
            "info_text": "You can now view, upload and export out data from \
                the following regions.",
            "user_credentials": [{
                "location": "Kisumu",
                "credential": "Admin"
            }, {
                "location": "Nakuru",
                "credential": "View Only"
            }]
        })
    if type == EmailTypes.data_approval:
        context.update({
            "body": '''Your Data Upload has been approved by
                    Your admin - Ouma Odhiambo''',
            "image": "https://rtmis.akvotest.org/email-icons/check-circle.png",
            "success_text": "Filename Approved"
        })
    if type == EmailTypes.data_rejection:
        context.update({
            "body": '''Your Data Upload has been rejected by
                    Your admin - Ouma Odhiambo''',
            "image": "https://rtmis.akvotest.org/email-icons/close-circle.png",
            "failed_text": "Filename Rejected",
            "feedback": [
                "Donec dictum neque ac cursus sollicitudin.",
                "Vivamus sodales quam at felis scelerisque, ut tincidunt quam \
                    vestibulum.",
                "Nullam sed magna a ligula ultrices rhoncus nec in sapien.",
                "Quisque tincidunt diam in ligula ornare condimentum.",
                "Vivamus sodales quam at felis scelerisque, ut tincidunt quam \
                    vestibulum.",
                "Nullam sed magna a ligula ultrices rhoncus nec in sapien."]
        })
    if type == EmailTypes.batch_rejection:
        batch = context.get("batch")
        user = context.get("user")
        body = "{0} of {1} data has been rejected by {2}"
        failed_text = "{0} Rejected"
        if batch and user:
            body = body.format(batch.name, batch.form.name, user.email)
            failed_text = failed_text.format(batch.name)
        else:
            body = body.format("Batch name", "Form name", "User email")
            failed_text = failed_text.format("Batch name")
        context.update({
            "body": body,
            "image": "https://rtmis.akvotest.org/email-icons/close-circle.png",
            "failed_text": failed_text,
        })
    if type == EmailTypes.pending_approval:
        form = context.get("form")
        user = context.get("user")
        body = "You have pending approval for {0} data from {1}, {2}"
        info_text = "{0} Pending Approval"
        if form and user:
            body = body.format(form.name, user.email,
                               user.user_access.administration.full_name)
            info_text = info_text.format(form.name)
        else:
            body = body.format("Form name", "User email", "Administration")
            info_text = info_text.format("Form name")
        context.update({
            "body": body,
            "image": "https://rtmis.akvotest.org/email-icons/info-circle.png",
            "info_text": info_text,
        })
    if type == EmailTypes.new_request:
        context.update({
            "image": "https://rtmis.akvotest.org/email-icons/info-circle.png",
            "info_text": "Data has been successfully validated and submitted",
        })
    if type == EmailTypes.upload_error:
        context.update({
            "body": '''Invalid data in the uploaded file,
                    please correct it and try again.''',
            "image": "https://rtmis.akvotest.org/email-icons/close-circle.png",
            "failed_text": "Upload Error",
            "info_text": "Please find attached file for reference"
        })
    if type == EmailTypes.unchanged_data:
        context.update({
            "image": "https://rtmis.akvotest.org/email-icons/info-circle.png",
            "info_text": "No updated data found in the last uploaded file",
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
            context.get('subject'),
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
