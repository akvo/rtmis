import React, { useState, useEffect, useMemo } from "react";
import "./style.scss";
import ShapeLegend from "./ShapeLegend";
import { MapContainer, TileLayer, GeoJSON, Tooltip } from "react-leaflet";
import { store, geo } from "../../lib";
import { get, takeRight, sumBy } from "lodash";
import { Spin, Space, Button, Col } from "antd";
import "leaflet/dist/leaflet.css";
import {
  ZoomInOutlined,
  ZoomOutOutlined,
  FullscreenOutlined,
} from "@ant-design/icons";

const { tile, defaultPos, getColorScale, getBounds, getGeometry } = geo;
const defPos = defaultPos();
const colorRange = ["#EB5353", "#F9D923", "#9ACD32", "#36AE7C"];
const borderColor = "#7d7d7d";
const mapMaxZoom = 13;
const higlightColor = "#84b4cc";

const Maps = ({ mapConfig, style = {} }) => {
  // config
  const { data, title, calc, path, span, type, index } = mapConfig;
  const { administration } = store.useState((s) => s);
  const [maps, setMaps] = useState(null);
  const [currentPolygon, setCurrentPolygon] = useState(null);
  const [zoomLevel, setZoomLevel] = useState(null);
  const [results, setResults] = useState([]);
  const [shapeTooltip, setShapeTooltip] = useState("");
  const [hovered, setHovered] = useState(null);
  const [shapeFilterColor, setShapeFilterColor] = useState(null);

  const currentAdministration =
    administration.length < 4
      ? takeRight(administration)?.[0]
      : takeRight(administration, 2)?.[0];
  const { level } = currentAdministration;

  useEffect(() => {
    if (maps && administration?.length) {
      const pos = getBounds(administration);
      maps.fitBounds(pos.bbox);
      maps.setView(pos.coordinates, maps.getZoom());
      setZoomLevel(maps.getZoom());
      maps.invalidateSize();
      setCurrentPolygon(getGeometry(currentAdministration));
    }
  }, [maps, administration, currentAdministration]);

  useEffect(() => {
    if (data.length) {
      const results = data.map((x) => ({
        name: x.loc,
        value: get(x, path) || 0,
      }));
      setResults(results);
    }
  }, [data, path]);

  const total = useMemo(() => {
    return sumBy(results, "value");
  }, [results]);

  const colorScale = getColorScale({
    colors: results,
    method: calc,
    colorRange: colorRange,
  });

  const thresholds =
    calc === "percent" ? [25, 50, 75, 100] : colorScale.thresholds();

  const getFillColor = (v) => {
    const color = v === 0 ? "#e6e8f4" : colorScale(v);
    if (shapeFilterColor === color) {
      return higlightColor;
    }
    return color;
  };

  const geoStyle = (g) => {
    if (results.length && maps) {
      const sc = results.find((sC) => {
        // return county level name
        return sC.name === takeRight(Object.values(g.properties), 4)[0];
      });
      const fillColor = sc ? getFillColor(sc.value || 0) : "#e6e8f4";
      return {
        fillColor: fillColor,
        fillOpacity: 1,
        opacity: sc ? 0.8 : 0.3,
        color: borderColor,
        zIndex:
          hovered?.[`NAME_${level + 1}`]?.toLowerCase() ===
          sc?.name?.toLowerCase()
            ? 2
            : 1,
        weight: sc ? 0 : 1.5,
      };
    }
    return {
      fillColor: "#e6e8f4",
      fillOpacity: 1,
      opacity: 0.3,
      color: borderColor,
      weight: 1.5,
    };
  };

  useEffect(() => {
    if (hovered && results.length) {
      const detail = results.find(
        (x) =>
          x.name.toLowerCase() === hovered?.[`NAME_${level + 1}`]?.toLowerCase()
      );
      if (detail?.value) {
        const tooltipElement = (
          <div className="shape-tooltip-container">
            <h3>{detail.name}</h3>
            <span className="shape-tooltip-name">{title}</span>
            <h3 className="shape-tooltip-value">
              {detail?.value} {calc === "percent" && "%"}
            </h3>
            ({detail?.value} / {total})
          </div>
        );
        setShapeTooltip(tooltipElement);
      }
      if (!detail) {
        setShapeTooltip("");
      }
    }
  }, [hovered, results, total, calc, title, level]);

  const onEachFeature = (feature, layer) => {
    layer.on({
      mouseover: () => setHovered(feature?.properties),
      mouseout: () => setHovered(null),
    });
  };

  const Polygons = () => {
    return (
      currentPolygon?.features?.length > 0 && (
        <GeoJSON
          key="geodata"
          style={geoStyle}
          data={currentPolygon}
          onEachFeature={onEachFeature}
        >
          {hovered && shapeTooltip && <Tooltip>{shapeTooltip}</Tooltip>}
        </GeoJSON>
      )
    );
  };

  return (
    <Col className="map-container" span={span} key={`col-${type}-${index}`}>
      {!results.length && (
        <div className="map-loading">
          <Spin />
        </div>
      )}
      <div className="map-buttons">
        <Space size="small" direction="vertical">
          <Button
            type="secondary"
            icon={<FullscreenOutlined />}
            onClick={() => {
              maps.fitBounds(defPos.bbox);
              setZoomLevel(maps.getZoom());
            }}
          />
          <Button
            type="secondary"
            icon={<ZoomOutOutlined />}
            onClick={() => {
              const currentZoom = maps.getZoom() - 1;
              maps.setZoom(currentZoom);
              setZoomLevel(currentZoom);
            }}
          />
          <Button
            disabled={zoomLevel >= mapMaxZoom}
            type="secondary"
            icon={<ZoomInOutlined />}
            onClick={() => {
              const currentZoom = maps.getZoom() + 1;
              maps.setZoom(currentZoom);
              setZoomLevel(currentZoom);
            }}
          />
        </Space>
      </div>
      <MapContainer
        bounds={defPos.bbox}
        zoomControl={false}
        scrollWheelZoom={false}
        style={style}
        whenCreated={setMaps}
      >
        <TileLayer {...tile} />
        <Polygons />
      </MapContainer>
      {!!results.length && (
        <ShapeLegend
          title={title}
          thresholds={thresholds}
          colorRange={colorRange}
          shapeFilterColor={shapeFilterColor}
          setShapeFilterColor={setShapeFilterColor}
          symbol={calc === "percent" ? "%" : ""}
        />
      )}
    </Col>
  );
};

export default Maps;
