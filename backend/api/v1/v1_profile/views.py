# Create your views here.
from drf_spectacular.utils import extend_schema, inline_serializer
from utils.default_serializers import DefaultResponseSerializer
from rest_framework.decorators import api_view
from rest_framework import serializers, status
from rest_framework.response import Response
from utils.email_helper import send_email, EmailTypes


@extend_schema(
    request=inline_serializer(
        'BatchUserComment',
        fields={
            'name': serializers.CharField(),
            'email': serializers.CharField(),
            'message': serializers.CharField(),
        }),
    responses={200: DefaultResponseSerializer},
    tags=['Feedback'],
    description='Send feedback',
    summary='Send feedback')
@api_view(['POST'])
def send_feedback(request, version):
    name = request.data.get('name')
    email = request.data.get('email')
    message = request.data.get('message')
    # TODO:: change email
    data = {
        'send_to': ["tech.consultancy@akvo.org"],
        'subject': 'Feedback from {0} <{1}>'.format(name, email),
        'body': 'This is feedback from {0} <{1}>. Message: {2}'.format(
            name, email, message)
    }
    send_email(context=data, type=EmailTypes.feedback)
    return Response({'message': 'Feedback was sent successfully.'},
                    status=status.HTTP_200_OK)
