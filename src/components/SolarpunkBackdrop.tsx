"use client";

import { motion, useReducedMotion } from "framer-motion";
import type { SeasonMood } from "@/lib/solar";

interface SolarpunkBackdropProps {
  /** Ambient seasonal lighting state that gently cross-fades the sky & meadow glow */
  seasonMood?: SeasonMood;
}

const SEASON_GRADIENTS: Record<
  SeasonMood,
  {
    topGlow: string;
    sunCore: string;
    horizonMist: string;
    hillTintOpacity: number;
  }
> = {
  summer: {
    topGlow:
      "radial-gradient(68% 52% at 50% -4%, rgba(251, 211, 125, 0.36) 0%, rgba(253, 229, 168, 0.15) 44%, rgba(250, 251, 247, 0) 78%)",
    sunCore:
      "radial-gradient(circle at 80% 10%, rgba(247, 198, 94, 0.34) 0%, rgba(251, 211, 125, 0.12) 38%, rgba(255, 253, 245, 0) 70%)",
    horizonMist:
      "radial-gradient(85% 48% at 50% 102%, rgba(167, 212, 169, 0.28) 0%, rgba(183, 221, 187, 0.14) 48%, rgba(250, 251, 247, 0) 82%)",
    hillTintOpacity: 1,
  },
  "spring-autumn": {
    topGlow:
      "radial-gradient(66% 50% at 50% -4%, rgba(255, 242, 204, 0.36) 0%, rgba(255, 245, 214, 0.16) 44%, rgba(250, 251, 247, 0) 78%)",
    sunCore:
      "radial-gradient(circle at 76% 12%, rgba(246, 207, 120, 0.24) 0%, rgba(255, 245, 214, 0.10) 42%, rgba(255, 253, 245, 0) 70%)",
    horizonMist:
      "radial-gradient(85% 48% at 50% 102%, rgba(134, 194, 146, 0.24) 0%, rgba(183, 221, 187, 0.13) 48%, rgba(250, 251, 247, 0) 82%)",
    hillTintOpacity: 0.96,
  },
  winter: {
    topGlow:
      "radial-gradient(68% 52% at 50% -4%, rgba(218, 234, 232, 0.42) 0%, rgba(229, 240, 238, 0.18) 46%, rgba(250, 251, 247, 0) 78%)",
    sunCore:
      "radial-gradient(circle at 72% 14%, rgba(243, 223, 178, 0.20) 0%, rgba(218, 234, 232, 0.14) 40%, rgba(250, 251, 247, 0) 72%)",
    horizonMist:
      "radial-gradient(85% 48% at 50% 102%, rgba(155, 191, 167, 0.22) 0%, rgba(218, 234, 232, 0.14) 50%, rgba(250, 251, 247, 0) 82%)",
    hillTintOpacity: 0.85,
  },
};

/**
 * Signature Solarpunk Light-Mode Atmosphere:
 *  - Sunlit alabaster & pale morning sky canvas (#FFFDF5 -> #FAFBF7 -> #EEF6EA)
 *  - Cross-fading seasonal ambient glows + soft diagonal sunbeams
 *  - Translucent layered SVG meadow hills with Solarpunk solar-paneled roofs,
 *    ground solar arrays, and gently swaying foreground botanical silhouettes
 */
