import {Alert, AlertDescription} from "../../@/components/ui/alert";
import {AlertCircle, ArrowLeft, Users} from "lucide-react";
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "../../@/components/ui/form";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "../../@/components/ui/select";
import {useNavigate, useParams} from "react-router-dom";

import {Button} from "../../@/components/ui/button";
import {Input} from "../../@/components/ui/input";
import cookie from "react-cookies";
import {useForm} from "react-hook-form";
import {useState} from "react";
import {z} from "zod";
import {zodResolver} from "@hookform/resolvers/zod";

// Defining the form validation schema
const formSchema = z
    .object({
        phone_number: z
            .string()
            .min(1, "Phone number is required")
            .regex(
                /^\+254[0-9]{9}$/,
                "Must be a valid Kenyan phone number starting with +254 followed by 9 digits",
            ),
        first_name: z
            .string()
            .min(2, "First name is required, min 2 characters")
            .max(20),
        last_name: z.string().min(2, "Last name is required, min 2 characters").max(20),
        gender: z.enum(["M", "F"], {
            required_error: "Please select a gender",
        }),
        age: z
            .number({
                required_error: "Age is required",
                invalid_type_error: "Age must be a number",
            })
            .min(18, "You must be at least 18 years old to register")
            .max(100, "Are you sure you are this old and using a smartphone?"),
        role: z.enum(
            [
                "voter",
                "candidate",
                "media",
                "observer",
                "party_agent",
                "party_rep",
                "election_officer",
                "other",
            ],
            {
                required_error: "Please select a role",
            },
        ),
        password: z.string().min(4, "Password must be at least 8 characters long"),
        confirm_password: z
            .string()
            .min(4, "Password confirmation must be at least 8 characters long"),
    })
    .refine((data) => data.password === data.confirm_password, {
        message: "Passwords do not match",
        path: ["confirm_password"],
    });

type FormValues = z.infer<typeof formSchema>;

