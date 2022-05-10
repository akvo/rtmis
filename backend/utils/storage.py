import os
from pathlib import Path
from google.cloud import storage
from django.conf import settings
import shutil

BUCKET_NAME = settings.BUCKET_NAME
webdomain = os.environ["WEBDOMAIN"]
bucket_folder = "test" if "test" in webdomain else "staging"
bucket_folder = "test" if webdomain == "notset" else "staging"


def upload(file: str, folder: str, filename: str = None, public: bool = False):
    if not filename:
        filename = file.split("/")[-1]
    if settings.FAKE_STORAGE:
        fake_location = f"./tmp/fake_storage/{filename}"
        shutil.copy2(file, fake_location)
        return fake_location
    storage_client = storage.Client()
    bucket = storage_client.bucket(BUCKET_NAME)
    destination_blob_name = f"{bucket_folder}/{folder}/{filename}"
    blob = bucket.blob(destination_blob_name)
    blob.upload_from_filename(file)
    os.remove(file)
    if public:
        blob.make_public()
        return blob.public_url
    return blob.name


def delete(url: str):
    file = url.split("/")[-1]
    folder = url.split("/")[-2]
    if settings.FAKE_STORAGE:
        os.remove(url)
        return url
    storage_client = storage.Client()
    bucket = storage_client.bucket(BUCKET_NAME)
    blob = bucket.blob(f"{bucket_folder}/{folder}/{file}")
    blob.delete()
    return blob.name


def check(url: str):
    if settings.FAKE_STORAGE:
        path = Path(url)
        return path.is_file()
    storage_client = storage.Client()
    bucket = storage_client.bucket(BUCKET_NAME)
    return storage.Blob(bucket=bucket, name=url).exists(storage_client)


def download(url):
    if settings.FAKE_STORAGE:
        return url
    storage_client = storage.Client()
    bucket = storage_client.bucket(BUCKET_NAME)
    blob = bucket.blob(f"{bucket_folder}/{url}")
    tmp_file = url.split("/")[-1]
    tmp_file = f"./tmp/{tmp_file}"
    blob.download_to_filename(tmp_file)
    return tmp_file
