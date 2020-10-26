from django.test import TestCase
from .models import Message, User, Group, Visibility, Area, Location, Comment


# Tests for the user
############################################
class UserTestCase(TestCase):
	def setUp(self):
		Location.objects.create(name="loc")
		
		user = User.objects.create(name="user1",
		                           email="user1@user1.com",
		                           password="user1",
		                           currentLocation=Location.objects.get(name="loc")
		                           )
		
		# Create friends and add them to the friendList
		friend1 = User.objects.create(name="friend1",
		                              email="friend1@friend.com",
		                              password="friend1"
		                              )
		friend2 = User.objects.create(name="friend2",
		                              email="friend2@friend.com",
		                              password="friend2"
		                              )
		
		user.friendList.add(friend1, friend2)
		
		# Create areas and add them to areaList
		area1 = Area.objects.create(name="area1", latitude=11, longitude=16, radius=15, user=user)
		area2 = Area.objects.create(name="area2", latitude=3, longitude=10, radius=15, user=user)
		
		# user.areaList.add(area1, area2)
		
		# Create superuser
		User.objects.create_superuser(name="super", email="super@super.com", password="super")
	
	def test_user(self):
		# Regular user
		user = User.objects.get(name="user1")
		
		friends = user.friendList.all()
		area = user.area_set.all()
		
		self.assertEqual(user.email, "user1@user1.com")
		self.assertEqual(user.password, "user1")
		self.assertEqual(user.currentLocation, Location.objects.get(name="loc"))
		self.assertEqual(friends[0].name, "friend1")
		self.assertEqual(friends[1].name, "friend2")
		self.assertEqual(area[0].name, "area1")
		self.assertEqual(area[1].name, "area2")
		self.assertTrue(user.is_active)
		self.assertFalse(user.is_staff)
		self.assertFalse(user.is_superuser)
		
		# Superuser
		superuser = User.objects.get(name="super")
		
		self.assertEqual(superuser.email, "super@super.com")
		self.assertTrue(superuser.is_active)
		self.assertTrue(superuser.is_staff)
		self.assertTrue(superuser.is_superuser)


# Tests of messages
############################################

class MessageTestCase(TestCase):
	def setUp(self):
		User.objects.create(name="user1")
		User.objects.create(name="user2")
		
		Visibility.objects.create(name="PRIVATE")
		Visibility.objects.create(name="PUBLIC")
		
		Group.objects.create(name="group1", photo="url", admin=User.objects.get(name="user1"),
		                     visibility=Visibility.objects.get(name="PRIVATE"))
		Group.objects.create(name="group2", photo="url", admin=User.objects.get(name="user2"),
		                     visibility=Visibility.objects.get(name="PUBLIC"))
		
		Message.objects.create(
			sender=User.objects.get(name="user1"),
			# receivers=Group.objects.get(name="group1"),
			longitude=10.5,
			latitude=15.7,
			radius=20.3,
			visibility=Visibility.objects.get(name="PRIVATE"),
			content="Test message 0",
			duration="120")
		
		# Message.objects.get(pk=1).receivers.add( Group.objects.get(name="group1") )
		# Message.objects.get(pk=1).receivers.add( Group.objects.get(name="group2") )
		Message.objects.get(content="Test message 0").receivers.add(Group.objects.get(name="group1"))
		Message.objects.get(content="Test message 0").receivers.add(Group.objects.get(name="group2"))
		
		Message.objects.create(sender=User.objects.get(name="user2"),
		                       # receivers=Group.objects.get(name="group2"),
		                       longitude=25.5,
		                       latitude=12.7,
		                       radius=14.4,
		                       visibility=Visibility.objects.get(name="PUBLIC"),
		                       content="Test message 1",
		                       duration="60")
		
		# Message.objects.get(pk=2).receivers.add( Group.objects.get(name="group2") )
		Message.objects.get(content="Test message 1").receivers.add(Group.objects.get(name="group2"))
	
	def test_message(self):
		# mtest0 = Message.objects.get(pk=1)
		# mtest1 = Message.objects.get(pk=2)
		mtest0 = Message.objects.get(content="Test message 0")
		mtest1 = Message.objects.get(content="Test message 1")
		
		# creation of a message
		self.assertEqual(mtest0.sender, User.objects.get(name="user1"))
		self.assertEqual(mtest1.sender, User.objects.get(name="user2"))
		self.assertEqual(mtest0.receivers.count(), 2)
		self.assertEqual(mtest1.receivers.count(), 1)
		self.assertEqual(mtest0.receivers.get(name="group1"), Group.objects.get(name="group1"))
		self.assertEqual(mtest0.receivers.get(name="group2"), Group.objects.get(name="group2"))
		self.assertEqual(mtest0.receivers.get(name="group2"), Group.objects.get(name="group2"))
		self.assertEqual(mtest0.visibility, Visibility.objects.get(name="PRIVATE"))
		self.assertEqual(mtest1.visibility, Visibility.objects.get(name="PUBLIC"))
		self.assertEqual(mtest0.content, 'Test message 0')
		self.assertEqual(mtest1.content, 'Test message 1')
		self.assertEqual(mtest0.longitude, 10.5)
		self.assertEqual(mtest1.longitude, 25.5)
		self.assertEqual(mtest0.latitude, 15.7)
		self.assertEqual(mtest1.latitude, 12.7)
		self.assertEqual(mtest0.radius, 20.3)
		self.assertEqual(mtest1.radius, 14.4)


