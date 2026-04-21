import { Elysia } from "elysia";
import { auth } from "../../lib/auth";
import { authPlugin } from "../../lib/auth-plugin";

export const authController = new Elysia({ name: "auth" })
    .mount(auth.handler)
    .use(authPlugin);
