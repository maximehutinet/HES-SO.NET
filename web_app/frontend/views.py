import datetime
import requests
import json

from django.conf import settings

from django.shortcuts import render, HttpResponse, HttpResponseRedirect, reverse, redirect
from django.http import JsonResponse
from django.contrib.auth import authenticate, update_session_auth_hash, login, logout
from django.contrib.auth.decorators import login_required
from django.contrib.auth.forms import PasswordChangeForm
from backend.models import User, Group
from django.contrib.auth.tokens import default_token_generator
from django.template import RequestContext
from django.utils.encoding import force_bytes
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from django.template import loader
from django.core.validators import validate_email
from django.core.exceptions import ValidationError
from django.core import serializers
from django.core.mail import send_mail
from django.views.generic import *
from django.contrib import messages
from django.db.models.query_utils import Q
from django.http.response import HttpResponseForbidden

from backend.api.views import *
from .forms import PasswordResetRequestForm, SignUpForm, UpdateProfileForm, AreasForm, CreateGroupForm

backend = settings.APP_API_URL


class LoginView(TemplateView):
    """
    Login View view used to display the login page.
    """
    template_name = "auth/login.html"

    def post(self, request, **kwargs):
        username = request.POST.get('username', False)
        password = request.POST.get('password', False)
        user = authenticate(username=username, password=password)
        if user is not None and user.is_active:
            login(request, user)
            return HttpResponseRedirect(settings.LOGIN_REDIRECT_URL)
    
        return render(request, self.template_name)


class LogoutView(TemplateView):
    """
    Logout
    """
    template_name = 'auth/login.html'
    
    def get(self, request, **kwargs):

        logout(request)
        return render(request, self.template_name)


def refresh_token(request):
    """
    refresh an access token from refresh token
    :param request:
    :return:
    """
    URL = backend+'token/refresh/'

    try:
        response = requests.post(URL, headers=request.headers, data=request.POST, allow_redirects=True)
        response.raise_for_status()
        return HttpResponse(json.dumps(response.json()), content_type='application/json')
    except requests.exceptions.HTTPError as err:
        status = err.response.status_code
        reason = err.response.reason
        return HttpResponse(reason, status=status)




# used to refresh token -> seems uselesss
""" def refresh_token(request):
     token = request.POST['refresh']
     data = {"refresh": request.POST['refresh']}
     response = requests.post(backend+'token/refresh/', data=data, allow_redirects=True)
     return HttpResponse(json.dumps(response.json()), content_type='application/json') """


class RegisterView(FormView):
    """
    Register View view used to display the register page..
    """
    template_name = "auth/signup.html"
    form_class = SignUpForm

    def get(self, request, *args, **kwargs):
        return super(RegisterView, self).get(request, *args, **kwargs)

    def get_context_data(self, **kwargs):
        context = super(RegisterView, self).get_context_data(**kwargs)
        now = datetime.datetime.now()
        context['copy_year'] = now.year
        return context

    def form_valid(self, form):
        form.save()
        username = form.cleaned_data.get('name')
        password = form.cleaned_data.get('password1')
        user = authenticate(username=username, password=password)
        login(self.request, user)
        return redirect('/main')
    
    def form_invalid(self, form):
        form = SignUpForm()
        return render(self.request, 'auth/signup.html', {'form': form})


