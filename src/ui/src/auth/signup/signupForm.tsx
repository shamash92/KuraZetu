import "../../landing-pages/landing.css";
import "./auth.css";

import {Controller, useForm} from "react-hook-form";
import {useEffect, useRef} from "react";
import {useNavigate, useParams} from "react-router-dom";

import cookie from "react-cookies";
import {useMutation} from "@tanstack/react-query";
import {z} from "zod";
import {zodResolver} from "@hookform/resolvers/zod";

import {SIGNUP_COMPLETION_URL} from "../../api/apiUrls";
import {clearSignupFlow} from "./useSignupFlow";
import {useSignupVerificationSession} from "./SignupVerificationSession";

// Defining the form validation schema
const formSchema = z
    .object({
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
        password: z.string().min(8, "Password must be at least 8 characters long"),
        confirm_password: z
            .string()
            .min(8, "Password confirmation must be at least 8 characters long"),
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
    const {wardCode, pollingCenterCode} = useParams();
    const {clearVerificationTicket, verificationTicket} = useSignupVerificationSession();
    const hasRegistered = useRef(false);

    const csrfToken = cookie.load("csrftoken");

    // Initialize the form
    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
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
            const response = await fetch(SIGNUP_COMPLETION_URL, {
                method: "POST",
                credentials: "same-origin",
                headers: {
                    Accept: "application/json",
                    "Content-Type": "application/json",
                    "X-CSRFToken": csrfToken,
                },
                body: JSON.stringify({
                    ...values,
                    verification_ticket: verificationTicket,
                    ward_code: wardCode,
                    polling_center: pollingCenterCode,
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

            // Clearing the ticket below empties the state this screen's own
            // guard watches. Without this the guard reads the cleared ticket as
            // "never verified", sends the new account back to the code screen,
            // and the cleared ladder bounces it on to the start of signup.
            hasRegistered.current = true;

            // The ladder has served its purpose; leaving it saved would drop a
            // returning visitor back onto the summary of an account they have
            // already created.
            clearSignupFlow();
            clearVerificationTicket();

            // The success page renders only for someone arriving from here;
            // without this it also renders for anyone who opens the URL
            // directly.
            navigate("/ui/signup/accounts/registration-success/", {
                state: {justRegistered: true},
            });
        },
    });

    useEffect(() => {
        if (hasRegistered.current) return;
        if (!verificationTicket && wardCode && pollingCenterCode) {
            navigate(`/ui/signup/verify/${wardCode}/${pollingCenterCode}/`, {
                replace: true,
            });
        }
    }, [navigate, pollingCenterCode, verificationTicket, wardCode]);

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
    const firstName = form.watch("first_name");
    const lastName = form.watch("last_name");
    const gender = form.watch("gender");
    const role = form.watch("role");
    const password = form.watch("password");
    const confirmPassword = form.watch("confirm_password");

    const isFormIncomplete =
        submitting ||
        !firstName ||
        firstName.length < 2 ||
        !lastName ||
        lastName.length < 2 ||
        gender === undefined ||
        !role ||
        !password ||
        password.length < 8 ||
        !confirmPassword ||
        password !== confirmPassword;

    const {
        register,
        handleSubmit,
        formState: {errors},
    } = form;

    if (!verificationTicket) return null;

    return (
        <div className="kz-auth">
            <div className="register">
                <h2>Create an Account</h2>
                <p className="lede">
                    Your phone is confirmed. Finish setting up your Kura Zetu account.
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
                {error &&
                    typeof error === "string" &&
                    !error.includes("Polling center not found") &&
                    !error.includes("Ward not found") && (
                        <p className="otp-error" role="alert">
                            {error}
                        </p>
                    )}

                <form onSubmit={handleSubmit(onSubmit)}>
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

                    {/* Abandon the flow: drop the saved ladder so a return
                        visit starts fresh, then leave for the home page. */}
                    <button
                        className="cancel"
                        type="button"
                        disabled={submitting}
                        onClick={() => {
                            clearSignupFlow();
                            clearVerificationTicket();
                            window.location.assign("/");
                        }}
                    >
                        Cancel
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
