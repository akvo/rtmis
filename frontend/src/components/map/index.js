import React, { useEffect, useState } from "react";
import { MapContainer, TileLayer, GeoJSON } from "react-leaflet";
import { geo, store } from "../../lib";
import "leaflet/dist/leaflet.css";

const { geojson, tile, defaultPos, getBounds } = geo;
const defPos = defaultPos();

const Map = ({ style }) => {
  const { administration } = store.useState((s) => s);
  const [map, setMap] = useState(null);

  useEffect(() => {
    if (map && administration.length) {
      const pos = getBounds(administration);
      map.fitBounds(pos.bbox);
    }
  }, [map, administration]);
  return (
    <div className="map-container">
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
