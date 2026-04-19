"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { signOut } from "../lib/auth-client";

const NAV_LINKS = [
    { label: "Home", href: "/" },
    { label: "Library", href: "/library" },
    { label: "Reviews", href: "/reviews" },
    { label: "Stats", href: "/stats" },
];

export function Header() {
    const router = useRouter();
    const pathname = usePathname();

    const handleSignOut = async () => {
        await signOut();
        router.replace("/login");
    };

    return (
        <header className="flex items-center gap-8 px-6 py-4 border-b-[0.5px] border-(--hairline)">
            <Link href="/" aria-label="Home">
                <Image
                    src="/logo-lockup.svg"
                    alt="MeloList"
                    width={110}
                    height={22}
                    priority
                />
            </Link>
            <nav className="flex gap-6 flex-1">
                {NAV_LINKS.map((link) => {
                    const active =
                        link.href === "/"
                            ? pathname === "/"
                            : pathname.startsWith(link.href);
                    return (
                        <Link
                            key={link.href}
                            href={link.href}
                            className={`text-caption transition-colors duration-120 ${
                                active
                                    ? "text-paper font-medium"
                                    : "text-steel hover:text-paper"
                            }`}
                        >
                            {link.label}
                        </Link>
                    );
                })}
            </nav>
            <input
                type="search"
                placeholder="Search"
                className="w-45 h-7 bg-surface rounded-sm text-paper text-caption px-3 outline-none border-[0.5px] border-(--hairline) focus:border-paper/35 transition-colors duration-120 placeholder:text-steel/60"
            />
            <button
                onClick={handleSignOut}
                className="text-caption text-steel hover:text-paper transition-colors duration-120"
            >
                Sign out
            </button>
        </header>
    );
}
