"use client";

import { motion } from "framer-motion";
import { AnimatedNumber } from "@/components/AnimatedNumber";
import {
  RELATABLE_CONSTANTS,
  type MonthlySolarSummary,
  type RelatablePowerOutput,
} from "@/lib/solar";

interface PoweredBySunGridProps {
  relatable: RelatablePowerOutput;
  activeDailyKwh: number;
  activeMonth: MonthlySolarSummary | null;
}

const SPRING = {
  type: "spring" as const,
  stiffness: 180,
  damping: 24,
};

/** 4 visual everyday home icons that light up as roof power covers core essentials */
function HomeEssentialsVisual({ pct }: { pct: number }) {
  const items = [
    {
      label: "Fridge",
      threshold: 25,
      icon: (
        <path
          d="M7 4.5H17C17.6 4.5 18 4.9 18 5.5V18.5C18 19.1 17.6 19.5 17 19.5H7C6.4 19.5 6 19.1 6 18.5V5.5C6 4.9 6.4 4.5 7 4.5ZM6 10.5H18M9 7.5H9.1M9 13.5V15.5"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
        />
      ),
    },
    {
      label: "Wi-Fi",
      threshold: 50,
      icon: (
        <>
          <path
            d="M4.5 9.8C8.8 6.2 15.2 6.2 19.5 9.8M7.5 13C10.1 10.8 13.9 10.8 16.5 13M10.5 16.1C11.4 15.3 12.6 15.3 13.5 16.1"
            stroke="currentColor"
            strokeWidth="1.65"
            strokeLinecap="round"
          />
          <circle cx="12" cy="18.6" r="1.1" fill="currentColor" />
        </>
      ),
    },
    {
      label: "Laptops",
      threshold: 75,
      icon: (
        <path
          d="M5.5 6.5H18.5V15H5.5V6.5ZM3.5 17.5H20.5"
          stroke="currentColor"
          strokeWidth="1.65"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      ),
    },
    {
      label: "Lights",
      threshold: 100,
      icon: (
        <path
          d="M9.5 17.5H14.5M10 20H14M12 4.5C9.2 4.5 7.2 6.6 7.2 9.2C7.2 11 8.2 12.2 9.2 13.4C9.7 14 9.8 14.5 9.8 15H14.2C14.2 14.5 14.3 14 14.8 13.4C15.8 12.2 16.8 11 16.8 9.2C16.8 6.6 14.8 4.5 12 4.5Z"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      ),
    },
  ];

  return (
    <div className="mt-4 grid grid-cols-4 gap-2">
      {items.map((item) => {
        const lit = pct >= item.threshold;
        return (
          <div
            key={item.label}
            className={`flex flex-col items-center gap-1 rounded-2xl border px-2 py-2.5 transition-all duration-300 ${
              lit
                ? "border-[#3D8B5B]/25 bg-[#EEF6EA]/90 text-[#2B6E45] shadow-[0_4px_12px_rgba(61,139,91,0.10)]"
                : "border-[#528A5F]/10 bg-[#FAFBF7]/70 text-[#526859]/45"
            }`}
          >
            <svg
              aria-hidden="true"
              className="h-5 w-5"
              viewBox="0 0 24 24"
              fill="none"
            >
              {item.icon}
            </svg>
            <span className="text-[10px] font-semibold">{item.label}</span>
          </div>
        );
      })}
    </div>
  );
}

