"use client";

import { useEffect, useState } from "react";
import { useMotionValue, useReducedMotion, useSpring } from "framer-motion";

interface AnimatedNumberProps {
  value: number;
  decimals?: number;
  prefix?: string;
  suffix?: string;
  className?: string;
  formatLocale?: boolean;
}

function formatNumeric(
  n: number,
  decimals: number,
  formatLocale: boolean
): string {
  const safe = Number.isFinite(n) ? n : 0;
  if (formatLocale) {
    return safe.toLocaleString("en-US", {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });
  }
  return safe.toFixed(decimals);
}

/**
 * Smooth spring-interpolated tabular counter (stiffness: 180, damping: 24).
 * Respects prefers-reduced-motion automatically.
 */
export function AnimatedNumber({
  value,
  decimals = 0,
  prefix = "",
  suffix = "",
  className = "",
  formatLocale = true,
}: AnimatedNumberProps) {
  const prefersReducedMotion = useReducedMotion();
  const motionValue = useMotionValue(value);
  const springValue = useSpring(motionValue, {
    stiffness: 180,
    damping: 24,
    mass: 0.85,
  });

  const [display, setDisplay] = useState(() =>
    formatNumeric(value, decimals, formatLocale)
  );

  useEffect(() => {
    if (prefersReducedMotion) {
      motionValue.jump(value);
      setDisplay(formatNumeric(value, decimals, formatLocale));
      return;
    }
    motionValue.set(value);
  }, [value, decimals, formatLocale, motionValue, prefersReducedMotion]);

  useEffect(() => {
    if (prefersReducedMotion) return;
    const unsubscribe = springValue.on("change", (latest) => {
      setDisplay(formatNumeric(latest, decimals, formatLocale));
    });
    return unsubscribe;
  }, [springValue, decimals, formatLocale, prefersReducedMotion]);

  return (
    <span className={`tabular-nums ${className}`}>
      {prefix}
      {display}
      {suffix}
    </span>
  );
}
