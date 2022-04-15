import React, { useEffect, useMemo, useState } from "react";
import "./style.scss";
import {
  Circle,
  MapContainer,
  TileLayer,
  GeoJSON,
  Tooltip,
} from "react-leaflet";
import { api, geo, store } from "../../lib";
import { flatten, takeRight, uniq, chain, groupBy, sumBy } from "lodash";
import { Button, Space, Spin, Row, Col } from "antd";
import { scaleQuantize } from "d3-scale";
import {
  ZoomInOutlined,
  ZoomOutOutlined,
  FullscreenOutlined,
} from "@ant-design/icons";
import "leaflet/dist/leaflet.css";

const { geojson, shapeLevels, tile, defaultPos, getBounds } = geo;
const defPos = defaultPos();
const mapMaxZoom = 13;
const shapeColorRange = [
  "#47CC65",
  "#EC8964",
  "#5195ED",
  "#D187DD",
  "#9E84E9",
  "#D36B6B",
  "#CFB52A",
  "#43C6CE",
  "#AA9B7E",
  "#8D8D8D",
];
const colorRange = ["#bbedda", "#a7e1cb", "#92d5bd", "#7dcaaf", "#67bea1"];
const higlightColor = "#84b4cc";

const Map = ({ style, question }) => {
  const { administration, selectedForm, loadingForm } = store.useState(
    (s) => s
  );
  const [map, setMap] = useState(null);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState([]);
  const [selectedShape, setSelectedShape] = useState(null);
  const [hoveredShape, setHoveredShape] = useState(null);
  const [zoomLevel, setZoomLevel] = useState(null);
  const [shapeTooltip, setShapeTooltip] = useState("");
  const [markerOptions, setMarkerOptions] = useState([]);
  const [reloadMap, setReloadMap] = useState(false);

  // shape legend click filter
  const [shapeFilterColor, setShapeFilterColor] = useState(null);

  useEffect(() => {
    if (map && administration.length && reloadMap) {
      const pos = getBounds(administration);
      map.fitBounds(pos.bbox);
      setZoomLevel(map.getZoom());
      setReloadMap(false);
    }
  }, [map, administration, reloadMap]);

  const adminName = useMemo(() => {
    return administration.length ? takeRight(administration, 1)[0]?.name : null;
  }, [administration]);

  useEffect(() => {
    if (selectedShape && administration.length) {
      const selectedAdmin = takeRight(Object.values(selectedShape), 1)[0];
      const fetchData = (adminId, acc) => {
        api.get(`administration/${adminId}`).then((res) => {
          acc.unshift({
            id: res.data.id,
            name: res.data.name,
            levelName: res.data.level_name,
            children: res.data.children,
            childLevelName: res.data.children_level_name,
          });
          if (res.data.level > 0) {
            fetchData(res.data.parent, acc);
          } else {
            store.update((s) => {
              s.administration = acc;
            });
            store.update((s) => {
              s.loadingAdministration = false;
            });
            setReloadMap(true);
          }
        });
      };
      store.update((s) => {
        s.loadingAdministration = true;
      });
      fetchData(selectedAdmin, []);
      // FIXME: Replace administration name with id (not available)
    }
  }, [selectedShape, administration]);

  const onEachFeature = (feature, layer) => {
    layer.on({
      click: () => {
        setSelectedShape(feature?.properties);
      },
      mouseover: () => {
        setHoveredShape(feature?.properties);
      },
    });
  };

  const geoStyle = (g) => {
    if (administration.length > 0 && results.length && map) {
      const gname = g.properties[shapeLevels[administration.length - 1]];
      const geoSelected = adminName === gname;
      const sc = shapeColors.find(
        (sC) => sC.name === takeRight(Object.values(g.properties), 1)[0]
      );
      const fillColor = geoSelected
        ? sc
          ? getFillColor(sc.values || 0)
          : "#e6e8f4"
        : "#e6e8f4";
      const opacity = geoSelected ? (sc ? 0.8 : 0.3) : 0;
      const fillOpacity = geoSelected ? 1 : 0;
      return {
        fillColor,
        fillOpacity,
        opacity,
        color: geoSelected ? "#000" : "#A0D4C1",
      };
    }
    return {
      fillColor: "#e6e8f4",
      fillOpacity: 1,
      opacity: 0.3,
      color: "#A0D4C1",
    };
  };

  useEffect(() => {
    if (
      question &&
      selectedForm &&
      question?.markerQuestion?.form === selectedForm
    ) {
      setLoading(true);
      api
        .get(
          `maps/${selectedForm}?marker=${question?.shapeQuestion?.id}&shape=${question?.markerQuestion?.id}`
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
    if (hoveredShape && results.length && administration.length) {
      const geoName =
        Object.values(hoveredShape)[Object.values(hoveredShape).length - 1];
      const gname = Object.values(hoveredShape)[administration.length - 1];
      const geoSelected = adminName === gname;
      if (geoName && geoSelected) {
        const geoRes = results.filter((r) => r.loc === geoName);
        if (geoRes.length) {
          const tooltipElement = (
            <div className="shape-tooltip-container">
              <h3>{geoName}</h3>
              <Space align="top" direction="horizontal">
                <span className="shape-tooltip-name">
                  {question?.shapeQuestion?.name}
                </span>
                <h3 className="shape-tooltip-value">
                  {geoRes.length ? sumBy(geoRes, "marker") : 0}
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
  }, [hoveredShape, results, question, administration, adminName]);

  const Markers = ({ data }) => {
    if (data.length) {
      data = data.filter((d) => d.geo.length === 2);
      return data.map(({ id, geo, shape, name }) => {
        const shapeRes = markerOptions.findIndex((sO) => sO === shape[0]);
        const markerColor =
          shapeRes === -1 ? "#111" : shapeColorRange[shapeRes];
        return (
          <Circle
            key={id}
            center={{ lat: geo[1], lng: geo[0] }}
            pathOptions={{
              fillColor: markerColor,
              color: markerColor,
              opacity: 1,
              fillOpacity: 1,
            }}
            radius={500}
          >
            <Tooltip direction="top">
              <div className="shape-tooltip-container">
                <div className="shape-tooltip-name">Village Name</div>
                <div className="shape-tooltip-value">
                  {takeRight(name.split(" - "), 1)[0]}
                </div>
                <div className="shape-tooltip-name">
                  {question?.markerQuestion?.name}
                </div>
                <div className="shape-tooltip-value">{shape[0]}</div>
              </div>
            </Tooltip>
          </Circle>
        );
      });
    }
    return null;
  };

  useEffect(() => {
    if (results.length) {
      const shapeValues = uniq(flatten(results.map((r) => r.shape)));
      setMarkerOptions(shapeValues);
    }
  }, [results]);

  const MarkerLegend = () => {
    if (markerOptions.length) {
      return (
        <div className="marker-legend">
          <h4>{question?.markerQuestion?.name}</h4>
          {markerOptions.map((sO, sI) => (
            <div key={sI} onClick={() => console.info(sO)}>
              <Space direction="horizontal" align="top">
                <div
                  className="circle-legend"
                  style={{ backgroundColor: shapeColorRange[sI] }}
                />
                <span>{sO}</span>
              </Space>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  const shapeColors = chain(groupBy(results, "loc"))
    .map((l, lI) => {
      const values = sumBy(l, "marker");
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

    return question && !loading && thresholds.length ? (
      <div className="shape-legend">
        <div>{question?.shapeQuestion?.name}</div>
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
      {loading ? (
        <div className="map-loading">
          <Spin />
        </div>
      ) : (
        <MarkerLegend />
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
              const current = map.getZoom() - 1;
              map.setZoom(current);
              setZoomLevel(current);
            }}
          />
          <Button
            disabled={zoomLevel >= mapMaxZoom}
            type="secondary"
            icon={<ZoomInOutlined />}
            onClick={() => {
              const current = map.getZoom() + 1;
              map.setZoom(current);
              setZoomLevel(current);
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
            {hoveredShape && shapeTooltip && (
              <Tooltip className="shape-tooltip-wrapper">
                {shapeTooltip}
              </Tooltip>
            )}
          </GeoJSON>
        )}
        {!loading && results.length && <Markers data={results} />}
      </MapContainer>
      {!loading && !loadingForm && (
        <ShapeLegend thresholds={colorScale.thresholds()} />
      )}
    </div>
  );
};

export default Map;