class ResetPasswordRequestView(FormView):
    template_name = "auth/forgot.html"    #code for template is given below the view's code
    success_url = '/'
    form_class = PasswordResetRequestForm

    @staticmethod
    def validate_email_address(email):
        """
        This method here validates the if the input is an email address or not.
        Its return type is boolean, True if the input is a email address or False if its not.
        :param email:
        :return:
        """
        try:
            validate_email(email)
            return True
        except ValidationError:
            return False

    def post(self, request, *args, **kwargs):
        """
        A normal post request which takes input from field "email_or_username" (in ResetPasswordRequestForm).
        :param request:
        :param args:
        :param kwargs:
        :return:
        """
        form = self.form_class(request.POST)
        if form.is_valid():
            data = form.cleaned_data["email_or_username"]
        if self.validate_email_address(data) is True:
            """
            If the input is an valid email address, then the following code will lookup for users associated
            with that email address.
            If found then an email will be sent to the address, else an error message will be printed on the screen.
            """
            associated_users = User.objects.filter(Q(email=data) | Q(name=data))
            if associated_users.exists():
                for user in associated_users:
                        c = {
                            'email': user.email,
                            'domain': request.META['HTTP_HOST'],
                            'site_name': 'Django - Website',
                            'uid': urlsafe_base64_encode(force_bytes(user.pk)),
                            'user': user,
                            'token': default_token_generator.make_token(user),
                            'protocol': 'http',
                            }
                        subject_template_name = 'auth/email/password_reset_subject.txt'
                        # copied from django/contrib/admin/templates/registration/password_reset_subject.txt to
                        # templates directory
                        email_template_name = 'auth/email/password_reset.html'
                        # copied from django/contrib/admin/templates/registration/password_reset_email.html to templates
                        # directory
                        subject = loader.render_to_string(subject_template_name, c)
                        # Email subject *must not* contain newlines
                        subject = ''.join(subject.splitlines())
                        email = loader.render_to_string(email_template_name, c)
                        send_mail(subject, email, settings.EFAULT_FROM_EMAIL, [user.email], fail_silently=False)
                result = self.form_valid(form)
                messages.success(request, "An email has been sent to " + data + ". Please check its inbox to continue reseting password.")
                return result
            result = self.form_invalid(form)
            messages.error(request, 'No user is associated with this email address')
            return result
        else:
            """
            If the input is an username, then the following code will lookup for users associated with that user.
            If found then an email will be sent to the user's address, else an error message will
            be printed on the screen.
            """
            associated_users = User.objects.filter(name=data)
            if associated_users.exists():
                for user in associated_users:
                    c = {
                        'email': user.email,
                        'domain': 'jgo.sh', #or your domain
                        'site_name': 'Django',
                        'uid': urlsafe_base64_encode(force_bytes(user.pk)),
                        'user': user,
                        'token': default_token_generator.make_token(user),
                        'protocol': 'http',
                        }
                    subject_template_name = 'auth/email/password_reset_subject.txt'
                    email_template_name = 'auth/email/password_reset.html'
                    subject = loader.render_to_string(subject_template_name, c)
                    # Email subject *must not* contain newlines
                    subject = ''.join(subject.splitlines())
                    email = loader.render_to_string(email_template_name, c)
                    send_mail(subject, email, settings.DEFAULT_FROM_EMAIL, [user.email], fail_silently=False)
                result = self.form_valid(form)
                messages.success(request, "Email has been sent to " + data + "'s email address. Please check its inbox to continue reseting password.")
                return result
            result = self.form_invalid(form)
            messages.error(request, 'This username does not exist in the system.')
            return result
        messages.error(request, 'Invalid Input')
        return self.form_invalid(form)


class MainPageView(FormView, TemplateView):
    """
    View used to display the main page
    """
    template_name = "main/main.html"
    form_class = UpdateProfileForm
    
    profile_change_pass_form = PasswordChangeForm
    profile_update_form = UpdateProfileForm
    area_update_form = AreasForm
    group_create_from = CreateGroupForm
    
    def form_valid(self, form):
        print("valid form")
        input_file = form.cleaned_data['input_file']
        form.delete_temporary_files()
        if self.request.method == "POST":
            form = PasswordChangeForm(data=self.request.POST, user=self.request.user)
            print(self.request.POST)
            print(form)
            form.save()
            return JsonResponse({"success": True}, status=200)
        
        return super(MainPageView, self).form_valid(form)
    
    def form_invalid(self, form):
        print("invalid form")
        return super(MainPageView, self).form_invalid(form)
    
    def get(self, request, *args, **kwargs):
        if not request.user.is_authenticated:
            return HttpResponseRedirect('/')
        else:
            return super(MainPageView, self).get(request, *args, **kwargs)
    
    def get_context_data(self, **kwargs):
        context = super(MainPageView, self).get_context_data(**kwargs)
        # Get forms
        profile_update_form = self.profile_update_form(data=self.request.POST or None, files=self.request.FILES, instance=self.request.user)
        profile_reset_password = self.profile_change_pass_form(self.request.user, self.request.POST or None)
        area_update = self.area_update_form(self.request.POST or None)
        group_create = self.group_create_from(self.request.POST or None, files=self.request.FILES)
        
        # Set context to templates
        now = datetime.datetime.now()
        context['copy_year'] = now.year
        context['current_user'] = self.request.user
        
        context['update_form'] = profile_update_form
        context['changepass_form'] = profile_reset_password
        context['update_area_form'] = area_update
        context['add_group_from'] = group_create
        return context
    

