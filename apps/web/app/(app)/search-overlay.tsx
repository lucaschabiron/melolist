"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    type KeyboardEvent,
    startTransition,
    useEffect,
    useId,
    useRef,
    useState,
} from "react";
import { apiBaseUrl } from "../../lib/config";
import { CoverArt, GenericCover, coverPalette } from "./_components/primitives";
import styles from "./search-overlay.module.css";

type SearchResultSource = "local" | "musicbrainz";

type SearchArtistResult = {
    id: string | null;
    mbid: string;
    name: string;
    sortName: string | null;
    disambiguation: string | null;
    country: string | null;
    source: SearchResultSource;
    seeded: boolean;
};

type SearchReleaseGroupResult = {
    id: string | null;
    mbid: string;
    title: string;
    artistCredit: string;
    artist: {
        mbid: string | null;
        name: string;
    } | null;
    releaseType:
        | "album"
        | "ep"
        | "single"
        | "live"
        | "compilation"
        | "mixtape"
        | "soundtrack"
        | "other";
    secondaryTypes: string[];
    firstReleaseDate: string | null;
    coverArtUrl: string | null;
    source: SearchResultSource;
    seeded: boolean;
};

type SearchResponse = {
    query: string;
    artists: SearchArtistResult[];
    releaseGroups: SearchReleaseGroupResult[];
};

function SearchIcon({ className = "size-4" }: { className?: string }) {
    return (
        <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            className={className}
        >
            <circle cx="11" cy="11" r="6.5" />
            <path d="M16 16l5 5" strokeLinecap="round" />
        </svg>
    );
}

function CloseIcon({ className = "size-4" }: { className?: string }) {
    return (
        <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            className={className}
        >
            <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
        </svg>
    );
}

function prettyReleaseType(value: SearchReleaseGroupResult["releaseType"]) {
    switch (value) {
        case "ep":
            return "EP";
        default:
            return value.charAt(0).toUpperCase() + value.slice(1);
    }
}

function EmptySection({ children }: { children: React.ReactNode }) {
    return (
        <div className="rounded-md border-[0.5px] border-(--hairline) bg-white/[0.03] px-4 py-4 text-caption text-steel">
            {children}
        </div>
    );
}

