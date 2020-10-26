from ..models import Message, Group, User, Visibility, Area, Comment, ChatMessage
from .serializers import MessageSerializer
from .serializers import MessageSerializer, MessageSerializerWithId
from .serializers import GroupSerializer, GroupSerializerWithId, GroupSerializerWithUsers, GroupSerializerOnlyUsers
from .serializers import UserSerializer, UserSerializerWithId, UserSerializerWithPassword, UserSerializerFriendsList
from .serializers import AreaSerializer, AreaSerializerWithId
from .serializers import CommentSerializer, CommentSerializerWithoutFormatDate
from .serializers import ChatMessageSerializer, ChatMessageDetailsSerializer

from ..managers import UserManager

from rest_framework import generics, status
from rest_framework.response import Response
from django.utils import timezone
from math import sqrt
from django.db.models import Q

from django.views.generic import TemplateView
from django.contrib.auth import authenticate, login, logout

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.authentication import SessionAuthentication, BasicAuthentication, TokenAuthentication

from ..notifications import Notifications

from drf_yasg.utils import swagger_auto_schema
from rest_framework.decorators import action

import datetime

import json


# View classes for message CRUD
############################################
class ListNearMessages(generics.ListAPIView):
	"""
	List messages in a specific zone (latitude, longitude, radius)
	url : GET message/list/<int:lat>/<int:lon>/<int:rad>/
	"""
	
	authentication_classes = (SessionAuthentication, BasicAuthentication)
	serializer_class = MessageSerializer
	permission_classes = (IsAuthenticated,)

	def list(self, request, *args, **kwargs):
		"""
		List near Messages
		"""

		queryset = self.get_queryset(request)
		serializer = MessageSerializerWithId(queryset, many=True)
		data = serializer.data
		response = {"status_code": status.HTTP_200_OK,
					"message": "Successfully listed",
					"result": data}
		return Response(response)

	def get_queryset(self, request):
		"""
		Filter queryset around coordinates
		:return: queryset
		"""
		# 78.567 is equal to 1 degree on earth coordinates
		valueConversion = 78.567
		rad = float(self.kwargs['rad'])/valueConversion
		lat = float(self.kwargs['lat'])
		lon = float(self.kwargs['lon'])
		queryset = Message.objects.filter(
			latitude__lte=(lat+rad), latitude__gte=(lat-rad),
			longitude__lte=(lon+rad), longitude__gte=(lon-rad))
		queryset = self.exclude_on_duration(queryset)
		queryset = self.exclude_on_position(queryset, lat, lon, rad)
		group_queryset = self.filter_by_groups(request, queryset)
		public_queryset = self.filter_public_message(queryset)
		own_queryset = self.filter_own_message(request, queryset)
		final_queryset = group_queryset | public_queryset | own_queryset
		return final_queryset

	def exclude_on_duration(self, queryset):
		"""
		exclude message from a queryset if duration time is expired
		returns a new queryset filtered
		:param queryset:
		:return: returns a new queryset filtered
		"""
		excludes = []
		for message in queryset:
			print( "DUUURRATION ", timezone.now(),message.created_on, message.duration )
			if timezone.now() > message.created_on + message.duration:
				excludes.append(message.id)
		return queryset.exclude(id__in=excludes)

	def exclude_on_position(self, queryset, center_x, center_y, radius):
		"""
		exclude messages out of the circle defined by center_x,center_y,radius
		:param queryset:
		:param center_x:
		:param center_y:
		:param radius:
		:return: returns a new queryset filtered
		"""
		excludes = []
		for message in queryset:
			if self.is_message_out_of_circle(message, center_x, center_y, radius):
				excludes.append(message.id)
		return queryset.exclude(id__in=excludes)

	def is_message_out_of_circle(self, message, center_x, center_y, radius):
		"""
		Verify if a message is out of the circle defined by center_x,center_y,radius
		:param message:
		:param center_x:
		:param center_y:
		:param radius:
		:return:
		"""
		sq_distance = (message.latitude - center_x)**2 + (message.longitude - center_y)**2
		return sqrt(sq_distance) > radius

	def filter_by_groups(self, request, queryset):
		"""
		Filter queryset by user's groups
		:param request:
		:param queryset:
		:return: new queryset
		"""
		user_groups = request.user.users.all()
		return queryset.filter(receivers__in=user_groups)

	def filter_public_message(self, queryset):
		"""
		Keep only message with public visibility
		:param queryset:
		:return: new queryset
		"""
		public = Visibility.objects.get(name="Public")
		return queryset.filter(visibility=public)

	def filter_own_message(self, request, queryset):
		"""
		Keep only messages send by the user
		:param request:
		:param queryset:
		:return: new queryset
		"""
		return queryset.filter(sender=request.user)


