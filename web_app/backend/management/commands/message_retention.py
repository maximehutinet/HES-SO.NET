from django.core.management.base import BaseCommand, CommandError, no_translations
from web_back.backend.models import Message
from django.conf import settings
from datetime import datetime, timedelta


@no_translations
class Command(BaseCommand):
    """
    This function is an extension for django-admin command line interface.
    TODO: We can improve this functionality
    TODO: --> It would be better if we keep the deleted data into another table instead of deleting the content directly
    Usage : python manage.py message_rentention
    """
    help = 'This function is used to purge messages after some days. Currently: '

    def handle(self, *args, **kwargs):
        global msg
        try:
            msg = Message.objects.filter(
                created_on__lte=datetime.now() - timedelta(days=settings.MESSAGE_RETENTION)).delete()
        except:
            raise CommandError('Something went wrong, after database purge : %s' % msg)

        self.stdout.write(self.style.SUCCESS('Successfully deleted messages for the past "%s" day(s).' % settings.MESSAGE_RETENTION))