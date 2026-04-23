"use client";

import { type CSSProperties, useState } from "react";
import type { StatusId } from "../release-groups/[mbid]/album-data";

type IconName =
    | "search"
    | "edit"
    | "disc"
    | "rotate"
    | "chev-down"
    | "chev-right"
    | "chev-left"
    | "external"
    | "plus"
    | "check"
    | "x"
    | "user"
    | "settings"
    | "logout"
    | "pin";

export function Icon({
    name,
    size = 18,
    stroke = 1.5,
}: {
    name: IconName;
    size?: number;
    stroke?: number;
}) {
    const p = {
        width: size,
        height: size,
        viewBox: "0 0 24 24",
        fill: "none",
        stroke: "currentColor",
        strokeWidth: stroke,
        strokeLinecap: "round" as const,
        strokeLinejoin: "round" as const,
        style: { display: "block", flexShrink: 0 } as CSSProperties,
    };
    switch (name) {
        case "search":
            return (
                <svg {...p}>
                    <circle cx="11" cy="11" r="7" />
                    <path d="m20 20-3.5-3.5" />
                </svg>
            );
        case "edit":
            return (
                <svg {...p}>
                    <path d="M11 4H4v16h16v-7" />
                    <path d="m18.5 2.5 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                </svg>
            );
        case "disc":
            return (
                <svg {...p}>
                    <circle cx="12" cy="12" r="9" />
                    <circle cx="12" cy="12" r="2" />
                </svg>
            );
        case "rotate":
            return (
                <svg {...p}>
                    <path d="M3 12a9 9 0 1 0 3-6.7" />
                    <path d="M3 4v5h5" />
                </svg>
            );
        case "chev-down":
            return (
                <svg {...p}>
                    <path d="m6 9 6 6 6-6" />
                </svg>
            );
        case "chev-right":
            return (
                <svg {...p}>
                    <path d="m9 6 6 6-6 6" />
                </svg>
            );
        case "chev-left":
            return (
                <svg {...p}>
                    <path d="m15 6-6 6 6 6" />
                </svg>
            );
        case "external":
            return (
                <svg {...p}>
                    <path d="M15 3h6v6" />
                    <path d="M10 14 21 3" />
                    <path d="M21 14v7H3V3h7" />
                </svg>
            );
        case "plus":
            return (
                <svg {...p}>
                    <path d="M12 5v14M5 12h14" />
                </svg>
            );
        case "check":
            return (
                <svg {...p}>
                    <path d="M20 6 9 17l-5-5" />
                </svg>
            );
        case "x":
            return (
                <svg {...p}>
                    <path d="M18 6 6 18M6 6l12 12" />
                </svg>
            );
        case "user":
            return (
                <svg {...p}>
                    <circle cx="12" cy="8" r="4" />
                    <path d="M4 21a8 8 0 0 1 16 0" />
                </svg>
            );
        case "settings":
            return (
                <svg {...p}>
                    <circle cx="12" cy="12" r="3" />
                    <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1-1.5 1.7 1.7 0 0 0-1.9.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.9 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1 1.7 1.7 0 0 0-.3-1.9l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.9.3h.1a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5h.1a1.7 1.7 0 0 0 1.9-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.9v.1a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" />
                </svg>
            );
        case "logout":
            return (
                <svg {...p}>
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                    <path d="m16 17 5-5-5-5" />
                    <path d="M21 12H9" />
                </svg>
            );
        case "pin":
            return (
                <svg {...p}>
                    <path d="M12 17v5" />
                    <path d="M9 10V4h6v6l2 4H7l2-4z" />
                </svg>
            );
        default:
            return null;
    }
}

export function StatusGlyph({
    kind,
    size = 14,
}: {
    kind: StatusId;
    size?: number;
}) {
    const p = {
        width: size,
        height: size,
        viewBox: "0 0 24 24",
        fill: "none",
        style: { display: "block" } as CSSProperties,
    };
    switch (kind) {
        case "backlog":
            return (
                <svg {...p}>
                    <circle
                        cx="12"
                        cy="12"
                        r="9"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeDasharray="2 3"
                    />
                </svg>
            );
        case "listening":
            return (
                <svg {...p}>
                    <circle
                        cx="12"
                        cy="12"
                        r="9"
                        stroke="currentColor"
                        strokeWidth="1.5"
                    />
                    <circle cx="12" cy="12" r="3" fill="currentColor" />
                </svg>
            );
        case "listened":
            return (
                <svg {...p}>
                    <circle cx="12" cy="12" r="9" fill="currentColor" />
                    <path
                        d="M8 12.5 L11 15 L16 9.5"
                        stroke="#0D0D0D"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        fill="none"
                    />
                </svg>
            );
        case "loved":
            return (
                <svg {...p}>
                    <path
                        d="M12 20.5s-7.5-4.6-7.5-10.3a4.2 4.2 0 0 1 7.5-2.6 4.2 4.2 0 0 1 7.5 2.6c0 5.7-7.5 10.3-7.5 10.3z"
                        fill="currentColor"
                    />
                </svg>
            );
        case "shelved":
            return (
                <svg {...p}>
                    <rect
                        x="3"
                        y="11"
                        width="18"
                        height="2"
                        rx="1"
                        fill="currentColor"
                    />
                </svg>
            );
        default:
            return null;
    }
}

