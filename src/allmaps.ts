import { generateAnnotation } from "@allmaps/annotation";

import type { Map } from "@allmaps/annotation";
import type { rumseyData } from "./types";

export const makeAnnotationPage = (mapArray: Map[], id: string) => {
  return {
    type: "AnnotationPage",
    id,
    "@context": "http://www.w3.org/ns/anno.jsonld",
    items: mapArray.map(generateAnnotation),
  };
};

export const createMinimalMap = (
  data: rumseyData,
  dimensions: (number | undefined)[]
) => {
  const [width, height] = dimensions;
  const id = data.iiifManifest
    .replace("https://www.davidrumsey.com/luna/servlet/iiif/m/", "")
    .replace("/manifest", "");
  const gcps = JSON.parse(data.gcps.replaceAll("'", '"')).map((i) => [
    i.pixel,
    i.location,
  ]);
  const m = data.cutline;
  const t = data.transformation_method;
  if (width && height) {
    return { id, gcps, m, t, d: dimensions };
  } else {
    return { id, gcps, m, t };
  }
};

export const createMap = (
  data: rumseyData,
  dimensions: (number | undefined)[]
) => {
  // const resourceId = data.image_url.replace("/info.json", "");
  const [width = 1000, height = 1000] = dimensions;
  const resourceId = data.iiifManifest
    .replace("/manifest", "")
    .replace("iiif/m/", "iiif/");
  const gcps = JSON.parse(data.gcps.replaceAll("'", '"'));
  const resourceMask = data.cutline;
  const transformation =
    data.transformation_method === "tps" ? "thinPlateSpline" : "polynomial";
  const map = {
    ["@context"]: "https://schemas.allmaps.org/map/2/context.json",
    id: data.id,
    type: "GeoreferencedMap",
    resource: {
      id: resourceId,
      width,
      height,
      type: "ImageService2",
      partOf: [
        {
          id: data.iiifManifest,
          type: "Manifest",
          label: {
            en: [data.description],
          },
        },
      ],
    },
    gcps: gcps.map((i) => ({
      resource: i.pixel,
      geo: i.location,
    })),
    resourceMask,
    transformation: {
      type: transformation,
    },
    // Some extra props used for sorting and grouping
    _rumsey: {
      pub: Math.trunc(data.list_no),
      year: data.date,
      reviewed: data.is_reviewed === "True" ? true : false,
    },
  };
  return map;
};
