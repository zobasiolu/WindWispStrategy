import { useEffect, useRef, useState } from 'react';
import { Map, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { useGame } from '@/lib/gameContext';
import { Button } from '@/components/ui/button';
import WindCoin from './WindCoin';
import StormVortex from './StormVortex';
import { Kite, GameEvent } from '@shared/schema';

// Custom marker icons
const createKiteIcon = (imageUrl: string, altitude: string) => {
  return L.divIcon({
    className: 'kite-marker',
    html: `
      <div class="relative kite-flutter">
        <img src="${imageUrl}" alt="Kite" class="w-10 h-10 object-contain" />
        <div class="absolute -bottom-1 left-1/2 transform -translate-x-1/2 bg-white text-xs px-1 rounded shadow-sm">
          <span class="font-bold text-sky-dark">${altitude.charAt(0).toUpperCase() + altitude.slice(1)}</span>
        </div>
      </div>
    `,
    iconSize: [40, 40],
    iconAnchor: [20, 20]
  });
};

interface MapComponentProps {
  kites: Kite[];
  gameEvents: GameEvent[];
}

function MapComponent({ kites, gameEvents }: MapComponentProps) {
  const mapRef = useRef<L.Map | null>(null);
  const [mapReady, setMapReady] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [selectedAltitude, setSelectedAltitude] = useState('mid');
  const { placeKite, userKite, getKiteSkin, currentRoom } = useGame();
  
  // Set up map when component mounts
  const MapSetup = () => {
    const map = useMap();
    
    useEffect(() => {
      if (map && !mapRef.current) {
        mapRef.current = map;
        setMapReady(true);
        
        // Center map on a default location
        map.setView([0, 0], 2);
        
        // Add click handler
        map.on('click', (e) => {
          if (userKite || currentRoom?.status !== 'waiting') return;
          setSelectedLocation({ lat: e.latlng.lat, lng: e.latlng.lng });
        });
      }
    }, [map]);
    
    return null;
  };
  
  // Place kite handler
  const handlePlaceKite = () => {
    if (!selectedLocation) return;
    
    placeKite(selectedLocation.lat, selectedLocation.lng, selectedAltitude);
    setSelectedLocation(null);
  };
  
  // Follow user's kite when it moves
  useEffect(() => {
    if (mapRef.current && userKite && currentRoom?.status === 'playing') {
      mapRef.current.panTo([userKite.latitude, userKite.longitude], {
        animate: true,
        duration: 1
      });
    }
  }, [userKite, currentRoom]);
  
  return (
    <div className="h-full w-full bg-sky-light">
      <Map className="h-full w-full z-0" doubleClickZoom={false}>
        <MapSetup />
        
        {/* Base map layer */}
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        
        {/* Display all kites */}
        {mapReady && kites.map(kite => (
          <Marker
            key={kite.id}
            position={[kite.latitude, kite.longitude]}
            icon={createKiteIcon(getKiteSkin(kite.skinId), kite.altitude)}
          >
            <Popup>
              <div className="text-center">
                <p className="font-bold">{kite.userId === parseInt(kite.userId.toString()) ? 'Your Kite' : `Player ${kite.userId}`}</p>
                <p>Altitude: {kite.altitude}</p>
                <p>Coins: {kite.coins}</p>
              </div>
            </Popup>
          </Marker>
        ))}
        
        {/* Display wind coins */}
        {mapReady && gameEvents.filter(event => event.type === 'coin').map(coin => (
          <WindCoin
            key={coin.id}
            position={[coin.latitude, coin.longitude]}
            value={coin.value}
          />
        ))}
        
        {/* Display storm vortices */}
        {mapReady && gameEvents.filter(event => event.type === 'storm').map(storm => (
          <StormVortex
            key={storm.id}
            position={[storm.latitude, storm.longitude]}
            radius={storm.radius || 0.001}
          />
        ))}
        
        {/* Selected location marker for placing a new kite */}
        {mapReady && selectedLocation && (
          <Marker
            position={[selectedLocation.lat, selectedLocation.lng]}
            icon={createKiteIcon(getKiteSkin(selectedLocation.toString()), selectedAltitude)}
          >
            <Popup>
              <div className="p-2">
                <h3 className="font-bold text-sky-dark mb-2">Place Your Kite</h3>
                <div className="mb-2">
                  <p className="text-sm mb-1">Select Altitude:</p>
                  <div className="flex space-x-1">
                    {['low', 'mid', 'high'].map(altitude => (
                      <Button
                        key={altitude}
                        size="sm"
                        variant={selectedAltitude === altitude ? "default" : "outline"}
                        className={selectedAltitude === altitude ? "bg-sky-dark" : ""}
                        onClick={() => setSelectedAltitude(altitude)}
                      >
                        {altitude.charAt(0).toUpperCase() + altitude.slice(1)}
                      </Button>
                    ))}
                  </div>
                </div>
                <Button 
                  className="w-full bg-sky-dark hover:bg-sky-dark/90"
                  onClick={handlePlaceKite}
                >
                  Confirm Placement
                </Button>
              </div>
            </Popup>
          </Marker>
        )}
      </Map>
    </div>
  );
}

export default MapComponent;
