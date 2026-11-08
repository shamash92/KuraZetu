from celery import shared_task

from results import machine_checks


@shared_task
def read_check(check_id):
    """Read a stored photo with the model and record the outcome."""
    machine_checks.read_stored(check_id)
