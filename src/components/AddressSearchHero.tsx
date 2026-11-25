"use client";

import {
  useEffect,
  useRef,
  useState,
  type FormEvent,
  type KeyboardEvent,
} from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { AutocompleteSuggestion } from "@/lib/airnodehub";

interface AddressSearchHeroProps {
  onSelectQuery: (query: string) => void;
  isLoading?: boolean;
  activeQuery?: string;
}

const SPRING_TRANSITION = {
  type: "spring" as const,
  stiffness: 180,
  damping: 24,
};

const FEATURED_ROOFS = [
  {
    slug: "lisbon-portugal",
    city: "Lisbon",
    country: "Portugal",
    psh: "5.1h",
    sky: "sun" as const,
  },
  {
    slug: "eskisehir-turkey",
    city: "Eskişehir",
    country: "Turkey",
    psh: "4.6h",
    sky: "sun-crisp" as const,
  },
  {
    slug: "austin-tx",
    city: "Austin",
    country: "Texas",
    psh: "5.1h",
    sky: "sun-high" as const,
  },
  {
    slug: "amsterdam-nl",
    city: "Amsterdam",
    country: "Netherlands",
    psh: "3.0h",
    sky: "sun-cloud" as const,
  },
] as const;

/** Centerpiece Solarpunk Solar-Roof & Photovoltaic Panel Illustration */
function HeroSolarRoofArt() {
  return (
    <div className="relative mx-auto mb-5 w-full max-w-[340px] sm:max-w-[390px]">
      <svg
        aria-hidden="true"
        viewBox="0 0 380 156"
        className="h-auto w-full overflow-visible drop-shadow-[0_14px_28px_rgba(66,102,74,0.09)]"
        fill="none"
      >
        <defs>
          <radialGradient id="hero-sun-orb" cx="45%" cy="40%" r="60%">
            <stop offset="0%" stopColor="#FFF9E0" />
            <stop offset="55%" stopColor="#F7C65E" />
            <stop offset="100%" stopColor="#E9A033" />
          </radialGradient>

          <linearGradient id="hero-panel-surface" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#265A4A" />
            <stop offset="52%" stopColor="#32725C" />
            <stop offset="100%" stopColor="#1E4639" />
          </linearGradient>

          <linearGradient id="hero-panel-glint" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#FFF8DC" stopOpacity="0" />
            <stop offset="50%" stopColor="#FFF8DC" stopOpacity="0.45" />
            <stop offset="100%" stopColor="#FFF8DC" stopOpacity="0" />
          </linearGradient>

          <linearGradient
            id="hero-roof-beam"
            x1="290"
            y1="22"
            x2="195"
            y2="104"
            gradientUnits="userSpaceOnUse"
          >
            <stop offset="0%" stopColor="#F7C65E" stopOpacity="0.34" />
            <stop offset="100%" stopColor="#F7C65E" stopOpacity="0" />
          </linearGradient>

          <clipPath id="hero-panel-clip">
            <polygon points="188,46 296,95 258,118 150,69" />
          </clipPath>
        </defs>

        {/* Soft meadow ground arc */}
        <path
          d="M28 142 Q 190 124 352 142"
          stroke="#84BD8D"
          strokeOpacity="0.48"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
        <path
          d="M44 142 Q 190 128 336 142 Z"
          fill="#B7DDBB"
          fillOpacity="0.28"
        />

        {/* Delicate sky arc behind roof */}
        <path
          d="M52 118 Q 190 8 328 118"
          stroke="#E9A033"
          strokeOpacity="0.26"
          strokeWidth="1.5"
          strokeDasharray="4 6"
          strokeLinecap="round"
        />

        {/* Warm sunbeam cone falling onto solar array */}
        <polygon
          points="278,34 316,56 266,114 166,70"
          fill="url(#hero-roof-beam)"
        />

        {/* Radiant rising sun */}
        <circle cx="294" cy="36" r="24" fill="#F7C65E" fillOpacity="0.24" />
        <circle cx="294" cy="36" r="14.5" fill="url(#hero-sun-orb)" />
        <g
          stroke="#E9A033"
          strokeOpacity="0.65"
          strokeWidth="1.6"
          strokeLinecap="round"
        >
          <line x1="294" y1="14" x2="294" y2="18" />
          <line x1="316" y1="36" x2="312" y2="36" />
          <line x1="310" y1="20" x2="307" y2="23" />
          <line x1="278" y1="20" x2="281" y2="23" />
        </g>

        {/* Soft botanical tree on left */}
        <line
          x1="76"
          y1="138"
          x2="76"
          y2="112"
          stroke="#3D6B52"
          strokeWidth="2.4"
          strokeLinecap="round"
        />
        <circle cx="76" cy="99" r="18" fill="#84BD8D" fillOpacity="0.58" />
        <circle cx="64" cy="107" r="12" fill="#5F9E6E" fillOpacity="0.45" />
        <circle cx="88" cy="106" r="11" fill="#B7DDBB" fillOpacity="0.65" />

        {/* Architectural Solarpunk Home Body */}
        <path
          d="M104 94 V 138 H 274 V 94"
          fill="#FFFFFF"
          fillOpacity="0.92"
          stroke="#1D2F23"
          strokeOpacity="0.22"
          strokeWidth="1.6"
          strokeLinejoin="round"
        />
        <path
          d="M104 94 L 160 58 L 160 138 H 104 Z"
          fill="#FAFBF7"
          stroke="#1D2F23"
          strokeOpacity="0.16"
          strokeWidth="1.3"
        />
        <rect
          x="120"
          y="102"
          width="24"
          height="22"
          rx="4"
          fill="#FFF4D4"
          stroke="#3D8B5B"
          strokeOpacity="0.32"
          strokeWidth="1.3"
        />
        <line
          x1="132"
          y1="102"
          x2="132"
          y2="124"
          stroke="#3D8B5B"
          strokeOpacity="0.24"
          strokeWidth="1"
        />
        <rect
          x="184"
          y="108"
          width="32"
          height="30"
          rx="4"
          fill="#EEF6EA"
          stroke="#3D8B5B"
          strokeOpacity="0.3"
          strokeWidth="1.3"
        />
        <rect
          x="230"
          y="108"
          width="26"
          height="18"
          rx="4"
          fill="#FFF4D4"
          stroke="#3D8B5B"
          strokeOpacity="0.32"
          strokeWidth="1.3"
        />

        {/* Clean pitched roof eaves */}
        <path
          d="M92 98 L 164 46 L 304 100"
          stroke="#1D2F23"
          strokeWidth="3.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M164 46 L 298 98 L 274 108 L 154 60 Z"
          fill="#E9F2EB"
        />

        {/* Hero Gleaming Solar Panel Array Mounted Flush on the Roof */}
        <g>
          <polygon
            points="188,46 296,95 258,118 150,69"
            fill="url(#hero-panel-surface)"
            stroke="#FFFFFF"
            strokeWidth="2.2"
            strokeLinejoin="round"
          />

          <g stroke="#B7DDBB" strokeOpacity="0.48" strokeWidth="1">
            <line x1="169" y1="57.5" x2="277" y2="106.5" />
            <line x1="215" y1="58.2" x2="177" y2="81.2" />
            <line x1="242" y1="70.5" x2="204" y2="93.5" />
            <line x1="269" y1="82.8" x2="231" y2="105.8" />
          </g>

          <g clipPath="url(#hero-panel-clip)">
            <rect
              x="140"
              y="38"
              width="48"
              height="95"
              transform="skewX(-24)"
              fill="url(#hero-panel-glint)"
              className="roofwatt-panel-glint"
            />
          </g>
        </g>

        <circle cx="298" cy="130" r="11" fill="#5F9E6E" fillOpacity="0.48" />
        <circle cx="310" cy="133" r="8" fill="#84BD8D" fillOpacity="0.58" />
      </svg>
    </div>
  );
}

