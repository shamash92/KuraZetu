"""Remove expired counters without resetting current login lockouts."""

from django.core.management.base import BaseCommand
from django.utils import timezone

from axes.helpers import get_cool_off
from axes.models import AccessAttempt


class Command(BaseCommand):
    help = "Delete expired authentication attempts; preserve current lockouts."

    def handle(self, *args, **options):
        cutoff = timezone.now() - get_cool_off()
        count, _ = AccessAttempt.objects.filter(attempt_time__lte=cutoff).delete()
        self.stdout.write(f"Deleted {count} expired authentication attempts.")
