import { createAuthClient } from "better-auth/react";
import { usernameClient } from "better-auth/client/plugins";
import { apiBaseUrl } from "../../lib/config";

export const authClient = createAuthClient({
    baseURL: apiBaseUrl,
    plugins: [usernameClient()],
});

export const { signIn, signUp, signOut, useSession } = authClient;
