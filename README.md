# Scripts to convert David Rumsey Map Collection metadata to Georeference Annotations

First make sure that [Bun](https://bun.sh/docs/installation) is installed on your system. Then install dependencies by running this command in the root of the repo:

```bash
bun install
```

Before running the script you need to download the file `luna_omo_metadata_56628_20220724.zip` from this dataset: [David Rumsey Map Collection: Georeferenced Maps Metadata](https://doi.org/10.25740/ss311gz1992).

Unzip the file and place `luna_omo_metadata_56628_20220724.csv` in the `_data` directory (create this directory if it isn't there).

To run the script:

```bash
bun convert
```

The script will output a single `ndjson` file in the `_output` directory.

## Options

You can use the `--format` flag to change the format of each line in this file:

```bash
bun convert --format annotations ## georeference annotations (default)
bun convert --format maps ## internal map format used by Allmaps
bun convert --format minimal ## minimal map format
```

Use the `--test` flag to use the file `_data/test.csv` instead.

Add the `--dimensions` flag to fetch (and cache) the `info.json` response for all images. This is used to populate the `width` and `height` properties of the annotations (which are missing in the source data).

`--endpoint [klokan|luna]` defines the endpoint used to fetch the image information. Optional; defaults to `luna`.

## Grouping

Input from Katherine McDonough:

- Pub List no will be good for grouping maps that are within an atlas, series or similar.
- List no is the record id that is unique for single sheet maps, or has a decimal that will indicate the sheet/page within an atlas/series.
- “Type” and “pub type” are actually quite interesting and systematic across the data. These are the different types of publications, e.g. atlas, manuscript map, military atlas, land use, etc.
- I would recommend splitting by date - this is complicated of course because of the difference between data and pub_date, but it’s a starting point for having meaningful sets.

## Todo

- Combine maps into Annotation Pages based on identical metadata
- Offer an option to output separate json files
- ~~Add a script to scrape image width and height from public IIIF Image API endpoints~~
- Add a filter for reviewed maps
- Process some of the metadata in order to add e.g. labels to `partOf` objects.
- Publish annotations to Allmaps API

## Credits

Huge thanks to Katherine McDonough and the MapReader team for making this data publicly available and pointing us to the dataset!

---

_This project was created using `bun init` in bun v1.1.24. [Bun](https://bun.sh) is a fast all-in-one JavaScript runtime._
