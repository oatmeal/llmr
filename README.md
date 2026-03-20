# りり村のWeb地図

Map viewer for the Minecraft server りりまる村. View at https://oatmeal.github.io/llmr

The map application and build tooling live in [oatmeal/my-chizu](https://github.com/oatmeal/my-chizu). This repo contains only the map data: tiles, layers, dates, and VODs.

## Updating content

**Adding a new map snapshot date:**
1. Add tile images under `tiles/[dim]/[zoom]/[x]/[z]/[date].png`
2. Add the date entry to `data/dates.json` (`"YYYYMMDD": "display label"`)
3. Push to `main` — GitHub Actions builds and deploys automatically

**Adding a VOD:**
Add an entry to `data/vods.json` in pre-processed format:
```json
{ "id": "twitch_video_id", "date": "YYYYMMDD", "title": "stream title" }
```

**Adding or editing a layer (markers / lines):**
Edit or add a JSON file in `data/overworld/`, `data/nether/`, or `data/end/`. See [oatmeal/my-chizu notes.md](https://github.com/oatmeal/my-chizu/blob/main/notes.md) for the layer schema.

## Local build

With a local clone of [oatmeal/my-chizu](https://github.com/oatmeal/my-chizu):

```bash
cd my-chizu && npm install
node build.mjs /path/to/llmr
python -m http.server --directory /path/to/llmr/deploy
```

## License

The map application code is licensed under the BSD 2-Clause License — see [oatmeal/my-chizu LICENSE](https://github.com/oatmeal/my-chizu/blob/main/LICENSE).

Tile images and JSON data files in this repository may not be used in other projects without explicit written permission.

Icon SVG files in `static/icons/` are from https://uxwing.com and used under the terms specified at https://uxwing.com/license/. `static/TwitchGlitchPurple.svg` is from the [Twitch brand assets](https://brand.twitch.tv/) and used under the terms specified at https://www.twitch.tv/p/en/legal/trademark/.
