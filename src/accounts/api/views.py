from django.contrib.auth import authenticate, login

from rest_framework import status
from rest_framework.authtoken.models import Token
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from accounts.api.serializers import PhoneNumberSerializer, UserSerializer
from accounts.models import User
from stations.models import PollingCenter, Ward


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
        print("Received data:", data)

        ward_code = data["ward_code"]

        print("Ward code:", ward_code)

        try:
            ward = Ward.objects.get(number=ward_code)
            print("Ward found:", ward)
        except Ward.DoesNotExist:
            print("Ward not found")
            return Response(
                {"error": "Ward not found"}, status=status.HTTP_400_BAD_REQUEST
            )

        serializer = UserSerializer(data=data["data"])

        if serializer.is_valid():
            # print("Serializer is valid:", serializer.is_valid())
            print("Serializer validated data:", serializer.validated_data)

            try:
                polling_center = PollingCenter.objects.get(
                    code=data["data"]["polling_center"],
                    ward=ward,
                )

            except PollingCenter.DoesNotExist:
                print("Polling center not found")
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
                print("Token from server:", token)
                #  authenticate
                user = authenticate(
                    username=data["data"]["phone_number"],
                    password=data["data"]["password"],
                )
                if user is None:
                    print("User authentication failed")
                    return Response(
                        {"error": "User authentication failed"},
                        status=status.HTTP_200_OK,
                    )
                else:
                    # login the user
                    if user.is_active:
                        login(request, user)

                print("User authenticated:", user)

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
                print("User not found after creation")
                return Response(
                    {"error": "User not found after creation"},
                    status=status.HTTP_200_OK,
                )

        else:
            print("Serializer errors:", serializer.errors)
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
        print("Login data received:", data)  # dangerous to log in production

        phone_serializer = PhoneNumberSerializer(
            data={"number": data.get("phone_number", "")}
        )

        if not phone_serializer.is_valid(raise_exception=False):
            print(
                "Phone number validation errors:",
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
                    print("Expo push token is the same, no update needed.")
                else:
                    print("Updating expo push token for user:", user)
                    user.expo_push_token = expo_push_token
                    user.save()
                    print("Expo push token updated:", expo_push_token)

            token, created = Token.objects.get_or_create(user=user)
            print("Token created:", token)
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
            print("User authentication failed")
            return Response(
                {"error": "Invalid credentials"},
                status=status.HTTP_400_BAD_REQUEST,
            )
