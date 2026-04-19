import { Elysia } from "elysia";
import { cors } from "@elysiajs/cors";
import { authController } from "./modules/auth";
import { userController } from "./modules/user";

const app = new Elysia()
    .use(
        cors({
            origin: Bun.env.APP_URL,
            methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
            credentials: true,
            allowedHeaders: ["Content-Type", "Authorization"],
        }),
    )
    .use(authController)
    .use(userController)
    .get("/", () => "Hello Elysia")
    .listen(process.env.PORT ?? 3000);

export type App = typeof app;
console.log(
    `🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`,
);
