import random

from django.core.management import BaseCommand

from api.v1.v1_forms.constants import FormTypes
from api.v1.v1_forms.models import Forms, FormApprovalRule
from api.v1.v1_profile.models import Access, Levels


class Command(BaseCommand):
    def handle(self, *args, **options):
        FormApprovalRule.objects.all().delete()
        for form in Forms.objects.all():
            if form.type == FormTypes.county:
                for user in Access.objects.filter(
                        administration__level=Levels.objects.filter(
                            level=1).first()).distinct('administration_id'):
                    randoms = Levels.objects.filter(level__gt=1).count()
                    randoms = [n + 1 for n in range(randoms)]
                    limit = random.choices(randoms)
                    levels = Levels.objects.filter(
                        level__gt=1).order_by('?')[:limit[0]]
                    levels |= Levels.objects.filter(level=1)
                    rule = FormApprovalRule.objects.create(
                        form=form, administration=user.administration)
                    rule.levels.set(levels)
                    rule.save()
            else:
                for user in Access.objects.filter(
                        administration__level=Levels.objects.filter(
                            level=0).first()).distinct('administration_id'):
                    rule = FormApprovalRule.objects.create(
                        form=form, administration=user.administration)
                    rule.levels.set(Levels.objects.filter(level=0))
                    rule.save()