/** Visual EV scenic road where an electric car glides smoothly with daily range */
function EvRangeVisual({ barPct }: { barPct: number }) {
  const clamped = Math.max(8, Math.min(94, barPct));
  return (
    <div className="mt-4 rounded-2xl border border-[#528A5F]/12 bg-gradient-to-b from-[#FFFDF5] to-[#EEF6EA]/70 px-3.5 pt-3 pb-2.5">
      <div className="relative h-11 w-full">
        {/* Soft horizon hills + road line */}
        <svg
          aria-hidden="true"
          viewBox="0 0 260 44"
          className="h-full w-full overflow-visible"
          fill="none"
          preserveAspectRatio="none"
        >
          <path
            d="M0 36 Q 60 22, 130 32 T 260 28 L 260 40 L 0 40 Z"
            fill="#84BD8D"
            fillOpacity="0.16"
          />
          <line
            x1="0"
            y1="38"
            x2="260"
            y2="38"
            stroke="#528A5F"
            strokeOpacity="0.22"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>

        {/* Sunlit energized trail behind car */}
        <motion.div
          initial={false}
          animate={{ width: `${clamped}%` }}
          transition={SPRING}
          className="absolute bottom-[5px] left-0 h-1 rounded-full bg-gradient-to-r from-[#E9A033] to-[#3D8B5B]"
        />

        {/* Gliding minimalist EV icon */}
        <motion.div
          initial={false}
          animate={{ left: `calc(${clamped}% - 22px)` }}
          transition={SPRING}
          className="absolute bottom-[6px]"
        >
          <svg
            aria-hidden="true"
            width="38"
            height="22"
            viewBox="0 0 38 22"
            fill="none"
          >
            <path
              d="M4 14L8 7.5C9 6.2 10.5 5.5 12.2 5.5H23.5C25.5 5.5 27.2 6.5 28.4 8L32.5 12.5C34.2 13 35.5 14.3 35.5 16V17.5H2.5V15.5C2.5 14.7 3.1 14 4 14Z"
              fill="#FFFFFF"
              stroke="#1D2F23"
              strokeWidth="1.5"
              strokeLinejoin="round"
            />
            <path
              d="M11 8.5H22.5L26 12H9.5L11 8.5Z"
              fill="#EEF6EA"
            />
            <circle cx="10.5" cy="17.5" r="3" fill="#1D2F23" />
            <circle cx="10.5" cy="17.5" r="1.2" fill="#F7C65E" />
            <circle cx="28" cy="17.5" r="3" fill="#1D2F23" />
            <circle cx="28" cy="17.5" r="1.2" fill="#F7C65E" />
          </svg>
        </motion.div>
      </div>
    </div>
  );
}

/** Visual 24-hour cooling ring gauge + breeze waves */
function CoolingRingVisual({ hours }: { hours: number }) {
  const pct = Math.min(1, hours / 24);
  const r = 24;
  const circ = 2 * Math.PI * r;
  const dashOffset = circ * (1 - pct);

  return (
    <div className="mt-4 flex items-center gap-4 rounded-2xl border border-[#528A5F]/12 bg-[#EBF5F3]/55 px-4 py-2.5">
      <svg
        aria-hidden="true"
        width="60"
        height="60"
        viewBox="0 0 60 60"
        className="shrink-0"
      >
        <circle
          cx="30"
          cy="30"
          r={r}
          fill="none"
          stroke="#528A5F"
          strokeOpacity="0.14"
          strokeWidth="5.5"
        />
        <motion.circle
          cx="30"
          cy="30"
          r={r}
          fill="none"
          stroke="#4E9B8F"
          strokeWidth="5.5"
          strokeLinecap="round"
          strokeDasharray={circ}
          initial={false}
          animate={{ strokeDashoffset: dashOffset }}
          transition={SPRING}
          transform="rotate(-90 30 30)"
        />
        <text
          x="30"
          y="33.5"
          textAnchor="middle"
          className="fill-[#1D2F23] text-[11px] font-bold tabular-nums"
        >
          {Math.min(24, Math.round(hours))}h
        </text>
      </svg>

      {/* Cool breeze visual ribbons */}
      <div className="flex flex-1 flex-col gap-1.5">
        <svg
          aria-hidden="true"
          viewBox="0 0 140 28"
          className="h-7 w-full"
          fill="none"
        >
          <path
            d="M4 9 C 26 4, 48 14, 74 9 C 96 4, 114 12, 134 8"
            stroke="#4E9B8F"
            strokeOpacity="0.65"
            strokeWidth="2"
            strokeLinecap="round"
          />
          <path
            d="M14 19 C 38 14, 62 24, 92 18 C 110 14, 122 20, 136 18"
            stroke="#84BD8D"
            strokeOpacity="0.7"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
        <div className="flex justify-between text-[10px] font-semibold text-[#526859]">
          <span>12,000 BTU AC</span>
          <span>{hours >= 24 ? "24/7 capable" : "of 24h day"}</span>
        </div>
      </div>
    </div>
  );
}

