"use client";

import { useRouter } from "next/navigation";
import {
    useCallback,
    useEffect,
    useId,
    useRef,
    useState,
    useTransition,
} from "react";
import { apiBaseUrl } from "../../../lib/config";
import { authClient } from "../../lib/auth-client";
import { Avatar, CoverArt, Icon } from "../_components/primitives";

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

const MAX_PINNED = 4;

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

async function uploadAvatar(file: File): Promise<{ imageUrl: string }> {
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch(new URL("users/me/avatar", apiBaseUrl), {
        method: "POST",
        credentials: "include",
        body: fd,
    });
    if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as {
            error?: string;
        };
        throw new Error(data.error ?? `upload failed (${res.status})`);
    }
    return res.json();
}

async function deleteAvatar() {
    const res = await fetch(new URL("users/me/avatar", apiBaseUrl), {
        method: "DELETE",
        credentials: "include",
    });
    if (!res.ok) throw new Error(`status ${res.status}`);
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
    type = "text",
    autoComplete,
}: {
    id?: string;
    value: string;
    onChange: (v: string) => void;
    placeholder?: string;
    disabled?: boolean;
    type?: string;
    autoComplete?: string;
}) {
    return (
        <input
            id={id}
            type={type}
            autoComplete={autoComplete}
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
                <div className="text-body text-paper font-medium">{label}</div>
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
                    background: checked ? "#F7F7F7" : "rgba(107,107,107,0.35)",
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
    label,
}: {
    state: SaveState;
    dirty: boolean;
    onClick: () => void;
    label?: string;
}) {
    const text =
        state === "saving"
            ? "Saving…"
            : state === "saved"
              ? "Saved"
              : (label ?? "Save changes");
    return (
        <button
            type="button"
            onClick={onClick}
            disabled={!dirty || state === "saving"}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-sm bg-paper text-ink text-caption font-medium cursor-pointer transition-opacity duration-120 disabled:opacity-40 disabled:cursor-not-allowed"
        >
            {state === "saved" && <Icon name="check" size={14} stroke={2} />}
            <span>{text}</span>
        </button>
    );
}

