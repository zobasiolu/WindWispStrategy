import { 
  users, type User, type InsertUser,
  rooms, type Room, type InsertRoom,
  kites, type Kite, type InsertKite,
  windCache, type WindCache, type InsertWindCache,
  gameEvents, type GameEvent, type InsertGameEvent,
  roomPlayers, type RoomPlayer, type InsertRoomPlayer,
  kiteSkins, type KiteSkin, type InsertKiteSkin
} from "@shared/schema";

// Interface for storage operations
export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Room operations
  createRoom(room: InsertRoom): Promise<Room>;
  getRoomById(id: number): Promise<Room | undefined>;
  getAllRooms(): Promise<Room[]>;
  updateRoomStatus(id: number, status: string): Promise<Room | undefined>;
  
  // Kite operations
  createKite(kite: InsertKite): Promise<Kite>;
  getKiteById(id: number): Promise<Kite | undefined>;
  getKitesByRoomId(roomId: number): Promise<Kite[]>;
  getKitesByUserId(userId: number): Promise<Kite[]>;
  updateKite(id: number, updates: Partial<Kite>): Promise<Kite | undefined>;
  
  // Wind cache operations
  saveWindData(windData: InsertWindCache): Promise<WindCache>;
  getWindData(latitude: number, longitude: number): Promise<WindCache | undefined>;
  
  // Game event operations
  createGameEvent(event: InsertGameEvent): Promise<GameEvent>;
  getGameEventsByRoomId(roomId: number): Promise<GameEvent[]>;
  deleteGameEvent(id: number): Promise<boolean>;
  
  // Room-Player relationships
  addPlayerToRoom(roomPlayer: InsertRoomPlayer): Promise<RoomPlayer>;
  getPlayersByRoomId(roomId: number): Promise<RoomPlayer[]>;
  removePlayerFromRoom(roomId: number, userId: number): Promise<boolean>;
  
  // Kite skins
  createKiteSkin(skin: InsertKiteSkin): Promise<KiteSkin>;
  getAllKiteSkins(): Promise<KiteSkin[]>;
  getDefaultKiteSkin(): Promise<KiteSkin | undefined>;
}