/** Visual ritual chips: laundry cycles + morning espresso cups */
function DailyRitualsVisual({
  cyclesPerWeek,
  espressosPerDay,
}: {
  cyclesPerWeek: number;
  espressosPerDay: number;
}) {
  const activeDrums = Math.max(1, Math.min(7, Math.round(cyclesPerWeek / 14)));

  return (
    <div className="mt-4 flex items-center justify-between gap-3 rounded-2xl border border-[#528A5F]/12 bg-[#FFFDF5]/85 px-4 py-3">
      {/* Mini glowing wash-day dots (7 days of week) */}
      <div>
        <div className="flex items-center gap-1.5">
          {Array.from({ length: 7 }).map((_, i) => (
            <span
              key={i}
              className={`flex h-6 w-6 items-center justify-center rounded-lg border transition-colors ${
                i < activeDrums
                  ? "border-[#E9A033]/40 bg-[#FFF4D6] text-[#C87D14]"
                  : "border-[#528A5F]/12 bg-white text-[#526859]/30"
              }`}
            >
              <svg
                aria-hidden="true"
                className="h-3.5 w-3.5"
                viewBox="0 0 16 16"
                fill="none"
              >
                <circle
                  cx="8"
                  cy="8"
                  r="4.5"
                  stroke="currentColor"
                  strokeWidth="1.4"
                />
                <path
                  d="M5.5 8.5C6.8 7.5 9.2 9.5 10.5 8"
                  stroke="currentColor"
                  strokeWidth="1.2"
                  strokeLinecap="round"
                />
              </svg>
            </span>
          ))}
        </div>
        <div className="mt-1.5 text-[10px] font-medium text-[#526859]">
          Laundry &amp; dish loads
        </div>
      </div>

      {/* Playful espresso visual badge */}
      <div className="shrink-0 rounded-xl border border-[#E9A033]/25 bg-white px-3 py-1.5 text-right">
        <div className="text-xs font-semibold text-[#1D2F23]">
          <AnimatedNumber value={espressosPerDay} />
        </div>
        <div className="text-[10px] text-[#526859]">espressos / d</div>
      </div>
    </div>
  );
}

/** Living Solarpunk mini-forest SVG scaling dynamically with tree offset */
function TreeGroveVisual({ trees }: { trees: number }) {
  const visibleTrees = Math.max(3, Math.min(9, Math.round(trees / 18) + 2));
  const specs = [
    { x: 16, s: 0.72, c: "#84BD8D" },
    { x: 34, s: 0.9, c: "#5F9E6E" },
    { x: 54, s: 1.05, c: "#3D8B5B" },
    { x: 74, s: 0.85, c: "#84BD8D" },
    { x: 92, s: 1.0, c: "#5F9E6E" },
    { x: 112, s: 0.78, c: "#3D8B5B" },
    { x: 130, s: 0.94, c: "#84BD8D" },
    { x: 148, s: 0.82, c: "#5F9E6E" },
    { x: 166, s: 0.74, c: "#3D8B5B" },
  ];

  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 184 54"
      className="h-13 w-44 shrink-0"
      fill="none"
    >
      <circle cx="164" cy="11" r="6" fill="#F7C65E" fillOpacity="0.8" />
      <path
        d="M4 48 Q 92 40, 180 48"
        stroke="#5F9E6E"
        strokeOpacity="0.35"
        strokeWidth="2"
        strokeLinecap="round"
      />
      {specs.slice(0, visibleTrees).map((t, idx) => (
        <motion.g
          key={idx}
          initial={{ scale: 0.4, opacity: 0 }}
          animate={{ scale: t.s, opacity: 1 }}
          transition={{ ...SPRING, delay: idx * 0.03 }}
          style={{ originX: `${t.x}px`, originY: "46px" }}
        >
          <line
            x1={t.x}
            y1="46"
            x2={t.x}
            y2="30"
            stroke="#2B5A3C"
            strokeWidth="2.2"
            strokeLinecap="round"
          />
          <circle
            cx={t.x}
            cy="24"
            r="10"
            fill={t.c}
            fillOpacity="0.78"
          />
          <circle
            cx={t.x - 3}
            cy="21"
            r="4.5"
            fill="#B7DDBB"
            fillOpacity="0.55"
          />
        </motion.g>
      ))}
    </svg>
  );
}

