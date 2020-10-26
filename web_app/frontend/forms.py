from django import forms
from backend.models import User, Area, Group
from django.contrib.auth.forms import UserCreationForm


class PasswordResetRequestForm(forms.Form):
	"""
	Reset Password
	"""
	email_or_username = forms.CharField(label="Email Or Username", max_length=254)


class SignUpForm(UserCreationForm):
	name = forms.CharField(max_length=30)
	email = forms.EmailField(max_length=200)
	
	class Meta:
		model = User
		fields = ('name', 'email', 'password1', 'password2', )


class UpdateProfileForm(forms.ModelForm):
	
	class Meta:
		model = User
		fields = ['photo', 'email', 'bio', ]


class CreateGroupForm(forms.ModelForm):
	class Meta:
		model = Group
		fields = ['name', 'visibility', 'photo']


class AreasForm(forms.ModelForm):
	class Meta:
		model = Area
		fields = ['name', 'latitude', 'longitude', 'radius', ]