class CreateMessage(generics.CreateAPIView):
	"""
	Create new message
	url : POST message/create/
	"""
	authentication_classes = (SessionAuthentication, BasicAuthentication)
	queryset = Message.objects.all()
	serializer_class = MessageSerializer
	permission_classes = (IsAuthenticated,)

	def notify_users(self, lat, lon, current_user_pk, group_pks):
		users_to_notify = User.objects.none()
		for group_pk in group_pks:
			users_to_notify = users_to_notify.union(Group.objects.get(pk=int(group_pk)).users.all().exclude(pk=current_user_pk)).distinct('name')
		serializer_user = UserSerializerWithId()
		users_to_notify = UserSerializerWithId(users_to_notify, many=True).data
		notif = dict()
		notif["object"] = "message"
		notif["from"] = current_user_pk
		notif["lon"] = lon
		notif["lat"] = lat
		notif["group_pks"]= group_pks

		for user in users_to_notify:
			Notifications.send(user["id"],json.dumps(notif))

	def create(self, request, *args, **kwargs):
		"""
		Create a new message
		"""
		print("CREATE MESAGE")
		print(request.data)
		serializer = self.get_serializer(data=request.data)
		serializer.is_valid(raise_exception=True)



		if serializer.is_valid():
			message = Message.objects.create(**serializer.validated_data)
			message.save()

			group_pks = request.data["receivers"]
			for group_pk in group_pks:
				message.receivers.add( Group.objects.get(pk=int(group_pk)))


			self.notify_users(message.latitude, message.longitude, request.user.pk, group_pks)
			response = {"status_code": status.HTTP_200_OK,
		            	"message": "Successfully created",
		            	"result": serializer.data}
			return Response(response)


class ManageMessage(generics.RetrieveUpdateDestroyAPIView):
	"""JWTokenAuth
	Get (retrieve), update (patch) and delete (delete) a message depending on its id
	url : GET/PATCH/DELETE message/<int:pk>/
	"""
	authentication_classes = (SessionAuthentication, BasicAuthentication)
	queryset = Message.objects.all()
	serializer_class = MessageSerializerWithId
	permission_classes = (IsAuthenticated,)

	def retrieve(self, request, *args, **kwargs):
		"""
		Get data of a message
		"""
		super(ManageMessage, self).retrieve(request, args, kwargs)
		instance = self.get_object()
		serializer = self.get_serializer(instance)
		data = serializer.data
		response = {"status_code": status.HTTP_200_OK,
		            "message": "Successfully retrieved",
		            "result": data}
		return Response(response)

	def patch(self, request, *args, **kwargs):
		"""
		Patch data of a message
		"""
		super(ManageMessage, self).patch(request, args, kwargs)
		instance = self.get_object()
		serializer = self.get_serializer(instance)
		data = serializer.data
		response = {"status_code": status.HTTP_200_OK,
		            "message": "Successfully updated",
					"result": data}
		return Response(response)

	def delete(self, request, *args, **kwargs):
		"""
		Delete a message entry
		"""
		super(ManageMessage, self).delete(request, args, kwargs)
		response = {"status_code": status.HTTP_200_OK,
		            "message": "Successfully deleted"}
		return Response(response)

# View classes for comment CRUD
############################################
class CreateComment(generics.CreateAPIView):
	"""
	Create new comment
	url : POST comment/create/
	"""
	authentication_classes = (SessionAuthentication, BasicAuthentication)
	queryset = Comment.objects.all()
	serializer_class = CommentSerializerWithoutFormatDate
	permission_classes = (IsAuthenticated,)


	def notify_users(self, current_user_pk, id_msg):
		comments = Comment.objects.all().filter(msg=id_msg).exclude(sender=current_user_pk).distinct('sender')
		notif = dict()
		notif["object"] = "comment"
		notif["from"] = current_user_pk
		notif["message"]= id_msg
		for comment in comments:
			Notifications.send(comment.sender.pk,json.dumps(notif))

		msg_sender = Message.objects.get(pk=id_msg).sender.pk
		if(int(current_user_pk) != msg_sender):
			Notifications.send(msg_sender,json.dumps(notif))

		Notifications.receive(msg_sender)

	def create(self, request, *args, **kwargs):
		"""
		Create a new comment
		"""
		serializer = CommentSerializerWithoutFormatDate(data=request.data)
		serializer.is_valid(raise_exception=True)

		if serializer.is_valid():
			comment = Comment.objects.create(**serializer.validated_data)
			comment.save()
			data = CommentSerializer(comment).data
			self.notify_users(request.user.pk, request.data["msg"])


			response = {"status_code": status.HTTP_200_OK,
		            	"message": "Successfully created",
		            	"result": data}
			return Response(response)

class ManageComment(generics.RetrieveUpdateDestroyAPIView):
	"""
	Get (retrieve), update (patch) and delete (delete) a comment based on its id
	"""
	authentication_classes = (SessionAuthentication, BasicAuthentication)
	queryset = Comment.objects.all()
	serializer_class = CommentSerializer
	permission_classes = (IsAuthenticated,)

	def retrieve(self, request, *args, **kwargs):
		"""
		Get data of a comment
		"""
		super(ManageComment, self).retrieve(request, args, kwargs)
		instance = self.get_object()
		serializer = self.get_serializer(instance)
		data = serializer.data
		response = {"status_code": status.HTTP_200_OK,
		            "message": "Successfully retrieved",
		            "result": data}
		return Response(response)

	def patch(self, request, *args, **kwargs):
		"""
		Patch data of a comment
		"""
		super(ManageComment, self).patch(request, args, kwargs)
		instance = self.get_object()
		serializer = self.get_serializer(instance)
		data = serializer.data
		response = {"status_code": status.HTTP_200_OK,
		            "message": "Successfully updated",
					"result": data}
		return Response(response)

	def delete(self, request, *args, **kwargs):
		"""
		Delete a comment entry
		"""
		super(ManageComment, self).delete(request, args, kwargs)
		response = {"status_code": status.HTTP_200_OK,
		            "message": "Successfully deleted"}
		return Response(response)