/**
 * "What Your Sunlight Can Power"
 * Visual-first 2×2 everyday clean-living scenes + Solarpunk Mini-Forest Climate Strip.
 */
export function PoweredBySunGrid({
  relatable,
  activeDailyKwh,
  activeMonth,
}: PoweredBySunGridProps) {
  const surplusDailyKwh = Math.max(
    0,
    activeDailyKwh - RELATABLE_CONSTANTS.homeEssentialsDailyKwh
  );

  const evBarPct = Math.min(100, Math.round((relatable.evKmPerDay / 160) * 100));
  const dailyEspressoBrews = Math.round(activeDailyKwh / 0.045);

  return (
    <motion.section
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ ...SPRING, delay: 0.14 }}
      aria-label="What your sunlight can power"
      className="space-y-4"
    >
      {/* Crisp Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-1">
        <h2 className="font-serif text-2xl font-normal text-[#1D2F23]">
          What Your Sunlight Can Power
        </h2>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-[#528A5F]/16 bg-white/75 px-3 py-1 text-xs font-medium text-[#526859] backdrop-blur-sm">
          <span>{activeMonth ? activeMonth.fullName : "Yearly avg"}</span>
          <span>·</span>
          <strong className="font-semibold text-[#1D2F23]">
            <AnimatedNumber
              value={activeDailyKwh}
              decimals={1}
              suffix=" kWh/d"
            />
          </strong>
        </span>
      </div>

      {/* 2x2 Visual Everyday Cards */}
      <div className="grid gap-4 sm:grid-cols-2">
        {/* 1. Everyday Home Core */}
        <motion.article
          whileHover={{ y: -2 }}
          transition={SPRING}
          className="solarpunk-card flex flex-col justify-between p-5"
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <span className="text-[11px] font-semibold tracking-wide text-[#526859] uppercase">
                Home Core
              </span>
              <div className="mt-1 flex items-baseline gap-2">
                <span className="font-serif text-3xl text-[#1D2F23]">
                  <AnimatedNumber
                    value={relatable.homeCoreBarPercent}
                    suffix="%"
                  />
                </span>
                <span className="text-xs font-semibold text-[#3D8B5B]">
                  {relatable.homeCoreFullyCovered ? "covered" : "essentials"}
                </span>
              </div>
            </div>

            {relatable.homeCoreFullyCovered && (
              <span className="rounded-full bg-[#EEF6EA] px-2.5 py-1 text-[11px] font-semibold text-[#2B6E45]">
                +<AnimatedNumber value={surplusDailyKwh} decimals={1} suffix=" kWh" />
              </span>
            )}
          </div>

          <HomeEssentialsVisual pct={relatable.homeCorePercent} />
        </motion.article>

        {/* 2. Clean Driving (EV Range) */}
        <motion.article
          whileHover={{ y: -2 }}
          transition={SPRING}
          className="solarpunk-card flex flex-col justify-between p-5"
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <span className="text-[11px] font-semibold tracking-wide text-[#526859] uppercase">
                Electric Driving
              </span>
              <div className="mt-1 flex items-baseline gap-1.5">
                <span className="font-serif text-3xl text-[#1D2F23]">
                  ~<AnimatedNumber value={relatable.evKmPerDay} suffix=" km" />
                </span>
                <span className="text-xs font-medium text-[#526859]">/ day</span>
              </div>
            </div>

            <span className="rounded-full bg-[#FFF8E6] px-2.5 py-1 text-[11px] font-semibold text-[#A46711]">
              ~<AnimatedNumber value={relatable.evMilesPerDay} suffix=" mi" />
            </span>
          </div>

          <EvRangeVisual barPct={evBarPct} />
        </motion.article>

        {/* 3. Summer Comfort (AC / Cooling) */}
        <motion.article
          whileHover={{ y: -2 }}
          transition={SPRING}
          className="solarpunk-card flex flex-col justify-between p-5"
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <span className="text-[11px] font-semibold tracking-wide text-[#526859] uppercase">
                Cool Air Conditioning
              </span>
              <div className="mt-1 flex items-baseline gap-1.5">
                <span className="font-serif text-3xl text-[#1D2F23]">
                  <AnimatedNumber
                    value={relatable.acHoursPerDay}
                    decimals={1}
                    suffix=" hrs"
                  />
                </span>
                <span className="text-xs font-medium text-[#526859]">/ day</span>
              </div>
            </div>
          </div>

          <CoolingRingVisual hours={relatable.acHoursPerDay} />
        </motion.article>

        {/* 4. Daily Rituals */}
        <motion.article
          whileHover={{ y: -2 }}
          transition={SPRING}
          className="solarpunk-card flex flex-col justify-between p-5"
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <span className="text-[11px] font-semibold tracking-wide text-[#526859] uppercase">
                Daily Rituals
              </span>
              <div className="mt-1 flex items-baseline gap-1.5">
                <span className="font-serif text-3xl text-[#1D2F23]">
                  <AnimatedNumber
                    value={relatable.washCyclesPerWeek}
                    suffix=" loads"
                  />
                </span>
                <span className="text-xs font-medium text-[#526859]">
                  / week
                </span>
              </div>
            </div>
          </div>

          <DailyRitualsVisual
            cyclesPerWeek={relatable.washCyclesPerWeek}
            espressosPerDay={dailyEspressoBrews}
          />
        </motion.article>
      </div>

      {/* Visual Solarpunk Tree-Grove Climate Banner */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...SPRING, delay: 0.18 }}
        className="flex flex-col items-center justify-between gap-4 overflow-hidden rounded-[24px] border border-[#3D8B5B]/20 bg-gradient-to-r from-[#E7F4E9]/90 via-[#EFF7EC]/90 to-[#FFF9E6]/88 px-6 py-5 shadow-[0_12px_34px_rgba(61,139,91,0.08)] backdrop-blur-md sm:flex-row"
      >
        <div className="flex flex-col items-center gap-4 sm:flex-row">
          <TreeGroveVisual trees={relatable.equivalentTrees} />

          <div className="text-center sm:text-left">
            <div className="text-[11px] font-semibold tracking-wider text-[#3D8B5B] uppercase">
              Annual Clean Impact
            </div>
            <div className="mt-1 flex flex-wrap items-baseline justify-center gap-x-4 gap-y-1 sm:justify-start">
              <span className="font-serif text-2xl text-[#1D2F23] sm:text-3xl">
                <AnimatedNumber value={relatable.equivalentTrees} />{" "}
                <span className="font-sans text-sm font-semibold text-[#2B6E45]">
                  mature trees
                </span>
              </span>
              <span className="text-sm font-medium text-[#526859]">
                ·{" "}
                <strong className="font-semibold text-[#1D2F23]">
                  <AnimatedNumber
                    value={relatable.annualCo2AvoidedKg}
                    suffix=" kg"
                  />
                </strong>{" "}
                CO₂ avoided / yr
              </span>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.section>
  );
}
