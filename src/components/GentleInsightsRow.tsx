"use client";

import { motion } from "framer-motion";
import { AnimatedNumber } from "@/components/AnimatedNumber";
import type { SolarAuditResult } from "@/lib/solar";

interface GentleInsightsRowProps {
  audit: SolarAuditResult;
}

const SPRING = {
  type: "spring" as const,
  stiffness: 180,
  damping: 24,
};

function formatShortDateWindow(
  startDate: string | null,
  endDate: string | null
): string | null {
  if (!startDate || !endDate) return null;
  const parse = (iso: string) => {
    const [, m, d] = iso.split("-");
    const months = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];
    return `${months[Math.max(0, Number(m) - 1)]} ${Number(d)}`;
  };
  return `${parse(startDate)} – ${parse(endDate)}`;
}

/**
 * Visual-First Gentle Real-World Notes:
 * Three crisp micro-infographic tiles showing seasonal contrast, overcast streaks,
 * and summer heat efficiency with minimal words.
 */
export function GentleInsightsRow({ audit }: GentleInsightsRowProps) {
  const streakWindow = formatShortDateWindow(
    audit.cloudyStreak.startDate,
    audit.cloudyStreak.endDate
  );

  const quietestRelativePct = Math.max(
    14,
    Math.round(
      (audit.quietestMonth.avgDailyKwh /
        Math.max(0.1, audit.sunniestMonth.avgDailyKwh)) *
        100
    )
  );

  // Visual 10-day sky strip showing exact cloudy streak visually
  const totalStreakDots = 10;
  const dimDots = Math.min(totalStreakDots, audit.cloudyStreak.longestStreakDays);

  // Visual heat efficiency bar (100% minus summer heat trim)
  const efficiencyPct = Math.max(
    75,
    Math.min(100, Math.round(100 + audit.summerHeatAdjustmentPct))
  );

  return (
    <motion.section
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ ...SPRING, delay: 0.18 }}
      aria-label="Gentle real-world solar notes"
      className="space-y-3.5"
    >
      <div className="px-1">
        <h2 className="font-serif text-2xl font-normal text-[#1D2F23]">
          Real-World Sky Notes
        </h2>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {/* 1. Summer vs. Winter Visual Comparison */}
        <article className="solarpunk-card flex flex-col justify-between p-5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold tracking-wide text-[#C87D14] uppercase">
              Seasonal Swing
            </span>
            <span className="font-serif text-2xl text-[#1D2F23]">
              <AnimatedNumber
                value={audit.summerWinterRatio}
                decimals={1}
                suffix="×"
              />
            </span>
          </div>

          <div className="mt-4 space-y-3 text-xs">
            <div>
              <div className="mb-1 flex items-center justify-between">
                <span className="inline-flex items-center gap-1.5 font-semibold text-[#1D2F23]">
                  <span className="h-2.5 w-2.5 rounded-full bg-[#E9A033]" />
                  {audit.sunniestMonth.shortName}
                </span>
                <span className="font-semibold text-[#1D2F23] tabular-nums">
                  <AnimatedNumber
                    value={audit.sunniestMonth.avgDailyKwh}
                    decimals={1}
                    suffix=" kWh/d"
                  />
                </span>
              </div>
              <div className="h-2.5 w-full rounded-full bg-[#528A5F]/10">
                <div className="h-full w-full rounded-full bg-gradient-to-r from-[#E9A033] to-[#F7C65E]" />
              </div>
            </div>

            <div>
              <div className="mb-1 flex items-center justify-between">
                <span className="inline-flex items-center gap-1.5 font-semibold text-[#526859]">
                  <span className="h-2.5 w-2.5 rounded-full bg-[#84BD8D]" />
                  {audit.quietestMonth.shortName}
                </span>
                <span className="font-semibold text-[#526859] tabular-nums">
                  <AnimatedNumber
                    value={audit.quietestMonth.avgDailyKwh}
                    decimals={1}
                    suffix=" kWh/d"
                  />
                </span>
              </div>
              <div className="h-2.5 w-full rounded-full bg-[#528A5F]/10">
                <motion.div
                  initial={false}
                  animate={{ width: `${quietestRelativePct}%` }}
                  transition={SPRING}
                  className="h-full rounded-full bg-gradient-to-r from-[#84BD8D] to-[#B7DDBB]"
                />
              </div>
            </div>
          </div>
        </article>

        {/* 2. Cloudy Streak Visual Sky Calendar */}
        <article className="solarpunk-card flex flex-col justify-between p-5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold tracking-wide text-[#4D7B68] uppercase">
              Longest Dim Spell
            </span>
            <span className="font-serif text-2xl text-[#1D2F23]">
              <AnimatedNumber
                value={audit.cloudyStreak.longestStreakDays}
                suffix="d"
              />
            </span>
          </div>

          {/* 10-day visual sky strip */}
          <div className="mt-4 grid grid-cols-10 gap-1 rounded-2xl border border-[#528A5F]/12 bg-[#FAFBF7] p-2.5">
            {Array.from({ length: totalStreakDots }).map((_, idx) => {
              const isDim = idx < dimDots;
              return (
                <div
                  key={idx}
                  title={isDim ? "Heavy-cloud day" : "Brighter day"}
                  className={`flex h-7 items-center justify-center rounded-lg ${
                    isDim
                      ? "bg-[#DAEAE8] text-[#4D7B68]"
                      : "bg-[#FFF6DF] text-[#E9A033]"
                  }`}
                >
                  {isDim ? (
                    <svg
                      aria-hidden="true"
                      className="h-3.5 w-3.5"
                      viewBox="0 0 16 16"
                      fill="currentColor"
                    >
                      <path d="M5 12H11.5A2.5 2.5 0 0 0 11.7 7.1A3.6 3.6 0 0 0 4.8 8.3A2 2 0 0 0 5 12Z" />
                    </svg>
                  ) : (
                    <svg
                      aria-hidden="true"
                      className="h-3 w-3"
                      viewBox="0 0 16 16"
                      fill="currentColor"
                    >
                      <circle cx="8" cy="8" r="3.4" />
                    </svg>
                  )}
                </div>
              );
            })}
          </div>

          <div className="mt-3 flex items-center justify-between text-[11px] text-[#526859]">
            <span>{streakWindow ?? "Past 12 months"}</span>
            <span className="font-medium text-[#3D8B5B]">
              Battery / grid smooths
            </span>
          </div>
        </article>

        {/* 3. Summer Heat Efficiency Visual Gauge */}
        <article className="solarpunk-card flex flex-col justify-between p-5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold tracking-wide text-[#3D8B5B] uppercase">
              Summer Heat Curve
            </span>
            <span className="font-serif text-2xl text-[#1D2F23] tabular-nums">
              {audit.summerAvgMaxTempC}°C
            </span>
          </div>

          {/* Visual Panel Efficiency Thermometer Bar */}
          <div className="mt-4 rounded-2xl border border-[#528A5F]/12 bg-[#FAFBF7] p-3">
            <div className="mb-1.5 flex items-center justify-between text-[11px]">
              <span className="font-medium text-[#526859]">
                Hot-day efficiency
              </span>
              <span className="font-semibold text-[#C87D14] tabular-nums">
                {audit.summerHeatAdjustmentPct}% ({efficiencyPct}%)
              </span>
            </div>
            <div className="h-2.5 w-full overflow-hidden rounded-full bg-[#528A5F]/12">
              <motion.div
                initial={false}
                animate={{ width: `${efficiencyPct}%` }}
                transition={SPRING}
                className="h-full rounded-full bg-gradient-to-r from-[#3D8B5B] via-[#84BD8D] to-[#F2B441]"
              />
            </div>
          </div>

          <div className="mt-3 flex items-center justify-between text-[11px] text-[#526859]">
            <span>Peak cool efficiency</span>
            <span className="tabular-nums">-0.4% / °C &gt; 25°C</span>
          </div>
        </article>
      </div>
    </motion.section>
  );
}
