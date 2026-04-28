"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { signOut, useSession } from "../lib/auth-client";
import { Avatar, Icon } from "./_components/primitives";
import { SearchOverlay } from "./search-overlay";

const NAV_LINKS = [
    { label: "Home", href: "/" },
    { label: "Library", href: "/library" },
    { label: "Reviews", href: "/reviews" },
];

type SessionUser = {
    id: string;
    name: string;
    image?: string | null;
    username?: string | null;
};

function ProfileMenu({
    user,
    onSignOut,
}: {
    user: SessionUser;
    onSignOut: () => void | Promise<void>;
}) {
    const [open, setOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const publicHandle = user.username ?? user.name;

    useEffect(() => {
        if (!open) return;
        const onDocClick = (event: MouseEvent) => {
            if (
                containerRef.current &&
                !containerRef.current.contains(event.target as Node)
            ) {
                setOpen(false);
            }
        };
        const onKey = (event: globalThis.KeyboardEvent) => {
            if (event.key === "Escape") setOpen(false);
        };
        document.addEventListener("mousedown", onDocClick);
        document.addEventListener("keydown", onKey);
        return () => {
            document.removeEventListener("mousedown", onDocClick);
            document.removeEventListener("keydown", onKey);
        };
    }, [open]);

    const profileHref = user.username
        ? `/profile/${user.username}`
        : "/settings";

    return (
        <div className="relative" ref={containerRef}>
            <button
                type="button"
                aria-label="Open profile menu"
                aria-expanded={open}
                onClick={() => setOpen((v) => !v)}
                className="flex h-9 w-9 items-center justify-center rounded-full border-[0.5px] border-(--hairline) bg-transparent transition-colors duration-120 hover:border-paper/30"
            >
                <Avatar
                    imageUrl={user.image ?? null}
                    name={publicHandle}
                    seed={user.id}
                    size={30}
                />
            </button>

            {open && (
                <div
                    role="menu"
                    className="absolute right-0 z-50 mt-2 min-w-50 rounded-md border-[0.5px] border-(--hairline) bg-surface p-1.5 shadow-[0_16px_42px_rgba(0,0,0,0.3)]"
                >
                    <div className="px-3 py-2 border-b-[0.5px] border-(--hairline) mb-1">
                        <div className="truncate text-caption font-medium text-paper">
                            {publicHandle}
                        </div>
                    </div>
                    <MenuItem
                        href={profileHref}
                        icon="user"
                        label="Profile"
                        onSelect={() => setOpen(false)}
                    />
                    <MenuItem
                        href="/settings"
                        icon="settings"
                        label="Settings"
                        onSelect={() => setOpen(false)}
                    />
                    <button
                        type="button"
                        role="menuitem"
                        onClick={() => {
                            setOpen(false);
                            void onSignOut();
                        }}
                        className="mt-0.5 flex w-full items-center gap-2.5 rounded-sm px-3 py-2 text-caption font-medium text-steel transition-colors duration-120 hover:bg-paper/4 hover:text-paper"
                    >
                        <Icon name="logout" size={14} stroke={1.5} />
                        <span>Log out</span>
                    </button>
                </div>
            )}
        </div>
    );
}

function MenuItem({
    href,
    icon,
    label,
    onSelect,
}: {
    href: string;
    icon: "user" | "settings";
    label: string;
    onSelect: () => void;
}) {
    return (
        <Link
            href={href}
            role="menuitem"
            onClick={onSelect}
            className="flex items-center gap-2.5 rounded-sm px-3 py-2 text-caption font-medium text-steel no-underline transition-colors duration-120 hover:bg-paper/4 hover:text-paper"
        >
            <Icon name={icon} size={14} stroke={1.5} />
            <span>{label}</span>
        </Link>
    );
}

export function Header() {
    const router = useRouter();
    const pathname = usePathname();
    const { data: session } = useSession();

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
                        {session?.user ? (
                            <ProfileMenu
                                user={session.user as SessionUser}
                                onSignOut={handleSignOut}
                            />
                        ) : (
                            <button
                                onClick={() => router.replace("/login")}
                                className="shrink-0 text-caption text-steel hover:text-paper transition-colors duration-120"
                            >
                                Sign in
                            </button>
                        )}
                    </div>
                </div>
                <nav className="md:hidden flex items-center gap-4 mt-3 -mx-4 px-4 overflow-x-auto h-scroll">
                    {renderLinks("mobile")}
                </nav>
            </div>
        </header>
    );
}