@login_required()
def update_profile(request):
    """
    Update profile form used to update the profile
    :param request:
    :return: Json response
    """
    if request.method == "POST":
        form = UpdateProfileForm(request.POST, request.FILES, instance=request.user)
        print(form)
        print(request.FILES)
        if form.is_valid():
            update = form.save(commit=False)
            update.user = request.user
            update.save()
            return JsonResponse({"success": True}, status=200)
    return JsonResponse({"success": False}, status=400)


@login_required()
def change_password(request):
    """
    method used to change password (password form)
    :param request:
    :return:
    """
    if request.method == "POST":
        form = PasswordChangeForm(data=request.POST, user=request.user)
        if form.is_valid():
            form.save()
            return JsonResponse({"success": True}, status=200)

    return JsonResponse({"success": False}, status=400)


# used to create message in backend
""" def sendMessage(request):
    #user =
    group = request.POST['group']
    area = request.POST['area']
    radius = request.POST['radius']
    content = request.POST['content']
    visibility = request.POST['visibility']

    return render(request, "home.html") """


@login_required()
def create_area(request):
    """
    method used to create a new area
    :param request:
    :return:
    """
    # Si c'est un call POST on procède a un changement
    if request.method == "POST":
        print("-------------------------------------------------")
        print( request.body )
        form = AreasForm(request.POST)
        if form.is_valid():
            print("ISSSVALLLID")
            update = form.save(commit=False)
            update.user = request.user
            update.save()
            return JsonResponse({"success": True}, status=200)
    return JsonResponse({"success": False}, status=400)

# Users ----------------------------------------------------------------------------------------------------------------
@login_required
def get_users(request):
    """
    get_user
    :param request:
    :return:
    """
    URL = backend+'user/list/'

    try:
        #response = requests.get(URL, headers=request.headers, allow_redirects=True)
        response = ListUsers.as_view()(request=request).data
        return HttpResponse(json.dumps(response), content_type='application/json')
    except requests.exceptions.HTTPError as err:
        status = err.response.status_code
        reason = err.response.reason
        return HttpResponse(reason, status=status)


@login_required
def get_unknow_users_from_user(request, **kwargs):
    """
    get unknow users to u user
    :param request:
    :return:
    """
    #URL = backend+'user/list/unknow/' + str(kwargs["user_pk"]) + "/"
    
    try:
        #response = requests.get(URL, headers=request.headers, allow_redirects=True)
        response = ListUnknowUsersFromUser.as_view()(request=request, **kwargs).data
        #response.raise_for_status()
        return HttpResponse(json.dumps(response), content_type='application/json')
    except requests.exceptions.HTTPError as err:
        status = err.response.status_code
        reason = err.response.reason
        return HttpResponse(reason, status=status)


@login_required
def get_unknow_users_from_group(request, **kwargs):
    """
    get unknow users to u user
    :param request:
    :return:
    """
    #URL = backend+'group/list/unknow_users/' + str(kwargs["group_pk"]) + "/"
    try:
        response = ListUnknowUsersFromGroup.as_view()(request=request, **kwargs).data
        #response = requests.get(URL, headers=request.headers, allow_redirects=True)
        #response.raise_for_status()
        return HttpResponse(json.dumps(response), content_type='application/json')
    except requests.exceptions.HTTPError as err:
        status = err.response.status_code
        reason = err.response.reason
        return HttpResponse(reason, status=status)


