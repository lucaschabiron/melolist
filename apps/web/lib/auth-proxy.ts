import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { apiBaseUrl } from "./config";

const sessionEndpoint = new URL("/api/auth/get-session", apiBaseUrl);

type SessionResponse = {
    session: Record<string, unknown>;
    user: Record<string, unknown>;
} | null;

const appendSetCookieHeaders = (source: Headers, target: Headers) => {
    const headersWithGetSetCookie = source as Headers & {
        getSetCookie?: () => string[];
    };

    if (typeof headersWithGetSetCookie.getSetCookie === "function") {
        for (const cookie of headersWithGetSetCookie.getSetCookie()) {
            target.append("set-cookie", cookie);
        }
        return;
    }

    const setCookie = source.get("set-cookie");
    if (setCookie) target.append("set-cookie", setCookie);
};

const getSession = async (request: NextRequest) => {
    const headers = new Headers();
    const cookie = request.headers.get("cookie");

    if (cookie) headers.set("cookie", cookie);
    headers.set("accept", "application/json");

    return fetch(sessionEndpoint, {
        method: "GET",
        headers,
        cache: "no-store",
    });
};

const redirectToAuthUnavailable = (request: NextRequest) => {
    const url = new URL("/auth-unavailable", request.url);
    url.searchParams.set("from", request.nextUrl.pathname);
    return NextResponse.redirect(url);
};

export async function proxy(request: NextRequest) {
    let sessionResponse: Response;

    try {
        sessionResponse = await getSession(request);
    } catch {
        return redirectToAuthUnavailable(request);
    }

    let session: SessionResponse = null;

    if (sessionResponse.status >= 500) {
        return redirectToAuthUnavailable(request);
    }

    if (sessionResponse.ok) {
        try {
            session = (await sessionResponse.json()) as SessionResponse;
        } catch {
            return redirectToAuthUnavailable(request);
        }
    }

    const response = session
        ? NextResponse.next()
        : NextResponse.redirect(new URL("/login", request.url));

    appendSetCookieHeaders(sessionResponse.headers, response.headers);

    return response;
}