function Star({
    fill,
    size = 14,
    stroke = 1,
    uid,
}: {
    fill: 0 | 0.5 | 1;
    size?: number;
    stroke?: number;
    uid: string;
}) {
    const path =
        "M12 3.3 14.7 9.2 21.2 9.8 16.3 14.1 17.9 20.4 12 17.1 6.1 20.4 7.7 14.1 2.8 9.8 9.3 9.2z";
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 24 24"
            style={{ display: "block" }}
        >
            <defs>
                <clipPath id={uid}>
                    <rect
                        x="0"
                        y="0"
                        width={fill === 0.5 ? 12 : 24}
                        height="24"
                    />
                </clipPath>
            </defs>
            <path
                d={path}
                fill="none"
                stroke="currentColor"
                strokeWidth={stroke}
                strokeLinejoin="round"
                opacity={fill === 0 ? 0.5 : 1}
            />
            {fill > 0 && (
                <path
                    d={path}
                    fill="currentColor"
                    stroke="currentColor"
                    strokeWidth={stroke}
                    strokeLinejoin="round"
                    clipPath={fill === 0.5 ? `url(#${uid})` : undefined}
                />
            )}
        </svg>
    );
}

export function Stars({
    value = 0,
    max = 10,
    size = 14,
    onChange,
    idPrefix,
}: {
    value?: number;
    max?: number;
    size?: number;
    onChange?: (v: number) => void;
    idPrefix: string;
}) {
    const [hoverVal, setHoverVal] = useState<number | null>(null);
    const [pulseIdx, setPulseIdx] = useState<number>(-1);
    const v = hoverVal != null ? hoverVal : value;
    const starFill = (i: number): 0 | 0.5 | 1 => {
        const whole = i + 1;
        const half = i + 0.5;
        if (v >= whole) return 1;
        if (v >= half) return 0.5;
        return 0;
    };
    return (
        <div
            className="inline-flex gap-0.5 text-paper"
            style={{ cursor: onChange ? "pointer" : "default" }}
        >
            {Array.from({ length: max }).map((_, i) => (
                <span
                    key={i}
                    onMouseMove={
                        onChange
                            ? (e) => {
                                  const r =
                                      e.currentTarget.getBoundingClientRect();
                                  const left =
                                      e.clientX - r.left < r.width / 2;
                                  setHoverVal(i + (left ? 0.5 : 1));
                              }
                            : undefined
                    }
                    onMouseLeave={
                        onChange ? () => setHoverVal(null) : undefined
                    }
                    onClick={
                        onChange
                            ? (e) => {
                                  const r =
                                      e.currentTarget.getBoundingClientRect();
                                  const left =
                                      e.clientX - r.left < r.width / 2;
                                  const nv = i + (left ? 0.5 : 1);
                                  onChange(nv);
                                  setPulseIdx(i);
                                  setTimeout(() => setPulseIdx(-1), 120);
                              }
                            : undefined
                    }
                    style={{
                        display: "inline-flex",
                        transform:
                            pulseIdx === i ? "scale(1.15)" : "scale(1)",
                        transition:
                            "transform 100ms cubic-bezier(0.2,0.6,0.2,1)",
                    }}
                >
                    <Star fill={starFill(i)} size={size} uid={`${idPrefix}-${i}`} />
                </span>
            ))}
        </div>
    );
}

export function RatingHistogram({
    buckets,
    width,
    height = 36,
}: {
    buckets: number[];
    width?: number;
    height?: number;
}) {
    const max = Math.max(...buckets);
    return (
        <div
            className="flex items-end gap-0.5 w-full"
            style={width != null ? { height, width } : { height }}
        >
            {buckets.map((b, i) => (
                <div
                    key={i}
                    className="bg-paper opacity-85 rounded-[0.5px] flex-1 min-w-0.5"
                    style={{
                        height: `${Math.max(4, (b / max) * 100)}%`,
                    }}
                />
            ))}
        </div>
    );
}

