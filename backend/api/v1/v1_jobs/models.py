from django.db import models

# Create your models here.
from api.v1.v1_jobs.constants import JobTypes, JobStatus
from api.v1.v1_users.models import SystemUser


class Jobs(models.Model):
    id = models.CharField(max_length=50, unique=True, primary_key=True)
    type = models.IntegerField(choices=JobTypes.FieldStr.items())
    status = models.IntegerField(choices=JobStatus.FieldStr.items(),
                                 default=JobStatus.pending)
    attempt = models.IntegerField(default=0)
    payload = models.TextField()
    info = models.JSONField(default=None, null=True)
    user = models.ForeignKey(to=SystemUser, on_delete=models.CASCADE,
                             related_name='user_jobs')
    created = models.DateTimeField(auto_now_add=True)
    available = models.DateTimeField(default=None, null=True)

    def __str__(self):
        return self.info

    class Meta:
        db_table = 'jobs'
