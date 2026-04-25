declare module "bun" {
    interface Env {
        BETTER_AUTH_SECRET: string;
        DATABASE_URL: string;
        APP_URL: string;
        MAILJET_API_KEY: string;
        MAILJET_SECRET_KEY: string;
        R2_ACCOUNT_ID: string;
        R2_ACCESS_KEY_ID: string;
        R2_SECRET_ACCESS_KEY: string;
        R2_BUCKET: string;
        R2_PUBLIC_BASE_URL: string;
        REDIS_URL: string;
        MUSICBRAINZ_USER_AGENT: string;
    }
}
