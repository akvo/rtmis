from django.db import models
from django.utils import timezone


class SoftDeletesQuerySet(models.QuerySet):
    def only_deleted(self):
        return self.filter(deleted_at__isnull=False)

    def without_deleted(self):
        return self.filter(deleted_at__isnull=True)

    #  bulk deleting
    def delete(self, hard: bool = False):
        if hard:
            return super().delete()
        return super().update(deleted_at=timezone.now())

    def soft_delete(self):
        return self.delete()

    def hard_delete(self):
        return self.delete(hard=True)

    #  bulk restore
    def restore(self):
        return super().update(deleted_at=None)


class SoftDeletesManager(models.Manager):
    def __init__(self, *args, **kwargs):
        self.with_deleted = kwargs.pop("with_deleted", False)
        self.only_deleted = kwargs.pop("only_deleted", False)
        super().__init__(*args, **kwargs)

    def get_queryset(self):
        if self.with_deleted:
            return SoftDeletesQuerySet(self.model)

        if self.only_deleted:
            return SoftDeletesQuerySet(self.model).only_deleted()

        return SoftDeletesQuerySet(self.model).without_deleted()

    def delete(self, hard: bool = False):
        return self.get_queryset().delete(hard=hard)

    def soft_delete(self):
        return self.delete(hard=False)

    def hard_delete(self):
        return self.delete(hard=True)

    def restore(self):
        return self.get_queryset().restore()


class SoftDeletes(models.Model):
    deleted_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        abstract = True

    objects = SoftDeletesManager()
    objects_deleted = SoftDeletesManager(only_deleted=True)
    objects_with_deleted = SoftDeletesManager(with_deleted=True)

    def delete(self, using=None, keep_parents=False, hard: bool = False):
        if hard:
            return super().delete(using, keep_parents)
        self.deleted_at = timezone.now()
        self.save(update_fields=["deleted_at"])

    def soft_delete(self) -> None:
        self.delete(hard=False)

    def hard_delete(self, using=None, keep_parents: bool = False):
        return self.delete(using, keep_parents, hard=True)

    def restore(self) -> None:
        self.deleted_at = None
        self.save(update_fields=["deleted_at"])