export default function SignupForm() {
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const navigate = useNavigate();
    let {wardCode, pollingCenterCode} = useParams();

    const csrfToken = cookie.load("csrftoken");

    // Initialize the form
    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            phone_number: "+254",
            first_name: "",
            last_name: "",
            age: undefined,
            role: "voter",
            password: "",
            confirm_password: "",
        },
    });

    // Handling form submission
    function onSubmit(data: FormValues) {
        setSubmitting(true);
        setError(null);

        try {
            console.log("Form submitted:", data);

            data["polling_center"] = pollingCenterCode;

            console.log(data);

            fetch("/api/accounts/signup/", {
                method: "POST",
                headers: {
                    Accept: "application/json",
                    "Content-Type": "application/json",
                    "X-CSRFToken": csrfToken,
                },
                body: JSON.stringify({
                    data: data,
                    ward_code: wardCode,
                }),
            })
                .then((response) => response.json())
                .then((data) => {
                    console.log(data, "data from server");

                    if (data["error"]) {
                        if (data["error"] === "Polling center not found") {
                            setError(data["error"]);
                        } else {
                            setError(data["details"]);
                        }
                    } else if (data["message"] === "User signup successful") {
                        let token = data["data"]["token"];

                        console.log(token, "token from server");

                        localStorage.setItem("token", token);

                        if (typeof token === "string" && token.length > 0) {
                            cookie.save("token", token, {
                                path: "/",
                                secure: true, // Ensures the cookie is sent over HTTPS only
                                httpOnly: false, // Prevents JavaScript from accessing the cookie (set to true if possible)
                                sameSite: "Strict", // Prevents the cookie from being sent with cross-site requests
                            });
                        } else {
                            console.error("Invalid token format");
                        }

                        navigate("/ui/signup/accounts/registration-success/");
                    }
                });
        } catch (err) {
            setError("An error occurred during registration. Please try again.");
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <div className="flex flex-col min-h-screen">
            <header className="w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                <div className="container flex items-center h-16">
                    <a href="/" className="flex items-center gap-2">
                        <ArrowLeft className="w-4 h-4" />
                        <span className="text-sm font-medium">Back to Home</span>
                    </a>
                </div>
            </header>

            <main className="flex-1">
                <div className="container max-w-md ">
                    <div className="flex flex-col items-center justify-start gap-6 text-center ">
                        <div className="flex items-center justify-center  w-full h-[20vh]">
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="800.283"
                                height="459.452"
                                viewBox="0 0 800.283 459.452"
                                className="w-full"
                            >
                                <g transform="translate(-560.001 -310)">
                                    <g transform="translate(595.918 441.564)">
                                        <path
                                            d="M456.278,312.134h0a12.465,12.465,0,0,0-5.2-3.049L436.759,293.47l-7.552,7.24,15.349,15.064a12.238,12.238,0,0,0,3.26,5.033c3.674,3.511,8.544,4.415,10.88,2.017s1.263-7.179-2.4-10.684h-.014Z"
                                            transform="translate(-327.646 -170.988)"
                                            fill="#9f616a"
                                        />
                                        <path
                                            d="M515.059,270.541l-7.607,9.563-39.318-29.762-.034-.068L445.124,207.4a14.706,14.706,0,1,1,26.7-12.2l14.908,39.019,28.329,36.309Z"
                                            transform="translate(-392.397 -136.424)"
                                            fill="#d6d6e3"
                                        />
                                        <path
                                            d="M516.754,164.58h16.029v25.429L515.11,184.2Z"
                                            transform="translate(-458.837 -129.638)"
                                            fill="#9f616a"
                                        />
                                        <path
                                            d="M527.619,140.7a17.6,17.6,0,1,1-17.6-17.6A17.6,17.6,0,0,1,527.619,140.7Z"
                                            transform="translate(-438.256 -116.33)"
                                            fill="#9f616a"
                                        />
                                        <path
                                            d="M506.612,148.761l-1.718,3.26-7.58-14.405c-4.564-13.978,11.376-22.005,11.376-22.005,5.2-6.126,15.655,1.039,15.655,1.039,15.078-3.348,7.8,9.359,7.8,9.359S527,126.124,527,130.28s-5.6,3.871-5.6,3.871l-4.388,7.682-2.425-2.948C505.573,135.068,506.612,148.761,506.612,148.761Z"
                                            transform="translate(-447.31 -113.133)"
                                            fill="#2f2e43"
                                        />
                                        <rect
                                            width="14.222"
                                            height="20.178"
                                            transform="translate(51.423 295.497)"
                                            fill="#9f616a"
                                        />
                                        <path
                                            d="M517.326,585.018c-6.242,0-15.356-.652-15.424-.659-2.438.217-14.609,1.175-15.214-1.61a11.96,11.96,0,0,1,.38-5.6c1.175-11.634,1.61-11.77,1.868-11.845.414-.122,1.623.455,3.586,1.718l.122.081.027.143c.034.177.9,4.449,5.026,3.8,2.825-.448,3.742-1.073,4.034-1.379a1.738,1.738,0,0,1-.747-.625,2.185,2.185,0,0,1-.156-1.82,28.807,28.807,0,0,1,2.187-4.91l.183-.326,16.164,10.908,9.984,2.853a2.555,2.555,0,0,1,1.664,1.474h0a2.575,2.575,0,0,1-.652,2.907c-1.813,1.63-5.42,4.422-9.2,4.768-1.005.1-2.336.129-3.831.129h0Z"
                                            transform="translate(-437.832 -257.131)"
                                            fill="#2f2e43"
                                        />
                                        <rect
                                            width="14.222"
                                            height="20.178"
                                            transform="matrix(-0.771, -0.637, 0.637, -0.771, 19.411, 289.863)"
                                            fill="#9f616a"
                                        />
                                        <path
                                            d="M590.468,550.994c-4.809-3.98-11.417-10.29-11.465-10.337-2.017-1.379-12.008-8.4-10.7-10.935a11.851,11.851,0,0,1,3.865-4.075c8.32-8.225,8.734-8.048,8.986-7.94.4.17.964,1.379,1.671,3.606l.041.136-.068.129c-.1.163-2.146,4.014,1.447,6.133,2.465,1.453,3.566,1.555,3.987,1.508a1.733,1.733,0,0,1-.177-.964,2.19,2.19,0,0,1,1.039-1.5,28.9,28.9,0,0,1,4.815-2.391l.346-.136,5.5,18.7,5.875,8.564a2.577,2.577,0,0,1,.34,2.2h0a2.583,2.583,0,0,1-2.357,1.827c-2.431.1-6.989-.048-10.12-2.187-.829-.571-1.875-1.392-3.029-2.343h0Z"
                                            transform="translate(-568.188 -242.919)"
                                            fill="#2f2e43"
                                        />
                                        <path
                                            d="M541.479,319.1,519.8,480.358H503.54L492.7,319.1h48.786Z"
                                            transform="translate(-452.32 -179.211)"
                                            fill="#2f2e43"
                                        />
                                        <path
                                            d="M525.077,407.183,492.7,449.19l13.855,11.444,55.564-52.847,4.965-88.688-9.936,8.884Z"
                                            transform="translate(-477.918 -179.211)"
                                            fill="#2f2e43"
                                        />
                                        <path
                                            d="M535.992,177.582l9.936,94.861H497.143l-3.783-30.787a88.842,88.842,0,0,1,11.057-54.905L511.9,173.67l24.091,3.912h0Z"
                                            transform="translate(-456.763 -132.554)"
                                            fill="#d6d6e3"
                                        />
                                        <path
                                            d="M519.414,346.939h0a12.427,12.427,0,0,0-3.464-4.931L509.4,321.85l-9.882,3.457,7.709,20.07a12.168,12.168,0,0,0,.876,5.936c1.881,4.714,5.943,7.559,9.06,6.35s4.123-6.011,2.241-10.724Z"
                                            transform="translate(-435.811 -180.093)"
                                            fill="#9f616a"
                                        />
                                        <path
                                            d="M542.08,297.425l-10.887,5.542-23.425-43.393V259.5l-3.117-48.541a14.707,14.707,0,1,1,29.354,0l-2.628,41.681,10.7,44.792h0Z"
                                            transform="translate(-461.01 -139.496)"
                                            fill="#d6d6e3"
                                        />
                                    </g>
                                    <path
                                        d="M656.482,526.506H144.27c-4.774,0-8.644-3.443-8.649-7.686v-345c.006-4.243,3.875-7.681,8.649-7.686H656.482c4.775,0,8.644,3.443,8.649,7.686v345C665.125,523.063,661.256,526.5,656.482,526.506ZM144.27,167.84c-3.713,0-6.723,2.678-6.727,5.978v345c0,3.3,3.014,5.974,6.727,5.978H656.482c3.713,0,6.723-2.678,6.727-5.978v-345c0-3.3-3.014-5.974-6.727-5.978Z"
                                        transform="translate(695.152 143.868)"
                                        fill="#e6e6e6"
                                    />
                                    <path
                                        d="M608.538,260.221H196.27a8.659,8.659,0,0,1-8.649-8.649V221.781a8.659,8.659,0,0,1,8.649-8.649H608.538a8.659,8.659,0,0,1,8.649,8.649v29.791a8.659,8.659,0,0,1-8.649,8.649ZM196.27,215.054a6.735,6.735,0,0,0-6.727,6.727v29.791a6.735,6.735,0,0,0,6.727,6.727H608.538a6.735,6.735,0,0,0,6.727-6.727V221.781a6.735,6.735,0,0,0-6.727-6.727Z"
                                        transform="translate(693.289 129.81)"
                                        fill="#3f3d56"
                                    />
                                    <path
                                        d="M359.64,343.221H196.27a8.659,8.659,0,0,1-8.649-8.649V304.781a8.659,8.659,0,0,1,8.649-8.649H359.64a8.659,8.659,0,0,1,8.649,8.649v29.791A8.659,8.659,0,0,1,359.64,343.221ZM196.27,298.054a6.735,6.735,0,0,0-6.727,6.727v29.791a6.735,6.735,0,0,0,6.727,6.727H359.64a6.735,6.735,0,0,0,6.727-6.727V304.781a6.735,6.735,0,0,0-6.727-6.727Z"
                                        transform="translate(693.289 138.798)"
                                        fill="#3f3d56"
                                    />
                                    <path
                                        d="M618.64,343.221H455.27a8.659,8.659,0,0,1-8.649-8.649V304.781a8.659,8.659,0,0,1,8.649-8.649H618.64a8.659,8.659,0,0,1,8.649,8.649v29.791a8.659,8.659,0,0,1-8.649,8.649ZM455.27,298.054a6.735,6.735,0,0,0-6.727,6.727v29.791a6.734,6.734,0,0,0,6.727,6.727H618.64a6.735,6.735,0,0,0,6.727-6.727V304.781a6.735,6.735,0,0,0-6.727-6.727Z"
                                        transform="translate(683.188 138.798)"
                                        fill="#3f3d56"
                                    />
                                    <path
                                        d="M621.343,540.04H511.789a8.178,8.178,0,0,1-8.168-8.169V521.3a8.178,8.178,0,0,1,8.168-8.168H621.343a8.178,8.178,0,0,1,8.168,8.168v10.571A8.178,8.178,0,0,1,621.343,540.04Z"
                                        transform="translate(528.053 97.513)"
                                        fill="#e6e6e6"
                                    />
                                    <path
                                        d="M215.309,396.508A7.688,7.688,0,1,1,223,388.82a7.688,7.688,0,0,1-7.688,7.688Zm0-13.454a5.766,5.766,0,1,0,5.766,5.766A5.766,5.766,0,0,0,215.309,383.054Z"
                                        transform="translate(692.508 135.482)"
                                        fill="#e6e6e6"
                                    />
                                    <path
                                        d="M215.309,422.508A7.688,7.688,0,1,1,223,414.82a7.688,7.688,0,0,1-7.688,7.688Zm0-13.454a5.766,5.766,0,1,0,5.766,5.766A5.766,5.766,0,0,0,215.309,409.054Z"
                                        transform="translate(692.508 134.469)"
                                        fill="#e6e6e6"
                                    />
                                    <path
                                        d="M215.309,448.508A7.688,7.688,0,1,1,223,440.82a7.688,7.688,0,0,1-7.688,7.688Zm0-13.454a5.766,5.766,0,1,0,5.766,5.766,5.766,5.766,0,0,0-5.766-5.766Z"
                                        transform="translate(692.508 133.454)"
                                        fill="#6c63ff"
                                    />
                                    <path
                                        d="M254.367,382.632a6.246,6.246,0,0,0,0,12.493H343.74a6.246,6.246,0,0,0,0-12.493Z"
                                        transform="translate(690.25 135.424)"
                                        fill="#e6e6e6"
                                    />
                                    <path
                                        d="M254.367,408.632a6.247,6.247,0,0,0,0,12.493H343.74a6.246,6.246,0,0,0,0-12.493Z"
                                        transform="translate(690.25 134.41)"
                                        fill="#e6e6e6"
                                    />
                                    <path
                                        d="M254.367,434.632a6.247,6.247,0,0,0,0,12.493H343.74a6.246,6.246,0,0,0,0-12.493Z"
                                        transform="translate(690.25 133.527)"
                                        fill="#e6e6e6"
                                    />
                                    <path
                                        d="M474.809,396.508a7.688,7.688,0,1,1,7.688-7.688A7.688,7.688,0,0,1,474.809,396.508Zm0-13.454a5.766,5.766,0,1,0,5.766,5.766,5.766,5.766,0,0,0-5.766-5.766Z"
                                        transform="translate(682.387 135.482)"
                                        fill="#e6e6e6"
                                    />
                                    <path
                                        d="M474.809,422.508a7.688,7.688,0,1,1,7.688-7.688,7.688,7.688,0,0,1-7.688,7.688Zm0-13.454a5.766,5.766,0,1,0,5.766,5.766,5.766,5.766,0,0,0-5.766-5.766Z"
                                        transform="translate(682.387 134.469)"
                                        fill="#6c63ff"
                                    />
                                    <path
                                        d="M474.809,448.508a7.688,7.688,0,1,1,7.688-7.688A7.688,7.688,0,0,1,474.809,448.508Zm0-13.454a5.766,5.766,0,1,0,5.766,5.766,5.766,5.766,0,0,0-5.766-5.766Z"
                                        transform="translate(682.387 133.669)"
                                        fill="#e6e6e6"
                                    />
                                    <path
                                        d="M512.867,382.632a6.246,6.246,0,1,0,0,12.493H602.24a6.246,6.246,0,1,0,0-12.493Z"
                                        transform="translate(680.848 135.424)"
                                        fill="#e6e6e6"
                                    />
                                    <path
                                        d="M512.867,408.632a6.247,6.247,0,1,0,0,12.493H602.24a6.246,6.246,0,1,0,0-12.493Z"
                                        transform="translate(680.848 134.41)"
                                        fill="#e6e6e6"
                                    />
                                    <path
                                        d="M512.867,434.632a6.247,6.247,0,1,0,0,12.493H602.24a6.246,6.246,0,1,0,0-12.493Z"
                                        transform="translate(680.848 133.527)"
                                        fill="#e6e6e6"
                                    />
                                    <path
                                        d="M215.494,314.132a6.246,6.246,0,0,0,0,12.493H322.165a6.246,6.246,0,1,0,0-12.493Z"
                                        transform="translate(692.445 138.096)"
                                        fill="#e6e6e6"
                                    />
                                    <path
                                        d="M215.494,231.132a6.246,6.246,0,0,0,0,12.493H322.165a6.246,6.246,0,1,0,0-12.493Z"
                                        transform="translate(692.445 129.107)"
                                        fill="#6c63ff"
                                    />
                                    <path
                                        d="M344.984,316.456a.48.48,0,0,0-.416.721l4.079,7.064a.481.481,0,0,0,.832,0l4.079-7.064a.48.48,0,0,0-.416-.721Z"
                                        transform="translate(687.17 138.006)"
                                        fill="#6c63ff"
                                    />
                                    <path
                                        d="M474.494,314.132a6.246,6.246,0,0,0,0,12.493H581.165a6.246,6.246,0,0,0,0-12.493Z"
                                        transform="translate(682.344 138.096)"
                                        fill="#e6e6e6"
                                    />
                                    <path
                                        d="M603.984,316.456a.48.48,0,0,0-.416.721l4.079,7.064a.481.481,0,0,0,.833,0l4.078-7.064a.48.48,0,0,0-.416-.721Z"
                                        transform="translate(677.068 138.006)"
                                        fill="#6c63ff"
                                    />
                                    <ellipse
                                        cx="3.844"
                                        cy="3.844"
                                        rx="3.844"
                                        ry="3.844"
                                        transform="translate(1153.354 545.445)"
                                        fill="#6c63ff"
                                    />
                                    <ellipse
                                        cx="3.844"
                                        cy="3.844"
                                        rx="3.844"
                                        ry="3.844"
                                        transform="translate(903.975 570.562)"
                                        fill="#6c63ff"
                                    />
                                    <path
                                        d="M960.05,733.1H742.512a.809.809,0,0,1,0-1.617H960.05a.809.809,0,0,1,0,1.617Z"
                                        transform="translate(-181.703 36.347)"
                                        fill="#f2f2f2"
                                    />
                                    <path
                                        d="M621.343,540.04H511.789a8.178,8.178,0,0,1-8.168-8.169V521.3a8.178,8.178,0,0,1,8.168-8.168H621.343a8.178,8.178,0,0,1,8.168,8.168v10.571A8.178,8.178,0,0,1,621.343,540.04Z"
                                        transform="matrix(0.819, -0.574, 0.574, 0.819, -8.102, 470.589)"
                                        fill="#6c63ff"
                                    />
                                </g>
                            </svg>
                        </div>
                        <div className="space-y-2">
                            <h1 className="text-xl font-bold md:text-3xl">
                                Create an Account
                            </h1>
                            <p className="text-xs md:text-sm text-muted-foreground">
                                Join Kura Zetu to help ensure election transparency in
                                Kenya
                            </p>
                        </div>
                    </div>

                    {error &&
                    typeof error === "string" &&
                    (error.includes("Polling center not found") ||
                        error.includes("Ward not found")) ? (
                        <Alert
                            variant="destructive"
                            className="flex flex-col w-full gap-2 mt-6 text-white bg-red-500 "
                        >
                            <AlertCircle className="w-4 h-4" />
                            <AlertDescription className="w-full">
                                {JSON.stringify(error)}
                            </AlertDescription>
                            <p className="w-full text-sm text-white">
                                This could be as a result of copy pasting a link, start
                                the registration and selecting the correct station
                            </p>
                        </Alert>
                    ) : (
                        <div className="flex flex-col justify-start w-full max-w-sm mt-4 ">
                            <Form {...form}>
                                <form
                                    onSubmit={form.handleSubmit(onSubmit)}
                                    className="mt-8 space-y-6 "
                                >
                                    {/* Phone Number */}
                                    <FormField
                                        control={form.control}
                                        name="phone_number"
                                        render={({field}) => (
                                            <FormItem>
                                                <FormLabel>Phone Number</FormLabel>
                                                <FormControl>
                                                    <Input
                                                        placeholder="+254712345678"
                                                        {...field}
                                                    />
                                                </FormControl>
                                                <FormDescription className="text-xs text-gray-700 md:text-sm">
                                                    Enter your Kenyan phone number
                                                    starting with +254
                                                </FormDescription>
                                                <FormMessage className="italic text-red-800" />
                                                {error && error["phone_number"] && (
                                                    <p className="text-sm text-red-800">
                                                        {error["phone_number"]}
                                                    </p>
                                                )}
                                            </FormItem>
                                        )}
                                    />

                                    <div className="grid grid-cols-2 gap-4">
                                        <FormField
                                            control={form.control}
                                            name="first_name"
                                            render={({field}) => (
                                                <FormItem>
                                                    <FormLabel>First Name</FormLabel>
                                                    <FormControl>
                                                        <Input
                                                            placeholder=""
                                                            {...field}
                                                            maxLength={20}
                                                        />
                                                    </FormControl>
                                                    <FormMessage className="italic text-red-800" />
                                                    {error && error["first_name"] && (
                                                        <p className="text-sm text-red-800">
                                                            {error["first_name"]}
                                                        </p>
                                                    )}
                                                </FormItem>
                                            )}
                                        />

                                        <FormField
                                            control={form.control}
                                            name="last_name"
                                            render={({field}) => (
                                                <FormItem>
                                                    <FormLabel>Last Name</FormLabel>
                                                    <FormControl>
                                                        <Input
                                                            placeholder=""
                                                            {...field}
                                                            maxLength={20}
                                                        />
                                                    </FormControl>
                                                    <FormMessage className="italic text-red-800" />
                                                    {error && error["last_name"] && (
                                                        <p className="text-sm text-red-800">
                                                            {error["last_name"]}
                                                        </p>
                                                    )}
                                                </FormItem>
                                            )}
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-4 ">
                                        <FormField
                                            control={form.control}
                                            name="gender"
                                            render={({field}) => (
                                                <FormItem>
                                                    <FormLabel>Gender</FormLabel>
                                                    <Select
                                                        onValueChange={field.onChange}
                                                        defaultValue={field.value}
                                                    >
                                                        <FormControl>
                                                            <SelectTrigger>
                                                                <SelectValue placeholder="Select" />
                                                            </SelectTrigger>
                                                        </FormControl>
                                                        <SelectContent className="bg-red-200 ">
                                                            <SelectItem value="M">
                                                                Male
                                                            </SelectItem>
                                                            <SelectItem value="F">
                                                                Female
                                                            </SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                    <FormMessage className="italic text-red-800" />
                                                </FormItem>
                                            )}
                                        />

                                        <FormField
                                            control={form.control}
                                            name="age"
                                            render={({field}) => (
                                                <FormItem>
                                                    <FormLabel>Age</FormLabel>
                                                    <FormControl>
                                                        <Input
                                                            type="number"
                                                            placeholder=""
                                                            {...field}
                                                            onChange={(e) => {
                                                                field.onChange(
                                                                    e.target.value
                                                                        ? Number.parseInt(
                                                                              e.target
                                                                                  .value,
                                                                          )
                                                                        : "",
                                                                );
                                                            }}
                                                        />
                                                    </FormControl>
                                                    <FormDescription className="text-xs text-gray-700 md:text-sm">
                                                        Must be 18 or older
                                                    </FormDescription>
                                                    <FormMessage className="italic text-red-800" />
                                                </FormItem>
                                            )}
                                        />
                                    </div>

                                    <FormField
                                        control={form.control}
                                        name="role"
                                        render={({field}) => (
                                            <FormItem>
                                                <FormLabel>Your Role</FormLabel>
                                                <Select
                                                    onValueChange={field.onChange}
                                                    defaultValue={"voter"}
                                                >
                                                    <FormControl>
                                                        <SelectTrigger>
                                                            <SelectValue placeholder="Select your role" />
                                                        </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent className="bg-red-200 ">
                                                        <SelectItem value="voter">
                                                            Voter
                                                        </SelectItem>
                                                        <SelectItem value="party_agent">
                                                            Agent
                                                        </SelectItem>
                                                        <SelectItem value="candidate">
                                                            Candidate
                                                        </SelectItem>
                                                        <SelectItem value="media">
                                                            Media
                                                        </SelectItem>
                                                        <SelectItem value="observer">
                                                            Observer
                                                        </SelectItem>
                                                        <SelectItem value="election_officer">
                                                            Election Officer
                                                        </SelectItem>
                                                        <SelectItem value="party_rep">
                                                            Party Representative
                                                        </SelectItem>
                                                        <SelectItem value="other">
                                                            Other
                                                        </SelectItem>
                                                    </SelectContent>
                                                </Select>
                                                <FormDescription className="text-xs text-gray-700 md:text-sm">
                                                    Select the role that best describes
                                                    you
                                                </FormDescription>
                                                <FormMessage className="text-red-800" />
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name="password"
                                        render={({field}) => (
                                            <FormItem>
                                                <FormLabel>Password</FormLabel>
                                                <FormControl>
                                                    <Input
                                                        type="password"
                                                        placeholder="Enter password"
                                                        {...field}
                                                    />
                                                </FormControl>
                                                <FormMessage className="italic text-red-800" />
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name="confirm_password"
                                        render={({field}) => (
                                            <FormItem>
                                                <FormLabel>Confirm Password</FormLabel>
                                                <FormControl>
                                                    <Input
                                                        type="password"
                                                        placeholder="Confirm password"
                                                        {...field}
                                                    />
                                                </FormControl>
                                                <FormMessage className="italic text-red-800" />
                                            </FormItem>
                                        )}
                                    />

                                    {submitting ||
                                    form.watch("first_name") === "" ||
                                    form.watch("last_name") === "" ||
                                    form.watch("age") < 18 ||
                                    form.watch("gender") === undefined ? (
                                        <Button
                                            type="submit"
                                            className="w-full text-black bg-gray-100"
                                            disabled
                                        >
                                            {submitting ? "Registering..." : "Register"}
                                        </Button>
                                    ) : (
                                        <Button
                                            type="submit"
                                            className="w-full text-white bg-gray-800"
                                            disabled={submitting}
                                        >
                                            {submitting ? "Registering..." : "Register"}
                                        </Button>
                                    )}

                                    <div className="text-sm text-center text-muted-foreground">
                                        By registering, you agree to our{" "}
                                        <a
                                            href="#"
                                            className="underline underline-offset-4 hover:text-primary"
                                        >
                                            Terms of Service
                                        </a>{" "}
                                        and{" "}
                                        <a
                                            href="#"
                                            className="underline underline-offset-4 hover:text-primary"
                                        >
                                            Privacy Policy
                                        </a>
                                        .
                                    </div>
                                </form>
                            </Form>
                        </div>
                    )}
                </div>
            </main>

            <footer className="w-full py-6 border-t">
                <div className="container flex flex-col items-center justify-between gap-4 text-center">
                    <div className="flex items-center gap-2">
                        <Users className="w-5 h-5 text-green-600" />
                        <p className="text-sm text-muted-foreground">
                            Kura Zetu - A citizen-led election transparency platform
                        </p>
                    </div>
                </div>
            </footer>
        </div>
    );
}
