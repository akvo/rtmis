from typing import Protocol

from django.test import Client


class HasTestClientProtocol(Protocol):
    @property
    def client(self) -> Client:
        ...


class AssignmentTokenTestHelperMixin:

    def get_assignmen_token(self: HasTestClientProtocol, passcode: str) -> str:
        resp = self.client.post(
            '/api/v1/device/auth',
            {'code': passcode},
            content_type='application/json',
        )
        return resp.data.get('syncToken')
