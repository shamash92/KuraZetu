"""What a person sees of a station's earlier uploads before agreeing or
disagreeing: each photo and its tags."""

from collections import defaultdict

from results.models import ResultUpload

FIRST_UPLOAD = "first_upload"
AGENT_UPLOADED = "agent_uploaded"
VERIFIED_BY_PEOPLE = "verified_by_people"
AI_VERIFIED = "ai_verified"

AGENT_ROLE = "party_agent"


def earlier_uploads(station, race):
    """Each countable current upload that holds a typed tally, oldest first,
    with the agreements saved with it.

    Returns a list of ``(upload, tags, agreements)``; each agreement is
    ``(upload, tags)``.
    """
    uploads = [
        upload
        for upload in ResultUpload.objects.filter(
            polling_station=station, race=race, is_current=True
        )
        .select_related("added_by")
        .order_by("created_at", "id")
        if upload.countable
    ]
    agreeing = defaultdict(list)
    for upload in uploads:
        if upload.agrees_with_id is not None:
            agreeing[upload.agrees_with_id].append(upload)
    typed = [upload for upload in uploads if upload.agrees_with_id is None]
    listed = []
    for position, upload in enumerate(typed):
        group = agreeing[upload.id]
        # The first uploader and each person whose agreement was saved.
        people = 1 + len(group)
        listed.append(
            (
                upload,
                tags(upload, people, first=position == 0),
                [(agreement, tags(agreement, people)) for agreement in group],
            )
        )
    return listed


def tags(upload, people, first=False):
    """The tags shown on one photo, in the order shown."""
    shown = []
    if first:
        shown.append({"code": FIRST_UPLOAD, "label": "First upload"})
    if upload.added_by is not None and upload.added_by.role == AGENT_ROLE:
        shown.append({"code": AGENT_UPLOADED, "label": "Agent uploaded"})
    if people >= 2:
        # Every saved agreement passed the comparison and the full reading.
        shown.append(
            {"code": VERIFIED_BY_PEOPLE, "label": f"Verified by {people} people"}
        )
        shown.append({"code": AI_VERIFIED, "label": "AI verified"})
    return shown
