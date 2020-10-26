from ..models import Message, User, Group, Area, Comment, ChatMessage
from rest_framework import serializers


# USERS -----------------------------------------------------------------
class UserSerializerWithPassword(serializers.ModelSerializer):
	class Meta:
		model = User
		fields = ('name', 'password', 'email', 'photo', 'bio', 
				  'currentLocation', 'is_staff', 'is_active',
				  'date_joined')


class UserSerializer(serializers.ModelSerializer):
	class Meta:
		model = User
		fields = ('name', 'email', 'photo', 'bio', 'currentLocation',
				  'friendList', 'is_staff', 'is_active',
				  'date_joined')


class UserSerializerWithId(serializers.ModelSerializer):
	class Meta:
		model = User
		fields = ('id', 'name', 'email', 'photo', 'bio', 'currentLocation',
				  'friendList', 'is_staff', 'is_active',
				  'date_joined')


class UserSerializerFriendsList(serializers.ModelSerializer):
	class Meta:
		model = User
		fields = ('id', 'friendList')


# MESSAGES -----------------------------------------------------------------
class MessageSerializer(serializers.ModelSerializer):
	class Meta:
		model = Message
		fields = ('sender', 'latitude',
				  'longitude', 'radius','visibility',
				  'content', 'created_on',
				  'updated_on', 'duration')


class MessageSerializerWithReceivers(serializers.ModelSerializer):
	class Meta:
		model = Message
		fields = ('id', 'sender', 'receivers', 'latitude',
				  'longitude', 'radius','visibility',
				  'content', 'created_on',
				  'updated_on', 'duration')


class MessageSerializerWithId(serializers.ModelSerializer):
	class Meta:
		model = Message
		fields = ('id', 'sender', 'receivers', 'latitude',
				  'longitude', 'radius','visibility',
				  'content', 'created_on',
				  'updated_on', 'duration')


# COMMENTS -----------------------------------------------------------------
class CommentSerializer(serializers.ModelSerializer):
	sender = UserSerializerWithId(read_only=True)
	updated_on = serializers.DateTimeField(format="%d %B %Y - %H:%M")
	created_on = serializers.DateTimeField(format="%d %B %Y - %H:%M")
	class Meta:
		model = Comment
		fields = ('id', 'sender', 'msg', 'content', 'created_on',
				  'updated_on')


class CommentSerializerWithoutFormatDate(serializers.ModelSerializer):
	class Meta:
		model = Comment
		fields = ('id', 'sender', 'msg', 'content', 'created_on',
				  'updated_on')


# GROUP -----------------------------------------------------------------
class GroupSerializer(serializers.ModelSerializer):
	class Meta:
		model = Group
		fields = ('name', 'photo', 'admin', 'visibility')


class GroupSerializerWithId(serializers.ModelSerializer):
	class Meta:
		model = Group
		fields = ('id','name', 'photo', 'admin', 'visibility', 'users')


class GroupSerializerWithUsers(serializers.ModelSerializer):
	class Meta:
		model = Group
		fields = ('name', 'photo', 'admin', 'visibility', 'users')


class GroupSerializerOnlyUsers(serializers.ModelSerializer):
	class Meta:
		model = Group
		fields = ('users',)


# AREA -----------------------------------------------------------------
class AreaSerializer(serializers.ModelSerializer):
	class Meta:
		model = Area
		fields = ('name', 'latitude', 'longitude', 'radius', 'user')


class AreaSerializerWithId(serializers.ModelSerializer):
	class Meta:
		model = Area
		fields = ('id', 'name', 'latitude', 'longitude', 'radius', 'user')

# CHAT -----------------------------------------------------------------
class ChatMessageSerializer(serializers.ModelSerializer):
	class Meta:
		model = ChatMessage
		fields = ('sender', 'recipient', 'content')

class ChatMessageDetailsSerializer(serializers.ModelSerializer):
	sender = UserSerializerWithId(read_only=True)
	recipient = UserSerializerWithId(read_only=True)
	created_on = serializers.DateTimeField(format="%d %B %Y - %H:%M")
	class Meta:
		model = ChatMessage
		fields = ('id', 'sender', 'recipient', 'content', 'created_on')
