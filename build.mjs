// Orchestrates the full build: engine assets first, then data processing.
// build-assets.mjs creates the deploy/ skeleton (static files, Leaflet deps, map.js).
// build-data.mjs populates deploy/data/ from the data/ and tiles/ directories.
import { exec } from "child_process";
import { promisify } from "util";

const exec_promise = promisify(exec);

async function run(script) {
  const { stdout, stderr } = await exec_promise(`node ${script}`);
  if (stdout) process.stdout.write(stdout);
  if (stderr) process.stderr.write(stderr);
}

await run("build-assets.mjs");
await run("build-data.mjs");
