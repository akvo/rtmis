from django.http import Http404
from drf_spectacular.types import OpenApiTypes
from drf_spectacular.utils import (
    extend_schema,
    inline_serializer,
    OpenApiParameter,
)
from rest_framework import serializers, status
from rest_framework.decorators import api_view
from rest_framework.response import Response
from utils.custom_serializer_fields import validate_serializers_message
from utils.custom_pagination import Pagination

from api.v1.v1_categories.functions import get_category_results
from api.v1.v1_categories.models import DataCategory
from api.v1.v1_data.models import FormData, Answers
from api.v1.v1_categories.serializers import (
    ListRawDataSerializer,
    ListRawDataAnswerSerializer,
)

from api.v1.v1_data.serializers import ListFormDataRequestSerializer


@extend_schema(
    description="""
    Get datapoints with computed category
    """,
    responses={
        (200, "application/json"): inline_serializer(
            "ListDataCategorizedPaginated",
            fields={
                "current": serializers.IntegerField(),
                "total": serializers.IntegerField(),
                "total_page": serializers.IntegerField(),
                "data": inline_serializer(
                    "ListDataCategorized",
                    fields={
                        "id": serializers.IntegerField(),
                        "categories": inline_serializer(
                            "ListDataCategorySerializer",
                            fields={"Sanitation": serializers.CharField()},
                        ),
                    },
                ),
            },
            many=True,
        ),
    },
    parameters=[
        OpenApiParameter(
            name="page",
            required=True,
            type=OpenApiTypes.NUMBER,
            location=OpenApiParameter.QUERY,
        ),
    ],
    tags=["Data Categories"],
    summary="Get datapoints with computed category",
)
@api_view(["GET"])
def get_data_with_category(request, version, form_id):
    queryset = FormData.objects.filter(form_id=form_id).values_list(
        "pk", flat=True
    )
    if not len(queryset):
        raise Http404("DataCategory does not exist")
    paginator = Pagination()
    instance = paginator.paginate_queryset(queryset, request)
    categories = DataCategory.objects.filter(data_id__in=instance)
    results = get_category_results(categories)
    return paginator.get_paginated_response(results)


@extend_schema(
    description="""
    Get Multi-purpose schema of datapoints to use with third party applications
    """,
    responses={200: ListRawDataSerializer(many=True)},
    parameters=[
        OpenApiParameter(
            name="page",
            required=True,
            type=OpenApiTypes.NUMBER,
            location=OpenApiParameter.QUERY,
        ),
        OpenApiParameter(
            name="questions",
            required=False,
            type={"type": "array", "items": {"type": "number"}},
            location=OpenApiParameter.QUERY,
        ),
    ],
    tags=["Data Categories"],
    summary="Get Raw data points",
)
@api_view(["GET"])
# @permission_classes([IsAuthenticated])
def get_raw_data_point(request, version, form_id):
    serializer = ListFormDataRequestSerializer(data=request.GET)
    if not serializer.is_valid():
        return Response(
            {"message": validate_serializers_message(serializer.errors)},
            status=status.HTTP_400_BAD_REQUEST,
        )
    instances = FormData.objects.filter(form_id=form_id).order_by("-created")
    paginator = Pagination()
    page = paginator.paginate_queryset(instances, request)
    data = ListRawDataSerializer(
        instance=page,
        context={"questions": serializer.validated_data.get("questions")},
        many=True,
    ).data
    filter_data = {}
    if request.GET.get("questions"):
        filter_data["question_id__in"] = request.GET.getlist("questions")
    categories = DataCategory.objects.filter(
        form_id=form_id, data_id__in=[d["id"] for d in data]
    ).all()
    categories = get_category_results(categories)
    for d in data:
        category = list(filter(lambda x: x["id"] == d["id"], categories))
        filter_data["data_id"] = d["id"]
        answers = Answers.objects.filter(**filter_data).all()
        answers = ListRawDataAnswerSerializer(instance=answers, many=True).data
        data_answers = {}
        for a in answers:
            data_answers.update({a["question"]: a["value"]})
        if category:
            d.update(
                {"data": data_answers, "categories": category[0]["category"]}
            )
        else:
            d.update({"data": data_answers, "categories": {}})
    return paginator.get_paginated_response(data)
