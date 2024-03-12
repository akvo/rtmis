import React, { useCallback, useEffect, useMemo, useState } from "react";
import "./style.scss";
import {
  Circle,
  MapContainer,
  TileLayer,
  GeoJSON,
  Tooltip,
} from "react-leaflet";
import { api, config, geo, store, queue } from "../../lib";
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
import { generateAdvanceFilterURL } from "../../util/filter";

const disableMarker = true;

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
  "#BDDF38",
  "#52B0AE",
  "#F2AEAD",
];
const colorRange = ["#bbedda", "#a7e1cb", "#92d5bd", "#7dcaaf", "#67bea1"];
const higlightColor = "#84b4cc";

const Map = ({ current, style }) => {
  const {
    administration,
    selectedForm,
    loadingForm,
    selectedAdministration,
    loadingMap,
    questionGroups,
    advancedFilters,
  } = store.useState((s) => s);
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
    if (maps && administration?.length && selectedForm && current) {
      const pos = getBounds(administration);
      maps.fitBounds(pos.bbox);
      maps.setView(pos.coordinates, maps.getZoom());
      setZoomLevel(maps.getZoom());
      maps.invalidateSize();
    }
  }, [maps, administration, selectedForm, current]);

  const adminName = useMemo(() => {
    return administration.length ? takeRight(administration, 1)[0]?.name : null;
  }, [administration]);

  useEffect(() => {
    if (selectedAdministration && administration.length && loadingMap) {
      const selectedAdmin = takeRight(
        Object.values(selectedAdministration),
        1
      )[0];
      const fetchData = async (adminId, acc) => {
        const adm = await config.fn.administration(adminId);
        acc.unshift(adm);
        if (adm.level > 0) {
          fetchData(adm.parent, acc);
        } else {
          store.update((s) => {
            s.administration = acc;
            s.loadingMap = false;
          });
          queue.update((q) => {
            q.next = 1;
            q.wait = null;
          });
        }
      };
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
    if (administration.length > 0 && results.length && maps) {
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
        fillColor: fillColor,
        fillOpacity: 1,
        opacity: opacity,
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

      let url = `maps/${selectedForm}?shape=${current?.maps?.shape?.id}`;
      url += !disableMarker ? `&marker=${current?.maps?.marker?.id}` : "";
      if (advancedFilters && advancedFilters.length) {
        url = generateAdvanceFilterURL(advancedFilters, url);
      }
      api
        .get(url)
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
          queue.update((q) => {
            q.wait = null;
          });
        });
    }
  }, [selectedForm, current, advancedFilters]);

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
                  {current?.maps?.shape?.title}
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
    if (current && current?.maps?.marker && !disableMarker) {
      return (
        flatten(questionGroups.map((qg) => qg.question))
          .find((q) => q.id === current.maps.marker.id)
          ?.option?.map((o) => {
            const moRes = current.maps.marker.options?.find(
              (mo) => mo.name.toLowerCase() === o.name.toLowerCase()
            );
            return moRes ? { ...o, title: moRes?.rename || moRes?.name } : o;
          }) || []
      );
    }
    return [];
  }, [current, questionGroups]);

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
    if (markerLegendOptions && !disableMarker) {
      return (
        <div className="marker-legend">
          <h4>{current?.maps?.marker?.title}</h4>
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
                  {current?.maps?.marker?.title}
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
        <h4>{current?.maps?.shape?.title}</h4>
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
        MarkerLegend
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
        {!loadingMap && !!results.length && !disableMarker && (
          <Markers data={results} />
        )}
      </MapContainer>
      {!loadingMap && !loadingForm && (
        <ShapeLegend thresholds={colorScale.thresholds()} />
      )}
    </div>
  );
};

export default Map;
