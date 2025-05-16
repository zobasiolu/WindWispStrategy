import { Button } from '@/components/ui/button';
import { Room } from '@shared/schema';

interface RoomListProps {
  rooms: Room[];
  isLoading: boolean;
  onJoinRoom: (roomId: number) => void;
}

function RoomList({ rooms, isLoading, onJoinRoom }: RoomListProps) {
  if (isLoading) {
    return (
      <div className="mb-6">
        <label className="block text-sm font-medium mb-2">Available Rooms</label>
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden p-4 text-center">
          <div className="animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-3/4 mx-auto mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2 mx-auto"></div>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="mb-6">
      <label className="block text-sm font-medium mb-2">Available Rooms</label>
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        {rooms.length === 0 ? (
          <div className="p-3 text-center text-gray-500">
            No rooms available. Create one!
          </div>
        ) : (
          rooms.map((room) => (
            <div 
              key={room.id}
              className="p-3 flex justify-between items-center border-b border-gray-100 last:border-b-0 hover:bg-sky-light/30 transition cursor-pointer"
            >
              <div>
                <p className="font-medium">{room.name}</p>
                <p className="text-sm text-gray-500">
                  {room.playerCount || 0}/{room.maxPlayers} players • {room.status}
                </p>
              </div>
              <Button 
                className="bg-wind-orange hover:bg-wind-orange/90 text-white"
                onClick={() => onJoinRoom(room.id)}
                disabled={room.status !== 'waiting'}
              >
                Join
              </Button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default RoomList;
