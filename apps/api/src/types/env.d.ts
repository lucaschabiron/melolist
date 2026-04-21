declare module "bun" {
    interface Env {
        BETTER_AUTH_SECRET: string;
        DATABASE_URL: string;
        APP_URL: string;
        MAILJET_API_KEY: string;
        MAILJET_SECRET_KEY: string;
        REDIS_URL: string;
        MUSICBRAINZ_USER_AGENT: string;
    }
}
