import { useEffect, useState } from 'react';
import { Circle, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';

interface StormVortexProps {
  position: [number, number];
  radius: number;
}

function StormVortex({ position, radius }: StormVortexProps) {
  const [icon, setIcon] = useState<L.DivIcon | null>(null);
  
  useEffect(() => {
    // Create storm icon
    const stormIcon = L.divIcon({
      className: 'storm-vortex',
      html: `
        <div class="w-20 h-20 rounded-full bg-storm-purple bg-opacity-40 flex items-center justify-center animate-spin-slow">
          <div class="w-12 h-12 rounded-full bg-storm-purple bg-opacity-60 flex items-center justify-center">
            <div class="w-6 h-6 rounded-full bg-storm-dark"></div>
          </div>
        </div>
      `,
      iconSize: [80, 80],
      iconAnchor: [40, 40]
    });
    
    setIcon(stormIcon);
  }, []);
  
  if (!icon) return null;
  
  // Convert radius from degrees to meters (approximate)
  const radiusInMeters = radius * 111000; // 1 degree ≈ 111km at the equator
  
  return (
    <>
      <Circle 
        center={position}
        radius={radiusInMeters}
        pathOptions={{
          color: '#8B75CA',
          fillColor: '#8B75CA',
          fillOpacity: 0.2
        }}
      />
      <Marker position={position} icon={icon}>
        <Popup>
          <div className="text-center">
            <h3 className="font-bold text-storm-purple">Storm Vortex</h3>
            <p>Beware! This storm will pull your kite towards its center.</p>
          </div>
        </Popup>
      </Marker>
    </>
  );
}

export default StormVortex;
