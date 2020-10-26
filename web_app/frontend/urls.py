from django.urls import path, re_path, include, reverse_lazy
from django.contrib.auth import views as auth_views
from . import views

app_name = 'frontend'

# Error handler
handler400 = 'frontend.views.handler400'
handler403 = 'frontend.views.handler403'
handler404 = 'frontend.views.handler404'
handler500 = 'frontend.views.handler500'

urlpatterns = [
    # Auth pages
    path('', views.LoginView.as_view(), name='login'),
    path('signup', views.RegisterView.as_view(), name='signup'),
    path('refresh_token', views.refresh_token, name='refreshToken'),
    path('reset_password', views.ResetPasswordRequestView.as_view(), name='reset_password'),
    path('logout', views.LogoutView.as_view(), name='logout'),

    # Classic pages
    path('main', views.MainPageView.as_view(), name='index'),
    path('notifications', views.MainPageView.as_view(), name='notification'),
    path('friends', views.MainPageView.as_view(), name='friends'),
    path('profile', views.MainPageView.as_view(), name='profile'),
    # path('sendMessage', views.sendMessage, name='sendMessage'),

    # Group methods
    path('group/list', views.get_groups, name='getGroups'),
    path('group/list/public', views.get_public_groups, name='getPublicGroups'),
    path('group/list/user/<int:user_pk>', views.get_groups_belong_to_user, name='getGroupsBelongToUser'),
    path('group/<int:pk>', views.manage_group, name='getGroup'),
    path('user/list/group/<int:group_pk>', views.get_users_belong_to_group, name='getUsersBelongToGroup'),
    path('group/list/messages/<int:group_pk>', views.get_messages_belong_to_group, name='getMessagesBelongToGroup'),
    # path('group/<int:group_pk>/<int:user_pk>', views.add_remove_group_member, name='add_remove_group_member'),
    path('group/create', views.create_group, name="createGroup"),
    path('group/create_bis/', views.create_group_bis, name="createGroupBis"),
    path('group/members/remove/<int:group_pk>', views.add_remove_group_member, name='add_remove_group_member'),
    path('group/members/add/<int:group_pk>', views.add_group_member, name='add_group_member'),
    path('group/list/unknow_users/<int:group_pk>', views.get_unknow_users_from_group, name='getUnknowUsersFromGroup'),

    path('group/join', views.ask_join_group, name='invitFriend'),
    path('group/invite', views.invit_in_group, name='invitFriend'),

    # User methods
    path('user/current', views.get_current_user, name='getCurrentUser'),
    path('user/list', views.get_users, name='getUsers'),
    path('user/list/unknow_users/<int:user_pk>', views.get_unknow_users_from_user, name='getUnknowUsersFromUser'),

    path('user/friends/add/<int:user_pk>', views.add_friends, name='addFriends'),
    path('user/friends/remove/<int:user_pk>', views.remove_friends, name='removeFriends'),
    path('user/list/friends/<int:pk>/', views.list_friends, name='listFriends'),
    path('user/list/areas/<int:user_pk>/', views.list_areas_of_user, name='listFriends'),
    path('user/change_password/', views.change_password, name='changePassword'),
    path('user/update_profile/', views.update_profile, name='update_profile'),
    path('user/<int:pk>/', views.manage_user, name='manageUser'),
    path('user/invite', views.invite_friend, name='invitFriend'),

    # Areas
    path('area/add', views.create_area, name='createArea'),
    path('area/<int:pk>/', views.manage_area, name='manageArea'),

    
    # Messages methods
    path('message/create', views.create_message, name='createMessage'),
    re_path(r'message/list/(?P<lat>[0-9]+(.[0-9]+)?)/(?P<lon>[0-9]+(.[0-9]+)?)/(?P<rad>[0-9]+(.[0-9]+)?)/', views.get_messages_in_circle, name='getMessagesInCircle'),
    path('message/<int:pk>/', views.manage_message, name='manageMessage'),
    
    # Comments
    path('comment/create/', views.create_comment, name='createComment'),
    path('comment/<int:pk>/', views.manage_comment, name='manageComment'),
    path('message/list/comments/<int:msg_pk>/', views.list_comment_from_message, name='listCommentFromMessage'),

    # Notifications
    path('notifications/list', views.list_recent_notifications, name='listRecentNotifications'),
    #path('area/notify/<str:time>', views.notify_new_area_messages, name='None'),
    path('area/notify', views.notify_new_area_messages, name='None'),


    # Chat
    path('chat/list/message/<int:recipient_pk>/', views.list_chat_messages, name='listMessageChat')
]

# Areas
"""     path('area/create', views.create_area, name='createComment'),
path('area/<int:pk>', views.manage_area, name='manageComment'),
path('area/list', views.list_areas, name='listCommentFromMessage'), """