function GhostButton({
    onClick,
    disabled,
    children,
}: {
    onClick?: () => void;
    disabled?: boolean;
    children: React.ReactNode;
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            disabled={disabled}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-sm bg-transparent text-paper text-caption font-medium cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed transition-[border-color,opacity] duration-120"
            style={{ border: "0.5px solid rgba(107,107,107,0.5)" }}
        >
            {children}
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

function AvatarSection({ me }: { me: MeResponse }) {
    const router = useRouter();
    const [imageUrl, setImageUrl] = useState(me.imageUrl);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const fileRef = useRef<HTMLInputElement>(null);

    const onPick = () => fileRef.current?.click();

    const onFile = async (ev: React.ChangeEvent<HTMLInputElement>) => {
        const file = ev.target.files?.[0];
        ev.target.value = "";
        if (!file) return;
        setBusy(true);
        setError(null);
        try {
            const result = await uploadAvatar(file);
            setImageUrl(result.imageUrl);
            router.refresh();
        } catch (err) {
            setError(err instanceof Error ? err.message : "Upload failed.");
        } finally {
            setBusy(false);
        }
    };

    const onRemove = async () => {
        setBusy(true);
        setError(null);
        try {
            await deleteAvatar();
            setImageUrl(null);
            router.refresh();
        } catch {
            setError("Could not remove the photo.");
        } finally {
            setBusy(false);
        }
    };

    return (
        <SectionCard
            title="Profile picture"
            description="A square photo. Anything else will be cropped from the center."
        >
            <div className="flex items-center gap-5">
                <Avatar
                    imageUrl={imageUrl}
                    name={me.displayName}
                    seed={me.id}
                    size={80}
                />
                <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-2">
                        <GhostButton onClick={onPick} disabled={busy}>
                            <Icon name="edit" size={14} stroke={1.5} />
                            <span>{busy ? "Working…" : "Upload photo"}</span>
                        </GhostButton>
                        {imageUrl && (
                            <button
                                type="button"
                                onClick={onRemove}
                                disabled={busy}
                                className="text-caption text-steel hover:text-paper disabled:opacity-50 transition-colors duration-120"
                            >
                                Remove
                            </button>
                        )}
                    </div>
                    <span className="text-micro text-steel">
                        PNG, JPG, WebP, or AVIF · up to 5 MB · resized to
                        512×512 WebP.
                    </span>
                    {error && (
                        <span className="text-micro text-paper/60">
                            {error}
                        </span>
                    )}
                </div>
                <input
                    ref={fileRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/avif,image/gif"
                    className="hidden"
                    onChange={onFile}
                />
            </div>
        </SectionCard>
    );
}

type SearchHit = {
    mbid: string;
    title: string;
    artistCredit: string;
    firstReleaseDate: string | null;
    coverArtUrl: string | null;
    releaseType: string;
};

type ResolvedPin = SearchHit;

async function searchReleaseGroups(q: string): Promise<SearchHit[]> {
    const res = await fetch(
        `${apiBaseUrl}catalog/search/release-groups?q=${encodeURIComponent(q)}`,
        { credentials: "include" },
    );
    if (!res.ok) throw new Error(`search failed (${res.status})`);
    const data = (await res.json()) as {
        releaseGroups: SearchHit[];
    };
    return data.releaseGroups;
}

async function resolveReleaseGroupByMbid(
    mbid: string,
): Promise<ResolvedPin | null> {
    const res = await fetch(
        new URL(`catalog/release-groups/${mbid}`, apiBaseUrl),
        { credentials: "include", cache: "no-store" },
    );
    if (!res.ok) return null;
    const data = (await res.json()) as {
        releaseGroup?: {
            musicbrainzId: string;
            title: string;
            primaryArtistCredit: string;
            firstReleaseDate: string | null;
            coverArtUrl: string | null;
            releaseType: string;
        };
    };
    if (!data.releaseGroup) return null;
    return {
        mbid: data.releaseGroup.musicbrainzId,
        title: data.releaseGroup.title,
        artistCredit: data.releaseGroup.primaryArtistCredit,
        firstReleaseDate: data.releaseGroup.firstReleaseDate,
        coverArtUrl: data.releaseGroup.coverArtUrl,
        releaseType: data.releaseGroup.releaseType,
    };
}

function CoverThumb({ item, size = 56 }: { item: ResolvedPin; size?: number }) {
    return (
        <CoverArt
            src={item.coverArtUrl}
            title={item.title}
            seed={item.mbid}
            size={size}
            radius={4}
        />
    );
}

function PinSlotPicker({
    onPick,
    onCancel,
}: {
    onPick: (item: SearchHit) => void;
    onCancel: () => void;
}) {
    const [query, setQuery] = useState("");
    const [debounced, setDebounced] = useState("");
    const [hits, setHits] = useState<SearchHit[] | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const t = window.setTimeout(() => setDebounced(query.trim()), 300);
        return () => window.clearTimeout(t);
    }, [query]);

    useEffect(() => {
        if (debounced.length < 2) {
            setHits(null);
            setError(null);
            setLoading(false);
            return;
        }
        const ctrl = new AbortController();
        setLoading(true);
        setError(null);
        searchReleaseGroups(debounced)
            .then((results) => {
                if (ctrl.signal.aborted) return;
                setHits(results);
            })
            .catch(() => {
                if (ctrl.signal.aborted) return;
                setError("Search failed. Try again.");
            })
            .finally(() => {
                if (!ctrl.signal.aborted) setLoading(false);
            });
        return () => ctrl.abort();
    }, [debounced]);

    return (
        <div className="rounded-sm border-[0.5px] border-(--hairline) bg-ink p-3">
            <div className="flex items-center gap-2">
                <Icon name="search" size={14} stroke={1.5} />
                <input
                    autoFocus
                    type="search"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search albums…"
                    className="flex-1 bg-transparent text-body text-paper outline-none placeholder:text-steel"
                />
                <button
                    type="button"
                    onClick={onCancel}
                    className="text-steel hover:text-paper transition-colors duration-120"
                    aria-label="Cancel"
                >
                    <Icon name="x" size={14} stroke={1.5} />
                </button>
            </div>
            {debounced.length >= 2 && (
                <div className="mt-3 max-h-72 overflow-y-auto">
                    {loading && (
                        <div className="px-2 py-3 text-caption text-steel">
                            Searching…
                        </div>
                    )}
                    {error && (
                        <div className="px-2 py-3 text-caption text-steel">
                            {error}
                        </div>
                    )}
                    {!loading && !error && hits && hits.length === 0 && (
                        <div className="px-2 py-3 text-caption text-steel">
                            No albums found.
                        </div>
                    )}
                    {!loading &&
                        !error &&
                        hits?.map((hit) => {
                            const year = hit.firstReleaseDate?.slice(0, 4);
                            return (
                                <button
                                    type="button"
                                    key={hit.mbid}
                                    onClick={() => onPick(hit)}
                                    className="w-full text-left flex items-center gap-3 px-2 py-2 rounded-sm hover:bg-paper/4 transition-colors duration-120"
                                >
                                    <CoverThumb item={hit} size={40} />
                                    <div className="min-w-0 flex-1">
                                        <div className="truncate text-body font-medium text-paper">
                                            {hit.title}
                                        </div>
                                        <div className="truncate text-caption text-steel">
                                            {hit.artistCredit}
                                            {year ? ` · ${year}` : ""}
                                        </div>
                                    </div>
                                </button>
                            );
                        })}
                </div>
            )}
        </div>
    );
}

function PinSlot({
    index,
    item,
    canMoveUp,
    canMoveDown,
    onPick,
    onClear,
    onMoveUp,
    onMoveDown,
}: {
    index: number;
    item: ResolvedPin | null;
    canMoveUp: boolean;
    canMoveDown: boolean;
    onPick: (item: SearchHit) => void;
    onClear: () => void;
    onMoveUp: () => void;
    onMoveDown: () => void;
}) {
    const [picking, setPicking] = useState(false);

    if (picking) {
        return (
            <PinSlotPicker
                onPick={(hit) => {
                    onPick(hit);
                    setPicking(false);
                }}
                onCancel={() => setPicking(false)}
            />
        );
    }

    if (!item) {
        return (
            <button
                type="button"
                onClick={() => setPicking(true)}
                className="w-full flex items-center gap-3 px-3 py-3 rounded-sm border-[0.5px] border-dashed border-(--hairline) text-steel hover:text-paper hover:border-paper/30 transition-colors duration-120 cursor-pointer"
            >
                <div
                    className="w-14 h-14 rounded-sm flex items-center justify-center shrink-0"
                    style={{ background: "rgba(107,107,107,0.1)" }}
                >
                    <Icon name="plus" size={16} stroke={1.5} />
                </div>
                <span className="text-caption font-medium">
                    Add pin {index + 1}
                </span>
            </button>
        );
    }

    const year = item.firstReleaseDate?.slice(0, 4);
    return (
        <div className="flex items-center gap-3 px-3 py-3 rounded-sm bg-ink border-[0.5px] border-(--hairline)">
            <CoverThumb item={item} size={56} />
            <div className="min-w-0 flex-1">
                <div className="truncate text-body font-medium text-paper">
                    {item.title}
                </div>
                <div className="truncate text-caption text-steel">
                    {item.artistCredit}
                    {year ? ` · ${year}` : ""}
                </div>
            </div>
            <div className="flex items-center gap-1 shrink-0">
                <IconBtn
                    label="Move up"
                    disabled={!canMoveUp}
                    onClick={onMoveUp}
                >
                    <ChevUp />
                </IconBtn>
                <IconBtn
                    label="Move down"
                    disabled={!canMoveDown}
                    onClick={onMoveDown}
                >
                    <ChevDown />
                </IconBtn>
                <IconBtn label="Replace" onClick={() => setPicking(true)}>
                    <Icon name="edit" size={13} stroke={1.5} />
                </IconBtn>
                <IconBtn label="Remove" onClick={onClear}>
                    <Icon name="x" size={14} stroke={1.5} />
                </IconBtn>
            </div>
        </div>
    );
}

function IconBtn({
    label,
    disabled,
    onClick,
    children,
}: {
    label: string;
    disabled?: boolean;
    onClick: () => void;
    children: React.ReactNode;
}) {
    return (
        <button
            type="button"
            aria-label={label}
            onClick={onClick}
            disabled={disabled}
            className="w-7 h-7 inline-flex items-center justify-center rounded-sm text-steel hover:text-paper hover:bg-paper/4 disabled:opacity-30 disabled:cursor-not-allowed transition-colors duration-120 cursor-pointer"
        >
            {children}
        </button>
    );
}

function ChevUp() {
    return (
        <svg
            width="13"
            height="13"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="m18 15-6-6-6 6" />
        </svg>
    );
}

function ChevDown() {
    return (
        <svg
            width="13"
            height="13"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="m6 9 6 6 6-6" />
        </svg>
    );
}

function PinnedAlbumsCard({ me }: { me: MeResponse }) {
    const [pins, setPins] = useState<Array<ResolvedPin | null>>(() =>
        Array(MAX_PINNED).fill(null),
    );
    const [loading, setLoading] = useState(true);
    const [state, setState] = useState<SaveState>("idle");
    const requestSeq = useRef(0);

    useEffect(() => {
        let cancelled = false;
        (async () => {
            const ids = me.pinnedReleaseGroupIds.slice(0, MAX_PINNED);
            const resolved = await Promise.all(
                ids.map((id) => resolveReleaseGroupByMbid(id)),
            );
            if (cancelled) return;
            const next: Array<ResolvedPin | null> =
                Array(MAX_PINNED).fill(null);
            resolved.forEach((r, i) => {
                next[i] = r;
            });
            setPins(next);
            setLoading(false);
            setState("idle");
        })();
        return () => {
            cancelled = true;
        };
    }, [me.pinnedReleaseGroupIds]);

    const compactPins = (items: Array<ResolvedPin | null>) => {
        const filled = items.filter((pin): pin is ResolvedPin => pin !== null);
        const next: Array<ResolvedPin | null> = Array(MAX_PINNED).fill(null);
        filled.forEach((pin, i) => {
            next[i] = pin;
        });
        return next;
    };

    const pinIds = (items: Array<ResolvedPin | null>) =>
        items
            .filter((pin): pin is ResolvedPin => pin !== null)
            .map((p) => p.mbid);

    const commitPins = (
        next: Array<ResolvedPin | null>,
        previous: Array<ResolvedPin | null>,
    ) => {
        setPins(next);
        setState("saving");
        const requestId = requestSeq.current + 1;
        requestSeq.current = requestId;
        void patchMe({ pinnedReleaseGroupIds: pinIds(next) })
            .then(() => {
                if (requestId !== requestSeq.current) return;
                setState("saved");
                window.setTimeout(() => {
                    if (requestId === requestSeq.current) setState("idle");
                }, 1400);
            })
            .catch(() => {
                if (requestId !== requestSeq.current) return;
                setPins(previous);
                setState("error");
            });
    };

    const moveUp = (idx: number) => {
        if (idx === 0) return;
        const previous = pins;
        const next = [...pins];
        [next[idx - 1], next[idx]] = [next[idx]!, next[idx - 1]!];
        commitPins(next, previous);
    };

    const moveDown = (idx: number) => {
        if (idx >= MAX_PINNED - 1) return;
        const previous = pins;
        const next = [...pins];
        [next[idx + 1], next[idx]] = [next[idx]!, next[idx + 1]!];
        commitPins(next, previous);
    };

    const onPick = (idx: number, hit: SearchHit) => {
        if (pins.some((p) => p?.mbid === hit.mbid)) return;
        const previous = pins;
        const next = [...pins];
        next[idx] = hit;
        commitPins(next, previous);
    };

    return (
        <SectionCard
            title="Pinned albums"
            description={`Up to ${MAX_PINNED} albums shown on your profile.`}
        >
            {loading ? (
                <div className="rounded-sm border-[0.5px] border-(--hairline) bg-ink px-4 py-6 text-caption text-steel text-center">
                    Loading your pins…
                </div>
            ) : (
                <div className="flex flex-col gap-3">
                    {pins.map((pin, i) => (
                        <PinSlot
                            key={i}
                            index={i}
                            item={pin}
                            canMoveUp={i > 0 && pin !== null}
                            canMoveDown={
                                i < MAX_PINNED - 1 &&
                                pin !== null &&
                                pins[i + 1] !== null
                            }
                            onPick={(hit) => onPick(i, hit)}
                            onClear={() => {
                                const previous = pins;
                                const next = [...pins];
                                next[i] = null;
                                commitPins(compactPins(next), previous);
                            }}
                            onMoveUp={() => moveUp(i)}
                            onMoveDown={() => moveDown(i)}
                        />
                    ))}
                </div>
            )}
            <div className="mt-4 min-h-4 text-right">
                {state === "saving" && (
                    <span className="text-caption text-steel">Saving…</span>
                )}
                {state === "saved" && (
                    <span className="text-caption text-steel">Saved</span>
                )}
                {state === "error" && (
                    <span className="text-caption text-steel">
                        Couldn&apos;t save. Reverted.
                    </span>
                )}
            </div>
        </SectionCard>
    );
}

function ProfileTab({ me }: { me: MeResponse }) {
    const bioId = useId();
    const locationId = useId();

    const [bio, setBio] = useState(me.bio ?? "");
    const [location, setLocation] = useState(me.location ?? "");
    const [state, setState] = useState<SaveState>("idle");
    const [isPending, startTransition] = useTransition();

    const dirty = bio !== (me.bio ?? "") || location !== (me.location ?? "");

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
            <AvatarSection me={me} />

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

            <PinnedAlbumsCard me={me} />
        </div>
    );
}