class ListCommentFromMessage(generics.ListAPIView):
	"""
	List all comment of a message (msg_pk)
	url : GET message/list/comments/<int:msg_pk>/
	"""
	authentication_classes = (SessionAuthentication, BasicAuthentication)
	permission_classes = (IsAuthenticated,)
	serializer_class = CommentSerializer

	def list(self, request, *args, **kwargs):
		"""
		List all comment of a message
		"""
		msg_pk = int(self.kwargs['msg_pk'])
		queryset = Comment.objects.filter(msg=msg_pk)
		serializer = CommentSerializer(queryset, many=True)
		data = serializer.data
		response = {"status_code": status.HTTP_200_OK,
				"message": "Successfully listed",
				"result": data}
		return Response(response)


# View classes for group CRUD
############################################
class CreateGroup(generics.CreateAPIView):
	"""
	Create new group
	url : POST group/create/
	"""
	authentication_classes = (SessionAuthentication, BasicAuthentication)
	queryset = Group.objects.all()
	serializer_class = GroupSerializer
	permission_classes = (IsAuthenticated,)

	def create(self, request, *args, **kwargs):
		"""
		Create Group and add request user's as admin
		"""
		serializer = GroupSerializer(data=request.data)
		serializer.is_valid(raise_exception=True)

		if serializer.is_valid():
			group = Group.objects.create(**serializer.validated_data)

			group.save()
			group.users.add(request.user)

			response = {"status_code": status.HTTP_200_OK,
		            	"message": "Successfully created",
		            	"result": serializer.data}

			return Response(response)


class ManageGroup(generics.RetrieveUpdateDestroyAPIView):
	"""
	Get (retrieve), update (patch) and delete (delete) a group depending on its id
	url : GET/PATCH/DELETE group/<int:pk>/
	"""
	authentication_classes = (SessionAuthentication, BasicAuthentication)
	queryset = Group.objects.all()
	serializer_class = GroupSerializerWithId
	permission_classes = (IsAuthenticated,)

	def retrieve(self, request, *args, **kwargs):
		"""
		Get data of a group
		"""
		super(ManageGroup, self).retrieve(request, args, kwargs)
		instance = self.get_object()
		serializer = self.get_serializer(instance)
		data = serializer.data

		# replace visibility pk by name
		#visibility_pk = int(data['visibility'])
		#data['visibility'] = Visibility.objects.get(pk=visibility_pk).name

		response = {"status_code": status.HTTP_200_OK,
		            "message": "Successfully retrieved",
		            "result": data}
		return Response(response)

	def patch(self, request, *args, **kwargs):
		"""
		Patch group only if request user's is admin
		"""
		instance = self.get_object()
		if(instance.admin.pk == request.user.pk):
			serializer = self.get_serializer(instance)
			super(ManageGroup, self).patch(request, args, kwargs)
			data = serializer.data
			response = {"status_code": status.HTTP_200_OK,
			            "message": "Successfully updated",
						"result": data}
			return Response(response)
		else:
			response = {"status_code": status.HTTP_200_OK,
			            "message": "You are not admin of the group"
						}
			return Response(response)

	def delete(self, request, *args, **kwargs):
		"""
		Delete group entry
		"""
		super(ManageGroup, self).delete(request, args, kwargs)
		response = {"status_code": status.HTTP_200_OK,
		            "message": "Successfully deleted"}
		return Response(response)


class AskJoinGroup(generics.CreateAPIView):
	authentication_classes = (SessionAuthentication, BasicAuthentication)
	permission_classes = (IsAuthenticated,)

	def create(self, request, *args, **kwargs):
		"""
		Create a new notification to invite a user to be your friend
		"""

		group_pk = request.data["group"]
		admin_pk = Group.objects.get(pk=group_pk).admin.pk
		notif = dict()
		notif["object"] = "join_group"
		notif["from"] = request.user.pk
		notif["group"] = group_pk

		Notifications.send(admin_pk, json.dumps(notif))

		response = {"status_code": status.HTTP_200_OK,
	            	"message": "Successfully asked to join"
				   }
		return Response(response)

class InviteGroup(generics.CreateAPIView):
	authentication_classes = (SessionAuthentication, BasicAuthentication)
	permission_classes = (IsAuthenticated,)

	def create(self, request, *args, **kwargs):
		"""
		Create a new notification for invite a user to be your friend
		"""
		"""
		Semi-Private = 2
		Private = 3
		"""

		notif = dict()
		notif["object"] = "invit_group"
		notif["from"] = request.user.pk
		notif["group"] = request.data["group"]

		Notifications.send(request.data["to"], json.dumps(notif))

		response = {"status_code": status.HTTP_200_OK,
	            	"message": "Successfully invited"
				   }
		return Response(response)

