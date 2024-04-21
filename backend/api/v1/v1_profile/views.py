# Create your views here.
import os
from typing import cast
from wsgiref.util import FileWrapper
from django.contrib.admin.sites import site
from django.core.handlers.wsgi import WSGIRequest
from django.db.models import ProtectedError, Q
from django.contrib.admin.utils import get_deleted_objects
from django.http.response import HttpResponse
from drf_spectacular.types import OpenApiTypes
from drf_spectacular.utils import (
    OpenApiParameter,
    extend_schema,
    inline_serializer,
)
from rest_framework.request import Request
from rest_framework.viewsets import ModelViewSet
from api.v1.v1_profile.models import (
    Administration,
    AdministrationAttribute,
    Entity,
    EntityData,
    Levels,
)
from api.v1.v1_profile.serializers import (
    AdministrationAttributeSerializer,
    AdministrationSerializer,
    EntityDataSerializer,
    EntitySerializer,
    DownloadAdministrationRequestSerializer,
    DownloadEntityDataRequestSerializer,
)
from api.v1.v1_profile.job import create_download_job
from api.v1.v1_users.models import SystemUser
from api.v1.v1_jobs.constants import JobTypes
from utils.upload_administration import generate_excel
from utils.custom_helper import clean_array_param, maybe_int
from utils.default_serializers import DefaultResponseSerializer
from utils.custom_pagination import Pagination
from rest_framework.decorators import api_view, permission_classes
from rest_framework import serializers, status
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from utils.email_helper import send_email, EmailTypes
from utils.custom_serializer_fields import validate_serializers_message
from utils.custom_generator import administration_csv_delete


@extend_schema(
    request=inline_serializer(
        "BatchUserComment",
        fields={
            "name": serializers.CharField(),
            "email": serializers.CharField(),
            "message": serializers.CharField(),
        },
    ),
    responses={200: DefaultResponseSerializer},
    tags=["Feedback"],
    description="Send feedback",
    summary="Send feedback",
)
@api_view(["POST"])
def send_feedback(request, version):
    name = request.data.get("name")
    email = request.data.get("email")
    message = request.data.get("message")
    # TODO:: change email
    data = {
        "send_to": ["tech.consultancy@akvo.org"],
        "subject": "Feedback from {0} <{1}>".format(name, email),
        "body": "This is feedback from {0} <{1}>. Message: {2}".format(
            name, email, message
        ),
    }
    send_email(context=data, type=EmailTypes.feedback)
    return Response(
        {"message": "Feedback was sent successfully."},
        status=status.HTTP_200_OK,
    )


@extend_schema(tags=["Administration"])
class AdministrationViewSet(ModelViewSet):
    serializer_class = AdministrationSerializer
    permission_classes = [IsAuthenticated]
    pagination_class = Pagination

    def get_queryset(self):
        queryset = Administration.objects.prefetch_related(
            "parent_administration", "attributes"
        ).all()
        search = self.request.query_params.get("search")
        parent_id = self.request.query_params.get("parent")
        level_id = self.request.query_params.get("level")
        if search:
            queryset = queryset.filter(
                Q(name__icontains=search) | Q(code__icontains=search)
            )
        if parent_id:
            try:
                parent = Administration.objects.get(id=parent_id)
                queryset = queryset.filter(
                    path__startswith=f"{parent.path or ''}{parent.id}."
                )
            except Administration.DoesNotExist:
                pass
        if level_id:
            try:
                level = Levels.objects.get(id=level_id)
                queryset = queryset.filter(level=level)
            except Levels.DoesNotExist:
                pass
        return queryset.order_by("id")

    def get_serializer(self, *args, **kwargs):
        if self.action == "list":
            kwargs.update({"compact": True})
        return super().get_serializer(*args, **kwargs)

    @extend_schema(
        parameters=[
            OpenApiParameter(
                name="parent",
                type=OpenApiTypes.NUMBER,
                location=OpenApiParameter.QUERY,
            ),
            OpenApiParameter(
                name="level",
                type=OpenApiTypes.NUMBER,
                location=OpenApiParameter.QUERY,
            ),
            OpenApiParameter(
                name="search",
                type=OpenApiTypes.STR,
                location=OpenApiParameter.QUERY,
            ),
        ]
    )
    def list(self, request, *args, **kwargs):
        return super().list(request, *args, **kwargs)

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        try:
            TESTING = os.environ.get("TESTING")
            administration_csv_delete(id=instance.pk, test=TESTING)
            instance.delete()
        except ProtectedError:
            _, _, _, protected = get_deleted_objects(
                [instance], cast(WSGIRequest, request), site
            )
            error = (
                f'Cannot delete "Administration: {instance}" because it is '
                "referenced by other data"
            )
            return Response(
                {"error": error, "referenced_by": protected},
                status=status.HTTP_409_CONFLICT,
            )
        return Response(status=status.HTTP_204_NO_CONTENT)


@extend_schema(tags=["Administration"])
class AdministrationAttributeViewSet(ModelViewSet):
    queryset = AdministrationAttribute.objects.order_by("id").all()
    serializer_class = AdministrationAttributeSerializer
    permission_classes = [IsAuthenticated]
    pagination_class = None


@extend_schema(tags=["Entities"])
class EntityViewSet(ModelViewSet):
    serializer_class = EntitySerializer
    permission_classes = [IsAuthenticated]
    pagination_class = Pagination

    def get_queryset(self):
        queryset = Entity.objects.all()
        search = self.request.query_params.get("search")
        if search:
            queryset = queryset.filter(name__icontains=search)
        return queryset.order_by("id")


