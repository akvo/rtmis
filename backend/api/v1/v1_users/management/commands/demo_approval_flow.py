import re
import random
from faker import Faker
from django.core.management import BaseCommand
from api.v1.v1_profile.constants import UserRoleTypes, UserDesignationTypes
from api.v1.v1_profile.models import Administration, Access, Levels
from api.v1.v1_users.models import SystemUser, Organisation
from api.v1.v1_forms.models import Forms, UserForms
from api.v1.v1_forms.models import FormApprovalAssignment
from api.v1.v1_forms.constants import FormTypes
from api.v1.v1_mobile.models import MobileAssignment
fake = Faker()


def create_approver(form, administration, organisation):
    email = ("{}{}.{}@test.com").format(
        re.sub('[^A-Za-z0-9]+', '', administration.name.lower()),
        administration.id,
        random.randint(1, 1000)
    )
    last_name = "Approver"
    role = UserRoleTypes.approver
    if administration.level.level == 1:
        role = UserRoleTypes.admin
        last_name = "Admin"
    # check if someone has access to ancestor adminisration
    approver, created = SystemUser.objects.get_or_create(
        organisation=organisation,
        email=email,
        first_name=administration.name,
        last_name=last_name
    )
    if created:
        approver.set_password("test")
        approver.phone_number = fake.msisdn()
        approver.designation = fake.random_element(
            elements=UserDesignationTypes.FieldStr.keys()
        )
        approver.save()
        Access.objects.create(
            user=approver,
            role=role,
            administration=administration
        )
    UserForms.objects.get_or_create(form=form, user=approver)
    assignment = FormApprovalAssignment.objects.create(
        form=form,
        administration=administration,
        user=approver
    )
    return assignment, last_name


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
                                         level__level__lte=last_level.level):
            # check if approval assignment for the path is not available
            assignment = FormApprovalAssignment.objects.filter(
                form=form, administration=ancestor).first()
            if not assignment:
                assignment, last_name = create_approver(
                    form=form,
                    administration=ancestor,
                    organisation=organisation,
                )
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
            submitter.phone_number = fake.msisdn()
            submitter.designation = UserDesignationTypes.sa
            submitter.save()
            Access.objects.create(user=submitter,
                                  role=UserRoleTypes.user,
                                  administration=ancestor)
        UserForms.objects.get_or_create(form=form, user=submitter)
        print("\nSubmitter:")
        print(f"- Administration: {administration.full_name}")
        print("- Email: {}\n".format(submitter.email))

        # Create mobile user
        print("\nMobile assignment:")
        mobile_assignment = MobileAssignment.objects.create_assignment(
            user=submitter,
            name=fake.user_name()
        )
        administration_children = Administration.objects.filter(
            parent=administration
        ).order_by('?')[:2]
        mobile_assignment.administrations.add(
            *administration_children
        )
        mobile_assignment.forms.add(form)
        print("- Username: {}\n".format(mobile_assignment.name))
        print("- Administrations: {}\n".format(", ".join(
            [
                a["name"]
                for a in mobile_assignment.administrations.values('name')
            ]
        )))
