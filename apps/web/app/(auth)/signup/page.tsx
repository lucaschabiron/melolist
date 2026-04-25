"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { signUp } from "../../lib/auth-client";

type FieldErrors = {
    username?: string;
    email?: string;
    password?: string;
    form?: string;
};

export default function SignupPage() {
    const [username, setUsername] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [errors, setErrors] = useState<FieldErrors>({});
    const [loading, setLoading] = useState(false);
    const [submitted, setSubmitted] = useState(false);

    const callbackURL =
        typeof window === "undefined"
            ? undefined
            : new URL("/", window.location.origin).toString();

    const validate = (): FieldErrors => {
        const e: FieldErrors = {};
        if (username.trim().length < 3) e.username = "Choose a username.";
        if (!email.includes("@")) e.email = "Enter a valid email address.";
        if (password.length < 8)
            e.password = "Password must be at least 8 characters.";
        return e;
    };

    const handleSubmit = async (ev: React.FormEvent) => {
        ev.preventDefault();
        const normalizedUsername = username.trim().toLowerCase();
        const v = validate();
        if (Object.keys(v).length) {
            setErrors(v);
            return;
        }
        setLoading(true);
        const { error } = await signUp.email({
            email,
            password,
            name: normalizedUsername,
            username: normalizedUsername,
            callbackURL,
        });
        setLoading(false);
        if (error) {
            const errorCode = (error as { code?: string } | null)?.code;
            if (errorCode === "USERNAME_IS_ALREADY_TAKEN") {
                setErrors({ username: error.message ?? "Username is taken." });
                return;
            }

            setErrors({ form: error.message ?? "Sign up failed." });
            return;
        }
        setSubmitted(true);
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-ink p-6">
            <div className="w-full max-w-[400px]">
                <div className="mb-12 flex justify-center">
                    <Image
                        src="/logo-lockup.svg"
                        alt="MeloList"
                        width={140}
                        height={28}
                        priority
                    />
                </div>

                {submitted ? (
                    <div className="text-center py-8">
                        <div className="w-10 h-10 rounded-full bg-surface flex items-center justify-center mx-auto mb-4">
                            <svg
                                width="18"
                                height="18"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="#f7f7f7"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            >
                                <rect
                                    x="2"
                                    y="4"
                                    width="20"
                                    height="16"
                                    rx="2"
                                />
                                <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                            </svg>
                        </div>
                        <h2 className="text-h3 font-medium text-paper mb-2">
                            Check your email or sign in
                        </h2>
                        <p className="text-caption text-steel leading-[1.5] mb-6">
                            If this address can be used to create an account, a
                            verification link will arrive shortly. If you
                            already have an account, sign in instead.
                        </p>
                        <Link
                            href="/login"
                            className="text-caption text-steel hover:text-paper transition-colors duration-120 block mt-6"
                        >
                            Back to sign in
                        </Link>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} noValidate>
                        <h1 className="text-h3 font-medium text-paper mb-2 tracking-[-0.01em]">
                            Create account
                        </h1>
                        <p className="text-caption text-steel mb-8 leading-[1.4]">
                            Start cataloguing your music.
                        </p>

                        <Field
                            id="username"
                            label="Username"
                            type="text"
                            autoComplete="username"
                            placeholder="janedoe"
                            value={username}
                            error={errors.username}
                            onChange={(v) => {
                                setUsername(v);
                                setErrors((er) => ({
                                    ...er,
                                    username: undefined,
                                }));
                            }}
                        />

                        <Field
                            id="email"
                            label="Email"
                            type="email"
                            autoComplete="email"
                            placeholder="you@example.com"
                            value={email}
                            error={errors.email}
                            onChange={(v) => {
                                setEmail(v);
                                setErrors((er) => ({
                                    ...er,
                                    email: undefined,
                                }));
                            }}
                        />

                        <Field
                            id="password"
                            label="Password"
                            type="password"
                            autoComplete="new-password"
                            placeholder="••••••••"
                            value={password}
                            error={errors.password}
                            onChange={(v) => {
                                setPassword(v);
                                setErrors((er) => ({
                                    ...er,
                                    password: undefined,
                                }));
                            }}
                        />

                        {errors.form && (
                            <div className="text-micro text-paper/60 mb-3">
                                {errors.form}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-paper text-ink rounded-sm text-body font-medium py-3 mt-2 transition-opacity duration-[120ms] hover:opacity-[0.92] active:opacity-[0.85] disabled:opacity-40 disabled:cursor-default tracking-[-0.01em]"
                        >
                            {loading ? "Creating account…" : "Create account"}
                        </button>

                        <div className="flex items-center gap-3 my-6">
                            <hr className="flex-1 h-px border-0 bg-[var(--hairline)]" />
                            <span className="text-caption text-steel">or</span>
                            <hr className="flex-1 h-px border-0 bg-[var(--hairline)]" />
                        </div>

                        <div className="text-center text-caption text-steel">
                            Already have an account?{" "}
                            <Link
                                href="/login"
                                className="text-paper hover:opacity-70 transition-opacity duration-[120ms]"
                            >
                                Sign in
                            </Link>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
}

function Field({
    id,
    label,
    type,
    autoComplete,
    placeholder,
    value,
    error,
    onChange,
}: {
    id: string;
    label: string;
    type: string;
    autoComplete: string;
    placeholder: string;
    value: string;
    error?: string;
    onChange: (v: string) => void;
}) {
    return (
        <div className="flex flex-col gap-1 mb-4">
            <label
                htmlFor={id}
                className="text-caption text-steel font-medium tracking-[0.01em]"
            >
                {label}
            </label>
            <input
                id={id}
                type={type}
                autoComplete={autoComplete}
                placeholder={placeholder}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className={`w-full bg-surface rounded-sm text-paper text-body px-3 py-[11px] outline-none transition-colors duration-[120ms] border-[0.5px] ${
                    error
                        ? "border-paper/50"
                        : "border-[var(--hairline)] focus:border-paper/35"
                } placeholder:text-steel/60`}
            />
            {error && (
                <div className="text-micro text-paper/60 mt-[2px]">{error}</div>
            )}
        </div>
    );
}