const USERNAME_RE = /^[a-z0-9_.]+$/i;

function UsernameCard({ me }: { me: MeResponse }) {
    const router = useRouter();
    const usernameId = useId();
    const emailId = useId();
    const [username, setUsername] = useState(me.handle ?? "");
    const [state, setState] = useState<SaveState>("idle");
    const [error, setError] = useState<string | null>(null);
    const [isPending, startTransition] = useTransition();

    const trimmed = username.trim();
    const normalized = trimmed.toLowerCase();
    const dirty = normalized !== (me.handle ?? "").toLowerCase();

    const save = () => {
        setError(null);
        if (trimmed.length < 3 || trimmed.length > 30) {
            setError("Username must be 3–30 characters.");
            return;
        }
        if (!USERNAME_RE.test(trimmed)) {
            setError("Letters, numbers, underscores, and dots only.");
            return;
        }
        setState("saving");
        startTransition(async () => {
            const { error: err } = await authClient.updateUser({
                name: normalized,
                username: normalized,
            });
            if (err) {
                setError(err.message ?? "Could not change username.");
                setState("error");
                return;
            }
            setState("saved");
            router.refresh();
            setTimeout(() => setState("idle"), 1800);
        });
    };

    return (
        <SectionCard title="Identity">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                    <Label htmlFor={usernameId}>Username</Label>
                    <TextInput
                        id={usernameId}
                        value={username}
                        onChange={setUsername}
                        autoComplete="username"
                    />
                    <FieldHint>
                        Your public handle — letters, numbers, underscores, and
                        dots. Always lowercase.
                    </FieldHint>
                </div>
                <div>
                    <Label htmlFor={emailId}>Email</Label>
                    <TextInput
                        id={emailId}
                        value={me.email}
                        onChange={() => {}}
                        disabled
                    />
                    <FieldHint>Email change is coming later.</FieldHint>
                </div>
            </div>
            <div className="mt-6 flex items-center justify-end gap-4">
                {error && (
                    <span className="text-caption text-steel">{error}</span>
                )}
                <SaveButton
                    state={isPending ? "saving" : state}
                    dirty={dirty}
                    onClick={save}
                    label="Update username"
                />
            </div>
        </SectionCard>
    );
}

