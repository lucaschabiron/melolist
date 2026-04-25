"use client";

import { useSession } from "../lib/auth-client";

const LISTENING = [
    { title: "Wildflower", artist: "The Avalanches" },
    { title: "Punisher", artist: "Phoebe Bridgers" },
    { title: "Carrie & Lowell", artist: "Sufjan Stevens" },
    { title: "Sound of Silver", artist: "LCD Soundsystem" },
];

const REVIEWS = [
    {
        album: "A Moon Shaped Pool",
        artist: "Radiohead",
        rating: 9,
        date: "12 Mar 2026",
        excerpt:
            "The album feels like water — slow-moving but constant, wearing everything down…",
    },
    {
        album: "Carrie & Lowell",
        artist: "Sufjan Stevens",
        rating: 8,
        date: "9 Mar 2026",
        excerpt: "Grief made structural. It's almost too much to sit with…",
    },
    {
        album: "Punisher",
        artist: "Phoebe Bridgers",
        rating: 8,
        date: "3 Mar 2026",
        excerpt:
            "Cemetery haunt, autumn light, a certain kind of American melancholy…",
    },
];

const greetingFor = (date: Date) => {
    const h = date.getHours();
    if (h >= 5 && h < 12) return "Good morning";
    if (h >= 12 && h < 17) return "Good afternoon";
    return "Good evening";
};

export default function Home() {
    const { data: session, isPending } = useSession();
    if (isPending || !session) return null;

    const handle = session.user.username ?? session.user.name;
    const greeting = `${greetingFor(new Date())}, ${handle}.`;

    return (
        <main className="max-w-150 mx-auto px-6 pt-16 pb-20">
            <section className="mb-20">
                <h1 className="text-[46px] font-medium text-paper tracking-[-0.02em] leading-[1.05]">
                    {greeting}
                </h1>
            </section>

            <section className="mb-16">
                <h2 className="text-h3 font-medium text-paper mb-4 tracking-[-0.01em]">
                    Currently listening
                </h2>
                <div className="flex gap-3 overflow-x-auto pb-1 -mx-6 px-6">
                    {LISTENING.map((album) => (
                        <div
                            key={album.title}
                            className="flex-none w-30 flex flex-col gap-1.5 cursor-pointer group"
                        >
                            <div className="w-30 h-30 bg-surface rounded-md border-[0.5px] border-(--hairline) flex items-center justify-center text-micro text-steel/60 transition-opacity duration-120 group-hover:opacity-85">
                                art
                            </div>
                            <div className="text-caption text-paper truncate">
                                {album.title}
                            </div>
                            <div className="text-micro text-steel -mt-1 truncate">
                                {album.artist}
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            <section className="mb-16">
                <h2 className="text-h3 font-medium text-paper mb-4 tracking-[-0.01em]">
                    This week
                </h2>
                <p className="text-body text-steel leading-[1.65]">
                    You&apos;ve added 4 albums and written 2 reviews. Three of
                    this week&apos;s additions were reissues. Your most-played
                    artist this week was Phoebe Bridgers.
                </p>
                <a
                    href="#"
                    className="mt-3.5 inline-block text-caption text-steel hover:text-paper transition-colors duration-120"
                >
                    See all recent activity →
                </a>
            </section>

            <section className="mb-16">
                <h2 className="text-h3 font-medium text-paper mb-4 tracking-[-0.01em]">
                    Your recent reviews
                </h2>
                <div className="border-t-[0.5px] border-(--hairline)">
                    {REVIEWS.map((review) => (
                        <article
                            key={review.album}
                            className="flex gap-3.5 py-5 border-b-[0.5px] border-(--hairline)"
                        >
                            <div className="w-14 h-14 shrink-0 bg-surface rounded border-[0.5px] border-(--hairline) flex items-center justify-center text-micro text-steel/60">
                                art
                            </div>
                            <div className="flex flex-col gap-1 flex-1 min-w-0">
                                <div className="text-caption font-medium text-paper truncate">
                                    {review.album}
                                    <span className="text-steel font-normal">
                                        {" — "}
                                        {review.artist}
                                    </span>
                                </div>
                                <div className="text-caption text-steel">
                                    {review.rating} / 10 · {review.date}
                                </div>
                                <p className="text-caption text-steel leading-[1.55]">
                                    {review.excerpt}
                                </p>
                                <a
                                    href="#"
                                    className="text-micro text-steel hover:text-paper transition-colors duration-120 w-fit"
                                >
                                    Read more
                                </a>
                            </div>
                        </article>
                    ))}
                </div>
            </section>

            <section className="mb-16 border-t-[0.5px] border-(--hairline) pt-8">
                <h2 className="text-h3 font-medium text-paper mb-4 tracking-[-0.01em]">
                    In your library
                </h2>
                <div className="text-body text-paper">
                    847 albums
                    <span className="text-steel mx-2">·</span>
                    3,214 tracks rated
                    <span className="text-steel mx-2">·</span>
                    42 physical
                </div>
                <p className="text-caption text-steel mt-1.5">
                    Most tracked artist this month: Radiohead (6 albums)
                </p>
                <a
                    href="#"
                    className="mt-2.5 inline-block text-caption text-steel hover:text-paper transition-colors duration-120"
                >
                    See your stats →
                </a>
            </section>

            <section className="mb-16">
                <div className="bg-surface rounded-md border-[0.5px] border-(--hairline) p-5 text-body text-paper leading-normal">
                    You&apos;ve been listening to Wildflower since January.
                    Ready to move it along?
                    <a
                        href="#"
                        className="ml-2 text-steel hover:text-paper transition-colors duration-120"
                    >
                        Change status
                    </a>
                </div>
            </section>

            <footer className="flex gap-6">
                {["About", "Privacy", "API", "Contact"].map((link) => (
                    <a
                        key={link}
                        href="#"
                        className="text-caption text-steel hover:text-paper transition-colors duration-120"
                    >
                        {link}
                    </a>
                ))}
            </footer>
        </main>
    );
}
