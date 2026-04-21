export type Track = {
    n: number;
    title: string;
    dur: string;
    you: number;
    comm: number;
};

export type ArchivedReview = {
    rating: number;
    date: string;
    body: string;
};

export type CommunityReview = {
    name: string;
    handle: string;
    color: string;
    date: string;
    rating: number;
    body: string;
    tags: string[];
    helpful: number;
};

export type Edition = {
    label: string;
    format: string;
    country: string;
    year: number;
    palette: [string, string, string];
    letter: string;
    owned: boolean;
};

export type RelatedItem = {
    title: string;
    artist?: string;
    year: number;
    palette: [string, string, string];
    letter: string;
};

export const ALBUM = {
    artist: "Radiohead",
    title: "In Rainbows",
    year: 2007,
    type: "Album",
    tracks: 10,
    runtime: "42 min",
    genre: "Art rock",
    label: "XL Recordings",
    country: "United Kingdom",
    communityScore: 9.1,
    ratingsCount: 48291,
    histogram: [
        2, 3, 4, 5, 8, 10, 14, 22, 30, 48, 74, 110, 168, 240, 360, 520, 780,
        1140, 1480, 960,
    ],
};

export const TRACKS: Track[] = [
    { n: 1, title: "15 Step", dur: "3:57", you: 9, comm: 8.9 },
    { n: 2, title: "Bodysnatchers", dur: "4:02", you: 8.5, comm: 8.7 },
    { n: 3, title: "Nude", dur: "4:15", you: 10, comm: 9.4 },
    { n: 4, title: "Weird Fishes / Arpeggi", dur: "5:18", you: 10, comm: 9.6 },
    { n: 5, title: "All I Need", dur: "3:48", you: 9.5, comm: 9.1 },
    { n: 6, title: "Faust Arp", dur: "2:09", you: 8, comm: 8.2 },
    { n: 7, title: "Reckoner", dur: "4:50", you: 10, comm: 9.7 },
    { n: 8, title: "House of Cards", dur: "5:28", you: 8.5, comm: 8.8 },
    {
        n: 9,
        title: "Jigsaw Falling Into Place",
        dur: "4:09",
        you: 9,
        comm: 9.0,
    },
    { n: 10, title: "Videotape", dur: "4:40", you: 9.5, comm: 9.3 },
];

export const PERSONAL = {
    status: "loved" as const,
    statusLabel: "Loved",
    rating: 9.5,
    firstListened: "First listened March 2008",
    revisits: 4,
    owns: "Own · 2008 XL vinyl",
};

export const YOUR_REVIEW = {
    rating: 9.5,
    date: "12 March 2026",
    body: `Eighteen years on, the thing that startles me is how little it needs from you. It doesn't chase, it doesn't build; it arrives already settled into its own weather. "Weird Fishes" remains the single best argument for the band's second decade — the arpeggios aren't a device, they're a physics — and "Reckoner" still sounds like a room finally letting go of something it has been holding.\n\nI had forgotten how quiet the loud parts are. How much of the record is just two people breathing near a microphone.`,
    tags: ["Grower", "Autumn", "Headphones"],
};

export const ARCHIVED_REVIEWS: ArchivedReview[] = [
    {
        rating: 9,
        date: "4 November 2021",
        body: 'Put this on after a long walk and let "Nude" do the thing it does. I think I finally understand what Yorke means when he says "now that you found it, it\'s gone." It\'s the record, not the lyric.',
    },
    {
        rating: 10,
        date: "22 August 2018",
        body: 'Tied for the best album of its decade, if I\'m being honest with myself. The sequencing from "Weird Fishes" through "Faust Arp" is small-miracle work.',
    },
    {
        rating: 8.5,
        date: "3 February 2014",
        body: 'A little too patient for the mood I\'ve been in. I keep coming back to "15 Step" and then drifting off. Will try again in winter.',
    },
    {
        rating: 9,
        date: "17 July 2011",
        body: "First proper listen since college. Holds up. The pay-what-you-want release still feels like the bravest thing a rock band did that decade.",
    },
];

export const COMMUNITY_REVIEWS: CommunityReview[] = [
    {
        name: "Marcus Rinehart",
        handle: "@mrinehart",
        color: "#5a4a3a",
        date: "2 April 2026",
        rating: 10,
        body: `The pay-what-you-want release felt radical at the time; the record itself is the quieter radicalism. It trades the machine-anxiety of Kid A for something closer to human weather — small rooms, patient hands, a band willing to let a song end where it wants to instead of where the form expects.\n\n"Videotape" is still the hardest closer they've written. It arrives like a door being closed from the other side.`,
        tags: ["Canon", "Autumn", "Headphones"],
        helpful: 342,
    },
    {
        name: "Priya Shah",
        handle: "@priya.shah",
        color: "#3a4a5b",
        date: "28 March 2026",
        rating: 9.5,
        body: `I came to this album backwards, through A Moon Shaped Pool, and so I heard it as the warm ancestor. The guitars on "Weird Fishes" sound like someone trying to remember a dream while still inside it. Phil Selway's drumming is the case for Phil Selway's drumming.`,
        tags: ["Grower"],
        helpful: 201,
    },
    {
        name: "Daniel Ooi",
        handle: "@danooi",
        color: "#4a3a5b",
        date: "17 March 2026",
        rating: 8,
        body: 'Beautiful record, but I\'ve never fully bought the consensus on it. "Faust Arp" and "House of Cards" thin out in places where Kid A or OK Computer would have dug in. Respect more than love, for me.',
        tags: ["Contrarian"],
        helpful: 88,
    },
    {
        name: "Hana Byrne",
        handle: "@hanabyrne",
        color: "#5a3a4a",
        date: "9 March 2026",
        rating: 10,
        body: '"Reckoner" is the song I would play for someone who had never heard Radiohead and wanted to know why the fuss. Everything the band can do in four minutes and fifty seconds.',
        tags: ["Canon"],
        helpful: 174,
    },
    {
        name: "Luca Fontana",
        handle: "@l.fontana",
        color: "#3a5b4a",
        date: "1 March 2026",
        rating: 9,
        body: "Listened to this on vinyl for the first time last month after owning the CD for fifteen years. The low end on \"15 Step\" is a different record on a turntable. Worth hunting down the 2008 pressing.",
        tags: ["Vinyl"],
        helpful: 62,
    },
];

