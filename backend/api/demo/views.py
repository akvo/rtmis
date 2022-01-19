# Create your views here.
from django.contrib.auth import authenticate
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken

from api.demo.serializers import LoginSerializer


@api_view(['POST'])
def login(request):
    serializer = LoginSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(
            {'message': serializer.errors},
            status=status.HTTP_400_BAD_REQUEST
        )
    user = authenticate(username=serializer.validated_data['username'], password=serializer.validated_data['password'])
    if user:
        refresh = RefreshToken.for_user(user)
        return Response({'token': str(refresh.access_token)}, status=status.HTTP_200_OK)
    return Response({'message': 'Invalid login credentials'}, status=status.HTTP_401_UNAUTHORIZED)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def dashboard(request):
    return Response({'username': request.user.username, 'email': request.user.email}, status=status.HTTP_200_OK)


@api_view(['GET'])
def demo_test(request):
    return Response({'message': 'Connected'}, status=status.HTTP_200_OK)
