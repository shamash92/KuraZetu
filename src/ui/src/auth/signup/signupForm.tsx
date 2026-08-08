import "../../landing-pages/landing.css";
import "./auth.css";

import {Controller, useForm} from "react-hook-form";
import {useNavigate, useParams} from "react-router-dom";

import cookie from "react-cookies";
import {useMutation} from "@tanstack/react-query";
import {z} from "zod";
import {zodResolver} from "@hookform/resolvers/zod";

import {SIGNUP_URL} from "../../api/apiUrls";

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
                invalid_type_error: "Age must be a number",
            })
            .min(18, "You must be at least 18 years old to register")
            .max(100, "Are you sure you are this old and using a smartphone?")
            .optional(),
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

// The API answers 200 with an `error` key rather than an HTTP error status, so
// the mutation throws one of these to put the response where `onError` and the
// field-level messages below can read it.
interface SignupFailure extends Error {
    detail?: unknown;
}

interface SignupSuccess {
    message?: string;
    data?: {token?: string};
}

export default function SignupForm() {
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

    const signupMutation = useMutation({
        mutationFn: async (values: FormValues): Promise<SignupSuccess> => {
            const response = await fetch(SIGNUP_URL, {
                method: "POST",
                credentials: "same-origin",
                headers: {
                    Accept: "application/json",
                    "Content-Type": "application/json",
                    "X-CSRFToken": csrfToken,
                },
                body: JSON.stringify({
                    data: {...values, polling_center: pollingCenterCode},
                    ward_code: wardCode,
                }),
            });

            const data = await response.json().catch(() => null);

            if (!response.ok) {
                // "Ward not found" is the one failure the API reports with a
                // status rather than a 200 body, and it carries no `details`.
                throw Object.assign(
                    new Error(String(data?.error ?? "Could not complete registration")),
                    {detail: data?.details ?? data?.error},
                ) as SignupFailure;
            }

            if (data?.error) {
                // "Polling center not found" is shown as-is; anything else
                // carries per-field messages under `details`.
                throw Object.assign(new Error(String(data.error)), {
                    detail:
                        data.error === "Polling center not found"
                            ? data.error
                            : data.details,
                }) as SignupFailure;
            }

            return data;
        },

        onSuccess: (data) => {
            if (data?.message !== "User signup successful") return;

            const token = data.data?.token;
            if (typeof token !== "string" || token.length === 0) return;

            localStorage.setItem("token", token);
            cookie.save("token", token, {
                path: "/",
                secure: true, // Ensures the cookie is sent over HTTPS only
                httpOnly: false, // Prevents JavaScript from accessing the cookie (set to true if possible)
                sameSite: "Strict", // Prevents the cookie from being sent with cross-site requests
            });

            // The success page renders only for someone arriving from here;
            // without this it also renders for anyone who opens the URL
            // directly.
            navigate("/ui/signup/accounts/registration-success/", {
                state: {justRegistered: true},
            });
        },
    });

    // What the markup below reads: a plain string for whole-form problems, or
    // the per-field object the API returns under `details`.
    const failure = signupMutation.error as SignupFailure | null;
    const error = failure ? (failure.detail ?? failure.message) : null;
    const submitting = signupMutation.isPending;

    function onSubmit(data: FormValues) {
        signupMutation.mutate(data);
    }

    // Strict gate: every required field must be valid before Register enables.
    // Age is the only optional field.
    const phone = form.watch("phone_number");
    const firstName = form.watch("first_name");
    const lastName = form.watch("last_name");
    const gender = form.watch("gender");
    const role = form.watch("role");
    const password = form.watch("password");
    const confirmPassword = form.watch("confirm_password");

    const isFormIncomplete =
        submitting ||
        !/^\+254[0-9]{9}$/.test(phone ?? "") ||
        !firstName ||
        firstName.length < 2 ||
        !lastName ||
        lastName.length < 2 ||
        gender === undefined ||
        !role ||
        !password ||
        password.length < 4 ||
        !confirmPassword ||
        password !== confirmPassword;

    const {
        register,
        handleSubmit,
        formState: {errors},
    } = form;

    return (
        <div className="kz-auth">
            <div className="register">
                <h2>Create an Account</h2>
                <p className="lede">
                    Join Kura Zetu to help ensure election transparency in Kenya
                </p>

                {/* Error alert for polling center / ward not found */}
                {error &&
                    typeof error === "string" &&
                    (error.includes("Polling center not found") ||
                        error.includes("Ward not found")) && (
                        <div className="alert">
                            <strong>{error}</strong>
                            <p style={{margin: "6px 0 0", fontSize: "13px"}}>
                                This could be as a result of copy pasting a link, start
                                the registration and selecting the correct station
                            </p>
                        </div>
                    )}

                <form onSubmit={handleSubmit(onSubmit)}>
                    {/* Phone Number */}
                    <div className="field">
                        <span className="label">Phone Number</span>
                        <div className="phone-input">
                            <div className="prefix">
                                <span className="flag" />
                                +254
                            </div>
                            <Controller
                                control={form.control}
                                name="phone_number"
                                render={({field}) => (
                                    <input
                                        placeholder="712 345 678"
                                        inputMode="numeric"
                                        value={field.value.replace(/^\+254/, "")}
                                        onChange={(e) => {
                                            const digits = e.target.value
                                                .replace(/\D/g, "")
                                                .slice(0, 9);
                                            field.onChange("+254" + digits);
                                        }}
                                    />
                                )}
                            />
                        </div>
                        <div className="note-box">
                            <b>NOTE:</b> You can use any number for now if you want. We
                            are deliberately not using OTP. Just know at some point in
                            future, your account number will have to be verified.
                        </div>
                        {errors.phone_number && (
                            <span
                                style={{
                                    fontStyle: "italic",
                                    color: "var(--red)",
                                    fontSize: "12px",
                                }}
                            >
                                {errors.phone_number.message}
                            </span>
                        )}
                        {error &&
                            (error as unknown as Record<string, string>)[
                                "phone_number"
                            ] && (
                                <p
                                    style={{
                                        fontSize: "13px",
                                        color: "var(--red)",
                                        margin: 0,
                                    }}
                                >
                                    {
                                        (error as unknown as Record<string, string>)[
                                            "phone_number"
                                        ]
                                    }
                                </p>
                            )}
                    </div>

                    {/* First + Last Name */}
                    <div className="field-2">
                        <div className="field">
                            <span className="label">First Name</span>
                            <input
                                className="inp"
                                placeholder=""
                                maxLength={20}
                                {...register("first_name")}
                            />
                            {errors.first_name && (
                                <span
                                    style={{
                                        fontStyle: "italic",
                                        color: "var(--red)",
                                        fontSize: "12px",
                                    }}
                                >
                                    {errors.first_name.message}
                                </span>
                            )}
                            {error &&
                                (error as unknown as Record<string, string>)[
                                    "first_name"
                                ] && (
                                    <p
                                        style={{
                                            fontSize: "13px",
                                            color: "var(--red)",
                                            margin: 0,
                                        }}
                                    >
                                        {
                                            (
                                                error as unknown as Record<
                                                    string,
                                                    string
                                                >
                                            )["first_name"]
                                        }
                                    </p>
                                )}
                        </div>

                        <div className="field">
                            <span className="label">Last Name</span>
                            <input
                                className="inp"
                                placeholder=""
                                maxLength={20}
                                {...register("last_name")}
                            />
                            {errors.last_name && (
                                <span
                                    style={{
                                        fontStyle: "italic",
                                        color: "var(--red)",
                                        fontSize: "12px",
                                    }}
                                >
                                    {errors.last_name.message}
                                </span>
                            )}
                            {error &&
                                (error as unknown as Record<string, string>)[
                                    "last_name"
                                ] && (
                                    <p
                                        style={{
                                            fontSize: "13px",
                                            color: "var(--red)",
                                            margin: 0,
                                        }}
                                    >
                                        {
                                            (
                                                error as unknown as Record<
                                                    string,
                                                    string
                                                >
                                            )["last_name"]
                                        }
                                    </p>
                                )}
                        </div>
                    </div>

                    {/* Gender + Age */}
                    <div className="field-2">
                        <div className="field">
                            <span className="label">Gender</span>
                            <div className="sel-wrap">
                                <Controller
                                    control={form.control}
                                    name="gender"
                                    render={({field}) => (
                                        <select
                                            className="sel"
                                            value={field.value ?? ""}
                                            onChange={(e) =>
                                                field.onChange(e.target.value)
                                            }
                                        >
                                            <option value="" disabled>
                                                Select
                                            </option>
                                            <option value="M">Male</option>
                                            <option value="F">Female</option>
                                        </select>
                                    )}
                                />
                                <svg
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2.4"
                                    strokeLinecap="round"
                                >
                                    <path d="M6 9l6 6 6-6" />
                                </svg>
                            </div>
                            {errors.gender && (
                                <span
                                    style={{
                                        fontStyle: "italic",
                                        color: "var(--red)",
                                        fontSize: "12px",
                                    }}
                                >
                                    {errors.gender.message}
                                </span>
                            )}
                        </div>

                        <div className="field">
                            <span className="label">Age</span>
                            <input
                                className="inp"
                                type="number"
                                placeholder="18"
                                {...register("age", {
                                    setValueAs: (v) =>
                                        v === "" ? undefined : Number.parseInt(v),
                                })}
                            />
                            <span className="help">Must be 18 or older</span>
                            {errors.age && (
                                <span
                                    style={{
                                        fontStyle: "italic",
                                        color: "var(--red)",
                                        fontSize: "12px",
                                    }}
                                >
                                    {errors.age.message}
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Role */}
                    <div className="field">
                        <span className="label">Your Role</span>
                        <div className="sel-wrap">
                            <Controller
                                control={form.control}
                                name="role"
                                render={({field}) => (
                                    <select
                                        className="sel"
                                        value={field.value ?? "voter"}
                                        onChange={(e) => field.onChange(e.target.value)}
                                    >
                                        <option value="voter">Voter</option>
                                        <option value="party_agent">Agent</option>
                                        <option value="candidate">Candidate</option>
                                        <option value="media">Media</option>
                                        <option value="observer">Observer</option>
                                        <option value="election_officer">
                                            Election Officer
                                        </option>
                                        <option value="party_rep">
                                            Party Representative
                                        </option>
                                        <option value="other">Other</option>
                                    </select>
                                )}
                            />
                            <svg
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2.4"
                                strokeLinecap="round"
                            >
                                <path d="M6 9l6 6 6-6" />
                            </svg>
                        </div>
                        <span className="help">
                            Select the role that best describes you
                        </span>
                        {errors.role && (
                            <span
                                style={{
                                    color: "var(--red)",
                                    fontSize: "12px",
                                }}
                            >
                                {errors.role.message}
                            </span>
                        )}
                    </div>

                    {/* Password + Confirm Password */}
                    <div className="field-2">
                        <div className="field">
                            <span className="label">Password</span>
                            <input
                                className="inp"
                                type="password"
                                placeholder="Enter password"
                                {...register("password")}
                            />
                            {errors.password && (
                                <span
                                    style={{
                                        fontStyle: "italic",
                                        color: "var(--red)",
                                        fontSize: "12px",
                                    }}
                                >
                                    {errors.password.message}
                                </span>
                            )}
                        </div>

                        <div className="field">
                            <span className="label">Confirm Password</span>
                            <input
                                className="inp"
                                type="password"
                                placeholder="Confirm password"
                                {...register("confirm_password")}
                            />
                            {errors.confirm_password && (
                                <span
                                    style={{
                                        fontStyle: "italic",
                                        color: "var(--red)",
                                        fontSize: "12px",
                                    }}
                                >
                                    {errors.confirm_password.message}
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Submit */}
                    <button
                        className="submit"
                        type="submit"
                        disabled={isFormIncomplete}
                    >
                        {submitting ? "Registering…" : "Register"}
                        <svg
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2.4"
                            strokeLinecap="round"
                        >
                            <path d="M5 12h14M13 6l6 6-6 6" />
                        </svg>
                    </button>

                    {/* Legal note */}
                    <p className="terms">
                        By registering, you agree to our{" "}
                        <a href="#">Terms of Service</a> and{" "}
                        <a href="#">Privacy Policy</a>.
                    </p>
                </form>
            </div>
        </div>
    );
}
