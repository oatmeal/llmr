# CLAUDE.md

## Project Overview

Interactive web map viewer for the Minecraft multiplayer server "りりまる村" (LiliMaru Village). Displays tile-based maps of three dimensions (Overworld, Nether, End) with historical snapshots, layer overlays, and a timeline control.

Deployed at: https://oatmeal.github.io/llmr

## Tech Stack

- **Leaflet.js** (v1.9.2) — map rendering
- **Vanilla JavaScript** — no framework; single-file monolith at `lib/map.js`
- **Node.js 16+ / npm 7+** — build tooling only
- **Terser** — JS minification
- **Cloudflare Workers** — optional deployment with HTTP auth (`workers-site/`)
- **GitHub Pages** — primary static hosting

## Build & Run

```bash
npm install       # one-time setup
npm run build     # outputs to ./deploy/
```

Build script: `build.mjs`

To preview locally, serve `deploy/` with any HTTP server (CORS prevents `file://`):
```bash
python -m http.server --directory deploy
```

No automated test suite — manual browser testing only.

## Project Structure

```
lib/map.js             # All application logic (~53KB, single file)
static/                # Source assets (HTML, CSS, icons)
data/                  # Layer/timeline data JSON files
  dates.json           # Timeline: YYYYMMDD → display string
  vods.json            # Twitch VOD metadata
  overworld/           # Overworld layer markers/lines
  nether/              # Nether layer markers/lines
  end/                 # End layer markers/lines
tiles/                 # Tile images: tiles/[dim]/[zoom]/[x]/[z]/[date].png
deploy/                # Build output (gitignored? check before editing)
workers-site/          # Cloudflare Workers entry + auth
build.mjs              # Build orchestration script
wrangler.toml          # Cloudflare Workers config
notes.md               # Internal data structure documentation
```

## Key Concepts

**Dimensions:** `'o'` (overworld), `'n'` (nether), `'e'` (end)

**Tile path format:** `tiles/[dimension]/[zoom]/[x]/[z]/[date].png`

**Coordinate system:** Minecraft uses X/Z axes. Leaflet uses LatLng. Conversion handled by `mcProject()` / `mcUnproject()` in `map.js`.

**URL state:** Hash-based (`#d=o&dD={...}`) — permalink panel encodes current view.

**Layer JSON format:** `{ id, name, dimension, markers[], lines[] }` — see `notes.md` for full schema.

**Build output:** `build.mjs` scans the `tiles/` directory and emits `[dim].json` metadata files (bounds, available dates, layer info) into `deploy/data/`.

## Data & Content Updates

- **Adding new dates:** Update `data/dates.json` and add corresponding tile images under `tiles/`
- **Adding VODs:** Update `data/vods.json`
- **Adding/editing layers:** Edit or add JSON files in `data/overworld/`, `data/nether/`, or `data/end/`
- After any changes, run `npm run build` to regenerate `deploy/`

## Code Conventions

- ES6+ (async/await, arrow functions, destructuring)
- All UI text is in Japanese
- Leaflet API extensions used extensively (custom `L.Layer`, projections)
- Prefer editing `lib/map.js` directly; avoid splitting into multiple files
