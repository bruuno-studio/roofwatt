/**
 * ROOFWATT Solar Physics & Relatable Energy Translation Engine
 *
 * Deterministic, scientifically grounded solar modeling derived from real
 * historical daily Global Horizontal Irradiance (GHI), cloud cover, sunshine
 * duration, and maximum ambient temperature.
 */

export type IrradianceUnit = "MJ/m²" | "kWh/m²" | "W/m²";

export type RoofOrientation = "optimal" | "east-west" | "partial-shade";

export type SeasonMood = "summer" | "spring-autumn" | "winter";

export interface DailyWeatherRecord {
  /** ISO date string YYYY-MM-DD */
  date: string;
  /** Daily Global Horizontal Irradiance in kWh/m²/day (equals Peak Sun Hours) */
  ghiKwhM2: number;
  /** Raw shortwave radiation sum in MJ/m² (Open-Meteo native unit) */
  shortwaveRadiationMjM2: number;
  /** Daily mean cloud cover percentage (0–100) */
  cloudCoverPct: number;
  /** Daily sunshine duration in hours */
  sunshineHours: number;
  /** Daily daylight duration in hours */
  daylightHours: number;
  /** Daily maximum ambient temperature in °C */
  maxTempC: number;
}

export interface SolarSystemConfig {
  /** Installed DC capacity in kW (0.5 – 15 kW) */
  systemSizeKw: number;
  /** Roof direction / shading scenario */
  orientation: RoofOrientation;
}

export interface MonthlySolarSummary {
  /** 0 = Jan ... 11 = Dec */
  monthIndex: number;
  /** Short display label e.g. "Jan" */
  shortName: string;
  /** Full display label e.g. "January" */
  fullName: string;
  /** Number of days included in this month's dataset */
  dayCount: number;
  /** Average daily peak sun hours (kWh/m²/day) */
  avgPeakSunHours: number;
  /** Average daily estimated output (kWh/day) */
  avgDailyKwh: number;
  /** Total monthly estimated output (kWh/month) */
  totalMonthlyKwh: number;
  /** Average cloud cover (%) */
  avgCloudCoverPct: number;
  /** Average sunshine hours/day */
  avgSunshineHours: number;
  /** Average daily max ambient temperature (°C) */
  avgMaxTempC: number;
  /** Average temperature efficiency factor (0.75–1.00) */
  avgTempFactor: number;
  /** Hemisphere-aware seasonal mood for ambient sky gradients */
  seasonMood: SeasonMood;
  /** Normalized solar elevation (0.18–0.92) for the Sky Arc visual */
  solarElevationNorm: number;
}

export interface RelatablePowerOutput {
  /** Exact percentage of 5.5 kWh/day everyday home core covered */
  homeCorePercent: number;
  /** Clamped 0–100 percentage for fill bars */
  homeCoreBarPercent: number;
  /** True when roof covers >= 100% of core essentials */
  homeCoreFullyCovered: boolean;
  /** Estimated EV driving range in km/day */
  evKmPerDay: number;
  /** Estimated EV driving range in miles/day */
  evMilesPerDay: number;
  /** Estimated hours/day of a 12,000 BTU inverter AC */
  acHoursPerDay: number;
  /** Estimated weekly laundry & dishwasher cycles */
  washCyclesPerWeek: number;
  /** Estimated annual CO₂ avoided in kg (always annualized for the selected rate or full year) */
  annualCo2AvoidedKg: number;
  /** Equivalent mature trees absorbing CO₂ per year */
  equivalentTrees: number;
}

export interface CloudyStreakInfo {
  /** Maximum consecutive days below 25% of annual average daily GHI */
  longestStreakDays: number;
  /** Threshold GHI in kWh/m²/day used to detect dim days */
  dimThresholdKwhM2: number;
  /** Start date of the longest streak, if any */
  startDate: string | null;
  /** End date of the longest streak, if any */
  endDate: string | null;
}

export interface SolarPotentialRating {
  label: string;
  tier: "abundant" | "bright" | "steady" | "gentle";
  tagline: string;
}

