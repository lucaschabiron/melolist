import { treaty } from "@elysiajs/eden";
import type { App } from "@melolist/api";
import { apiBaseUrl } from "../../lib/config";

export const api: ReturnType<typeof treaty<App>> = treaty<App>(apiBaseUrl, {
    fetch: { credentials: "include" },
});
