import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { username } from "better-auth/plugins";
import { db, userProfileTable } from "@melolist/db";

export const auth = betterAuth({
    database: drizzleAdapter(db, { provider: "pg" }),
    emailAndPassword: { enabled: true },
    plugins: [username()],
    trustedOrigins: [process.env.APP_URL ?? "http://localhost:3001"],
    advanced: process.env.COOKIE_DOMAIN
        ? {
              crossSubDomainCookies: {
                  enabled: true,
                  domain: process.env.COOKIE_DOMAIN,
              },
              defaultCookieAttributes: {
                  sameSite: "lax",
                  secure: true,
              },
          }
        : undefined,
    databaseHooks: {
        user: {
            create: {
                after: async (user) => {
                    const handle =
                        (user as { username?: string }).username ??
                        `user_${user.id.slice(0, 8)}`;
                    await db.insert(userProfileTable).values({
                        userId: user.id,
                        handle,
                    });
                },
            },
        },
    },
});
