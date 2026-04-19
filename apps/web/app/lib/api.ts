import { treaty } from "@elysiajs/eden";
import type { App } from "@melolist/api";

export const api: ReturnType<typeof treaty<App>> = treaty<App>(
    "http://localhost:3000",
    {
        fetch: { credentials: "include" },
    },
);
