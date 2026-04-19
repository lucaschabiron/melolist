export const apiBaseUrl =
    process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000";

export const authApiBaseUrl = new URL("/api/auth", apiBaseUrl).toString();
