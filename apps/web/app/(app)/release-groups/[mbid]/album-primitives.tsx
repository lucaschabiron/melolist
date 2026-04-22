"use client";

import { type CSSProperties, useState } from "react";

export function InRainbowsCover({
    size,
    radius = 12,
    className,
}: {
    size?: number;
    radius?: number;
    className?: string;
}) {
    const [hover, setHover] = useState(false);
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
                background: "#241106",
            }}
        >
            <svg
                viewBox="0 0 320 320"
                width="100%"
                height="100%"
                style={{ display: "block" }}
            >
                <defs>
                    <radialGradient id="rg1" cx="40%" cy="45%" r="75%">
                        <stop offset="0%" stopColor="#6e2e0a" />
                        <stop offset="45%" stopColor="#3a1607" />
                        <stop offset="100%" stopColor="#140704" />
                    </radialGradient>
                </defs>
                <rect width="320" height="320" fill="url(#rg1)" />
                <g opacity="0.85">
                    <circle cx="48" cy="58" r="2.2" fill="#ff9b3c" />
                    <circle cx="86" cy="34" r="1.2" fill="#f4d75b" />
                    <circle cx="210" cy="42" r="1.6" fill="#c7389a" />
                    <circle cx="268" cy="88" r="2.4" fill="#2dc9c0" />
                    <circle cx="292" cy="182" r="1.2" fill="#f4d75b" />
                    <circle cx="32" cy="228" r="1.8" fill="#ff9b3c" />
                    <circle cx="58" cy="296" r="2.8" fill="#c7389a" />
                    <circle cx="256" cy="276" r="1.6" fill="#2dc9c0" />
                    <circle cx="172" cy="18" r="1" fill="#ff9b3c" />
                    <circle cx="140" cy="304" r="1.4" fill="#2dc9c0" />
                    <path
                        d="M 40 80 q 6 22 -2 44"
                        stroke="#ff9b3c"
                        strokeWidth="1.2"
                        fill="none"
                        opacity="0.6"
                    />
                    <path
                        d="M 284 60 q -8 28 4 54"
                        stroke="#c7389a"
                        strokeWidth="1.2"
                        fill="none"
                        opacity="0.5"
                    />
                    <path
                        d="M 18 160 q 14 16 6 36"
                        stroke="#2dc9c0"
                        strokeWidth="1.2"
                        fill="none"
                        opacity="0.5"
                    />
                </g>
                <text
                    x="160"
                    y="132"
                    fontSize="46"
                    fill="#ff9b3c"
                    textAnchor="middle"
                    style={{
                        fontFamily: "Source Serif 4, Georgia, serif",
                        fontStyle: "italic",
                    }}
                >
                    in
                </text>
                <g
                    fontSize="38"
                    fontFamily="Geist, sans-serif"
                    fontWeight="500"
                    textAnchor="middle"
                    letterSpacing="0.02em"
                >
                    <text x="48" y="184" fill="#ff9b3c">
                        R
                    </text>
                    <text x="80" y="184" fill="#f4d75b">
                        A
                    </text>
                    <text x="112" y="184" fill="#7bc66a">
                        I
                    </text>
                    <text x="128" y="184" fill="#2dc9c0">
                        N
                    </text>
                    <text x="160" y="184" fill="#5aa9ff">
                        B
                    </text>
                    <text x="192" y="184" fill="#9b7cff">
                        O
                    </text>
                    <text x="224" y="184" fill="#c7389a">
                        W
                    </text>
                    <text x="258" y="184" fill="#ff5a7a">
                        S
                    </text>
                </g>
                <text
                    x="160"
                    y="214"
                    fontSize="10"
                    fill="#cfa07a"
                    textAnchor="middle"
                    letterSpacing="0.4em"
                    style={{
                        fontFamily: "Geist, sans-serif",
                        fontWeight: 500,
                    }}
                >
                    RADIOHEAD
                </text>
                <path
                    d="M 0 240 C 80 232, 180 260, 320 244"
                    stroke="#3a1607"
                    strokeWidth="14"
                    fill="none"
                    opacity="0.5"
                />
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
