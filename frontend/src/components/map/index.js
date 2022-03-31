import React, { useEffect, useState } from "react";
import {
  Circle,
  MapContainer,
  TileLayer,
  GeoJSON,
  Tooltip,
} from "react-leaflet";
import { api, geo, store } from "../../lib";
import { takeRight } from "lodash";
import { Badge, Space } from "antd";
import "leaflet/dist/leaflet.css";

const { geojson, shapeLevels, tile, defaultPos, getBounds } = geo;
const defPos = defaultPos();

const Map = ({ style, question }) => {
  const { administration, selectedForm } = store.useState((s) => s);
  const [map, setMap] = useState(null);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState([]);
  // const [selectedShape, setSelectedShape] = useState(null);
  const [hoveredShape, setHoveredShape] = useState(null);
  const [shapeTooltip, setShapeTooltip] = useState("");
  useEffect(() => {
    if (map && administration.length) {
      const pos = getBounds(administration);
      map.fitBounds(pos.bbox);
    }
  }, [map, administration]);

  const onEachFeature = (feature, layer) => {
    layer.on({
      click: () => {
        // setSelectedShape(target?.feature);
      },
      mouseover: ({ target }) => {
        setHoveredShape(target?.feature);
      },
    });
  };

  const geoStyle = (g) => {
    if (administration.length > 1 && map) {
      const gname = g.properties[shapeLevels[administration.length - 1]];
      const adminName = takeRight(administration, 1)[0]?.name;
      const geoSelected = adminName === gname;
      return {
        fillColor: geoSelected ? "#0057ff" : "#e6e8f4",
        fillOpacity: geoSelected ? 1 : 0.1,
        opacity: geoSelected ? 0.8 : 0.1,
        color: "#fff",
      };
    }
    return {
      fillColor: "#0057ff",
      fillOpacity: 1,
      opacity: 0.8,
      color: "#fff",
    };
  };

  useEffect(() => {
    if (question) {
      setLoading(true);
      api
        .get(
          `maps/${selectedForm}?marker=${question[1].id}&shape=${question[0].id}`
        )
        .then((res) => {
          setResults(res.data);
          setLoading(false);
        })
        .catch((e) => {
          console.error("e", e);
          setLoading(false);
        });
    }
  }, [selectedForm, question]);

  useEffect(() => {
    if (hoveredShape && results.length) {
      const geoName = Object.values(hoveredShape.properties)[
        Object.values(hoveredShape.properties).length - 1
      ];
      if (!geoName) {
        setShapeTooltip(null);
        return;
      }

      const tooltipElement = (
        <div className="shape-tooltip-container">
          <h4>{geoName}</h4>
          <Space direction="vertical">
            <span className="shape-tooltip-name">{question[1].name}</span>
            <span className="shape-tooltip-value">
              {results.find((d) => d.name === geoName)?.shape || "-"}
            </span>
          </Space>
        </div>
      );
      setShapeTooltip(tooltipElement);
    }
  }, [hoveredShape, results, question]);

  const Markers = (data) => {
    if (data.length) {
      data = data.filter((d) => d.geo);
      return data.map(({ id, geo, marker, name }) => {
        const r = 3;
        const stroke = "#fff";
        return (
          <Circle
            key={id}
            center={geo}
            pathOptions={{
              fillColor: "red",
              color: "blue",
              opacity: 1,
              fillOpacity: 1,
            }}
            radius={r * 100}
            stroke={stroke}
          >
            <Tooltip direction="top">
              <Badge count={marker} style={{ backgroundColor: "green" }} />{" "}
              {name}
            </Tooltip>
          </Circle>
        );
      });
    }
    return null;
  };

  return (
    <div className="map-container">
      <MapContainer
        bounds={defPos.bbox}
        zoomControl={false}
        scrollWheelZoom={false}
        style={style}
        whenCreated={setMap}
      >
        <TileLayer {...tile} />
        {geojson.features.length > 0 && (
          <GeoJSON
            key="geodata"
            style={geoStyle}
            data={geojson}
            onEachFeature={onEachFeature}
          >
            {hoveredShape && shapeTooltip && <Tooltip>{shapeTooltip}</Tooltip>}
          </GeoJSON>
        )}
        {!loading && <Markers data={results} />}
      </MapContainer>
    </div>
  );
};

export default Map;