class AddGroupMembers(generics.UpdateAPIView):
	"""
	Update (patch), add a group member
	url : PATCH group/members/add/<int:group_pk>/
	"""
	authentication_classes = (SessionAuthentication, BasicAuthentication)
	queryset = Group.objects.all()
	permission_classes = (IsAuthenticated,)
	serializer_class = GroupSerializerOnlyUsers
	

	def patch(self, request, *args, **kwargs):
		"""
		Add depending on existence a user from a group
		"""

		serializer = GroupSerializerOnlyUsers(data=request.data)
		serializer.is_valid(raise_exception=True)
		group_pk = int(self.kwargs["group_pk"])
		group = Group.objects.get(id=group_pk)

		if serializer.is_valid():

			group.users.add( serializer.data["users"][0] )
			#group.users.add(request.user)
			"""
			Probleme deja vu mais non résolu
			la récupération d'un tableau marche depuis insomnia
			mais pas deouis le front
			---
			users = serializer.validated_data['users']
			for user in users:
				if not group.users.filter(id=user.id).exists():
					group.users.add(user) """

			response = {"status_code": status.HTTP_200_OK,
						"message": "Successfully updated"}

			return Response(response)


class RemoveGroupMembers(generics.UpdateAPIView):
	"""
	Update (patch), delete a group member
	url : PATCH group/members/remove/<int:group_pk>/
	"""
	authentication_classes = (SessionAuthentication, BasicAuthentication)
	queryset = Group.objects.all()
	permission_classes = (IsAuthenticated,)
	serializer_class = GroupSerializerOnlyUsers

	def patch(self, request, *args, **kwargs):
		"""
		Remove depending on existence a user from a group
		"""
		serializer = GroupSerializerOnlyUsers(data=request.data)
		serializer.is_valid(raise_exception=True)
		group_pk = int(self.kwargs["group_pk"])
		group = Group.objects.get(id=group_pk)

		if serializer.is_valid():
			users = serializer.validated_data['users']
			for user in users:
				if group.users.filter(id=user.id).exists():
					group.users.remove(user)

			response = {"status_code": status.HTTP_200_OK,
						"message": "Successfully updated"}

			return Response(response)


class ListGroupsFromUser(generics.ListAPIView):
	"""
	List all groups of a user (user_pk)
	url : GET group/list/groups/<int:user_pk>/
	TODO: secure  User.objects.get(id=user_pk) if user_pk is unknow
	"""
	authentication_classes = (SessionAuthentication, BasicAuthentication)
	permission_classes = (IsAuthenticated,)
	serializer_class = GroupSerializerWithId

	def list(self, request, *args, **kwargs):
		"""
		List all groups of a user
		"""
		user_pk = int(self.kwargs['user_pk'])
		groups = User.objects.get(id=user_pk).users.all()
		serializer = GroupSerializerWithId(groups, many=True)
		data = serializer.data
		response = {"status_code": status.HTTP_200_OK,
				"message": "Successfully listed",
				"result": data}
		return Response(response)


class ListUsersFromGroup(generics.ListAPIView):
	"""
	List all users of a group (group_pk)
	url : GET group/list/users/<int:group_pk>/
	TODO: secure Group.objects.get(id=group_pk) if group_pk is unknow
	"""
	authentication_classes = (SessionAuthentication, BasicAuthentication)
	permission_classes = (IsAuthenticated,)
	serializer_class = UserSerializerWithId

	def list(self, request, *args, **kwargs):
		"""
		List all users of a group
		"""
		group_pk = int(self.kwargs['group_pk'])
		users = Group.objects.get(id=group_pk).users.all()
		serializer = UserSerializerWithId(users, many=True)
		data = serializer.data

		response = {"status_code": status.HTTP_200_OK,
					"message": "Successfully listed",
					"result": data}
		return Response(response)


class ListGroups(generics.ListAPIView):
	"""
	List all groups
	url : GET group/list/
	"""
	authentication_classes = (SessionAuthentication, BasicAuthentication)
	serializer_class = GroupSerializerWithId
	permission_classes = (IsAuthenticated,)

	def list(self, request, *args, **kwargs):
		"""
		List all groups
		"""
		queryset = Group.objects.all()
		serializer = GroupSerializerWithId(queryset, many=True)
		data = serializer.data
		response = {"status_code": status.HTTP_200_OK,
					"message": "Successfully listed",
					"result": data}
		return Response(response)


class ListPublicGroups(generics.ListAPIView):
	"""
	List all public groups
	url : GET group/list/public/
	"""
	authentication_classes = (SessionAuthentication, BasicAuthentication)
	serializer_class = GroupSerializerWithId
	permission_classes = (IsAuthenticated,)

	def list(self, request, *args, **kwargs):
		"""
		List all public groups
		"""
		queryset = Group.objects.filter(visibility=1)
		serializer = GroupSerializerWithId(queryset, many=True)
		data = serializer.data
		response = {"status_code": status.HTTP_200_OK,
					"message": "Successfully listed",
					"result": data}
		return Response(response)


