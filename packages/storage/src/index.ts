import sharp from "sharp";

function requireEnv(name: string, value: string | undefined): string {
    if (!value) throw new Error(`${name} is required`);
    return value;
}

let cachedClient: Bun.S3Client | null = null;

function getClient(): Bun.S3Client {
    if (cachedClient) return cachedClient;
    cachedClient = new Bun.S3Client({
        accessKeyId: requireEnv(
            "R2_ACCESS_KEY_ID",
            process.env.R2_ACCESS_KEY_ID,
        ),
        secretAccessKey: requireEnv(
            "R2_SECRET_ACCESS_KEY",
            process.env.R2_SECRET_ACCESS_KEY,
        ),
        bucket: requireEnv("R2_BUCKET", process.env.R2_BUCKET),
        endpoint: `https://${requireEnv("R2_ACCOUNT_ID", process.env.R2_ACCOUNT_ID)}.r2.cloudflarestorage.com`,
        region: "auto",
    });
    return cachedClient;
}

export function publicUrl(key: string): string {
    const base = requireEnv(
        "R2_PUBLIC_BASE_URL",
        process.env.R2_PUBLIC_BASE_URL,
    ).replace(/\/+$/, "");
    return `${base}/${key.replace(/^\/+/, "")}`;
}

export function keyFromPublicUrl(
    url: string | null | undefined,
): string | null {
    if (!url || !process.env.R2_PUBLIC_BASE_URL) return null;
    const base = process.env.R2_PUBLIC_BASE_URL.replace(/\/+$/, "");
    if (!url.startsWith(base + "/")) return null;
    return url.slice(base.length + 1);
}

export async function putObject(
    key: string,
    body: ArrayBuffer | Uint8Array | Buffer,
    contentType: string,
): Promise<void> {
    const client = getClient();
    const written = await client.write(key, body, { type: contentType });
    if (written <= 0 || !(await client.exists(key))) {
        throw new Error(`failed to upload ${key}`);
    }
}

export async function deleteObject(key: string): Promise<void> {
    await getClient().delete(key);
}

const AVATAR_SIZE = 512;
const AVATAR_MAX_INPUT_BYTES = 5 * 1024 * 1024;
const AVATAR_ALLOWED_MIME = new Set([
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/gif",
    "image/avif",
]);

export class InvalidImageError extends Error {}

export async function processAvatar(
    input: ArrayBuffer | Uint8Array,
    declaredMime: string,
): Promise<{ buffer: Buffer; contentType: string }> {
    if (!AVATAR_ALLOWED_MIME.has(declaredMime)) {
        throw new InvalidImageError(`unsupported mime type: ${declaredMime}`);
    }
    const inputBytes =
        input instanceof ArrayBuffer ? input.byteLength : input.byteLength;
    if (inputBytes > AVATAR_MAX_INPUT_BYTES) {
        throw new InvalidImageError("image exceeds 5MB limit");
    }

    const inputBuffer =
        input instanceof ArrayBuffer ? Buffer.from(input) : Buffer.from(input);

    let pipeline = sharp(inputBuffer, { failOn: "error" }).rotate();

    const metadata = await pipeline.metadata();
    if (!metadata.width || !metadata.height) {
        throw new InvalidImageError("could not read image dimensions");
    }

    pipeline = pipeline
        .resize(AVATAR_SIZE, AVATAR_SIZE, { fit: "cover", position: "centre" })
        .webp({ quality: 86, effort: 4 });

    const buffer = await pipeline.toBuffer();
    return { buffer, contentType: "image/webp" };
}

export function avatarKey(userId: string): string {
    const random = crypto.randomUUID().slice(0, 12);
    return `avatars/${userId}/${Date.now()}-${random}.webp`;
}
