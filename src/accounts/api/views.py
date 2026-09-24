import logging

from django.contrib.auth import authenticate
from django.contrib.auth.signals import user_logged_in, user_logged_out

from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from accounts.api.serializers import PhoneNumberSerializer, UserSerializer
from accounts.auth_security import log_event
from accounts.authentication import (
    NATIVE_AUTHENTICATION,
    WEB_AND_NATIVE_AUTHENTICATION,
    issue_native_token,
)

logger = logging.getLogger(__name__)


class NativeLoginView(APIView):
    """Password login for the Native app: a Knox token, never a web session."""

    permission_classes = [AllowAny]
    authentication_classes = []

    def post(self, request):
        """
        Handle POST request for user login.
        """
        data = request.data
        if (
            not isinstance(data, dict)
            or not isinstance(data.get("password"), str)
            or not data["password"]
        ):
            log_event(request._request, "auth.login_rejected")
            return Response(
                {"error": "Phone number and password are required"}, status=400
            )

        phone_serializer = PhoneNumberSerializer(
            data={"number": data.get("phone_number", "")}
        )

        if not phone_serializer.is_valid(raise_exception=False):
            log_event(request._request, "auth.login_rejected")
            logger.debug(
                "Phone number validation errors: %s",
                phone_serializer.errors.get("number"),
            )
            return Response(
                {
                    "error": "Invalid phone number",
                    "details": phone_serializer.errors.get("number", [])[0],
                },
                status=status.HTTP_200_OK,
            )

        user = authenticate(
            request=request._request,
            phone_number=str(phone_serializer.validated_data["number"]),
            password=data["password"],
        )

        if user is not None:
            if not user.is_phone_verified:
                return Response(
                    {
                        "code": "phone_verification_required",
                        "message": "Your phone number is unverified. Reset your password to continue.",
                    },
                    status=status.HTTP_200_OK,
                )

            # first update the push notification token from mobile
            expo_push_token = data.get("expo_push_token", None)
            if expo_push_token:
                if user.expo_push_token == expo_push_token:
                    logger.debug("Expo push token is the same, no update needed.")
                else:
                    logger.debug("Updating expo push token for user_id=%s", user.id)
                    user.expo_push_token = expo_push_token
                    user.save()
                    logger.debug("Expo push token updated for user_id=%s:", user.id)

            return self.login_succeeded(request, user)
        else:
            logger.debug("User authentication failed")
            return Response(
                {"error": "Invalid credentials"},
                status=status.HTTP_400_BAD_REQUEST,
            )

    def login_succeeded(self, request, user):
        instance, token = issue_native_token(user)
        # Resets the lockout counter, updates last_login, and audits the login.
        user_logged_in.send(sender=user.__class__, request=request._request, user=user)
        response = Response(
            {
                "message": "User login successful",
                "data": {
                    "user": UserSerializer(user).data,
                    "token": token,
                    "expiry": instance.expiry,
                },
            },
            status=status.HTTP_200_OK,
        )
        response["Cache-Control"] = "no-store"
        return response


class NativeSessionView(APIView):
    """Confirm the Native token is still valid; each call slides its expiry."""

    authentication_classes = NATIVE_AUTHENTICATION
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response(
            {"data": {"expiry": request.auth.expiry}}, status=status.HTTP_200_OK
        )


class NativeLogoutView(APIView):
    authentication_classes = NATIVE_AUTHENTICATION
    permission_classes = [IsAuthenticated]

    def post(self, request):
        request.auth.delete()
        user_logged_out.send(
            sender=request.user.__class__, request=request._request, user=request.user
        )
        return Response(status=status.HTTP_204_NO_CONTENT)


class PushTokenView(APIView):
    authentication_classes = WEB_AND_NATIVE_AUTHENTICATION
    permission_classes = [IsAuthenticated]

    def post(self, request):
        expo_push_token = request.data.get("expo_push_token")
        if not isinstance(expo_push_token, str) or not expo_push_token.strip():
            return Response(
                {"error": "A push token is required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        request.user.expo_push_token = expo_push_token.strip()
        request.user.save(update_fields=["expo_push_token"])
        return Response(status=status.HTTP_200_OK)
