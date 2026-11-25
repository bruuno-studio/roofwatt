"use client";

import { motion } from "framer-motion";
import { AnimatedNumber } from "@/components/AnimatedNumber";
import {
  getOrientationLabel,
  ORIENTATION_MULTIPLIERS,
  SYSTEM_SIZE_PRESETS,
  type RoofOrientation,
  type SolarSystemConfig,
} from "@/lib/solar";

interface RoofControlsBarProps {
  config: SolarSystemConfig;
  lat: number;
  onChangeConfig: (next: SolarSystemConfig) => void;
}

const SPRING = {
  type: "spring" as const,
  stiffness: 180,
  damping: 24,
};

const ORIENTATIONS: RoofOrientation[] = [
  "optimal",
  "east-west",
  "partial-shade",
];

/** Visual mini-illustration for Balcony (0.8 kW), Cozy Home (4 kW), Family Roof (8 kW) */
function SystemPresetArt({
  id,
  active,
}: {
  id: "balcony" | "cozy" | "family";
  active: boolean;
}) {
  const panelFill = active ? "#E9A033" : "#84BD8D";
  const roofStroke = active ? "#1D2F23" : "#526859";

  if (id === "balcony") {
    return (
      <svg
        aria-hidden="true"
        viewBox="0 0 64 42"
        className="h-10 w-16"
        fill="none"
      >
        {/* Warm sun dot */}
        <circle
          cx="50"
          cy="10"
          r="5"
          fill="#F7C65E"
          fillOpacity={active ? "0.95" : "0.55"}
        />
        {/* Apartment wall & balcony slab */}
        <rect
          x="10"
          y="10"
          width="28"
          height="26"
          rx="2.5"
          fill="#EEF6EA"
          stroke={roofStroke}
          strokeWidth="1.4"
        />
        <line
          x1="8"
          y1="36"
          x2="54"
          y2="36"
          stroke={roofStroke}
          strokeWidth="1.4"
          strokeLinecap="round"
        />
        {/* Balcony railing */}
        <rect
          x="32"
          y="22"
          width="20"
          height="14"
          rx="1.5"
          fill="#FFFFFF"
          fillOpacity="0.85"
          stroke={roofStroke}
          strokeWidth="1.3"
        />
        {/* 2 tilted balcony solar panels */}
        <rect
          x="34.5"
          y="24.5"
          width="6.5"
          height="9"
          rx="1"
          fill={panelFill}
          fillOpacity="0.85"
        />
        <rect
          x="43"
          y="24.5"
          width="6.5"
          height="9"
          rx="1"
          fill={panelFill}
          fillOpacity="0.85"
        />
        {/* Cute potted plant on balcony */}
        <circle cx="24" cy="24" r="3.5" fill="#5F9E6E" fillOpacity="0.7" />
        <rect
          x="15"
          y="15"
          width="7"
          height="7"
          rx="1.2"
          fill="#FFF8E6"
          stroke={roofStroke}
          strokeWidth="1.1"
        />
      </svg>
    );
  }

  if (id === "cozy") {
    return (
      <svg
        aria-hidden="true"
        viewBox="0 0 64 42"
        className="h-10 w-16"
        fill="none"
      >
        <circle
          cx="52"
          cy="9"
          r="5.5"
          fill="#F7C65E"
          fillOpacity={active ? "0.95" : "0.55"}
        />
        {/* Cozy cottage walls */}
        <path
          d="M16 21V36H48V21"
          fill="#EEF6EA"
          stroke={roofStroke}
          strokeWidth="1.4"
          strokeLinejoin="round"
        />
        {/* Pitched roof */}
        <path
          d="M11 22L32 9L53 22"
          stroke={roofStroke}
          strokeWidth="1.65"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* Solar panels neatly along sunlit slope */}
        <path
          d="M32.5 11.4L47 20.2L41.8 23.2L27.5 14.5Z"
          fill={panelFill}
          fillOpacity="0.9"
          stroke="#FFFFFF"
          strokeWidth="0.9"
        />
        {/* Cozy door + window */}
        <rect
          x="28.5"
          y="27"
          width="7"
          height="9"
          rx="1.5"
          fill="#FFFFFF"
          stroke={roofStroke}
          strokeWidth="1.2"
        />
        <line
          x1="8"
          y1="36"
          x2="56"
          y2="36"
          stroke="#84BD8D"
          strokeWidth="1.6"
          strokeLinecap="round"
        />
      </svg>
    );
  }

  // Family Roof (8 kW)
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 64 42"
      className="h-10 w-16"
      fill="none"
    >
      <circle
        cx="54"
        cy="8.5"
        r="5.5"
        fill="#F7C65E"
        fillOpacity={active ? "0.95" : "0.55"}
      />
      {/* Wide modern family home */}
      <path
        d="M9 22V36H47V22"
        fill="#EEF6EA"
        stroke={roofStroke}
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
      <path
        d="M5 23L28 9L51 23"
        stroke={roofStroke}
        strokeWidth="1.65"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Double-row gleaming solar array across both slopes */}
      <path
        d="M28.5 11.5L46.5 22.3L42 24.8L24.5 14.2Z"
        fill={panelFill}
        fillOpacity="0.92"
        stroke="#FFFFFF"
        strokeWidth="0.85"
      />
      <path
        d="M11 22L25.5 13.4L28 15.6L14 24Z"
        fill={panelFill}
        fillOpacity="0.62"
        stroke="#FFFFFF"
        strokeWidth="0.85"
      />
      {/* Lush side tree */}
      <line
        x1="55"
        y1="36"
        x2="55"
        y2="29"
        stroke="#526859"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <circle cx="55" cy="25" r="5" fill="#5F9E6E" fillOpacity="0.65" />
      <line
        x1="4"
        y1="36"
        x2="60"
        y2="36"
        stroke="#84BD8D"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}

