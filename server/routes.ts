import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { WebSocketServer, WebSocket } from "ws";
import axios from "axios";
import { 
  insertUserSchema, 
  insertRoomSchema, 
  insertKiteSchema, 
  insertGameEventSchema, 
  insertRoomPlayerSchema,
  type GameMessage,
  type OpenWeatherResponse
} from "@shared/schema";
import { ZodError } from "zod";

// Map to store active WebSocket connections by userId
const clients = new Map<number, WebSocket>();

// Function to broadcast message to all clients in a room
function broadcastToRoom(roomId: number, message: GameMessage) {
  clients.forEach((ws, userId) => {
    // Check if this client has a kite in the room
    storage.getKitesByUserId(userId).then(kites => {
      const inRoom = kites.some(kite => kite.roomId === roomId);
      if (inRoom && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify(message));
      }
    });
  });
}

// Fetch wind data from OpenWeather API
async function fetchWindData(lat: number, lon: number) {
  try {
    // First check if we have cached data
    const cachedData = await storage.getWindData(lat, lon);
    if (cachedData) {
      return cachedData;
    }
    
    // If no cached data, fetch from OpenWeather API
    const apiKey = process.env.OPENWEATHER_API_KEY;
    if (!apiKey) {
      throw new Error("OpenWeather API key not provided");
    }
    
    const response = await axios.get<OpenWeatherResponse>(
      `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}`
    );
    
    // Save to cache and return
    return await storage.saveWindData({
      latitude: lat,
      longitude: lon,
      speed: response.data.wind.speed,
      direction: response.data.wind.deg
    });
  } catch (error) {
    console.error("Error fetching wind data:", error);
    throw error;
  }
}

// Update kite positions based on wind data
async function updateKitePositions(roomId: number) {
  try {
    // Get all kites in the room
    const kites = await storage.getKitesByRoomId(roomId);
    
    // Update each kite's position based on wind
    for (const kite of kites) {
      if (!kite.isActive) continue;
      
      // Fetch wind data for kite's location
      const windData = await fetchWindData(kite.latitude, kite.longitude);
      if (!windData) continue;
      
      // Calculate new position based on wind speed and direction
      // Adjust movement based on altitude
      let speedMultiplier = 1.0;
      switch (kite.altitude) {
        case "low":
          speedMultiplier = 0.5;
          break;
        case "mid":
          speedMultiplier = 1.0;
          break;
        case "high":
          speedMultiplier = 1.5;
          break;
      }
      
      // Convert wind direction from meteorological to mathematical
      // Meteorological: direction wind is coming FROM (0 = N, 90 = E)
      // Mathematical: direction wind is going TO (0 = E, 90 = N)
      const windDirRad = ((270 - windData.direction) % 360) * (Math.PI / 180);
      
      // Calculate movement (simple approximation)
      // 0.0001 degrees is roughly 11 meters at the equator
      const moveFactor = 0.0001 * windData.speed * speedMultiplier;
      const newLat = kite.latitude + Math.sin(windDirRad) * moveFactor;
      const newLon = kite.longitude + Math.cos(windDirRad) * moveFactor;
      
      // Update kite position
      await storage.updateKite(kite.id, {
        latitude: newLat,
        longitude: newLon
      });
      
      // Check for coin collection
      await checkCoinCollection(kite.id, roomId);
      
      // Check for storm interaction
      await checkStormInteraction(kite.id, roomId);
    }
    
    // Send updated kites to clients
    const updatedKites = await storage.getKitesByRoomId(roomId);
    broadcastToRoom(roomId, {
      type: 'updateKite',
      kite: {
        id: 0, // Will be ignored by clients
        roomId: roomId
      }
    });
    
    // Fetch and broadcast new wind data
    const room = await storage.getRoomById(roomId);
    if (room && room.status === "playing") {
      // Schedule next update in 60 seconds
      setTimeout(() => updateKitePositions(roomId), 60000);
    }
  } catch (error) {
    console.error("Error updating kite positions:", error);
  }
}

