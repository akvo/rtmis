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

const { geojson, tile, defaultPos } = geo;
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
const colorRange = ["#bbedda", "#a7e1cb", "#92d5bd", "#7dcaaf", "#67bea1"];
const higlightColor = "#84b4cc";
const isMarker = false;
const isHover = false;

const HomeMap = ({ current, style }) => {
  const [loadingMap, setLoadingMap] = useState(false);
  const [map, setMap] = useState(null);
  const [results, setResults] = useState([]);
  const [zoomLevel, setZoomLevel] = useState(null);
  // shape legend click filter
  const [shapeTooltip, setShapeTooltip] = useState("");
  const [hoveredShape, setHoveredShape] = useState(null);
  const [shapeFilterColor, setShapeFilterColor] = useState(null);
  // marker legend click filter
  const [markerLegendSelected, setMarkerLegendSelected] = useState(null);

  useEffect(() => {
    if (current && current.maps.form_id) {
      const { form_id, shape } = current.maps;
      setLoadingMap(true);
      api
        .get(`maps/overview/${form_id}?shape=${shape?.id}`)
        .then((res) => {
          setResults(res.data);
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
  }, [current]);

  useEffect(() => {
    if (hoveredShape && results.length) {
      const geoName = takeRight(Object.values(hoveredShape), 2)[0];
      if (geoName) {
        const geoRes = results.filter((r) => r.loc === geoName);
        if (geoRes.length) {
          const tooltipElement = (
            <div className="shape-tooltip-container">
              <h3>{geoName}</h3>
              <Space align="top" direction="horizontal">
                <span className="shape-tooltip-name">
                  {current.maps.shape?.title}
                </span>
                <h3 className="shape-tooltip-value">
                  {geoRes.length ? sumBy(geoRes, "shape") : 0}
                </h3>
              </Space>
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
  }, [hoveredShape, results, current]);

  const onEachFeature = (feature, layer) => {
    layer.on({
      mouseover: () => {
        setHoveredShape(feature?.properties);
      },
    });
  };

  const geoStyle = (g) => {
    if (results.length && map) {
      const sc = shapeColors.find((sC) => {
        // return county level name
        return sC.name === takeRight(Object.values(g.properties), 4)[0];
      });
      const fillColor = sc ? getFillColor(sc.values || 0) : "#e6e8f4";
      const opacity = sc ? 0.8 : 0.3;
      return {
        fillColor,
        fillOpacity: 1,
        opacity,
        color: "#000",
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
    if (current && current.maps.marker) {
      return current.maps.marker?.options;
    }
    return [];
  }, [current]);

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
                  {current.maps.marker?.title}
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
          <h4>{current.maps.marker?.title}</h4>
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
    current,
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
        const [min, max] = acc;
        return [min, v > max ? v : max];
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
    const color = v === 0 ? "#FFF" : colorScale(v);
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

    return current && !loadingMap && thresholds.length ? (
      <div className="shape-legend">
        <h4>{current.maps.shape?.title}</h4>
        <Row className="legend-wrap">
          {thresholds.map((t, tI) => (
            <Col
              key={tI}
              flex={1}
              className={`legend-item ${
                shapeFilterColor === colorRange[tI] ? "legend-selected" : ""
              }`}
              onClick={() => handleShapeLegendClick(tI)}
              style={{ backgroundColor: colorRange[tI] }}
            >
              {tI === 0 && "0 - "}
              {tI >= thresholds.length - 1 && "> "}
              {tI > 0 &&
                tI < thresholds.length - 1 &&
                `${thresholds[tI - 1] + 1} - `}
              {t}
            </Col>
          ))}
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
              map.fitBounds(defPos.bbox);
              setZoomLevel(map.getZoom());
            }}
          />
          <Button
            type="secondary"
            icon={<ZoomOutOutlined />}
            onClick={() => {
              const currentZoom = map.getZoom() - 1;
              map.setZoom(currentZoom);
              setZoomLevel(currentZoom);
            }}
          />
          <Button
            disabled={zoomLevel >= mapMaxZoom}
            type="secondary"
            icon={<ZoomInOutlined />}
            onClick={() => {
              const currentZoom = map.getZoom() + 1;
              map.setZoom(currentZoom);
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
        whenCreated={setMap}
      >
        <TileLayer {...tile} />
        {geojson.features.length > 0 && (
          <GeoJSON
            key="geodata"
            style={geoStyle}
            data={geojson}
            onEachFeature={onEachFeature}
            weight={1}
          >
            {isHover && hoveredShape && shapeTooltip && (
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