export interface SolarAuditResult {
  /** Optimal fixed panel tilt angle in degrees (10°–55°) */
  optimalTiltDeg: number;
  /** Hemisphere-aware optimal compass facing */
  optimalDirection: "South" | "North";
  /** Friendly solar potential rating */
  potential: SolarPotentialRating;
  /** Average daily peak sun hours across the full year */
  annualAvgPeakSunHours: number;
  /** Average daily output across the full year (kWh/day) */
  annualAvgDailyKwh: number;
  /** Total estimated output over 12 months (kWh/year) */
  annualTotalKwh: number;
  /** Average cloud cover across the year (%) */
  annualAvgCloudCoverPct: number;
  /** Average daily max ambient temperature across the year (°C) */
  annualAvgMaxTempC: number;
  /** Average summer (warmest 3 months) max temperature (°C) */
  summerAvgMaxTempC: number;
  /** Average summer heat efficiency adjustment percentage (negative or 0, e.g. -5.4) */
  summerHeatAdjustmentPct: number;
  /** Monthly breakdown sorted Jan (0) through Dec (11) */
  monthly: MonthlySolarSummary[];
  /** Sunniest month summary */
  sunniestMonth: MonthlySolarSummary;
  /** Quietest month summary */
  quietestMonth: MonthlySolarSummary;
  /** Ratio of sunniest month avgDailyKwh to quietest month avgDailyKwh */
  summerWinterRatio: number;
  /** Longest consecutive cloudy/dim streak across the past year */
  cloudyStreak: CloudyStreakInfo;
  /** Relatable power translations at the yearly average daily rate */
  yearlyRelatable: RelatablePowerOutput;
}

// ============================================================================
// Physics & Relatable Translation Constants (SPEC Section 5)
// ============================================================================

/** Standard system performance ratio accounting for ~14% inverter, wiring & soiling losses */
export const PERFORMANCE_RATIO = 0.86;

/** Reference cell temperature under Standard Test Conditions (°C) */
export const STC_CELL_TEMP_C = 25;

/** Approximate daytime solar cell temperature rise above max ambient air temperature (°C) */
export const CELL_TEMP_RISE_C = 20;

/** Crystalline silicon thermal power coefficient (-0.4% per °C above 25°C) */
export const TEMP_DERATE_PER_C = 0.004;

/** Gentle lower cap on thermal derating factor for extreme heat events */
export const MIN_TEMP_FACTOR = 0.75;

/** Orientation and shading yield multipliers */
export const ORIENTATION_MULTIPLIERS: Record<RoofOrientation, number> = {
  optimal: 1.0,
  "east-west": 0.85,
  "partial-shade": 0.72,
};

/** Relatable everyday household energy constants (clearly labeled as estimates) */
export const RELATABLE_CONSTANTS = {
  /** Everyday Home Core: fridge, Wi-Fi router, 2 laptops, evening LED lighting */
  homeEssentialsDailyKwh: 5.5,
  /** Modern EV real-world driving efficiency */
  evKmPerKwh: 5.8,
  evMilesPerKwh: 3.6,
  /** 12,000 BTU inverter air conditioner average draw */
  acKwhPerHour: 0.9,
  /** Standard washing machine or dishwasher eco/normal cycle */
  washCycleKwh: 1.1,
  /** Global grid average CO₂ displaced per solar kWh */
  co2KgPerKwh: 0.4,
  /** Annual CO₂ absorbed by one mature tree */
  treeCo2KgPerYear: 21,
} as const;

export const SYSTEM_SIZE_PRESETS = [
  {
    id: "balcony",
    label: "Balcony",
    kw: 0.8,
    panelsText: "2 panels · apartment-friendly",
  },
  {
    id: "cozy",
    label: "Cozy Home",
    kw: 4.0,
    panelsText: "~10 panels",
  },
  {
    id: "family",
    label: "Family Roof",
    kw: 8.0,
    panelsText: "~20 panels",
  },
] as const;

export const DEFAULT_SYSTEM_CONFIG: SolarSystemConfig = {
  systemSizeKw: 4.0,
  orientation: "optimal",
};

const MONTH_META = [
  { shortName: "Jan", fullName: "January" },
  { shortName: "Feb", fullName: "February" },
  { shortName: "Mar", fullName: "March" },
  { shortName: "Apr", fullName: "April" },
  { shortName: "May", fullName: "May" },
  { shortName: "Jun", fullName: "June" },
  { shortName: "Jul", fullName: "July" },
  { shortName: "Aug", fullName: "August" },
  { shortName: "Sep", fullName: "September" },
  { shortName: "Oct", fullName: "October" },
  { shortName: "Nov", fullName: "November" },
  { shortName: "Dec", fullName: "December" },
] as const;

// ============================================================================
// Core Physics Functions
// ============================================================================

/**
 * Normalize daily solar radiation from provider units into kWh/m²/day.
 * Since 1 Peak Sun Hour = 1 kWh/m², the returned number equals daily Peak Sun Hours.
 */