class ListUnknowUsersFromGroup(generics.ListAPIView):
	"""
	List all users not known to a group (friends and group members exclusion)
	url : GET user/list/unknow/<int:user_pk>
	"""
	authentication_classes = (SessionAuthentication, BasicAuthentication)
	serializer_class = UserSerializerWithId
	permission_classes = (IsAuthenticated,)

	def list(self, request, *args, **kwargs):
		"""
		List all users not known to a group
		"""
		group_pk = int(self.kwargs['group_pk'])
		group_members = self.get_group_members(group_pk)
		queryset = User.objects.all().exclude(id__in=group_members)
		serializer = UserSerializerWithId(queryset, many=True)
		data = serializer.data
		response = {"status_code": status.HTTP_200_OK,
					"message": "Successfully listed",
					"result": data}
		return Response(response)

	def get_group_members(self, group_pk):
		members = Group.objects.get(id=group_pk).users.all()
		return [member.id for member in members]


class ListMessagesFromGroup(generics.ListAPIView):
	"""
	List all messages of a group (group_pk)
	url : GET group/list/messages/<int:group_pk>/
	TODO: secure Group.objects.get(id=group_pk) if group_pk is unknow
	"""
	authentication_classes = (SessionAuthentication, BasicAuthentication)
	permission_classes = (IsAuthenticated,)
	serializer_class = MessageSerializerWithId

	def list(self, request, *args, **kwargs):
		"""
		List all messages of a group
		"""
		group_pk = int(self.kwargs['group_pk'])
		messages = Group.objects.get(id=group_pk).receivers.all()
		serializer = MessageSerializerWithId(messages, many=True)
		data = serializer.data
		response = {"status_code": status.HTTP_200_OK,
					"message": "Successfully listed",
					"result": data}
		return Response(response)


# View classes for User
############################################
class CurrentUserView(APIView):
	"""
	Get current user (logged)
	url: GET user/current/
	"""
	authentication_classes = (SessionAuthentication, BasicAuthentication)
	permission_classes = (IsAuthenticated,)
	serializer_class = UserSerializerWithId

	def get(self, request):
		"""
		Get current user
		"""
		serializer = UserSerializerWithId(request.user)
		return Response(serializer.data)


class CreateUser(generics.CreateAPIView):
	"""
	Create new User
	Insert admin user
	url : POST user/create/
	"""

	queryset = User.objects.all()
	serializer_class = UserSerializerWithPassword
	permission_classes = []

	def create(self, request, *args, **kwargs):
		"""
		Create new User
		"""
		serializer = self.get_serializer(data=request.data)
		serializer.is_valid(raise_exception=True)

		if serializer.is_valid():
			password = serializer.validated_data.pop('password')
			user = User.objects.create(**serializer.validated_data)
			user.set_password(password)
			user.save()

			response = {"status_code": status.HTTP_200_OK,
						"message": "Successfully created",
						"result": serializer.validated_data}

			return Response(response)


class ManageUser(generics.RetrieveUpdateDestroyAPIView):
	"""
	Get (retrieve), update (patch) and delete (delete) a group depending on its id
	url : GET/PATCH/DELETE user/<int:pk>/
	"""
	authentication_classes = (SessionAuthentication, BasicAuthentication)
	queryset = User.objects.all()
	serializer_class = UserSerializerWithId
	permission_classes = (IsAuthenticated,)

	def retrieve(self, request, *args, **kwargs):
		"""
		Get data of a user
		"""
		super(ManageUser, self).retrieve(request, args, kwargs)
		instance = self.get_object()
		serializer = self.get_serializer(instance)
		data = serializer.data
		response = {"status_code": status.HTTP_200_OK,
		            "message": "Successfully retrieved",
		            "result": data}
		return Response(response)

	def patch(self, request, *args, **kwargs):
		"""
		Patch data of an user
		"""
		super(ManageUser, self).patch(request, args, kwargs)
		instance = self.get_object()
		serializer = self.get_serializer(instance)
		data = serializer.data
		response = {"status_code": status.HTTP_200_OK,
		            "message": "Successfully updated",
		            "result": data}
		return Response(response)

	def delete(self, request, *args, **kwargs):
		"""
		Delete user entry
		"""
		super(ManageUser, self).delete(request, args, kwargs)
		response = {"status_code": status.HTTP_200_OK,
		            "message": "Successfully deleted"}
		return Response(response)


class ListUsers(generics.ListAPIView):
	"""
	List all groups
	url : GET user/list/
	"""
	authentication_classes = (SessionAuthentication, BasicAuthentication)
	serializer_class = UserSerializerWithId
	permission_classes = (IsAuthenticated,)

	def list(self, request, *args, **kwargs):
		"""
		List all user
		"""
		queryset = User.objects.all()
		serializer = UserSerializerWithId(queryset, many=True)
		data = serializer.data
		response = {"status_code": status.HTTP_200_OK,
					"message": "Successfully listed",
					"result": data}
		return Response(response)


