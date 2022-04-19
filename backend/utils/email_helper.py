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

    FieldStr = {
        user_register: 'user_register',
        user_approval: 'user_approval',
        data_approval: 'data_approval',
        data_rejection: 'data_rejection'
    }


class ListEmailTypeRequestSerializer(serializers.Serializer):
    type = CustomChoiceField(choices=list(EmailTypes.FieldStr.keys()),
                             required=True)


def send_email(context: dict, path=None, content_type=None,
               send=True, type=None):
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

    # prevent multiline if inside html template
    show_content = context.get('message_list') \
        or context.get('user_credentials') \
        or context.get('feedback')
    context.update({"show_content": show_content})

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
