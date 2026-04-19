import { Elysia } from "elysia";
import { auth } from "../../lib/auth";

export const authController = new Elysia({ name: "auth" })
    .mount(auth.handler)
    .macro({
        auth: {
            resolve: async ({ status, request: { headers } }) => {
                const session = await auth.api.getSession({ headers });
                if (!session) return status(401);
                return { user: session.user, session: session.session };
            },
        },
    });
