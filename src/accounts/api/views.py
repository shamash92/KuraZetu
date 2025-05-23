from django.contrib.auth import authenticate, login

from rest_framework import status
from rest_framework.authtoken.models import Token
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from accounts.api.serializers import UserSerializer
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
                print("Token created:", token)
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
