import type { StatusId } from "../../release-groups/[mbid]/album-data";

export type ActivityKind =
    | "rated"
    | "reviewed"
    | "revisited"
    | "loved"
    | "listened"
    | "owned";

export type ActivityEntry = {
    kind: ActivityKind;
    target: string;
    artist: string;
    rating?: number;
    date: string;
    snippet?: string;
};

export type ProfileStats = {
    albumsRated: number;
    reviews: number;
    distinctArtists: number;
    hoursListened: number;
    averageRating: number;
    owned: number;
};

export const MOCK_PROFILE_STATS: ProfileStats = {
    albumsRated: 247,
    reviews: 63,
    distinctArtists: 128,
    hoursListened: 412,
    averageRating: 7.6,
    owned: 34,
};

export const MOCK_ACTIVITY: ActivityEntry[] = [
    {
        kind: "reviewed",
        target: "In Rainbows",
        artist: "Radiohead",
        rating: 9.5,
        date: "2 days ago",
        snippet:
            "Eighteen years on, the thing that startles me is how little it needs from you.",
    },
    {
        kind: "rated",
        target: "Illinois",
        artist: "Sufjan Stevens",
        rating: 9,
        date: "4 days ago",
    },
    {
        kind: "loved",
        target: "To Pimp a Butterfly",
        artist: "Kendrick Lamar",
        date: "6 days ago",
    },
    {
        kind: "revisited",
        target: "Kid A",
        artist: "Radiohead",
        rating: 9.5,
        date: "1 week ago",
    },
    {
        kind: "owned",
        target: "For Emma, Forever Ago",
        artist: "Bon Iver",
        date: "1 week ago",
    },
    {
        kind: "listened",
        target: "The Seer",
        artist: "Swans",
        date: "2 weeks ago",
    },
    {
        kind: "reviewed",
        target: "A Crow Looked at Me",
        artist: "Mount Eerie",
        rating: 9,
        date: "2 weeks ago",
        snippet:
            "Language collapses into a documentary. It isn't beautiful; it isn't trying to be.",
    },
    {
        kind: "rated",
        target: "Lonerism",
        artist: "Tame Impala",
        rating: 8.5,
        date: "3 weeks ago",
    },
];

export type AlbumListEntry = {
    id: string;
    title: string;
    artist: string;
    year: number;
    rating: number;
    status: StatusId;
    listenedOn: string;
    palette: [string, string, string];
    letter: string;
};

