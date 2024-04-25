import os
import pandas as pd
from django.core.management.base import BaseCommand

from api.v1.v1_forms.models import Forms, SubmissionTypes
from api.v1.v1_jobs.job import (
    download_data,
    generate_definition_sheet,
)
from utils.storage import upload
from utils.export_form import (
    blank_data_template,
    meta_columns,
    get_question_names,
)

CRONJOB_RESULT_DIR = "cronjob_results"
submission_types_obj = {
    v.lower(): k for k, v in SubmissionTypes.FieldStr.items()
}


class Command(BaseCommand):
    def add_arguments(self, parser):
        parser.add_argument(
            "form_id",
            nargs="?",
            type=int
        )
        parser.add_argument(
            "--submission",
            "-s",
            nargs="?",
            default=None,
            type=str
        )
        parser.add_argument(
            "--latest",
            "-l",
            nargs="?",
            default=False,
            type=bool
        )

    def handle(self, *args, **options):
        submission_type = options.get("submission")
        download_type = "all" if not options.get("latest") else "recent"
        if submission_type:
            submission_type = submission_types_obj.get(submission_type)
        form_id = options.get("form_id")
        if not form_id:
            print("Please provide form id")
            exit()
        form = Forms.objects.get(pk=form_id)
        question_names = get_question_names(form=form)
        form_name = form.name.replace(" ", "_").lower()

        data = download_data(
            form=form,
            administration_ids=None,
            submission_type=submission_type,
            download_type=download_type
        )
        process_file = f"process-{form_name}.xlsx"
        if len(data):
            df = pd.DataFrame(data)
            for question_name in question_names:
                if question_name not in df:
                    df[question_name] = None
            # Reorder columns
            df = df[meta_columns + question_names]
            writer = pd.ExcelWriter(process_file, engine='xlsxwriter')
            df.to_excel(writer, sheet_name='data', index=False)
            generate_definition_sheet(form=form, writer=writer)
            writer.save()
        else:
            process_file = blank_data_template(form=form)

        out_file = "-".join(list(filter(lambda x: x, [
            form_name,
            options.get("submission") or "routine",
            "recent" if options.get("latest") else None,
        ])))

        out_file = f"{out_file}.xlsx"

        url = upload(
            file=process_file,
            folder=CRONJOB_RESULT_DIR,
            filename=out_file
        )
        print(f"File uploaded to {url}")
        os.remove(process_file)
