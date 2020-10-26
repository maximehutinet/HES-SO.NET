from django.test import TestCase, Client
import requests
import json
from django.urls import reverse, resolve
from django.conf import settings

url_backend = settings.APP_API_URL


class LoginViewTest(TestCase):
    """
    Test Login page urls
    """
    client = Client()

    def test_login_page(self):
        found = resolve('/')
        self.assertEqual(found.url_name, 'login')
        #self.assertEqual(found.url_name, 'login')

    def test_login(self):
        response = self.client.get('/')
        self.assertEqual(response.status_code, 200)


class RegisterViewTest(TestCase):
    """
    Test Register page urls
    """
    client = Client()

    def test_login_page(self):
        found = resolve('/signup')
        self.assertEqual(found.url_name, 'signup')

    def test_login(self):
        response = self.client.get('/signup')
        self.assertEqual(response.status_code, 200)


class ForgotPassViewTest(TestCase):
    """
    Test Forgot Password
    """
    client = Client()

    def test_login_page(self):
        found = resolve('/reset_password')
        self.assertEqual(found.url_name, 'reset_password')
        #found = resolve('/forgot_pass')
        #self.assertEqual(found.url_name, 'forgot_password')

    def test_login(self):
        #response = self.client.get('/forgot_pass')
        response = self.client.get('/reset_password')
        self.assertEqual(response.status_code, 200)


class MainPageViewTest(TestCase):
    """
    Test MainPage
    """
    client = Client()

    def test_login_page(self):
        found = resolve('/main')
        self.assertEqual(found.url_name, 'index')

    def test_login(self):
        response = self.client.get('/main')
        self.assertEqual(response.status_code, 302)


class GroupTest():
    """
    Test Groups urls
    """
    client = Client()

    def test_add_remove_group_member(self):

        response = self.client.patch('/group/members/1', data={"users":1})
        self.assertEqual(response.status_code, 200)


class Message():
    def __init__(self, sender, receiver, latitude, longitude, radius, content, visibility, duration):
        self.sender = sender
        self.receiver = receiver
        self.latitude = latitude
        self.longitude = longitude
        self.radius = radius
        self.content = content
        self.visibility = visibility
        self.duration = duration


# class MessageTestCase(TestCase):
#     def setUp(self):
#         message = Message(sender="1", receiver="1", latitude="47.1", longitude="46.1", radius="5", content="cuicui", visibility="1", duration="5")

#     def testPOST(self):
#         URL = url_backend + "/message/create/"

#         response = requests.post(URL, data=message.__dict__)

#         response = response.json()

#         result = response["result"]

#         self.assertEqual(message.sender, result["sender"])
#         self.assertEqual(message.receiver, result["receiver"])
#         self.assertEqual(message.latitude, result["latitude"])
#         self.assertEqual(message.longitude, result["longitude"])
#         self.assertEqual(message.radius, result["radius"])
#         self.assertEqual(message.content, result["content"])
#         self.assertEqual(message.visibility, result["visibility"])
#         self.assertEqual(message.duration, result["duration"])
