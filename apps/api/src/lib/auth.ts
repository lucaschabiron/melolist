import { betterAuth } from "better-auth";
import {
    createAuthMiddleware,
    createEmailVerificationToken,
} from "better-auth/api";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { username } from "better-auth/plugins";
import { db, userProfileTable } from "@melolist/db";

const UNVERIFIED_ACCOUNT_TTL_MS = 1000 * 60 * 60 * 24 * 7;
const normalizeUsername = (value: string) => value.toLowerCase();
const usernamePlugin = username({ usernameNormalization: normalizeUsername });
const cookieDomain = process.env.COOKIE_DOMAIN?.trim();
const normalizedCookieDomain = cookieDomain?.replace(/^\./, "");
const appUrl = process.env.APP_URL;
const betterAuthUrl = process.env.BETTER_AUTH_URL;
const isUnsupportedPublicCookieDomain =
    normalizedCookieDomain === "railway.app";
const appEnv = (
    process.env.APP_ENV ??
    process.env.NODE_ENV ??
    "development"
)
    .trim()
    .toLowerCase();
const isProduction = appEnv === "production";
const authDebugEnabled = process.env.AUTH_DEBUG === "true";

const getHostname = (value?: string) => {
    if (!value) return null;
    try {
        return new URL(value).hostname;
    } catch {
        return null;
    }
};

const appHostname = getHostname(appUrl);
const apiHostname = getHostname(betterAuthUrl);

if (!process.env.APP_ENV) {
    console.warn(
        `[auth] APP_ENV is not set. Falling back to "${appEnv}" (APP_ENV -> NODE_ENV -> development).`,
    );
}

if (
    appHostname &&
    apiHostname &&
    appHostname !== apiHostname &&
    !cookieDomain
) {
    console.warn(
        `[auth] APP_URL (${appHostname}) and BETTER_AUTH_URL (${apiHostname}) differ, but COOKIE_DOMAIN is not set. Sessions may not persist across subdomains.`,
    );
}

if (isUnsupportedPublicCookieDomain) {
    console.warn(
        "[auth] COOKIE_DOMAIN=.railway.app is too broad for Railway preview domains. Use a concrete parent domain such as .up.railway.app.",
    );
}

const logAuthDebug = (
    event: string,
    details: Record<string, string | number | boolean | null | undefined>,
) => {
    if (!authDebugEnabled) {
        return;
    }

    console.info(`[auth-debug] ${event}`, details);
};

type ExistingUser = {
    id: string;
    email: string;
    name: string;
    image?: string | null;
    emailVerified: boolean;
    createdAt: Date;
    updatedAt: Date;
    username?: string | null;
    displayUsername?: string | null;
};