@login_required
def list_areas_of_user(request, **kwargs):
    """
    list area of a user
    :param request:
    :return:
    """

    try:
        response = ListAreasFromUser.as_view()(request=request, **kwargs).data
        return HttpResponse(json.dumps(response), content_type='application/json')
    except requests.exceptions.HTTPError as err:
        status = err.response.status_code
        reason = err.response.reason
        return HttpResponse(reason, status=status) 


@login_required
def get_current_user(request):
    """
    get current user
    :param request:
    :return:
    """

    try:
        response = CurrentUserView.as_view()(request=request).data
        print("Get Current user:", response)
        return HttpResponse(json.dumps(response), content_type='application/json')
    
    except requests.exceptions.HTTPError as err:
        status = err.response.status_code
        reason = err.response.reason
        return HttpResponse(reason, status=status)


@login_required
def manage_user(request, **kwargs):
    """
    Get a specific message
    :param request:
    :return:
    """
    try:
        response = ManageUser.as_view()(request=request, **kwargs).data
        return HttpResponse(json.dumps(response), content_type='application/json')
    except requests.exceptions.HTTPError as err:
        status = err.response.status_code
        reason = err.response.reason
        return HttpResponse(reason, status=status)


# Groups ---------------------------------------------------------------------------------------------------------------
@login_required
def get_groups(request):
    """
    Get groups by user
    :param request:
    :return:
    """
    try:
        #data = list(backend.models.Group.objects.all())
        #qs_json = serializers.serialize('json', data)


        response = ListGroups.as_view()(request=request).data
        return HttpResponse(json.dumps(response), content_type='application/json')
        #return HttpResponse(qs_json, content_type='application/json')
    except requests.exceptions.HTTPError as err:
        status = err.response.status_code
        reason = err.response.reason
        return HttpResponse(reason, status=status)


@login_required
def get_public_groups(request):
    """
    Get groups by user
    :param request:
    :return:
    """
    URL = backend + 'group/list/public'
    try:
        response = ListPublicGroups.as_view()(request=request).data
        #response = requests.get(URL, headers=request.headers, allow_redirects=True)
        #response.raise_for_status()
        return HttpResponse(json.dumps(response), content_type='application/json')
    except requests.exceptions.HTTPError as err:
        status = err.response.status_code
        reason = err.response.reason
        return HttpResponse(reason, status=status)


@login_required
def get_groups_belong_to_user(request, **kwargs):
    """
    Get groups of a specific user
    :param request:
    :return:
    """

    try:
        response = ListGroupsFromUser.as_view()(request=request, **kwargs).data
        print("get_groups_belong_to_user:", response)
        return HttpResponse(json.dumps(response), content_type='application/json')
    except requests.exceptions.HTTPError as err:
        status = err.response.status_code
        reason = err.response.reason
        return HttpResponse(reason, status=status)


@login_required
def manage_group(request, **kwargs):
    """
    Get a specific group
    :param request:
    :return:
    """
    try:
        response = ManageGroup.as_view()(request=request, **kwargs).data
        return HttpResponse(json.dumps(response), content_type='application/json')
    except requests.exceptions.HTTPError as err:
        status = err.response.status_code
        reason = err.response.reason
        return HttpResponse(reason, status=status)

    # URL = backend + 'group/' + str(kwargs["pk"]) + "/"

    # try:
    #     if request.method == 'GET':
    #         response = ManageGroup.as_view()(request=request, **kwargs).data
    #         #response = requests.get(URL, headers=request.headers, allow_redirects=True)
    #     if request.method == 'POST':
    #         response = requests.patch(URL, headers=request.headers, data=request.POST, allow_redirects=True)
    #     if request.method == 'DELETE':
    #         response = requests.delete(URL, headers=request.headers, data=request.POST, allow_redirects=True)
    #     #response.raise_for_status()
    #     return HttpResponse(json.dumps(response), content_type='application/json')
    # except requests.exceptions.HTTPError as err:
    #     status = err.response.status_code
    #     reason = err.response.reason
    #     return HttpResponse(reason, status=status)

