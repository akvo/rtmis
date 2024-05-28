from pathlib import Path

from django.core.mail import EmailMultiAlternatives
from django.template.loader import render_to_string
from rest_framework import serializers
from utils.custom_serializer_fields import CustomChoiceField
from rtmis.settings import EMAIL_FROM, WEBDOMAIN


class EmailTypes:
    user_register = "user_register"
    user_approval = "user_approval"
    user_forgot_password = "user_forgot_password"
    user_invite = "user_invite"
    user_update = "user_update"
    data_approval = "data_approval"
    data_rejection = "data_rejection"
    batch_approval = "batch_approval"
    batch_rejection = "batch_rejection"
    inform_batch_rejection_approver = "inform_batch_rejection_approver"
    pending_approval = "pending_approval"
    upload_error = "upload_error"
    new_request = "new_request"
    unchanged_data = "unchanged_data"
    feedback = "feedback"
    administration_upload = "administration_upload"
    administration_prefilled = "administration_prefilled"

    FieldStr = {
        user_register: "user_register",
        user_approval: "user_approval",
        user_forgot_password: "user_forgot_password",
        user_invite: "user_invite",
        user_update: "user_update",
        data_approval: "data_approval",
        data_rejection: "data_rejection",
        batch_approval: "batch_approval",
        batch_rejection: "batch_rejection",
        inform_batch_rejection_approver: "inform_batch_rejection_approver",
        pending_approval: "pending_approval",
        upload_error: "upload_error",
        new_request: "new_request",
        unchanged_data: "unchanged_data",
        feedback: "feedback",
        administration_upload: "administration_upload",
        administration_prefilled: "administration_prefilled",
    }


class ListEmailTypeRequestSerializer(serializers.Serializer):
    type = CustomChoiceField(
        choices=list(EmailTypes.FieldStr.keys()), required=True
    )


