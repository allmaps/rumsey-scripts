// Ingest maps in Allmaps API
import type { Map } from "@allmaps/annotation";
import { loadNdjson, createChunks, writeNdjson } from "../src/shared";
import cliProgress from "cli-progress";

// End process correctly
process.on("SIGINT", () => {
  console.log("Ctrl-C was pressed");
  process.exit();
});

const allmapsApikey = process.env.ALLMAPS_API_KEY;

if (!allmapsApikey) {
  throw new Error("No API key found");
}

const allmapsApi = `https://api.allmaps.org/maps?key=${allmapsApikey}`;
const chunkSize = 10;

const maps = await loadNdjson("../_output/maps-not-in-allmaps-reviewed.ndjson");

const mapsInChunks = createChunks(maps, chunkSize);

function ingestMaps(endpoint: string, maps: Map[]) {
  return fetch(endpoint, {
    method: "POST",
    headers: new Headers({
      "Content-Type": "application/json",
    }),
    body: JSON.stringify(maps),
  }).then((resp) => resp.json());
}

const bar = new cliProgress.SingleBar({}, cliProgress.Presets.shades_classic);
bar.start(mapsInChunks.length, 0);

const ids = new Array();

for (let i = 0; i < mapsInChunks.length; i++) {
  const chunk = mapsInChunks[i];
  const resp = await ingestMaps(allmapsApi, chunk);
  bar.update(i + 1);
  ids.push(...resp);
}
bar.stop();

writeNdjson(ids, "../_output/maps-with-allmaps-ids.ndjson");
