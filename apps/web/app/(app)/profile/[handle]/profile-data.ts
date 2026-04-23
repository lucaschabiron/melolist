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
