import { useEffect, useState } from 'react';
import { Marker, Popup } from 'react-leaflet';
import L from 'leaflet';

interface WindCoinProps {
  position: [number, number];
  value: number;
}

function WindCoin({ position, value }: WindCoinProps) {
  const [icon, setIcon] = useState<L.DivIcon | null>(null);
  
  useEffect(() => {
    // Create coin icon
    const coinIcon = L.divIcon({
      className: 'wind-coin',
      html: `
        <div class="w-6 h-6 rounded-full bg-wind-yellow border-2 border-wind-orange flex items-center justify-center text-wind-orange animate-pulse-slow">
          <i class="fas fa-wind text-xs"></i>
        </div>
      `,
      iconSize: [24, 24],
      iconAnchor: [12, 12]
    });
    
    setIcon(coinIcon);
  }, [value]);
  
  if (!icon) return null;
  
  return (
    <Marker position={position} icon={icon}>
      <Popup>
        <div className="text-center">
          <h3 className="font-bold text-wind-orange">Wind Coin</h3>
          <p>Value: {value}</p>
        </div>
      </Popup>
    </Marker>
  );
}

export default WindCoin;
