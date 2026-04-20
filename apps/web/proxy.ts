export { proxy } from "./lib/auth-proxy";

export const config = {
    matcher: ["/((?!login|signup|auth-unavailable|api|_next|.*\\..*).*)"],
};