/** Visual sun-and-roof diagram for South/North, East/West, Partial Shade */
function OrientationArt({
  orientation,
  active,
}: {
  orientation: RoofOrientation;
  active: boolean;
}) {
  const roofStroke = active ? "#1D2F23" : "#526859";

  if (orientation === "optimal") {
    return (
      <svg
        aria-hidden="true"
        viewBox="0 0 60 40"
        className="h-10 w-15"
        fill="none"
      >
        {/* High midday sun directly above roof */}
        <circle
          cx="30"
          cy="9.5"
          r="5"
          fill="#F2B441"
          fillOpacity={active ? "1" : "0.65"}
        />
        {/* Radiant direct rays */}
        <path
          d="M30 16.5V20.5M23.5 15L21 18.5M36.5 15L39 18.5"
          stroke="#E9A033"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
        {/* Clean sunlit roof */}
        <path
          d="M12 31L30 21L48 31"
          stroke={roofStroke}
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M17 31L30 23.8L43 31Z"
          fill="#F7C65E"
          fillOpacity={active ? "0.42" : "0.22"}
        />
      </svg>
    );
  }

  if (orientation === "east-west") {
    return (
      <svg
        aria-hidden="true"
        viewBox="0 0 60 40"
        className="h-10 w-15"
        fill="none"
      >
        {/* Twin morning (East) + afternoon (West) suns */}
        <circle
          cx="12"
          cy="14"
          r="4.2"
          fill="#F7C65E"
          fillOpacity={active ? "0.95" : "0.6"}
        />
        <circle
          cx="48"
          cy="14"
          r="4.2"
          fill="#E9A033"
          fillOpacity={active ? "0.85" : "0.5"}
        />
        {/* Soft dashed arc connecting east to west */}
        <path
          d="M17 11.5Q30 5 43 11.5"
          stroke="#E9A033"
          strokeOpacity="0.45"
          strokeWidth="1.2"
          strokeDasharray="2.5 3"
          strokeLinecap="round"
        />
        {/* Dual-slope roof */}
        <path
          d="M13 32L30 21L47 32"
          stroke={roofStroke}
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M17 32L30 24L43 32Z"
          fill="#84BD8D"
          fillOpacity={active ? "0.35" : "0.18"}
        />
      </svg>
    );
  }

  // Partial Shade
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 60 40"
      className="h-10 w-15"
      fill="none"
    >
      {/* Sun peeking past a Solarpunk tree canopy */}
      <circle
        cx="22"
        cy="10"
        r="4.5"
        fill="#F7C65E"
        fillOpacity={active ? "0.95" : "0.6"}
      />
      {/* Roof */}
      <path
        d="M9 32L25 22L41 32"
        stroke={roofStroke}
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Translucent dappled canopy & trunk shading the right slope */}
      <line
        x1="47"
        y1="34"
        x2="47"
        y2="24"
        stroke="#526859"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      <circle cx="45" cy="18" r="8" fill="#5F9E6E" fillOpacity="0.48" />
      <circle cx="51" cy="21" r="5.5" fill="#84BD8D" fillOpacity="0.52" />
      <path
        d="M27 25L39 32H27Z"
        fill="#526859"
        fillOpacity="0.22"
      />
    </svg>
  );
}