export const MOCK_ALBUM_LIST: AlbumListEntry[] = [
    {
        id: "rg-1",
        title: "In Rainbows",
        artist: "Radiohead",
        year: 2007,
        rating: 9.5,
        status: "loved",
        listenedOn: "2 days ago",
        palette: ["#241106", "#5b3a1e", "#8a5a2e"],
        letter: "I",
    },
    {
        id: "rg-2",
        title: "Illinois",
        artist: "Sufjan Stevens",
        year: 2005,
        rating: 9,
        status: "loved",
        listenedOn: "4 days ago",
        palette: ["#0a1a2a", "#1e4a6b", "#3a6b8a"],
        letter: "I",
    },
    {
        id: "rg-3",
        title: "To Pimp a Butterfly",
        artist: "Kendrick Lamar",
        year: 2015,
        rating: 9.5,
        status: "loved",
        listenedOn: "6 days ago",
        palette: ["#1a1408", "#3a2e14", "#5b4a24"],
        letter: "T",
    },
    {
        id: "rg-4",
        title: "Kid A",
        artist: "Radiohead",
        year: 2000,
        rating: 9.5,
        status: "loved",
        listenedOn: "1 week ago",
        palette: ["#2a0a0a", "#5b1e1e", "#8a2e2e"],
        letter: "K",
    },
    {
        id: "rg-5",
        title: "For Emma, Forever Ago",
        artist: "Bon Iver",
        year: 2007,
        rating: 8.5,
        status: "listened",
        listenedOn: "1 week ago",
        palette: ["#1a1a14", "#3a3a2e", "#6b6b5a"],
        letter: "F",
    },
    {
        id: "rg-6",
        title: "The Seer",
        artist: "Swans",
        year: 2012,
        rating: 9,
        status: "loved",
        listenedOn: "2 weeks ago",
        palette: ["#14141a", "#2e2e4a", "#4a4a6b"],
        letter: "T",
    },
    {
        id: "rg-7",
        title: "A Crow Looked at Me",
        artist: "Mount Eerie",
        year: 2017,
        rating: 9,
        status: "listened",
        listenedOn: "2 weeks ago",
        palette: ["#08141a", "#14283a", "#1e3a5b"],
        letter: "A",
    },
    {
        id: "rg-8",
        title: "Lonerism",
        artist: "Tame Impala",
        year: 2012,
        rating: 8.5,
        status: "listened",
        listenedOn: "3 weeks ago",
        palette: ["#2a140a", "#6b3a1e", "#a85a3e"],
        letter: "L",
    },
    {
        id: "rg-9",
        title: "OK Computer",
        artist: "Radiohead",
        year: 1997,
        rating: 10,
        status: "loved",
        listenedOn: "1 month ago",
        palette: ["#0a1a2a", "#1e3a5b", "#2e5b8a"],
        letter: "O",
    },
    {
        id: "rg-10",
        title: "Currents",
        artist: "Tame Impala",
        year: 2015,
        rating: 8,
        status: "listened",
        listenedOn: "1 month ago",
        palette: ["#2a140a", "#6b3a1e", "#a85a3e"],
        letter: "C",
    },
    {
        id: "rg-11",
        title: "Sea Change",
        artist: "Beck",
        year: 2002,
        rating: 8.5,
        status: "listened",
        listenedOn: "1 month ago",
        palette: ["#0a1a2a", "#1e4a6b", "#3a6b8a"],
        letter: "S",
    },
    {
        id: "rg-12",
        title: "Grace",
        artist: "Jeff Buckley",
        year: 1994,
        rating: 9,
        status: "loved",
        listenedOn: "2 months ago",
        palette: ["#14141a", "#2e2e4a", "#4a4a6b"],
        letter: "G",
    },
    {
        id: "rg-13",
        title: "The Soft Bulletin",
        artist: "The Flaming Lips",
        year: 1999,
        rating: 8,
        status: "listened",
        listenedOn: "2 months ago",
        palette: ["#2a0a2a", "#5b1e5b", "#8a2e7a"],
        letter: "S",
    },
    {
        id: "rg-14",
        title: "A Moon Shaped Pool",
        artist: "Radiohead",
        year: 2016,
        rating: 9,
        status: "loved",
        listenedOn: "3 months ago",
        palette: ["#2a1a0a", "#5b3a1e", "#8a5a3e"],
        letter: "M",
    },
    {
        id: "rg-15",
        title: "Yankee Hotel Foxtrot",
        artist: "Wilco",
        year: 2001,
        rating: 8.5,
        status: "listened",
        listenedOn: "3 months ago",
        palette: ["#14281a", "#2e5b3a", "#4a8a5b"],
        letter: "Y",
    },
    {
        id: "rg-16",
        title: "Mezzanine",
        artist: "Massive Attack",
        year: 1998,
        rating: 9,
        status: "loved",
        listenedOn: "4 months ago",
        palette: ["#08141a", "#14283a", "#1e3a5b"],
        letter: "M",
    },
    {
        id: "rg-17",
        title: "Funeral",
        artist: "Arcade Fire",
        year: 2004,
        rating: 8,
        status: "listened",
        listenedOn: "4 months ago",
        palette: ["#1a140a", "#3a2e1e", "#5b4a2e"],
        letter: "F",
    },
    {
        id: "rg-18",
        title: "Halcyon Digest",
        artist: "Deerhunter",
        year: 2010,
        rating: 8.5,
        status: "listened",
        listenedOn: "5 months ago",
        palette: ["#0a1a0a", "#1e3a1e", "#2e5b2e"],
        letter: "H",
    },
    {
        id: "rg-19",
        title: "Pure Heroine",
        artist: "Lorde",
        year: 2013,
        rating: 7.5,
        status: "listened",
        listenedOn: "6 months ago",
        palette: ["#14141a", "#2e2e4a", "#4a4a6b"],
        letter: "P",
    },
    {
        id: "rg-20",
        title: "Discovery",
        artist: "Daft Punk",
        year: 2001,
        rating: 9,
        status: "loved",
        listenedOn: "6 months ago",
        palette: ["#2a140a", "#6b3a1e", "#a85a3e"],
        letter: "D",
    },
    {
        id: "rg-21",
        title: "Blonde",
        artist: "Frank Ocean",
        year: 2016,
        rating: 9,
        status: "loved",
        listenedOn: "7 months ago",
        palette: ["#1a1408", "#3a2e14", "#5b4a24"],
        letter: "B",
    },
    {
        id: "rg-22",
        title: "Rumours",
        artist: "Fleetwood Mac",
        year: 1977,
        rating: 9.5,
        status: "loved",
        listenedOn: "8 months ago",
        palette: ["#241106", "#5b3a1e", "#8a5a2e"],
        letter: "R",
    },
    {
        id: "rg-23",
        title: "Punisher",
        artist: "Phoebe Bridgers",
        year: 2020,
        rating: 8,
        status: "listened",
        listenedOn: "9 months ago",
        palette: ["#08141a", "#14283a", "#1e3a5b"],
        letter: "P",
    },
    {
        id: "rg-24",
        title: "Boys for Pele",
        artist: "Tori Amos",
        year: 1996,
        rating: 8.5,
        status: "shelved",
        listenedOn: "10 months ago",
        palette: ["#2a0a2a", "#5b1e5b", "#8a2e7a"],
        letter: "B",
    },
    {
        id: "rg-25",
        title: "If You're Feeling Sinister",
        artist: "Belle & Sebastian",
        year: 1996,
        rating: 7,
        status: "backlog",
        listenedOn: "—",
        palette: ["#14281a", "#2e5b3a", "#4a8a5b"],
        letter: "I",
    },
];