// Check if a kite collects any coins
async function checkCoinCollection(kiteId: number, roomId: number) {
  try {
    const kite = await storage.getKiteById(kiteId);
    if (!kite) return;
    
    // Get all coin events in the room
    const events = await storage.getGameEventsByRoomId(roomId);
    const coins = events.filter(event => event.type === "coin");
    
    for (const coin of coins) {
      // Check if kite is close enough to collect coin (0.0001 degrees ≈ 11m)
      const distance = Math.sqrt(
        Math.pow(kite.latitude - coin.latitude, 2) + 
        Math.pow(kite.longitude - coin.longitude, 2)
      );
      
      if (distance < 0.0005) { // Collection radius
        // Update kite's coin count
        await storage.updateKite(kite.id, {
          coins: kite.coins + coin.value
        });
        
        // Remove the collected coin
        await storage.deleteGameEvent(coin.id);
        
        // Notify clients
        broadcastToRoom(roomId, {
          type: 'collectCoin',
          kiteId: kite.id,
          eventId: coin.id
        });
        
        // Check if this player has won
        const updatedKite = await storage.getKiteById(kiteId);
        const room = await storage.getRoomById(roomId);
        if (updatedKite && room && updatedKite.coins >= room.targetCoins) {
          // Game over, this player won
          await storage.updateRoomStatus(roomId, "finished");
          broadcastToRoom(roomId, {
            type: 'gameEnd',
            roomId,
            winner: updatedKite.userId
          });
        }
        
        // Spawn a new coin
        await spawnWindCoin(roomId);
      }
    }
  } catch (error) {
    console.error("Error checking coin collection:", error);
  }
}

// Check if a kite is affected by storm vortices
async function checkStormInteraction(kiteId: number, roomId: number) {
  try {
    const kite = await storage.getKiteById(kiteId);
    if (!kite) return;
    
    // Get all storm events in the room
    const events = await storage.getGameEventsByRoomId(roomId);
    const storms = events.filter(event => event.type === "storm");
    
    for (const storm of storms) {
      // Check if kite is within the storm's radius of effect
      const distance = Math.sqrt(
        Math.pow(kite.latitude - storm.latitude, 2) + 
        Math.pow(kite.longitude - storm.longitude, 2)
      );
      
      if (distance < (storm.radius || 0.001)) { // Storm effect radius
        // Calculate pull direction (toward storm center)
        const pullDirRad = Math.atan2(
          storm.latitude - kite.latitude,
          storm.longitude - kite.longitude
        );
        
        // Pull strength depends on distance (stronger near center)
        const pullStrength = 0.0005 * (1 - distance / (storm.radius || 0.001));
        
        // Update kite position
        await storage.updateKite(kite.id, {
          latitude: kite.latitude + Math.sin(pullDirRad) * pullStrength,
          longitude: kite.longitude + Math.cos(pullDirRad) * pullStrength
        });
        
        // Notify clients
        broadcastToRoom(roomId, {
          type: 'updateKite',
          kite: {
            id: kite.id,
            latitude: kite.latitude + Math.sin(pullDirRad) * pullStrength,
            longitude: kite.longitude + Math.cos(pullDirRad) * pullStrength
          }
        });
      }
    }
  } catch (error) {
    console.error("Error checking storm interaction:", error);
  }
}

// Spawn a wind coin at a random position downwind from existing kites
async function spawnWindCoin(roomId: number) {
  try {
    // Get all kites in the room
    const kites = await storage.getKitesByRoomId(roomId);
    if (kites.length === 0) return;
    
    // Select a random kite to spawn coin downwind from
    const randomKite = kites[Math.floor(Math.random() * kites.length)];
    
    // Get wind data for the kite's location
    const windData = await fetchWindData(randomKite.latitude, randomKite.longitude);
    if (!windData) return;
    
    // Calculate downwind position
    const windDirRad = (windData.direction * Math.PI) / 180;
    const distanceDownwind = 0.001 + (Math.random() * 0.002); // 0.001 degrees ≈ 111m
    
    // Downwind means moving in direction of the wind
    // We need to adjust the meteorological wind direction
    const downwindDirectionRad = ((windData.direction + 180) % 360) * (Math.PI / 180);
    
    const coinLat = randomKite.latitude + Math.sin(downwindDirectionRad) * distanceDownwind;
    const coinLon = randomKite.longitude + Math.cos(downwindDirectionRad) * distanceDownwind;
    
    // Create the coin game event
    const expiration = new Date();
    expiration.setMinutes(expiration.getMinutes() + 5); // Coins expire after 5 minutes
    
    const coinEvent = await storage.createGameEvent({
      roomId,
      type: "coin",
      latitude: coinLat,
      longitude: coinLon,
      value: 1, // Default coin value
      expiresAt: expiration
    });
    
    // Notify clients
    broadcastToRoom(roomId, {
      type: 'newStorm', // We use the same message type for all game events
      event: coinEvent
    });
  } catch (error) {
    console.error("Error spawning wind coin:", error);
  }
}