class ListUnknowUsersFromUser(generics.ListAPIView):
	"""
	List all users not known to a user (friends and group members exclusion)
	url : GET user/list/unknow/<int:user_pk>
	"""
	authentication_classes = (SessionAuthentication, BasicAuthentication)
	serializer_class = UserSerializerWithId
	permission_classes = (IsAuthenticated,)

	def list(self, request, *args, **kwargs):
		"""
		List all users not known to a user
		"""
		print( "in back" )
		print( self.kwargs )
		user_pk = int(self.kwargs['user_pk'])
		user_friends = self.get_user_friends(user_pk)
		queryset = User.objects.all().exclude(id__in=user_friends)
		serializer = UserSerializerWithId(queryset, many=True)
		data = serializer.data
		response = {"status_code": status.HTTP_200_OK,
					"message": "Successfully listed",
					"result": data}
		return Response(response)

	def get_user_friends(self, user_pk):
		"""
		returns all members known to a user (duplicates are possible - not an issue)
		"""
		queryset_friends = User.objects.get(id=user_pk).friendList.all()
		friends = [user_pk] + [friend.id for friend in queryset_friends]
		queryset_groups = User.objects.get(id=user_pk).groups.all()
		for group in queryset_groups:
			queryset_users_in_group = Group.objects.get(id=group.id).users.all()
			friends += [user.id for user in queryset_users_in_group]
		return friends


class ListAreasFromUser(generics.ListAPIView):
	"""
	List all areas of a user (user_pk)
	url : GET user/list/areas/<int:user_pk>/
	TODO: secure  User.objects.get(id=user_pk) if user_pk is unknow
	"""
	authentication_classes = (SessionAuthentication, BasicAuthentication)
	permission_classes = (IsAuthenticated,)
	serializer_class = AreaSerializerWithId

	def list(self, request, *args, **kwargs):
		"""
		List all areas of a user
		"""
		user_pk = int(self.kwargs['user_pk'])
		areas = User.objects.get(id=user_pk).area_set.all()
		serializer = AreaSerializerWithId(areas, many=True)
		data = serializer.data
		response = {"status_code": status.HTTP_200_OK,
				"message": "Successfully listed",
				"result": data}
		return Response(response)


# View classes for area CRUD
############################################
class CreateArea(generics.CreateAPIView):
	"""
	Create a new area
	url : POST area/create/
	"""
	authentication_classes = (SessionAuthentication, BasicAuthentication)
	queryset = Area.objects.all()
	serializer_class = AreaSerializer
	permission_classes = (IsAuthenticated,)

	def create(self, request, *args, **kwargs):
		"""
		Create Area
		"""
		serializer = AreaSerializer(data=request.data)
		serializer.is_valid(raise_exception=True)

		if serializer.is_valid():
			area = Area.objects.create(**serializer.validated_data)
			area.save()

			response = {"status_code": status.HTTP_200_OK,
		            	"message": "Successfully created",
		            	"result": serializer.data}

			return Response(response)


class ManageArea(generics.RetrieveUpdateDestroyAPIView):
	"""
	Get (retrieve), update (patch) and delete (delete) an area depending on its id
	url : GET/PATCH/DELETE area/<int:pk>/
	"""
	authentication_classes = (SessionAuthentication, BasicAuthentication)
	queryset = Area.objects.all()
	serializer_class = AreaSerializerWithId
	permission_classes = (IsAuthenticated,)

	def retrieve(self, request, *args, **kwargs):
		"""
		Get the details of an area
		"""
		super(ManageArea, self).retrieve(request, args, kwargs)
		instance = self.get_object()
		serializer = self.get_serializer(instance)
		data = serializer.data
		response = {"status_code": status.HTTP_200_OK,
		            "message": "Successfully retrieved",
		            "result": data}
		return Response(response)

	def patch(self, request, *args, **kwargs):
		"""
		Patch an area
		"""
		super(ManageArea, self).patch(request, args, kwargs)
		instance = self.get_object()
		serializer = self.get_serializer(instance)
		data = serializer.data
		response = {"status_code": status.HTTP_200_OK,
		            "message": "Successfully updated",
		            "result": data}
		return Response(response)

	def delete(self, request, *args, **kwargs):
		"""
		Delete an area
		"""
		super(ManageArea, self).delete(request, args, kwargs)
		response = {"status_code": status.HTTP_200_OK,
		            "message": "Successfully deleted"}
		return Response(response)


class ListAreas(generics.ListAPIView):
	"""
	List all areas
	url : GET area/list/
	"""
	authentication_classes = (SessionAuthentication, BasicAuthentication)
	serializer_class = AreaSerializerWithId
	permission_classes = (IsAuthenticated,)

	def list(self, request, *args, **kwargs):
		"""
		List all areas
		"""
		queryset = Area.objects.all()
		serializer = AreaSerializerWithId(queryset, many=True)
		data = serializer.data
		response = {"status_code": status.HTTP_200_OK,
					"message": "Successfully listed",
					"result": data}
		return Response(response)


