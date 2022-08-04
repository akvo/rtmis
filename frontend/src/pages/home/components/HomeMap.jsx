import React, { useState, useEffect } from "react";
import { MapContainer, TileLayer, GeoJSON, Tooltip } from "react-leaflet";
import { geo } from "../../../lib";
import { takeRight, chain, groupBy, sumBy } from "lodash";
import { Spin, Row, Col } from "antd";
import { scaleQuantize } from "d3-scale";
import "leaflet/dist/leaflet.css";

const { countiesjson, tile, defaultPos } = geo;
const defPos = defaultPos();
const colorRange = ["#EB5353", "#F9D923", "#9ACD32", "#36AE7C"];
const higlightColor = "#84b4cc";
const thresholds = [25, 50, 75, 100];
const borderColor = {
  white: "#FFF",
  selected: "#000000",
  normal: "#949fe3",
};

const getColorScale = ({ colors, method }) => {
  if (method === "percent") {
    return scaleQuantize().domain([0, 100]).range(colorRange);
  }
  const domain = colors
    .reduce(
      (acc, curr) => {
        const v = curr.values;
        const [minVal, maxVal] = acc;
        return [minVal, v > maxVal ? v : maxVal];
      },
      [0, 0]
    )
    .map((acc, index) => {
      if (index && acc) {
        acc = acc < 10 ? 10 : acc;
        acc = 100 * Math.floor((acc + 50) / 100);
      }
      return acc;
    });
  return scaleQuantize().domain(domain).range(colorRange);
};

const ShapeLegend = ({ shapeTitle, shapeFilterColor, setShapeFilterColor }) => {
  const handleShapeLegendClick = (index) => {
    if (shapeFilterColor === colorRange[index]) {
      setShapeFilterColor(null);
      return;
    }
    setShapeFilterColor(colorRange[index]);
  };

  return (
    <div className="shape-legend">
      <h4>{shapeTitle || ""}</h4>
      <Row className="legend-wrap">
        {thresholds.map((t, tI) => {
          return (
            <Col
              key={tI}
              flex={1}
              className={`legend-item ${
                shapeFilterColor === colorRange[tI] ? "legend-selected" : ""
              }`}
              onClick={() => handleShapeLegendClick(tI)}
              style={{
                backgroundColor: colorRange[tI],
              }}
            >
              {tI === 0 && "0%"}
              {tI > 0 && `${thresholds[tI - 1] + 1}%`}
              {" - "}
              {t}%
            </Col>
          );
        })}
      </Row>
    </div>
  );
};

