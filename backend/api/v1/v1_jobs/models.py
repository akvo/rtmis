from django.db import models

# Create your models here.
from api.v1.v1_jobs.constants import JobTypes, JobStatus
from api.v1.v1_users.models import SystemUser


class Jobs(models.Model):
    task_id = models.CharField(
        max_length=50, unique=True, null=True, default=None
    )
    type = models.IntegerField(choices=JobTypes.FieldStr.items())
    status = models.IntegerField(
        choices=JobStatus.FieldStr.items(), default=JobStatus.pending
    )
    attempt = models.IntegerField(default=0)
    result = models.TextField(default=None, null=True)
    info = models.JSONField(default=None, null=True)
    user = models.ForeignKey(
        to=SystemUser, on_delete=models.CASCADE, related_name="user_jobs"
    )
    created = models.DateTimeField(auto_now_add=True)
    available = models.DateTimeField(default=None, null=True)

    def __str__(self):
        return self.user.get_full_name()

    class Meta:
        db_table = "jobs"
