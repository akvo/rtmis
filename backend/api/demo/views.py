# Create your views here.
from rest_framework import status
from rest_framework.decorators import api_view
from rest_framework.response import Response


@api_view(['GET'])
def test_api(request):
    return Response({'message': 'Congratulations!,you have established API connection'}, status=status.HTTP_200_OK)