export type TrackListEntry = {
    rank: number;
    title: string;
    artist: string;
    album: string;
    year: number;
    runtime: string;
    rating: number;
};

export const MOCK_TOP_TRACKS: TrackListEntry[] = [
    {
        rank: 1,
        title: "Reckoner",
        artist: "Radiohead",
        album: "In Rainbows",
        year: 2007,
        runtime: "4:50",
        rating: 10,
    },
    {
        rank: 2,
        title: "Pyramid Song",
        artist: "Radiohead",
        album: "Amnesiac",
        year: 2001,
        runtime: "4:49",
        rating: 10,
    },
    {
        rank: 3,
        title: "Videotape",
        artist: "Radiohead",
        album: "In Rainbows",
        year: 2007,
        runtime: "4:40",
        rating: 9.5,
    },
    {
        rank: 4,
        title: "All My Friends",
        artist: "LCD Soundsystem",
        album: "Sound of Silver",
        year: 2007,
        runtime: "7:37",
        rating: 9.5,
    },
    {
        rank: 5,
        title: "Last Goodbye",
        artist: "Jeff Buckley",
        album: "Grace",
        year: 1994,
        runtime: "4:35",
        rating: 9.5,
    },
    {
        rank: 6,
        title: "Casimir Pulaski Day",
        artist: "Sufjan Stevens",
        album: "Illinois",
        year: 2005,
        runtime: "5:53",
        rating: 9.5,
    },
    {
        rank: 7,
        title: "Idioteque",
        artist: "Radiohead",
        album: "Kid A",
        year: 2000,
        runtime: "5:09",
        rating: 9.5,
    },
    {
        rank: 8,
        title: "Holocene",
        artist: "Bon Iver",
        album: "Bon Iver",
        year: 2011,
        runtime: "5:36",
        rating: 9.5,
    },
    {
        rank: 9,
        title: "Alright",
        artist: "Kendrick Lamar",
        album: "To Pimp a Butterfly",
        year: 2015,
        runtime: "3:39",
        rating: 9.5,
    },
    {
        rank: 10,
        title: "Nightswimming",
        artist: "R.E.M.",
        album: "Automatic for the People",
        year: 1992,
        runtime: "4:16",
        rating: 9.5,
    },
    {
        rank: 11,
        title: "Pink + White",
        artist: "Frank Ocean",
        album: "Blonde",
        year: 2016,
        runtime: "3:04",
        rating: 9.5,
    },
    {
        rank: 12,
        title: "The Less I Know the Better",
        artist: "Tame Impala",
        album: "Currents",
        year: 2015,
        runtime: "3:36",
        rating: 9,
    },
    {
        rank: 13,
        title: "Teen Age Riot",
        artist: "Sonic Youth",
        album: "Daydream Nation",
        year: 1988,
        runtime: "6:58",
        rating: 9,
    },
    {
        rank: 14,
        title: "Heroes",
        artist: "David Bowie",
        album: "Heroes",
        year: 1977,
        runtime: "6:07",
        rating: 9.5,
    },
    {
        rank: 15,
        title: "Once in a Lifetime",
        artist: "Talking Heads",
        album: "Remain in Light",
        year: 1980,
        runtime: "4:19",
        rating: 9.5,
    },
];

export type ReviewSummary = {
    id: string;
    target: string;
    artist: string;
    year: number;
    rating: number;
    date: string;
    body: string;
    tags: string[];
    helpful: number;
    palette: [string, string, string];
    letter: string;
};

