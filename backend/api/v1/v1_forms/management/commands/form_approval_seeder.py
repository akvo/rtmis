import random

from django.core.management import BaseCommand

from api.v1.v1_forms.models import Forms, FormApprovalRule
from api.v1.v1_profile.models import Access, Levels


class Command(BaseCommand):
    def handle(self, *args, **options):
        FormApprovalRule.objects.all().delete()
        for form in Forms.objects.all():
            for user in Access.objects.filter(administration__level_id=2):
                limit = random.choices([1, 2])
                levels = Levels.objects.filter(level__gt=1)[:limit[0]]
                rule = FormApprovalRule.objects.create(
                    form=form,
                    administration=user.administration
                )
                rule.levels.set(levels)
                rule.save()
