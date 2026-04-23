import { Elysia } from "elysia";
import { cors } from "@elysiajs/cors";
import { authController } from "./modules/auth";
import { catalogController } from "./modules/catalog";
import { userController } from "./modules/user";

const app = new Elysia()
    .use(
        cors({
            origin: Bun.env.APP_URL,
            methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
            credentials: true,
            allowedHeaders: ["Content-Type", "Authorization"],
        }),
    )
    .use(authController)
    .use(catalogController)
    .use(userController)
    .listen(process.env.PORT ?? 3000);

export type App = typeof app;
console.log(
    `🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`,
);
