import type { StatusId } from "../../release-groups/[mbid]/album-data";

export type ArtistPersonalStats = {
    albumsRated: number;
    albumsInDiscography: number;
    averageRating: number;
    reviews: number;
    firstListened: string;
    owned: number;
    statusMix: Array<{ id: StatusId; label: string; count: number }>;
};

export type RelatedArtist = {
    name: string;
    foundedYear: number | null;
    origin: string | null;
    palette: [string, string, string];
    letter: string;
};

export const PERSONAL_STATS: ArtistPersonalStats = {
    albumsRated: 5,
    albumsInDiscography: 9,
    averageRating: 9.1,
    reviews: 14,
    firstListened: "First heard March 2008",
    owned: 3,
    statusMix: [
        { id: "loved", label: "Loved", count: 2 },
        { id: "listened", label: "Listened", count: 3 },
        { id: "listening", label: "Listening", count: 1 },
        { id: "backlog", label: "Backlog", count: 2 },
        { id: "shelved", label: "Shelved", count: 1 },
    ],
};

export const COMMUNITY_RATING = {
    score: 9.0,
    ratings: 182_430,
    followers: 48_291,
};

export const RELATED_ARTISTS: RelatedArtist[] = [
    {
        name: "Thom Yorke",
        foundedYear: 1968,
        origin: "UK",
        palette: ["#1a140a", "#3a2e1e", "#6b4a2e"],
        letter: "T",
    },
    {
        name: "Atoms for Peace",
        foundedYear: 2009,
        origin: "UK · US",
        palette: ["#0a1a1a", "#1e3a3a", "#2e5b5b"],
        letter: "A",
    },
    {
        name: "Portishead",
        foundedYear: 1991,
        origin: "UK",
        palette: ["#14141a", "#2e2e4a", "#4a4a6b"],
        letter: "P",
    },
    {
        name: "Sigur Rós",
        foundedYear: 1994,
        origin: "IS",
        palette: ["#0a1a2a", "#1e3a5b", "#3a6b8a"],
        letter: "S",
    },
    {
        name: "Björk",
        foundedYear: 1965,
        origin: "IS",
        palette: ["#2a0a2a", "#5b1e5b", "#8a2e7a"],
        letter: "B",
    },
    {
        name: "Four Tet",
        foundedYear: 1998,
        origin: "UK",
        palette: ["#14281a", "#2e5b3a", "#4a8a5b"],
        letter: "F",
    },
];

const PALETTES: Array<[string, string, string]> = [
    ["#241106", "#5b3a1e", "#8a5a2e"],
    ["#0a1a2a", "#1e4a6b", "#3a6b8a"],
    ["#2a0a2a", "#5b1e5b", "#8a2e7a"],
    ["#14281a", "#2e5b3a", "#4a8a5b"],
    ["#2a140a", "#6b3a1e", "#a85a3e"],
    ["#14141a", "#2e2e4a", "#4a4a6b"],
    ["#0a1a0a", "#1e3a1e", "#2e5b2e"],
    ["#1a1408", "#3a2e14", "#5b4a24"],
    ["#08141a", "#14283a", "#1e3a5b"],
];

export function paletteFor(seed: string): [string, string, string] {
    let hash = 0;
    for (let i = 0; i < seed.length; i++) {
        hash = (hash * 31 + seed.charCodeAt(i)) | 0;
    }
    return PALETTES[Math.abs(hash) % PALETTES.length]!;
}