export const MOCK_REVIEWS: ReviewSummary[] = [
    {
        id: "rev-1",
        target: "In Rainbows",
        artist: "Radiohead",
        year: 2007,
        rating: 9.5,
        date: "2 days ago",
        body: `Eighteen years on, the thing that startles me is how little it needs from you. It doesn't chase, it doesn't build; it arrives already settled into its own weather. "Weird Fishes" remains the single best argument for the band's second decade — the arpeggios aren't a device, they're a physics — and "Reckoner" still sounds like a room finally letting go of something it has been holding.`,
        tags: ["Grower", "Autumn", "Headphones"],
        helpful: 28,
        palette: ["#241106", "#5b3a1e", "#8a5a2e"],
        letter: "I",
    },
    {
        id: "rev-2",
        target: "A Crow Looked at Me",
        artist: "Mount Eerie",
        year: 2017,
        rating: 9,
        date: "2 weeks ago",
        body: "Language collapses into a documentary. It isn't beautiful; it isn't trying to be. The directness is so total it loops back into a kind of poetry — not because anything is shaped, but because nothing is.",
        tags: ["Grief", "Singular"],
        helpful: 41,
        palette: ["#08141a", "#14283a", "#1e3a5b"],
        letter: "A",
    },
    {
        id: "rev-3",
        target: "OK Computer",
        artist: "Radiohead",
        year: 1997,
        rating: 10,
        date: "1 month ago",
        body: 'Still the best record about a feeling that hadn\'t been named yet. "Let Down" is what the next twenty years of indie rock kept reaching for.',
        tags: ["Canon"],
        helpful: 86,
        palette: ["#0a1a2a", "#1e3a5b", "#2e5b8a"],
        letter: "O",
    },
    {
        id: "rev-4",
        target: "Mezzanine",
        artist: "Massive Attack",
        year: 1998,
        rating: 9,
        date: "4 months ago",
        body: "A record built out of rooms. The basslines walk through doors and don't always come back. Twenty-six years on, it still sounds like something you shouldn't be listening to alone.",
        tags: ["Late night", "Headphones"],
        helpful: 17,
        palette: ["#08141a", "#14283a", "#1e3a5b"],
        letter: "M",
    },
    {
        id: "rev-5",
        target: "Discovery",
        artist: "Daft Punk",
        year: 2001,
        rating: 9,
        date: "6 months ago",
        body: 'The first hour of "One More Time" coming on after a long week is, somehow, still a religious experience. Engineered like a watch and warm like a memory.',
        tags: ["Joy"],
        helpful: 22,
        palette: ["#2a140a", "#6b3a1e", "#a85a3e"],
        letter: "D",
    },
    {
        id: "rev-6",
        target: "Blonde",
        artist: "Frank Ocean",
        year: 2016,
        rating: 9,
        date: "7 months ago",
        body: "Patience is the whole record. Patience as a virtue, patience as a stance, patience as a kind of sound design.",
        tags: ["Grower"],
        helpful: 33,
        palette: ["#1a1408", "#3a2e14", "#5b4a24"],
        letter: "B",
    },
];

export const MOCK_RATING_DISTRIBUTION = [
    1, 2, 3, 4, 6, 8, 11, 14, 18, 24, 28, 31, 32, 30, 26, 22, 17, 12, 7, 3,
];

export const MOCK_TOP_ARTISTS = [
    { name: "Radiohead", count: 18, avg: 9.4 },
    { name: "Sufjan Stevens", count: 11, avg: 8.9 },
    { name: "Tame Impala", count: 8, avg: 8.2 },
    { name: "Bon Iver", count: 7, avg: 8.7 },
    { name: "Frank Ocean", count: 6, avg: 9.0 },
    { name: "Kendrick Lamar", count: 6, avg: 9.2 },
    { name: "Phoebe Bridgers", count: 5, avg: 7.9 },
    { name: "Massive Attack", count: 5, avg: 8.6 },
    { name: "The National", count: 5, avg: 7.8 },
    { name: "Wilco", count: 4, avg: 8.4 },
];

export const MOCK_BY_DECADE = [
    { decade: "1960s", count: 4 },
    { decade: "1970s", count: 12 },
    { decade: "1980s", count: 18 },
    { decade: "1990s", count: 38 },
    { decade: "2000s", count: 64 },
    { decade: "2010s", count: 78 },
    { decade: "2020s", count: 33 },
];

export const MOCK_TOP_GENRES = [
    { name: "Indie rock", count: 42 },
    { name: "Art rock", count: 31 },
    { name: "Folk", count: 24 },
    { name: "Electronic", count: 22 },
    { name: "Hip-hop", count: 18 },
    { name: "Ambient", count: 14 },
    { name: "Post-rock", count: 12 },
    { name: "Jazz", count: 10 },
];

export const MOCK_STATUS_BREAKDOWN: Array<{
    id: StatusId;
    label: string;
    count: number;
}> = [
    { id: "loved", label: "Loved", count: 64 },
    { id: "listened", label: "Listened", count: 138 },
    { id: "listening", label: "Listening", count: 4 },
    { id: "backlog", label: "Backlog", count: 28 },
    { id: "shelved", label: "Shelved", count: 13 },
];
