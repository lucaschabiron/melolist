"use client";

import { useId, useState, useTransition } from "react";
import { apiBaseUrl } from "../../../lib/config";
import { Avatar, Icon } from "../_components/primitives";

export type MeResponse = {
    id: string;
    handle: string | null;
    displayName: string;
    email: string;
    imageUrl: string | null;
    bio: string | null;
    location: string | null;
    isPrivate: boolean;
    pinnedReleaseGroupIds: string[];
};

const TABS = [
    { id: "profile", label: "Profile" },
    { id: "account", label: "Account" },
] as const;
type TabId = (typeof TABS)[number]["id"];

type SaveState = "idle" | "saving" | "saved" | "error";

async function patchMe(body: Record<string, unknown>) {
    const res = await fetch(new URL("users/me", apiBaseUrl), {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(`status ${res.status}`);
    return res.json();
}

function Label({
    htmlFor,
    children,
}: {
    htmlFor?: string;
    children: React.ReactNode;
}) {
    return (
        <label
            htmlFor={htmlFor}
            className="block text-micro font-medium uppercase text-steel mb-2"
            style={{ letterSpacing: "0.08em" }}
        >
            {children}
        </label>
    );
}

function FieldHint({ children }: { children: React.ReactNode }) {
    return <p className="mt-1.5 text-caption text-steel">{children}</p>;
}

function TextInput({
    id,
    value,
    onChange,
    placeholder,
    disabled,
}: {
    id?: string;
    value: string;
    onChange: (v: string) => void;
    placeholder?: string;
    disabled?: boolean;
}) {
    return (
        <input
            id={id}
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            disabled={disabled}
            className="w-full px-3 py-2.5 bg-ink border-[0.5px] border-(--hairline) rounded-sm text-paper text-body outline-none focus:border-paper/30 disabled:opacity-60 disabled:cursor-not-allowed"
            style={{ fontVariantNumeric: "tabular-nums" }}
        />
    );
}

function Textarea({
    id,
    value,
    onChange,
    placeholder,
    rows = 4,
}: {
    id?: string;
    value: string;
    onChange: (v: string) => void;
    placeholder?: string;
    rows?: number;
}) {
    return (
        <textarea
            id={id}
            rows={rows}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className="w-full px-3 py-2.5 bg-ink border-[0.5px] border-(--hairline) rounded-sm text-paper font-serif text-body outline-none resize-y focus:border-paper/30"
            style={{ lineHeight: 1.6 }}
        />
    );
}

function ToggleRow({
    label,
    description,
    checked,
    onChange,
}: {
    label: string;
    description?: string;
    checked: boolean;
    onChange: (v: boolean) => void;
}) {
    return (
        <div className="flex items-start justify-between gap-6">
            <div className="flex-1 min-w-0">
                <div className="text-body text-paper font-medium">
                    {label}
                </div>
                {description && (
                    <p className="mt-1.5 text-caption text-steel">
                        {description}
                    </p>
                )}
            </div>
            <button
                type="button"
                role="switch"
                aria-checked={checked}
                onClick={() => onChange(!checked)}
                className="relative shrink-0 w-10 h-6 rounded-full transition-colors duration-150"
                style={{
                    background: checked
                        ? "#F7F7F7"
                        : "rgba(107,107,107,0.35)",
                }}
            >
                <span
                    className="absolute top-0.5 left-0.5 w-5 h-5 rounded-full transition-transform duration-150"
                    style={{
                        background: checked ? "#0D0D0D" : "#F7F7F7",
                        transform: checked
                            ? "translateX(16px)"
                            : "translateX(0)",
                    }}
                />
            </button>
        </div>
    );
}

function SaveButton({
    state,
    dirty,
    onClick,
}: {
    state: SaveState;
    dirty: boolean;
    onClick: () => void;
}) {
    const label =
        state === "saving"
            ? "Saving…"
            : state === "saved"
              ? "Saved"
              : "Save changes";
    return (
        <button
            type="button"
            onClick={onClick}
            disabled={!dirty || state === "saving"}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-sm bg-paper text-ink text-caption font-medium cursor-pointer transition-opacity duration-120 disabled:opacity-40 disabled:cursor-not-allowed"
        >
            {state === "saved" && <Icon name="check" size={14} stroke={2} />}
            <span>{label}</span>
        </button>
    );
}

function SectionCard({
    title,
    description,
    children,
}: {
    title: string;
    description?: string;
    children: React.ReactNode;
}) {
    return (
        <section className="rounded-md border-[0.5px] border-(--hairline) bg-surface p-6 md:p-8">
            <div className="mb-6">
                <h2
                    className="text-h3 font-medium text-paper"
                    style={{ letterSpacing: "-0.005em" }}
                >
                    {title}
                </h2>
                {description && (
                    <p className="mt-1.5 text-caption text-steel">
                        {description}
                    </p>
                )}
            </div>
            {children}
        </section>
    );
}

function ProfileTab({ me }: { me: MeResponse }) {
    const bioId = useId();
    const locationId = useId();

    const [bio, setBio] = useState(me.bio ?? "");
    const [location, setLocation] = useState(me.location ?? "");
    const [state, setState] = useState<SaveState>("idle");
    const [isPending, startTransition] = useTransition();

    const dirty =
        bio !== (me.bio ?? "") ||
        location !== (me.location ?? "");

    const save = () => {
        setState("saving");
        startTransition(() => {
            void patchMe({
                bio: bio.trim() === "" ? null : bio,
                location: location.trim() === "" ? null : location,
            })
                .then(() => {
                    setState("saved");
                    setTimeout(() => setState("idle"), 1800);
                })
                .catch(() => setState("error"));
        });
    };

    return (
        <div className="flex flex-col gap-8">
            <SectionCard
                title="Profile picture"
                description="Coming soon — uploads are waiting on Cloudflare R2."
            >
                <div className="flex items-center gap-5">
                    <Avatar
                        imageUrl={me.imageUrl}
                        name={me.displayName}
                        seed={me.id}
                        size={80}
                    />
                    <div className="flex flex-col gap-2">
                        <button
                            type="button"
                            disabled
                            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-sm bg-transparent text-steel text-caption font-medium cursor-not-allowed"
                            style={{
                                border: "0.5px solid rgba(107,107,107,0.3)",
                            }}
                        >
                            Upload photo
                        </button>
                        <span className="text-micro text-steel">
                            PNG or JPG, up to 5 MB.
                        </span>
                    </div>
                </div>
            </SectionCard>

            <SectionCard title="About you">
                <div className="flex flex-col gap-6">
                    <div>
                        <Label htmlFor={bioId}>Bio</Label>
                        <Textarea
                            id={bioId}
                            value={bio}
                            onChange={setBio}
                            placeholder="A couple of sentences about the music you love."
                            rows={4}
                        />
                        <FieldHint>
                            Markdown coming later — plain text for now.
                        </FieldHint>
                    </div>
                    <div>
                        <Label htmlFor={locationId}>Location</Label>
                        <TextInput
                            id={locationId}
                            value={location}
                            onChange={setLocation}
                            placeholder="Lyon, FR"
                        />
                    </div>
                </div>
                <div className="mt-6 flex items-center justify-end gap-4">
                    {state === "error" && (
                        <span className="text-caption text-steel">
                            Couldn&apos;t save. Try again.
                        </span>
                    )}
                    <SaveButton
                        state={isPending ? "saving" : state}
                        dirty={dirty}
                        onClick={save}
                    />
                </div>
            </SectionCard>

            <SectionCard
                title="Pinned albums"
                description="The four albums that sit at the top of your profile. Pick them from your library — coming in the next pass."
            >
                <div className="rounded-sm border-[0.5px] border-dashed border-(--hairline) px-4 py-8 text-center text-caption text-steel">
                    The picker is being built. For now, pinned albums can be
                    set by writing the release-group UUIDs directly via the
                    API.
                </div>
            </SectionCard>
        </div>
    );
}

function AccountTab({ me }: { me: MeResponse }) {
    const [isPrivate, setIsPrivate] = useState(me.isPrivate);
    const [state, setState] = useState<SaveState>("idle");
    const [isPending, startTransition] = useTransition();

    const dirty = isPrivate !== me.isPrivate;

    const save = () => {
        setState("saving");
        startTransition(() => {
            void patchMe({ isPrivate })
                .then(() => {
                    setState("saved");
                    setTimeout(() => setState("idle"), 1800);
                })
                .catch(() => setState("error"));
        });
    };

    return (
        <div className="flex flex-col gap-8">
            <SectionCard
                title="Identity"
                description="Username and email are managed by better-auth — in-app editing is coming in the next pass."
            >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div>
                        <Label>Username</Label>
                        <TextInput
                            value={me.handle ?? ""}
                            onChange={() => {}}
                            disabled
                        />
                        <FieldHint>
                            Your public @handle. Lowercase only.
                        </FieldHint>
                    </div>
                    <div>
                        <Label>Email</Label>
                        <TextInput
                            value={me.email}
                            onChange={() => {}}
                            disabled
                        />
                        <FieldHint>
                            Used for verification and recovery.
                        </FieldHint>
                    </div>
                </div>
            </SectionCard>

            <SectionCard
                title="Password"
                description="Password change UI is coming in the next pass."
            >
                <button
                    type="button"
                    disabled
                    className="inline-flex items-center gap-2 px-3.5 py-2 rounded-sm bg-transparent text-steel text-caption font-medium cursor-not-allowed"
                    style={{ border: "0.5px solid rgba(107,107,107,0.3)" }}
                >
                    Change password
                </button>
            </SectionCard>

            <SectionCard title="Privacy">
                <ToggleRow
                    label="Private profile"
                    description="When on, only your display name, avatar, and handle are visible. Your library, reviews, activity, and pinned albums are hidden from other users."
                    checked={isPrivate}
                    onChange={setIsPrivate}
                />
                <div className="mt-6 flex items-center justify-end gap-4">
                    {state === "error" && (
                        <span className="text-caption text-steel">
                            Couldn&apos;t save. Try again.
                        </span>
                    )}
                    <SaveButton
                        state={isPending ? "saving" : state}
                        dirty={dirty}
                        onClick={save}
                    />
                </div>
            </SectionCard>

            <SectionCard
                title="Danger zone"
                description="Deleting your account removes your library, reviews, and activity. This can't be undone."
            >
                <button
                    type="button"
                    disabled
                    className="inline-flex items-center gap-2 px-3.5 py-2 rounded-sm bg-transparent text-steel text-caption font-medium cursor-not-allowed"
                    style={{ border: "0.5px solid rgba(107,107,107,0.3)" }}
                >
                    Delete account
                </button>
            </SectionCard>
        </div>
    );
}

export default function SettingsView({ me }: { me: MeResponse }) {
    const [tab, setTab] = useState<TabId>("profile");

    return (
        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 md:pt-16 pb-20">
            <p
                className="text-micro font-medium uppercase text-steel"
                style={{ letterSpacing: "0.18em" }}
            >
                Settings
            </p>
            <h1
                className="mt-3 text-h1 md:text-[48px] font-medium text-paper"
                style={{ letterSpacing: "-0.02em", lineHeight: 1.05 }}
            >
                Your preferences
            </h1>

            <div className="mt-8 -mx-4 sm:mx-0 px-4 sm:px-0 flex items-center gap-6 md:gap-8 overflow-x-auto h-scroll border-b-[0.5px] border-(--hairline)">
                {TABS.map((t) => {
                    const active = t.id === tab;
                    return (
                        <button
                            key={t.id}
                            onClick={() => setTab(t.id)}
                            className="shrink-0 bg-transparent border-0 cursor-pointer text-caption font-medium py-3 transition-colors duration-120"
                            style={{
                                color: active ? "#F7F7F7" : "#6B6B6B",
                                borderBottom: active
                                    ? "1px solid #F7F7F7"
                                    : "1px solid transparent",
                                marginBottom: "-1px",
                            }}
                        >
                            {t.label}
                        </button>
                    );
                })}
            </div>

            <div className="mt-10">
                {tab === "profile" && <ProfileTab me={me} />}
                {tab === "account" && <AccountTab me={me} />}
            </div>
        </main>
    );
}
