import { useEffect } from 'react';
import { useParams, useLocation } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useGame } from '@/lib/gameContext';

function Recap() {
  const { roomId } = useParams();
  const [, navigate] = useLocation();
  const { getPlayerUsername } = useGame();
  
  // Fetch room details with players and kites
  const { data, isLoading } = useQuery({
    queryKey: [`/api/rooms/${roomId}`],
    refetchOnWindowFocus: false
  });
  
  // Sort kites by coins collected (descending)
  const sortedKites = data?.kites ? [...data.kites].sort((a, b) => b.coins - a.coins) : [];
  
  // Generate flight paths for visualization (this would be more sophisticated in a real implementation)
  const flightPaths = sortedKites.map((kite, index) => {
    // In a real implementation, we would fetch actual path data
    // Here we just generate a random SVG path for illustration
    const pathColors = ['#FF9D5C', '#5DA9D6', '#8B75CA'];
    const color = pathColors[index % pathColors.length];
    
    // Generate a random path
    const startX = 100 + (index * 50);
    const startY = 100 + (index * 100);
    
    return {
      path: `M${startX},${startY} C${startX + 50},${startY - 50} ${startX + 100},${startY + 50} ${startX + 150},${startY}`,
      color,
      playerName: getPlayerUsername(kite.userId)
    };
  });
  
  const handleReturnToLobby = () => {
    navigate('/');
  };
  
  const handlePlayAgain = () => {
    navigate('/');
  };
  
  const handleShareResults = () => {
    // In a real implementation, this would share results
    alert('Sharing functionality would be implemented here');
  };
  
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-sky-light">
        <div className="text-center">
          <h2 className="font-game text-2xl text-sky-dark mb-2">Loading match recap...</h2>
          <div className="animate-spin w-8 h-8 border-4 border-sky-dark border-t-transparent rounded-full mx-auto"></div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen w-full bg-sky-light">
      <div className="container mx-auto px-4 py-8 relative z-10">
        <Card className="bg-white bg-opacity-80 backdrop-blur-md shadow-lg">
          <CardContent className="p-6">
            <h1 className="font-game text-3xl mb-6 text-center text-sky-dark">Match Recap</h1>
            
            {/* Final Leaderboard */}
            <div className="mb-8">
              <h2 className="font-game text-xl mb-4">Final Scores</h2>
              <div className="overflow-hidden rounded-lg border border-gray-200">
                {sortedKites.map((kite, index) => (
                  <div 
                    key={kite.id}
                    className={`p-4 flex items-center ${
                      index === 0 ? 'bg-wind-yellow' : 'bg-white border-t border-gray-200'
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold mr-3 ${
                      index === 0 ? 'bg-wind-orange' : 'bg-gray-200 text-gray-700'
                    }`}>
                      {index + 1}
                    </div>
                    <div className="flex-grow">
                      <p className={index === 0 ? "font-bold" : "font-medium"}>
                        {getPlayerUsername(kite.userId)}
                      </p>
                      {index === 0 && (
                        <div className="flex items-center">
                          <i className="fas fa-trophy text-wind-orange mr-1"></i>
                          <span className="text-sm text-gray-600">First to reach {data?.room?.targetCoins} coins!</span>
                        </div>
                      )}
                    </div>
                    <div className="text-right">
                      <div className={`font-mono font-bold ${index === 0 ? 'text-xl text-wind-orange' : 'text-lg'}`}>
                        {kite.coins}
                      </div>
                      <div className="text-sm text-gray-600">
                        {index === 0 ? 'Winner!' : 'coins collected'}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Kite Path Heatmap */}
            <div className="mb-8">
              <h2 className="font-game text-xl mb-4">Flight Paths</h2>
              <div className="bg-sky-light rounded-lg p-4 relative overflow-hidden" style={{ height: 400 }}>
                {/* Map with flight paths */}
                <img 
                  src="https://images.unsplash.com/photo-1451187580459-43490279c0fa?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&h=1080" 
                  alt="World map with flight paths" 
                  className="w-full h-full object-cover rounded-lg opacity-50" 
                />
                
                {/* SVG Path overlay */}
                <svg className="absolute inset-0 w-full h-full">
                  {flightPaths.map((path, index) => (
                    <path 
                      key={index}
                      d={path.path} 
                      stroke={path.color} 
                      strokeWidth="3" 
                      fill="none" 
                      strokeLinecap="round" 
                    />
                  ))}
                </svg>
                
                {/* Legend */}
                <div className="absolute bottom-4 right-4 bg-white rounded-lg p-2 text-sm">
                  {flightPaths.map((path, index) => (
                    <div key={index} className="flex items-center mb-1 last:mb-0">
                      <div 
                        className="w-4 h-2 rounded-full mr-2" 
                        style={{ backgroundColor: path.color }}
                      ></div>
                      <span>{path.playerName}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            
            {/* Stats and Highlights */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              {/* For a real implementation, these would be actual stats */}
              <div>
                <h2 className="font-game text-xl mb-4">Your Stats</h2>
                <div className="bg-sky-light rounded-lg p-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white rounded-lg p-3 text-center">
                      <p className="text-sm text-gray-600">Distance Traveled</p>
                      <p className="font-mono font-bold text-xl">12.8 km</p>
                    </div>
                    <div className="bg-white rounded-lg p-3 text-center">
                      <p className="text-sm text-gray-600">Avg Wind Speed</p>
                      <p className="font-mono font-bold text-xl">9.3 km/h</p>
                    </div>
                    <div className="bg-white rounded-lg p-3 text-center">
                      <p className="text-sm text-gray-600">Altitude Changes</p>
                      <p className="font-mono font-bold text-xl">14</p>
                    </div>
                    <div className="bg-white rounded-lg p-3 text-center">
                      <p className="text-sm text-gray-600">Storm Encounters</p>
                      <p className="font-mono font-bold text-xl">3</p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div>
                <h2 className="font-game text-xl mb-4">Match Highlights</h2>
                <div className="bg-sky-light rounded-lg p-4">
                  <div className="space-y-3">
                    <div className="bg-white rounded-lg p-3">
                      <div className="flex items-center">
                        <div className="w-8 h-8 rounded-full bg-sky-dark flex items-center justify-center text-white mr-2">
                          <i className="fas fa-bolt"></i>
                        </div>
                        <div>
                          <p className="font-medium">Speed Demon</p>
                          <p className="text-sm text-gray-600">Reached 28 km/h in the North Pacific jet stream</p>
                        </div>
                      </div>
                    </div>
                    <div className="bg-white rounded-lg p-3">
                      <div className="flex items-center">
                        <div className="w-8 h-8 rounded-full bg-wind-orange flex items-center justify-center text-white mr-2">
                          <i className="fas fa-coins"></i>
                        </div>
                        <div>
                          <p className="font-medium">Coin Collector</p>
                          <p className="text-sm text-gray-600">Collected 32 coins in a single minute</p>
                        </div>
                      </div>
                    </div>
                    <div className="bg-white rounded-lg p-3">
                      <div className="flex items-center">
                        <div className="w-8 h-8 rounded-full bg-storm-purple flex items-center justify-center text-white mr-2">
                          <i className="fas fa-wind"></i>
                        </div>
                        <div>
                          <p className="font-medium">Storm Survivor</p>
                          <p className="text-sm text-gray-600">Navigated through 3 storm vortices without damage</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Action Buttons */}
            <div className="flex justify-center space-x-4">
              <Button
                variant="outline"
                className="flex items-center"
                onClick={handleReturnToLobby}
              >
                <i className="fas fa-arrow-left mr-2"></i>
                Return to Lobby
              </Button>
              <Button
                className="bg-sky-dark hover:bg-sky-dark/90 text-white flex items-center"
                onClick={handlePlayAgain}
              >
                <i className="fas fa-redo mr-2"></i>
                Play Again
              </Button>
              <Button
                className="bg-wind-orange hover:bg-wind-orange/90 text-white flex items-center"
                onClick={handleShareResults}
              >
                <i className="fas fa-share mr-2"></i>
                Share Results
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default Recap;
