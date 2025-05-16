import { useEffect, useState, useRef } from 'react';
import { useParams, useLocation } from 'wouter';
import { useGame } from '@/lib/gameContext';
import MapComponent from '@/components/MapComponent';
import KiteControlPanel from '@/components/KiteControlPanel';
import Leaderboard from '@/components/Leaderboard';
import GameNotification from '@/components/GameNotification';
import { Button } from '@/components/ui/button';
import { fetchWindData, degreesToCardinal } from '@/lib/openWeatherAPI';

function Game() {
  const { roomId } = useParams();
  const [, navigate] = useLocation();
  const { 
    currentRoom, 
    joinRoom, 
    leaveRoom, 
    kites, 
    gameEvents,
    userKite,
    getPlayerUsername,
    startGame
  } = useGame();
  
  const [notifications, setNotifications] = useState<{ id: number; message: string }[]>([]);
  const [currentWindData, setCurrentWindData] = useState<{ speed: number; direction: number } | null>(null);
  const notificationIdRef = useRef(0);
  
  // Join the room when component mounts
  useEffect(() => {
    if (roomId) {
      joinRoom(parseInt(roomId));
    }
    
    // Cleanup: leave room when component unmounts
    return () => {
      leaveRoom();
    };
  }, [roomId, joinRoom, leaveRoom]);
  
  // Fetch wind data for current location periodically
  useEffect(() => {
    if (!userKite) return;
    
    const fetchCurrentWind = async () => {
      const windData = await fetchWindData(userKite.latitude, userKite.longitude);
      if (windData) {
        setCurrentWindData({
          speed: windData.speed,
          direction: windData.direction
        });
      }
    };
    
    fetchCurrentWind();
    const interval = setInterval(fetchCurrentWind, 60000); // Update every minute
    
    return () => clearInterval(interval);
  }, [userKite]);
  
  // Add notification when kites collide (simplified approximation)
  useEffect(() => {
    if (kites.length < 2 || !userKite) return;
    
    // Check for collisions with user's kite
    kites.forEach(otherKite => {
      if (otherKite.id === userKite.id) return;
      
      // Simple collision detection (0.0001 degrees ≈ 11m)
      const distance = Math.sqrt(
        Math.pow(userKite.latitude - otherKite.latitude, 2) + 
        Math.pow(userKite.longitude - otherKite.longitude, 2)
      );
      
      if (distance < 0.0003) { // Collision radius
        // Add collision notification
        const otherPlayerName = getPlayerUsername(otherKite.userId);
        const collisionMessages = [
          `Breezy bump! Your kite collided with ${otherPlayerName}'s.`,
          `Whoosh! A mid-air tangle with ${otherPlayerName}'s kite!`,
          `The winds brought you and ${otherPlayerName} together!`,
          `Your strings crossed with ${otherPlayerName} in the breeze!`
        ];
        
        const message = collisionMessages[Math.floor(Math.random() * collisionMessages.length)];
        
        // Add notification with unique ID
        const id = notificationIdRef.current++;
        setNotifications(prev => [...prev, { id, message }]);
        
        // Remove notification after 5 seconds
        setTimeout(() => {
          setNotifications(prev => prev.filter(n => n.id !== id));
        }, 5000);
      }
    });
  }, [kites, userKite, getPlayerUsername]);
  
  // Handle back to lobby
  const handleBackToLobby = () => {
    leaveRoom();
    navigate('/');
  };
  
  // Handle start game
  const handleStartGame = () => {
    if (roomId && currentRoom?.status === 'waiting') {
      startGame(parseInt(roomId));
    }
  };
  
  return (
    <div className="min-h-screen flex flex-col bg-sky-light relative">
      {/* World Map - Main Game Area */}
      <div className="absolute inset-0 z-0">
        <MapComponent 
          kites={kites} 
          gameEvents={gameEvents}
        />
      </div>
      
      {/* Game Controls Overlay */}
      <div className="relative z-10 pointer-events-none w-full h-full p-4 flex flex-col">
        {/* Top Bar */}
        <div className="flex justify-between mb-4 pointer-events-auto">
          {/* Match Info */}
          <div className="bg-white bg-opacity-70 backdrop-blur-sm rounded-lg p-2 shadow-lg">
            <div className="flex items-center">
              <div className="mr-3">
                <p className="text-sm font-medium">Room:</p>
                <p className="font-game font-bold text-sky-dark">{currentRoom?.name || 'Loading...'}</p>
              </div>
              <div>
                <p className="text-sm font-medium">Status:</p>
                <p className="font-mono font-bold">{currentRoom?.status || 'loading'}</p>
              </div>
            </div>
          </div>
          
          {/* Player Scores */}
          <Leaderboard kites={kites} />
        </div>
        
        {/* Spacer */}
        <div className="flex-grow"></div>
        
        {/* Bottom Controls */}
        <div className="pointer-events-auto">
          {currentRoom?.status === 'waiting' ? (
            <div className="bg-white bg-opacity-70 backdrop-blur-sm rounded-lg p-4 shadow-lg max-w-md mx-auto">
              <h2 className="font-game text-xl mb-3 text-center text-sky-dark">Game Lobby</h2>
              <p className="text-center mb-4">
                {userKite 
                  ? "Your kite is placed on the map. Waiting for the game to start..." 
                  : "Click on the map to place your kite!"}
              </p>
              <div className="flex justify-center gap-3">
                <Button 
                  variant="outline"
                  onClick={handleBackToLobby}
                >
                  Back to Lobby
                </Button>
                <Button 
                  className="bg-sky-dark hover:bg-sky-dark/90"
                  onClick={handleStartGame}
                  disabled={!userKite}
                >
                  Start Game
                </Button>
              </div>
            </div>
          ) : (
            <KiteControlPanel 
              kite={userKite} 
              currentWind={currentWindData}
              windDirection={currentWindData ? degreesToCardinal(currentWindData.direction) : 'N/A'}
            />
          )}
        </div>
      </div>
      
      {/* Notification Center */}
      <div className="absolute top-16 right-4 w-64 z-20 space-y-2 pointer-events-none">
        {notifications.map(notification => (
          <GameNotification 
            key={notification.id}
            message={notification.message}
          />
        ))}
      </div>
    </div>
  );
}

export default Game;
