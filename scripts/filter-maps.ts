// Filter for reviewed maps
import { loadNdjson, writeNdjson } from "../src/shared";

const parsedMaps = await loadNdjson("../_output/maps-not-in-allmaps.ndjson");
const reviewedMaps = parsedMaps.filter((map) => map._rumsey.reviewed);
const totalImages = parsedMaps.length;
const totalReviewed = reviewedMaps.length;

writeNdjson(reviewedMaps, "../_output/maps-not-in-allmaps-reviewed.ndjson");

console.log(`${totalReviewed}/${totalImages} have been reviewed`);
