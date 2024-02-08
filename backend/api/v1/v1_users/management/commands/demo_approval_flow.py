import re
import random
from django.core.management import BaseCommand
from api.v1.v1_profile.constants import UserRoleTypes
from api.v1.v1_profile.models import Administration, Access, Levels
from api.v1.v1_users.models import SystemUser, Organisation
from api.v1.v1_forms.models import Forms, UserForms
from api.v1.v1_forms.models import FormApprovalAssignment
from api.v1.v1_forms.constants import FormTypes


class Command(BaseCommand):
    def handle(self, *args, **options):
        form = Forms.objects.filter(
            type=FormTypes.county).order_by('?').first()
        print(f"\nForm Name: {form.name}\n\n")
        last_level = Levels.objects.order_by('-level')[1:2].first()
        organisation = Organisation.objects.first()
        administration = Administration.objects.filter(
            level=last_level).order_by('?').first()
        ancestors = administration.ancestors
        # union the current administration also
        ancestors |= Administration.objects.filter(id=administration.id)
        print("Approvers:")
        for ancestor in ancestors.filter(level__level__gte=1,
                                         level__level__lt=4):
            # check if approval assignment for the path is not available
            assignment = FormApprovalAssignment.objects.filter(
                form=form, administration=ancestor).first()
            if not assignment:
                email = ("{}{}.{}@test.com").format(
                    re.sub('[^A-Za-z0-9]+', '', ancestor.name.lower()),
                    ancestor.id,
                    random.randint(1, 1000)
                )
                last_name = "Approver"
                role = UserRoleTypes.approver
                if ancestor.level.level == 1:
                    role = UserRoleTypes.admin
                    last_name = "Admin"
                # check if someone has access to ancestor adminisration
                approver, created = SystemUser.objects.get_or_create(
                    organisation=organisation,
                    email=email,
                    first_name=ancestor.name,
                    last_name=last_name)
                if created:
                    approver.set_password("test")
                    approver.save()
                    Access.objects.create(user=approver,
                                          role=role,
                                          administration=ancestor)
                UserForms.objects.get_or_create(form=form, user=approver)
                assignment = FormApprovalAssignment.objects.create(
                    form=form, administration=ancestor, user=approver)
                print("Level: {} ({})".format(ancestor.level.level,
                                              ancestor.level.name))
                print(f"- Administration Name: {ancestor.name}")
                print("- Approver: {} ({})".format(assignment.user.email,
                                                   last_name))
            else:
                print("Level: {} ({})".format(ancestor.level.level,
                                              ancestor.level.name))
                print(f"- Administration Name: {ancestor.name}")
                print("- Approver: {} ({})".format(assignment.user.email,
                                                   assignment.user.last_name))
        # create user
        email = ("{}{}@user.com").format(
            re.sub('[^A-Za-z0-9]+', '', administration.name.lower()),
            administration.id)
        submitter, created = SystemUser.objects.get_or_create(
            organisation=organisation,
            email=email,
            first_name=administration.name,
            last_name="User")
        if created:
            submitter.set_password("test")
            submitter.save()
            Access.objects.create(user=submitter,
                                  role=UserRoleTypes.user,
                                  administration=ancestor)
        UserForms.objects.get_or_create(form=form, user=submitter)
        print("\nSubmitter:")
        print(f"- Administration: {administration.full_name}")
        print("- Email: {}\n".format(submitter.email))
