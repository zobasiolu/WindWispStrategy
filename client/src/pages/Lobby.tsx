import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { apiRequest } from '@/lib/queryClient';
import { useGame } from '@/lib/gameContext';
import { queryClient } from '@/lib/queryClient';
import KiteSelector from '@/components/KiteSelector';
import RoomList from '@/components/RoomList';
import { Room } from '@shared/schema';

function Lobby() {
  const [roomName, setRoomName] = useState('');
  const [, navigate] = useLocation();
  const { 
    username, 
    setUsername, 
    joinRoom,
    selectedSkinId,
    isConnected
  } = useGame();
  
  // Fetch rooms
  const { data: rooms = [], isLoading: isLoadingRooms } = useQuery({
    queryKey: ['/api/rooms'],
    refetchInterval: 5000 // Refresh every 5 seconds
  });
  
  // Create room mutation
  const createRoomMutation = useMutation({
    mutationFn: async (name: string) => {
      const response = await apiRequest('POST', '/api/rooms', {
        name,
        creatorId: parseInt(username), // Convert username to numeric ID for simplicity
        maxPlayers: 4,
        targetCoins: 500
      });
      return await response.json();
    },
    onSuccess: (data: Room) => {
      queryClient.invalidateQueries({ queryKey: ['/api/rooms'] });
      joinRoom(data.id);
      navigate(`/game/${data.id}`);
    }
  });
  
  // Handle room creation
  const handleCreateRoom = () => {
    if (!roomName) return;
    createRoomMutation.mutate(roomName);
  };
  
  // Handle room joining
  const handleJoinRoom = (roomId: number) => {
    joinRoom(roomId);
    navigate(`/game/${roomId}`);
  };
  
  return (
    <div className="min-h-screen w-full flex flex-col font-body bg-sky-light">
      <div className="container mx-auto px-4 py-8 flex flex-col items-center justify-center flex-grow">
        {/* Logo and Title */}
        <div className="text-center mb-8">
          <h1 className="font-game text-5xl sm:text-6xl font-bold text-sky-dark mb-2 animate-float">
            Wind Whisperers
          </h1>
          <p className="text-lg text-gray-600">Real-time Wind Strategy Game</p>
        </div>
        
        {/* Animated Kite illustrations */}
        <div className="relative w-full max-w-3xl h-40 mb-8">
          <img 
            src="https://pixabay.com/get/g5728381f2a0852883dc6ee3cc520ac4531445e8128ae4ab5f14e6bed0e83975d74f7afc061f1a197f5a145370cc9e30c4a7f26be7382d5239d1e4f3cdbde77df_1280.jpg" 
            alt="Colorful kite in sky" 
            className="absolute top-0 left-1/4 w-20 h-20 object-contain kite-flutter" 
          />
          <img 
            src="https://pixabay.com/get/g06dcc37e70d077153984255b55fe82ff332f473b8e4f86c2c248572efdee36d1602a179a51287a97a17159e5bb345518e1c87cd1a0b645f80d313c9ea8777b2a_1280.jpg" 
            alt="Red kite flying high" 
            className="absolute top-10 right-1/4 w-24 h-24 object-contain kite-flutter" 
            style={{ animationDelay: '0.5s' }} 
          />
          <img 
            src="https://pixabay.com/get/g3ae80827721bd2bcfdfed2ed9fd69ddb76eeca10aceee5c4cd298cdc7426f81309d1ed9c5742ca96645e7d3bcd3330d31cc9382d4a93660167378453fb97e7bd_1280.jpg" 
            alt="Multiple colorful kites" 
            className="absolute bottom-0 right-1/3 w-28 h-28 object-contain kite-flutter" 
            style={{ animationDelay: '0.25s' }} 
          />
        </div>
        
        {/* Game Options */}
        <Card className="max-w-md w-full backdrop-blur-md bg-white bg-opacity-70">
          <CardContent className="p-6">
            <div className="mb-6">
              <h2 className="font-game text-xl mb-4 text-center">Join the Wind Race</h2>
              
              {/* Player Name */}
              <div className="mb-6">
                <label className="block text-sm font-medium mb-1">Your Name</label>
                <Input 
                  value={username} 
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full" 
                  placeholder="Enter your name" 
                />
              </div>
              
              {/* Create Room Form */}
              <div className="mb-6">
                <label className="block text-sm font-medium mb-1">Create a New Room</label>
                <div className="flex">
                  <Input 
                    type="text" 
                    placeholder="Room Name" 
                    value={roomName}
                    onChange={(e) => setRoomName(e.target.value)}
                    className="flex-grow rounded-r-none"
                  />
                  <Button 
                    className="bg-sky-dark hover:bg-sky-dark/90 rounded-l-none"
                    onClick={handleCreateRoom}
                    disabled={!isConnected || createRoomMutation.isPending}
                  >
                    Create
                  </Button>
                </div>
              </div>
              
              {/* Room List */}
              <RoomList 
                rooms={rooms} 
                isLoading={isLoadingRooms} 
                onJoinRoom={handleJoinRoom} 
              />
              
              {/* Kite Selection */}
              <KiteSelector />
            </div>
            
            {/* Connection Status */}
            <div className="flex justify-between items-center">
              <div className="flex items-center">
                <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'} mr-2`}></div>
                <span className="text-sm">{isConnected ? 'Connected' : 'Disconnected'}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default Lobby;