export function SearchOverlay() {
    const pathname = usePathname();
    const inputId = useId();
    const inputRef = useRef<HTMLInputElement>(null);
    const [isOpen, setIsOpen] = useState(false);
    const [query, setQuery] = useState("");
    const [debouncedQuery, setDebouncedQuery] = useState("");
    const [results, setResults] = useState<SearchResponse | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const trimmedInputQuery = query.trim();
    const trimmedDebouncedQuery = debouncedQuery.trim();
    const hasQuery = trimmedInputQuery.length >= 2;
    const isWaitingForDebounce =
        hasQuery && trimmedInputQuery !== trimmedDebouncedQuery;
    const resultsMatchCurrentQuery =
        results?.query.trim() === trimmedInputQuery;
    const visibleResults =
        !isWaitingForDebounce && resultsMatchCurrentQuery ? results : null;
    const sectionCounts = {
        artists: visibleResults?.artists.length ?? 0,
        releaseGroups: visibleResults?.releaseGroups.length ?? 0,
    };

    useEffect(() => {
        setIsOpen(false);
    }, [pathname]);

    useEffect(() => {
        if (!isOpen) return;

        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = "hidden";

        return () => {
            document.body.style.overflow = previousOverflow;
        };
    }, [isOpen]);

    useEffect(() => {
        if (!isOpen) return;

        const onKeyDown = (event: globalThis.KeyboardEvent) => {
            if (
                (event.metaKey || event.ctrlKey) &&
                event.key.toLowerCase() === "k"
            ) {
                event.preventDefault();
                setIsOpen((open) => !open);
                return;
            }

            if (event.key === "Escape") {
                setIsOpen(false);
            }
        };

        window.addEventListener("keydown", onKeyDown);
        return () => window.removeEventListener("keydown", onKeyDown);
    }, [isOpen]);

    useEffect(() => {
        const onKeyDown = (event: globalThis.KeyboardEvent) => {
            if (
                (event.metaKey || event.ctrlKey) &&
                event.key.toLowerCase() === "k"
            ) {
                event.preventDefault();
                setIsOpen(true);
            }
        };

        window.addEventListener("keydown", onKeyDown);
        return () => window.removeEventListener("keydown", onKeyDown);
    }, []);

    useEffect(() => {
        if (!isOpen) return;

        const timeoutId = window.setTimeout(() => {
            inputRef.current?.focus();
        }, 20);

        return () => window.clearTimeout(timeoutId);
    }, [isOpen]);

    useEffect(() => {
        if (!isOpen) return;

        const timeoutId = window.setTimeout(() => {
            setDebouncedQuery(query);
        }, 500);

        return () => window.clearTimeout(timeoutId);
    }, [isOpen, query]);

    useEffect(() => {
        if (!isOpen) return;
        if (trimmedDebouncedQuery.length === 0) {
            setResults(null);
            setError(null);
            setIsLoading(false);
            return;
        }

        if (trimmedDebouncedQuery.length < 2) {
            setResults(null);
            setError("Type at least 2 characters.");
            setIsLoading(false);
            return;
        }

        const controller = new AbortController();
        startTransition(() => {
            setIsLoading(true);
            setError(null);
            setResults(null);
        });

        void (async () => {
            startTransition(() => {
                setError(null);
            });

            try {
                const response = await fetch(
                    `${apiBaseUrl}catalog/search?q=${encodeURIComponent(trimmedDebouncedQuery)}`,
                    {
                        credentials: "include",
                        signal: controller.signal,
                    },
                );

                if (!response.ok) {
                    if (response.status === 401) {
                        throw new Error("Search requires an active session.");
                    }

                    throw new Error("Search is temporarily unavailable.");
                }

                const payload = (await response.json()) as SearchResponse;

                startTransition(() => {
                    setResults(payload);
                    setError(null);
                });
            } catch (fetchError) {
                if (controller.signal.aborted) return;

                startTransition(() => {
                    setResults(null);
                    setError(
                        fetchError instanceof Error
                            ? fetchError.message
                            : "Search failed.",
                    );
                });
            } finally {
                if (!controller.signal.aborted) {
                    startTransition(() => {
                        setIsLoading(false);
                    });
                }
            }
        })();

        return () => {
            controller.abort();
        };
    }, [isOpen, trimmedDebouncedQuery]);

    const handleOverlayKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
        if (event.key === "Escape") {
            event.preventDefault();
            setIsOpen(false);
        }
    };

    return (
        <>
            <button
                type="button"
                aria-label="Open search"
                onClick={() => setIsOpen(true)}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-[0.5px] border-(--hairline) bg-white/3 text-steel transition-colors duration-120 hover:text-paper hover:border-paper/20"
            >
                <SearchIcon />
            </button>

            {isOpen ? (
                <div
                    className="fixed inset-0 z-50 overflow-y-auto bg-ink/80 backdrop-blur-sm"
                    onKeyDown={handleOverlayKeyDown}
                >
                    <button
                        type="button"
                        aria-label="Close search"
                        onClick={() => setIsOpen(false)}
                        className="absolute inset-0"
                    />

                    <div className="relative mx-auto min-h-screen w-full max-w-[1120px] px-4 pb-8 pt-5 md:px-6 md:pb-10 md:pt-6">
                        <div className="mx-auto w-full max-w-[760px]">
                            <div
                                className={`${styles.shell} flex items-center gap-3 rounded-xl border-[0.5px] border-(--hairline) bg-surface/96 px-4 py-3 shadow-[0_16px_42px_rgba(0,0,0,0.3)] transition-colors duration-120`}
                            >
                                <div className="shrink-0 text-steel">
                                    <SearchIcon className="size-4.5" />
                                </div>
                                <label htmlFor={inputId} className="sr-only">
                                    Search artists and release groups
                                </label>
                                <input
                                    id={inputId}
                                    ref={inputRef}
                                    type="search"
                                    size={1}
                                    value={query}
                                    onChange={(event) =>
                                        setQuery(event.target.value)
                                    }
                                    placeholder="Search artists, albums..."
                                    className={`${styles.input} h-9 min-w-0 flex-1 bg-transparent text-[18px] font-medium tracking-[-0.015em] text-paper outline-none placeholder:text-steel/55 md:text-[22px]`}
                                />
                                <button
                                    type="button"
                                    onClick={() => setIsOpen(false)}
                                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-steel transition-colors duration-120 hover:bg-paper/5 hover:text-paper"
                                >
                                    <CloseIcon />
                                </button>
                            </div>

                            <div className="mt-2 flex items-center justify-between px-1 text-micro uppercase tracking-[0.16em] text-steel/70">
                                <span>Quick search</span>
                                <span>Ctrl/⌘ K</span>
                            </div>
                        </div>

                        <div className="mx-auto mt-5 grid w-full max-w-[1120px] grid-cols-1 gap-4 lg:grid-cols-2 lg:items-start">
                            <section className="rounded-xl border-[0.5px] border-(--hairline) bg-surface/94 p-4 shadow-[0_14px_36px_rgba(0,0,0,0.24)]">
                                <div className="mb-4 flex items-center justify-between">
                                    <h2 className="text-[17px] font-medium tracking-[-0.015em] text-paper">
                                        Artists
                                    </h2>
                                    <span className="text-caption text-steel">
                                        {sectionCounts.artists}
                                    </span>
                                </div>

                                {!hasQuery ? (
                                    <EmptySection>
                                        Start typing to search your catalog
                                        first, then MusicBrainz when local
                                        results are thin.
                                    </EmptySection>
                                ) : error ? (
                                    <EmptySection>{error}</EmptySection>
                                ) : isWaitingForDebounce ||
                                  (isLoading && !visibleResults) ? (
                                    <EmptySection>Searching…</EmptySection>
                                ) : visibleResults &&
                                  visibleResults.artists.length === 0 ? (
                                    <EmptySection>
                                        No artists found.
                                    </EmptySection>
                                ) : (
                                    <div className="space-y-2">
                                        {visibleResults?.artists.map(
                                            (artist) => (
                                                <Link
                                                    key={artist.mbid}
                                                    href={`/artists/${artist.mbid}`}
                                                    className="flex min-w-0 items-start gap-3 rounded-lg px-3 py-2.5 transition-colors duration-120 hover:bg-paper/4"
                                                >
                                                    <GenericCover
                                                        size={44}
                                                        radius={6}
                                                        palette={coverPalette(
                                                            artist.mbid,
                                                        )}
                                                        label={
                                                            artist.name
                                                                .trim()[0]
                                                                ?.toUpperCase() ??
                                                            "?"
                                                        }
                                                    />
                                                    <div className="min-w-0 flex-1">
                                                        <div className="truncate text-body font-medium text-paper">
                                                            {artist.name}
                                                        </div>
                                                        <div className="mt-0.5 flex min-w-0 items-center gap-2 text-caption text-steel">
                                                            {artist.disambiguation ? (
                                                                <span className="min-w-0 truncate">
                                                                    {
                                                                        artist.disambiguation
                                                                    }
                                                                </span>
                                                            ) : null}
                                                            {artist.country ? (
                                                                <span className="shrink-0">
                                                                    {
                                                                        artist.country
                                                                    }
                                                                </span>
                                                            ) : null}
                                                        </div>
                                                    </div>
                                                </Link>
                                            ),
                                        )}
                                    </div>
                                )}
                            </section>

                            <section className="rounded-xl border-[0.5px] border-(--hairline) bg-surface/94 p-4 shadow-[0_14px_36px_rgba(0,0,0,0.24)]">
                                <div className="mb-4 flex items-center justify-between">
                                    <h2 className="text-[17px] font-medium tracking-[-0.015em] text-paper">
                                        Release Groups
                                    </h2>
                                    <span className="text-caption text-steel">
                                        {sectionCounts.releaseGroups}
                                    </span>
                                </div>

                                {!hasQuery ? (
                                    <EmptySection>
                                        Results are grouped by release group so
                                        albums, EPs, mixtapes, soundtracks, and
                                        singles can coexist.
                                    </EmptySection>
                                ) : error ? (
                                    <EmptySection>{error}</EmptySection>
                                ) : isWaitingForDebounce ||
                                  (isLoading && !visibleResults) ? (
                                    <EmptySection>Searching…</EmptySection>
                                ) : visibleResults &&
                                  visibleResults.releaseGroups.length === 0 ? (
                                    <EmptySection>
                                        No release groups found.
                                    </EmptySection>
                                ) : (
                                    <div className="space-y-2">
                                        {visibleResults?.releaseGroups.map(
                                            (releaseGroup) => (
                                                <Link
                                                    key={releaseGroup.mbid}
                                                    href={`/release-groups/${releaseGroup.mbid}`}
                                                    className="flex min-w-0 items-start gap-3 rounded-lg px-3 py-2.5 transition-colors duration-120 hover:bg-paper/4"
                                                >
                                                    <CoverArt
                                                        src={
                                                            releaseGroup.coverArtUrl
                                                        }
                                                        title={
                                                            releaseGroup.title
                                                        }
                                                        seed={releaseGroup.mbid}
                                                        size={44}
                                                        radius={6}
                                                    />
                                                    <div className="min-w-0 flex-1">
                                                        <div className="truncate text-body font-medium text-paper">
                                                            {releaseGroup.title}
                                                        </div>
                                                        <div className="mt-0.5 truncate text-caption text-steel">
                                                            {
                                                                releaseGroup.artistCredit
                                                            }
                                                        </div>
                                                        <div className="mt-1 flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1 text-micro uppercase tracking-[0.14em] text-steel/70">
                                                            <span className="shrink-0">
                                                                {prettyReleaseType(
                                                                    releaseGroup.releaseType,
                                                                )}
                                                            </span>
                                                            {releaseGroup.firstReleaseDate ? (
                                                                <span className="shrink-0">
                                                                    {releaseGroup.firstReleaseDate.slice(
                                                                        0,
                                                                        4,
                                                                    )}
                                                                </span>
                                                            ) : null}
                                                            {releaseGroup.secondaryTypes.map(
                                                                (
                                                                    secondaryType,
                                                                ) => (
                                                                    <span
                                                                        key={
                                                                            secondaryType
                                                                        }
                                                                        className="shrink-0"
                                                                    >
                                                                        {
                                                                            secondaryType
                                                                        }
                                                                    </span>
                                                                ),
                                                            )}
                                                        </div>
                                                    </div>
                                                </Link>
                                            ),
                                        )}
                                    </div>
                                )}
                            </section>
                        </div>
                    </div>
                </div>
            ) : null}
        </>
    );
}