""" def add_remove_group_member(request, **kwargs):
    Add or remove a user from a group
    :param request:
    :return:
    URL = backend + 'group/' + str(kwargs["group_pk"]) + "/" + str(kwargs["user_pk"])
    try:
        response = requests.get(URL, headers=request.headers, allow_redirects=True)
        response.raise_for_status()
        return HttpResponse(json.dumps(response.json()), content_type='application/json')
    except requests.exceptions.HTTPError as err:
        status = err.response.status_code
        reason = err.response.reason
        return HttpResponse(reason, status=status) """


@login_required
def add_remove_group_member(request, **kwargs):
    """
    Add or remove a user from a group
    :param request:
    :return:
    """
    #URL = backend + 'group/members/' + str(kwargs["group_pk"]) + "/"

    try:
        if request.method == 'PATCH':
            response = RemoveGroupMembers.as_view()(request=request, **kwargs).data
            return HttpResponse(json.dumps(response), content_type='application/json')
    except requests.exceptions.HTTPError as err:
        status = err.response.status_code
        reason = err.response.reason
        return HttpResponse(reason, status=status)


@login_required
def add_group_member(request, **kwargs):
    """
    Add or remove a user from a group
    :param request:
    :return:
    """
    #URL = backend + 'group/members/' + str(kwargs["group_pk"]) + "/"

    try:
        response = AddGroupMembers.as_view()(request=request, **kwargs).data
        return HttpResponse(json.dumps(response), content_type='application/json')
    except requests.exceptions.HTTPError as err:
        status = err.response.status_code
        reason = err.response.reason
        return HttpResponse(reason, status=status)


@login_required
def get_users_belong_to_group(request, **kwargs):
    """
    Get list of users belonging to a specific group
    :param request:
    :return:
    """
    try:
        response = ListUsersFromGroup.as_view()(request=request, **kwargs).data
        print("get_users_belong_to_group:", response)
        return HttpResponse(json.dumps(response), content_type='application/json')
    except requests.exceptions.HTTPError as err:
        status = err.response.status_code
        reason = err.response.reason
        return HttpResponse(reason, status=status)


@login_required
def get_messages_belong_to_group(request, **kwargs):
    """
    Get list of messages belonging to a specific group
    :param request:
    :return:
    """
    try:
        response = ListMessagesFromGroup.as_view()(request=request, **kwargs).data
        print("get_messages_belong_to_group:", response)
        return HttpResponse(json.dumps(response), content_type='application/json')
    except requests.exceptions.HTTPError as err:
        status = err.response.status_code
        reason = err.response.reason
        return HttpResponse(reason, status=status)


@login_required
def create_group(request, **kwargs):
    """
    Create a group
    :param request
    """
    try:
        response = CreateGroup.as_view()(request=request, **kwargs).data
        print("CREATE GROUP:", response)
        return HttpResponse(json.dumps(response), content_type='application/json')
    except requests.exceptions.HTTPError as err:
        status = err.response.status_code
        reason = err.response.reason
        return HttpResponse(reason, status=status)


@login_required()
def create_group_bis(request):
    """
    Update profile form used to update the profile
    :param request:
    :return: Json response
    """
    if request.method == "POST":
        form = CreateGroupForm(request.POST, request.FILES)
        if form.is_valid():
            update = form.save(commit=False)
            user = User.objects.filter(id=request.user.id)
            update.admin_id = request.user.id
            form.save()
            update.users.set(user)
            update.save()
            return JsonResponse({"success": True}, status=200)
    return JsonResponse({"success": False}, status=400)


@login_required
def ask_join_group(request, **kwargs):
    """
    Ask join group
    :param request
    """
    try:
        response = AskJoinGroup.as_view()(request=request, **kwargs).data
        return HttpResponse(json.dumps(response), content_type='application/json')
    except requests.exceptions.HTTPError as err:
        status = err.response.status_code
        reason = err.response.reason
        return HttpResponse(reason, status=status)


