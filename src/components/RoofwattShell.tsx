"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { AddressSearchHero } from "@/components/AddressSearchHero";
import { GentleInsightsRow } from "@/components/GentleInsightsRow";
import { MonthlyRhythmChart } from "@/components/MonthlyRhythmChart";
import { PoweredBySunGrid } from "@/components/PoweredBySunGrid";
import { RoofControlsBar } from "@/components/RoofControlsBar";
import { SolarpunkBackdrop } from "@/components/SolarpunkBackdrop";
import { SunArcHeader } from "@/components/SunArcHeader";
import { VerificationModal } from "@/components/VerificationModal";
import {
  ALL_DEMO_CITIES,
  type SolarLocationDataset,
} from "@/lib/airnodehub";
import {
  computeRelatablePower,
  DEFAULT_SYSTEM_CONFIG,
  runSolarAudit,
  type SeasonMood,
  type SolarSystemConfig,
} from "@/lib/solar";

interface RoofwattShellProps {
  initialDemoMode: boolean;
}

const SPRING = {
  type: "spring" as const,
  stiffness: 180,
  damping: 24,
};

export function RoofwattShell({ initialDemoMode }: RoofwattShellProps) {
  const [dataset, setDataset] = useState<SolarLocationDataset | null>(null);
  const [systemConfig, setSystemConfig] = useState<SolarSystemConfig>(
    DEFAULT_SYSTEM_CONFIG
  );
  const [lockedMonthIndex, setLockedMonthIndex] = useState<number | null>(null);
  const [hoveredMonthIndex, setHoveredMonthIndex] = useState<number | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(false);
  const [loadingLabel, setLoadingLabel] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [verifyOpen, setVerifyOpen] = useState(false);

  // Instant client-side solar physics recalculation (zero extra API calls)
  const audit = useMemo(() => {
    if (!dataset) return null;
    return runSolarAudit(dataset.days, dataset.location.lat, systemConfig);
  }, [dataset, systemConfig]);

  const activeMonthIndex =
    hoveredMonthIndex !== null ? hoveredMonthIndex : lockedMonthIndex;

  const activeMonth = useMemo(() => {
    if (!audit || activeMonthIndex === null) return null;
    return audit.monthly[activeMonthIndex] ?? null;
  }, [audit, activeMonthIndex]);

  const seasonMood: SeasonMood = useMemo(() => {
    if (activeMonth) return activeMonth.seasonMood;
    if (!audit) return "spring-autumn";
    if (audit.annualAvgPeakSunHours >= 4.7) return "summer";
    if (audit.annualAvgPeakSunHours < 3.2) return "winter";
    return "spring-autumn";
  }, [activeMonth, audit]);

  const activeDailyKwh = activeMonth
    ? activeMonth.avgDailyKwh
    : (audit?.annualAvgDailyKwh ?? 0);

  const activeRelatable = useMemo(() => {
    if (!audit) return null;
    return computeRelatablePower(activeDailyKwh, audit.annualTotalKwh);
  }, [activeDailyKwh, audit]);

  async function exploreLocation(query: string) {
    setIsLoading(true);
    setLoadingLabel(query);
    setError(null);
    try {
      const res = await fetch(
        `/api/solar-audit?q=${encodeURIComponent(query)}`
      );
      const data = (await res.json()) as {
        dataset?: SolarLocationDataset;
        error?: string;
      };

      if (!res.ok || !data.dataset) {
        throw new Error(
          data.error || "Could not look up sunlight data for that address."
        );
      }

      setDataset(data.dataset);
      setLockedMonthIndex(null);
      setHoveredMonthIndex(null);

      if (typeof window !== "undefined") {
        const nextUrl = new URL(window.location.href);
        nextUrl.searchParams.set("roof", data.dataset.location.slug);
        window.history.replaceState({}, "", nextUrl.toString());
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went gently wrong reading your sky."
      );
    } finally {
      setIsLoading(false);
    }
  }

  function handleResetToHero() {
    setDataset(null);
    setLockedMonthIndex(null);
    setHoveredMonthIndex(null);
    setVerifyOpen(false);
    setError(null);
    if (typeof window !== "undefined") {
      const nextUrl = new URL(window.location.href);
      nextUrl.searchParams.delete("roof");
      window.history.replaceState({}, "", nextUrl.toString());
    }
  }

  // Deep-link / bookmark support (?roof=lisbon-portugal)
  useEffect(() => {
    if (typeof window === "undefined") return;
    const roofSlug = new URLSearchParams(window.location.search).get("roof");
    if (roofSlug) {
      void exploreLocation(roofSlug);
    }
  }, []);

  return (
    <div className="relative flex min-h-screen flex-col justify-between">
      <SolarpunkBackdrop seasonMood={seasonMood} />

      {/* Calm breathing sun indicator during live sky fetches */}
      <AnimatePresence>
        {isLoading && dataset && (
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            className="fixed top-4 left-1/2 z-40 flex -translate-x-1/2 items-center gap-2.5 rounded-full border border-[#E9A033]/35 bg-white/92 px-4 py-2 text-xs font-semibold text-[#1D2F23] shadow-[0_10px_30px_rgba(233,160,51,0.18)] backdrop-blur-md"
          >
            <svg
              aria-hidden="true"
              className="h-4 w-4 animate-spin text-[#E9A033]"
              viewBox="0 0 20 20"
              fill="none"
            >
              <circle
                cx="10"
                cy="10"
                r="7"
                stroke="currentColor"
                strokeOpacity="0.25"
                strokeWidth="2.2"
              />
              <path
                d="M10 3A7 7 0 0 1 17 10"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
              />
            </svg>
            <span>Reading 12 months of sunlight for {loadingLabel}...</span>
          </motion.div>
        )}
      </AnimatePresence>

      <main className="relative z-20 flex flex-1 flex-col justify-center">
        <AnimatePresence mode="wait">
          {!dataset || !audit || !activeRelatable ? (
            <motion.div
              key="landing-hero"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.35 }}
              className="flex flex-1 flex-col items-center justify-center"
            >
              <AddressSearchHero
                onSelectQuery={exploreLocation}
                isLoading={isLoading}
              />
              {error && (
                <p
                  role="alert"
                  className="mx-4 mt-2 max-w-lg rounded-2xl border border-[#E9A033]/35 bg-white/90 px-4 py-2 text-center text-xs font-medium text-[#8C4A19] shadow-sm backdrop-blur-md"
                >
                  {error}
                </p>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="living-workspace"
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={SPRING}
              className="mx-auto w-full max-w-4xl space-y-5 px-5 pt-6 pb-16 sm:space-y-6 sm:px-8 sm:pt-9"
            >
              {/* Calm top navigation + 5-city quick switcher */}
              <div className="flex flex-wrap items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={handleResetToHero}
                  className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-[#528A5F]/18 bg-white/80 px-4 py-2 text-xs font-medium text-[#1D2F23] shadow-[0_4px_14px_rgba(66,102,74,0.05)] backdrop-blur-md transition-colors hover:bg-white sm:text-sm"
                >
                  <svg
                    aria-hidden="true"
                    className="h-4 w-4 text-[#526859]"
                    viewBox="0 0 20 20"
                    fill="none"
                  >
                    <path
                      d="M12.5 5L7.5 10L12.5 15"
                      stroke="currentColor"
                      strokeWidth="1.75"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  Try another address
                </button>

                <div className="flex flex-wrap items-center gap-1 rounded-full border border-[#528A5F]/14 bg-white/65 p-1 backdrop-blur-md">
                  {ALL_DEMO_CITIES.map((city) => {
                    const active = city.slug === dataset.location.slug;
                    return (
                      <button
                        key={city.slug}
                        type="button"
                        disabled={isLoading}
                        onClick={() => exploreLocation(city.slug)}
                        className={`relative cursor-pointer rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                          active
                            ? "text-[#1D2F23]"
                            : "text-[#526859] hover:text-[#1D2F23]"
                        }`}
                      >
                        {active && (
                          <motion.span
                            layoutId="workspace-city-pill"
                            transition={SPRING}
                            className="absolute inset-0 -z-10 rounded-full border border-[#E9A033]/38 bg-[#FFFDF5] shadow-[0_3px_10px_rgba(233,160,51,0.16)]"
                          />
                        )}
                        {city.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {error && (
                <div
                  role="alert"
                  className="rounded-2xl border border-[#E9A033]/35 bg-[#FFFDF5]/92 px-4 py-2.5 text-xs font-medium text-[#8C4A19]"
                >
                  {error}
                </div>
              )}

              {dataset.demoFallbackNote && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="rounded-2xl border border-[#E9A033]/28 bg-[#FFFDF5]/88 px-4 py-3 text-xs leading-relaxed text-[#526859] backdrop-blur-md sm:text-sm"
                >
                  <span className="font-semibold text-[#1D2F23]">
                    Preview Mode:{" "}
                  </span>
                  {dataset.demoFallbackNote}
                </motion.div>
              )}

              {/* 1. Animated Sky Arc & Hero Solar Card */}
              <SunArcHeader
                location={dataset.location}
                audit={audit}
                activeMonth={activeMonth}
                seasonMood={seasonMood}
                systemSizeKw={systemConfig.systemSizeKw}
              />

              {/* 2. Visual Roof Playground (Instant Sliders & Orientation) */}
              <RoofControlsBar
                config={systemConfig}
                lat={dataset.location.lat}
                onChangeConfig={setSystemConfig}
              />

              {/* 3. Interactive 12-Month Sunlight Rhythm Scrubber */}
              <MonthlyRhythmChart
                monthly={audit.monthly}
                lockedMonthIndex={lockedMonthIndex}
                hoveredMonthIndex={hoveredMonthIndex}
                onLockMonth={setLockedMonthIndex}
                onHoverMonth={setHoveredMonthIndex}
              />

              {/* 4. What Your Sunlight Can Power + Tree Grove Impact */}
              <PoweredBySunGrid
                relatable={activeRelatable}
                activeDailyKwh={activeDailyKwh}
                activeMonth={activeMonth}
              />

              {/* 5. Visual Real-World Sky Notes */}
              <GentleInsightsRow audit={audit} />

              {/* 6. Quiet Honesty & Interactive Cryptographic Verification Pill */}
              <section className="solarpunk-card flex flex-col items-start justify-between gap-4 px-5 py-4 text-xs leading-relaxed text-[#526859] sm:flex-row sm:items-center sm:px-6">
                <p className="max-w-2xl">
                  Estimates use 12 months of real irradiance, cloud cover, and
                  temperature (20% panels, 14% system losses). Local tree or
                  chimney shade is not measured.
                </p>
                <button
                  type="button"
                  onClick={() => setVerifyOpen(true)}
                  className="inline-flex shrink-0 cursor-pointer items-center gap-1.5 rounded-full border border-[#3D8B5B]/26 bg-[#EEF6EA]/90 px-3.5 py-1.5 text-[11px] font-semibold text-[#2B6E45] transition-all hover:border-[#3D8B5B]/45 hover:bg-white hover:shadow-[0_4px_14px_rgba(61,139,91,0.14)]"
                >
                  <svg
                    aria-hidden="true"
                    className="h-3.5 w-3.5"
                    viewBox="0 0 16 16"
                    fill="none"
                  >
                    <path
                      d="M8 1.8L13 3.8V7.6C13 10.9 10.9 13.4 8 14.4C5.1 13.4 3 10.9 3 7.6V3.8L8 1.8Z"
                      stroke="currentColor"
                      strokeWidth="1.4"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M5.8 8.1L7.3 9.6L10.4 6.5"
                      stroke="currentColor"
                      strokeWidth="1.4"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  Verified via API3 AirnodeHub
                </button>
              </section>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Quiet Solarpunk Footer */}
      <footer className="relative z-10 mx-auto flex w-full max-w-4xl flex-wrap items-center justify-between gap-2 px-6 py-5 text-xs text-[#526859]/90">
        <span className="inline-flex items-center gap-2">
          <svg
            aria-hidden="true"
            className="h-4 w-4 text-[#2B6652]"
            viewBox="0 0 16 16"
            fill="none"
          >
            <polygon points="2,11 9.5,6.5 14,10 6.5,14" fill="currentColor" />
            <circle cx="12.2" cy="3.8" r="2" fill="#E9A033" />
          </svg>
          <span>
            ROOFWATT ·{" "}
            <strong className="font-medium text-[#1D2F23]">
              API3 AirnodeHub
            </strong>
          </span>
        </span>
        <span className="flex items-center gap-3 text-[11px]">
          <span>Powered by Geoapify &amp; Open-Meteo</span>
          <span className="rounded-full border border-[#528A5F]/18 bg-white/75 px-2.5 py-0.5 font-medium text-[#3D8B5B] backdrop-blur-sm">
            {initialDemoMode ? "Preview Mode" : "Live AirnodeHub"}
          </span>
        </span>
      </footer>

      {dataset && (
        <VerificationModal
          open={verifyOpen}
          onClose={() => setVerifyOpen(false)}
          dataset={dataset}
        />
      )}
    </div>
  );
}