const HomeMap = ({ current, style, mapValues = [] }) => {
  // config
  const currentMaps = current?.maps;
  const { form_id, shape: currentShape, option } = currentMaps;
  const { title: shapeTitle, calculation: shapeCalculation } = currentShape;
  // state
  const [maps, setMaps] = useState(null);
  const [results, setResults] = useState([]);
  const [shapeTooltip, setShapeTooltip] = useState("");
  const [hoveredShape, setHoveredShape] = useState(null);
  const [shapeFilterColor, setShapeFilterColor] = useState(null);

  useEffect(() => {
    if (mapValues.length && form_id) {
      const results = mapValues.map((d) => {
        const stackSum = sumBy(d.stack, "value");
        const stacks = d.stack.map((st) => {
          const percent =
            st.value && stackSum !== 0
              ? +((st.value / stackSum) * 100 || 0)
                  ?.toFixed(2)
                  .toString()
                  ?.match(/^-?\d+(?:\.\d{0,1})?/)[0] || 0
              : 0;
          return {
            ...st,
            percent: percent,
          };
        });
        return {
          loc: d.name,
          shape:
            stacks.find((s) => s?.name?.toLowerCase() === option?.toLowerCase())
              ?.percent || 0,
        };
      });
      setResults(results);
    }
  }, [mapValues, form_id, option]);

  useEffect(() => {
    if (hoveredShape && results.length) {
      const data = results.find(
        (x) => x.loc.toLowerCase() === hoveredShape?.NAME_01?.toLowerCase()
      );
      const detail = mapValues.find(
        (x) => x?.name?.toLowerCase() === hoveredShape?.NAME_01?.toLowerCase()
      );
      const total = sumBy(detail?.stack, "value");
      const selectedTotal = detail?.stack?.find(
        (x) => x?.name?.toLowerCase() === option?.toLowerCase()
      );
      if (!data) {
        setShapeTooltip(null);
      }
      if (data && !data?.shape) {
        setShapeTooltip(<span className="text-muted">No data</span>);
      }
      if (data?.shape) {
        const tooltipElement = (
          <div className="shape-tooltip-container">
            <h3>{data.loc}</h3>
            <span className="shape-tooltip-name">{shapeTitle}</span>
            <h3 className="shape-tooltip-value">{data.shape} %</h3>(
            {selectedTotal?.value} / {total})
          </div>
        );
        setShapeTooltip(tooltipElement);
      }
    }
  }, [hoveredShape, results, mapValues, option, shapeTitle]);

  const shapeColors = chain(groupBy(results, "loc"))
    .map((l, lI) => {
      const values = sumBy(l, "shape");
      return { name: lI, values };
    })
    .value();

  const colorScale = getColorScale({
    colors: shapeColors,
    method: shapeCalculation?.toLowerCase(),
  });

  const getFillColor = (v) => {
    const color = v === 0 ? "#e6e8f4" : colorScale(v);
    if (shapeFilterColor === color) {
      return higlightColor;
    }
    return color;
  };

  const getBorderStyle = (fillColor, sc) => {
    if (hoveredShape?.NAME_01?.toLowerCase() === sc?.name?.toLowerCase()) {
      return { color: borderColor.selected, weight: 2 };
    }
    return {
      color: fillColor !== "#e6e8f4" ? borderColor.white : borderColor.normal,
      weight: 1,
    };
  };

  const geoStyle = (g) => {
    if (results.length && maps) {
      const sc = shapeColors.find((sC) => {
        // return county level name
        return sC.name === takeRight(Object.values(g.properties), 4)[0];
      });
      const fillColor = sc ? getFillColor(sc.values || 0) : "#e6e8f4";
      const opacity = sc ? 0.8 : 0.3;
      return {
        fillColor: fillColor,
        fillOpacity: 1,
        opacity: opacity,
        color: getBorderStyle(fillColor, sc)?.color,
        zIndex:
          hoveredShape?.NAME_01?.toLowerCase() === sc?.name?.toLowerCase()
            ? 2
            : 1,
        weight: getBorderStyle(fillColor, sc)?.weight,
      };
    }
    return {
      fillColor: "#e6e8f4",
      fillOpacity: 1,
      opacity: 0.3,
      color: "#A0D4C1",
      weight: 1,
    };
  };

  return (
    <div className="map-container">
      {!results.length && (
        <div className="map-loading">
          <Spin />
        </div>
      )}
      <MapContainer
        bounds={defPos.bbox}
        zoomControl={false}
        scrollWheelZoom={false}
        style={style}
        whenCreated={setMaps}
      >
        <TileLayer {...tile} />
        {countiesjson.features.length > 0 && (
          <GeoJSON
            key="geodata"
            style={geoStyle}
            data={countiesjson}
            onEachFeature={(feature, layer) => {
              layer.on({
                mouseover: () => setHoveredShape(feature?.properties),
                mouseout: () => setHoveredShape(null),
              });
            }}
          >
            {hoveredShape && shapeTooltip && (
              <Tooltip className="shape-tooltip-wrapper">
                {shapeTooltip}
              </Tooltip>
            )}
          </GeoJSON>
        )}
      </MapContainer>
      {!!results.length && (
        <ShapeLegend
          shapeTitle={shapeTitle}
          shapeFilterColor={shapeFilterColor}
          setShapeFilterColor={setShapeFilterColor}
        />
      )}
    </div>
  );
};

export default HomeMap;
