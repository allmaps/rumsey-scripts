# Scripts

This folder contains scripts used to process the data and add reviewed annotations to the Allmaps database (if they haven't already been georeferenced).

_NB: Run these scripts from the root of the repository in order to correctly resolve the files._

- `check-maps.ts` fetches all annotations from Allmaps and checks those against the dataset.
- `filter-maps.ts` filters out reviewed maps.
- `ingest-maps.ts` ingests maps using the Allmaps API (requires the `ALLMAPS_API_KEY` environment variable.)
- `group-maps.ts` fetches additional metadata from the IIIF Manifests (using cache if available) and groups ingested maps by publication.

The results can be viewed in [this notebook](https://observablehq.com/@allmaps/rumsey), which uses the output of the final script to populate the table.