export const EDITIONS: Edition[] = [
    {
        label: "2007 CD",
        format: "CD",
        country: "UK",
        year: 2007,
        palette: ["#2a1408", "#5b3a1e", "#8a5a2e"],
        letter: "I",
        owned: false,
    },
    {
        label: "Discbox (2xLP + CD)",
        format: "2×LP + CD",
        country: "UK",
        year: 2008,
        palette: ["#1a0e08", "#3a2014", "#6b3a1e"],
        letter: "D",
        owned: true,
    },
    {
        label: "Standard LP",
        format: "LP",
        country: "UK",
        year: 2008,
        palette: ["#241008", "#4a2614", "#7a3e1e"],
        letter: "L",
        owned: false,
    },
    {
        label: "Japanese tour edition",
        format: "CD",
        country: "JP",
        year: 2008,
        palette: ["#2a0e14", "#5b1e2e", "#8a2e44"],
        letter: "J",
        owned: false,
    },
    {
        label: "2016 reissue",
        format: "LP",
        country: "US",
        year: 2016,
        palette: ["#1a1408", "#3a2e14", "#5b4a24"],
        letter: "R",
        owned: false,
    },
    {
        label: "From the Basement (w/ film)",
        format: "DVD",
        country: "UK",
        year: 2009,
        palette: ["#08141a", "#14283a", "#1e3a5b"],
        letter: "B",
        owned: false,
    },
];

export const MORE_FROM_ARTIST: RelatedItem[] = [
    {
        title: "OK Computer",
        year: 1997,
        palette: ["#0a1a2a", "#1e3a5b", "#2e5b8a"],
        letter: "O",
    },
    {
        title: "Kid A",
        year: 2000,
        palette: ["#2a0a0a", "#5b1e1e", "#8a2e2e"],
        letter: "K",
    },
    {
        title: "Amnesiac",
        year: 2001,
        palette: ["#1a1a1a", "#2e2e2e", "#4a4a4a"],
        letter: "A",
    },
    {
        title: "Hail to the Thief",
        year: 2003,
        palette: ["#0a1a0a", "#1e3a1e", "#2e5b2e"],
        letter: "H",
    },
    {
        title: "The King of Limbs",
        year: 2011,
        palette: ["#1a140a", "#3a2e1e", "#5b4a2e"],
        letter: "T",
    },
    {
        title: "A Moon Shaped Pool",
        year: 2016,
        palette: ["#2a1a0a", "#5b3a1e", "#8a5a3e"],
        letter: "M",
    },
];

export const ALSO_LIKED: RelatedItem[] = [
    {
        title: "Sea Change",
        artist: "Beck",
        year: 2002,
        palette: ["#0a1a2a", "#1e4a6b", "#3a6b8a"],
        letter: "S",
    },
    {
        title: "The Soft Bulletin",
        artist: "The Flaming Lips",
        year: 1999,
        palette: ["#2a0a2a", "#5b1e5b", "#8a2e7a"],
        letter: "F",
    },
    {
        title: "Grace",
        artist: "Jeff Buckley",
        year: 1994,
        palette: ["#14141a", "#2e2e4a", "#4a4a6b"],
        letter: "G",
    },
    {
        title: "For Emma, Forever Ago",
        artist: "Bon Iver",
        year: 2007,
        palette: ["#1a1a14", "#3a3a2e", "#6b6b5a"],
        letter: "E",
    },
    {
        title: "Currents",
        artist: "Tame Impala",
        year: 2015,
        palette: ["#2a140a", "#6b3a1e", "#a85a3e"],
        letter: "C",
    },
    {
        title: "Turn Out the Lights",
        artist: "Julien Baker",
        year: 2017,
        palette: ["#1a1428", "#3a2e4a", "#5b4a7a"],
        letter: "T",
    },
];

export type StatusId = "backlog" | "listening" | "listened" | "loved" | "shelved";

export const STATUSES: { id: StatusId; label: string }[] = [
    { id: "backlog", label: "Backlog" },
    { id: "listening", label: "Listening" },
    { id: "listened", label: "Listened" },
    { id: "loved", label: "Loved" },
    { id: "shelved", label: "Shelved" },
];
