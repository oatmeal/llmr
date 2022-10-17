import { promisify } from "util";
import { exec } from "child_process";
import fsPromises from "fs/promises";
import { minify } from "terser";
import fg from "fast-glob";
import stringify from "fast-json-stable-stringify";

const exec_promise = promisify(exec);

function mod(a, b) {
  return ((a % b) + b) % b;
}

const deployDir = "deploy";
await fsPromises.rm(deployDir, {
  maxRetries: 5,
  retryDelay: 2000,
  recursive: true,
  force: true,
});

await fsPromises.cp("static", deployDir, { recursive: true });
fsPromises.cp("tiles", deployDir + "/tiles", { recursive: true });

fsPromises.cp(
  "node_modules/leaflet/dist/leaflet.js",
  deployDir + "/leaflet.js"
);
fsPromises.cp(
  "node_modules/leaflet/dist/leaflet.css",
  deployDir + "/leaflet.css"
);
fsPromises.cp("node_modules/leaflet/dist/images/", deployDir + "/images", {
  recursive: true,
});

fsPromises.cp(
  "node_modules/leaflet.tilelayer.fallback/dist/leaflet.tilelayer.fallback.js",
  deployDir + "/leaflet.tilelayer.fallback.js"
);

fsPromises.cp(
  "node_modules/leaflet-sidebar-v2/css/leaflet-sidebar.min.css",
  deployDir + "/leaflet-sidebar.min.css"
);
fsPromises.cp(
  "node_modules/leaflet-sidebar-v2/js/leaflet-sidebar.min.js",
  deployDir + "/leaflet-sidebar.min.js"
);

async function minifyMapJs() {
  const mapJs = await fsPromises.readFile("lib/map.js", "utf-8");
  const minified = (await minify(mapJs)).code;
  // get last commit time
  const gitlog = (await exec_promise("git log -1 --format=%cd")).stdout;
  const time = new Date(gitlog).toLocaleString("ja-JP", {
    timeZone: "Asia/Tokyo",
  });
  fsPromises.writeFile(
    deployDir + "/map.js",
    minified.replace("***UPDATED***", time)
  );
}

minifyMapJs();

async function minifyDatesJson() {
  const datesJson = JSON.parse(
    await fsPromises.readFile("data/dates.json", "utf-8")
  );
  fsPromises.writeFile(deployDir + "/data/dates.json", stringify(datesJson));
}

minifyDatesJson();

async function minifyVodsJson() {
  const vodsJson = JSON.parse(
    await fsPromises.readFile("data/vods.json", "utf-8")
  ).map(({ id, title }) => {
    const year = title.match(/(\d+)年\d+月\d+日/)[1];
    const month = title.match(/\d+年(\d+)月\d+日/)[1].padStart(2, "0");
    const day = title.match(/\d+年\d+月(\d+)日/)[1].padStart(2, "0");
    return {
      id,
      date: `${year}${month}${day}`,
      title: title
        .replace(/[【\[][〆🏡🏠の]*Minecraft[】\]]/g, "")
        .replace(/[：；:]?(\d+年\d+月\d+日)/, ""),
    };
  });
  fsPromises.writeFile(deployDir + "/data/vods.json", stringify(vodsJson));
}

minifyVodsJson();

const layerIds = {};

