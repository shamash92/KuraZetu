from django.contrib.auth.models import AbstractBaseUser, BaseUserManager
from django.db import models

from phonenumber_field.modelfields import PhoneNumberField


class UserManager(BaseUserManager):
    def create_user(self, phone_number, password=None):
        """
        Creates and saves a User with the given phone_number and password.
        """
        # Validate phone number format
        try:
            PhoneNumberField().clean(phone_number, None)
        except Exception as e:
            raise ValueError(f"Invalid phone number format: {e}")

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
            return str(
                self.phone_number
            )  # TODO: Format to replace last three digits with "XXX"

    def get_short_name(self):
        # The user is identified by their phone_number
        if self.first_name and self.last_name:
            return f"{self.first_name}"
        elif self.first_name and not self.last_name:
            return f"{self.first_name}"
        elif self.last_name and not self.first_name:
            return f"{self.last_name}"
        else:
            return str(
                self.phone_number
            )  # TODO: Format to replace last three digits with "XXX"

    def __str__(self):
        return str(self.phone_number)

    def has_perm(self, perm, obj=None):
        "Does the user have a specific permission?"
        # Simplest possible answer: Yes, always
        return True

    def has_module_perms(self, app_label):
        "Does the user have permissions to view the app `app_label`?"
        # Simplest possible answer: Yes, always
        return True

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