// Randomly spawn a storm vortex
async function spawnStormVortex(roomId: number) {
  try {
    // Get all kites in the room to determine a reasonable spawn area
    const kites = await storage.getKitesByRoomId(roomId);
    if (kites.length === 0) return;
    
    // Calculate bounds of all kites with some margin
    let minLat = Infinity, maxLat = -Infinity;
    let minLon = Infinity, maxLon = -Infinity;
    
    for (const kite of kites) {
      minLat = Math.min(minLat, kite.latitude);
      maxLat = Math.max(maxLat, kite.latitude);
      minLon = Math.min(minLon, kite.longitude);
      maxLon = Math.max(maxLon, kite.longitude);
    }
    
    // Add margin
    const margin = 0.01; // About 1km
    minLat -= margin;
    maxLat += margin;
    minLon -= margin;
    maxLon += margin;
    
    // Generate random position within bounds
    const stormLat = minLat + Math.random() * (maxLat - minLat);
    const stormLon = minLon + Math.random() * (maxLon - minLon);
    
    // Random radius
    const radius = 0.0005 + Math.random() * 0.001; // Between 55m and 165m approximately
    
    // Create storm event
    const expiration = new Date();
    expiration.setMinutes(expiration.getMinutes() + 3); // Storms last 3 minutes
    
    const stormEvent = await storage.createGameEvent({
      roomId,
      type: "storm",
      latitude: stormLat,
      longitude: stormLon,
      value: 0, // Not used for storms
      radius,
      expiresAt: expiration
    });
    
    // Notify clients
    broadcastToRoom(roomId, {
      type: 'newStorm',
      event: stormEvent
    });
    
    // Schedule next storm spawning
    const room = await storage.getRoomById(roomId);
    if (room && room.status === "playing") {
      // Random interval between 30-90 seconds
      const nextSpawnTime = 30000 + Math.random() * 60000;
      setTimeout(() => spawnStormVortex(roomId), nextSpawnTime);
    }
  } catch (error) {
    console.error("Error spawning storm vortex:", error);
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);
  
  // Set up WebSocket server
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });
  
  wss.on('connection', (ws) => {
    let userId: number | null = null;
    
    ws.on('message', async (message) => {
      try {
        const data = JSON.parse(message.toString()) as GameMessage;
        
        switch (data.type) {
          case 'joinRoom': {
            // Find or create user
            let user = await storage.getUserByUsername(data.username);
            if (!user) {
              user = await storage.createUser({
                username: data.username,
                password: 'temporary' // In a real app, we'd handle auth properly
              });
            }
            
            userId = user.id;
            clients.set(userId, ws);
            
            // Add user to room
            await storage.addPlayerToRoom({
              roomId: data.roomId,
              userId
            });
            
            // Send room state to the client
            const room = await storage.getRoomById(data.roomId);
            const players = await storage.getPlayersByRoomId(data.roomId);
            const kites = await storage.getKitesByRoomId(data.roomId);
            
            if (room) {
              ws.send(JSON.stringify({
                type: 'roomState',
                room,
                players,
                kites
              }));
              
              // Broadcast to others that a new player joined
              broadcastToRoom(data.roomId, {
                type: 'roomState',
                room,
                players,
                kites
              });
            }
            break;
          }
          
          case 'leaveRoom': {
            if (userId) {
              await storage.removePlayerFromRoom(data.roomId, userId);
              
              // Update room state for remaining players
              const room = await storage.getRoomById(data.roomId);
              const players = await storage.getPlayersByRoomId(data.roomId);
              const kites = await storage.getKitesByRoomId(data.roomId);
              
              if (room) {
                broadcastToRoom(data.roomId, {
                  type: 'roomState',
                  room,
                  players,
                  kites
                });
              }
            }
            break;
          }
          
          case 'placeKite': {
            if (userId) {
              try {
                const validatedKite = insertKiteSchema.parse(data.kite);
                const kite = await storage.createKite(validatedKite);
                
                // Broadcast the new kite to all players in the room
                broadcastToRoom(kite.roomId, {
                  type: 'updateKite',
                  kite
                });
              } catch (error) {
                if (error instanceof ZodError) {
                  ws.send(JSON.stringify({
                    type: 'error',
                    message: 'Invalid kite data',
                    details: error.errors
                  }));
                }
              }
            }
            break;
          }
          
          case 'updateKite': {
            // Validate that the user owns this kite
            if (userId) {
              const kite = await storage.getKiteById(data.kite.id);
              if (kite && kite.userId === userId) {
                // Only allow updating altitude for player-controlled kites
                if ('altitude' in data.kite) {
                  await storage.updateKite(data.kite.id, {
                    altitude: data.kite.altitude as string
                  });
                  
                  // Broadcast the updated kite
                  const updatedKite = await storage.getKiteById(data.kite.id);
                  if (updatedKite) {
                    broadcastToRoom(updatedKite.roomId, {
                      type: 'updateKite',
                      kite: updatedKite
                    });
                  }
                }
              }
            }
            break;
          }
          
          case 'gameStart': {
            // Update room status
            const updatedRoom = await storage.updateRoomStatus(data.roomId, "playing");
            
            if (updatedRoom) {
              // Notify all clients in the room
              broadcastToRoom(data.roomId, {
                type: 'gameStart',
                roomId: data.roomId
              });
              
              // Initialize game
              // Spawn initial coins
              for (let i = 0; i < 10; i++) {
                await spawnWindCoin(data.roomId);
              }
              
              // Start periodic updates
              updateKitePositions(data.roomId);
              setTimeout(() => spawnStormVortex(data.roomId), 30000); // First storm after 30 seconds
            }
            break;
          }
        }
      } catch (error) {
        console.error("WebSocket message error:", error);
      }
    });
    
    ws.on('close', () => {
      if (userId) {
        clients.delete(userId);
      }
    });
  });
  
  // API Routes
  
  // Get all rooms
  app.get('/api/rooms', async (req: Request, res: Response) => {
    try {
      const rooms = await storage.getAllRooms();
      
      // For each room, get the number of players
      const roomsWithPlayerCount = await Promise.all(
        rooms.map(async (room) => {
          const players = await storage.getPlayersByRoomId(room.id);
          return {
            ...room,
            playerCount: players.length
          };
        })
      );
      
      res.json(roomsWithPlayerCount);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch rooms' });
    }
  });
  
  // Create a new room
  app.post('/api/rooms', async (req: Request, res: Response) => {
    try {
      const roomData = insertRoomSchema.parse(req.body);
      const room = await storage.createRoom(roomData);
      res.status(201).json(room);
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(400).json({ error: 'Invalid room data', details: error.errors });
      } else {
        res.status(500).json({ error: 'Failed to create room' });
      }
    }
  });
  
  // Get room details
  app.get('/api/rooms/:id', async (req: Request, res: Response) => {
    try {
      const roomId = parseInt(req.params.id);
      const room = await storage.getRoomById(roomId);
      
      if (!room) {
        return res.status(404).json({ error: 'Room not found' });
      }
      
      const players = await storage.getPlayersByRoomId(roomId);
      const kites = await storage.getKitesByRoomId(roomId);
      
      res.json({ room, players, kites });
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch room details' });
    }
  });
  
  // Get all kite skins
  app.get('/api/kite-skins', async (req: Request, res: Response) => {
    try {
      const skins = await storage.getAllKiteSkins();
      res.json(skins);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch kite skins' });
    }
  });
  
  // Get wind data for a location
  app.get('/api/wind', async (req: Request, res: Response) => {
    try {
      const lat = parseFloat(req.query.lat as string);
      const lon = parseFloat(req.query.lon as string);
      
      if (isNaN(lat) || isNaN(lon)) {
        return res.status(400).json({ error: 'Invalid latitude or longitude' });
      }
      
      const windData = await fetchWindData(lat, lon);
      res.json(windData);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch wind data' });
    }
  });
  
  return httpServer;
}
