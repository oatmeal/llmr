# CLAUDE.md

## Project Overview

Data repository for the web map of the Minecraft multiplayer server "りりまる村" (LiliMaru Village). Contains tile images, layer data, timeline dates, and VOD metadata.

The map application and build tooling live in the engine repo: https://github.com/oatmeal/my-chizu

Deployed at: https://oatmeal.github.io/llmr

## Deployment

Pushing to `main` triggers `.github/workflows/deploy.yml`, which calls the reusable build-and-deploy workflow from `oatmeal/my-chizu`. No manual build step needed for CI.

## Local Build

With a local clone of the engine repo alongside this one:

```bash
node /path/to/my-chizu/build.mjs /path/to/llmr
```

Then serve `deploy/` with any HTTP server (CORS prevents `file://`):

```bash
python -m http.server --directory deploy
```

## Project Structure

```
data/                  # Layer/timeline data JSON files
  config.json          # Per-dimension spatial config (X0, Z0, defaults, tile paths)
  dates.json           # Timeline: YYYYMMDD → display string
  vods.json            # YouTube VOD metadata: [{id, date, title, t?}]
  overworld/           # Overworld layer markers/lines
  nether/              # Nether layer markers/lines
  end/                 # End layer markers/lines
tiles/                 # Tile images: tiles/[dim]/[zoom]/[x]/[z]/[date].png
static/                # Site-specific static assets (og.jpeg, etc.)
site.json              # Site identity: title, OG tags, about page content
deploy/                # Build output (gitignored)
notes.md               # Internal data structure documentation
```

## Key Concepts

**Dimensions:** `'o'` (overworld), `'n'` (nether), `'e'` (end)

**Tile path format:** `tiles/[dimension]/[zoom]/[x]/[z]/[date].png`

**Layer JSON format:** `{ id, name, dimension, markers[], lines[] }` — see `notes.md` for full schema.

**VOD links:** `data/vods.json` holds YouTube video ids. The Twitch VODs this archive originally pointed at have all been deleted; `site.json`'s `vods` block configures the playlists to sync from and the title-cleaning rules.

## Data & Content Updates

- **Adding new dates:** Update `data/dates.json` and add tile images under `tiles/`
- **Adding VODs:** Prefer `node scripts/sync-vods.mjs /path/to/llmr --write` from a my-chizu clone (needs yt-dlp), which pulls new videos from the playlists in `site.json` and cleans their titles. Hand-written entries use `{id, date, title}` with a YouTube video id, and are never overwritten by a later sync. To deep-link part way into a stream, add `t` (seconds) as its own field — never as a `?t=` suffix on `id`, which breaks the link and makes the next sync duplicate the entry. Streams outside the configured playlists must be pinned in `site.json` under `vods.extraVideos`.
- **Adding/editing layers:** Edit or add JSON files in `data/overworld/`, `data/nether/`, or `data/end/`
- **Updating site identity:** Edit `site.json`
- Push to `main` — GitHub Actions handles the build and deploy automatically
