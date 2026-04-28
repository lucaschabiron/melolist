import { cookies } from "next/headers";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { apiBaseUrl } from "../../../../lib/config";
import { CoverArt } from "../../_components/primitives";

type RecordingResponse = {
    recording: {
        mbid: string;
        title: string;
        primaryArtistCredit: string;
        lengthMs: number | null;
    };
    appearances: Array<{
        trackId: string;
        title: string;
        number: string | null;
        position: number;
        lengthMs: number | null;
        medium: {
            position: number;
            title: string | null;
            format: string | null;
        };
        release: {
            mbid: string;
            title: string;
            status: string | null;
            releaseDate: string | null;
            country: string | null;
        };
        releaseGroup: {
            mbid: string | null;
            title: string;
            primaryArtistCredit: string;
            artistMbid: string | null;
            year: number | null;
            coverArtUrl: string | null;
        };
    }>;
};

type TrackPageProps = {
    params: Promise<{ mbid: string }>;
};

function formatDuration(lengthMs: number | null): string {
    if (lengthMs === null) return "--:--";
    const totalSeconds = Math.round(lengthMs / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

function yearOf(dateString: string | null): string {
    return dateString?.slice(0, 4) ?? "--";
}

async function fetchRecording(mbid: string): Promise<RecordingResponse | null> {
    const cookieStore = await cookies();
    const cookieHeader = cookieStore.toString();
    const response = await fetch(
        new URL(`catalog/recordings/${mbid}`, apiBaseUrl),
        {
            headers: cookieHeader ? { cookie: cookieHeader } : undefined,
            cache: "no-store",
        },
    );

    if (response.status === 401) redirect("/login");
    if (response.status === 404) return null;
    if (!response.ok) return null;

    return (await response.json()) as RecordingResponse;
}

export default async function TrackPage({ params }: TrackPageProps) {
    const { mbid } = await params;
    const data = await fetchRecording(mbid);
    if (!data) notFound();

    return (
        <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pb-24">
            <section className="pt-12 md:pt-18">
                <div className="text-caption text-steel">Track</div>
                <h1
                    className="mt-2 text-[32px] sm:text-h1 font-medium text-paper"
                    style={{ letterSpacing: "-0.02em", lineHeight: 1.05 }}
                >
                    {data.recording.title}
                </h1>
                <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-caption text-steel">
                    <span>{data.recording.primaryArtistCredit}</span>
                    <span aria-hidden="true">·</span>
                    <span>{formatDuration(data.recording.lengthMs)}</span>
                </div>
            </section>

            <section className="mt-12 md:mt-16">
                <div className="flex items-baseline justify-between gap-4 mb-5">
                    <h2
                        className="text-h3 font-medium"
                        style={{ letterSpacing: "-0.005em" }}
                    >
                        Appears on
                    </h2>
                    <span
                        className="text-caption text-steel"
                        style={{ fontVariantNumeric: "tabular-nums" }}
                    >
                        {data.appearances.length}
                    </span>
                </div>

                <div className="rounded-md border-[0.5px] border-(--hairline) bg-surface overflow-hidden">
                    {data.appearances.map((appearance) => (
                        <div
                            key={appearance.trackId}
                            className="grid grid-cols-[48px_minmax(0,1fr)_48px] md:grid-cols-[56px_minmax(0,1fr)_minmax(0,1fr)_80px] items-center gap-3 md:gap-4 px-3 md:px-5 py-3 border-b-[0.5px] border-(--hairline) last:border-b-0"
                        >
                            <Link
                                href={
                                    appearance.releaseGroup.mbid
                                        ? `/release-groups/${appearance.releaseGroup.mbid}`
                                        : "#"
                                }
                                className="block"
                                aria-label={appearance.releaseGroup.title}
                            >
                                <CoverArt
                                    src={appearance.releaseGroup.coverArtUrl}
                                    title={appearance.releaseGroup.title}
                                    seed={
                                        appearance.releaseGroup.mbid ??
                                        appearance.trackId
                                    }
                                    size={48}
                                    radius={4}
                                />
                            </Link>
                            <div className="min-w-0">
                                {appearance.releaseGroup.mbid ? (
                                    <Link
                                        href={`/release-groups/${appearance.releaseGroup.mbid}`}
                                        className="block truncate text-body font-medium text-paper no-underline hover:underline"
                                    >
                                        {appearance.releaseGroup.title}
                                    </Link>
                                ) : (
                                    <div className="truncate text-body font-medium text-paper">
                                        {appearance.releaseGroup.title}
                                    </div>
                                )}
                                <div className="truncate text-caption text-steel">
                                    {
                                        appearance.releaseGroup
                                            .primaryArtistCredit
                                    }
                                </div>
                            </div>
                            <div className="hidden md:block min-w-0 text-caption text-steel">
                                <div className="truncate">
                                    {appearance.release.title}
                                </div>
                                <div className="truncate">
                                    Disc {appearance.medium.position}, track{" "}
                                    {appearance.number ??
                                        appearance.position.toString()}
                                </div>
                            </div>
                            <div
                                className="text-right text-caption text-steel"
                                style={{ fontVariantNumeric: "tabular-nums" }}
                            >
                                {yearOf(appearance.release.releaseDate)}
                            </div>
                        </div>
                    ))}
                </div>
            </section>
        </main>
    );
}
