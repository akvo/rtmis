import os
from rtmis.settings import STORAGE_PATH
from pathlib import Path
import shutil


def upload(file: str, folder: str = None, filename: str = None):
    storage_location = STORAGE_PATH
    if folder:
        # create folder if not exists
        Path(f"{STORAGE_PATH}/{folder}").mkdir(parents=True, exist_ok=True)
        storage_location = f"{STORAGE_PATH}/{folder}"
    if not filename:
        filename = file.split("/")[-1]
    location = f"{storage_location}/{filename}"
    shutil.copy2(file, location)
    return location


def delete(url: str):
    os.remove(f"{STORAGE_PATH}/{url}")
    return url


def check(url: str):
    path = Path(f"{STORAGE_PATH}/{url}")
    return path.is_file()


def download(url):
    # copy to tmp folder
    tmp_file = url.split("/")[-1]
    tmp_file = f"./tmp/{tmp_file}"
    shutil.copy2(f"{STORAGE_PATH}/{url}", tmp_file)
    return f"{STORAGE_PATH}/{url}"
