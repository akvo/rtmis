import { feature, merge } from "topojson-client";
import { geoCentroid, geoBounds } from "d3-geo";
import { groupBy, chain } from "lodash";
import union from "@turf/union";

const topojson = window.topojson;
const topojson_object = topojson.objects[Object.keys(topojson.objects)[0]];
const shapeLevels = Object.keys(topojson_object.geometries[0].properties);

const tile = {
  url: "https://server.arcgisonline.com/ArcGIS/rest/services/Ocean_Basemap/MapServer/tile/{z}/{y}/{x}",
  attribution: "Tiles &copy; Esri &mdash; DeLorme, NAVTEQ, Esri",
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

const countiesjson = chain(groupBy(geojson.features, "properties.NAME_1"))
  .map((d, v) => {
    const polygon = d.reduce((g, c, i) => {
      if (!i) {
        return c;
      }
      return union(g, c);
    });
    return { polygon: polygon, name: v };
  })
  .value()
  .map((x) => {
    return { ...x.polygon, properties: { NAME_01: x.name } };
  });

const geo = {
  geojson: geojson,
  countiesjson: { type: "FeatureCollection", features: countiesjson },
  shapeLevels: shapeLevels,
  tile: tile,
  getBounds: getBounds,
  defaultPos: defaultPos,
};

export default geo;
