from django.core.management import BaseCommand
from api.v1.v1_mobile.models import MobileAssignment
from api.v1.v1_users.models import SystemUser
from api.v1.v1_profile.models import Access
from utils.custom_helper import generate_random_string, CustomPasscode
from rest_framework_simplejwt.tokens import RefreshToken


class Command(BaseCommand):
    def handle(self, *args, **options):
        MobileAssignment.objects.all().delete()
        for user in SystemUser.objects.all():
            access = Access.objects.filter(user=user).first()
            if not access:
                continue
            token = RefreshToken.for_user(user)
            passcode = generate_random_string(8)
            MobileAssignment.objects.create(
                user=user,
                token=token.access_token,
                passcode=CustomPasscode().encode(passcode),
            )
