import { feature, merge } from "topojson-client";
import { geoCentroid, geoBounds } from "d3-geo";

const topojson = window.topojson;
const topojson_object = topojson.objects[Object.keys(topojson.objects)[0]];
const shapeLevels = Object.keys(topojson_object.geometries[0].properties);

const tile = {
  url: "https://server.arcgisonline.com/ArcGIS/rest/services/Ocean_Basemap/MapServer/tile/{z}/{y}/{x}",
  attribution:
    "Tiles &copy; Esri &mdash; Sources: GEBCO, NOAA, CHS, OSU, UNH, CSUMB, National Geographic, DeLorme, NAVTEQ, and Esri",
};

const getBounds = (administration) => {
  const selected = administration.map((x, i) => {
    return {
      value: x.name,
      prop: shapeLevels[i],
    };
  });
  const geoFilter = topojson_object.geometries.filter((x) => {
    const filters = [];
    selected.forEach((s) => {
      if (x?.properties?.[s.prop] === s.value) {
        filters.push(true);
      } else {
        filters.push(false);
      }
    });
    return filters?.filter((f) => f).length === selected.length;
  });
  const mergeTopo = merge(
    topojson,
    geoFilter.length ? geoFilter : topojson_object.geometries
  );
  const center = geoCentroid(mergeTopo).reverse();
  const bounds = geoBounds(mergeTopo);
  const bbox = [bounds[0].reverse(), bounds[1].reverse()];
  return {
    coordinates: center,
    bbox: bbox,
  };
};

const defaultPos = () => {
  const mergeTopo = merge(topojson, topojson_object.geometries);
  const center = geoCentroid(mergeTopo).reverse();
  const bounds = geoBounds(mergeTopo);
  const bbox = [bounds[0].reverse(), bounds[1].reverse()];
  return {
    coordinates: center,
    bbox: bbox,
  };
};

const geojson = feature(topojson, topojson_object);

const geo = {
  geojson: geojson,
  shapeLevels: shapeLevels,
  tile: tile,
  getBounds: getBounds,
  defaultPos: defaultPos,
};

export default geo;
