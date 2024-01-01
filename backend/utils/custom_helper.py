import random
import string
import base64
from typing import Callable, List, Union


def generate_random_string(length):
    letters = string.ascii_lowercase
    return "".join(random.choice(letters) for i in range(length))


def generate_random_number(length):
    numbers = string.digits
    return "".join(random.choice(numbers) for i in range(length))


class CustomPasscode():
    def __init__(self):
        pass

    def encode(self, passcode):
        passcode_bytes = passcode.encode('utf-8')
        encoded_passcode = base64.urlsafe_b64encode(passcode_bytes)
        return encoded_passcode.decode('utf-8')

    def decode(self, encoded_passcode):
        passcode_bytes = base64.urlsafe_b64decode(
            encoded_passcode.encode('utf-8')
        )
        return passcode_bytes.decode('utf-8')


def clean_array_param(param: str, func: Callable) -> List[int]:
    array = [func(p) for p in param.split(',')]
    return [it for it in array if it]


def maybe_int(val) -> Union[int, None]:
    try:
        return int(val)
    except Exception:
        return None