# Tests comments
############################################

class CommentTestCase(TestCase):
	def setUp(self):
		user1 = User.objects.create(name="user1")
		user2 = User.objects.create(name="user2")
		
		Visibility.objects.create(name="PRIVATE")
		Visibility.objects.create(name="PUBLIC")
		
		msg1 = Message.objects.create(
			sender=user1,
			longitude=10.5,
			latitude=15.7,
			radius=20.3,
			visibility=Visibility.objects.get(name="PRIVATE"),
			content="Test message 0",
			duration="120")
		
		msg2 = Message.objects.create(
			sender=user2,
			longitude=10.5,
			latitude=15.7,
			radius=20.3,
			visibility=Visibility.objects.get(name="PRIVATE"),
			content="Test message 1",
			duration="120")
		
		Comment.objects.create(
			sender=user2,
			msg=msg1,
			content="Comment from user 2")
		
		Comment.objects.create(
			sender=user1,
			msg=msg2,
			content="Comment from user 1")
	
	def test_comment(self):
		user1 = User.objects.get(name="user1")
		user2 = User.objects.get(name="user2")
		comment1 = Comment.objects.get(pk=1)
		comment2 = Comment.objects.get(pk=2)
		msg1 = Message.objects.get(pk=1)
		msg2 = Message.objects.get(pk=2)
		
		# creation of a message
		self.assertEqual(comment1.msg, msg1)
		self.assertEqual(comment2.msg, msg2)
		self.assertEqual(comment1.content, "Comment from user 2")
		self.assertEqual(comment2.content, "Comment from user 1")
		self.assertEqual(comment1.sender, user2)
		self.assertEqual(comment2.sender, user1)


# Test Friends
############################################

class FriendsTestCase(TestCase):
	def setUp(self):
		user1 = User.objects.create(name="user1")
		user2 = User.objects.create(name="user2")
		
		user1.friendList.add(user2)
	
	def test_friends(self):
		user1 = User.objects.get(name="user1")
		user2 = User.objects.get(name="user2")
		
		self.assertTrue(user1.friendList.filter(id=user2.id).exists())
		self.assertTrue(user2.friendList.filter(id=user1.id).exists())
		
		user1.friendList.remove(user2)
		
		self.assertFalse(user1.friendList.filter(id=user2.id).exists())
		self.assertFalse(user2.friendList.filter(id=user1.id).exists())


