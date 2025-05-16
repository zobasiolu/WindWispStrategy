import { useState, useEffect, useCallback } from 'react';
import { GameMessage } from '@shared/schema';

interface GameSocketProps {
  onMessage: (message: string) => void;
  onError: (error: Event) => void;
}

export function useGameSocket({ onMessage, onError }: GameSocketProps) {
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  
  // Connect to WebSocket server
  useEffect(() => {
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    
    const ws = new WebSocket(wsUrl);
    
    ws.onopen = () => {
      console.log("WebSocket connected");
      setIsConnected(true);
    };
    
    ws.onmessage = (event) => {
      onMessage(event.data);
    };
    
    ws.onerror = (error) => {
      console.error("WebSocket error:", error);
      onError(error);
    };
    
    ws.onclose = () => {
      console.log("WebSocket disconnected");
      setIsConnected(false);
    };
    
    setSocket(ws);
    
    // Clean up on unmount
    return () => {
      ws.close();
    };
  }, [onMessage, onError]);
  
  // Function to send messages to the server
  const sendMessage = useCallback((message: GameMessage) => {
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify(message));
    } else {
      console.error("WebSocket not connected");
    }
  }, [socket]);
  
  return { isConnected, sendMessage };
}
