import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import { tileLayer } from "../../util/tileLayer";
import "leaflet/dist/leaflet.css";

import L from "leaflet";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require("leaflet/dist/images/marker-icon-2x.png"),
  iconUrl: require("leaflet/dist/images/marker-icon.png"),
  shadowUrl: require("leaflet/dist/images/marker-shadow.png"),
});
const position = [0, 0];

const Map = ({ markerData, style }) => {
  return (
    <div className="map-container">
      <MapContainer
        center={position}
        zoom={false}
        scrollWheelZoom={false}
        style={style}
      >
        {markerData.features.map((park) => (
          <Marker
            key={park.properties.PARK_ID}
            position={[
              park.geometry.coordinates[1],
              park.geometry.coordinates[0],
            ]}
          >
            <Popup>
              <span>{park.properties.NAME}</span>
            </Popup>
          </Marker>
        ))}
        <TileLayer {...tileLayer} />
      </MapContainer>
    </div>
  );
};

export default Map;