function PasswordCard() {
    const currentId = useId();
    const newId = useId();
    const confirmId = useId();
    const [current, setCurrent] = useState("");
    const [next, setNext] = useState("");
    const [confirm, setConfirm] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [state, setState] = useState<SaveState>("idle");
    const [isPending, startTransition] = useTransition();

    const dirty = current.length > 0 && next.length > 0 && confirm.length > 0;

    const save = () => {
        setError(null);
        if (next.length < 6) {
            setError("New password must be at least 6 characters.");
            return;
        }
        if (next !== confirm) {
            setError("Passwords don't match.");
            return;
        }
        setState("saving");
        startTransition(async () => {
            const { error: err } = await authClient.changePassword({
                currentPassword: current,
                newPassword: next,
                revokeOtherSessions: true,
            });
            if (err) {
                setError(err.message ?? "Could not change password.");
                setState("error");
                return;
            }
            setCurrent("");
            setNext("");
            setConfirm("");
            setState("saved");
            setTimeout(() => setState("idle"), 1800);
        });
    };

    return (
        <SectionCard
            title="Password"
            description="Changing your password signs out other active sessions."
        >
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <div>
                    <Label htmlFor={currentId}>Current password</Label>
                    <TextInput
                        id={currentId}
                        type="password"
                        autoComplete="current-password"
                        value={current}
                        onChange={setCurrent}
                    />
                </div>
                <div>
                    <Label htmlFor={newId}>New password</Label>
                    <TextInput
                        id={newId}
                        type="password"
                        autoComplete="new-password"
                        value={next}
                        onChange={setNext}
                    />
                </div>
                <div>
                    <Label htmlFor={confirmId}>Confirm</Label>
                    <TextInput
                        id={confirmId}
                        type="password"
                        autoComplete="new-password"
                        value={confirm}
                        onChange={setConfirm}
                    />
                </div>
            </div>
            <div className="mt-6 flex items-center justify-end gap-4">
                {error && (
                    <span className="text-caption text-steel">{error}</span>
                )}
                <SaveButton
                    state={isPending ? "saving" : state}
                    dirty={dirty}
                    onClick={save}
                    label="Change password"
                />
            </div>
        </SectionCard>
    );
}

