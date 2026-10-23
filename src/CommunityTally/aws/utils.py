from storages.backends.s3boto3 import S3Boto3Storage


class StaticRootS3BotoStorage(S3Boto3Storage):
    location = "static"


class MediaRootS3BotoStorage(S3Boto3Storage):
    location = "media"


class PrivateUploadS3BotoStorage(S3Boto3Storage):
    """Results form photos: private objects, read only through signed URLs."""

    location = "private/result-uploads"
    default_acl = "private"
    querystring_auth = True
    file_overwrite = False
