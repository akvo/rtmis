from django.core.management import BaseCommand
from api.v1.v1_users.models import SystemUser
from api.v1.v1_profile.constants import UserRoleTypes
from api.v1.v1_profile.models import Access, Administration


class Command(BaseCommand):
    def add_arguments(self, parser):
        parser.add_argument("email", nargs='+', type=str)
        parser.add_argument("-t",
                            "--test",
                            nargs="?",
                            const=1,
                            default=False,
                            type=int)

    def handle(self, *args, **options):
        email = options.get("email")
        user = SystemUser.objects.filter(email=email[0]).first()
        if not user:
            self.stdout.write("User doesn't exist")
            exit()
        if not user.is_superuser:
            self.stdout.write("User is not super admin")
            exit()
        administration = Administration.objects.filter(
            parent__isnull=True).first()
        Access.objects.create(user=user,
                              role=UserRoleTypes.super_admin,
                              administration=administration)
        if not options.get("test"):
            self.stdout.write(
                f"{user.email} now has access to {administration.name}")
