import React, { useState, useEffect, useMemo, useCallback } from "react";
import "./style.scss";
import {
  Circle,
  MapContainer,
  TileLayer,
  GeoJSON,
  Tooltip,
} from "react-leaflet";
import { api, geo, queue } from "../../lib";
import { takeRight, intersection, chain, groupBy, sumBy } from "lodash";
import { Button, Space, Spin, Row, Col } from "antd";
import { scaleQuantize } from "d3-scale";
import {
  ZoomInOutlined,
  ZoomOutOutlined,
  FullscreenOutlined,
} from "@ant-design/icons";
import "leaflet/dist/leaflet.css";

const { countiesjson, tile, defaultPos } = geo;
const defPos = defaultPos();
const mapMaxZoom = 13;
const markerColorRange = [
  "#47CC65",
  "#EC8964",
  "#5195ED",
  "#D187DD",
  "#9E84E9",
  "#D36B6B",
  "#CFB52A",
  "#43C6CE",
  "#AA9B7E",
  "#BDDF38",
  "#52B0AE",
  "#F2AEAD",
];
const colorRange = ["#EB5353", "#F9D923", "#9ACD32", "#36AE7C"];
const higlightColor = "#84b4cc";
const isMarker = false;

const HomeMap = ({ current, style, mapValues }) => {
  // config
  const currentMaps = current?.maps;
  const {
    form_id,
    option: mapShapeOption,
    fetch_api: fetchFromApi,
    shape: currentShape,
  } = currentMaps;
  const {
    id: shapeId,
    title: shapeTitle,
    type: shapeType,
    calculation: shapeCalculation,
    criteria: shapeCriteria,
  } = currentShape;
  // state
  const [loadingMap, setLoadingMap] = useState(false);
  const [maps, setMaps] = useState(null);
  const [results, setResults] = useState([]);
  const [zoomLevel, setZoomLevel] = useState(null);
  // shape legend click filter
  const [shapeTooltip, setShapeTooltip] = useState("");
  const [hoveredShape, setHoveredShape] = useState(null);
  const [shapeFilterColor, setShapeFilterColor] = useState(null);
  // marker legend click filter
  const [markerLegendSelected, setMarkerLegendSelected] = useState(null);

  useEffect(() => {
    if (fetchFromApi && current && currentMaps?.form_id) {
      setLoadingMap(true);
      const isCriteria = shapeType && shapeType === "CRITERIA";
      const url = isCriteria
        ? `maps/overview/criteria/${form_id}`
        : `maps/overview/${form_id}?shape=${shapeId}`;
      api[isCriteria ? "post" : "get"](
        url,
        isCriteria ? { shape: shapeCriteria } : {}
      )
        .then((res) => {
          let data = res.data;
          if (isCriteria && shapeCalculation?.toLowerCase() === "percent") {
            // get percentage: shape_county / sum_of_shape_national_level
            const totalShape = sumBy(data, "shape");
            data = data.map((d) => {
              let percent = (d.shape / totalShape) * 100;
              percent = Math.round((percent + Number.EPSILON) * 100) / 100;
              return { ...d, shape: percent };
            });
          }
          setResults(data);
        })
        .catch((e) => {
          console.error("e", e);
        })
        .finally(() => {
          setLoadingMap(false);
          queue.update((q) => {
            q.wait = null;
          });
        });
    }
  }, [
    current,
    currentMaps,
    form_id,
    shapeType,
    shapeId,
    shapeCalculation,
    shapeCriteria,
    fetchFromApi,
  ]);

  useEffect(() => {
    if (!fetchFromApi && current && mapShapeOption) {
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
            stacks.find(
              (s) => s?.name?.toLowerCase() === mapShapeOption?.toLowerCase()
            )?.percent || 0,
        };
      });
      setResults(results);
    }
  }, [mapValues, fetchFromApi, current, mapShapeOption]);

  useEffect(() => {
    if (hoveredShape && results.length) {
      const data = results.find(
        (x) => x.loc.toLowerCase() === hoveredShape?.NAME_01?.toLowerCase()
      );
      if (data) {
        if (data?.shape) {
          const tooltipElement = (
            <div className="shape-tooltip-container">
              <h3>{data.loc}</h3>
              <span className="shape-tooltip-name">{shapeTitle}</span>
              <h3 className="shape-tooltip-value">
                {data.shape}
                {shapeCalculation?.toLowerCase() === "percent" ? "%" : ""}
              </h3>
            </div>
          );
          setShapeTooltip(tooltipElement);
          return;
        }
        setShapeTooltip(<span className="text-muted">No data</span>);
        return;
      }
      setShapeTooltip(null);
    }
  }, [hoveredShape, results, shapeTitle, shapeCalculation]);

  const onEachFeature = (feature, layer) => {
    layer.on({
      mouseover: () => {
        setHoveredShape(feature?.properties);
      },
    });
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
        color: fillColor !== "#e6e8f4" ? "#FFF" : "#949fe3",
      };
    }
    return {
      fillColor: "#e6e8f4",
      fillOpacity: 1,
      opacity: 0.3,
      color: "#A0D4C1",
    };
  };

  const markerLegendOptions = useMemo(() => {
    if (currentMaps?.marker) {
      return currentMaps.marker?.options;
    }
    return [];
  }, [currentMaps]);

  const Markers = ({ data }) => {
    if (data.length) {
      const r = 5;
      data = data.filter((d) => d.geo?.length === 2);
      return data.map(({ id, geo, marker, name }) => {
        const markerRes = markerLegendOptions
          .map((x) => x.name)
          .findIndex((sO) => sO === marker[0]);
        const highlight =
          markerLegendSelected?.name &&
          intersection([markerLegendSelected.name], marker).length;
        const markerColor =
          markerRes === -1 ? "#111" : markerColorRange[markerRes];
        return (
          <Circle
            key={id}
            center={{ lat: geo[1], lng: geo[0] }}
            pathOptions={{
              fillColor: highlight ? "#FFF" : markerColor,
              color: markerColor,
              opacity: 1,
              fillOpacity: 1,
            }}
            radius={r * 100 * (highlight ? 5 : 1)}
          >
            <Tooltip direction="top">
              <div className="marker-tooltip-container">
                <h3>{takeRight(name.split(" - "), 1)[0]}</h3>
                <div className="marker-tooltip-name">
                  {currentMaps.marker?.title || ""}
                </div>
                <div className="marker-tooltip-value">{marker[0]}</div>
              </div>
            </Tooltip>
          </Circle>
        );
      });
    }
    return null;
  };

  const handleMarkerLegendClick = useCallback(
    (value) => {
      if (markerLegendSelected?.id === value.id) {
        setMarkerLegendSelected(null);
        return;
      }
      setMarkerLegendSelected(value);
    },
    [markerLegendSelected]
  );

  const MarkerLegend = useMemo(() => {
    if (markerLegendOptions) {
      return (
        <div className="marker-legend">
          <h4>{currentMaps.marker?.title}</h4>
          <Space
            direction="horizontal"
            align="center"
            wrap={true}
            size={[16, 0]}
            style={{ justifyContent: "center" }}
          >
            {markerLegendOptions.map((sO, sI) => (
              <div
                key={sI}
                className="legend-item"
                onClick={() => handleMarkerLegendClick(sO)}
              >
                <Space direction="horizontal" align="top">
                  <div
                    className="circle-legend"
                    style={{ backgroundColor: markerColorRange[sI] }}
                  />
                  <span
                    style={{
                      fontWeight:
                        markerLegendSelected?.id === sO.id ? "600" : "400",
                    }}
                  >
                    {sO?.title || sO?.name || "NA"}
                  </span>
                </Space>
              </div>
            ))}
          </Space>
        </div>
      );
    }
    return <div />;
  }, [
    currentMaps,
    markerLegendOptions,
    markerLegendSelected,
    handleMarkerLegendClick,
  ]);

  const shapeColors = chain(groupBy(results, "loc"))
    .map((l, lI) => {
      const values = sumBy(l, "shape");
      return { name: lI, values };
    })
    .value();

  const domain = shapeColors
    .reduce(
      (acc, curr) => {
        const v = curr.values;
        const [minVal, maxVal] = acc;
        const maxTmp =
          shapeCalculation?.toLowerCase() === "percent" ? 100 : maxVal;
        return [minVal, v > maxTmp ? v : maxTmp];
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

  const colorScale = scaleQuantize().domain(domain).range(colorRange);

  const getFillColor = (v) => {
    const color = v === 0 ? "#e6e8f4" : colorScale(v);
    if (shapeFilterColor === color) {
      return higlightColor;
    }
    return color;
  };

  const ShapeLegend = ({ thresholds }) => {
    const handleShapeLegendClick = (index) => {
      if (shapeFilterColor === colorRange[index]) {
        setShapeFilterColor(null);
        return;
      }
      setShapeFilterColor(colorRange[index]);
    };
    thresholds = [...thresholds, thresholds[thresholds.length - 1]];

    return current && !loadingMap && thresholds.length ? (
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
                {tI === 0 && "0 - "}
                {tI === thresholds.length - 1 && "> "}
                {tI > 0 &&
                  tI < thresholds.length - 1 &&
                  `${thresholds[tI - 1] + 1} - `}
                {t}
              </Col>
            );
          })}
        </Row>
      </div>
    ) : null;
  };

  return (
    <div className="map-container">
      {loadingMap ? (
        <div className="map-loading">
          <Spin />
        </div>
      ) : (
        isMarker && MarkerLegend
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
        {countiesjson.features.length > 0 && (
          <GeoJSON
            key="geodata"
            style={geoStyle}
            data={countiesjson}
            onEachFeature={onEachFeature}
            weight={1}
          >
            {hoveredShape && shapeTooltip && (
              <Tooltip className="shape-tooltip-wrapper">
                {shapeTooltip}
              </Tooltip>
            )}
          </GeoJSON>
        )}
        {isMarker && !loadingMap && !!results.length && (
          <Markers data={results} />
        )}
      </MapContainer>
      {!loadingMap && <ShapeLegend thresholds={colorScale.thresholds()} />}
    </div>
  );
};

export default HomeMap;