class NotifyNewMessageInArea(generics.ListAPIView):
	"""
	Create a notifications on new activity in user registred area
	url : GET /area/notify/
	"""

	authentication_classes = (SessionAuthentication, BasicAuthentication)
	permission_classes = (IsAuthenticated,)

	@swagger_auto_schema(method='get', operation_description="Create a notifications on new activity", responses={"status_code": status.HTTP_200_OK, 
																								"message": "Successfully checked", "result": "{}"})
	@action(detail=False, methods=['get'])
	def list(self, request, *args, **kwargs):
		"""
		Create a notifications on new activity in user registred area
		"""
		queryset = Area.objects.all()
		user = User.objects.get( pk=request.user.pk )
		areas = queryset.filter(user=request.user)

		for area in areas:
			msg_queryset = self.get_queryset(request, area.radius, area.latitude, area.longitude )
			msg_queryset = msg_queryset.filter(updated_on__gte=user.last_connexion)
			cnt_new_messages = msg_queryset.count()
			if(cnt_new_messages > 0):
				notif = dict()
				notif["object"] = "area"
				notif["area_id"] = area.pk
				notif["lon"] = area.longitude
				notif["lat"] = area.latitude
				notif["message"] = cnt_new_messages
				Notifications.send(request.user.pk, json.dumps(notif))

		user.last_connexion = timezone.now()
		user.save()

		data = {}
		response = {"status_code": status.HTTP_200_OK,
					"message": "Successfully checked",
					"result": data}
		return Response(response)

	def get_queryset(self, request, rad, lat, lon):
		"""
		Filter queryset around coordinates
		:return: queryset
		"""
		# 78.567 is equal to 1 degree on earth coordinates
		valueConversion = 78.567
		rad = rad / valueConversion
		queryset = Message.objects.filter(
			latitude__lte=(lat+rad), latitude__gte=(lat-rad),
			longitude__lte=(lon+rad), longitude__gte=(lon-rad))
		queryset = self.exclude_on_duration(queryset)
		queryset = self.exclude_on_position(queryset, lat, lon, rad)
		group_queryset = self.filter_by_groups(request, queryset)
		public_queryset = self.filter_public_message(queryset)
		own_queryset = self.filter_own_message(request, queryset)
		final_queryset = group_queryset | public_queryset | own_queryset
		return final_queryset

	def exclude_on_duration(self, queryset):
		"""
		exclude message from a queryset if duration time is expired
		returns a new queryset filtered
		:param queryset:
		:return: returns a new queryset filtered
		"""
		excludes = []
		for message in queryset:
			if timezone.now() > message.created_on + message.duration:
				excludes.append(message.id)
		return queryset.exclude(id__in=excludes)

	def exclude_on_position(self, queryset, center_x, center_y, radius):
		"""
		exclude messages out of the circle defined by center_x,center_y,radius
		:param queryset:
		:param center_x:
		:param center_y:
		:param radius:
		:return: returns a new queryset filtered
		"""
		excludes = []
		for message in queryset:
			if self.is_message_out_of_circle(message, center_x, center_y, radius):
				excludes.append(message.id)
		return queryset.exclude(id__in=excludes)

	def is_message_out_of_circle(self, message, center_x, center_y, radius):
		"""
		Verify if a message is out of the circle defined by center_x,center_y,radius
		:param message:
		:param center_x:
		:param center_y:
		:param radius:
		:return:
		"""
		sq_distance = (message.latitude - center_x)**2 + (message.longitude - center_y)**2
		return sqrt(sq_distance) > radius

	def filter_by_groups(self, request, queryset):
		"""
		Filter queryset by user's groups
		:param request:
		:param queryset:
		:return: new queryset
		"""
		user_groups = request.user.group_set.all()
		return queryset.filter(receivers__in=user_groups)

	def filter_public_message(self, queryset):
		"""
		Keep only message with public visibility
		:param queryset:
		:return: new queryset
		"""
		public = Visibility.objects.get(name="Public")
		return queryset.filter(visibility=public)

	def filter_own_message(self, request, queryset):
		"""
		Keep only messages send by the user
		:param request:
		:param queryset:
		:return: new queryset
		"""
		return queryset.filter(sender=request.user)


# View classes for friends CRUD
############################################
class InviteFriend(generics.CreateAPIView):

	authentication_classes = (SessionAuthentication, BasicAuthentication)
	permission_classes = (IsAuthenticated,)
	def create(self, request, *args, **kwargs):
		"""
		Create a new notification for invite a user to be your friend
		"""
		notif = dict()
		notif["object"] = "user"
		notif["from"] = request.user.pk

		Notifications.send(request.data["to"], json.dumps(notif))
		response = {"status_code": status.HTTP_200_OK,
	            	"message": "Successfully invited"
				   }
		return Response(response)

class AddFriends(generics.UpdateAPIView):
	"""
	Update (patch), add a friend to a users list
	url : PATCH user/friends/add/<int:user_pk>/
	"""
	authentication_classes = (SessionAuthentication, BasicAuthentication)
	permission_classes = (IsAuthenticated,)
	serializer_class = UserSerializerFriendsList

	def patch(self, request, *args, **kwargs):
		"""
		Add friend into users list
		"""
		serializer = UserSerializerFriendsList(data=request.data)
		serializer.is_valid(raise_exception=True)
		user_pk = int(self.kwargs["user_pk"])
		current_user = User.objects.get(id=user_pk)

		if serializer.is_valid():
			friends = serializer.validated_data['friendList']

			for friend in friends:
				if not current_user.friendList.filter(id=friend.id).exists():
					current_user.friendList.add(friend)

			response = {"status_code": status.HTTP_200_OK,
						"message": "Successfully updated"}

			return Response(response)

