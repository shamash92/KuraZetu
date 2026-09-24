import uuid

from django.conf import settings
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager
from django.core.exceptions import ValidationError
from django.db import models

from knox.models import AuthToken
from phonenumber_field.modelfields import PhoneNumberField


def mask_phone_number(phone_number):
    """
    Mask the last three digits of a phone number for privacy.

    Args:
        phone_number: A PhoneNumberField or string representation of a phone number

    Returns:
        String with last three digits replaced by 'XXX'

    Example:
        +254712345678 -> +254712345XXX
    """
    phone_str = str(phone_number)
    if len(phone_str) >= 4:
        return phone_str[:-3] + "XXX"
    return phone_str


class UserManager(BaseUserManager):
    def create_user(self, phone_number, password=None):
        """
        Creates and saves a User with the given phone_number and password.
        """
        # Validate phone number format
        try:
            PhoneNumberField().clean(phone_number, None)
        except ValidationError as e:
            # Raised as a ValidationError so createsuperuser renders it as a
            # readable CommandError rather than a traceback.
            raise ValidationError(
                f"{e.messages[0]} Enter it with the country code, for example "
                f"+254712345678, or in local form as 0712345678."
            ) from e

        user = self.model(phone_number=phone_number)

        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_staffuser(self, phone_number, password):
        """
        Creates and saves a staff user with the given phone_number and password.
        """
        user = self.create_user(phone_number, password=password)
        user.staff = True
        user.save(using=self._db)
        return user

    def create_superuser(self, phone_number, password):
        """
        Creates and saves a superuser with the given phone_number and password.
        """
        user = self.create_user(phone_number, password=password)
        user.staff = True
        user.admin = True
        user.save(using=self._db)
        return user


class User(AbstractBaseUser):
    GENDER_CHOICES = (("M", "Male"), ("F", "Female"))
    ROLE = (
        ("voter", "Voter"),
        ("candidate", "Candidate"),
        ("election_officer", "Election Officer"),
        ("media", "Media"),
        ("observer", "Observer"),
        ("party_agent", "Party Agent"),
        ("party_rep", "Party Representative"),
        ("other", "Other"),
    )

    phone_number = PhoneNumberField(unique=True)
    id_number = models.CharField(unique=True, max_length=20, blank=True, null=True)
    age = models.IntegerField(
        blank=True, null=True
    )  # TODO: Enforce over 18 check in user creation
    gender = models.CharField(
        choices=GENDER_CHOICES, max_length=6, blank=True, null=True
    )
    role = models.CharField(choices=ROLE, max_length=40, default="voter")
    expo_push_token = models.CharField(
        max_length=255, blank=True, null=True
    )  # For push notifications

    first_name = models.CharField(max_length=20, blank=True, null=True)
    last_name = models.CharField(max_length=20, blank=True, null=True)

    polling_center = models.ForeignKey(
        "stations.PollingCenter",
        on_delete=models.CASCADE,
        blank=True,
        null=True,
        related_name="polling_center",
    )

    is_verified = models.BooleanField(default=False)
    is_phone_verified = models.BooleanField(default=False)

    active = models.BooleanField(default=True)
    staff = models.BooleanField(default=False)  # a admin user; non super-user
    admin = models.BooleanField(default=False)  # a superuser
    # notice the absence of a "Password field", that's built in.

    USERNAME_FIELD = "phone_number"
    REQUIRED_FIELDS: list = []  # phone_number & Password are required by default.

    def get_full_name(self):
        # The user is identified by their phone_number address
        if self.first_name and self.last_name:
            return f"{self.first_name} {self.last_name}"
        elif self.first_name and not self.last_name:
            return f"{self.first_name}"
        elif self.last_name and not self.first_name:
            return f"{self.last_name}"
        else:
            return mask_phone_number(self.phone_number)

    def get_short_name(self):
        # The user is identified by their phone_number
        if self.first_name and self.last_name:
            return f"{self.first_name}"
        elif self.first_name and not self.last_name:
            return f"{self.first_name}"
        elif self.last_name and not self.first_name:
            return f"{self.last_name}"
        else:
            return mask_phone_number(self.phone_number)

    def __str__(self):
        return str(self.phone_number)

    def has_perm(self, perm, obj=None):
        "Does the user have a specific permission?"
        # This model defines no fine-grained permissions of its own; only
        # superuser-flagged accounts are granted anything here.
        return self.is_admin

    def has_module_perms(self, app_label):
        "Does the user have permissions to view the app `app_label`?"
        return self.is_admin

    @property
    def is_staff(self):
        "Is the user a member of staff?"
        return self.staff

    @property
    def is_admin(self):
        "Is the user a admin member?"
        return self.admin

    @property
    def is_active(self):
        "Is the user active?"
        return self.active

    objects = UserManager()


