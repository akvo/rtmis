from django.urls import re_path

from api.v1.v1_data.views import DataAnswerDetailDeleteView, \
    get_map_data_point, get_chart_data_point, get_chart_administration, \
    approve_pending_data, get_chart_criteria, get_chart_overview, \
    export_form_data, list_pending_batch, list_pending_data_batch, \
    FormDataAddListView, PendingFormDataView, BatchView, \
    PendingDataDetailDeleteView, BatchSummaryView, BatchCommentView, \
    get_chart_overview_criteria
from api.v1.v1_users.views import health_check, get_config_file, email_template

urlpatterns = [
    re_path(r'^(?P<version>(v1))/form-data/(?P<form_id>[0-9]+)',
            FormDataAddListView.as_view()),
    re_path(r'^(?P<version>(v1))/data/(?P<data_id>[0-9]+)',
            DataAnswerDetailDeleteView.as_view()),

    re_path(r'^(?P<version>(v1))/form-pending-data/(?P<form_id>[0-9]+)',
            PendingFormDataView.as_view()),
    re_path(r'^(?P<version>(v1))/form-pending-batch',
            list_pending_batch),
    re_path(r'^(?P<version>(v1))/form-pending-data-batch/(?P<batch_id>[0-9]+)',
            list_pending_data_batch),
    re_path(r'^(?P<version>(v1))/pending-data/(?P<pending_data_id>[0-9]+)',
            PendingDataDetailDeleteView.as_view()),
    re_path(r'^(?P<version>(v1))/pending-data/approve',
            approve_pending_data),
    re_path(r'^(?P<version>(v1))/batch/comment/(?P<batch_id>[0-9]+)',
            BatchCommentView.as_view()),
    re_path(r'^(?P<version>(v1))/batch/summary/(?P<batch_id>[0-9]+)',
            BatchSummaryView.as_view()),
    re_path(r'^(?P<version>(v1))/batch', BatchView.as_view()),
    re_path(r'^(?P<version>(v1))/export/form/(?P<form_id>[0-9]+)',
            export_form_data),

    re_path(r'^(?P<version>(v1))/maps/(?P<form_id>[0-9]+)',
            get_map_data_point),
    re_path(r'^(?P<version>(v1))/chart/data/(?P<form_id>[0-9]+)',
            get_chart_data_point),
    re_path(r'^(?P<version>(v1))/chart/administration/(?P<form_id>[0-9]+)',
            get_chart_administration),
    re_path(r'^(?P<version>(v1))/chart/criteria/(?P<form_id>[0-9]+)',
            get_chart_criteria),
    re_path(r'^(?P<version>(v1))/chart/overview/(?P<form_id>[0-9]+)',
            get_chart_overview),
    re_path(r'^(?P<version>(v1))/chart/overview/criteria/(?P<form_id>[0-9]+)',
            get_chart_overview_criteria),

    re_path(r'^(?P<version>(v1))/health/check', health_check),
    re_path(r'^(?P<version>(v1))/config.js', get_config_file),
    re_path(r'^(?P<version>(v1))/email_template', email_template),

]