async function sendEmail(to: string, subject: string, html: string) {
    const key = process.env.MAILJET_API_KEY;
    const secret = process.env.MAILJET_SECRET_KEY;
    if (!key || !secret) {
        throw new Error("Verification email delivery is not configured.");
    }
    const res = await fetch("https://api.mailjet.com/v3.1/send", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Basic ${btoa(`${key}:${secret}`)}`,
        },
        body: JSON.stringify({
            Messages: [
                {
                    From: { Email: "noreply@melolist.com", Name: "MeloList" },
                    To: [{ Email: to }],
                    Subject: subject,
                    HTMLPart: html,
                },
            ],
        }),
    });
    if (!res.ok) {
        throw new Error(
            `Verification email delivery failed with status ${res.status}.`,
        );
    }
}

function isExpiredUnverifiedUser(user: ExistingUser) {
    return (
        !user.emailVerified &&
        Date.now() - new Date(user.createdAt).getTime() >=
            UNVERIFIED_ACCOUNT_TTL_MS
    );
}

function buildSyntheticPendingUser(body: {
    email: string;
    name: string;
    image?: string;
    username?: string;
    displayUsername?: string;
}) {
    const now = new Date();

    return {
        id: "pending-signup",
        email: body.email.toLowerCase(),
        name: body.name,
        image: body.image ?? null,
        emailVerified: false,
        createdAt: now,
        updatedAt: now,
        ...(typeof body.username === "string"
            ? { username: normalizeUsername(body.username) }
            : {}),
        ...(typeof body.displayUsername === "string"
            ? { displayUsername: body.displayUsername }
            : {}),
    };
}

async function resendVerificationEmail(
    ctx: Parameters<Parameters<typeof createAuthMiddleware>[0]>[0],
    user: ExistingUser,
) {
    const sendVerification =
        ctx.context.options.emailVerification?.sendVerificationEmail;

    if (!sendVerification) {
        return;
    }

    const token = await createEmailVerificationToken(
        ctx.context.secret,
        user.email,
        undefined,
        ctx.context.options.emailVerification?.expiresIn,
    );
    const callbackURL =
        typeof ctx.body.callbackURL === "string"
            ? encodeURIComponent(ctx.body.callbackURL)
            : encodeURIComponent("/");
    const url = `${ctx.context.baseURL}/verify-email?token=${token}&callbackURL=${callbackURL}`;

    await ctx.context.runInBackgroundOrAwait(
        sendVerification(
            {
                user,
                url,
                token,
            },
            ctx.request,
        ),
    );
}

export const auth = betterAuth({
    database: drizzleAdapter(db, { provider: "pg" }),
    emailAndPassword: {
        enabled: true,
        requireEmailVerification: true,
    },
    emailVerification: {
        sendOnSignUp: true,
        autoSignInAfterVerification: true,
        sendVerificationEmail: async ({ user, url }) => {
            await sendEmail(
                user.email,
                "Verify your MeloList account",
                `<div style="background:#0d0d0d;padding:48px 24px;font-family:-apple-system,system-ui,sans-serif;">
  <div style="max-width:480px;margin:0 auto;">
    <h1 style="color:#f7f7f7;font-size:20px;font-weight:500;margin:0 0 16px;">Verify your email</h1>
    <p style="color:#6b6b6b;font-size:15px;line-height:1.6;margin:0 0 24px;">
      Click the button below to verify your email address and start using MeloList.
    </p>
    <a href="${url}" style="display:inline-block;background:#f7f7f7;color:#0d0d0d;font-size:15px;font-weight:500;padding:12px 24px;border-radius:4px;text-decoration:none;">
      Verify email
    </a>
    <p style="color:#6b6b6b;font-size:13px;line-height:1.5;margin:32px 0 0;">
      If you didn't create a MeloList account, ignore this email.
    </p>
  </div>
</div>`,
            );
        },
    },
    plugins: [usernamePlugin],
    trustedOrigins: [process.env.APP_URL ?? "http://localhost:3001"],
    advanced:
        cookieDomain && !isUnsupportedPublicCookieDomain
        ? {
              crossSubDomainCookies: {
                  enabled: true,
                  domain: cookieDomain,
              },
              defaultCookieAttributes: {
                  sameSite: "lax",
                  secure: isProduction,
              },
          }
        : undefined,
    databaseHooks: {
        user: {
            create: {
                after: async (user) => {
                    await db
                        .insert(userProfileTable)
                        .values({ userId: user.id });
                },
            },
        },
    },
    hooks: {
        before: createAuthMiddleware(async (ctx) => {
            if (ctx.path === "/sign-in/email" || ctx.path === "/get-session") {
                const cookieHeader = ctx.request.headers.get("cookie");
                const sessionCookiePresent =
                    cookieHeader?.includes("better-auth.session_token") ??
                    false;

                logAuthDebug("incoming-auth-request", {
                    path: ctx.path,
                    method: ctx.request.method,
                    origin: ctx.request.headers.get("origin"),
                    host: ctx.request.headers.get("host"),
                    hasCookieHeader: Boolean(cookieHeader),
                    sessionCookiePresent,
                    cookieDomain: cookieDomain ?? null,
                    appEnv,
                    secureCookies: isProduction,
                });
            }

            if (ctx.path !== "/sign-up/email") {
                return;
            }

            const normalizedEmail =
                typeof ctx.body.email === "string"
                    ? ctx.body.email.toLowerCase()
                    : null;

            if (normalizedEmail) {
                const existingEmailUser =
                    await ctx.context.internalAdapter.findUserByEmail(
                        normalizedEmail,
                    );

                if (existingEmailUser) {
                    if (isExpiredUnverifiedUser(existingEmailUser.user)) {
                        await ctx.context.internalAdapter.deleteUser(
                            existingEmailUser.user.id,
                        );
                    } else {
                        if (!existingEmailUser.user.emailVerified) {
                            await resendVerificationEmail(
                                ctx,
                                existingEmailUser.user,
                            );
                        }

                        return ctx.json({
                            token: null,
                            user: buildSyntheticPendingUser({
                                email: normalizedEmail,
                                name:
                                    typeof ctx.body.name === "string"
                                        ? ctx.body.name
                                        : "",
                                image:
                                    typeof ctx.body.image === "string"
                                        ? ctx.body.image
                                        : undefined,
                                username:
                                    typeof ctx.body.username === "string"
                                        ? ctx.body.username
                                        : undefined,
                                displayUsername:
                                    typeof ctx.body.displayUsername === "string"
                                        ? ctx.body.displayUsername
                                        : undefined,
                            }),
                        });
                    }
                }
            }

            if (typeof ctx.body.username === "string") {
                const existingUsernameUser = (await ctx.context.adapter.findOne(
                    {
                        model: "user",
                        where: [
                            {
                                field: "username",
                                value: normalizeUsername(ctx.body.username),
                            },
                        ],
                    },
                )) as ExistingUser | null;

                if (
                    existingUsernameUser &&
                    isExpiredUnverifiedUser(existingUsernameUser)
                ) {
                    await ctx.context.internalAdapter.deleteUser(
                        existingUsernameUser.id,
                    );
                }
            }
        }),
    },
});
