"use client";

import { motion, useReducedMotion } from "framer-motion";
import { AnimatedNumber } from "@/components/AnimatedNumber";
import type { ResolvedLocation } from "@/lib/airnodehub";
import type {
  MonthlySolarSummary,
  SeasonMood,
  SolarAuditResult,
} from "@/lib/solar";

interface SunArcHeaderProps {
  location: ResolvedLocation;
  audit: SolarAuditResult;
  activeMonth: MonthlySolarSummary | null;
  seasonMood: SeasonMood;
  systemSizeKw: number;
}

const SPRING = {
  type: "spring" as const,
  stiffness: 180,
  damping: 24,
};

function getSunPoint(
  activeMonth: MonthlySolarSummary | null,
  elevationNorm: number
): { x: number; y: number; apexY: number } {
  const apexY = Math.round(104 - elevationNorm * 78);
  const t = activeMonth ? 0.22 + (activeMonth.monthIndex / 11) * 0.56 : 0.5;
  const x = 52 + t * (628 - 52);
  const controlY = 2 * apexY - 126;
  const oneMinusT = 1 - t;
  const y =
    oneMinusT * oneMinusT * 126 +
    2 * oneMinusT * t * controlY +
    t * t * 126;
  return { x, y, apexY };
}

/** Visual live-tilted protractor graphic showing the exact optimal panel angle */
function OptimalTiltDiagram({
  tiltDeg,
  direction,
}: {
  tiltDeg: number;
  direction: "South" | "North";
}) {
  return (
    <div className="solarpunk-subcard flex shrink-0 items-center gap-3.5 px-4 py-3">
      <svg
        aria-hidden="true"
        viewBox="0 0 68 48"
        className="h-11 w-16 shrink-0"
        fill="none"
      >
        {/* Warm sun orb */}
        <circle cx="54" cy="11" r="5.5" fill="#F2B441" />
        {/* Sunbeam hitting panel perpendicularly */}
        <path
          d="M47 16L37 23"
          stroke="#E9A033"
          strokeWidth="1.4"
          strokeDasharray="2.5 2.5"
          strokeLinecap="round"
        />
        {/* Ground baseline */}
        <line
          x1="8"
          y1="40"
          x2="60"
          y2="40"
          stroke="#528A5F"
          strokeOpacity="0.45"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
        {/* Protractor angle arc */}
        <path
          d="M27 40A14 14 0 0 0 24 31"
          stroke="#3D8B5B"
          strokeWidth="1.4"
          strokeLinecap="round"
        />
        {/* Dynamically tilted solar panel at exact optimalTiltDeg */}
        <motion.g
          initial={false}
          animate={{ rotate: -tiltDeg }}
          transition={SPRING}
          style={{ originX: "14px", originY: "40px" }}
        >
          <line
            x1="14"
            y1="40"
            x2="44"
            y2="40"
            stroke="#1D2F23"
            strokeWidth="3.6"
            strokeLinecap="round"
          />
          <line
            x1="17"
            y1="38.2"
            x2="42"
            y2="38.2"
            stroke="#F7C65E"
            strokeWidth="1.6"
            strokeLinecap="round"
          />
        </motion.g>
      </svg>

      <div className="text-left">
        <div className="text-[10px] font-semibold tracking-wider text-[#526859] uppercase">
          Best Tilt
        </div>
        <div className="mt-0.5 font-serif text-xl leading-none text-[#1D2F23]">
          <AnimatedNumber value={tiltDeg} suffix="°" />{" "}
          <span className="font-sans text-xs font-semibold text-[#3D8B5B]">
            {direction}
          </span>
        </div>
      </div>
    </div>
  );
}