// In-memory implementation of the storage interface
export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private rooms: Map<number, Room>;
  private kites: Map<number, Kite>;
  private windCaches: Map<string, WindCache>;
  private gameEvents: Map<number, GameEvent>;
  private roomPlayers: Map<number, RoomPlayer>;
  private kiteSkins: Map<number, KiteSkin>;
  
  private userId: number = 1;
  private roomId: number = 1;
  private kiteId: number = 1;
  private windCacheId: number = 1;
  private gameEventId: number = 1;
  private roomPlayerId: number = 1;
  private kiteSkinId: number = 1;
  
  constructor() {
    this.users = new Map();
    this.rooms = new Map();
    this.kites = new Map();
    this.windCaches = new Map();
    this.gameEvents = new Map();
    this.roomPlayers = new Map();
    this.kiteSkins = new Map();
    
    // Initialize default kite skins
    this.initializeDefaultSkins();
  }
  
  // Helper method to create a key for wind cache lookup
  private getWindCacheKey(lat: number, lon: number): string {
    // Round to 1 decimal place for reasonable caching
    const roundedLat = Math.round(lat * 10) / 10;
    const roundedLon = Math.round(lon * 10) / 10;
    return `${roundedLat},${roundedLon}`;
  }
  
  // Initialize default kite skins
  private initializeDefaultSkins(): void {
    const defaultSkins: InsertKiteSkin[] = [
      {
        name: "Diamond Kite",
        imageUrl: "https://pixabay.com/get/ge4782ff9c3515d9c32969cc1080b30c45101ed4301a83725df809a3f15c49334b23d28992f10ffbe39233f62c8b324e267c2bc618270ce8bf25a4d210b71a0cb_1280.jpg",
        isDefault: true
      },
      {
        name: "Dragon Kite",
        imageUrl: "https://pixabay.com/get/g32d2aefab2ed0dd8d8e9733a05fa1603901e7d65abf4c27fdfb7884a08f5b16104923569ee081ffdb8b5a57cc725610921452f3b8a95a825a703ee89f7049cd4_1280.jpg",
        isDefault: false
      },
      {
        name: "Box Kite",
        imageUrl: "https://pixabay.com/get/g5728381f2a0852883dc6ee3cc520ac4531445e8128ae4ab5f14e6bed0e83975d74f7afc061f1a197f5a145370cc9e30c4a7f26be7382d5239d1e4f3cdbde77df_1280.jpg",
        isDefault: false
      },
      {
        name: "Stunt Kite",
        imageUrl: "https://pixabay.com/get/g06dcc37e70d077153984255b55fe82ff332f473b8e4f86c2c248572efdee36d1602a179a51287a97a17159e5bb345518e1c87cd1a0b645f80d313c9ea8777b2a_1280.jpg",
        isDefault: false
      },
      {
        name: "Delta Kite",
        imageUrl: "https://pixabay.com/get/g3ae80827721bd2bcfdfed2ed9fd69ddb76eeca10aceee5c4cd298cdc7426f81309d1ed9c5742ca96645e7d3bcd3330d31cc9382d4a93660167378453fb97e7bd_1280.jpg",
        isDefault: false
      },
      {
        name: "Parafoil Kite",
        imageUrl: "https://pixabay.com/get/g461b8d0c30d4ab0a63ead413d7ff882a5843873cc67bfc88216768bbc3cfcab412c3b12a1c745eeda04a33e61bd59e5f5b86b50a7ab7c59f7771534929f81f40_1280.jpg",
        isDefault: false
      }
    ];
    
    defaultSkins.forEach(skin => {
      this.createKiteSkin(skin);
    });
  }
  
  // User operations
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }
  
  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }
  
  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }
  
  // Room operations
  async createRoom(insertRoom: InsertRoom): Promise<Room> {
    const id = this.roomId++;
    const room: Room = { 
      ...insertRoom, 
      id, 
      status: "waiting", 
      createdAt: new Date()
    };
    this.rooms.set(id, room);
    return room;
  }
  
  async getRoomById(id: number): Promise<Room | undefined> {
    return this.rooms.get(id);
  }
  
  async getAllRooms(): Promise<Room[]> {
    return Array.from(this.rooms.values());
  }
  
  async updateRoomStatus(id: number, status: string): Promise<Room | undefined> {
    const room = this.rooms.get(id);
    if (!room) return undefined;
    
    const updatedRoom: Room = { ...room, status };
    this.rooms.set(id, updatedRoom);
    return updatedRoom;
  }
  
  // Kite operations
  async createKite(insertKite: InsertKite): Promise<Kite> {
    const id = this.kiteId++;
    const kite: Kite = { 
      ...insertKite, 
      id, 
      coins: 0, 
      isActive: true 
    };
    this.kites.set(id, kite);
    return kite;
  }
  
  async getKiteById(id: number): Promise<Kite | undefined> {
    return this.kites.get(id);
  }
  
  async getKitesByRoomId(roomId: number): Promise<Kite[]> {
    return Array.from(this.kites.values()).filter(
      (kite) => kite.roomId === roomId
    );
  }
  
  async getKitesByUserId(userId: number): Promise<Kite[]> {
    return Array.from(this.kites.values()).filter(
      (kite) => kite.userId === userId
    );
  }
  
  async updateKite(id: number, updates: Partial<Kite>): Promise<Kite | undefined> {
    const kite = this.kites.get(id);
    if (!kite) return undefined;
    
    const updatedKite: Kite = { ...kite, ...updates };
    this.kites.set(id, updatedKite);
    return updatedKite;
  }
  
  // Wind cache operations
  async saveWindData(insertWindData: InsertWindCache): Promise<WindCache> {
    const id = this.windCacheId++;
    const windData: WindCache = { 
      ...insertWindData, 
      id, 
      fetchedAt: new Date()
    };
    
    const key = this.getWindCacheKey(windData.latitude, windData.longitude);
    this.windCaches.set(key, windData);
    return windData;
  }
  
  async getWindData(latitude: number, longitude: number): Promise<WindCache | undefined> {
    const key = this.getWindCacheKey(latitude, longitude);
    const windData = this.windCaches.get(key);
    
    // Return undefined if no data or data is older than 10 minutes
    if (!windData) return undefined;
    
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
    if (windData.fetchedAt < tenMinutesAgo) {
      return undefined;
    }
    
    return windData;
  }
  
  // Game event operations
  async createGameEvent(insertEvent: InsertGameEvent): Promise<GameEvent> {
    const id = this.gameEventId++;
    const event: GameEvent = { 
      ...insertEvent, 
      id, 
      createdAt: new Date()
    };
    this.gameEvents.set(id, event);
    return event;
  }
  
  async getGameEventsByRoomId(roomId: number): Promise<GameEvent[]> {
    return Array.from(this.gameEvents.values()).filter(
      (event) => event.roomId === roomId
    );
  }
  
  async deleteGameEvent(id: number): Promise<boolean> {
    return this.gameEvents.delete(id);
  }
  
  // Room-Player relationships
  async addPlayerToRoom(insertRoomPlayer: InsertRoomPlayer): Promise<RoomPlayer> {
    const id = this.roomPlayerId++;
    const roomPlayer: RoomPlayer = { 
      ...insertRoomPlayer, 
      id, 
      joinedAt: new Date()
    };
    this.roomPlayers.set(id, roomPlayer);
    return roomPlayer;
  }
  
  async getPlayersByRoomId(roomId: number): Promise<RoomPlayer[]> {
    return Array.from(this.roomPlayers.values()).filter(
      (roomPlayer) => roomPlayer.roomId === roomId
    );
  }
  
  async removePlayerFromRoom(roomId: number, userId: number): Promise<boolean> {
    const roomPlayerId = Array.from(this.roomPlayers.entries()).find(
      ([_, roomPlayer]) => roomPlayer.roomId === roomId && roomPlayer.userId === userId
    )?.[0];
    
    if (roomPlayerId === undefined) return false;
    return this.roomPlayers.delete(roomPlayerId);
  }
  
  // Kite skins
  async createKiteSkin(insertSkin: InsertKiteSkin): Promise<KiteSkin> {
    const id = this.kiteSkinId++;
    const skin: KiteSkin = { ...insertSkin, id };
    this.kiteSkins.set(id, skin);
    return skin;
  }
  
  async getAllKiteSkins(): Promise<KiteSkin[]> {
    return Array.from(this.kiteSkins.values());
  }
  
  async getDefaultKiteSkin(): Promise<KiteSkin | undefined> {
    return Array.from(this.kiteSkins.values()).find(
      (skin) => skin.isDefault
    );
  }
}

export const storage = new MemStorage();