const COVER_PALETTES: Array<[string, string, string]> = [
    ["#241106", "#5b3a1e", "#8a5a2e"],
    ["#0a1a2a", "#1e4a6b", "#3a6b8a"],
    ["#2a0a2a", "#5b1e5b", "#8a2e7a"],
    ["#14281a", "#2e5b3a", "#4a8a5b"],
    ["#2a140a", "#6b3a1e", "#a85a3e"],
    ["#14141a", "#2e2e4a", "#4a4a6b"],
    ["#0a1a0a", "#1e3a1e", "#2e5b2e"],
    ["#1a1408", "#3a2e14", "#5b4a24"],
    ["#08141a", "#14283a", "#1e3a5b"],
];

export function coverPalette(seed: string): [string, string, string] {
    let hash = 0;
    for (let i = 0; i < seed.length; i++) {
        hash = (hash * 31 + seed.charCodeAt(i)) | 0;
    }
    return COVER_PALETTES[Math.abs(hash) % COVER_PALETTES.length]!;
}

const AVATAR_PALETTES: Array<[string, string]> = [
    ["#2a140a", "#6b3a1e"],
    ["#0a1a2a", "#1e4a6b"],
    ["#2a0a2a", "#5b1e5b"],
    ["#14281a", "#2e5b3a"],
    ["#1a1408", "#3a2e14"],
    ["#14141a", "#2e2e4a"],
    ["#0a1a0a", "#1e3a1e"],
    ["#241106", "#5b3a1e"],
];

function avatarPalette(seed: string): [string, string] {
    let hash = 0;
    for (let i = 0; i < seed.length; i++) {
        hash = (hash * 31 + seed.charCodeAt(i)) | 0;
    }
    return AVATAR_PALETTES[Math.abs(hash) % AVATAR_PALETTES.length]!;
}

function initialsFor(name: string | null | undefined) {
    if (!name) return "·";
    const parts = name
        .trim()
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2);
    if (parts.length === 0) return "·";
    return parts.map((p) => p[0]!.toUpperCase()).join("");
}

export function Avatar({
    imageUrl,
    name,
    seed,
    size = 36,
    className = "",
}: {
    imageUrl: string | null | undefined;
    name: string | null | undefined;
    seed: string;
    size?: number;
    className?: string;
}) {
    const [a, b] = avatarPalette(seed);
    if (imageUrl) {
        return (
            // eslint-disable-next-line @next/next/no-img-element
            <img
                src={imageUrl}
                alt={name ?? "avatar"}
                width={size}
                height={size}
                className={`rounded-full object-cover shrink-0 ${className}`}
                style={{ width: size, height: size }}
            />
        );
    }
    return (
        <div
            className={`rounded-full flex items-center justify-center shrink-0 text-paper font-medium ${className}`}
            style={{
                width: size,
                height: size,
                background: `linear-gradient(135deg, ${a}, ${b})`,
                fontSize: Math.round(size * 0.4),
                letterSpacing: "0.02em",
            }}
        >
            {initialsFor(name)}
        </div>
    );
}

export function GenericCover({
    size,
    radius = 8,
    palette,
    label,
    className,
}: {
    size?: number;
    radius?: number;
    palette: [string, string, string];
    label: string;
    className?: string;
}) {
    const [hover, setHover] = useState(false);
    const [a, b, c] = palette;
    const gradId = `cover-grad-${label}-${size ?? "fluid"}`;
    const sizeStyle: CSSProperties =
        size != null ? { width: size, height: size } : {};
    return (
        <div
            onMouseEnter={() => setHover(true)}
            onMouseLeave={() => setHover(false)}
            className={`relative overflow-hidden shrink-0 ${className ?? ""}`}
            style={{
                ...sizeStyle,
                borderRadius: radius,
                background: a,
            }}
        >
            <svg
                viewBox="0 0 100 100"
                width="100%"
                height="100%"
                style={{ display: "block" }}
            >
                <defs>
                    <linearGradient id={gradId} x1="0" y1="0" x2="1" y2="1">
                        <stop offset="0%" stopColor={b} />
                        <stop offset="100%" stopColor={c} />
                    </linearGradient>
                </defs>
                <rect width="100" height="100" fill={`url(#${gradId})`} />
                <text
                    x="50"
                    y="58"
                    textAnchor="middle"
                    fontFamily="Geist, sans-serif"
                    fontWeight="500"
                    fontSize="24"
                    fill="rgba(247,247,247,0.85)"
                    letterSpacing="0.08em"
                >
                    {label}
                </text>
            </svg>
            <div
                className="absolute inset-0 pointer-events-none"
                style={{
                    borderRadius: radius,
                    boxShadow: "inset 0 0 0 1px rgba(247,247,247,0.3)",
                    opacity: hover ? 1 : 0,
                    transition: "opacity 120ms ease-out",
                }}
            />
        </div>
    );
}
