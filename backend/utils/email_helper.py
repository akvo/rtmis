from pathlib import Path

from django.core.mail import EmailMultiAlternatives
from django.template.loader import render_to_string

from rtmis.settings import EMAIL_FROM


def send_email(context: dict, template, path=None, content_type=None):
    try:
        email_html_message = render_to_string(
            "email/{0}".format(template), context)
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
        msg.send()
    except Exception as ex:
        print(ex)
