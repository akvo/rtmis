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
import {
  takeRight,
  intersection,
  chain,
  groupBy,
  sumBy,
  flatten,
} from "lodash";
import { Button, Space, Spin, Row, Col } from "antd";
import { scaleQuantize } from "d3-scale";
import {
  ZoomInOutlined,
  ZoomOutOutlined,
  FullscreenOutlined,
} from "@ant-design/icons";
import "leaflet/dist/leaflet.css";

const { geojson, tile, defaultPos, getBounds } = geo;
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
  "#8D8D8D",
];
const colorRange = ["#bbedda", "#a7e1cb", "#92d5bd", "#7dcaaf", "#67bea1"];
const higlightColor = "#84b4cc";

const Map = ({ style }) => {
  const {
    administration,
    selectedForm,
    loadingForm,
    selectedAdministration,
    loadingMap,
    questionGroups,
  } = store.useState((s) => s);
  const [map, setMap] = useState(null);
  const [results, setResults] = useState([]);
  const [zoomLevel, setZoomLevel] = useState(null);
  // shape legend click filter
  const [shapeTooltip, setShapeTooltip] = useState("");
  const [hoveredShape, setHoveredShape] = useState(null);
  const [shapeFilterColor, setShapeFilterColor] = useState(null);
  // marker legend click filter
  const [markerLegendSelected, setMarkerLegendSelected] = useState(null);
  const [current, setCurrent] = useState(null);

  useEffect(() => {
    if (selectedForm && window.visualisation) {
      const configRes = window.visualisation.find((f) => f.id === selectedForm);
      if (configRes) {
        setCurrent(configRes);
      }
    }
  }, [selectedForm]);

  useEffect(() => {
    if (map && administration.length) {
      const pos = getBounds(administration);
      map.fitBounds(pos.bbox);
      setZoomLevel(map.getZoom());
    }
  }, [map, administration]);

  const adminName = useMemo(() => {
    return administration.length ? takeRight(administration, 1)[0]?.name : null;
  }, [administration]);

  useEffect(() => {
    if (selectedAdministration && administration.length && loadingMap) {
      const selectedAdmin = takeRight(
        Object.values(selectedAdministration),
        1
      )[0];
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
              s.loadingAdministration = false;
              s.loadingMap = false;
            });
          }
        });
      };
      store.update((s) => {
        s.loadingAdministration = true;
      });
      fetchData(selectedAdmin, []);
    }
  }, [selectedAdministration, administration, loadingMap]);

  const onEachFeature = (feature, layer) => {
    layer.on({
      click: () => {
        store.update((s) => {
          s.loadingMap = true;
          s.selectedAdministration = feature?.properties;
        });
      },
      mouseover: () => {
        setHoveredShape(feature?.properties);
      },
    });
  };

  const geoStyle = (g) => {
    if (administration.length > 0 && results.length && map) {
      const selectedAdmin = selectedAdministration
        ? takeRight(Object.values(selectedAdministration), 2)[0]
        : null;
      const sc = shapeColors.find(
        (sC) => sC.name === takeRight(Object.values(g.properties), 2)[0]
      );
      const fillColor =
        selectedAdmin === sc?.name
          ? higlightColor
          : sc
          ? getFillColor(sc.values || 0)
          : "#e6e8f4";
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

  useEffect(() => {
    if (current && selectedForm && current.id === selectedForm) {
      store.update((s) => {
        s.loadingMap = true;
      });
      api
        .get(
          `maps/${selectedForm}?marker=${current?.map?.marker?.id}&shape=${current?.map?.shape?.id}`
        )
        .then((res) => {
          setResults(res.data);
        })
        .catch((e) => {
          console.error("e", e);
        })
        .finally(() => {
          store.update((s) => {
            s.loadingMap = false;
          });
        });
    }
  }, [selectedForm, current]);

  useEffect(() => {
    if (hoveredShape && results.length && administration.length) {
      const geoName = takeRight(Object.values(hoveredShape), 2)[0];
      if (geoName) {
        const geoRes = results.filter((r) => r.loc === geoName);
        if (geoRes.length) {
          const tooltipElement = (
            <div className="shape-tooltip-container">
              <h3>{geoName}</h3>
              <Space align="top" direction="horizontal">
                <span className="shape-tooltip-name">
                  {current?.map?.shape?.title}
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
  }, [hoveredShape, results, current, administration, adminName]);

  const markerLegendOptions = useMemo(() => {
    if (current && current?.map?.marker && current.map.marker?.options) {
      return (
        flatten(questionGroups.map((qg) => qg.question)).find(
          (q) => q.id === current.map.marker.id
        )?.option || []
      );
    }
    return [];
  }, [current, questionGroups]);

  const Markers = ({ data }) => {
    if (data.length) {
      const r = 5;
      data = data.filter((d) => d.geo.length === 2);
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
                  {current?.map?.marker?.title}
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

  const MarkerLegend = () => {
    const handleMarkerLegendClick = (value) => {
      if (markerLegendSelected?.id === value.id) {
        setMarkerLegendSelected(null);
        return;
      }
      setMarkerLegendSelected(value);
    };

    if (markerLegendOptions) {
      return (
        <div className="marker-legend">
          <h4>{current?.map?.marker?.title}</h4>
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
                <span>{sO?.name || "NA"}</span>
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
        <div>{current?.map?.shape?.name}</div>
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
            {hoveredShape && shapeTooltip && (
              <Tooltip className="shape-tooltip-wrapper">
                {shapeTooltip}
              </Tooltip>
            )}
          </GeoJSON>
        )}
        {!loadingMap && results.length && <Markers data={results} />}
      </MapContainer>
      {!loadingMap && !loadingForm && (
        <ShapeLegend thresholds={colorScale.thresholds()} />
      )}
    </div>
  );
};

export default Map;