function DeleteAccountModal({
    expectedHandle,
    onClose,
}: {
    expectedHandle: string;
    onClose: () => void;
}) {
    const router = useRouter();
    const inputId = useId();
    const passwordId = useId();
    const [confirmText, setConfirmText] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [busy, setBusy] = useState(false);

    const matches = confirmText.trim().toLowerCase() === expectedHandle;
    const canDelete = matches && password.length > 0 && !busy;

    const onConfirm = async () => {
        if (!canDelete) return;
        setBusy(true);
        setError(null);
        const { error: err } = await authClient.deleteUser({ password });
        if (err) {
            setError(err.message ?? "Could not delete the account.");
            setBusy(false);
            return;
        }
        router.replace("/login");
    };

    useEffect(() => {
        const onKey = (e: globalThis.KeyboardEvent) => {
            if (e.key === "Escape") onClose();
        };
        document.addEventListener("keydown", onKey);
        const previous = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        return () => {
            document.removeEventListener("keydown", onKey);
            document.body.style.overflow = previous;
        };
    }, [onClose]);

    return (
        <div
            role="dialog"
            aria-modal="true"
            className="fixed inset-0 z-60 flex items-end sm:items-center justify-center"
        >
            <div
                className="absolute inset-0 bg-ink/70 backdrop-blur-sm"
                onClick={onClose}
            />
            <div className="relative w-full sm:max-w-md mx-auto bg-surface rounded-t-md sm:rounded-md border-[0.5px] border-(--hairline) p-6 md:p-8 shadow-[0_24px_60px_rgba(0,0,0,0.5)]">
                <div className="flex items-start justify-between gap-4 mb-4">
                    <h2
                        className="text-h3 font-medium text-paper"
                        style={{ letterSpacing: "-0.005em" }}
                    >
                        Delete your account
                    </h2>
                    <button
                        type="button"
                        onClick={onClose}
                        aria-label="Close"
                        className="text-steel hover:text-paper transition-colors duration-120"
                    >
                        <Icon name="x" size={16} stroke={1.5} />
                    </button>
                </div>
                <p className="text-caption text-steel mb-5 leading-relaxed">
                    This will permanently remove your profile, library, reviews,
                    activity, and uploaded images. This can&apos;t be undone.
                </p>
                <div className="flex flex-col gap-4">
                    <div>
                        <Label htmlFor={inputId}>
                            Type your username (
                            <span className="text-paper">{expectedHandle}</span>
                            ) to confirm
                        </Label>
                        <TextInput
                            id={inputId}
                            value={confirmText}
                            onChange={setConfirmText}
                            placeholder={expectedHandle}
                        />
                    </div>
                    <div>
                        <Label htmlFor={passwordId}>Password</Label>
                        <TextInput
                            id={passwordId}
                            type="password"
                            autoComplete="current-password"
                            value={password}
                            onChange={setPassword}
                        />
                    </div>
                </div>
                {error && (
                    <p className="mt-4 text-caption text-paper/70">{error}</p>
                )}
                <div className="mt-6 flex items-center justify-end gap-2.5">
                    <GhostButton onClick={onClose}>Cancel</GhostButton>
                    <button
                        type="button"
                        onClick={onConfirm}
                        disabled={!canDelete}
                        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-sm text-caption font-medium cursor-pointer transition-opacity duration-120 disabled:opacity-40 disabled:cursor-not-allowed"
                        style={{
                            background: matches ? "#b94c4c" : "#5b3030",
                            color: "#F7F7F7",
                        }}
                    >
                        {busy ? "Deleting…" : "Delete account"}
                    </button>
                </div>
            </div>
        </div>
    );
}

