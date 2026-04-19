declare module "bun" {
    interface Env {
        BETTER_AUTH_SECRET: string;
        DATABASE_URL: string;
        APP_URL: string;
    }
}
