import { describe, expect, it } from "bun:test";
import type { MbArtistSearchResult, MbReleaseGroupSearchResult } from "./types";
import {
    dedupeAndLimitByMbid,
    mapMusicbrainzArtistSearch,
    mapMusicbrainzReleaseGroupSearch,
    normalizeSearchQuery,
    shouldUseRemoteFallback,
} from "./search";

describe("normalizeSearchQuery", () => {
    it("trims, lowercases, and collapses whitespace", () => {
        expect(normalizeSearchQuery("  BjÖRK   Guðmundsdóttir  ")).toBe(
            "björk guðmundsdóttir",
        );
    });
});

describe("shouldUseRemoteFallback", () => {
    it("uses remote fallback only when local coverage is weak", () => {
        expect(shouldUseRemoteFallback(0)).toBe(true);
        expect(shouldUseRemoteFallback(4)).toBe(true);
        expect(shouldUseRemoteFallback(5)).toBe(false);
    });
});

describe("dedupeAndLimitByMbid", () => {
    it("keeps local results ahead of remote duplicates", () => {
        const merged = dedupeAndLimitByMbid(
            [
                { mbid: "a", source: "local" as const },
                { mbid: "b", source: "local" as const },
            ],
            [
                { mbid: "b", source: "musicbrainz" as const },
                { mbid: "c", source: "musicbrainz" as const },
            ],
            8,
        );

        expect(merged).toEqual([
            { mbid: "a", source: "local" },
            { mbid: "b", source: "local" },
            { mbid: "c", source: "musicbrainz" },
        ]);
    });
});

describe("MusicBrainz search mappers", () => {
    it("maps artist search results to catalog search items", () => {
        const payload: MbArtistSearchResult = {
            count: 1,
            offset: 0,
            artists: [
                {
                    id: "artist-1",
                    name: "Björk",
                    "sort-name": "Guðmundsdóttir, Björk",
                    country: "IS",
                    disambiguation: "Icelandic singer-songwriter",
                    score: 100,
                },
            ],
        };

        expect(mapMusicbrainzArtistSearch(payload)).toEqual([
            {
                id: null,
                mbid: "artist-1",
                name: "Björk",
                sortName: "Guðmundsdóttir, Björk",
                disambiguation: "Icelandic singer-songwriter",
                country: "IS",
                source: "musicbrainz",
                seeded: false,
            },
        ]);
    });

    it("maps release-group search results to catalog search items", () => {
        const payload: MbReleaseGroupSearchResult = {
            count: 1,
            offset: 0,
            "release-groups": [
                {
                    id: "rg-1",
                    title: "Homogenic",
                    "primary-type": "Album",
                    "secondary-types": ["Soundtrack"],
                    "first-release-date": "1997-09-22",
                    "artist-credit": [
                        {
                            name: "Björk",
                            artist: {
                                id: "artist-1",
                                name: "Björk",
                            },
                        },
                    ],
                    score: 98,
                },
            ],
        };

        expect(mapMusicbrainzReleaseGroupSearch(payload)).toEqual([
            {
                id: null,
                mbid: "rg-1",
                title: "Homogenic",
                artistCredit: "Björk",
                artist: {
                    mbid: "artist-1",
                    name: "Björk",
                },
                releaseType: "soundtrack",
                secondaryTypes: ["Soundtrack"],
                firstReleaseDate: "1997-09-22",
                coverArtUrl: null,
                source: "musicbrainz",
                seeded: false,
            },
        ]);
    });
});
