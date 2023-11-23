from uuid import uuid4
from utils import storage


def generate_image_file(file, filename, folder="images"):
    temp_file = open(f"./tmp/{filename}", "wb+")
    for chunk in file.chunks():
        temp_file.write(chunk)
    storage.upload(file=f"./tmp/{filename}", filename=filename, folder=folder)
    temp_file.close()


def process_image(request):
    file = request.FILES["file"]
    extension = file.name.split(".")[-1]
    original_filename = "-".join(file.name.split(".")[:-1])
    original_filename = "_".join(original_filename.strip().split(" "))
    new_filename = f"{original_filename}-{uuid4()}.{extension}"
    generate_image_file(file, new_filename)
    return new_filename
