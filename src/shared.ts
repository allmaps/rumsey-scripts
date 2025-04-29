import { generateAnnotation } from "@allmaps/annotation";
import type { Map, Annotation, AnnotationPage } from "@allmaps/annotation";

export function loadNdjson(path: string) {
  return Bun.file(path)
    .text()
    .then((text) =>
      text
        .split("\n")
        .filter((line) => line)
        .map((line) => JSON.parse(line))
    );
}

export function writeNdjson(
  maps: Map[] | Map[][],
  path: string,
  annotationPage: boolean = false
) {
  const file = Bun.file(path);
  const writer = file.writer();
  for (const map of maps) {
    const output = annotationPage ? generateAnnotation(map) : map;
    writer.write(JSON.stringify(output) + "\n");
    writer.flush();
  }
  writer.end();
  console.log(`Written ${path}`);
}

export function createChunks(array: any[], chunkSize: number) {
  let chunks = [];
  for (let i = 0; i < array.length; i += chunkSize) {
    const chunk = array.slice(i, i + chunkSize);
    chunks.push(chunk);
  }
  return chunks;
}
