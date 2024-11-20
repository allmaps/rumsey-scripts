import { csv2json } from "json-2-csv";
import cliProgress from "cli-progress";
import { createMap, createMinimalMap } from "./src/allmaps";
import { generateAnnotation } from "@allmaps/annotation";
import { parseArgs } from "util";
import { readdir, mkdir } from "node:fs/promises";

import type { rumseyData } from "./src/types";
import type { BunFile } from "bun";

const { values, positionals } = parseArgs({
  args: Bun.argv,
  options: {
    format: {
      type: "string",
    },
  },
  strict: true,
  allowPositionals: true,
});

const formats = ["maps", "annotations", "minimal"];
const format =
  values?.format && formats.includes(values.format)
    ? values.format
    : "annotations";

const inputPath = "_data/luna_omo_metadata_56628_20220724.csv";
const outputDirectory = "_output";
const outputPath = `${outputDirectory}/${format}.ndjson`;

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

// processFileLineByLine(inputFile, processLine);

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
      processLine(lines.shift());
    }
    // Update the remaining data with the last incomplete line
    remainingData = lines[0];
  }

  // Process the last line if not empty
  if (remainingData.length) {
    processLine(remainingData);
  }

  bar.stop();
  writer.end();
  console.log(`\nWritten ${outputPath}\n`);
}

let index = 0;
let headerFields: string[] = new Array();

function processLine(line: string) {
  if (index === 0) {
    headerFields = line.split(",").map((i) => i.trim());
  } else {
    const data = csv2json(line, { headerFields }) as rumseyData[];
    let output;
    if (format === "maps") {
      output = createMap(data[0]);
    } else if (format === "annotations") {
      output = generateAnnotation(createMap(data[0]));
    } else if (format === "minimal") {
      output = createMinimalMap(data[0]);
    }
    writer.write(JSON.stringify(output) + "\n");
    // Write buffer to disk
    writer.flush();
  }
  index++;
}