class PhoneVerificationChallenge(models.Model):
    class Purpose(models.TextChoices):
        SIGNUP = "signup", "Signup"
        EXISTING_ACCOUNT_LOGIN = "existing_account_login", "Existing account login"
        PASSWORD_RESET = "password_reset", "Password reset"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    phone_number = PhoneNumberField()
    purpose = models.CharField(max_length=32, choices=Purpose.choices)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        blank=True,
        null=True,
        on_delete=models.CASCADE,
        related_name="phone_verification_challenges",
    )
    # A 64-character HMAC of this challenge ID and the submitted six-digit code.
    # Django compares HMACs on verification, so a database leak cannot reveal a
    # usable OTP. The blank value means no code is currently valid.
    code_digest = models.CharField(max_length=64, blank=True)
    expires_at = models.DateTimeField(null=True, blank=True)
    failed_attempts = models.PositiveSmallIntegerField(default=0)
    locked_until = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=("phone_number", "purpose"),
                name="accounts_phone_verification_challenge_phone_purpose",
            )
        ]


class PhoneVerificationSend(models.Model):
    class Outcome(models.TextChoices):
        PENDING = "pending", "Pending"
        ACCEPTED = "accepted", "Accepted"
        SUPPRESSED = "suppressed", "Suppressed"
        FAILED = "failed", "Failed"

    challenge = models.ForeignKey(
        PhoneVerificationChallenge,
        on_delete=models.CASCADE,
        related_name="send_events",
    )
    purpose = models.CharField(
        max_length=32, choices=PhoneVerificationChallenge.Purpose.choices
    )
    phone_reference = models.CharField(max_length=64, db_index=True)
    client_ip_reference = models.CharField(max_length=64, db_index=True)
    outcome = models.CharField(
        max_length=16, choices=Outcome.choices, default=Outcome.PENDING
    )
    provider_message_id = models.CharField(max_length=128, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        indexes = [
            models.Index(
                fields=("phone_reference", "purpose", "created_at"),
                name="accounts_otp_send_phone_time",
            ),
            models.Index(
                fields=("client_ip_reference", "created_at"),
                name="accounts_otp_send_ip_created",
            ),
        ]


class PhoneVerificationRateScope(models.Model):
    """Row-level lock for a phone/purpose or client-IP rate-limit scope."""

    class Kind(models.TextChoices):
        PHONE = "phone", "Phone"
        IP = "ip", "IP"

    kind = models.CharField(max_length=8, choices=Kind.choices)
    reference = models.CharField(max_length=64)
    purpose = models.CharField(max_length=32, blank=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=("kind", "reference", "purpose"),
                name="accounts_phone_verification_rate_scope",
            )
        ]


class PhoneVerificationTicket(models.Model):
    # A 64-character HMAC of the opaque ticket returned once to the client.
    # Django hashes a submitted ticket before comparison, so the database never
    # stores a reusable ticket value.
    token_digest = models.CharField(max_length=64, unique=True)
    challenge = models.ForeignKey(
        PhoneVerificationChallenge,
        on_delete=models.CASCADE,
        related_name="tickets",
    )
    purpose = models.CharField(
        max_length=32, choices=PhoneVerificationChallenge.Purpose.choices
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        blank=True,
        null=True,
        on_delete=models.CASCADE,
        related_name="phone_verification_tickets",
    )
    expires_at = models.DateTimeField()
    consumed_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)


class NativeToken(AuthToken):
    """A Knox token as the admin shows it: by masked phone, never its digest."""

    class Meta:
        proxy = True
        verbose_name = "Native sign-in"
        verbose_name_plural = "Native sign-ins"

    def __str__(self):
        return mask_phone_number(self.user.phone_number)
