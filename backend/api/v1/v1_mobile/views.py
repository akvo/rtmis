from rest_framework import generics
from .models import MobileFormAssignment
from .serializers import MobileFormAssignmentSerializer


class MobileFormAssignmentListCreateView(generics.ListCreateAPIView):
    queryset = MobileFormAssignment.objects.all()
    serializer_class = MobileFormAssignmentSerializer


class MobileFormAssignmentRetrieveUpdateDestroyView(generics.RetrieveUpdateDestroyAPIView):
    queryset = MobileFormAssignment.objects.all()
    serializer_class = MobileFormAssignmentSerializer