for (const dimension of ["overworld", "nether", "end"]) {
  // Minecraft coords of upper right-hand corner of the zoom level 4 tile designated as [0, 0]
  let X0 = 0;
  let Z0 = 0;
  let defaultX, defaultZ, defaultZoom, tilePath, errorTileUrl, tileSize;
  if (dimension === "overworld") {
    X0 = 6080;
    Z0 = -64;
    defaultX = 6620;
    defaultZ = 605;
    defaultZoom = 4;
    tilePath = "tiles/overworld";
    errorTileUrl = "tiles/overworld.png";
    tileSize = 256;
  } else if (dimension === "nether") {
    X0 = 6080;
    Z0 = -64;
    defaultX = 6588; // 831
    defaultZ = 544; //70
    defaultZoom = 1;
    // nether shows (transparent) overworld tiles at a lower zoom
    tilePath = "tiles/overworld";
    errorTileUrl = "tiles/nether.png";
    tileSize = 256;
  } else if (dimension === "end") {
    X0 = -64;
    Z0 = -64;
    defaultX = 0;
    defaultZ = 0;
    defaultZoom = 4;
    tilePath = "tiles/end";
    errorTileUrl = "tiles/end.png";
    tileSize = 256;
  }

  await fsPromises.mkdir(deployDir + "/data/" + dimension, { recursive: true });

  const timeFileDict = {};
  const dates = new Set();
  let minZoom = 99;
  let maxZoom = -99;
  let minX = 1e8;
  let maxX = -1e8;
  let minZ = 1e8;
  let maxZ = -1e8;
  const fileCoordsDict = new Set();
  const dimTilePath = dimension === "end" ? "end" : "overworld";
  for (const fn of await fg("tiles/" + dimTilePath + "/**/*.png")) {
    const fp = fn.split("/");
    // console.log(fp);
    if (fp.length === 6) {
      if (dimension !== "nether") {
        // console.log(fp);
        // dimension should equal fp[1]
        const key = fp.slice(2, 5).join("/");
        // console.log(key);
        const date = fp[5].slice(0, -4);
        // console.log(date);
        fileCoordsDict.add(key);
        if (timeFileDict[key] === undefined) timeFileDict[key] = [];
        timeFileDict[key].push(date);
        dates.add(date);
      }

      const zoom = Number.parseInt(fp[2]);
      const x = Number.parseInt(fp[3]);
      const z = Number.parseInt(fp[4]);

      // compute bounds & update min / max zoom
      if (zoom < minZoom) minZoom = zoom;
      if (zoom > maxZoom) maxZoom = zoom;

      const width = Math.pow(2, 11 - zoom);
      let minXTile = width * x + X0;
      let minZTile = width * z + Z0;
      let maxXTile = minXTile + width - 1;
      let maxZTile = minZTile + width - 1;

      if (minXTile < minX) minX = minXTile;
      if (maxXTile > maxX) maxX = maxXTile;
      if (minZTile < minZ) minZ = minZTile;
      if (maxZTile > maxZ) maxZ = maxZTile;
    }
  }

  const layers = [];
  for (const fn of await fg("data/" + dimension + "/*.json")) {
    const fnName = fn.split("/").slice(-1)[0];
    const infile = await fsPromises.readFile(fn, "utf-8");
    const over = JSON.parse(infile);
    if (over.id === undefined) {
      throw new Error(fn + " is missing `id`");
    }
    if (layerIds[over.id]) {
      throw new Error(
        fn + " and " + layerIds[over.id] + " have duplicate `id`s"
      );
    }
    layerIds[over.id] = fn;
    layers.push({
      id: over.id,
      name: over.name,
      url: "data/" + dimension + "/" + fnName,
    });

    if (over.markers) {
      for (const d of over.markers) {
        let XMarker = d.pos[0];
        let ZMarker = d.pos[2];
        if (dimension === "nether") {
          XMarker *= 8;
          ZMarker *= 8;
        }
        if (XMarker < minX) minX = XMarker;
        if (XMarker > maxX) maxX = XMarker;
        if (ZMarker < minZ) minZ = ZMarker;
        if (ZMarker > maxZ) maxZ = ZMarker;
      }
    }

    // process polylines
    if (over.lines) {
      for (const line of over.lines) {
        for (const d of line.pts) {
          let XMarker = d[0];
          let ZMarker = d[2];
          if (dimension === "nether") {
            XMarker *= 8;
            ZMarker *= 8;
          }
          if (XMarker < minX) minX = XMarker;
          if (XMarker > maxX) maxX = XMarker;
          if (ZMarker < minZ) minZ = ZMarker;
          if (ZMarker > maxZ) maxZ = ZMarker;
        }
      }
    }

    // write minified JSON
    const outFn = deployDir + "/data/" + dimension + "/" + fnName;
    fsPromises.writeFile(outFn, stringify(over));
  }

  // map.js and the code below assumes this is sorted!
  for (const a of Object.values(timeFileDict)) {
    a.sort();
  }

  // console.log(dates);
  // loop over all dates for this dimension
  for (const date of dates) {
    // loop over all 3 modes (exact, all before with fill, all before without fill)
    for (const mode of ["e", "f", "b"]) {
      const tileReplacementsDict = {};
      const skippedTiles = {};
      // loop over all tiles
      for (const key of fileCoordsDict) {
        const keyDates = timeFileDict[key];
        // console.log(date, mode, key, keyDates);
        // skip tile if it doesn't appear with the given mode / date
        if (mode === "e" && !keyDates.includes(date)) continue;
        // keyDates is sorted, so keyDates[0] should be the min
        if (mode === "b" && date < keyDates[0]) continue;
        // calculate date to use
        // relevant snippet of `lib/map.js`:
        // const date = timeline.exact
        // ? timeline.date
        // : timeline.fill
        // ? tileDates.find(
        //     (_e, i, t) => i === t.length - 1 || t[i + 1] > timeline.date
        //   )
        // : tileDates.find(
        //     (e, i, t) =>
        //       e <= timeline.date &&
        //       (i === t.length - 1 || t[i + 1] > timeline.date)
        //   );
        const childDate =
          mode === "e"
            ? date
            : mode === "f"
            ? keyDates.find((_e, i, t) => i === t.length - 1 || t[i + 1] > date)
            : keyDates.find(
                (e, i, t) =>
                  e <= date && (i === t.length - 1 || t[i + 1] > date)
              );
        if (childDate === undefined) continue;
        const [z, tx, tz] = key.split("/").map((i) => Number.parseInt(i));
        let ptx = tx;
        let ptz = tz;
        let posX = 0;
        let posZ = 0;
        // check parent tiles up to minZoom
        const parents = [];
        let hasParent = false;
        for (let pz = z - 1; pz >= minZoom; pz--) {
          // calculate position of tile in the parent,
          // measured in units of tile width
          // (with (0,0) in the upper left, as usual)
          posX += mod(ptx, 2) * Math.pow(2, z - 1 - pz);
          posZ += mod(ptz, 2) * Math.pow(2, z - 1 - pz);
          ptx = Math.floor(ptx / 2);
          ptz = Math.floor(ptz / 2);
          parents.push([
            [pz, ptx, ptz],
            [posX, posZ],
          ]);
          // if this parent exists, don't create a replacement entry
          const currPKey = `${pz}/${ptx}/${ptz}`;
          if (
            mode === "e" &&
            timeFileDict[currPKey] &&
            timeFileDict[currPKey].includes(date)
          ) {
            // console.log('skipping',key,date,'due to',currPKey);
            break;
          }
          if (mode === "f" && timeFileDict[currPKey]) {
            hasParent = true;
            // if the child tile is newer than the date,
            // it should be skipped if it has a parent which is older than the date
            if (
              skippedTiles[key] === undefined &&
              date < childDate &&
              date >= timeFileDict[currPKey][0]
            ) {
              skippedTiles[key] = currPKey;
              break;
            }
            continue;
          }
          if (
            mode === "b" &&
            timeFileDict[currPKey] &&
            date >= timeFileDict[currPKey][0]
          ) {
            break;
          }
          // if all parents are missing,
          // add the tile and position to each parent's entry

          if (pz === minZoom && !hasParent) {
            for (const [pCoords, [pos_x, pos_z]] of parents) {
              const pKey = `${pCoords[0]}/${pCoords[1]}/${pCoords[2]}`;
              if (tileReplacementsDict[pKey] === undefined)
                tileReplacementsDict[pKey] = [];
              tileReplacementsDict[pKey].push({
                key,
                scale: Math.pow(2, pCoords[0] - z),
                pos_x,
                pos_z,
                date: childDate,
              });
            }
          }
        }
      }
      // sort for deterministic output
      for (const a of Object.values(tileReplacementsDict)) {
        a.sort();
      }
      const outFn =
        deployDir + "/data/" + dimension + "/" + date + "-" + mode + ".json";
      fsPromises.writeFile(
        outFn,
        stringify({
          tileReplacements: tileReplacementsDict,
          skip: skippedTiles,
        })
      );
    }
  }

  const maxWidth = Math.pow(
    2,
    11 - minZoom + 4 + (dimension === "nether" ? 3 : 0)
  );
  const sortedDates = [...dates];
  sortedDates.sort();
  const sortedLayers = layers.slice();
  sortedLayers.sort((layer1, layer2) => layer1.id - layer2.id);
  const dimDict = {
    X0,
    Z0,
    defaultX,
    defaultZ,
    defaultZoom,
    minZoom: minZoom - 4,
    maxZoom: maxZoom + 2,
    minNativeZoom: minZoom,
    maxNativeZoom: maxZoom,
    minX: minX - 2 * maxWidth,
    maxX: maxX + maxWidth,
    minZ: minZ - maxWidth,
    maxZ: maxZ + maxWidth,
    dates: sortedDates,
    fileDates: timeFileDict,
    layers: sortedLayers,
    tilePath,
    errorTileUrl,
    tileSize,
    ratio: Math.floor(Math.pow(2, 11 - (minZoom - 4)) / tileSize),
  };
  const outFn = deployDir + "/data/" + dimension + ".json";
  fsPromises.writeFile(outFn, stringify(dimDict));
}
