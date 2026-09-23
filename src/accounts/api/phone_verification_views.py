from django.contrib.auth import login
from django.db import IntegrityError, transaction

from knox.models import AuthToken
from rest_framework import status
from rest_framework.authtoken.models import Token
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from accounts.api.serializers import (
    PasswordResetCompletionSerializer,
    PhoneVerificationCodeSerializer,
    PhoneVerificationStartSerializer,
    SignupCompletionSerializer,
    UserSerializer,
)
from accounts.authentication import issue_native_token
from accounts.models import PhoneVerificationChallenge, User
from accounts.phone_verification import (
    PASSWORD_RESET_PHONE_NUMBER_SESSION_KEY,
    InvalidPhoneVerificationCode,
    InvalidPhoneVerificationTicket,
    PhoneVerificationRateLimited,
    SmsDeliveryUnavailable,
    consume_ticket,
    start_verification,
    ticket_for_use,
    verify_code,
)
from stations.models import PollingCenter, Ward


class PhoneVerificationAPIView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = []

    def finalize_response(self, request, response, *args, **kwargs):
        response = super().finalize_response(request, response, *args, **kwargs)
        response["Cache-Control"] = "no-store"
        return response

    def rate_limited_response(self, error):
        response = Response(
            {
                "code": error.code,
                "error": "Please wait before requesting another code.",
                "retry_after_seconds": error.retry_after_seconds,
            },
            status=status.HTTP_429_TOO_MANY_REQUESTS,
        )
        response["Retry-After"] = str(error.retry_after_seconds)
        return response


class SignupPhoneVerificationStartView(PhoneVerificationAPIView):
    def post(self, request):
        serializer = PhoneVerificationStartSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        try:
            verification = start_verification(
                phone_number=serializer.validated_data["phone_number"],
                purpose=PhoneVerificationChallenge.Purpose.SIGNUP,
                request=request,
            )
        except PhoneVerificationRateLimited as error:
            return self.rate_limited_response(error)
        except SmsDeliveryUnavailable:
            return Response(
                {
                    "code": "phone_verification_unavailable",
                    "error": "We could not send a code. Please try again later.",
                },
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )
        return Response(
            {
                "message": "If this number can receive messages, a code is on its way.",
                "data": {
                    "challenge_id": verification.challenge_id,
                    "expires_in_seconds": verification.expires_in_seconds,
                    "retry_after_seconds": verification.retry_after_seconds,
                },
            },
            status=status.HTTP_202_ACCEPTED,
        )


class PasswordResetPhoneVerificationStartView(PhoneVerificationAPIView):
    def post(self, request):
        serializer = PhoneVerificationStartSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        phone_number = serializer.validated_data["phone_number"]
        request.session.pop(PASSWORD_RESET_PHONE_NUMBER_SESSION_KEY, None)
        user = User.objects.filter(phone_number=phone_number).first()
        try:
            verification = start_verification(
                phone_number=phone_number,
                purpose=PhoneVerificationChallenge.Purpose.PASSWORD_RESET,
                request=request,
                user=user,
                send_sms=True,
            )
        except PhoneVerificationRateLimited as error:
            return self.rate_limited_response(error)
        except SmsDeliveryUnavailable:
            return Response(
                {
                    "code": "phone_verification_unavailable",
                    "error": "We could not send a code. Please try again later.",
                },
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )
        return Response(
            {
                "message": "If this number can receive messages, a code is on its way.",
                "data": {
                    "challenge_id": verification.challenge_id,
                    "expires_in_seconds": verification.expires_in_seconds,
                    "retry_after_seconds": verification.retry_after_seconds,
                },
            },
            status=status.HTTP_202_ACCEPTED,
        )


class PasswordResetPhonePrefillView(PhoneVerificationAPIView):
    def get(self, request):
        phone_number = request.session.get(PASSWORD_RESET_PHONE_NUMBER_SESSION_KEY)
        if not phone_number:
            return Response(
                {"code": "password_reset_phone_not_found"},
                status=status.HTTP_404_NOT_FOUND,
            )
        return Response(
            {"data": {"phone_number": phone_number}}, status=status.HTTP_200_OK
        )


