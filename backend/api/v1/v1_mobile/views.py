from drf_spectacular.utils import extend_schema
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from .serializers import MobileFormAssignmentSerializer
from .models import MobileFormAssignment


@extend_schema(responses={200: MobileFormAssignmentSerializer(many=True)},
               tags=['Mobile Form'],
               summary='To get list of form assignment',
               description='To get list of form assignment')
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_mobile_form_assignment(request, version):
    """To get list of form assignment."""
    queryset = MobileFormAssignment.objects.filter(
        user=request.user
    ).order_by('-id')
    if not queryset.exists():
        return Response(
            {'message': 'No form assignment found.'},
            status=status.HTTP_400_BAD_REQUEST)
    serializer = MobileFormAssignmentSerializer(queryset, many=True)
    return Response(serializer.data)
