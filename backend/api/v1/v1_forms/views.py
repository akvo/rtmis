# Create your views here.
from drf_spectacular.utils import extend_schema, inline_serializer
from rest_framework import status, serializers
from rest_framework.decorators import api_view, permission_classes
from rest_framework.generics import get_object_or_404
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from api.v1.v1_forms.models import Forms
from api.v1.v1_forms.serializers import ListFormSerializer, \
    FormDetailSerializer, SubmitFormSerializer
from utils.custom_serializer_fields import validate_serializers_message


@extend_schema(responses={200: ListFormSerializer(many=True)},
               tags=['Form'])
@api_view(['GET'])
def list_form(request, version):
    return Response(
        ListFormSerializer(instance=Forms.objects.all(), many=True).data,
        status=status.HTTP_200_OK)


@extend_schema(responses={200: FormDetailSerializer},
               tags=['Form'])
@api_view(['GET'])
def form_details(request, version, pk):
    instance = get_object_or_404(Forms, pk=pk)
    return Response(FormDetailSerializer(instance=instance).data,
                    status=status.HTTP_200_OK)


@extend_schema(request=SubmitFormSerializer,
               responses={
                   (200, 'application/json'):
                       inline_serializer("FormSubmit", fields={
                           "message": serializers.CharField()
                       })
               },
               tags=['Form'])
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def submit_form(request, version, pk):
    form = get_object_or_404(Forms, pk=pk)
    try:
        serializer = SubmitFormSerializer(data=request.data,
                                          context={'user': request.user,
                                                   'form': form})
        if not serializer.is_valid():
            return Response(
                {'message': validate_serializers_message(serializer.errors)},
                status=status.HTTP_400_BAD_REQUEST
            )

        serializer.save()
        return Response({'message': 'ok'}, status=status.HTTP_200_OK)
    except Exception as ex:
        return Response({'message': ex.args},
                        status=status.HTTP_500_INTERNAL_SERVER_ERROR)
