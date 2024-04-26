import os
import pandas as pd

from django.core.management import BaseCommand
from django.utils import timezone
from django_q.tasks import async_task

from api.v1.v1_forms.constants import SubmissionTypes, QuestionTypes
from api.v1.v1_data.models import (
    Answers,
    PendingAnswers,
    AnswerHistory,
    PendingAnswerHistory,
)


FILE_DIR = "./source/value_changes"


def list_files_with_prefix(prefix):
    prefix = f"{prefix}-"
    all_files = os.listdir(FILE_DIR)
    matching_files = [file for file in all_files if prefix in file]
    return matching_files


def update_answers(
    datapoint_ids: list,
    df,
    form_id: int,
    model,
    base_column: str,
    update_column: str,
):
    for answer in model.objects.filter(
        question__form_id=form_id,
        question__type__in=[
            QuestionTypes.option,
            QuestionTypes.multiple_option,
        ],
    ):
        # search into df by answer options
        matches = df[
            df.apply(
                lambda row: any(
                    value in row[base_column] for value in answer.options
                ),
                axis=1,
            )
        ]
        new_options = matches[update_column].to_list()
        if not new_options:
            continue
        print(new_options, answer.options)
        # answer.options = new_options
        # answer.save()
        try:
            datapoint_ids.append(answer.data)
        except AttributeError:
            datapoint_ids.append(answer.pending_data)
    return datapoint_ids


class Command(BaseCommand):
    def add_arguments(self, parser):
        parser.add_argument("issue_number", nargs="?", type=int)
        parser.add_argument(
            "-r", "--reverse", nargs="?", default=False, type=bool
        )

    def handle(self, *args, **options):
        issue_number = options.get("issue_number")
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

            datapoint_ids = []

            # update answers
            update_answers(
                datapoint_ids=datapoint_ids,
                df=df,
                form_id=form_id,
                model=Answers,
                base_column=base_column,
                update_column=update_column,
            )

            # update answers history
            update_answers(
                datapoint_ids=datapoint_ids,
                df=df,
                form_id=form_id,
                model=AnswerHistory,
                base_column=base_column,
                update_column=update_column,
            )

            # update pending answers
            update_answers(
                datapoint_ids=datapoint_ids,
                df=df,
                form_id=form_id,
                model=PendingAnswers,
                base_column=base_column,
                update_column=update_column,
            )

            # update pending answers history
            update_answers(
                datapoint_ids=datapoint_ids,
                df=df,
                form_id=form_id,
                model=PendingAnswerHistory,
                base_column=base_column,
                update_column=update_column,
            )

            # handle datapoint
            if not datapoint_ids:
                return