export function SolarpunkBackdrop({
  seasonMood = "spring-autumn",
}: SolarpunkBackdropProps) {
  const prefersReducedMotion = useReducedMotion();

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden select-none"
      style={{
        background:
          "linear-gradient(180deg, #FFFDF5 0%, #FAFBF7 46%, #F3F8F0 78%, #EEF6EA 100%)",
      }}
    >
      {/* Cross-fading seasonal ambient layers */}
      {(["summer", "spring-autumn", "winter"] as const).map((mood) => {
        const isActive = mood === seasonMood;
        const palette = SEASON_GRADIENTS[mood];
        return (
          <motion.div
            key={mood}
            initial={false}
            animate={{ opacity: isActive ? 1 : 0 }}
            transition={{
              duration: prefersReducedMotion ? 0 : 1.05,
              ease: [0.22, 1, 0.36, 1],
            }}
            className="absolute inset-0"
          >
            <div
              className="absolute inset-0"
              style={{ background: palette.topGlow }}
            />
            <div
              className="absolute inset-0"
              style={{ background: palette.sunCore }}
            />
            <div
              className="absolute inset-0"
              style={{ background: palette.horizonMist }}
            />
          </motion.div>
        );
      })}

      {/* Soft sunlit diagonal rays from upper-right sky */}
      <svg
        className="absolute inset-0 h-full w-full opacity-55"
        viewBox="0 0 1440 900"
        fill="none"
        preserveAspectRatio="xMidYMin slice"
      >
        <defs>
          <linearGradient
            id="roofwatt-sunbeam-1"
            x1="1220"
            y1="0"
            x2="540"
            y2="680"
            gradientUnits="userSpaceOnUse"
          >
            <stop
              offset="0%"
              stopColor={seasonMood === "winter" ? "#DAEAE8" : "#F9D687"}
              stopOpacity="0.28"
            />
            <stop offset="100%" stopColor="#FAFBF7" stopOpacity="0" />
          </linearGradient>
          <linearGradient
            id="roofwatt-sunbeam-2"
            x1="1360"
            y1="40"
            x2="780"
            y2="760"
            gradientUnits="userSpaceOnUse"
          >
            <stop
              offset="0%"
              stopColor={seasonMood === "winter" ? "#D2E6E2" : "#F7C65E"}
              stopOpacity="0.20"
            />
            <stop offset="100%" stopColor="#FAFBF7" stopOpacity="0" />
          </linearGradient>
        </defs>
        <polygon
          points="1080,0 1280,0 720,760 440,760"
          fill="url(#roofwatt-sunbeam-1)"
        />
        <polygon
          points="1320,0 1440,0 1440,140 960,820 760,820"
          fill="url(#roofwatt-sunbeam-2)"
        />
      </svg>

      {/* Layered Translucent Solarpunk Meadow Hills + Solar Architecture + Swaying Grass */}
      <div
        className="absolute inset-x-0 bottom-0 h-[36vh] min-h-[220px] max-h-[380px] transition-opacity duration-1000"
        style={{ opacity: SEASON_GRADIENTS[seasonMood].hillTintOpacity }}
      >
        <svg
          className="h-full w-full"
          viewBox="0 0 1440 380"
          fill="none"
          preserveAspectRatio="xMidYMax slice"
        >
          <defs>
            <linearGradient id="meadow-far" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#B7DDBB" stopOpacity="0.34" />
              <stop offset="100%" stopColor="#B7DDBB" stopOpacity="0.14" />
            </linearGradient>

            <linearGradient id="meadow-mid" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#84BD8D" stopOpacity="0.28" />
              <stop offset="100%" stopColor="#84BD8D" stopOpacity="0.16" />
            </linearGradient>

            <linearGradient id="meadow-near" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#5F9E6E" stopOpacity="0.24" />
              <stop offset="100%" stopColor="#5F9E6E" stopOpacity="0.14" />
            </linearGradient>

            <linearGradient id="meadow-sun-rim" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#F7C65E" stopOpacity="0" />
              <stop offset="30%" stopColor="#F7C65E" stopOpacity="0.34" />
              <stop offset="72%" stopColor="#F7C65E" stopOpacity="0.26" />
              <stop offset="100%" stopColor="#F7C65E" stopOpacity="0" />
            </linearGradient>

            <linearGradient id="bg-panel-glass" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#2F6F5E" stopOpacity="0.46" />
              <stop offset="55%" stopColor="#3D8B5B" stopOpacity="0.34" />
              <stop offset="100%" stopColor="#E9A033" stopOpacity="0.36" />
            </linearGradient>
          </defs>

          {/* Layer 1: Distant rolling horizon hills */}
          <path
            d="M0 242 C 210 168, 430 174, 670 226 C 910 274, 1140 160, 1440 212 L 1440 380 L 0 380 Z"
            fill="url(#meadow-far)"
          />

          {/* Distant Right Hill: Translucent Ground-Mounted Solar Array & Solarpunk Trees */}
          <g opacity="0.52">
            {/* Soft cypress & canopy trees on distant ridge */}
            <circle cx="1142" cy="184" r="14" fill="#84BD8D" fillOpacity="0.42" />
            <circle cx="1158" cy="188" r="10" fill="#5F9E6E" fillOpacity="0.36" />
            <line
              x1="1142"
              y1="196"
              x2="1142"
              y2="206"
              stroke="#5F9E6E"
              strokeOpacity="0.45"
              strokeWidth="2"
            />
            {/* 3 angled community solar panels catching the sky */}
            {[
              { x: 1188, y: 186 },
              { x: 1230, y: 182 },
              { x: 1272, y: 184 },
            ].map((p, idx) => (
              <g key={idx}>
                <line
                  x1={p.x + 14}
                  y1={p.y + 12}
                  x2={p.x + 14}
                  y2={p.y + 24}
                  stroke="#3D6B52"
                  strokeOpacity="0.48"
                  strokeWidth="2"
                />
                <polygon
                  points={`${p.x},${p.y + 12} ${p.x + 30},${p.y} ${p.x + 34},${p.y + 8} ${p.x + 4},${p.y + 20}`}
                  fill="url(#bg-panel-glass)"
                  stroke="#FFFDF5"
                  strokeOpacity="0.65"
                  strokeWidth="1"
                />
                {/* Cell grid lines */}
                <line
                  x1={p.x + 11}
                  y1={p.y + 7.5}
                  x2={p.x + 14.5}
                  y2={p.y + 15.5}
                  stroke="#FFFDF5"
                  strokeOpacity="0.45"
                  strokeWidth="0.7"
                />
                <line
                  x1={p.x + 21}
                  y1={p.y + 3.5}
                  x2={p.x + 24.5}
                  y2={p.y + 11.5}
                  stroke="#FFFDF5"
                  strokeOpacity="0.45"
                  strokeWidth="0.7"
                />
              </g>
            ))}
          </g>

          {/* Layer 2: Mid sweeping meadow */}
          <path
            d="M0 278 C 260 206, 520 294, 820 236 C 1070 190, 1270 228, 1440 256 L 1440 380 L 0 380 Z"
            fill="url(#meadow-mid)"
          />
          <path
            d="M0 278 C 260 206, 520 294, 820 236 C 1070 190, 1270 228, 1440 256"
            stroke="url(#meadow-sun-rim)"
            strokeWidth="2"
            fill="none"
          />

          {/* Left Mid Meadow: Serene Translucent Solarpunk Solar-Roof Cottage */}
          <g opacity="0.54">
            {/* Soft warm cottage silhouette */}
            <path
              d="M174 260 V 222 L 222 194 L 270 222 V 260 Z"
              fill="#FAFBF7"
              fillOpacity="0.68"
              stroke="#5F9E6E"
              strokeOpacity="0.45"
              strokeWidth="1.4"
              strokeLinejoin="round"
            />
            {/* Sunlit angled solar panels fitted neatly onto the cottage roof */}
            <polygon
              points="224,199 262,221 251,229 213,207"
              fill="url(#bg-panel-glass)"
              stroke="#FFFDF5"
              strokeOpacity="0.8"
              strokeWidth="1"
            />
            <line
              x1="236"
              y1="206"
              x2="225"
              y2="214"
              stroke="#FFFDF5"
              strokeOpacity="0.55"
              strokeWidth="0.8"
            />
            <line
              x1="249"
              y1="213.5"
              x2="238"
              y2="221.5"
              stroke="#FFFDF5"
              strokeOpacity="0.55"
              strokeWidth="0.8"
            />
            {/* Warm sunlit window glow */}
            <rect
              x="194"
              y="232"
              width="14"
              height="14"
              rx="2.5"
              fill="#F7C65E"
              fillOpacity="0.45"
              stroke="#5F9E6E"
              strokeOpacity="0.35"
              strokeWidth="1"
            />
            <rect
              x="236"
              y="232"
              width="14"
              height="14"
              rx="2.5"
              fill="#F7C65E"
              fillOpacity="0.35"
              stroke="#5F9E6E"
              strokeOpacity="0.35"
              strokeWidth="1"
            />
            {/* Garden tree beside home */}
            <line
              x1="292"
              y1="262"
              x2="292"
              y2="232"
              stroke="#5F9E6E"
              strokeOpacity="0.5"
              strokeWidth="2.2"
              strokeLinecap="round"
            />
            <circle cx="292" cy="222" r="15" fill="#84BD8D" fillOpacity="0.46" />
            <circle cx="303" cy="228" r="10" fill="#5F9E6E" fillOpacity="0.34" />
          </g>

          {/* Layer 3: Near calm meadow swell */}
          <path
            d="M0 314 C 180 276, 390 272, 635 312 C 895 354, 1175 266, 1440 300 L 1440 380 L 0 380 Z"
            fill="url(#meadow-near)"
          />

          {/* Layer 4A: Foreground left swaying translucent grass & botanical blades */}
          <g className="roofwatt-sway-slow" opacity="0.30">
            <path
              d="M42 380 C 38 326, 22 284, 8 250 C 30 280, 48 322, 52 380 Z"
              fill="#5F9E6E"
            />
            <path
              d="M72 380 C 70 313, 86 266, 108 232 C 94 270, 82 320, 82 380 Z"
              fill="#84BD8D"
            />
            <path
              d="M110 380 C 106 332, 118 292, 138 262 C 126 296, 118 334, 119 380 Z"
              fill="#5F9E6E"
            />
            <path
              d="M148 380 C 142 342, 130 310, 116 286 C 136 308, 151 338, 156 380 Z"
              fill="#84BD8D"
            />
            <path
              d="M92 380 C 90 320, 78 278, 62 242"
              stroke="#5F9E6E"
              strokeWidth="2.2"
              strokeLinecap="round"
            />
            <ellipse
              cx="74"
              cy="282"
              rx="10"
              ry="4.5"
              transform="rotate(-34 74 282)"
              fill="#84BD8D"
            />
            <ellipse
              cx="84"
              cy="310"
              rx="11"
              ry="4.8"
              transform="rotate(24 84 310)"
              fill="#5F9E6E"
            />
          </g>

          {/* Layer 4B: Mid-field gentle wild grass tufts */}
          <g className="roofwatt-sway-mid" opacity="0.22">
            <path
              d="M362 380 C 358 346, 346 318, 334 296 C 352 316, 365 344, 370 380 Z"
              fill="#84BD8D"
            />
            <path
              d="M382 380 C 384 342, 396 312, 412 290 C 400 316, 392 346, 391 380 Z"
              fill="#5F9E6E"
            />
            <path
              d="M1044 380 C 1040 346, 1028 318, 1016 296 C 1033 316, 1046 344, 1051 380 Z"
              fill="#84BD8D"
            />
            <path
              d="M1066 380 C 1070 340, 1084 308, 1102 284 C 1088 312, 1076 344, 1075 380 Z"
              fill="#5F9E6E"
            />
          </g>

          {/* Layer 4C: Foreground right swaying translucent botanical cluster */}
          <g className="roofwatt-sway-gentle" opacity="0.32">
            <path
              d="M1262 380 C 1256 332, 1238 294, 1218 264 C 1244 292, 1263 330, 1271 380 Z"
              fill="#84BD8D"
            />
            <path
              d="M1302 380 C 1304 318, 1320 270, 1344 232 C 1328 274, 1314 322, 1312 380 Z"
              fill="#5F9E6E"
            />
            <path
              d="M1344 380 C 1340 324, 1354 278, 1378 244 C 1364 282, 1353 326, 1353 380 Z"
              fill="#84BD8D"
            />
            <path
              d="M1388 380 C 1384 334, 1396 294, 1416 264 C 1404 298, 1396 336, 1397 380 Z"
              fill="#5F9E6E"
            />
            <path
              d="M1324 380 C 1328 322, 1342 280, 1362 242"
              stroke="#5F9E6E"
              strokeWidth="2.2"
              strokeLinecap="round"
            />
            <ellipse
              cx="1346"
              cy="282"
              rx="10.5"
              ry="4.5"
              transform="rotate(32 1346 282)"
              fill="#84BD8D"
            />
            <ellipse
              cx="1334"
              cy="312"
              rx="11"
              ry="4.8"
              transform="rotate(-24 1334 312)"
              fill="#5F9E6E"
            />
          </g>
        </svg>
      </div>
    </div>
  );
}
