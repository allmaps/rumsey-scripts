import { cacheDir } from "..";

async function getCache(id: string, type: string) {
  const file = Bun.file(`${cacheDir + type}/${id}.json`);
  if (await file.exists()) {
    return file.json();
  } else return null;
}

function saveJson(json: any, filename: string, path: string) {
  return Bun.write(`${path}/${filename}.json`, JSON.stringify(json, null, 4));
}

export async function fetchImageInformationWithCache(
  id: string,
  url: string,
  useCache: boolean = true
) {
  if (useCache) {
    const cache = await getCache(id, "images");
    if (cache) return cache;
  }
  let resp = await fetch(url);
  if (!resp.ok) return null;
  const json = await resp.json();
  await saveJson(json, id, cacheDir + "images/");
  return json;
}