export function normalizeIrradianceToKwhPerM2(
  value: number,
  unit: IrradianceUnit
): number {
  if (!Number.isFinite(value) || value <= 0) return 0;
  switch (unit) {
    case "MJ/m²":
      return value / 3.6;
    case "kWh/m²":
      return value;
    case "W/m²":
      return (value * 24) / 1000;
  }
}

/**
 * Calculate panel thermal efficiency factor from daily max ambient temperature (°C).
 * Estimates T_cell ≈ T_max_ambient + 20°C and applies -0.4% per °C above 25°C, gently capped.
 */
export function computeTemperatureFactor(maxAmbientTempC: number): number {
  if (!Number.isFinite(maxAmbientTempC)) return 1.0;
  const cellTempC = maxAmbientTempC + CELL_TEMP_RISE_C;
  if (cellTempC <= STC_CELL_TEMP_C) return 1.0;
  const derated = 1 - TEMP_DERATE_PER_C * (cellTempC - STC_CELL_TEMP_C);
  return Math.max(MIN_TEMP_FACTOR, Math.min(1.0, derated));
}

/**
 * Determine optimal compass facing based on hemisphere.
 */
export function getOptimalDirection(lat: number): "South" | "North" {
  return lat >= 0 ? "South" : "North";
}

/**
 * Human-friendly orientation label aware of Northern vs Southern Hemisphere.
 */
export function getOrientationLabel(
  orientation: RoofOrientation,
  lat: number
): string {
  switch (orientation) {
    case "optimal":
      return lat >= 0 ? "South Facing" : "North Facing";
    case "east-west":
      return "East / West";
    case "partial-shade":
      return "Partial Shade";
  }
}

/**
 * Calculate optimal fixed panel tilt angle from latitude (clamped to 10°–55°).
 */
export function computeOptimalTiltDeg(lat: number): number {
  const raw = Math.abs(lat) * 0.87;
  return Math.round(Math.min(Math.max(raw, 10), 55));
}

/**
 * Hemisphere-aware season mood for a calendar month (0 = Jan ... 11 = Dec).
 */
export function getSeasonMoodForMonth(
  monthIndex: number,
  lat: number
): SeasonMood {
  const northernSummer = monthIndex === 5 || monthIndex === 6 || monthIndex === 7;
  const northernWinter = monthIndex === 11 || monthIndex === 0 || monthIndex === 1;
  if (lat >= 0) {
    if (northernSummer) return "summer";
    if (northernWinter) return "winter";
    return "spring-autumn";
  }
  // Southern hemisphere: Dec/Jan/Feb is peak summer, Jun/Jul/Aug is winter
  if (northernWinter) return "summer";
  if (northernSummer) return "winter";
  return "spring-autumn";
}

/**
 * Approximate relative midday solar elevation (0.20–0.90) for the Sky Arc visual.
 */
export function getNormalizedSolarElevation(
  monthIndex: number,
  lat: number
): number {
  // Approximate solar declination for mid-month (degrees)
  const dayOfYear = monthIndex * 30.44 + 15;
  const declDeg = 23.44 * Math.sin(((2 * Math.PI) / 365) * (dayOfYear - 81));
  const noonAltDeg = Math.max(8, Math.min(90, 90 - Math.abs(lat - declDeg)));
  // Map 12°..85° smoothly into 0.22..0.90 for visual clarity
  const norm = (noonAltDeg - 12) / (85 - 12);
  return Math.max(0.22, Math.min(0.9, 0.22 + norm * 0.68));
}

/**
 * Calculate estimated daily AC energy yield in kWh for a single day.
 */
export function computeDailyOutputKwh(
  peakSunHours: number,
  maxAmbientTempC: number,
  config: SolarSystemConfig
): number {
  const tempFactor = computeTemperatureFactor(maxAmbientTempC);
  const orientationFactor = ORIENTATION_MULTIPLIERS[config.orientation];
  return (
    config.systemSizeKw *
    peakSunHours *
    PERFORMANCE_RATIO *
    tempFactor *
    orientationFactor
  );
}

/**
 * Translate a daily kWh yield (and annual total kWh) into relatable everyday solar living.
 */
