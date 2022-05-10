import re
from django.core.management import BaseCommand
from api.v1.v1_profile.constants import UserRoleTypes
from api.v1.v1_profile.models import Administration, Access, Levels
from api.v1.v1_users.models import SystemUser
from api.v1.v1_forms.models import Forms, UserForms
from api.v1.v1_forms.models import FormApprovalRule, FormApprovalAssignment
from api.v1.v1_forms.constants import FormTypes


class Command(BaseCommand):
    def handle(self, *args, **options):
        FormApprovalRule.objects.all().delete()
        form = Forms.objects.filter(
            type=FormTypes.county).order_by('?').first()
        print(f"\nForm Name: {form.name}\n\n")
        last_level = Levels.objects.order_by('-level').first()
        administration = Administration.objects.filter(
            level=last_level).order_by('?').first()
        ancestors = administration.ancestors
        # check if approval level rule are available
        first_level = ancestors.filter(level__level=1).first()
        approval_rule, created = FormApprovalRule.objects.get_or_create(
            form=form, administration=first_level)
        if created:
            approval_rule.save()
            approval_rule.levels.set(Levels.objects.filter(level__gte=1))
        # union the current administration also
        ancestors |= Administration.objects.filter(id=administration.id)
        print("Approvers:")
        for ancestor in ancestors.filter(level__level__gte=1):
            # check if approval assignment for the path is not available
            assignment = FormApprovalAssignment.objects.filter(
                form=form, administration=ancestor).first()
            if not assignment:
                email = ("{}{}@test.com").format(
                    re.sub('[^A-Za-z0-9]+', '', ancestor.name.lower()),
                    ancestor.id)
                last_name = "Approver"
                role = UserRoleTypes.approver
                if ancestor.level.level == 1:
                    role = UserRoleTypes.admin
                    last_name = "Admin"
                # check if someone has access to ancestor adminisration
                approver, created = SystemUser.objects.get_or_create(
                    email=email, first_name=ancestor.name, last_name=last_name)
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
        # create user
        email = ("{}{}@user.com").format(
            re.sub('[^A-Za-z0-9]+', '', administration.name.lower()),
            administration.id)
        submitter, created = SystemUser.objects.get_or_create(
            email=email, first_name=administration.name, last_name="User")
        if created:
            submitter.set_password("test")
            submitter.save()
            Access.objects.create(user=submitter,
                                  role=UserRoleTypes.user,
                                  administration=ancestor)
        UserForms.objects.get_or_create(form=form, user=approver)
        print("\nSubmitter:")
        print(f"- Administration: {administration.full_name}")
        print("- Email: {}\n".format(submitter.email))