def email_context(context: dict, type: str):
    context.update(
        {
            "webdomain": WEBDOMAIN,
            "logo": f"{WEBDOMAIN}/logo.png",
            "site_name": "MOH",
        }
    )
    if type == EmailTypes.user_register:
        context.update(
            {
                "subject": "Registration",
                "body": """Welcome!,
                You are receiving this email because you Signed up to
                the the National Sanitation and Hygiene Real-Time
                Monitoring System.
                .""",
                "image": f"{WEBDOMAIN}/email-icons/check-circle.png",
                "success_text": "Successfully Registered",
                "message_list": [
                    "JMP/SDG Status",
                    "CLTS Progress",
                    "Water Infrastructure",
                ],
                "explore_button": True,
            }
        )
    if type == EmailTypes.user_approval:
        context.update(
            {
                "subject": "Verified",
                "body": """Congratulations!! You are now a verified user,
                    with great power comes great responsibility""",
                "image": f"{WEBDOMAIN}/email-icons/user.png",
                "info_text": "You can now view, upload and export out data from \
                the following regions.",
                "user_credentials": [
                    {"location": "Kisumu", "credential": "Admin"},
                    {"location": "Nakuru", "credential": "View Only"},
                ],
                "explore_button": True,
            }
        )
    if type == EmailTypes.user_forgot_password:
        button_url = "#"
        if context.get("button_url"):
            button_url = context.get("button_url")
        context.update(
            {
                "subject": "Reset Password",
                "body": """You recently requested a password reset.
                Please disregard this email if it wasn't you and make sure
                you can still login to your account.
                If it was you, please click the following button to
                reset your password
                """,
                "explore_button": False,
                "button": True,
                "button_url": button_url,
                "button_text": "Reset Password",
            }
        )
    if type == EmailTypes.user_invite:
        button_url = "#"
        admin = ""
        if context.get("button_url"):
            button_url = context.get("button_url")
        if context.get("admin"):
            admin = context.get("admin")
        context.update(
            {
                "subject": "New Invitation",
                "body": f"""You have been invited to the Rural Urban Sanitation
            and Hygiene (RUSH) monitoring platform by {admin}""",
                "extend_body": """Please click on the button below
            to set your password and finalise your account setup.""",
                "align": "left",
                "explore_button": False,
                "button": True,
                "button_url": button_url,
                "button_text": "Set Password",
            }
        )
    if type == EmailTypes.user_update:
        admin = ""
        if context.get("admin"):
            admin = context.get("admin")
        context.update(
            {
                "subject": "Profile Updated",
                "body": f"""Your profile on the Rural Urban Sanitation and Hygiene
            (RUSH) monitoring platform has been updated by {admin}""",
                "align": "left",
                "explore_button": True,
            }
        )
    if type == EmailTypes.data_approval:
        context.update({
            "subject": "Data Upload Approved",
            "body": "Your Data Upload has been approved by Administrator",
            "image": f"{WEBDOMAIN}/email-icons/check-circle.png",
            "success_text": "Filename Approved",
            "explore_button": True,
        })
    if type == EmailTypes.data_rejection:
        context.update({
            "subject": "Data Upload Rejected",
            "body": """Your Data Upload has been rejected by
                Your admin""",
            "image": f"{WEBDOMAIN}/email-icons/close-circle.png",
            "failed_text": "Filename Rejected",
            "feedback": [
                "Donec dictum neque ac cursus sollicitudin.",
                "Vivamus sodales quam at felis scelerisque, ut tincidunt quam \
                vestibulum.",
                "Nullam sed magna a ligula ultrices rhoncus nec in sapien.",
                "Quisque tincidunt diam in ligula ornare condimentum.",
                "Vivamus sodales quam at felis scelerisque, ut tincidunt quam \
                vestibulum.",
                "Nullam sed magna a ligula ultrices rhoncus nec in sapien.",
            ],
            "explore_button": True,
        })
    if type == EmailTypes.batch_approval:
        context.update(
            {
                "subject": "Batch Approved",
                "image": f"{WEBDOMAIN}/email-icons/check-circle.png",
                "success_text": "Your submission has been approved",
                "align": "left",
                "explore_button": True,
            }
        )
    if type == EmailTypes.batch_rejection:
        context.update(
            {
                "subject": "Batch Rejected",
                "image": f"{WEBDOMAIN}/email-icons/close-circle.png",
                "failed_text": "Your submission batch has been rejected",
                "align": "left",
                "explore_button": True,
            }
        )
    if type == EmailTypes.inform_batch_rejection_approver:
        context.update(
            {
                "subject": "Batch Rejected",
                "image": f"{WEBDOMAIN}/email-icons/close-circle.png",
                "failed_text": """
            A submission batch that you had approved has been rejected""",
                "align": "left",
                "explore_button": True,
            }
        )
    if type == EmailTypes.pending_approval:
        context.update(
            {
                "subject": "Pending Approval",
                "image": f"{WEBDOMAIN}/email-icons/info-circle.png",
                "info_text": "There is data that is pending your approval!",
                "extend_body": """
            To approve/reject this data submission please visit
            the RUSH platform [My Profile > Approvals Section > View All]
            """,
                "align": "left",
                "explore_button": True,
            }
        )
    if type == EmailTypes.new_request:
        extend_body = "The appovers for this data will be notified"
        if context.get("is_super_admin"):
            extend_body = False
        context.update(
            {
                "image": f"{WEBDOMAIN}/email-icons/info-circle.png",
                "info_text": """
            The spreadsheet that you uploaded has been successfully
            validated and submitted.
            """,
                "extend_body": extend_body,
                "explore_button": True,
            }
        )
    if type == EmailTypes.upload_error:
        context.update(
            {
                "subject": "Upload Error",
                "info_text": """Your data upload the the RUSH platform failed
            validation checks.""",
                "image": f"{WEBDOMAIN}/email-icons/close-circle.png",
                "failed_text": "Upload Error",
                "extend_body": """The validation errors are attachedin this email.
            It list all the validation errors that were
            found along with the cell number.
            Do note all data upload will need to conform to the questionnaire.
            Please fix the validation errors and upload again.""",
                "align": "left",
                "explore_button": True,
            }
        )
    if type == EmailTypes.unchanged_data:
        context.update(
            {
                "subject": "No Data Updates found",
                "image": f"{WEBDOMAIN}/email-icons/info-circle.png",
                "info_text": """No changes were detected in the data
            that you uploaded""",
                "extend_body": """
            Please make sure that the file you are uploading contains
            updates to exisiting records or new records.
            The approvers for this data HAVE NOT been notified.
            """,
                "explore_button": True,
            }
        )
    if type == EmailTypes.feedback:
        if not context.get("subject"):
            context.update(
                {
                    "subject": "Feedback",
                }
            )
        if not context.get("body"):
            context.update(
                {
                    "body": "Example Feedback content here.",
                }
            )
        context.update({"image": None, "explore_button": False})
    if type == EmailTypes.administration_upload:
        context.update(
            {
                "subject": "Administration Data Submitted",
                "image": f"{WEBDOMAIN}/email-icons/info-circle.png",
                "info_text": """
            The spreadsheet that you uploaded has been successfully
            validated and submitted.
            """,
                "explore_button": True,
            }
        )
    if type == EmailTypes.administration_prefilled:
        context.update(
            {
                "subject": "Prefilled Administration ready to download",
                "image": f"{WEBDOMAIN}/email-icons/info-circle.png",
                "info_text": """
            The spreadsheet that you requested has been successfully
            validated and ready to download.
            """,
            }
        )
    # prevent multiline if inside html template
    show_content = (
        context.get("message_list")
        or context.get("user_credentials")
        or context.get("feedback")
    )
    context.update({"show_content": show_content})
    return context


def send_email(
    context: dict,
    type: str,
    path=None,
    content_type=None,
    send=True,
    excel=None,
):
    context = email_context(context=context, type=type)
    try:

        email_html_message = render_to_string("email/main.html", context)
        msg = EmailMultiAlternatives(
            "RUSH - {0}".format(context.get("subject")),
            "Email plain text",
            EMAIL_FROM,
            context.get("send_to"),
        )
        msg.attach_alternative(email_html_message, "text/html")
        if path:
            msg.attach(Path(path).name, open(path).read(), content_type)
        if excel:
            msg.attach(
                excel["name"], excel["file"], "application/vnd.ms-excel"
            )
        if send:
            msg.send()
        if not send:
            return email_html_message
    except Exception as ex:
        print(ex)
