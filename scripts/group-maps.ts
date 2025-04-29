// Fetch IIIF Manifests and group ingested annotations
import { loadNdjson, writeNdjson } from "../src/shared";
import { fetchJsonWithCache } from "../src/cache";

import type { Manifest } from "@iiif/presentation-2";
import type { Map } from "@allmaps/annotation";

// Get ingested maps
const ingestedMaps = (await loadNdjson(
  "../_output/maps-not-in-allmaps-reviewed.ndjson"
)) as Map[];
const allmapsIds = await loadNdjson("../_output/maps-with-allmaps-ids.ndjson");

const pubs = new Object();
for (const map of ingestedMaps) {
  // Fetch IIIF Manifest
  const manifest = (await fetchJsonWithCache(
    map.id,
    map.resource.id,
    "luna"
  )) as Manifest;

  // Get Metadata from Manifest
  const metadata = manifest.sequences[0].canvases[0].metadata;
  const title = metadata?.filter(({ label }) => label === "Pub Title")[0]
    ?.value;
  const number = metadata?.filter(({ label }) => label === "Pub List No")[0]
    ?.value;
  const type = metadata?.filter(({ label }) => label === "Pub Type")[0]?.value;
  const date = metadata?.filter(({ label }) => label === "Pub Date")[0]?.value;
  const imageId = map.resource.id;
  const annotation = allmapsIds.filter((i) => i.imageUri === imageId)[0]
    .mapIds[0];

  // Add to publication
  const pub = pubs[map._rumsey.pub];
  if (pub) {
    pub.annotations.push(annotation);
  } else {
    pubs[map._rumsey.pub] = {
      title,
      date,
      type,
      number,
      annotations: new Array(annotation),
    };
  }
}

// const sortedPubs = Object.entries(pubs)
//   .map(([id, value]) => ({
//     sort: pubs.annotations.length,
//     value,
//     id
//   }))
//   .sort((a, b) => b.sort - a.sort)
//   .map(({id, value}) => [id, value]);

writeNdjson(
  Object.values(pubs),
  "../_output/annotations-in-allmaps-grouped.ndjson"
);
