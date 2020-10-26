from django.db import models
from django.contrib.auth.models import PermissionsMixin, Group as DjangoBaseGroup
from django.contrib.auth.base_user import AbstractBaseUser
from django.utils.translation import ugettext_lazy as _
from django.utils import timezone
from .managers import UserManager
from enum import Enum
from tinymce import models as tinymce_models

class Location(models.Model):
	name = models.CharField(max_length=20)

	def __str__(self):
		return self.name


class Visibility(models.Model):

	class Names(models.TextChoices):
		Public = 'Public'
		Semi_Private = 'Semi-Private'
		Private = 'Private'

	name = models.CharField(choices=Names.choices, max_length=12)

	def __str__(self):
		return self.name


class User(AbstractBaseUser, PermissionsMixin):
	name = models.CharField(max_length=50, unique=True)
	email = models.EmailField(_('email address'))
	jwtToken = models.CharField(max_length=210, blank=True)
	photo = models.FileField(blank=True, upload_to="avatars/")
	bio = tinymce_models.HTMLField(blank=True)
	currentLocation = models.ForeignKey(Location, on_delete=models.CASCADE, blank=True, null=True)
	friendList = models.ManyToManyField('self', blank=True)
	#areaList = models.ManyToManyField(Area, blank=True)
	is_staff = models.BooleanField(default=False)
	is_active = models.BooleanField(default=True)
	date_joined = models.DateTimeField(default=timezone.now)
	last_connexion = models.DateTimeField(default=timezone.now)

	USERNAME_FIELD = 'name'
	REQUIRED_FIELDS = []

	objects = UserManager()

	def __str__(self):
		return self.name


class Group(DjangoBaseGroup):
	photo = models.FileField(blank=True)
	admin = models.ForeignKey(User, on_delete=models.CASCADE)
	visibility = models.ForeignKey(Visibility, on_delete=models.CASCADE)
	users = models.ManyToManyField(User, related_name='users', blank=True)

	USERNAME_FIELD = 'name'

	def __str__(self):
		return self.name


class Message(models.Model):
	"""
	Class used to store/sanitize/manage messages <-- JGO
	"""
	sender = models.ForeignKey(User, on_delete=models.CASCADE)
	receivers = models.ManyToManyField(Group, related_name='receivers', blank=True)
	latitude = models.FloatField()
	longitude = models.FloatField()
	radius = models.FloatField()
	content = tinymce_models.HTMLField(blank=False)
	visibility = models.ForeignKey(Visibility, on_delete=models.CASCADE)
	created_on = models.DateTimeField(auto_now_add=True)
	updated_on = models.DateTimeField(auto_now=True)
	duration = models.DurationField()

	def __str__(self):
		return self.content


class Area(models.Model):
	name = models.CharField(max_length=20)
	latitude = models.FloatField()
	longitude = models.FloatField()
	radius = models.FloatField()
	user = models.ForeignKey(User, on_delete=models.CASCADE)

	def __str__(self):
		return self.name
		

class Comment(models.Model):
	sender = models.ForeignKey(User, on_delete=models.CASCADE)
	msg = models.ForeignKey(Message, on_delete=models.CASCADE)
	content = models.TextField()
	created_on = models.DateTimeField(auto_now_add=True)
	updated_on = models.DateTimeField(auto_now=True)

	def __str__(self):
		return self.content


class ChatMessage(models.Model):
	sender = models.ForeignKey(User, related_name="sender", on_delete=models.CASCADE)
	recipient = models.ForeignKey(User, related_name="recipient", on_delete=models.CASCADE)
	content = models.TextField()
	created_on = models.DateTimeField(auto_now_add=True)

	def __str__(self):
		return self.content



