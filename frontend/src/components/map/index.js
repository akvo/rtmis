import React, { useEffect, useState } from "react";
import "./style.scss";
import {
  Circle,
  MapContainer,
  TileLayer,
  GeoJSON,
  Tooltip,
} from "react-leaflet";
import { api, geo, store } from "../../lib";
import { takeRight } from "lodash";
import { Button, Space } from "antd";
import {
  ZoomInOutlined,
  ZoomOutOutlined,
  FullscreenOutlined,
} from "@ant-design/icons";
import "leaflet/dist/leaflet.css";

const { geojson, shapeLevels, tile, defaultPos, getBounds } = geo;
const defPos = defaultPos();
const mapMaxZoom = 13;

const Map = ({ style, question }) => {
  const { administration, selectedForm } = store.useState((s) => s);
  const [map, setMap] = useState(null);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState([]);
  const [selectedShape, setSelectedShape] = useState(null);
  const [hoveredShape, setHoveredShape] = useState(null);
  const [zoomLevel, setZoomLevel] = useState(null);
  const [shapeTooltip, setShapeTooltip] = useState("");
  useEffect(() => {
    if (map && administration.length) {
      const pos = getBounds(administration);
      map.fitBounds(pos.bbox);
      setZoomLevel(map.getZoom());
    }
  }, [map, administration]);

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
      const adminName = takeRight(administration, 1)[0]?.name;
      const geoSelected = adminName === gname;

      const geoname = takeRight(Object.values(g.properties), 1)[0];
      let gRes = null;
      if (geoname) {
        gRes = results.find((r) => r.loc === geoname);
      }
      let fillColor = geoSelected ? "#e6e8f4" : "#fff";
      if (gRes) {
        fillColor = "#0057ff";
      }
      return {
        fillColor,
        fillOpacity: geoSelected ? 1 : 0.1,
        opacity: geoSelected ? 0.8 : 0.1,
        color: "#fff",
      };
    }
    return {
      fillColor: "#e6e8f4",
      fillOpacity: 0.1,
      opacity: 0.8,
      color: "#fff",
    };
  };

  useEffect(() => {
    if (question && selectedForm) {
      setLoading(true);
      api
        .get(
          `maps/${selectedForm}?marker=${question?.markerQuestion?.id}&shape=${question?.shapeQuestion?.id}`
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
      const geoName =
        Object.values(hoveredShape)[Object.values(hoveredShape).length - 1];
      if (geoName) {
        const geoRes = results.find((r) => r.loc === geoName);
        if (geoRes) {
          const tooltipElement = (
            <div className="shape-tooltip-container">
              <h3>{geoName}</h3>
              <Space align="top" direction="horizontal">
                <span className="shape-tooltip-name">
                  {question?.markerQuestion?.name}
                </span>
                <h3 className="shape-tooltip-value">{geoRes.marker}</h3>
              </Space>
            </div>
          );
          setShapeTooltip(tooltipElement);
          return;
        }
      }
      setShapeTooltip(null);
    }
  }, [hoveredShape, results, question]);

  const Markers = ({ data }) => {
    if (data.length) {
      data = data.filter((d) => d.geo.length === 2);
      return data.map(({ id, geo, shape, name }) => {
        return (
          <Circle
            key={id}
            center={{ lat: geo[1], lng: geo[0] }}
            pathOptions={{
              fillColor: "#7EE8B5",
              color: "#7EE8B5",
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
                  {question?.shapeQuestion?.name}
                </div>
                <div className="shape-tooltip-value">{shape}</div>
              </div>
            </Tooltip>
          </Circle>
        );
      });
    }
    return null;
  };

  return (
    <div className="map-container">
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
          >
            {hoveredShape && shapeTooltip && (
              <Tooltip className="shape-tooltip-container">
                {shapeTooltip}
              </Tooltip>
            )}
          </GeoJSON>
        )}
        {!loading && results.length && <Markers data={results} />}
      </MapContainer>
    </div>
  );
};

export default Map;
