import React from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import markerIcon from "leaflet/dist/images/marker-icon.png";

function Map({ latitude, longitude }) {
  const DefaultIcon = L.icon({
    iconUrl: markerIcon,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    tooltipAnchor: [16, -28],
  });

  L.Marker.prototype.options.icon = DefaultIcon;

  return (
    <MapContainer
      center={[latitude || 27.72037, longitude || 85.36111]} // Use default values if undefined
      zoom={13}
      scrollWheelZoom={false}
      className="map"
      style={{ width: "100%", height: "400px" }}
    >
      <TileLayer
        attribution="&copy; <a href='https://www.openstreetmap.org/copyright'>OpenStreetMap</a> contributors"
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <Marker position={[latitude || 27.72037, longitude || 85.36111]}>
        <Popup>Venue Location</Popup>
      </Marker>
    </MapContainer>
  );
}

export default Map;
