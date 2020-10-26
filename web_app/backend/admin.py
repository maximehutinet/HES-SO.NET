from django.contrib import admin
from .models import Visibility
from .models import Area
from .models import Location
from .models import Group
from .models import Message
from .models import User
from .models import Comment
from .models import ChatMessage

admin.site.register(Visibility)
admin.site.register(Area)
admin.site.register(Location)
admin.site.register(Group)
admin.site.register(User)
admin.site.register(Message)
admin.site.register(Comment)
admin.site.register(ChatMessage)
