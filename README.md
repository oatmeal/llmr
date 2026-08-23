# りり村のWeb地図

Map viewer for the Minecraft server りりまる村. View at https://oatmeal.github.io/llmr

The map application and build tooling live in [oatmeal/my-chizu](https://github.com/oatmeal/my-chizu). This repo contains only the map data: tiles, layers, dates, and VODs.

## Updating content

**Adding a new map snapshot date:**
1. Add tile images under `tiles/[dim]/[zoom]/[x]/[z]/[date].png`
2. Add the date entry to `data/dates.json` (`"YYYYMMDD": "display label"`)
3. Push to `main` — GitHub Actions builds and deploys automatically

**Adding a VOD:**
VODs are YouTube videos, tracked in `data/vods.json`:
```json
{ "id": "youtube_video_id", "date": "YYYYMMDD", "title": "stream title" }
```

To link part way into a long stream, add a `t` field with the offset in seconds
(`"t": 24043`). It has to be its own field — a `?t=` suffix on `id` breaks the
link and makes the next sync add the video again as a duplicate.

Rather than adding entries by hand, sync them from the channel's Minecraft
playlist (configured in `site.json` under `vods`), using a local clone of
[oatmeal/my-chizu](https://github.com/oatmeal/my-chizu) and
[yt-dlp](https://github.com/yt-dlp/yt-dlp):

```bash
cd my-chizu
node scripts/sync-vods.mjs /path/to/llmr            # dry run — review the report
node scripts/sync-vods.mjs /path/to/llmr --write    # apply
```

New videos are appended with the date read from the `YYYY年M月D日` in the title
and the title stripped of its genre tags. Entries already in the file are left
alone, so hand-fixed titles and dates survive re-runs.

A stream filed under a different playlist (the 2024-03-10 birthday stream, for
instance, which is a 雑談 episode) needs its video id added to
`vods.extraVideos` in `site.json` — otherwise the sync won't see it, and will
report it as missing.

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

Icon SVG files in `static/icons/` are from https://uxwing.com and used under the terms specified at https://uxwing.com/license/. `static/youtube.svg` is a rendering of the YouTube play-button mark, used to link to YouTube content under the [YouTube brand guidelines](https://www.youtube.com/howyoutubeworks/resources/brand-resources/).
