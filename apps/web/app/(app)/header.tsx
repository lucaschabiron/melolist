"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { signOut } from "../lib/auth-client";
import { SearchOverlay } from "./search-overlay";

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

    const renderLinks = (variant: "desktop" | "mobile") =>
        NAV_LINKS.map((link) => {
            const active =
                link.href === "/"
                    ? pathname === "/"
                    : pathname.startsWith(link.href);
            return (
                <Link
                    key={`${variant}-${link.href}`}
                    href={link.href}
                    className={`shrink-0 text-caption transition-colors duration-120 ${
                        active
                            ? "text-paper font-medium"
                            : "text-steel hover:text-paper"
                    }`}
                >
                    {link.label}
                </Link>
            );
        });

    return (
        <header className="border-b-[0.5px] border-(--hairline)">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 md:py-4">
                <div className="flex items-center gap-4 md:gap-8">
                    <Link href="/" aria-label="Home" className="shrink-0">
                        <Image
                            src="/logo-lockup.svg"
                            alt="MeloList"
                            width={110}
                            height={22}
                            priority
                        />
                    </Link>
                    <nav className="hidden md:flex md:gap-6 md:flex-1">
                        {renderLinks("desktop")}
                    </nav>
                    <div className="flex shrink-0 items-center gap-3 md:gap-6 ml-auto md:ml-0">
                        <SearchOverlay />
                        <button
                            onClick={handleSignOut}
                            className="shrink-0 text-caption text-steel hover:text-paper transition-colors duration-120"
                        >
                            Sign out
                        </button>
                    </div>
                </div>
                <nav className="md:hidden flex items-center gap-4 mt-3 -mx-4 px-4 overflow-x-auto h-scroll">
                    {renderLinks("mobile")}
                </nav>
            </div>
        </header>
    );
}