class PhoneVerificationCodeView(PhoneVerificationAPIView):
    def post(self, request):
        serializer = PhoneVerificationCodeSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        try:
            verification = verify_code(**serializer.validated_data)
        except PhoneVerificationRateLimited as error:
            return self.rate_limited_response(error)
        except InvalidPhoneVerificationCode:
            return Response(
                {
                    "code": "invalid_or_expired_code",
                    "error": "This code is invalid or has expired.",
                },
                status=status.HTTP_400_BAD_REQUEST,
            )
        if verification.existing_account:
            return Response(
                {
                    "message": "Phone number verified.",
                    "data": {"outcome": "existing_account"},
                },
                status=status.HTTP_200_OK,
            )
        return Response(
            {
                "message": "Phone number verified.",
                "data": {
                    "outcome": "verified",
                    "verification_ticket": verification.token,
                    "expires_in_seconds": verification.expires_in_seconds,
                },
            },
            status=status.HTTP_200_OK,
        )


class SignupCompletionView(PhoneVerificationAPIView):
    def post(self, request):
        serializer = SignupCompletionSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data.copy()
        verification_ticket = data.pop("verification_ticket")
        password = data.pop("password")
        native_client = data.pop("client", None) == "native"
        ward_code = data.pop("ward_code")
        polling_center_code = data.pop("polling_center")

        try:
            with transaction.atomic():
                ticket = ticket_for_use(
                    token=verification_ticket,
                    purpose=PhoneVerificationChallenge.Purpose.SIGNUP,
                )
                ward = Ward.objects.get(number=ward_code)
                polling_center = PollingCenter.objects.get(
                    code=polling_center_code,
                    ward=ward,
                )
                if User.objects.filter(
                    phone_number=ticket.challenge.phone_number
                ).exists():
                    raise InvalidPhoneVerificationTicket()
                user = User(
                    **data,
                    phone_number=ticket.challenge.phone_number,
                    polling_center=polling_center,
                    is_phone_verified=True,
                )
                user.set_password(password)
                user.save()
                consume_ticket(ticket)
                if native_client:
                    knox_token, token = issue_native_token(user)
                else:
                    token = Token.objects.get_or_create(user=user)[0].key
                    login(
                        request,
                        user,
                        backend="django.contrib.auth.backends.ModelBackend",
                    )
        except (
            InvalidPhoneVerificationTicket,
            Ward.DoesNotExist,
            PollingCenter.DoesNotExist,
            IntegrityError,
        ):
            return Response(
                {
                    "code": "invalid_or_expired_ticket",
                    "error": "We could not complete signup. Start again.",
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        response_data = {"user": UserSerializer(user).data, "token": token}
        if native_client:
            response_data["expiry"] = knox_token.expiry
        return Response(
            {"message": "User signup successful", "data": response_data},
            status=status.HTTP_201_CREATED,
        )


class PasswordResetCompletionView(PhoneVerificationAPIView):
    def post(self, request):
        serializer = PasswordResetCompletionSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        try:
            with transaction.atomic():
                ticket = ticket_for_use(
                    token=serializer.validated_data["verification_ticket"],
                    purpose=PhoneVerificationChallenge.Purpose.PASSWORD_RESET,
                )
                if ticket.user is None:
                    raise InvalidPhoneVerificationTicket()
                ticket.user.set_password(serializer.validated_data["new_password"])
                ticket.user.is_phone_verified = True
                ticket.user.save(update_fields=("password", "is_phone_verified"))
                AuthToken.objects.filter(user=ticket.user).delete()
                consume_ticket(ticket)
        except InvalidPhoneVerificationTicket:
            return Response(
                {
                    "code": "invalid_or_expired_ticket",
                    "error": "This verification has expired. Start again.",
                },
                status=status.HTTP_400_BAD_REQUEST,
            )
        return Response(
            {"message": "Your password has been reset."}, status=status.HTTP_200_OK
        )
