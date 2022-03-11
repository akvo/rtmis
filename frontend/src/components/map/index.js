import React from "react";
import { MapContainer, TileLayer, GeoJSON } from "react-leaflet";
import { geo } from "../../lib";
import "leaflet/dist/leaflet.css";

const { geojson, tile, defaultPos } = geo;
const defPos = defaultPos();

const Map = ({ style }) => {
  return (
    <div className="map-container">
      <MapContainer
        bounds={defPos.bbox}
        zoomControl={false}
        scrollWheelZoom={false}
        style={style}
      >
        <TileLayer {...tile} />
        {geojson.features.length > 0 && (
          <GeoJSON
            key="geodata"
            style={{
              fillColor: "#00989f",
              fillOpacity: 0.5,
              opacity: 0.5,
              color: "#FFF",
            }}
            data={geojson}
          />
        )}
      </MapContainer>
    </div>
  );
};

export default Map;
