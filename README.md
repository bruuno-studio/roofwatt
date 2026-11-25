# ROOFWATT

**Live:** [roofwatt.barisyilmazcontact.workers.dev](https://roofwatt.barisyilmazcontact.workers.dev)

**A serene, visual-first Solarpunk sunlight and solar roof companion.**

Enter any street address, neighborhood, or city to explore a full year of real local sunshine, adjust your solar array size and roof orientation, and see what everyday life your roof could power across all 12 months.

---

## Features

- **Visual Solarpunk Light UI:** Warm sunlit alabaster canvas, layered translucent meadow & solar-roof SVG art, seasonal sky gradients, and smooth Framer Motion transitions.
- **Live Address Autocomplete:** Fast global address and city suggestions as you type.
- **Interactive Sky Arc & Optimal Tilt:** Animated sun path showing seasonal solar elevation alongside a latitude-derived optimal panel angle diagram.
- **Tactile Roof Playground:** Instant client-side controls for Balcony (`0.8 kW`), Cozy Home (`4 kW`), and Family Roof (`8 kW`) presets, a continuous `0.5–15 kW` slider, and hemisphere-aware roof direction & shade options.
- **12-Month Sunlight Scrubber:** Hover or lock any month (`Jan`–`Dec`) to shift the ambient sky lighting, sun height, and energy estimates in real time.
- **Everyday Clean-Living Visuals:** Translates daily `kWh` into Home Core essentials, electric driving range, cooling hours, weekly household cycles, annual CO₂ offset, and equivalent mature trees.
- **Verified Data Provenance:** Inspect and independently verify the cryptographic signatures behind the underlying geocoding and solar irradiance responses right in the browser.

---

## Estimation Model

Estimates are computed deterministically from 12 months of local daily solar irradiance, cloud cover, sunshine duration, and peak ambient temperature:

- **Peak Sun Hours:** Derived from daily shortwave solar radiation (`kWh/m²/day`).
- **System Efficiency:** Accounts for standard system losses (`~14%`), roof orientation/shading multipliers, and warm-weather panel temperature derating above `25°C` cell temperature.
- **Optimal Fixed Tilt:** Automatically adapted to the location's latitude and hemisphere (South-facing in the Northern Hemisphere, North-facing in the Southern Hemisphere).

*Note: Estimates do not measure hyper-local obstructions such as nearby trees, chimneys, or neighboring buildings.*

---

## Tech Stack

- **Framework:** Next.js App Router on [vinext](https://vinext.dev) + TypeScript
- **Styling & Motion:** Tailwind CSS v4 + Framer Motion
- **Edge Runtime:** Cloudflare Workers
- **Data Layer:** [API3 AirnodeHub](https://airnodehub.api3.org) (Geoapify & Open-Meteo)

---

## Getting Started

### Prerequisites
- Node.js `>= 22.12.0` with Corepack (`corepack yarn`)

### Local Development
```bash
corepack yarn install
cp .env.example .env.local
corepack yarn dev
```

Update `.env.local` with your environment configuration (defaults to local preview mode when no live credentials are configured).

### Build & Deploy (Cloudflare Workers)
```bash
corepack yarn typecheck
corepack yarn build
corepack yarn deploy
```

Configure any required runtime secrets in Cloudflare Workers before deploying to production.

---

## Attribution

- Historical weather & solar irradiance via **Open-Meteo** over **API3 AirnodeHub**
- Geocoding & address suggestions **Powered by Geoapify** over **API3 AirnodeHub**