@login_required
def invit_in_group(request, **kwargs):
    """
    Invit user in  group
    :param request
    """
    try:
        response = InviteGroup.as_view()(request=request, **kwargs).data
        return HttpResponse(json.dumps(response), content_type='application/json')
    except requests.exceptions.HTTPError as err:
        status = err.response.status_code
        reason = err.response.reason
        return HttpResponse(reason, status=status)


# Messages -------------------------------------------------------------------------------------------------------------
@login_required
def create_message(request):
    """
    Create message
    :param request:
    :return:
    """
    
    try:
        response = CreateMessage.as_view()(request=request).data
        print("Create message:", response)
        return HttpResponse(json.dumps(response), content_type='application/json')
    except requests.exceptions.HTTPError as err:
        status = err.response.status_code
        reason = err.response.reason
        return HttpResponse(reason, status=status)


@login_required
def get_messages_in_circle(request, **kwargs):
    """
    Get list of messages in a circle defined by lat, lon, rad
    :param request:
    :return:
    """
    try:
        response = ListNearMessages.as_view()(request=request, **kwargs).data
        print("get_messages_in_circle:", response)
        return HttpResponse(json.dumps(response), content_type='application/json')
    except requests.exceptions.HTTPError as err:
        status = err.response.status_code
        reason = err.response.reason
        return HttpResponse(reason, status=status)


@login_required
def manage_message(request, **kwargs):
    """
    Get a specific message
    :param request:
    :return:
    """
    try:
        response = ManageMessage.as_view()(request=request, **kwargs).data
        return HttpResponse(json.dumps(response), content_type='application/json')
    except requests.exceptions.HTTPError as err:
        status = err.response.status_code
        reason = err.response.reason
        return HttpResponse(reason, status=status)


# Friends -------------------------------------------------------------------------------------------------------------
@login_required
def add_friends(request, **kwargs):
    """
    Add a friend to a users list
    :param request:
    :return:
    """
    try:
        response = AddFriends.as_view()(request=request, **kwargs).data
        return HttpResponse(json.dumps(response), content_type='application/json')
    except requests.exceptions.HTTPError as err:
        status = err.response.status_code
        reason = err.response.reason
        return HttpResponse(reason, status=status)


@login_required
def list_friends(request, **kwargs):
    """
    List all friends from a user
    :param request:
    :return:
    """
    try:
        response = ListFriends.as_view()(request=request, **kwargs).data
        return HttpResponse(json.dumps(response), content_type='application/json')
    except requests.exceptions.HTTPError as err:
        status = err.response.status_code
        reason = err.response.reason
        return HttpResponse(reason, status=status)


@login_required
def remove_friends(request, **kwargs):
    """
    Remove friend from a user
    :param request:
    :return:
    """
    try:
        response = RemoveFriends.as_view()(request=request, **kwargs).data
        return HttpResponse(json.dumps(response), content_type='application/json')
    except requests.exceptions.HTTPError as err:
        status = err.response.status_code
        reason = err.response.reason
        return HttpResponse(reason, status=status)


@login_required
def invite_friend(request, **kwargs):
    """
    Remove friend from a user
    :param request:
    :return:
    """
    try:
        response = InviteFriend.as_view()(request=request, **kwargs).data
        return HttpResponse(json.dumps(response), content_type='application/json')

    except requests.exceptions.HTTPError as err:
        status = err.response.status_code
        reason = err.response.reason
        return HttpResponse(reason, status=status)

        
# Comments -------------------------------------------------------------------------------------------------------------
@login_required
def create_comment(request, **kwargs):
    """
    Create new comment
    :param request:
    :return:
    """
    try:
        response = CreateComment.as_view()(request=request, **kwargs).data
        return HttpResponse(json.dumps(response), content_type='application/json')
    except requests.exceptions.HTTPError as err:
        status = err.response.status_code
        reason = err.response.reason
        return HttpResponse(reason, status=status)


