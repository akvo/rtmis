import os
from pathlib import Path
from google.cloud import storage
from rtmis.settings import BUCKET_NAME
import shutil


def upload(file: str, folder: str, filename: str = None, public: bool = False):
    if not filename:
        filename = file.split("/")[-1]
    TESTING = os.environ.get("TESTING")
    if TESTING:
        fake_location = f"./tmp/fake-storage/{filename}"
        shutil.copy2(file, fake_location)
        return fake_location
    storage_client = storage.Client()
    bucket = storage_client.bucket(BUCKET_NAME)
    destination_blob_name = f"{folder}/{filename}"
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
    TESTING = os.environ.get("TESTING")
    if TESTING:
        os.remove(url)
        return url
    storage_client = storage.Client()
    bucket = storage_client.bucket(BUCKET_NAME)
    blob = bucket.blob(f"{folder}/{file}")
    blob.delete()
    return blob.name


def check(url: str):
    TESTING = os.environ.get("TESTING")
    if TESTING:
        path = Path(url)
        return path.is_file()
    storage_client = storage.Client()
    bucket = storage_client.bucket(BUCKET_NAME)
    return storage.Blob(bucket=bucket, name=url).exists(storage_client)


def download(url):
    TESTING = os.environ.get("TESTING")
    if TESTING:
        return url
    storage_client = storage.Client()
    bucket = storage_client.bucket(BUCKET_NAME)
    blob = bucket.blob(url)
    tmp_file = url.split("/")[-1]
    tmp_file = f"./tmp/{tmp_file}"
    blob.download_to_filename(tmp_file)
    return tmp_file
