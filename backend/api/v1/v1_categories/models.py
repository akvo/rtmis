from django.db import models
from api.v1.v1_forms.models import Forms
from api.v1.v1_data.models import FormData


class DataCategory(models.Model):
    id = models.IntegerField(primary_key=True)
    name = models.CharField(max_length=50)
    data = models.ForeignKey(
        to=FormData,
        on_delete=models.DO_NOTHING,
        related_name="data_view_data_category",
    )
    form = models.ForeignKey(
        to=Forms,
        on_delete=models.DO_NOTHING,
        related_name="form_view_data_category",
    )
    options = models.JSONField()

    @property
    def serialize(self):
        return {
            "id": self.id,
            "name": self.name,
            "data": self.data_id,
            "form": self.form_id,
            "opt": self.options,
        }

    class Meta:
        managed = False
        db_table = "data_category"