/** Miniature Solar Panel + Sky Icon for Each Featured City Card */
function CitySolarThumb({
  sky,
}: {
  sky: "sun" | "sun-crisp" | "sun-high" | "sun-cloud";
}) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 44 30"
      className="h-7 w-11 shrink-0"
      fill="none"
    >
      {sky === "sun-cloud" ? (
        <>
          <circle cx="29" cy="8.5" r="4.2" fill="#F2B441" fillOpacity="0.85" />
          <path
            d="M27 14.5H36.5A3 3 0 0 0 36.8 8.6A4.2 4.2 0 0 0 28.8 9.8A2.4 2.4 0 0 0 27 14.5Z"
            fill="#DAEAE8"
            stroke="#84BD8D"
            strokeWidth="0.9"
          />
        </>
      ) : (
        <>
          <circle cx="32" cy="8.5" r="4.8" fill="#F2B441" />
          <path
            d="M32 1.8V3M38.5 8.5H37.2M36.5 4L35.6 4.9"
            stroke="#E9A033"
            strokeWidth="1.2"
            strokeLinecap="round"
          />
        </>
      )}

      <polygon
        points="4,22 22,12 27,20 9,28"
        fill="#2B6652"
        stroke="#FFFFFF"
        strokeWidth="1"
        strokeLinejoin="round"
      />
      <line
        x1="13"
        y1="17"
        x2="18"
        y2="24"
        stroke="#B7DDBB"
        strokeOpacity="0.65"
        strokeWidth="0.8"
      />
      <line
        x1="7"
        y1="25"
        x2="24.5"
        y2="16"
        stroke="#B7DDBB"
        strokeOpacity="0.55"
        strokeWidth="0.8"
      />
      <line
        x1="16"
        y1="25"
        x2="16"
        y2="29"
        stroke="#526859"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