@login_required
def manage_comment(request, **kwargs):
    """
    Manage a comment
    :param request:
    :return:
    """
    try:
        response = ManageComment.as_view()(request=request, **kwargs).data
        return HttpResponse(json.dumps(response), content_type='application/json')
    except requests.exceptions.HTTPError as err:
        status = err.response.status_code
        reason = err.response.reason
        return HttpResponse(reason, status=status)


@login_required
def list_comment_from_message(request, **kwargs):
    """
    List all the comment from a message
    :param request:
    :return:
    """
    try:
        response = ListCommentFromMessage.as_view()(request=request, **kwargs).data
        return HttpResponse(json.dumps(response), content_type='application/json')
    except requests.exceptions.HTTPError as err:
        status = err.response.status_code
        reason = err.response.reason
        return HttpResponse(reason, status=status)

# Areas ----------------------------------------------------------------------------------------------------------------
@login_required
def manage_area(request, **kwargs):
    """
    Manage a specific area
    :param request:
    :return:
    """
    try:
        response = ManageArea.as_view()(request=request, **kwargs).data
        return HttpResponse(json.dumps(response), content_type='application/json')
    except requests.exceptions.HTTPError as err:
        status = err.response.status_code
        reason = err.response.reason
        return HttpResponse(reason, status=status)


# Notifications -------------------------------------------------------------------------------------------------------

@login_required
def list_recent_notifications(request, **kwargs):
    """
    List all the recenty notifications of the recent user
    :param request:
    :return:
    """
    try:
        response = ListRecentNotifications.as_view()(request=request, **kwargs).data
        return HttpResponse(json.dumps(response), content_type='application/json')
    except requests.exceptions.HTTPError as err:
        status = err.response.status_code
        reason = err.response.reason
        return HttpResponse(reason, status=status)

@login_required
def notify_new_area_messages(request, **kwargs):
    """
    Send notification request for area messages depending on time
    :param request:
    :return:
    """
    try:
        response = NotifyNewMessageInArea.as_view()(request=request, **kwargs).data
        return HttpResponse(json.dumps(response), content_type='application/json')
    except requests.exceptions.HTTPError as err:
        status = err.response.status_code
        reason = err.response.reason
        return HttpResponse(reason, status=status)
    

# Chat -------------------------------------------------------------------------------------------------------

@login_required
def list_chat_messages(request, **kwargs):
    """
    List all the messages exchanged with a user
    :param request:
    :return:
    """
    try:
        response = ListChatMessage.as_view()(request=request, **kwargs).data
        return HttpResponse(json.dumps(response), content_type='application/json')
    except requests.exceptions.HTTPError as err:
        status = err.response.status_code
        reason = err.response.reason
        return HttpResponse(reason, status=status)

# Exception Handlers ---------------------------------------------------------------------------------------------------
def handler400(request, exception):
    """
    View used to override 400 default page provided by Django
    :param request:
    :param exception:
    :return:
    """
    context = RequestContext(request)
    err_code = 400
    response = render('400.html', {"code": err_code, "error_raised": exception}, context)
    response.status_code = 400
    return response


def handler401(request, exception):
    """
    View used to override 401 default page provided by Django
    :param request:
    :param exception:
    :return:
    """
    context = RequestContext(request)
    err_code = 401
    response = render('401.html', {"code": err_code, "error_raised": exception}, context)
    response.status_code = 401
    return response


def handler403(request, exception):
    """
    View used to override 403 default page provided by Django
    :param request:
    :param exception:
    :return:
    """
    context = RequestContext(request)
    err_code = 400
    response = render('403.html', {"code": err_code, "error_raised": exception}, context)
    response.status_code = 400
    return response


def handler404(request, exception):
    """
    View used to override 404 default page provided by Django
    :param request:
    :param exception:
    :return:
    """
    context = RequestContext(request)
    err_code = 404
    response = render('400.html', {"code": err_code, "error_raised": exception}, context)
    response.status_code = 404
    return response


def handler500(request):
    """
    View used to override 500 default page provided by Django
    :param request:
    :param exception:
    :return:
    """
    context = RequestContext(request)
    err_code = 500
    response = render('500.html', {"code": err_code}, context)
    response.status_code = 500
    return response
