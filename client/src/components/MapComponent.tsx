'use client';

import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { useEffect } from 'react';
import { LocateFixed } from 'lucide-react';

// Fix Leaflet Default Icon Issue in Next.js
const icon = typeof window !== 'undefined' ? L.icon({
    iconUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png",
    iconRetinaUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png",
    shadowUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
}) : null;

function LocationMarker({ position, setPosition }: { position: [number, number], setPosition: (pos: [number, number]) => void }) {
    const map = useMapEvents({
        click(e) {
            setPosition([e.latlng.lat, e.latlng.lng]);
        },
    });

    useEffect(() => {
        if (position) {
            map.flyTo(position, map.getZoom());
        }
    }, [position, map]);

    return position === null || !icon ? null : (
        <Marker position={position} icon={icon} />
    );
}

interface MapComponentProps {
    position: [number, number];
    setPosition: (pos: [number, number]) => void;
}

export default function MapComponent({ position, setPosition }: MapComponentProps) {
    const handleLocateMe = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if ("geolocation" in navigator) {
            navigator.geolocation.getCurrentPosition((pos) => {
                setPosition([pos.coords.latitude, pos.coords.longitude]);
            }, (err) => {
                console.error("Geolocation error:", err);
                alert("Could not detect your location. Please check your browser's location permissions.");
            });
        } else {
            alert("Geolocation is not supported by your browser.");
        }
    };

    return (
        <div className="relative w-full h-full min-h-[300px]">
            <button
                onClick={handleLocateMe}
                className="absolute top-4 right-4 z-[1000] bg-white p-2 rounded-full shadow-lg hover:bg-gray-100 transition-colors border border-gray-200"
                title="Locate Me"
                type="button"
            >
                <LocateFixed className="w-5 h-5 text-gray-700" />
            </button>
            <MapContainer center={position} zoom={13} scrollWheelZoom={false} style={{ height: '100%', width: '100%' }}>
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <LocationMarker position={position} setPosition={setPosition} />
            </MapContainer>
        </div>
    );
}

