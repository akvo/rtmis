import re
import pandas as pd
from operator import or_
from functools import reduce
from django.core.cache import cache
from datetime import datetime
from django.db.models import Q, Count, Sum
from django.db import transaction, connection
from api.v1.v1_profile.functions import get_administration_ids_by_path
from api.v1.v1_data.models import ViewOptions, ViewDataOptions, Answers
from api.v1.v1_forms.models import QuestionOptions, QuestionTypes


@transaction.atomic
def refresh_materialized_data():
    with connection.cursor() as cursor:
        cursor.execute("""
            REFRESH MATERIALIZED VIEW view_data_options;
            REFRESH MATERIALIZED VIEW view_options;
            REFRESH MATERIALIZED VIEW view_jmp_criteria;
            REFRESH MATERIALIZED VIEW view_jmp_data;
            REFRESH MATERIALIZED VIEW view_jmp_count;
            """)


def get_cache(name):
    name = re.sub(r'[\W_]+', '_', name)
    today = datetime.now().strftime("%Y%m%d")
    cache_name = f"{today}-{name}"
    data = cache.get(cache_name)
    if data:
        return data
    return None


def create_cache(name, resp, timeout=None):
    name = re.sub(r'[\W_]+', '_', name)
    today = datetime.now().strftime("%Y%m%d")
    cache_name = f"{today}-{name}"
    cache.add(cache_name, resp, timeout=timeout)


def get_questions_options_from_params(params):
    question_ids = [
        o.get('question').id for p in params
        for o in p.get("options")]
    options = [
        b for p in params for o in p.get("options")
        for b in o.get('option')]
    return question_ids, options


def filter_by_criteria(params, question_ids, options,
                       administration_ids, filter,
                       is_map=False, data_ids=[]):
    result = []
    data_views = ViewOptions.objects.filter(
        question_id__in=question_ids,
        options__in=options,
        administration_id__in=administration_ids)
    if filter:
        data_views = data_views.filter(data_id__in=data_ids)
    data_views = data_views.values_list(
        'data_id', 'question_id', 'options')

    df = pd.DataFrame(
        list(data_views),
        columns=['data_id', 'question_id', 'options'])
    for param in params:
        filter_criteria = []
        for index, option in enumerate(param.get('options')):
            question = option.get('question').id
            opts = [o for o in option.get('option')]
            if df.shape[0]:
                filter_df = df[
                    (df['question_id'] == question) &
                    (df['options'].isin(opts))]
                if filter_criteria:
                    filter_df = filter_df[
                        (filter_df['data_id'].isin(filter_criteria))]
                if filter_criteria and index > 0:
                    # reset filter_criteria for next question
                    # start from second question criteria
                    # support and filter
                    filter_criteria = []
                if filter_df.shape[0]:
                    filter_df = filter_df[~filter_df['data_id'].isin(
                        filter_criteria)]
                    filter_criteria += list(
                        filter_df['data_id'].unique())
        if is_map:
            result.append(len(filter_criteria))
        if not is_map:
            result.append({
                "name": param.get('name'),
                "value": len(filter_criteria)})
    del df
    del question_ids
    del options
    return result


def get_advance_filter_data_ids(form_id, administration_id, options):
    data = ViewDataOptions.objects.filter(form_id=form_id)
    if administration_id:
        administration_ids = get_administration_ids_by_path(
            administration_id=administration_id)
        data = data.filter(administration_id__in=administration_ids)
    if options:
        data = data.filter(reduce(
            or_, [Q(options__contains=op) for op in options]))
    data = data.values_list('data_id', flat=True)
    return data


def transform_glass_answer(temp, questions, data_ids):
    for q in questions:
        value = None
        answers = Answers.objects.filter(
            question_id=q.id, data_id__in=data_ids)
        if q.type == QuestionTypes.option:
            options = QuestionOptions.objects.filter(
                question_id=q.id).values_list('name', flat=True)
            value = {opt: 0 for opt in options}
            answers = answers.values(
                'options').annotate(count=Count('options'))
            for a in answers:
                key = a.get('options')[0]
                prev = value.get(key)
                value[key] = prev + a.get('count')
        if q.type == QuestionTypes.number:
            value = 0
            answers = answers.values(
                'value').annotate(sum=Sum('value'))
            for a in answers:
                value += a.get('sum')
        temp.update({q.id: value})
    return temp
