import { useGame } from '@/lib/gameContext';
import { Kite } from '@shared/schema';

interface LeaderboardProps {
  kites: Kite[];
}

function Leaderboard({ kites }: LeaderboardProps) {
  const { getPlayerUsername } = useGame();
  
  // Sort kites by coins collected (descending)
  const sortedKites = [...kites].sort((a, b) => b.coins - a.coins);
  
  return (
    <div className="bg-white bg-opacity-70 backdrop-blur-sm rounded-lg p-2 shadow-lg">
      <h3 className="text-sm font-medium mb-1">Leaderboard</h3>
      <div className="space-y-1">
        {sortedKites.length === 0 ? (
          <div className="text-sm text-gray-500">No players yet</div>
        ) : (
          sortedKites.map(kite => (
            <div key={kite.id} className="flex items-center justify-between">
              <span className="font-medium text-sm mr-2">
                {getPlayerUsername(kite.userId)}
              </span>
              <div className="flex items-center">
                <span className="text-wind-orange font-bold text-sm">{kite.coins}</span>
                <i className="fas fa-coins text-wind-orange ml-1 text-xs"></i>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default Leaderboard;
