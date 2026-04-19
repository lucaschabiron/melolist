"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { signOut, useSession } from "../lib/auth-client";

export default function Home() {
    const router = useRouter();
    const { data: session, isPending } = useSession();

    const handleSignOut = async () => {
        await signOut();
        router.replace("/login");
    };

    if (isPending || !session) return null;

    return (
        <div className="min-h-screen bg-ink">
            <header className="flex items-center justify-between px-6 py-4 border-b-[0.5px] border-[var(--hairline)]">
                <Image
                    src="/logo-lockup.svg"
                    alt="MeloList"
                    width={120}
                    height={24}
                    priority
                />
                <button
                    onClick={handleSignOut}
                    className="text-caption text-steel hover:text-paper transition-colors duration-[120ms]"
                >
                    Sign out
                </button>
            </header>

            <main className="max-w-[1120px] mx-auto px-6 py-12">
                <h1 className="text-h2 font-medium text-paper tracking-[-0.01em] mb-2">
                    Welcome, {session.user.name}
                </h1>
                <p className="text-caption text-steel mb-8">
                    {session.user.email}
                </p>
            </main>
        </div>
    );
}