@extend_schema(tags=["Entities"])
class EntityDataViewSet(ModelViewSet):
    serializer_class = EntityDataSerializer
    permission_classes = [IsAuthenticated]
    pagination_class = Pagination

    def get_queryset(self):
        queryset = EntityData.objects.select_related(
            "administration", "entity"
        ).all()
        search = self.request.query_params.get("search")
        adm_id = self.request.query_params.get("administration")
        entity_id = self.request.query_params.get("entity")
        if search:
            queryset = queryset.filter(
                Q(name__icontains=search) | Q(code__icontains=search)
            )
        if adm_id:
            try:
                adm_root = Administration.objects.get(id=adm_id)
                adms = Administration.objects.filter(
                    Q(path__startswith=f"{adm_root.path or ''}{adm_root.id}.")
                    | Q(id=adm_root.id)
                )
                queryset = queryset.filter(administration__in=adms)
            except Administration.DoesNotExist:
                pass
        if entity_id:
            try:
                entities = [int(e) for e in entity_id.split(",")]
                queryset = queryset.filter(entity__in=entities)
            except Entity.DoesNotExist:
                pass

        return queryset.order_by("id")

    @extend_schema(
        parameters=[
            OpenApiParameter(
                name="administration",
                type=OpenApiTypes.NUMBER,
                location=OpenApiParameter.QUERY,
            ),
            OpenApiParameter(
                name="entity",
                type=OpenApiTypes.STR,
                location=OpenApiParameter.QUERY,
            ),
            OpenApiParameter(
                name="search",
                type=OpenApiTypes.STR,
                location=OpenApiParameter.QUERY,
            ),
        ]
    )
    def list(self, request, *args, **kwargs):
        return super().list(request, *args, **kwargs)


@extend_schema(
    tags=["File"],
    summary="Export template for Administration bulk upload",
    parameters=[
        OpenApiParameter(
            name="attributes",
            type={"type": "array", "items": {"type": "number"}},
            location=OpenApiParameter.QUERY,
            explode=False,
        )
    ],
)
@api_view(["GET"])
@permission_classes([IsAuthenticated])
def export_administrations_template(request: Request, version):
    attributes = clean_array_param(
        request.query_params.get("attributes", ""), maybe_int
    )
    filepath = generate_excel(cast(SystemUser, request.user), attributes)
    filename = filepath.split("/")[-1].replace(" ", "-")
    with open(filepath, "rb") as template_file:
        response = HttpResponse(
            FileWrapper(template_file),
            content_type=(
                "application/vnd.openxmlformats-officedocument"
                ".spreadsheetml.sheet"
            ),
        )
        response["Content-Disposition"] = f'attachment; filename="{filename}"'
        return response


@extend_schema(
    tags=["File"],
    summary=("Export prefilled template for Administration bulk upload"),
    parameters=[
        OpenApiParameter(
            name="attributes",
            type={"type": "array", "items": {"type": "number"}},
            location=OpenApiParameter.QUERY,
            explode=False,
        ),
        OpenApiParameter(
            name="level",
            required=False,
            type=OpenApiTypes.NUMBER,
            location=OpenApiParameter.QUERY,
        ),
    ],
)
@api_view(["GET"])
@permission_classes([IsAuthenticated])
def export_prefilled_administrations_template(request: Request, version):
    serializer = DownloadAdministrationRequestSerializer(data=request.GET)
    if not serializer.is_valid():
        return Response(
            {"message": validate_serializers_message(serializer.errors)},
            status=status.HTTP_400_BAD_REQUEST,
        )
    attributes = clean_array_param(
        request.query_params.get("attributes", ""), maybe_int
    )
    administration = request.query_params.get("administration")
    job = create_download_job(
        adm_id=administration,
        user_id=request.user.id,
        job_type=JobTypes.download_administration,
        job_info={"administration": administration, "attributes": attributes},
    )
    file_url = f"/download/file/{job.result}?type=download_administration"
    data = {
        "task_id": job.task_id,
        "file_url": file_url,
    }
    return Response(data, status=status.HTTP_200_OK)


@extend_schema(
    tags=["File"],
    summary="Export entity data",
    parameters=[
        OpenApiParameter(
            name="entity_ids",
            required=False,
            type={"entity_ids": "array", "items": {"type": "number"}},
            location=OpenApiParameter.QUERY,
            explode=False,
        ),
        OpenApiParameter(
            name="adm_id",
            required=False,
            type=OpenApiTypes.NUMBER,
            location=OpenApiParameter.QUERY,
        ),
    ],
)
@api_view(["GET"])
@permission_classes([IsAuthenticated])
def export_entity_data(request: Request, version):
    serializer = DownloadEntityDataRequestSerializer(data=request.GET)
    if not serializer.is_valid():
        return Response(
            {"message": validate_serializers_message(serializer.errors)},
            status=status.HTTP_400_BAD_REQUEST,
        )
    entity_ids = clean_array_param(
        request.query_params.get("entity_ids", ""), maybe_int
    )
    adm_id = request.query_params.get("adm_id")
    entities = Entity.objects.filter(pk__in=entity_ids).values("id", "name")
    entities = [e for e in entities]
    job = create_download_job(
        adm_id=adm_id,
        user_id=request.user.id,
        job_type=JobTypes.download_entities,
        job_info={"administration": adm_id, "entities": entities},
    )
    file_url = f"/download/file/{job.result}?type=download_entities"
    data = {
        "task_id": job.task_id,
        "file_url": file_url,
    }
    return Response(data, status=status.HTTP_200_OK)