/**
 * Visual-first Solarpunk Landing Hero:
 *  - Bespoke Solar-Roof centerpiece illustration
 *  - Crisp headline + single-line subtitle
 *  - Frosted search pill with live free Geoapify Airnode autocomplete dropdown
 *  - 4 illustrated solar-city quick cards
 */
export function AddressSearchHero({
  onSelectQuery,
  isLoading = false,
  activeQuery = "",
}: AddressSearchHeroProps) {
  const [address, setAddress] = useState(activeQuery);
  const [suggestions, setSuggestions] = useState<AutocompleteSuggestion[]>([]);
  const [isSuggesting, setIsSuggesting] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);

  const containerRef = useRef<HTMLFormElement>(null);
  const skipNextFetchRef = useRef(false);

  // Debounced live address suggestions from free Geoapify Airnode autocomplete
  useEffect(() => {
    const trimmed = address.trim();
    if (skipNextFetchRef.current) {
      skipNextFetchRef.current = false;
      return;
    }

    if (trimmed.length < 2) {
      setSuggestions([]);
      setDropdownOpen(false);
      setIsSuggesting(false);
      setHighlightedIndex(-1);
      return;
    }

    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setIsSuggesting(true);
      try {
        const res = await fetch(
          `/api/autocomplete?q=${encodeURIComponent(trimmed)}`,
          { signal: controller.signal }
        );
        if (!res.ok) return;
        const data = (await res.json()) as {
          suggestions?: AutocompleteSuggestion[];
        };
        const items = data.suggestions ?? [];
        setSuggestions(items);
        setDropdownOpen(items.length > 0);
        setHighlightedIndex(-1);
      } catch {
        // Ignore aborted or transient autocomplete fetches
      } finally {
        if (!controller.signal.aborted) {
          setIsSuggesting(false);
        }
      }
    }, 240);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [address]);

  // Close suggestions dropdown on outside click
  useEffect(() => {
    function handleOutsideClick(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  function pickSuggestion(item: AutocompleteSuggestion) {
    skipNextFetchRef.current = true;
    setAddress(item.formatted);
    setSuggestions([]);
    setDropdownOpen(false);
    setHighlightedIndex(-1);
    onSelectQuery(item.formatted);
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (!dropdownOpen || suggestions.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev + 1) % suggestions.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightedIndex((prev) =>
        prev <= 0 ? suggestions.length - 1 : prev - 1
      );
    } else if (e.key === "Enter" && highlightedIndex >= 0) {
      e.preventDefault();
      pickSuggestion(suggestions[highlightedIndex]);
    } else if (e.key === "Escape") {
      setDropdownOpen(false);
      setHighlightedIndex(-1);
    }
  }

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const trimmed = address.trim();
    if (!trimmed || isLoading) return;
    setDropdownOpen(false);
    onSelectQuery(trimmed);
  }

  return (
    <section className="relative mx-auto flex w-full max-w-3xl flex-col items-center px-5 pt-6 pb-24 text-center sm:px-8 sm:pt-10 sm:pb-28">
      {/* Minimalist Wordmark with Solar Roof Icon */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...SPRING_TRANSITION, delay: 0.02 }}
        className="mb-4 flex items-center gap-2.5"
      >
        <span
          aria-hidden="true"
          className="flex h-9 w-9 items-center justify-center rounded-2xl border border-[#528A5F]/18 bg-white/85 shadow-[0_6px_18px_rgba(66,102,74,0.08)] backdrop-blur-md"
        >
          <svg
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <circle cx="16.5" cy="7.5" r="3.2" fill="#F2B441" />
            <polygon
              points="4,16 14,10 19,15 9,20"
              fill="#2B6652"
              stroke="#1D2F23"
              strokeWidth="1.2"
              strokeLinejoin="round"
            />
            <line
              x1="9"
              y1="13"
              x2="14"
              y2="17.5"
              stroke="#B7DDBB"
              strokeWidth="1"
            />
          </svg>
        </span>
        <span className="font-serif text-lg font-medium tracking-[0.16em] text-[#1D2F23]">
          ROOFWATT
        </span>
      </motion.div>

      {/* Centerpiece Solarpunk Solar Roof & Panel Illustration */}
      <motion.div
        initial={{ opacity: 0, y: 12, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ ...SPRING_TRANSITION, delay: 0.08 }}
        className="w-full"
      >
        <HeroSolarRoofArt />
      </motion.div>

      {/* Editorial Serif Headline */}
      <motion.h1
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...SPRING_TRANSITION, delay: 0.14 }}
        className="font-serif text-4xl leading-[1.1] font-normal tracking-[-0.02em] text-[#1D2F23] sm:text-5xl md:text-[3.35rem]"
      >
        See how much clean energy{" "}
        <span className="relative inline-block">
          <span className="relative z-10 italic text-[#2B5A3C]">
            lands on your roof.
          </span>
          <span
            aria-hidden="true"
            className="absolute right-0 bottom-1 left-0 -z-0 h-3 rounded-full bg-[#F7C65E]/35"
          />
        </span>
      </motion.h1>

      {/* Crisp Single-Line Subtitle */}
      <motion.p
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...SPRING_TRANSITION, delay: 0.2 }}
        className="mt-3.5 text-sm font-medium text-[#526859] sm:text-base"
      >
        Real local sunshine, mapped directly to solar panels.
      </motion.p>

      {/* Tactile Frosted-White Address Search Pill + Live Autocomplete Dropdown */}
      <motion.form
        ref={containerRef}
        onSubmit={handleSubmit}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...SPRING_TRANSITION, delay: 0.24 }}
        className="relative z-30 mt-7 w-full max-w-2xl"
      >
        <div className="group relative flex flex-col gap-2.5 rounded-[28px] border border-[#528A5F]/20 bg-white/88 p-2 shadow-[0_14px_40px_rgba(66,102,74,0.09)] backdrop-blur-xl transition-all duration-300 focus-within:border-[#E9A033]/60 focus-within:bg-white focus-within:shadow-[0_16px_44px_rgba(233,160,51,0.18)] sm:flex-row sm:items-center sm:rounded-full sm:p-2">
          <div className="flex flex-1 items-center gap-3 pl-4 pr-2">
            <svg
              aria-hidden="true"
              className="h-5 w-5 shrink-0 text-[#3D8B5B]/80 transition-colors group-focus-within:text-[#E9A033]"
              viewBox="0 0 24 24"
              fill="none"
            >
              <path
                d="M12 21C15.5 17.4 18.5 13.8 18.5 10.2C18.5 6.5 15.6 3.5 12 3.5C8.4 3.5 5.5 6.5 5.5 10.2C5.5 13.8 8.5 17.4 12 21Z"
                stroke="currentColor"
                strokeWidth="1.65"
                strokeLinejoin="round"
              />
              <circle
                cx="12"
                cy="10"
                r="2.4"
                stroke="currentColor"
                strokeWidth="1.65"
              />
            </svg>
            <label htmlFor="roofwatt-address-input" className="sr-only">
              Enter your street address, neighborhood, or city
            </label>
            <input
              id="roofwatt-address-input"
              type="text"
              role="combobox"
              aria-expanded={dropdownOpen}
              aria-controls="roofwatt-suggestions-listbox"
              aria-autocomplete="list"
              aria-activedescendant={
                highlightedIndex >= 0
                  ? `roofwatt-suggestion-${highlightedIndex}`
                  : undefined
              }
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              onFocus={() => {
                if (suggestions.length > 0) setDropdownOpen(true);
              }}
              onKeyDown={handleKeyDown}
              placeholder="Enter your address, neighborhood, or city..."
              autoComplete="off"
              className="h-11 w-full bg-transparent text-base text-[#1D2F23] placeholder:text-[#526859]/65 focus:outline-none sm:text-[15.5px]"
            />

            {/* Subtle inline spinner while fetching suggestions */}
            {isSuggesting && !isLoading && (
              <span
                aria-hidden="true"
                className="h-4 w-4 shrink-0 animate-spin rounded-full border-2 border-[#3D8B5B]/20 border-t-[#3D8B5B]"
              />
            )}
          </div>

          <motion.button
            type="submit"
            disabled={isLoading || !address.trim()}
            whileHover={{ scale: isLoading || !address.trim() ? 1 : 1.02 }}
            whileTap={{ scale: isLoading || !address.trim() ? 1 : 0.98 }}
            transition={SPRING_TRANSITION}
            className="inline-flex h-12 shrink-0 cursor-pointer items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#E9A033] to-[#F5BE52] px-6 text-sm font-semibold text-[#1D2F23] shadow-[0_8px_22px_rgba(233,160,51,0.34)] transition-all hover:shadow-[0_10px_28px_rgba(233,160,51,0.44)] disabled:cursor-not-allowed disabled:opacity-75 sm:px-7 sm:text-[15px]"
          >
            {isLoading ? (
              <>
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-[#1D2F23]/25 border-t-[#1D2F23]" />
                Reading Sky...
              </>
            ) : (
              <>
                Explore My Roof
                <svg
                  aria-hidden="true"
                  className="h-4 w-4"
                  viewBox="0 0 20 20"
                  fill="none"
                >
                  <path
                    d="M4.5 10H15.5M15.5 10L11 5.5M15.5 10L11 14.5"
                    stroke="currentColor"
                    strokeWidth="1.75"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </>
            )}
          </motion.button>
        </div>

        {/* Frosted Solarpunk Autocomplete Suggestions Dropdown */}
        <AnimatePresence>
          {dropdownOpen && suggestions.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 6, scale: 0.99 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 4, scale: 0.99 }}
              transition={{ duration: 0.16, ease: "easeOut" }}
              className="absolute right-0 left-0 z-50 mt-2 overflow-hidden rounded-[22px] border border-[#528A5F]/22 bg-white text-left shadow-[0_20px_52px_rgba(29,47,35,0.16)]"
            >
              <ul
                id="roofwatt-suggestions-listbox"
                role="listbox"
                className="max-h-72 divide-y divide-[#528A5F]/8 overflow-y-auto py-1"
              >
                {suggestions.map((item, idx) => {
                  const isHighlighted = idx === highlightedIndex;
                  return (
                    <li
                      key={item.id}
                      id={`roofwatt-suggestion-${idx}`}
                      role="option"
                      aria-selected={isHighlighted}
                    >
                      <button
                        type="button"
                        onMouseEnter={() => setHighlightedIndex(idx)}
                        onMouseDown={(e) => {
                          e.preventDefault();
                          pickSuggestion(item);
                        }}
                        className={`flex w-full cursor-pointer items-center justify-between gap-3 px-4 py-3 text-left transition-colors ${
                          isHighlighted
                            ? "bg-[#EEF6EA]/85"
                            : "hover:bg-[#FAFBF7]"
                        }`}
                      >
                        <div className="flex min-w-0 items-center gap-3">
                          <span
                            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl transition-colors ${
                              isHighlighted
                                ? "bg-white text-[#E9A033] shadow-xs"
                                : "bg-[#EEF6EA]/70 text-[#3D8B5B]"
                            }`}
                          >
                            <svg
                              aria-hidden="true"
                              className="h-4 w-4"
                              viewBox="0 0 20 20"
                              fill="none"
                            >
                              <path
                                d="M10 17.5C13 14.5 15.5 11.5 15.5 8.5C15.5 5.4 13.1 3 10 3C6.9 3 4.5 5.4 4.5 8.5C4.5 11.5 7 14.5 10 17.5Z"
                                stroke="currentColor"
                                strokeWidth="1.5"
                                strokeLinejoin="round"
                              />
                              <circle
                                cx="10"
                                cy="8.4"
                                r="1.9"
                                stroke="currentColor"
                                strokeWidth="1.5"
                              />
                            </svg>
                          </span>

                          <div className="min-w-0">
                            <div className="truncate text-sm font-semibold text-[#1D2F23]">
                              {item.primary}
                            </div>
                            {item.secondary && (
                              <div className="truncate text-xs text-[#526859]">
                                {item.secondary}
                              </div>
                            )}
                          </div>
                        </div>

                        <span className="hidden shrink-0 text-[11px] text-[#526859]/75 tabular-nums sm:inline">
                          {Math.abs(item.lat).toFixed(2)}°
                          {item.lat >= 0 ? "N" : "S"},{" "}
                          {Math.abs(item.lon).toFixed(2)}°
                          {item.lon >= 0 ? "E" : "W"}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>

              <div className="flex items-center justify-between border-t border-[#528A5F]/10 bg-[#FAFBF7]/90 px-4 py-1.5 text-[10px] text-[#526859]/80">
                <span>↑↓ navigate · Enter to explore</span>
                <span>Powered by Geoapify</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.form>

      {/* 4 Illustrated Visual Solar-City Cards */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...SPRING_TRANSITION, delay: 0.3 }}
        className="mt-6 grid w-full max-w-2xl grid-cols-2 gap-2.5 sm:grid-cols-4"
      >
        {FEATURED_ROOFS.map((roof, idx) => (
          <motion.button
            key={roof.slug}
            type="button"
            disabled={isLoading}
            onClick={() => {
              skipNextFetchRef.current = true;
              setAddress(`${roof.city}, ${roof.country}`);
              setDropdownOpen(false);
              onSelectQuery(roof.slug);
            }}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...SPRING_TRANSITION, delay: 0.32 + idx * 0.04 }}
            whileHover={{ y: -3 }}
            whileTap={{ scale: 0.98 }}
            className="group flex cursor-pointer items-center gap-2.5 rounded-2xl border border-[#528A5F]/18 bg-white/78 px-3 py-2.5 text-left shadow-[0_6px_20px_rgba(66,102,74,0.06)] backdrop-blur-md transition-all hover:border-[#E9A033]/45 hover:bg-white/95 hover:shadow-[0_10px_26px_rgba(233,160,51,0.14)] disabled:opacity-50"
          >
            <CitySolarThumb sky={roof.sky} />
            <div className="min-w-0">
              <div className="truncate text-xs font-semibold text-[#1D2F23]">
                {roof.city}
              </div>
              <div className="flex items-center gap-1 text-[11px] font-medium text-[#3D8B5B] tabular-nums">
                <span>{roof.psh}</span>
                <span className="text-[#526859]/75">sun</span>
              </div>
            </div>
          </motion.button>
        ))}
      </motion.div>
    </section>
  );
}