function DangerCard({ me }: { me: MeResponse }) {
    const [open, setOpen] = useState(false);
    return (
        <SectionCard
            title="Danger zone"
            description="Deleting your account removes your library, reviews, activity, and uploaded images. This can't be undone."
        >
            <button
                type="button"
                onClick={() => setOpen(true)}
                disabled={!me.handle}
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-sm bg-transparent text-caption font-medium cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-120 hover:bg-paper/4"
                style={{
                    border: "0.5px solid rgba(185,76,76,0.55)",
                    color: "#e08585",
                }}
            >
                Delete account…
            </button>
            {open && me.handle && (
                <DeleteAccountModal
                    expectedHandle={me.handle}
                    onClose={() => setOpen(false)}
                />
            )}
        </SectionCard>
    );
}

function PrivacyCard({ me }: { me: MeResponse }) {
    const [isPrivate, setIsPrivate] = useState(me.isPrivate);
    const [state, setState] = useState<SaveState>("idle");
    const [isPending, startTransition] = useTransition();

    const dirty = isPrivate !== me.isPrivate;

    const save = useCallback(() => {
        setState("saving");
        startTransition(() => {
            void patchMe({ isPrivate })
                .then(() => {
                    setState("saved");
                    setTimeout(() => setState("idle"), 1800);
                })
                .catch(() => setState("error"));
        });
    }, [isPrivate]);

    return (
        <SectionCard title="Privacy">
            <ToggleRow
                label="Private profile"
                description="When on, visitors only see a private profile message. Your library, reviews, activity, and pinned albums are hidden."
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
    );
}

function AccountTab({ me }: { me: MeResponse }) {
    return (
        <div className="flex flex-col gap-8">
            <UsernameCard me={me} />
            <PasswordCard />
            <PrivacyCard me={me} />
            <DangerCard me={me} />
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

            <div className="mt-8 grid grid-cols-2 items-end gap-0 sm:flex sm:items-center sm:gap-8 border-b-[0.5px] border-(--hairline)">
                {TABS.map((t) => {
                    const active = t.id === tab;
                    return (
                        <button
                            key={t.id}
                            onClick={() => setTab(t.id)}
                            className="min-w-0 bg-transparent border-0 cursor-pointer text-caption font-medium py-3 transition-colors duration-120"
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
