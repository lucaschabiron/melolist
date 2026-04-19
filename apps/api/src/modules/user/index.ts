import { Elysia } from "elysia";
import { authController } from "../auth";
import { UserService } from "./service";

export const userController = new Elysia({ prefix: "/user", tags: ["user"] })
    .use(authController)
    .get("/", () => UserService.listAll());
