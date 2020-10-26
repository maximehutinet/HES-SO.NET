# -*- coding: utf-8 -*-
from django.conf.urls import url, re_path, include
from django.urls import path
from .api import views
from rest_framework_simplejwt import views as jwt_views
from .managers import UserManager


app_name = 'backend'

urlpatterns = [

	# urls for message CRUD
	###############################################################################

	# Create new message
	# @type POST
	path('message/create/', views.CreateMessage.as_view(), name='None'),

	# Manage an existing message
	# @param pk : Message id
	# @type GET / PATCH / DELETE
	path('message/<int:pk>/', views.ManageMessage.as_view(), name='None'),

	# List messages in a specific zone (latitude, longitude, radius)
	# @param lat : latitude
	# @param lon : longitude
	# @param rad : radius
	# @type GET
	re_path(r'message/list/(?P<lat>[0-9]+(.[0-9]+)?)/(?P<lon>[0-9]+(.[0-9]+)?)/(?P<rad>[0-9]+(.[0-9]+)?)', views.ListNearMessages.as_view(), name='None'),

	# urls for comment CRUD
	###############################################################################

	# Create new comment
	# @type POST
	path('comment/create/', views.CreateComment.as_view(), name='None'),

	# Manage an existing comment
	# @param pk : comment id
	# @type GET / PATCH / DELETE
	path('comment/<int:pk>/', views.ManageComment.as_view(), name='None'),

	# List the different comments from a message
	# @param msg_pk : message id
	# @type GET
	path('message/list/comments/<int:msg_pk>/', views.ListCommentFromMessage.as_view(), name='None'),


	# urls for group CRUD
	###############################################################################

	# Create a new group
	# @type POST
	path('group/create/', views.CreateGroup.as_view(), name='None'),

	# Manage an existing group (PATCH can be accessed only by the admin of the group)
	# @param pk : group id
	# @type GET / PATCH / DELETE
	path('group/<int:pk>/', views.ManageGroup.as_view(), name='None'),

	# Send a notification to invite a user in a group
	# @type POST
	path('group/invite/', views.InviteGroup.as_view(), name='None'),

	# Send a notification to a group admin to join his group
	# @type POST
	path('group/join/', views.AskJoinGroup.as_view(), name='None'),


	# List all groups of an user
	# @param user_pk : User id
	# @type GET
	path('group/list/groups/<int:user_pk>/', views.ListGroupsFromUser.as_view(), name='None'),

	# List all users of a group
	# @param group_pk : Group id
	# @type GET
	path('group/list/users/<int:group_pk>/', views.ListUsersFromGroup.as_view(), name='None'),

	# List all messages of a group
	# @param group_pk : Group id
	# @type GET
	path('group/list/messages/<int:group_pk>/', views.ListMessagesFromGroup.as_view(), name='None'),

	# List all groups
	# @type GET
	path('group/list/', views.ListGroups.as_view(), name='None'),

	# List all groups with public visibility
	# @type GET
	path('group/list/public/', views.ListPublicGroups.as_view(), name='None'),

	# Add a user to a group
	# @param group_pk : Group id
	# @type : PATCH
	path('group/members/add/<int:group_pk>/', views.AddGroupMembers.as_view(), name='None'),

	# Remove a user from a group
	# @param group_pk : Group id
	# @type : PATCH
	path('group/members/remove/<int:group_pk>/', views.RemoveGroupMembers.as_view(), name='None'),

	# Get a list of all users who are not in a group
	# @param group_pk : Group id
	# @type : GET
	path('group/list/unknow_users/<int:group_pk>/', views.ListUnknowUsersFromGroup.as_view(), name='None'),


	# urls for Users CRUD
	###############################################################################

	# Get current user
	# @type : GET
	path('user/current/', views.CurrentUserView.as_view(), name='None'),

	# Create an user
	# @type : POST
	path('user/create/', views.CreateUser.as_view(), name='None'),

	# Manage an existing user
	# @param pk : user id
	# @type GET / PATCH / DELETE
	path('user/<int:pk>/', views.ManageUser.as_view(), name='None'),

	# List all users
	# @type GET
	path('user/list/', views.ListUsers.as_view(), name='None'),

	# List all users uknown by a user
	# @type GET
	path('user/list/unknow/<int:user_pk>/', views.ListUnknowUsersFromUser.as_view(), name='None'),

	# List all areas of an user
	# @param user_pk : User id
	# @type GET
	path('user/list/areas/<int:user_pk>/', views.ListAreasFromUser.as_view(), name='None'),

	# Add friend to users friend list
	# @param user_pk : User id
	# @type PATCH
	path('user/friends/add/<int:user_pk>/', views.AddFriends.as_view(), name='None'),

	# Remove friends from users list
	# @param user_pk : User id
	# @type PATCH
	path('user/friends/remove/<int:user_pk>/', views.RemoveFriends.as_view(), name='None'),

	# Get friends from users list
	# @param user_pk : User id
	# @type GET
	path('user/list/friends/<int:pk>/', views.ListFriends.as_view(), name='None'),

	# Send a notification to invite a user to be friend
	# @type POST
	path('user/invite/', views.InviteFriend.as_view(), name='None'),

	# urls for Area CRUD
	###############################################################################

	# Create an area
	# @type : POST
	path('area/create/', views.CreateArea.as_view(), name='None'),

	# Manage an existing area
	# @param pk : area id
	# @type GET / PATCH / DELETE
	path('area/<int:pk>/', views.ManageArea.as_view(), name='None'),

	# List all areas
	# @type GET
	path('area/list/', views.ListAreas.as_view(), name='None'),


	# List all recent notifications for user's areas
	# @type GET
	# time format : YYYY-MM-DDTHH:MM:SS.000000Z UTC TIME (our time -2 hours)
	#path('area/notify/<str:time>/', views.NotifyNewMessageInArea.as_view(), name='None'),
	path('area/notify/', views.NotifyNewMessageInArea.as_view(), name='None'),

	# urls for Notifications
	###############################################################################

	# List all area f for current user
	# @type GET
	path('notifications/list/', views.ListRecentNotifications.as_view(), name='None'),

	# urls for Chat
	###############################################################################

	# Create a new chat session
	# @type POST
	path('chat/message/create/', views.CreateChatMessage.as_view(), name='None'),

	# List all messages exchanged with a user
	# @type GET
	path('chat/list/message/<int:recipient_pk>/', views.ListChatMessage.as_view(), name='None'),

	# Manage a chat message
	# @param pk : message id
	# @type GET / PATCH / DELETE
	path('chat/message/<int:pk>/', views.ManageChatMessage.as_view(), name='None'),

	# urls for Auth
	###############################################################################
	path('token/', jwt_views.TokenObtainPairView.as_view(), name='token_obtain_pair'),
	path('token/refresh/', jwt_views.TokenRefreshView.as_view(), name='token_refresh'),
	path('token/verify/', jwt_views.TokenVerifyView.as_view(), name='token_verify'),
]
