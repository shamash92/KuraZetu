import logging

from django.contrib.auth import authenticate, login

from rest_framework import status
from rest_framework.authtoken.models import Token
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from accounts.api.serializers import PhoneNumberSerializer, UserSerializer
from accounts.models import User
from stations.models import PollingCenter, Ward

logger = logging.getLogger(__name__)


class SignupView(APIView):
    """
    View to handle user signup.
    """

    permission_classes = [AllowAny]
    authentication_classes = []

    def post(self, request):
        """
        Handle POST request for user signup.
        """

        data = request.data

        ward_code = data["ward_code"]

        try:
            ward = Ward.objects.get(number=ward_code)
        except Ward.DoesNotExist:
            logger.debug("Ward not found for code: %s", ward_code)
            return Response(
                {"error": "Ward not found"}, status=status.HTTP_400_BAD_REQUEST
            )

        serializer = UserSerializer(data=data["data"])

        if serializer.is_valid():
            try:
                polling_center = PollingCenter.objects.get(
                    code=data["data"]["polling_center"],
                    ward=ward,
                )

            except PollingCenter.DoesNotExist:
                return Response(
                    {"error": "Polling center not found"},
                    status=status.HTTP_200_OK,
                )

            # save the user
            validated_data = serializer.validated_data
            # Now inspect or modify
            instance = User(**validated_data)
            instance.set_password(data["data"]["password"])
            instance.polling_center = polling_center
            instance.save()

            # Authenticate the user and return Token
            user = User.objects.get(
                phone_number=data["data"]["phone_number"],
            )
            if user:
                token, created = Token.objects.get_or_create(user=user)
                #  authenticate
                user = authenticate(
                    username=data["data"]["phone_number"],
                    password=data["data"]["password"],
                )
                if user is None:
                    return Response(
                        {"error": "User authentication failed"},
                        status=status.HTTP_200_OK,
                    )
                else:
                    # login the user
                    if user.is_active:
                        login(request, user)

                logger.debug("User authenticated: user_id=%s", user.id)

                return Response(
                    {
                        "message": "User signup successful",
                        "data": {
                            "user": serializer.data,
                            "token": token.key,
                        },
                    },
                    status=status.HTTP_201_CREATED,
                )
            else:
                return Response(
                    {"error": "User not found after creation"},
                    status=status.HTTP_200_OK,
                )

        else:
            logger.debug("Signup validation failed")
            return Response(
                {
                    "error": "Invalid data",
                    "details": {
                        key: [str(err) for err in value]
                        for key, value in serializer.errors.items()
                    },
                },
                status=status.HTTP_200_OK,
            )


class LoginView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = []

    def post(self, request):
        """
        Handle POST request for user login.
        """
        data = request.data

        phone_serializer = PhoneNumberSerializer(
            data={"number": data.get("phone_number", "")}
        )

        if not phone_serializer.is_valid(raise_exception=False):
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
            username=data["phone_number"],
            password=data["password"],
        )

        if user is not None:
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

            token, created = Token.objects.get_or_create(user=user)
            login(request, user)
            return Response(
                {
                    "message": "User login successful",
                    "data": {
                        "user": UserSerializer(user).data,
                        "token": token.key,
                    },
                },
                status=status.HTTP_200_OK,
            )
        else:
            logger.debug("User authentication failed")
            return Response(
                {"error": "Invalid credentials"},
                status=status.HTTP_400_BAD_REQUEST,
            )
