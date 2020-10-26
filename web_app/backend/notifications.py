import pika
import time
import json


class Notifications():

    def send(to, message):
        connection = pika.BlockingConnection(
           pika.ConnectionParameters(host='rabbitmq-notif'))
        channel = connection.channel()

        channel.queue_declare(queue=str(to), durable=True)

        channel.basic_publish(
           exchange='',
           routing_key=str(to),
           body=message,
           properties=pika.BasicProperties(
               delivery_mode=2,  # make message persistent
           ))
        print(" [x] Sent ", message, "to ", str(to))
        connection.close()

    def receive(user):
        connection = pika.BlockingConnection(
           pika.ConnectionParameters(host='rabbitmq-notif'))
        channel = connection.channel()
        channel.queue_declare(queue=str(user), durable=True)

        method_frame, header_frame, body = channel.basic_get(queue=str(user))
        notifications = []
        have_notif = body != None

        while(have_notif):
            channel.basic_ack(delivery_tag=method_frame.delivery_tag)
            notifications.append(json.loads(body.decode("utf-8")))
            method_frame, header_frame, body = channel.basic_get(queue=str(user))
            have_notif = body != None
        print(notifications)
        connection.close()
        return notifications
