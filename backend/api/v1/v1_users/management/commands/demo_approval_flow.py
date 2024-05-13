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
    email = ("{}{}.{}@approver.com").format(
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
    return assignment


class Command(BaseCommand):
    def add_arguments(self, parser):
        parser.add_argument(
            "-t", "--test", nargs="?", const=False, default=False, type=bool
        )

    def handle(self, *args, **options):
        test = options.get("test")
        forms = Forms.objects.filter(type=FormTypes.county).all()
        for form in forms:
            last_level = Levels.objects.order_by('-level')[1:2].first()
            administrations = Administration.objects.filter(
                level=last_level
            )
            if test:
                administrations = administrations.all()
            else:
                administrations = administrations.order_by('?')[:2]
            for administration in administrations:
                ancestors = administration.ancestors.filter(
                    level__level__gt=0
                )
                ancestors |= Administration.objects.filter(
                    id=administration.id
                )
                organisation = Organisation.objects.order_by('?').first()
                for ancestor in ancestors:
                    assignment = FormApprovalAssignment.objects \
                        .filter(
                            form=form,
                            administration=ancestor
                        ).first()
                    if not assignment:
                        assignment = create_approver(
                            form=form,
                            administration=ancestor,
                            organisation=organisation,
                        )
                        last_name = "Approver"
                        if ancestor.level.level == 1:
                            last_name = "Admin"
                    if not test:
                        print("Level: {} ({})".format(
                            ancestor.level.level,
                            ancestor.level.name
                        ))
                        print(f"- Administration Name: {ancestor.name}")
                        print("- Approver: {} ({})".format(
                            assignment.user.email,
                            last_name
                        ))
                # create user
                email = ("{}{}@user.com").format(
                        re.sub(
                            '[^A-Za-z0-9]+', '', administration.name.lower()
                        ),
                        administration.id
                    )
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
                    Access.objects.create(
                        user=submitter,
                        role=UserRoleTypes.user,
                        administration=ancestor
                    )
                UserForms.objects.get_or_create(form=form, user=submitter)
                if not test:
                    print("\nData entry:")
                    print(f"- Administration: {administration.full_name}")
                    print("- Email: {}\n".format(submitter.email))
                mobile_assignment = MobileAssignment.objects.create_assignment(
                    user=submitter,
                    name=fake.user_name(),
                )
                mobile_adms = administration.parent_administration\
                    .order_by('?')[:2]
                mobile_assignment.administrations.add(
                    *mobile_adms
                )
                mobile_assignment.forms.add(form)
