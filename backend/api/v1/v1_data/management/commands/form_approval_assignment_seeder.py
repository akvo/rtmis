from django.core.management import BaseCommand
from faker import Faker

from api.v1.v1_forms.constants import FormTypes
from api.v1.v1_forms.models import FormApprovalRule, FormApprovalAssignment
from api.v1.v1_profile.constants import UserRoleTypes
from api.v1.v1_profile.models import Administration, Access
from api.v1.v1_users.models import SystemUser, Organisation


class Command(BaseCommand):
    def handle(self, *args, **options):
        FormApprovalAssignment.objects.all().delete()
        organisation = Organisation.objects.first()
        for rule in FormApprovalRule.objects.all():
            if rule.form.type == FormTypes.county:
                previous = None
                for level in rule.levels.all().order_by('level'):
                    if previous:
                        filter_path = '{0}{1}.'.format(previous.path,
                                                       previous.id)
                    else:
                        filter_path = '{0}'.format(rule.administration.path)
                    administration = Administration.objects.filter(
                        path__startswith=filter_path, level=level).first()
                    previous = administration
                    user = SystemUser.objects.filter(
                        user_access__administration=administration,
                        user_access__role__in=[
                            UserRoleTypes.approver, UserRoleTypes.admin
                        ]).first()
                    if not user:
                        fake = Faker()
                        profile = fake.profile()
                        name = profile.get("name").split(" ")
                        user = SystemUser.objects.create_user(
                            organisation=organisation,
                            email=profile.get("mail"),
                            first_name=name[0],
                            last_name=name[1])
                        user.set_password('Test105*')
                        user.save()
                        role = UserRoleTypes.approver
                        if administration.level.level == 1:
                            role = UserRoleTypes.admin
                        Access.objects.create(user=user,
                                              role=role,
                                              administration=administration)
                    FormApprovalAssignment.objects.create(
                        form=rule.form,
                        administration=administration,
                        user=user)
            else:
                user = SystemUser.objects.filter(
                    user_access__administration=rule.administration).first()
                FormApprovalAssignment.objects.create(
                    form=rule.form,
                    administration=user.user_access.administration,
                    user=user)
