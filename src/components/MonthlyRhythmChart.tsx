"use client";

import { AnimatePresence, motion } from "framer-motion";
import type { MonthlySolarSummary } from "@/lib/solar";

interface MonthlyRhythmChartProps {
  monthly: MonthlySolarSummary[];
  lockedMonthIndex: number | null;
  hoveredMonthIndex: number | null;
  onLockMonth: (monthIndex: number | null) => void;
  onHoverMonth: (monthIndex: number | null) => void;
}

const SPRING = {
  type: "spring" as const,
  stiffness: 180,
  damping: 24,
};

function getBarGradient(
  mood: MonthlySolarSummary["seasonMood"],
  isHighlighted: boolean
): string {
  if (mood === "summer") {
    return isHighlighted
      ? "linear-gradient(180deg, #E28E1C 0%, #F7C65E 100%)"
      : "linear-gradient(180deg, #E9A033 0%, #F8CF78 100%)";
  }
  if (mood === "winter") {
    return isHighlighted
      ? "linear-gradient(180deg, #5F9E6E 0%, #A9CEB2 100%)"
      : "linear-gradient(180deg, #8EB899 0%, #C7DFCB 100%)";
  }
  return isHighlighted
    ? "linear-gradient(180deg, #D99F38 0%, #A4CB96 100%)"
    : "linear-gradient(180deg, #DFBB68 0%, #C2DCB4 100%)";
}

/**
 * Interactive 12-Month Sunlight Rhythm (The Seasonal Scrubber).
 * Clean visual-first horizon bars with compact icon telemetry chips.
 */
