import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useGameSocket } from './gameSocket';
import { useToast } from '@/hooks/use-toast';
import { KiteSkin, Room, Kite, GameEvent, RoomPlayer } from '@shared/schema';

interface GameContextProps {
  username: string;
  setUsername: (name: string) => void;
  selectedSkinId: string;
  setSelectedSkinId: (id: string) => void;
  isConnected: boolean;
  currentRoom: Room | null;
  players: RoomPlayer[];
  kites: Kite[];
  gameEvents: GameEvent[];
  joinRoom: (roomId: number) => void;
  leaveRoom: () => void;
  placeKite: (latitude: number, longitude: number, altitude: string) => void;
  updateKiteAltitude: (kiteId: number, altitude: string) => void;
  startGame: (roomId: number) => void;
  userKite: Kite | null;
  getPlayerUsername: (userId: number) => string;
  getKiteSkin: (skinId: string) => string;
  windData: Record<string, { speed: number, direction: number }>;
}

const GameContext = createContext<GameContextProps | undefined>(undefined);

export const GameProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [username, setUsername] = useState<string>(() => {
    return localStorage.getItem('username') || `Player${Math.floor(Math.random() * 1000)}`;
  });
  const [selectedSkinId, setSelectedSkinId] = useState<string>('1');
  const [currentRoom, setCurrentRoom] = useState<Room | null>(null);
  const [players, setPlayers] = useState<RoomPlayer[]>([]);
  const [kites, setKites] = useState<Kite[]>([]);
  const [gameEvents, setGameEvents] = useState<GameEvent[]>([]);
  const [usernames, setUsernames] = useState<Record<number, string>>({});
  const [kiteSkins, setKiteSkins] = useState<Record<string, string>>({});
  const [windData, setWindData] = useState<Record<string, { speed: number, direction: number }>>({});
  
  const { toast } = useToast();
  
  // Store username in localStorage when it changes
  useEffect(() => {
    localStorage.setItem('username', username);
  }, [username]);
  
  // Setup WebSocket connection and message handling
  const { isConnected, sendMessage } = useGameSocket({
    onMessage: (message) => {
      try {
        const data = JSON.parse(message);
        
        switch (data.type) {
          case 'roomState':
            setCurrentRoom(data.room);
            setPlayers(data.players);
            setKites(data.kites);
            break;
            
          case 'updateKite':
            if (data.kite.id === 0) {
              // This is a signal to refresh all kites for this room
              fetchKites(data.kite.roomId);
            } else {
              setKites(prev => 
                prev.map(k => k.id === data.kite.id ? { ...k, ...data.kite } : k)
              );
            }
            break;
            
          case 'collectCoin':
            setGameEvents(prev => prev.filter(e => e.id !== data.eventId));
            setKites(prev => 
              prev.map(k => k.id === data.kiteId ? { ...k, coins: (k.coins || 0) + 1 } : k)
            );
            break;
            
          case 'newStorm':
            setGameEvents(prev => [...prev, data.event]);
            break;
            
          case 'gameStart':
            if (currentRoom?.id === data.roomId) {
              setCurrentRoom(prev => prev ? { ...prev, status: 'playing' } : null);
              toast({
                title: "Game Started!",
                description: "The wind is picking up...",
              });
            }
            break;
            
          case 'gameEnd':
            if (currentRoom?.id === data.roomId) {
              setCurrentRoom(prev => prev ? { ...prev, status: 'finished' } : null);
              
              const winnerUsername = usernames[data.winner] || 'Unknown Player';
              toast({
                title: "Game Over!",
                description: `${winnerUsername} has won the game!`,
              });
              
              // Redirect to recap page
              window.location.href = `/recap/${data.roomId}`;
            }
            break;
            
          case 'windUpdate':
            const newWindData: Record<string, { speed: number, direction: number }> = {};
            data.windData.forEach((wd: any) => {
              const key = `${wd.latitude.toFixed(1)},${wd.longitude.toFixed(1)}`;
              newWindData[key] = { speed: wd.speed, direction: wd.direction };
            });
            setWindData(prev => ({ ...prev, ...newWindData }));
            break;
        }
      } catch (error) {
        console.error("Error processing WebSocket message:", error);
      }
    },
    onError: (error) => {
      console.error("WebSocket error:", error);
      toast({
        variant: "destructive",
        title: "Connection Error",
        description: "Failed to connect to game server.",
      });
    }
  });
  
  // Fetch kites for a specific room
  const fetchKites = async (roomId: number) => {
    try {
      const response = await fetch(`/api/rooms/${roomId}`);
      if (response.ok) {
        const data = await response.json();
        setKites(data.kites);
      }
    } catch (error) {
      console.error("Error fetching kites:", error);
    }
  };
  
  // Fetch usernames for player IDs
  useEffect(() => {
    const fetchUsernames = async () => {
      const userIds = [...new Set(players.map(p => p.userId))];
      
      for (const userId of userIds) {
        if (!usernames[userId]) {
          try {
            // In a real implementation, we'd fetch the username from an API
            // For now, we'll use a placeholder
            setUsernames(prev => ({ 
              ...prev, 
              [userId]: players.find(p => p.userId === userId)?.userId === parseInt(username) 
                ? username 
                : `Player${userId}` 
            }));
          } catch (error) {
            console.error(`Error fetching username for user ${userId}:`, error);
          }
        }
      }
    };
    
    fetchUsernames();
  }, [players, usernames, username]);
  
  // Fetch kite skins
  useEffect(() => {
    const fetchKiteSkins = async () => {
      try {
        const response = await fetch('/api/kite-skins');
        if (response.ok) {
          const skins = await response.json() as KiteSkin[];
          const skinMap: Record<string, string> = {};
          skins.forEach(skin => {
            skinMap[skin.id.toString()] = skin.imageUrl;
          });
          setKiteSkins(skinMap);
        }
      } catch (error) {
        console.error("Error fetching kite skins:", error);
      }
    };
    
    fetchKiteSkins();
  }, []);
  
  // Join a room
  const joinRoom = (roomId: number) => {
    if (isConnected) {
      sendMessage({
        type: 'joinRoom',
        roomId,
        username
      });
    } else {
      toast({
        variant: "destructive",
        title: "Connection Error",
        description: "Not connected to game server.",
      });
    }
  };
  
  // Leave the current room
  const leaveRoom = () => {
    if (isConnected && currentRoom) {
      sendMessage({
        type: 'leaveRoom',
        roomId: currentRoom.id,
        userId: parseInt(username) // This is a hack for our simplified auth
      });
      setCurrentRoom(null);
      setPlayers([]);
      setKites([]);
      setGameEvents([]);
    }
  };
  
  // Place a kite on the map
  const placeKite = (latitude: number, longitude: number, altitude: string) => {
    if (isConnected && currentRoom) {
      // We're using username as user ID for simplicity in this demo
      const userId = parseInt(username);
      
      sendMessage({
        type: 'placeKite',
        kite: {
          userId,
          roomId: currentRoom.id,
          latitude,
          longitude,
          altitude,
          skinId: selectedSkinId
        }
      });
    }
  };
  
  // Update a kite's altitude
  const updateKiteAltitude = (kiteId: number, altitude: string) => {
    if (isConnected) {
      sendMessage({
        type: 'updateKite',
        kite: {
          id: kiteId,
          altitude
        }
      });
    }
  };
  
  // Start the game
  const startGame = (roomId: number) => {
    if (isConnected) {
      sendMessage({
        type: 'gameStart',
        roomId
      });
    }
  };
  
  // Get the user's kite in the current room
  const userKite = kites.find(k => k.userId === parseInt(username));
  
  // Function to get username by user ID
  const getPlayerUsername = (userId: number) => {
    return usernames[userId] || `Player${userId}`;
  };
  
  // Function to get kite skin URL by skin ID
  const getKiteSkin = (skinId: string) => {
    return kiteSkins[skinId] || 'https://pixabay.com/get/ge4782ff9c3515d9c32969cc1080b30c45101ed4301a83725df809a3f15c49334b23d28992f10ffbe39233f62c8b324e267c2bc618270ce8bf25a4d210b71a0cb_1280.jpg';
  };
  
  const value = {
    username,
    setUsername,
    selectedSkinId,
    setSelectedSkinId,
    isConnected,
    currentRoom,
    players,
    kites,
    gameEvents,
    joinRoom,
    leaveRoom,
    placeKite,
    updateKiteAltitude,
    startGame,
    userKite,
    getPlayerUsername,
    getKiteSkin,
    windData
  };
  
  return (
    <GameContext.Provider value={value}>
      {children}
    </GameContext.Provider>
  );
};

export const useGame = () => {
  const context = useContext(GameContext);
  if (context === undefined) {
    throw new Error('useGame must be used within a GameProvider');
  }
  return context;
};
