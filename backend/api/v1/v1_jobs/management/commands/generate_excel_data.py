import os
import pandas as pd
from django.core.management.base import BaseCommand

from api.v1.v1_forms.models import Forms, SubmissionTypes
from api.v1.v1_jobs.job import generate_data_sheet
from utils.storage import upload

CRONJOB_RESULT_DIR = "cronjob_results"
submission_types_obj = {
    v.lower(): k for k, v in SubmissionTypes.FieldStr.items()
}


class Command(BaseCommand):
    def add_arguments(self, parser):
        parser.add_argument("form_id", nargs="?", type=int)
        parser.add_argument(
            "--submission", "-s", nargs="?", default=None, type=str
        )
        parser.add_argument(
            "--latest", "-l", nargs="?", default=False, type=bool
        )
        parser.add_argument(
            "--use-label", "-lb", nargs="?", default=False, type=bool
        )

    def handle(self, *args, **options):
        submission_type = options.get("submission")
        use_label = options.get("use_label")
        download_type = "all" if not options.get("latest") else "recent"
        if submission_type:
            submission_type = submission_types_obj.get(submission_type)
        form_id = options.get("form_id")
        if not form_id:
            print("Please provide form id")
            exit()
        form = Forms.objects.get(pk=form_id)
        form_name = form.name.replace(" ", "_").lower()
        process_file = f"process-{form_name}.xlsx"
        writer = pd.ExcelWriter(process_file, engine="xlsxwriter")
        generate_data_sheet(
            writer=writer,
            form=form,
            administration_ids=None,
            submission_type=submission_type,
            download_type=download_type,
            use_label=use_label,
        )
        writer.save()

        out_file = "-".join(
            list(
                filter(
                    lambda x: x,
                    [
                        form_name,
                        options.get("submission") or "routine",
                        "latest" if options.get("latest") else None,
                    ],
                )
            )
        )

        out_file = f"{out_file}.xlsx"

        url = upload(
            file=process_file, folder=CRONJOB_RESULT_DIR, filename=out_file
        )
        print(f"File uploaded to {url}")
        os.remove(process_file)
