export type MbArtistCredit = {
    name: string;
    joinphrase?: string;
    artist: {
        id: string;
        name: string;
        "sort-name"?: string;
        disambiguation?: string;
    };
};

export type MbLifeSpan = {
    begin?: string | null;
    end?: string | null;
    ended?: boolean;
};

export type MbArtist = {
    id: string;
    name: string;
    "sort-name"?: string;
    disambiguation?: string;
    country?: string | null;
    type?: string | null;
    "life-span"?: MbLifeSpan;
};

export type MbReleaseGroup = {
    id: string;
    title: string;
    "primary-type"?: string | null;
    "secondary-types"?: string[];
    "first-release-date"?: string | null;
    "artist-credit"?: MbArtistCredit[];
    score?: number;
};

export type MbBrowseReleaseGroups = {
    "release-group-count": number;
    "release-group-offset": number;
    "release-groups": MbReleaseGroup[];
};

export type MbArtistSearchResult = {
    count: number;
    offset: number;
    artists: Array<
        MbArtist & {
            score?: number;
        }
    >;
};

export type MbReleaseGroupSearchResult = {
    count: number;
    offset: number;
    "release-groups": MbReleaseGroup[];
};

export type MbRelease = {
    id: string;
    title: string;
    status?: string | null;
    date?: string | null;
    country?: string | null;
    disambiguation?: string | null;
    media?: MbMedium[];
};

export type MbMedium = {
    position: number;
    format?: string | null;
    title?: string | null;
    "track-count"?: number | null;
    tracks?: MbTrack[];
};

export type MbTrack = {
    id?: string | null;
    position: number;
    number?: string | null;
    title: string;
    length?: number | null;
    recording?: {
        id?: string | null;
        title?: string | null;
        length?: number | null;
    } | null;
};

export type MbBrowseReleases = {
    "release-count": number;
    "release-offset": number;
    releases: MbRelease[];
};
