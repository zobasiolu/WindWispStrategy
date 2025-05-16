import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useGame } from '@/lib/gameContext';
import { KiteSkin } from '@shared/schema';

function KiteSelector() {
  const { selectedSkinId, setSelectedSkinId } = useGame();
  
  // Fetch kite skins
  const { data: kiteSkins = [], isLoading } = useQuery<KiteSkin[]>({
    queryKey: ['/api/kite-skins']
  });
  
  // Select first skin by default if none selected
  useEffect(() => {
    if (kiteSkins.length > 0 && !selectedSkinId) {
      setSelectedSkinId(kiteSkins[0].id.toString());
    }
  }, [kiteSkins, selectedSkinId, setSelectedSkinId]);
  
  if (isLoading) {
    return (
      <div>
        <label className="block text-sm font-medium mb-2">Choose Your Kite</label>
        <div className="grid grid-cols-3 gap-2">
          {[1, 2, 3].map(i => (
            <div key={i} className="aspect-square bg-gray-100 animate-pulse rounded-lg"></div>
          ))}
        </div>
      </div>
    );
  }
  
  return (
    <div>
      <label className="block text-sm font-medium mb-2">Choose Your Kite</label>
      <div className="grid grid-cols-3 gap-2">
        {kiteSkins.map(skin => (
          <div 
            key={skin.id}
            className={`aspect-square bg-white p-2 rounded-lg border-2 cursor-pointer transition flex items-center justify-center
              ${parseInt(selectedSkinId) === skin.id ? 'border-sky-dark' : 'border-transparent hover:border-sky-dark'}`}
            onClick={() => setSelectedSkinId(skin.id.toString())}
          >
            <img 
              src={skin.imageUrl} 
              alt={skin.name} 
              className="w-full h-full object-contain" 
            />
          </div>
        ))}
      </div>
    </div>
  );
}

export default KiteSelector;
