import { MapContainer, TileLayer } from "react-leaflet";
import { geo } from "../../lib";
import "leaflet/dist/leaflet.css";

const defPos = geo.defaultPos();

const Map = ({ style }) => {
  return (
    <div className="map-container">
      <MapContainer
        bounds={defPos.bbox}
        zoomControl={false}
        scrollWheelZoom={false}
        style={style}
      >
        <TileLayer {...geo.tile} />
      </MapContainer>
    </div>
  );
};

export default Map;
