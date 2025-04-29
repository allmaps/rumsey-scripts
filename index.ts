import { csv2json } from "json-2-csv";
import cliProgress from "cli-progress";
import { createMap, createMinimalMap } from "./src/allmaps";
import { generateAnnotation } from "@allmaps/annotation";
import { parseArgs } from "util";
import { readdir, mkdir } from "node:fs/promises";
import { fetchJsonWithCache } from "./src/cache";

import type { rumseyData } from "./src/types";
import type { BunFile } from "bun";
import type { ImageService2 } from "@iiif/presentation-3";
import type { Manifest } from "@iiif/presentation-2";

// End process correctly
process.on("SIGINT", () => {
  console.log("Ctrl-C was pressed");
  process.exit();
});

const { values, positionals } = parseArgs({
  args: Bun.argv,
  options: {
    format: {
      type: "string",
    },
    dimensions: {
      type: "boolean",
    },
    endpoint: {
      type: "string",
    },
    test: {
      type: "boolean",
    },
  },
  strict: true,
  allowPositionals: true,
});

const formats = ["raw", "maps", "annotations", "minimal"];
const format =
  values?.format && formats.includes(values.format)
    ? values.format
    : "annotations";

const fetchImages = values.dimensions;
const endpoints = ["klokan", "luna"];
const endpoint =
  values?.endpoint && endpoints.includes(values.endpoint)
    ? values.endpoint
    : "luna";

const inputPath = values.test
  ? "_data/test.csv"
  : "_data/luna_omo_metadata_56628_20220724.csv";
const outputDirectory = "_output";
const outputPath = `${outputDirectory}/${format}.ndjson`;
export const cacheDir = ".cache/";

try {
  await readdir(outputDirectory);
} catch {
  console.log(`\nCreating directory ${outputDirectory}`);
  await mkdir(outputDirectory);
}

console.log(`\nOpening file ${inputPath}\n`);

const inputFile = Bun.file(inputPath);
const outputFile = Bun.file(outputPath);
const writer = outputFile.writer();
const log = new Array();
let index = 0;

processFileLineByLine(inputFile, processLine);

export async function processFileLineByLine(
  bunFile: BunFile,
  processLine: Function
) {
  // Based on: https://stackoverflow.com/questions/77172210/bun-process-file-line-by-line
  const bytes = bunFile.size;
  const bar = new cliProgress.SingleBar({}, cliProgress.Presets.shades_classic);
  bar.start(bytes, 0);

  const stream = await bunFile.stream();
  const decoder = new TextDecoder();

  let remainingData = "";
  let processedBytes = 0;

  for await (const chunk of stream) {
    processedBytes += chunk.length;
    bar.update(processedBytes);

    const str = decoder.decode(chunk);

    // Append the chunk to the remaining data
    remainingData += str;

    // Remove double newline characters in metadata to avoid parsing errors
    remainingData = remainingData.replaceAll("\n\n", "");

    // Split the remaining data by newline character
    let lines = remainingData.split(/\r?\n/);

    // Loop through each line, except the last one
    while (lines.length > 1) {
      // Remove the first line from the array and pass it to the callback
      await processLine(lines.shift());
    }
    // Update the remaining data with the last incomplete line
    remainingData = lines[0];
  }

  // Process the last line if not empty
  if (remainingData.length) {
    await processLine(remainingData);
  }

  bar.stop();
  writer.end();
  if (log.length) {
    console.log(`\nThe following ${log.length} images could not be fetched:`);
    console.log("\n" + log.join("\n"));
  }
  console.log(`\n${index} maps processed`);
  console.log(`\nWritten ${outputPath}\n`);
}

let headerFields: string[] = new Array();

async function processLine(line: string) {
  if (index === 0) {
    headerFields = line.split(",").map((i) => i.trim());
  } else {
    const [data] = csv2json(line, {
      headerFields,
    }) as rumseyData[];

    // Fetching image dimensions (optional)
    let dimensions = new Array(undefined);
    if (fetchImages) {
      if (endpoint === "klokan") {
        const { image_url: url, id } = data;
        const resp = (await fetchJsonWithCache(
          id,
          url,
          endpoint
        )) as ImageService2;
        if (!resp) {
          log.push(`Could not fetch ${id}, skipped annotation`);
          return;
        }
        dimensions = [resp.width, resp.height];
      } else if (endpoint === "luna") {
        const { iiifManifest: url, id } = data;
        const resp = (await fetchJsonWithCache(id, url, endpoint)) as Manifest;
        if (!resp || resp.error) {
          log.push(`Could not fetch ${id}, skipped annotation`);
          return;
        }
        dimensions = [
          resp?.sequences?.[0].canvases?.[0].width,
          resp?.sequences?.[0].canvases?.[0].height,
        ];
      }
    }

    let output;
    if (format === "raw") {
      // Failed attempt at parsing some columns with BAD JSON
      // const pattern = /([{\[])[\\]?['"](.*?)[\\]?['"]([:\]])/g;
      // data.fieldValues = JSON.parse(
      //   data.fieldValues.replaceAll(pattern, '$1 "$2" $3')
      // );
      // data.relatedFieldValues = JSON.parse(
      //   data.relatedFieldValues.replaceAll(pattern, '$1 "$2" $3')
      // );
      output = data;
    } else if (format === "maps") {
      output = createMap(data, dimensions);
    } else if (format === "annotations") {
      output = generateAnnotation(createMap(data, dimensions));
    } else if (format === "minimal") {
      output = createMinimalMap(data, dimensions);
    }
    writer.write(JSON.stringify(output) + "\n");
    // Write buffer to disk
    writer.flush();
  }
  index++;
}