class ListFriends(generics.ListAPIView):
	"""
	List all friends of a users (user_pk)
	url : GET user/list/friends/<int:user_pk>/
	"""
	authentication_classes = (SessionAuthentication, BasicAuthentication)
	permission_classes = (IsAuthenticated,)
	serializer_class = UserSerializerWithId
	#queryset = User.objects.all()

	def list(self, request, *args, **kwargs):
		"""
		List all friends from a user
		"""
		user_pk = int(self.kwargs['pk'])
		queryset = User.objects.get(id=user_pk).friendList.all()
		serializer = UserSerializerWithId(queryset, many=True)
		data = serializer.data

		response = {"status_code": status.HTTP_200_OK,
					"message": "Successfully listed",
					"result": data}
		return Response(response)

class RemoveFriends(generics.UpdateAPIView):
	"""
	Update (patch), remove a friend from a users list
	url : PATCH user/friends/remove/<int:user_pk>/
	"""
	authentication_classes = (SessionAuthentication, BasicAuthentication)
	permission_classes = (IsAuthenticated,)
	serializer_class = UserSerializerFriendsList

	def patch(self, request, *args, **kwargs):
		"""
		Remove friend from users list
		"""

		serializer = UserSerializerFriendsList(data=request.data)
		serializer.is_valid(raise_exception=True)
		user_pk = int(self.kwargs["user_pk"])
		current_user = User.objects.get(id=user_pk)

		if serializer.is_valid():
			friends = serializer.validated_data['friendList']
			for friend in friends:
				if current_user.friendList.filter(id=friend.id).exists():
					current_user.friendList.remove(friend)

			response = {"status_code": status.HTTP_200_OK,
						"message": "Successfully updated"}

			return Response(response)

# View classes for Notifications
############################################

class ListRecentNotifications(generics.ListAPIView):
	authentication_classes = (SessionAuthentication, BasicAuthentication)
	permission_classes = (IsAuthenticated,)
	queryset = User.objects.none()

	def list(self, request, *args, **kwargs):
		"""
		List all friends from a user
		"""
		data = Notifications.receive(request.user.pk)


		response = {"status_code": status.HTTP_200_OK,
					"message": "Successfully listed",
					"result": data}
		return Response(response)

# View classes for Chat
############################################

class CreateChatMessage(generics.CreateAPIView):
	"""
	Create new chat message
	url : POST chat/message/create/
	"""
	authentication_classes = (SessionAuthentication, BasicAuthentication)
	permission_classes = (IsAuthenticated,)
	serializer_class = ChatMessageSerializer

	def create(self, request, *args, **kwargs):
		"""
		Create message
		"""
		serializer = ChatMessageSerializer(data=request.data)
		serializer.is_valid(raise_exception=True)

		if serializer.is_valid():
			message = ChatMessage.objects.create(**serializer.validated_data)
			message.save()

			data = ChatMessageDetailsSerializer(message).data

			response = {"status_code": status.HTTP_200_OK,
		            	"message": "Successfully created",
		            	"result": data}

			return Response(response)

class ListChatMessage(generics.ListAPIView):
	"""
	List all the messages exchanged with a user
	url : GET chat/list/message/<int:recipient_pk>/
	"""
	authentication_classes = (SessionAuthentication, BasicAuthentication)
	permission_classes = (IsAuthenticated,)
	serializer_class = ChatMessageDetailsSerializer

	def list(self, request, *args, **kwargs):
		"""
		List all messages the current user exchanged with a user
		"""
		recipient_pk = int(self.kwargs['recipient_pk'])
		messages = ChatMessage.objects.filter(
							(Q(recipient=recipient_pk) & Q(sender=request.user.pk)) 
														| 
							(Q(recipient=request.user.pk) & Q(sender=recipient_pk)))

		data = ChatMessageDetailsSerializer(messages, many=True).data

		response = {"status_code": status.HTTP_200_OK,
					"message": "Successfully listed",
					"result": data}

		return Response(response)

class ManageChatMessage(generics.RetrieveUpdateDestroyAPIView):
	"""
	Get (retrieve), update (patch) and delete (delete) a chat message depending on its id
	url : GET/PATCH/DELETE chat/message/<int:pk>/
	"""
	authentication_classes = (SessionAuthentication, BasicAuthentication)
	queryset = ChatMessage.objects.all()
	serializer_class = ChatMessageDetailsSerializer
	permission_classes = (IsAuthenticated,)

	def retrieve(self, request, *args, **kwargs):
		"""
		Get a chat message
		"""
		super(ManageChatMessage, self).retrieve(request, args, kwargs)
		instance = self.get_object()
		serializer = self.get_serializer(instance)
		data = serializer.data
		response = {"status_code": status.HTTP_200_OK,
		            "message": "Successfully retrieved",
		            "result": data}
		return Response(response)

	def patch(self, request, *args, **kwargs):
		"""
		Patch a chat message
		"""
		super(ManageChatMessage, self).patch(request, args, kwargs)
		instance = self.get_object()
		serializer = self.get_serializer(instance)
		data = serializer.data
		response = {"status_code": status.HTTP_200_OK,
		            "message": "Successfully updated",
		            "result": data}
		return Response(response)

	def delete(self, request, *args, **kwargs):
		"""
		Delete a chat message
		"""
		super(ManageChatMessage, self).delete(request, args, kwargs)
		response = {"status_code": status.HTTP_200_OK,
		            "message": "Successfully deleted"}
		return Response(response)