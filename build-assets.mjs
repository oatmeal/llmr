import { promisify } from "util";
import { exec } from "child_process";
import fsPromises from "fs/promises";
import { minify } from "terser";

const exec_promise = promisify(exec);

const deployDir = "deploy";
await fsPromises.rm(deployDir, {
  maxRetries: 5,
  retryDelay: 2000,
  recursive: true,
  force: true,
});

await fsPromises.cp("static", deployDir, { recursive: true });
await fsPromises.mkdir(deployDir + "/data", { recursive: true });

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
