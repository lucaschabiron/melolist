import type { MbArtist } from "./types";

type WikidataClaimsResponse = {
    claims?: {
        P18?: Array<{
            mainsnak?: {
                datavalue?: {
                    value?: string;
                };
            };
        }>;
    };
};

type WikipediaPageImagesResponse = {
    query?: {
        pages?: Record<
            string,
            {
                original?: { source?: string };
                thumbnail?: { source?: string };
            }
        >;
    };
};

function jsonHeaders() {
    return {
        "User-Agent":
            process.env.MUSICBRAINZ_USER_AGENT ??
            "MeloList/0.1 (artist image lookup)",
        Accept: "application/json",
    };
}

async function fetchJson<T>(url: URL): Promise<T | null> {
    const response = await fetch(url, { headers: jsonHeaders() });
    if (!response.ok) return null;
    return (await response.json()) as T;
}

function relationResources(artist: MbArtist, type: string): string[] {
    return (artist.relations ?? [])
        .filter((relation) => relation.type === type)
        .map((relation) => relation.url?.resource)
        .filter((resource): resource is string => Boolean(resource));
}

function wikidataIdFromUrl(resource: string): string | null {
    try {
        const url = new URL(resource);
        if (!url.hostname.endsWith("wikidata.org")) return null;
        const match = url.pathname.match(/\/(?:wiki\/)?(Q\d+)$/);
        return match?.[1] ?? null;
    } catch {
        return null;
    }
}

function wikipediaTitleFromUrl(resource: string) {
    try {
        const url = new URL(resource);
        if (!url.hostname.endsWith("wikipedia.org")) return null;
        const match = url.pathname.match(/^\/wiki\/(.+)$/);
        if (!match?.[1]) return null;
        return {
            host: url.hostname,
            title: decodeURIComponent(match[1]).replaceAll("_", " "),
        };
    } catch {
        return null;
    }
}

function commonsFileUrl(filename: string): string {
    return `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(filename)}?width=800`;
}

async function imageFromWikidata(entityId: string): Promise<string | null> {
    const url = new URL("https://www.wikidata.org/w/api.php");
    url.searchParams.set("action", "wbgetclaims");
    url.searchParams.set("entity", entityId);
    url.searchParams.set("property", "P18");
    url.searchParams.set("format", "json");
    url.searchParams.set("origin", "*");

    const payload = await fetchJson<WikidataClaimsResponse>(url);
    const filename =
        payload?.claims?.P18?.[0]?.mainsnak?.datavalue?.value?.trim();
    return filename ? commonsFileUrl(filename) : null;
}

async function imageFromWikipedia(
    page: NonNullable<ReturnType<typeof wikipediaTitleFromUrl>>,
): Promise<string | null> {
    const url = new URL(`https://${page.host}/w/api.php`);
    url.searchParams.set("action", "query");
    url.searchParams.set("titles", page.title);
    url.searchParams.set("prop", "pageimages");
    url.searchParams.set("piprop", "original|thumbnail");
    url.searchParams.set("pithumbsize", "800");
    url.searchParams.set("format", "json");
    url.searchParams.set("origin", "*");

    const payload = await fetchJson<WikipediaPageImagesResponse>(url);
    const pages = Object.values(payload?.query?.pages ?? {});
    return (
        pages.find((candidate) => candidate.original?.source)?.original
            ?.source ??
        pages.find((candidate) => candidate.thumbnail?.source)?.thumbnail
            ?.source ??
        null
    );
}

export async function resolveArtistImageUrl(
    artist: MbArtist,
): Promise<string | null> {
    const wikidataIds = relationResources(artist, "wikidata")
        .map(wikidataIdFromUrl)
        .filter((id): id is string => Boolean(id));

    for (const entityId of wikidataIds) {
        const image = await imageFromWikidata(entityId);
        if (image) return image;
    }

    const wikipediaPages = relationResources(artist, "wikipedia")
        .map(wikipediaTitleFromUrl)
        .filter(
            (
                page,
            ): page is NonNullable<ReturnType<typeof wikipediaTitleFromUrl>> =>
                Boolean(page),
        );

    for (const page of wikipediaPages) {
        const image = await imageFromWikipedia(page);
        if (image) return image;
    }

    return null;
}
