import json
from asgiref.sync import async_to_sync
from channels.generic.websocket import WebsocketConsumer
from .models import ChatMessage
from .api.serializers import ChatMessageSerializer, ChatMessageDetailsSerializer

class ChatConsumer(WebsocketConsumer):
    def connect(self):
        self.room_group_name = 'chat'

        # Join room group
        async_to_sync(self.channel_layer.group_add)(
            self.room_group_name,
            self.channel_name
        )
        self.accept()

    def disconnect(self, close_code):
        async_to_sync(self.channel_layer.group_discard)(
            self.room_group_name,
            self.channel_name
        )

    # Receive message from WebSocket
    def receive(self, text_data):
        text_data_json = json.loads(text_data)
        message = text_data_json['message']

        serializer = ChatMessageSerializer(data=message)
        serializer.is_valid(raise_exception=True)

        if serializer.is_valid():
            message = ChatMessage.objects.create(**serializer.validated_data)
            message.save()

            data = ChatMessageDetailsSerializer(message).data

        # Send message to room group
        async_to_sync(self.channel_layer.group_send)(
            self.room_group_name,
            {
                'type': 'chat_message',
                'message': data
            }
        )

    # Receive message from room group
    def chat_message(self, event):
        message = event['message']

        # Send message to WebSocket
        self.send(text_data=json.dumps({
            'message': message
        }))