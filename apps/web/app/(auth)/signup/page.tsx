"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { signUp } from "../../lib/auth-client";

type FieldErrors = {
    username?: string;
    email?: string;
    password?: string;
    form?: string;
};

export default function SignupPage() {
    const router = useRouter();
    const [username, setUsername] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [errors, setErrors] = useState<FieldErrors>({});
    const [loading, setLoading] = useState(false);

    const validate = (): FieldErrors => {
        const e: FieldErrors = {};
        if (username.trim().length < 2) e.username = "Choose a username.";
        if (!email.includes("@")) e.email = "Enter a valid email address.";
        if (password.length < 8)
            e.password = "Password must be at least 8 characters.";
        return e;
    };

    const handleSubmit = async (ev: React.FormEvent) => {
        ev.preventDefault();
        const v = validate();
        if (Object.keys(v).length) {
            setErrors(v);
            return;
        }
        setLoading(true);
        const { error } = await signUp.email({
            email,
            password,
            name: username,
            username,
        });
        setLoading(false);
        if (error) {
            setErrors({ form: error.message ?? "Sign up failed." });
            return;
        }
        router.push("/");
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
                            setErrors((er) => ({ ...er, email: undefined }));
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
                            setErrors((er) => ({ ...er, password: undefined }));
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
