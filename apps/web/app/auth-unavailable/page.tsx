import Link from "next/link";

export default function AuthUnavailablePage() {
    return (
        <main className="min-h-screen bg-ink text-paper flex items-center justify-center p-6">
            <div className="w-full max-w-[420px] rounded-md border-[0.5px] border-[var(--hairline)] bg-surface p-6">
                <h1 className="text-h3 font-medium tracking-[-0.01em]">
                    Authentication is temporarily unavailable
                </h1>
                <p className="mt-3 text-body text-steel leading-[1.6]">
                    MeloList could not verify your session. This usually means
                    the authentication service is down or unreachable. Retry in
                    a moment.
                </p>
                <div className="mt-6 flex gap-4 text-caption">
                    <Link
                        href="/"
                        className="text-paper hover:opacity-70 transition-opacity duration-[120ms]"
                    >
                        Retry
                    </Link>
                    <Link
                        href="/login"
                        className="text-steel hover:text-paper transition-colors duration-[120ms]"
                    >
                        Go to sign in
                    </Link>
                </div>
            </div>
        </main>
    );
}
