import React, { useState, useEffect, useMemo } from "react";
import "./style.scss";
import ShapeLegend from "./ShapeLegend";
import { MapContainer, TileLayer, GeoJSON, Tooltip } from "react-leaflet";
import { store, geo, config } from "../../lib";
import { get, takeRight, sumBy, startCase } from "lodash";
import { Spin, Space, Button, Col, Select } from "antd";
import "leaflet/dist/leaflet.css";
import {
  ZoomInOutlined,
  ZoomOutOutlined,
  FullscreenOutlined,
} from "@ant-design/icons";

const { Option, OptGroup } = Select;

const { tile, defaultPos, getColorScale, getBounds, getGeometry } = geo;
const defPos = defaultPos();
const colorRange = ["#EB5353", "#F9D923", "#9ACD32", "#36AE7C"];
const borderColor = "#7d7d7d";
const mapMaxZoom = 13;
const higlightColor = "#84b4cc";
const ignoredDropdown = ["average", "sum"];

const IndicatorDropdown = ({
  indicatorPath,
  setIndicatorPath,
  indicators,
  calc,
}) => {
  return (
    <div className="indicator-selector">
      <Select
        value={indicatorPath}
        style={{ width: 300, textAlign: "left" }}
        onChange={setIndicatorPath}
        className="indicator-dropdown"
      >
        {calc !== "percent" && (
          <Option key={"total"} value={"total"}>
            Total
          </Option>
        )}
        {indicators
          .filter((i) => !ignoredDropdown.includes(i.name))
          .map((i) => (
            <OptGroup key={i.name} label={i.name}>
              {i.childrens.map((c) => {
                return (
                  <Option key={`${i.name}-${c}`} value={`data.${i.name}.${c}`}>
                    {c}
                  </Option>
                );
              })}
            </OptGroup>
          ))}
      </Select>
    </div>
  );
};

const Maps = ({ loading, mapConfig, style = {}, national }) => {
  // config
  const { data, title, calc, path, span, type, index } = mapConfig;
  const { administration } = store.useState((s) => s);
  const [indicatorPath, setIndicatorPath] = useState(null);
  const [maps, setMaps] = useState(null);
  const [currentPolygon, setCurrentPolygon] = useState(null);
  const [zoomLevel, setZoomLevel] = useState(null);
  const [results, setResults] = useState([]);
  const [shapeTooltip, setShapeTooltip] = useState("");
  const [hovered, setHovered] = useState(null);
  const [shapeFilterColor, setShapeFilterColor] = useState(null);

  const indicatorTitle = useMemo(() => {
    const prefix = calc === "percent" ? "% of" : "Count of";
    if (indicatorPath && !national) {
      let ttl = indicatorPath.split(".").map((i) => startCase(i));
      ttl = takeRight(ttl, 2).join(" - ");
      return `${prefix} ${ttl}`;
    }
    return `${prefix} ${title}`;
  }, [indicatorPath, calc, title, national]);

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
    if (data.length && indicatorPath) {
      const results = data.map((x) => {
        let val = get(x, indicatorPath);
        if (calc === "percent") {
          const total = get(x, "total");
          val = (val / total) * 100;
          val = val.toFixed(0);
        }
        return {
          name: x.loc,
          value: val || 0,
        };
      });
      setResults(results);
    }
  }, [data, calc, indicatorPath]);

  useEffect(() => {
    setIndicatorPath(path);
  }, [path]);

  const total = useMemo(() => {
    return sumBy(results, "value");
  }, [results]);

  const colorScale = getColorScale({
    method: calc,
    colors: results,
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
    const gName = g.properties?.[`NAME_${level + 1}`]?.toLowerCase();
    const hoveredShape = hovered?.[`NAME_${level + 1}`]?.toLowerCase();
    const isHovered = hoveredShape === gName;
    const allStyle = {
      opacity: isHovered ? 1 : 0.5,
      color: isHovered ? "#000" : borderColor,
      zIndex: isHovered ? 2 : 1,
      weight: 1.5,
    };
    if (results.length && maps) {
      const sc = results.find((sC) => {
        return sC.name.toLowerCase() === gName;
      });
      const fillColor = sc ? getFillColor(sc.value || 0) : "#e6e8f4";
      return {
        fillColor: fillColor,
        fillOpacity: 1,
        color: isHovered ? "#000" : borderColor,
        ...allStyle,
      };
    }
    return {
      fillColor: "#e6e8f4",
      fillOpacity: 1,
      ...allStyle,
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
            <span className="shape-tooltip-name">{indicatorTitle}</span>
            <h3 className="shape-tooltip-value">
              {detail?.value} {calc === "percent" && "%"}
            </h3>
          </div>
        );
        setShapeTooltip(tooltipElement);
      }
      if (!detail) {
        setShapeTooltip("");
      }
    }
  }, [hovered, results, total, calc, indicatorTitle, level]);

  const onEachFeature = (feature, layer) => {
    layer.on({
      click: () => {
        if (!national) {
          const shapeName = feature.properties?.[`NAME_${level + 1}`];
          const shapeInfo = currentAdministration.children.find(
            (x) => x.name === shapeName
          );
          config.fn.administration(shapeInfo.id).then((res) => {
            store.update((s) => {
              s.administration.length = index + 1;
              s.administration = [...administration, res];
            });
          });
        }
      },
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

  const indicators = useMemo(() => {
    if (data?.[0]?.data) {
      return Object.keys(data[0].data).map((i) => {
        return {
          name: i,
          childrens: Object.keys(data[0].data[i]),
        };
      });
    }
    return [];
  }, [data]);

  return (
    <Col className="map-container" span={span} key={`col-${type}-${index}`}>
      {loading && (
        <div className="map-loading">
          <Spin />
        </div>
      )}
      <IndicatorDropdown
        indicators={indicators}
        indicatorPath={indicatorPath}
        setIndicatorPath={setIndicatorPath}
        calc={calc}
      />
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
          title={indicatorTitle}
          thresholds={thresholds}
          colorRange={colorRange}
          shapeFilterColor={shapeFilterColor}
          setShapeFilterColor={setShapeFilterColor}
          calc={calc}
        />
      )}
    </Col>
  );
};

export default Maps;