export function computeRelatablePower(
  dailyKwh: number,
  annualKwhForCarbon: number
): RelatablePowerOutput {
  const safeDaily = Math.max(0, dailyKwh);
  const safeAnnual = Math.max(0, annualKwhForCarbon);

  const homeCorePercent = Math.round(
    (safeDaily / RELATABLE_CONSTANTS.homeEssentialsDailyKwh) * 100
  );
  const annualCo2AvoidedKg = Math.round(
    safeAnnual * RELATABLE_CONSTANTS.co2KgPerKwh
  );

  return {
    homeCorePercent,
    homeCoreBarPercent: Math.min(100, homeCorePercent),
    homeCoreFullyCovered: homeCorePercent >= 100,
    evKmPerDay: Math.round(safeDaily * RELATABLE_CONSTANTS.evKmPerKwh),
    evMilesPerDay: Math.round(safeDaily * RELATABLE_CONSTANTS.evMilesPerKwh),
    acHoursPerDay: Number(
      (safeDaily / RELATABLE_CONSTANTS.acKwhPerHour).toFixed(1)
    ),
    washCyclesPerWeek: Math.round(
      (safeDaily * 7) / RELATABLE_CONSTANTS.washCycleKwh
    ),
    annualCo2AvoidedKg,
    equivalentTrees: Math.max(
      1,
      Math.round(annualCo2AvoidedKg / RELATABLE_CONSTANTS.treeCo2KgPerYear)
    ),
  };
}

/**
 * Detect the longest consecutive stretch of heavy-cloud / dim days where
 * daily irradiance fell below 25% of the location's annual daily average.
 */
export function detectCloudyStreak(
  days: DailyWeatherRecord[]
): CloudyStreakInfo {
  if (days.length === 0) {
    return {
      longestStreakDays: 0,
      dimThresholdKwhM2: 0,
      startDate: null,
      endDate: null,
    };
  }

  const annualAvgGhi =
    days.reduce((sum, d) => sum + d.ghiKwhM2, 0) / days.length;
  const threshold = annualAvgGhi * 0.25;

  let bestLen = 0;
  let bestStart: string | null = null;
  let bestEnd: string | null = null;

  let curLen = 0;
  let curStart: string | null = null;

  for (const day of days) {
    if (day.ghiKwhM2 < threshold) {
      if (curLen === 0) curStart = day.date;
      curLen += 1;
      if (curLen > bestLen) {
        bestLen = curLen;
        bestStart = curStart;
        bestEnd = day.date;
      }
    } else {
      curLen = 0;
      curStart = null;
    }
  }

  return {
    longestStreakDays: bestLen,
    dimThresholdKwhM2: Number(threshold.toFixed(2)),
    startDate: bestStart,
    endDate: bestEnd,
  };
}

/**
 * Warm, encouraging, and scientifically honest rating of annual solar irradiance.
 */
export function classifySolarPotential(
  annualAvgPeakSunHours: number,
  lat: number
): SolarPotentialRating {
  if (annualAvgPeakSunHours >= 4.8) {
    return {
      label: "Abundant Sunshine",
      tier: "abundant",
      tagline: "Generous clear skies make your roof a quiet powerhouse year-round.",
    };
  }
  if (annualAvgPeakSunHours >= 4.0) {
    return {
      label: "Bright & Productive",
      tier: "bright",
      tagline: "Strong seasonal light gives you dependable clean energy through most of the year.",
    };
  }
  if (annualAvgPeakSunHours >= 3.2) {
    return {
      label: "Steady Solar Potential",
      tier: "steady",
      tagline: "Balanced sunshine with bright warm months and gentle seasonal transitions.",
    };
  }
  return {
    label: lat >= 0 ? "Gentle Northern Light" : "Gentle Southern Light",
    tier: "gentle",
    tagline: "Long, crisp summer days shine brightly while cool air keeps panels extra efficient.",
  };
}

/**
 * Run the complete solar physics audit over a 12-month daily weather series.
 */
