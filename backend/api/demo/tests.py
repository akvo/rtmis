# Create your tests here.
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase


class CityTests(APITestCase):

    def test_list_city(self):
        url = reverse('list-country')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
