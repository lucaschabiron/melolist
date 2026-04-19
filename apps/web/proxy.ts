export { proxy } from "./lib/auth-proxy";

export const config = {
    matcher: ["/((?!login|signup|api|_next|.*\\..*).*)"],
};