# Tests of Message Belong Group
############################################
""" class MessageBelongGroupTestCase(TestCase):
	def setUp(self):
		User.objects.create(name="user1")
		User.objects.create(name="user2")

		Visibility.objects.create(name="PRIVATE")
		Visibility.objects.create(name="PUBLIC")

		Group.objects.create(name="group1", photo="url", admin=User.objects.get(name="user1"), visibility=Visibility.objects.get(name="PRIVATE"))
		Group.objects.create(name="group2", photo="url", admin=User.objects.get(name="user2"), visibility=Visibility.objects.get(name="PUBLIC"))

		Message.objects.create(	sender=User.objects.get(name="user1"),
								receiver=Group.objects.get(name="group1"),
								longitude=10.5,
								latitude=15.7,
								radius=20.3,
								visibility=Visibility.objects.get(name="PRIVATE"),
								content="Test message 0",
								duration="120")

		Message_belong_group.objects.create(message=Message.objects.get(pk=1),
											group=Group.objects.get(name="group1"))

		Message.objects.create(	sender=User.objects.get(name="user2"),
								receiver=Group.objects.get(name="group2"),
								longitude=25.5,
								latitude=12.7,
								radius=14.4,
								visibility=Visibility.objects.get(name="PUBLIC"),
								content="Test message 1",
								duration="60")

		Message_belong_group.objects.create(message=Message.objects.get(pk=2),
											group=Group.objects.get(name="group2")) """

""" 	def test_message_belong_group(self):
		mtest0 = Message.objects.get(pk=1)
		mtest1 = Message.objects.get(pk=2)

		msg_belong_group1 = Message_belong_group.objects.get(pk=1)
		msg_belong_group2 = Message_belong_group.objects.get(pk=2)

		self.assertEqual(msg_belong_group1.group, Group.objects.get(name="group1"))
		self.assertEqual(msg_belong_group2.group, Group.objects.get(name="group2"))

		self.assertEqual(msg_belong_group1.message, Message.objects.get(pk=1))
		self.assertEqual(msg_belong_group2.message, Message.objects.get(pk=2)) """


# Tests of groups
############################################

class GroupTestCase(TestCase):
	def setUp(self):
		User.objects.create(name="user1")
		User.objects.create(name="user2")
		
		Visibility.objects.create(name="PRIVATE")
		Visibility.objects.create(name="PUBLIC")
		
		Group.objects.create(name="group1", photo="url1", admin=User.objects.get(name="user1"),
		                     visibility=Visibility.objects.get(name="PRIVATE"))
		Group.objects.create(name="group2", photo="url2", admin=User.objects.get(name="user2"),
		                     visibility=Visibility.objects.get(name="PUBLIC"))
	
	def test_group(self):
		group1 = Group.objects.get(name="group1")
		group2 = Group.objects.get(name="group2")
		
		self.assertEqual(group1.name, "group1")
		self.assertEqual(group2.name, "group2")
		
		self.assertEqual(group1.photo, "url1")
		self.assertEqual(group2.photo, "url2")
		
		self.assertEqual(group1.admin, User.objects.get(name="user1"))
		self.assertEqual(group2.admin, User.objects.get(name="user2"))
		
		self.assertEqual(group1.visibility, Visibility.objects.get(name="PRIVATE"))
		self.assertEqual(group2.visibility, Visibility.objects.get(name="PUBLIC"))


# Tests of area
############################################

class AreaTestCase(TestCase):
	def setUp(self):
		user1 = User.objects.create(name="user1")
		user2 = User.objects.create(name="user2")
		
		Area.objects.create(name="area1", latitude=11, longitude=16, radius=15, user=user1)
		Area.objects.create(name="area2", latitude=11, longitude=16, radius=15, user=user1)
		Area.objects.create(name="area3", latitude=11, longitude=16, radius=15, user=user2)
	
	def test_area(self):
		areasUser1 = User.objects.get(name="user1").area_set.all()
		areasUser2 = User.objects.get(name="user2").area_set.all()
		
		self.assertEqual(areasUser1.count(), 2)
		self.assertEqual(areasUser2.count(), 1)
		
		areasUser1.filter(name="area1").delete()
		
		self.assertEqual(areasUser1.count(), 1)
		self.assertEqual(areasUser2.count(), 1)
