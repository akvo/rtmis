from django.contrib.auth.base_user import BaseUserManager
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


class UserManager(BaseUserManager):
    use_in_migrations = True

    def __init__(self, *args, **kwargs):
        self.with_deleted = kwargs.pop('with_deleted', False)
        self.only_deleted = kwargs.pop('only_deleted', False)
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

    def restore(self):
        return self.get_queryset().restore()

    def _create_user(self, email, password, **extra_fields):
        """
        Creates and saves a User with the given email and password.
        """
        if not email:
            raise ValueError('The given email must be set')
        # email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_user(self, email, password=None, **extra_fields):
        extra_fields.setdefault('is_superuser', False)
        return self._create_user(email, password, **extra_fields)

    def create_superuser(self, email, password, **extra_fields):
        extra_fields.setdefault('is_superuser', True)

        if extra_fields.get('is_superuser') is not True:
            raise ValueError('Superuser must have is_superuser=True.')

        return self._create_user(email, password, **extra_fields)
