import { useState } from 'react';
import { useGame } from '@/lib/gameContext';
import { Button } from '@/components/ui/button';
import { Kite } from '@shared/schema';
import { msToKmh } from '@/lib/openWeatherAPI';

interface KiteControlPanelProps {
  kite: Kite | null;
  currentWind: { speed: number; direction: number } | null;
  windDirection: string;
}

function KiteControlPanel({ kite, currentWind, windDirection }: KiteControlPanelProps) {
  const { updateKiteAltitude } = useGame();
  
  // Handle altitude change
  const handleAltitudeChange = (altitude: string) => {
    if (kite) {
      updateKiteAltitude(kite.id, altitude);
    }
  };
  
  return (
    <div className="bg-white bg-opacity-70 backdrop-blur-sm rounded-lg p-4 shadow-lg max-w-md mx-auto">
      <h2 className="font-game text-xl mb-3 text-center text-sky-dark">Kite Controls</h2>
      
      {/* Altitude Controls */}
      <div className="mb-4">
        <label className="block text-sm font-medium mb-2">Altitude</label>
        <div className="altitude-selector flex rounded-lg overflow-hidden border border-gray-200">
          <div className="flex-1">
            <input 
              type="radio" 
              id="low-altitude" 
              name="altitude" 
              className="hidden" 
              checked={kite?.altitude === 'low'}
              onChange={() => handleAltitudeChange('low')}
            />
            <label 
              htmlFor="low-altitude" 
              className={`block text-center py-2 cursor-pointer hover:bg-sky-light transition ${
                kite?.altitude === 'low' ? 'bg-sky-dark text-white' : ''
              }`}
              onClick={() => handleAltitudeChange('low')}
            >
              <i className="fas fa-arrow-down mr-1"></i> Low
            </label>
          </div>
          <div className="flex-1">
            <input 
              type="radio" 
              id="mid-altitude" 
              name="altitude" 
              className="hidden" 
              checked={kite?.altitude === 'mid'}
              onChange={() => handleAltitudeChange('mid')}
            />
            <label 
              htmlFor="mid-altitude" 
              className={`block text-center py-2 cursor-pointer hover:bg-sky-light transition ${
                kite?.altitude === 'mid' ? 'bg-sky-dark text-white' : ''
              }`}
              onClick={() => handleAltitudeChange('mid')}
            >
              <i className="fas fa-equals mr-1"></i> Mid
            </label>
          </div>
          <div className="flex-1">
            <input 
              type="radio" 
              id="high-altitude" 
              name="altitude" 
              className="hidden" 
              checked={kite?.altitude === 'high'}
              onChange={() => handleAltitudeChange('high')}
            />
            <label 
              htmlFor="high-altitude" 
              className={`block text-center py-2 cursor-pointer hover:bg-sky-light transition ${
                kite?.altitude === 'high' ? 'bg-sky-dark text-white' : ''
              }`}
              onClick={() => handleAltitudeChange('high')}
            >
              <i className="fas fa-arrow-up mr-1"></i> High
            </label>
          </div>
        </div>
      </div>
      
      {/* Wind Info and Action Buttons */}
      <div className="flex justify-between items-center">
        {/* Current Wind Info */}
        <div className="bg-sky-light p-2 rounded-lg">
          <div className="text-sm font-medium mb-1">Current Wind</div>
          <div className="flex items-center">
            <div className="mr-3">
              <span className="font-mono font-bold">
                {currentWind ? msToKmh(currentWind.speed).toFixed(1) : '--'}
              </span>
              <span className="text-sm">km/h</span>
            </div>
            <div 
              className="w-6 h-6 bg-sky-mid rounded-full flex items-center justify-center" 
              style={{ transform: currentWind ? `rotate(${currentWind.direction}deg)` : 'rotate(0)' }}
            >
              <i className="fas fa-arrow-up text-white"></i>
            </div>
            <span className="ml-1 font-mono">{windDirection}</span>
          </div>
        </div>
        
        {/* Coin Counter */}
        <div className="bg-wind-yellow p-2 rounded-lg">
          <div className="text-sm font-medium mb-1">Coins Collected</div>
          <div className="flex items-center justify-center">
            <i className="fas fa-coins text-wind-orange mr-2"></i>
            <span className="font-mono font-bold text-lg">{kite?.coins || 0}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default KiteControlPanel;