export function SunArcHeader({
  location,
  audit,
  activeMonth,
  seasonMood,
  systemSizeKw,
}: SunArcHeaderProps) {
  const prefersReducedMotion = useReducedMotion();

  const elevationNorm = activeMonth
    ? activeMonth.solarElevationNorm
    : audit.monthly.reduce((s, m) => s + m.solarElevationNorm, 0) / 12;

  const { x: sunX, y: sunY, apexY } = getSunPoint(activeMonth, elevationNorm);
  const controlY = 2 * apexY - 126;
  const arcPathD = `M 52 126 Q 340 ${controlY} 628 126`;

  const displayedDailyKwh = activeMonth
    ? activeMonth.avgDailyKwh
    : audit.annualAvgDailyKwh;
  const displayedPeakSunHours = activeMonth
    ? activeMonth.avgPeakSunHours
    : audit.annualAvgPeakSunHours;

  const orbCoreColor =
    seasonMood === "summer"
      ? "#F2A933"
      : seasonMood === "winter"
        ? "#E4C170"
        : "#EFA93A";

  const orbGlowColor =
    seasonMood === "summer"
      ? "rgba(247, 198, 94, 0.45)"
      : seasonMood === "winter"
        ? "rgba(218, 234, 232, 0.55)"
        : "rgba(247, 198, 94, 0.34)";

  return (
    <motion.section
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={SPRING}
      className="solarpunk-card overflow-hidden"
    >
      {/* Interactive SVG Sun Arc Horizon */}
      <div className="relative border-b border-[#528A5F]/10 bg-gradient-to-b from-[#FFFDF5]/70 via-white/35 to-transparent px-4 pt-4 pb-1 sm:px-8 sm:pt-5">
        <div className="mb-1 flex items-center justify-between text-[11px] font-medium tracking-wide text-[#526859]/85">
          <span className="inline-flex items-center gap-1.5">
            <svg
              aria-hidden="true"
              className="h-3.5 w-3.5 text-[#E9A033]"
              viewBox="0 0 16 16"
              fill="none"
            >
              <circle cx="8" cy="8" r="3.2" fill="currentColor" />
              <path
                d="M8 1.8V3.2M8 12.8V14.2M1.8 8H3.2M12.8 8H14.2"
                stroke="currentColor"
                strokeWidth="1.3"
                strokeLinecap="round"
              />
            </svg>
            {activeMonth ? `${activeMonth.fullName} Sky` : "Yearly Average Sky"}
          </span>
          <span className="inline-flex items-center gap-3 tabular-nums">
            <span>
              ☁ {activeMonth ? activeMonth.avgCloudCoverPct : audit.annualAvgCloudCoverPct}%
            </span>
            <span>
              {activeMonth
                ? `${activeMonth.avgMaxTempC}°C`
                : `${systemSizeKw.toFixed(1)} kW`}
            </span>
          </span>
        </div>

        <svg
          aria-hidden="true"
          viewBox="0 0 680 144"
          className="h-28 w-full overflow-visible sm:h-36"
          fill="none"
        >
          <defs>
            <linearGradient
              id="roofwatt-arc-stroke"
              x1="0"
              y1="0"
              x2="1"
              y2="0"
            >
              <stop offset="0%" stopColor="#84BD8D" stopOpacity="0.22" />
              <stop offset="50%" stopColor="#E9A033" stopOpacity="0.62" />
              <stop offset="100%" stopColor="#84BD8D" stopOpacity="0.22" />
            </linearGradient>

            <linearGradient
              id="roofwatt-arc-fill"
              x1="0"
              y1="0"
              x2="0"
              y2="1"
            >
              <stop
                offset="0%"
                stopColor={seasonMood === "winter" ? "#DAEAE8" : "#FBD37D"}
                stopOpacity="0.26"
              />
              <stop offset="100%" stopColor="#EEF6EA" stopOpacity="0.02" />
            </linearGradient>

            <radialGradient id="roofwatt-sun-orb" cx="42%" cy="38%" r="60%">
              <stop offset="0%" stopColor="#FFF7DC" />
              <stop offset="52%" stopColor="#F7C65E" />
              <stop offset="100%" stopColor={orbCoreColor} />
            </radialGradient>
          </defs>

          <motion.path
            initial={false}
            animate={{ d: `${arcPathD} L 628 126 L 52 126 Z` }}
            transition={prefersReducedMotion ? { duration: 0 } : SPRING}
            fill="url(#roofwatt-arc-fill)"
          />

          <line
            x1="28"
            y1="126"
            x2="652"
            y2="126"
            stroke="#528A5F"
            strokeOpacity="0.18"
            strokeWidth="1"
          />
          <path
            d="M 28 126 Q 190 116 340 124 T 652 126"
            fill="#84BD8D"
            fillOpacity="0.10"
          />

          <motion.path
            initial={false}
            animate={{ d: arcPathD }}
            transition={prefersReducedMotion ? { duration: 0 } : SPRING}
            stroke="url(#roofwatt-arc-stroke)"
            strokeWidth="2"
            strokeDasharray="5 7"
            strokeLinecap="round"
          />

          <motion.line
            initial={false}
            animate={{ x1: sunX, x2: sunX, y1: sunY + 14, y2: 126 }}
            transition={prefersReducedMotion ? { duration: 0 } : SPRING}
            stroke="#E9A033"
            strokeOpacity="0.25"
            strokeWidth="1.2"
            strokeDasharray="2 4"
          />

          <circle cx="52" cy="126" r="3" fill="#84BD8D" fillOpacity="0.55" />
          <circle cx="628" cy="126" r="3" fill="#84BD8D" fillOpacity="0.55" />
          <text
            x="52"
            y="141"
            textAnchor="middle"
            className="fill-[#526859]/65 text-[10px] font-medium"
          >
            Sunrise
          </text>
          <text
            x="340"
            y="141"
            textAnchor="middle"
            className="fill-[#526859]/60 text-[10px] font-medium"
          >
            Solar Noon ({audit.optimalDirection})
          </text>
          <text
            x="628"
            y="141"
            textAnchor="middle"
            className="fill-[#526859]/65 text-[10px] font-medium"
          >
            Sunset
          </text>

          <motion.g
            initial={false}
            animate={{ x: sunX, y: sunY }}
            transition={prefersReducedMotion ? { duration: 0 } : SPRING}
          >
            <circle cx="0" cy="0" r="28" fill={orbGlowColor} />
            <circle
              cx="0"
              cy="0"
              r="18"
              fill={orbGlowColor}
              fillOpacity="0.85"
            />
            <g
              stroke="#E9A033"
              strokeOpacity="0.55"
              strokeWidth="1.5"
              strokeLinecap="round"
            >
              <line x1="0" y1="-19" x2="0" y2="-15" />
              <line x1="0" y1="15" x2="0" y2="19" />
              <line x1="-19" y1="0" x2="-15" y2="0" />
              <line x1="15" y1="0" x2="19" y2="0" />
              <line x1="-13.5" y1="-13.5" x2="-10.8" y2="-10.8" />
              <line x1="10.8" y1="10.8" x2="13.5" y2="13.5" />
              <line x1="13.5" y1="-13.5" x2="10.8" y2="-10.8" />
              <line x1="-10.8" y1="10.8" x2="-13.5" y2="13.5" />
            </g>
            <circle cx="0" cy="0" r="11.5" fill="url(#roofwatt-sun-orb)" />
            <circle
              cx="0"
              cy="0"
              r="11.5"
              stroke="#FFFDF5"
              strokeOpacity="0.85"
              strokeWidth="1.2"
            />
          </motion.g>
        </svg>
      </div>

      {/* Location Header + Visual Tilt Protractor + Crisp Hero Numbers */}
      <div className="p-6 sm:p-8">
        <div className="flex flex-col justify-between gap-4 border-b border-[#528A5F]/12 pb-6 sm:flex-row sm:items-center">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[#EEF6EA] px-3 py-1 text-xs font-semibold text-[#2B6E45]">
                <svg
                  aria-hidden="true"
                  className="h-3.5 w-3.5 text-[#E9A033]"
                  viewBox="0 0 16 16"
                  fill="none"
                >
                  <polygon
                    points="2.5,11 9.5,6.5 13.5,10 6.5,14"
                    fill="#2B6652"
                  />
                  <circle cx="12" cy="4.2" r="2.2" fill="currentColor" />
                </svg>
                {audit.potential.label}
              </span>
              {activeMonth && (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-[#E9A033]/35 bg-[#FFF8E6] px-3 py-1 text-xs font-semibold text-[#A46711]">
                  {activeMonth.fullName}
                </span>
              )}
            </div>

            <h1 className="mt-2.5 font-serif text-3xl font-normal tracking-[-0.02em] text-[#1D2F23] sm:text-[2.45rem]">
              {location.displayName}
            </h1>

            <p className="mt-1 text-xs text-[#526859] tabular-nums">
              {Math.abs(location.lat).toFixed(2)}°{location.lat >= 0 ? "N" : "S"},{" "}
              {Math.abs(location.lon).toFixed(2)}°{location.lon >= 0 ? "E" : "W"}{" "}
              · {location.elevationM}m
            </p>
          </div>

          <OptimalTiltDiagram
            tiltDeg={audit.optimalTiltDeg}
            direction={audit.optimalDirection}
          />
        </div>

        {/* Clean Visual-First KPI Tiles */}
        <div className="mt-6 grid gap-3.5 sm:grid-cols-3">
          <div className="solarpunk-subcard flex items-center gap-3.5 p-4 sm:p-5">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#FFF6DF] text-[#D98B1E]">
              <svg
                aria-hidden="true"
                className="h-6 w-6"
                viewBox="0 0 24 24"
                fill="none"
              >
                <path
                  d="M13 3L6.5 13H12L11 21L17.5 11H12L13 3Z"
                  stroke="currentColor"
                  strokeWidth="1.7"
                  strokeLinejoin="round"
                  fill="#F7C65E"
                  fillOpacity="0.35"
                />
              </svg>
            </span>
            <div>
              <div className="text-[11px] font-semibold tracking-wide text-[#526859] uppercase">
                {activeMonth ? `${activeMonth.shortName} Daily` : "Daily Energy"}
              </div>
              <div className="mt-0.5 flex items-baseline gap-1 font-serif text-3xl leading-none text-[#1D2F23]">
                <AnimatedNumber value={displayedDailyKwh} decimals={1} />
                <span className="font-sans text-xs font-medium text-[#526859]">
                  kWh/d
                </span>
              </div>
            </div>
          </div>

          <div className="solarpunk-subcard flex items-center gap-3.5 p-4 sm:p-5">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#EEF6EA] text-[#3D8B5B]">
              <svg
                aria-hidden="true"
                className="h-6 w-6"
                viewBox="0 0 24 24"
                fill="none"
              >
                <circle
                  cx="12"
                  cy="12"
                  r="7.5"
                  stroke="currentColor"
                  strokeWidth="1.65"
                />
                <path
                  d="M12 7.5V12L15 14"
                  stroke="currentColor"
                  strokeWidth="1.7"
                  strokeLinecap="round"
                />
                <circle cx="18.5" cy="5.5" r="2" fill="#F2B441" />
              </svg>
            </span>
            <div>
              <div className="text-[11px] font-semibold tracking-wide text-[#526859] uppercase">
                Annual Output
              </div>
              <div className="mt-0.5 flex items-baseline gap-1 font-serif text-3xl leading-none text-[#1D2F23]">
                <AnimatedNumber value={audit.annualTotalKwh} />
                <span className="font-sans text-xs font-medium text-[#526859]">
                  kWh/yr
                </span>
              </div>
            </div>
          </div>

          <div className="solarpunk-subcard flex items-center gap-3.5 p-4 sm:p-5">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#FFF6DF] text-[#E9A033]">
              <svg
                aria-hidden="true"
                className="h-6 w-6"
                viewBox="0 0 24 24"
                fill="none"
              >
                <circle
                  cx="12"
                  cy="12"
                  r="4.2"
                  fill="#F7C65E"
                  stroke="currentColor"
                  strokeWidth="1.6"
                />
                <path
                  d="M12 3.5V5.5M12 18.5V20.5M3.5 12H5.5M18.5 12H20.5M6 6L7.4 7.4M16.6 16.6L18 18M18 6L16.6 7.4M7.4 16.6L6 18"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                />
              </svg>
            </span>
            <div>
              <div className="text-[11px] font-semibold tracking-wide text-[#526859] uppercase">
                Peak Sun
              </div>
              <div className="mt-0.5 flex items-baseline gap-1 font-serif text-3xl leading-none text-[#E9A033]">
                <AnimatedNumber value={displayedPeakSunHours} decimals={1} />
                <span className="font-sans text-xs font-medium text-[#526859]">
                  hrs/d
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.section>
  );
}