/**
 * Tactile Visual Roof Playground:
 * Visual architectural presets, live mini-panel mosaic + continuous kW slider,
 * and illustrated sun-angle / shade selectors — minimal text, instant visual feedback.
 */
export function RoofControlsBar({
  config,
  lat,
  onChangeConfig,
}: RoofControlsBarProps) {
  const approxPanels = Math.max(2, Math.round(config.systemSizeKw / 0.4));
  const sliderPct = ((config.systemSizeKw - 0.5) / (15 - 0.5)) * 100;
  // Visual mini solar panel grid (up to 16 crisp tiles scaling smoothly with kW)
  const totalVisualTiles = 16;
  const litVisualTiles = Math.max(
    1,
    Math.min(totalVisualTiles, Math.round((config.systemSizeKw / 15) * totalVisualTiles))
  );

  return (
    <motion.section
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ ...SPRING, delay: 0.06 }}
      aria-label="Personalize your roof setup"
      className="solarpunk-card p-5 sm:p-6"
    >
      <div className="grid gap-6 lg:grid-cols-12 lg:items-stretch">
        {/* Left: System Size Visual Presets + Slider + Live Panel Mosaic */}
        <div className="flex flex-col justify-between lg:col-span-7">
          <div>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <label
                htmlFor="roofwatt-kw-slider"
                className="text-xs font-semibold tracking-wider text-[#526859] uppercase"
              >
                Roof Array Size
              </label>

              {/* Live visual panel tiles + kW pill */}
              <div className="flex items-center gap-2.5">
                <div
                  aria-hidden="true"
                  className="hidden items-center gap-0.5 rounded-lg border border-[#528A5F]/15 bg-[#FAFBF7] px-2 py-1 sm:flex"
                  title={`${approxPanels} solar panels`}
                >
                  {Array.from({ length: totalVisualTiles }).map((_, i) => (
                    <span
                      key={i}
                      className={`h-3 w-1.5 rounded-[2px] transition-all duration-200 ${
                        i < litVisualTiles
                          ? "bg-gradient-to-b from-[#E9A033] to-[#F7C65E] shadow-[0_0_4px_rgba(233,160,51,0.45)]"
                          : "bg-[#528A5F]/14"
                      }`}
                    />
                  ))}
                </div>

                <span className="rounded-full bg-[#FFF8E6] px-2.5 py-0.5 text-sm font-semibold text-[#1D2F23] ring-1 ring-[#E9A033]/32">
                  <AnimatedNumber
                    value={config.systemSizeKw}
                    decimals={1}
                    suffix=" kW"
                  />
                </span>
                <span className="text-xs font-medium text-[#526859] tabular-nums">
                  {approxPanels} panels
                </span>
              </div>
            </div>

            {/* Visual Illustrated Preset Cards */}
            <div className="mt-3 grid grid-cols-3 gap-2 rounded-2xl border border-[#528A5F]/14 bg-[#FAFBF7]/90 p-1.5">
              {SYSTEM_SIZE_PRESETS.map((preset) => {
                const isSelected =
                  Math.abs(config.systemSizeKw - preset.kw) < 0.05;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() =>
                      onChangeConfig({ ...config, systemSizeKw: preset.kw })
                    }
                    className={`relative flex cursor-pointer flex-col items-center justify-center gap-1 rounded-xl px-2 py-2.5 text-center transition-colors ${
                      isSelected
                        ? "text-[#1D2F23]"
                        : "text-[#526859] hover:text-[#1D2F23]"
                    }`}
                  >
                    {isSelected && (
                      <motion.span
                        layoutId="roof-size-pill"
                        transition={SPRING}
                        className="absolute inset-0 -z-0 rounded-xl border border-[#E9A033]/40 bg-white shadow-[0_6px_16px_rgba(233,160,51,0.16)]"
                      />
                    )}
                    <div className="relative z-10">
                      <SystemPresetArt id={preset.id} active={isSelected} />
                    </div>
                    <span className="relative z-10 text-xs font-semibold sm:text-[13px]">
                      {preset.label}
                    </span>
                    <span className="relative z-10 text-[11px] font-medium text-[#526859] tabular-nums">
                      {preset.kw} kW
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Continuous Slider */}
          <div className="mt-4 px-0.5">
            <input
              id="roofwatt-kw-slider"
              type="range"
              min={0.5}
              max={15}
              step={0.1}
              value={config.systemSizeKw}
              onChange={(e) =>
                onChangeConfig({
                  ...config,
                  systemSizeKw: Number(Number(e.target.value).toFixed(1)),
                })
              }
              style={{
                background: `linear-gradient(to right, #E9A033 0%, #F7C65E ${sliderPct}%, rgba(82, 138, 95, 0.16) ${sliderPct}%, rgba(82, 138, 95, 0.16) 100%)`,
              }}
              className="roofwatt-slider w-full cursor-pointer"
            />
            <div className="mt-1.5 flex justify-between text-[11px] text-[#526859]/80 tabular-nums">
              <span>0.5 kW</span>
              <span>8 kW</span>
              <span>15 kW</span>
            </div>
          </div>
        </div>

        {/* Right: Visual Roof Direction & Shade Selector */}
        <div className="flex flex-col justify-between border-t border-[#528A5F]/12 pt-5 lg:col-span-5 lg:border-t-0 lg:border-l lg:pt-0 lg:pl-6">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold tracking-wider text-[#526859] uppercase">
                Sun Exposure
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[#EEF6EA] px-2.5 py-0.5 text-xs font-semibold text-[#3D8B5B] tabular-nums">
                {Math.round(ORIENTATION_MULTIPLIERS[config.orientation] * 100)}%
                sunlight
              </span>
            </div>

            <div
              role="radiogroup"
              aria-label="Roof direction and shade"
              className="mt-3 grid grid-cols-3 gap-2 rounded-2xl border border-[#528A5F]/14 bg-[#FAFBF7]/90 p-1.5"
            >
              {ORIENTATIONS.map((orientation) => {
                const isSelected = config.orientation === orientation;
                const label = getOrientationLabel(orientation, lat);
                const pct = Math.round(
                  ORIENTATION_MULTIPLIERS[orientation] * 100
                );
                return (
                  <button
                    key={orientation}
                    type="button"
                    role="radio"
                    aria-checked={isSelected}
                    onClick={() =>
                      onChangeConfig({ ...config, orientation })
                    }
                    className={`relative flex cursor-pointer flex-col items-center justify-center gap-1 rounded-xl px-1.5 py-2.5 text-center transition-colors ${
                      isSelected
                        ? "text-[#1D2F23]"
                        : "text-[#526859] hover:text-[#1D2F23]"
                    }`}
                  >
                    {isSelected && (
                      <motion.span
                        layoutId="roof-orientation-pill"
                        transition={SPRING}
                        className="absolute inset-0 -z-0 rounded-xl border border-[#3D8B5B]/30 bg-white shadow-[0_6px_16px_rgba(61,139,91,0.12)]"
                      />
                    )}
                    <div className="relative z-10">
                      <OrientationArt
                        orientation={orientation}
                        active={isSelected}
                      />
                    </div>
                    <span className="relative z-10 text-[11px] font-semibold leading-tight sm:text-xs">
                      {label}
                    </span>
                    <span className="relative z-10 text-[10px] font-medium text-[#3D8B5B] tabular-nums">
                      {pct}%
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Visual yield meter bar instead of a wordy paragraph */}
          <div className="mt-4 flex items-center gap-3 px-0.5">
            <div className="h-2 flex-1 overflow-hidden rounded-full bg-[#528A5F]/12">
              <motion.div
                initial={false}
                animate={{
                  width: `${Math.round(
                    ORIENTATION_MULTIPLIERS[config.orientation] * 100
                  )}%`,
                }}
                transition={SPRING}
                className="h-full rounded-full bg-gradient-to-r from-[#3D8B5B] to-[#84BD8D]"
              />
            </div>
            <span className="shrink-0 text-[11px] font-medium text-[#526859]">
              {config.orientation === "optimal"
                ? "Direct midday arc"
                : config.orientation === "east-west"
                  ? "Morning + evening"
                  : "Tree canopy shade"}
            </span>
          </div>
        </div>
      </div>
    </motion.section>
  );
}