export function runSolarAudit(
  days: DailyWeatherRecord[],
  lat: number,
  config: SolarSystemConfig = DEFAULT_SYSTEM_CONFIG
): SolarAuditResult {
  const optimalTiltDeg = computeOptimalTiltDeg(lat);
  const optimalDirection = getOptimalDirection(lat);

  // Bucket daily records by calendar month (0–11)
  const buckets: DailyWeatherRecord[][] = Array.from({ length: 12 }, () => []);
  for (const day of days) {
    const monthPart = Number.parseInt(day.date.slice(5, 7), 10);
    if (monthPart >= 1 && monthPart <= 12) {
      buckets[monthPart - 1].push(day);
    }
  }

  const monthly: MonthlySolarSummary[] = buckets.map((monthDays, idx) => {
    const count = monthDays.length || 1;
    const sumGhi = monthDays.reduce((s, d) => s + d.ghiKwhM2, 0);
    const sumCloud = monthDays.reduce((s, d) => s + d.cloudCoverPct, 0);
    const sumSun = monthDays.reduce((s, d) => s + d.sunshineHours, 0);
    const sumTemp = monthDays.reduce((s, d) => s + d.maxTempC, 0);
    const sumTempFactor = monthDays.reduce(
      (s, d) => s + computeTemperatureFactor(d.maxTempC),
      0
    );
    const sumKwh = monthDays.reduce(
      (s, d) => s + computeDailyOutputKwh(d.ghiKwhM2, d.maxTempC, config),
      0
    );

    const avgDailyKwh = monthDays.length ? sumKwh / count : 0;

    return {
      monthIndex: idx,
      shortName: MONTH_META[idx].shortName,
      fullName: MONTH_META[idx].fullName,
      dayCount: monthDays.length,
      avgPeakSunHours: Number((sumGhi / count).toFixed(2)),
      avgDailyKwh: Number(avgDailyKwh.toFixed(2)),
      totalMonthlyKwh: Math.round(sumKwh),
      avgCloudCoverPct: Math.round(sumCloud / count),
      avgSunshineHours: Number((sumSun / count).toFixed(1)),
      avgMaxTempC: Number((sumTemp / count).toFixed(1)),
      avgTempFactor: Number((sumTempFactor / count).toFixed(4)),
      seasonMood: getSeasonMoodForMonth(idx, lat),
      solarElevationNorm: getNormalizedSolarElevation(idx, lat),
    };
  });

  const totalDays = days.length || 1;
  const totalGhi = days.reduce((s, d) => s + d.ghiKwhM2, 0);
  const totalCloud = days.reduce((s, d) => s + d.cloudCoverPct, 0);
  const totalTemp = days.reduce((s, d) => s + d.maxTempC, 0);
  const totalKwhRaw = days.reduce(
    (s, d) => s + computeDailyOutputKwh(d.ghiKwhM2, d.maxTempC, config),
    0
  );

  // Normalize annual total to 365 days in case leap year / slight window variation
  const annualAvgDailyKwh = Number((totalKwhRaw / totalDays).toFixed(1));
  const annualTotalKwh = Math.round((totalKwhRaw / totalDays) * 365);
  const annualAvgPeakSunHours = Number((totalGhi / totalDays).toFixed(1));

  // Identify sunniest & quietest months
  const nonEmptyMonths = monthly.filter((m) => m.dayCount > 0);
  const sortedByOutput = [...(nonEmptyMonths.length ? nonEmptyMonths : monthly)].sort(
    (a, b) => b.avgDailyKwh - a.avgDailyKwh
  );
  const sunniestMonth = sortedByOutput[0];
  const quietestMonth = sortedByOutput[sortedByOutput.length - 1];
  const summerWinterRatio = Number(
    (
      sunniestMonth.avgDailyKwh / Math.max(0.1, quietestMonth.avgDailyKwh)
    ).toFixed(1)
  );

  // Warmest 3 months for summer heat derating note
  const summerMonths = [...monthly]
    .sort((a, b) => b.avgMaxTempC - a.avgMaxTempC)
    .slice(0, 3);
  const summerAvgMaxTempC = Number(
    (
      summerMonths.reduce((s, m) => s + m.avgMaxTempC, 0) /
      Math.max(1, summerMonths.length)
    ).toFixed(1)
  );
  const summerAvgTempFactor =
    summerMonths.reduce((s, m) => s + m.avgTempFactor, 0) /
    Math.max(1, summerMonths.length);
  const summerHeatAdjustmentPct = Number(
    ((summerAvgTempFactor - 1) * 100).toFixed(1)
  );

  const cloudyStreak = detectCloudyStreak(days);
  const potential = classifySolarPotential(annualAvgPeakSunHours, lat);
  const yearlyRelatable = computeRelatablePower(
    annualAvgDailyKwh,
    annualTotalKwh
  );

  return {
    optimalTiltDeg,
    optimalDirection,
    potential,
    annualAvgPeakSunHours,
    annualAvgDailyKwh,
    annualTotalKwh,
    annualAvgCloudCoverPct: Math.round(totalCloud / totalDays),
    annualAvgMaxTempC: Number((totalTemp / totalDays).toFixed(1)),
    summerAvgMaxTempC,
    summerHeatAdjustmentPct,
    monthly,
    sunniestMonth,
    quietestMonth,
    summerWinterRatio,
    cloudyStreak,
    yearlyRelatable,
  };
}