export function MonthlyRhythmChart({
  monthly,
  lockedMonthIndex,
  hoveredMonthIndex,
  onLockMonth,
  onHoverMonth,
}: MonthlyRhythmChartProps) {
  const activeIndex =
    hoveredMonthIndex !== null ? hoveredMonthIndex : lockedMonthIndex;
  const activeMonth = activeIndex !== null ? monthly[activeIndex] : null;
  const maxDailyKwh = Math.max(...monthly.map((m) => m.avgDailyKwh), 0.1);

  return (
    <motion.section
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ ...SPRING, delay: 0.1 }}
      aria-label="12-month sunlight rhythm"
      className="solarpunk-card p-5 sm:p-7"
    >
      {/* Clean Header + Compact Telemetry Chips */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <h2 className="font-serif text-2xl font-normal text-[#1D2F23]">
            Sunlight Through the Year
          </h2>

          {activeMonth ? (
            <div className="inline-flex flex-wrap items-center gap-2 rounded-full border border-[#E9A033]/30 bg-[#FFFDF5] px-3 py-1 text-xs font-medium text-[#1D2F23] tabular-nums">
              <span className="font-semibold">{activeMonth.fullName}</span>
              <span className="text-[#E9A033]">
                ☀ {activeMonth.avgPeakSunHours.toFixed(1)}h
              </span>
              <span className="text-[#526859]">
                ☁ {activeMonth.avgCloudCoverPct}%
              </span>
              <span className="text-[#526859]">
                {activeMonth.avgMaxTempC}°C
              </span>
            </div>
          ) : (
            <span className="rounded-full bg-[#FAFBF7] px-3 py-1 text-xs text-[#526859] ring-1 ring-[#528A5F]/12">
              Hover or tap a month
            </span>
          )}
        </div>

        <AnimatePresence>
          {lockedMonthIndex !== null && (
            <motion.button
              key="reset-yearly-pill"
              type="button"
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.92 }}
              transition={SPRING}
              onClick={() => {
                onLockMonth(null);
                onHoverMonth(null);
              }}
              className="inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-[#3D8B5B]/25 bg-[#EEF6EA]/90 px-3.5 py-1.5 text-xs font-semibold text-[#2A583B] transition-colors hover:bg-white"
            >
              <svg
                aria-hidden="true"
                className="h-3.5 w-3.5"
                viewBox="0 0 16 16"
                fill="none"
              >
                <path
                  d="M3.2 8A4.8 4.8 0 1 1 4.6 11.4M3.2 8V5.2M3.2 8H6"
                  stroke="currentColor"
                  strokeWidth="1.45"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              Yearly Average
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      {/* 12-Column Interactive Sunlit Horizon Bars */}
      <div
        onMouseLeave={() => onHoverMonth(null)}
        className="solarpunk-subcard mt-4 px-3 pt-6 pb-4 sm:px-5"
      >
        <div className="grid h-44 grid-cols-12 items-end gap-1.5 sm:h-48 sm:gap-3">
          {monthly.map((month) => {
            const heightPct = Math.max(
              14,
              Math.round((month.avgDailyKwh / maxDailyKwh) * 100)
            );
            const isLocked = lockedMonthIndex === month.monthIndex;
            const isActive = activeIndex === month.monthIndex;
            const isDimmed = activeIndex !== null && !isActive;

            return (
              <button
                key={month.shortName}
                type="button"
                aria-pressed={isLocked}
                aria-label={`${month.fullName}: ${month.avgDailyKwh.toFixed(1)} kWh per day`}
                onMouseEnter={() => onHoverMonth(month.monthIndex)}
                onFocus={() => onHoverMonth(month.monthIndex)}
                onBlur={() => onHoverMonth(null)}
                onClick={() =>
                  onLockMonth(isLocked ? null : month.monthIndex)
                }
                className="group relative flex h-full cursor-pointer flex-col items-center justify-end gap-1.5 focus:outline-none"
              >
                <span
                  className={`text-[10px] font-semibold transition-all duration-200 tabular-nums sm:text-[11px] ${
                    isActive
                      ? "translate-y-0 text-[#1D2F23] opacity-100"
                      : "translate-y-1 text-[#526859] opacity-0 group-hover:translate-y-0 group-hover:opacity-100"
                  }`}
                >
                  {month.avgDailyKwh.toFixed(1)}
                </span>

                <div className="flex h-full w-full items-end">
                  <motion.div
                    initial={false}
                    animate={{
                      height: `${heightPct}%`,
                      opacity: isDimmed ? 0.48 : 1,
                      scaleX: isActive ? 1.04 : 1,
                    }}
                    transition={SPRING}
                    style={{
                      background: getBarGradient(month.seasonMood, isActive),
                    }}
                    className={`w-full rounded-t-xl transition-shadow duration-200 ${
                      isLocked
                        ? "ring-2 ring-[#E9A033] ring-offset-2 ring-offset-[#FAFBF7] shadow-[0_6px_18px_rgba(233,160,51,0.28)]"
                        : isActive
                          ? "shadow-[0_6px_16px_rgba(233,160,51,0.22)]"
                          : ""
                    }`}
                  />
                </div>

                <div className="flex flex-col items-center gap-1 pt-0.5">
                  <span
                    className={`text-[11px] transition-colors sm:text-xs ${
                      isActive
                        ? "font-semibold text-[#1D2F23]"
                        : "font-medium text-[#526859]"
                    }`}
                  >
                    {month.shortName}
                  </span>
                  <span
                    className={`h-1.5 w-1.5 rounded-full transition-opacity ${
                      isLocked
                        ? "bg-[#E9A033] opacity-100"
                        : "bg-[#3D8B5B] opacity-0"
                    }`}
                  />
                </div>
              </button>
            );
          })}
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-[#528A5F]/10 pt-3 text-[11px] text-[#526859]">
          <div className="flex flex-wrap items-center gap-3.5">
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-gradient-to-b from-[#E9A033] to-[#F7C65E]" />
              Summer
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-gradient-to-b from-[#DFBB68] to-[#C2DCB4]" />
              Spring / Autumn
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-gradient-to-b from-[#8EB899] to-[#C7DFCB]" />
              Winter
            </span>
          </div>
          <span className="tabular-nums">kWh / day</span>
        </div>
      </div>
    </motion.section>
  );
}
