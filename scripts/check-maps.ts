// Check if annotations already exists in Allmaps
import { generateAnnotation } from "@allmaps/annotation";
import { loadNdjson } from "../src/shared";

import type { Map } from "@allmaps/annotation";

const baseUri = "https://www.davidrumsey.com/luna/servlet/iiif/";
const mapsUrl = "https://files.allmaps.org/maps.json";
const collectionName = "David Rumsey Map Collection";

// Function to fetch latest Allmaps data
async function getAllmapsData() {
  const path = "_data/allmaps-maps.json";
  const file = Bun.file(path);
  if (await file.exists()) return file.json();
  const json = await fetch(mapsUrl).then((resp) => resp.json());
  Bun.write(path, JSON.stringify(json, null, 4));
  return json;
}

const allmapsAnnotations = await getAllmapsData();
const rumseyAnnotations = await loadNdjson("_output/maps.ndjson");

console.log(`The Allmaps API contains ${allmapsAnnotations.length} maps`);

const allmapsResourceIds = allmapsAnnotations.map(
  (map: Map) => map.resource.id
);
const rumseyResourceIds = rumseyAnnotations.map((map: Map) => map.resource.id);

const rumseyMapsInAllmaps = allmapsResourceIds.filter((id: string) =>
  id.includes(baseUri)
);

console.log(
  `${rumseyMapsInAllmaps.length} maps of the ${collectionName} have already been georeferenced using Allmaps`
);

const mapsAlreadyInAllmaps = rumseyMapsInAllmaps.filter((id: string) =>
  rumseyResourceIds.includes(id)
);

console.log(`${mapsAlreadyInAllmaps.length} maps are also in the dataset.`);

// console.table(mapsAlreadyInAllmaps);

const filteredRumseyAnnotations = rumseyAnnotations.filter((map: Map) => {
  return !rumseyMapsInAllmaps.includes(map.resource.id);
});

// Write output file with maps not in Allmaps
const rumseyOutputPath = "_output/maps-not-in-allmaps.ndjson";

const outputFile = Bun.file(rumseyOutputPath);
const writer = outputFile.writer();

for (const maps of filteredRumseyAnnotations) {
  writer.write(JSON.stringify(maps) + "\n");
  writer.flush();
}

writer.end();

console.table(
  `Written ${rumseyOutputPath} containing ${filteredRumseyAnnotations.length} of ${rumseyAnnotations.length} annotations`
);

// Rumsey maps georeferenced with Allmaps (but not in dataset)
const onlyInAllmaps = generateAnnotation(
  allmapsAnnotations.filter((map: Map) => {
    return (
      map.resource.id.includes(baseUri) &&
      !rumseyResourceIds.includes(map.resource.id)
    );
  })
);

// Rumsey maps already georeferenced with Allmaps (and also in dataset)
const alreadyInAllmaps = generateAnnotation(
  allmapsAnnotations.filter((map: Map) => {
    return (
      map.resource.id.includes(baseUri) &&
      rumseyResourceIds.includes(map.resource.id)
    );
  })
);

// Write  output files
const onlyInAllmapsPath = "_output/only-in-allmaps.json";
const alreadyInAllmapsPath = "_output/already-in-allmaps.json";

Bun.write(onlyInAllmapsPath, JSON.stringify(onlyInAllmaps, null, 4));
Bun.write(alreadyInAllmapsPath, JSON.stringify(alreadyInAllmaps, null, 4));

console.log(
  `Written ${onlyInAllmapsPath} containing ${onlyInAllmaps.items.length} annotations only in Allmaps`
);

console.log(
  `Written ${alreadyInAllmapsPath} containing ${alreadyInAllmaps.items.length} annotations already in Allmaps`
);
