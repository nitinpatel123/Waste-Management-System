import { useEffect } from 'react';
import { MapContainer, TileLayer, CircleMarker, useMap, useMapEvents } from 'react-leaflet';

// Key-free OpenStreetMap tiles. The dark look comes from a CSS filter (see index.css).
// CARTO's dark tiles now need an API key, so we no longer use them.
export const DARK_TILES =
  `https://api.maptiler.com/maps/streets/{z}/{x}/{y}.png?key=${import.meta.env.NDaPdsyx52Z4SejxaNTh}`;
export const TILE_ATTR = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';
export const DEFAULT_CENTER = [26.4499, 80.3319]; // set your city center here

function Clicker({ onPick }) {
  useMapEvents({ click: (e) => onPick({ lat: e.latlng.lat, lng: e.latlng.lng }) });
  return null;
}

// Moves the map only when the pin is outside the visible area (for example after "Use my location").
function Follow({ value }) {
  const map = useMap();
  useEffect(() => {
    if (!value) return;
    const p = [value.lat, value.lng];
    if (!map.getBounds().contains(p)) map.flyTo(p, Math.max(map.getZoom(), 15), { duration: 0.6 });
  }, [value?.lat, value?.lng]);
  return null;
}

export default function LocationPicker({ value, onChange }) {
  return (
    <MapContainer center={DEFAULT_CENTER} zoom={13} className="h-64 rounded-xl z-0 border border-white/10">
      <TileLayer url={DARK_TILES} attribution={TILE_ATTR} />
      <Clicker onPick={onChange} />
      <Follow value={value} />
      {value && <CircleMarker center={[value.lat, value.lng]} radius={10} pathOptions={{ color: '#34d399', fillOpacity: 0.6 }} />}
    </MapContainer>
  );
}
