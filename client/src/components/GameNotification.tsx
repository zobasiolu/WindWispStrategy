import { useEffect, useState } from 'react';

interface GameNotificationProps {
  message: string;
}

function GameNotification({ message }: GameNotificationProps) {
  const [isVisible, setIsVisible] = useState(true);
  
  useEffect(() => {
    // Fade out after 4.5 seconds
    const fadeTimer = setTimeout(() => {
      setIsVisible(false);
    }, 4500);
    
    return () => clearTimeout(fadeTimer);
  }, []);
  
  if (!isVisible) return null;
  
  return (
    <div className="bg-white bg-opacity-90 backdrop-blur-sm rounded-lg p-3 shadow-lg transform transition-all duration-500 animate-float">
      <p className="font-game text-storm-purple text-sm">
        <i className="fas fa-wind mr-1"></i>
        {message}
      </p>
    </div>
  );
}

export default GameNotification;
