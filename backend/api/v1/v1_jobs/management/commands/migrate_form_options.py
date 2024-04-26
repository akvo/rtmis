import os
import pandas as pd

from django.core.management import BaseCommand
from django.db.models import Max

from api.v1.v1_forms.constants import SubmissionTypes, QuestionTypes
from api.v1.v1_data.models import (
    Answers,
    PendingAnswers,
    AnswerHistory,
    PendingAnswerHistory,
    FormData,
)


FILE_DIR = "./source/value_changes"
submission_types = [SubmissionTypes.registration, SubmissionTypes.monitoring]


def list_files_with_prefix(prefix):
    prefix = f"{prefix}-"
    all_files = os.listdir(FILE_DIR)
    matching_files = [file for file in all_files if prefix in file]
    return matching_files


def update_answers(
    df,
    form_id: int,
    model,
    base_column: str,
    update_column: str,
):
    datapoint_ids = []
    for answer in model.objects.filter(
        question__form_id=form_id,
        question__type__in=[
            QuestionTypes.option,
            QuestionTypes.multiple_option,
        ],
    ).all():
        # search into df by answer options
        new_options = []
        for opt in answer.options:
            match = df[df[base_column] == opt]
            if match.empty:
                continue
            new_options.append(match[update_column].to_list()[0])
        if not new_options:
            continue
        answer.options = new_options
        answer.save()
        try:
            datapoint_ids.append(answer.data_id)
        except AttributeError:
            datapoint_ids.append(answer.pending_data_id)
    return list(set(datapoint_ids))


def update_json_file(datapoint_ids: list, model, form_id: int):
    latest_form_data = (
        model.objects.filter(
            pk__in=datapoint_ids,
            form=form_id,
            submission_type__in=submission_types,
        )
        .values("uuid")
        .annotate(latest_updated=Max("updated"))
        .values("uuid", "latest_updated")
    ).values_list("id", flat=True)
    # fetch the latest form data for each UUID
    data = model.objects.filter(pk__in=latest_form_data).all()
    # generate file for each data
    for d in data:
        d.save_to_file


class Command(BaseCommand):
    def add_arguments(self, parser):
        parser.add_argument("issue_number", nargs="?", type=int)
        parser.add_argument("-r", "--reverse", action="store_true")

    def handle(self, *args, **options):
        issue_number = options.get("issue_number")
        if not issue_number:
            print("Please provide issue number")
            return

        reverse = options.get("reverse")

        # determine base/update column
        base_column = "current"
        update_column = "next"
        if reverse:
            base_column = "next"
            update_column = "current"

        # iterating over the files
        for file in list_files_with_prefix(issue_number):
            # open file
            df = pd.read_csv(f"{FILE_DIR}/{file}")
            df = df.rename(columns=lambda x: x.strip())

            parts = file.split("-")[1].split(".")
            form_id = int(parts[0])

            # update answers
            datapoint_ids = update_answers(
                df=df,
                form_id=form_id,
                model=Answers,
                base_column=base_column,
                update_column=update_column,
            )
            if datapoint_ids:
                # handle form data
                update_json_file(
                    datapoint_ids=datapoint_ids,
                    model=FormData,
                    form_id=form_id,
                )

            # update pending answers
            update_answers(
                df=df,
                form_id=form_id,
                model=PendingAnswers,
                base_column=base_column,
                update_column=update_column,
            )

            # update answers history
            update_answers(
                df=df,
                form_id=form_id,
                model=AnswerHistory,
                base_column=base_column,
                update_column=update_column,
            )
            # update pending answers history
            update_answers(
                df=df,
                form_id=form_id,
                model=PendingAnswerHistory,
                base_column=base_column,
                update_column=update_column,
            )
            print(f"[MIGRATION DONE]: {file}")
        # EOL iterating
        print("=== ALL MIGRATION DONE ===")
