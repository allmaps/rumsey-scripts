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

export const createMinimalMap = (data: rumseyData) => {
  const id = data.iiifManifest
    .replace("https://www.davidrumsey.com/luna/servlet/iiif/m/", "")
    .replace("/manifest", "");
  const gcps = JSON.parse(data.gcps.replaceAll("'", '"')).map((i) => [
    i.pixel,
    i.location,
  ]);
  const m = data.cutline;
  const t = data.transformation_method;
  return { id, gcps, m, t };
};

export const createMap = (data: rumseyData) => {
  // const resourceId = data.image_url.replace("/info.json", "");
  const resourceId = data.iiifManifest
    .replace("/manifest", "")
    .replace("iiif/m/", "iiif/");
  const gcps = JSON.parse(data.gcps.replaceAll("'", '"'));
  const resourceMask = data.cutline;
  const transformation =
    data.transformation_method === "affine" ||
    data.transformation_method === "tps"
      ? "thinPlateSpline"
      : "polynomial";
  const width = 1000;
  const height = 1000;
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
  };
  return map;
};
