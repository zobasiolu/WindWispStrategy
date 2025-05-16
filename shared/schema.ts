import { pgTable, text, serial, integer, boolean, doublePrecision, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User account information
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// Game rooms information
export const rooms = pgTable("rooms", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  status: text("status").notNull().default("waiting"), // waiting, playing, finished
  creatorId: integer("creator_id").notNull(), // Reference to user who created the room
  maxPlayers: integer("max_players").notNull().default(4),
  targetCoins: integer("target_coins").notNull().default(500),
});

export const insertRoomSchema = createInsertSchema(rooms).pick({
  name: true,
  creatorId: true,
  maxPlayers: true,
  targetCoins: true,
});

export type InsertRoom = z.infer<typeof insertRoomSchema>;
export type Room = typeof rooms.$inferSelect;

// Kite information
export const kites = pgTable("kites", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(), // Reference to the user who owns the kite
  roomId: integer("room_id").notNull(), // Reference to the room where the kite is placed
  latitude: doublePrecision("latitude").notNull(),
  longitude: doublePrecision("longitude").notNull(),
  altitude: text("altitude").notNull(), // low, mid, high
  skinId: text("skin_id").notNull(), // Reference to kite skin/appearance
  coins: integer("coins").notNull().default(0),
  isActive: boolean("is_active").notNull().default(true),
});

export const insertKiteSchema = createInsertSchema(kites).pick({
  userId: true,
  roomId: true,
  latitude: true,
  longitude: true,
  altitude: true,
  skinId: true,
});

export type InsertKite = z.infer<typeof insertKiteSchema>;
export type Kite = typeof kites.$inferSelect;

// Cache for wind data
export const windCache = pgTable("wind_cache", {
  id: serial("id").primaryKey(),
  latitude: doublePrecision("latitude").notNull(),
  longitude: doublePrecision("longitude").notNull(),
  speed: doublePrecision("speed").notNull(),
  direction: doublePrecision("direction").notNull(), // in degrees, meteorological
  fetchedAt: timestamp("fetched_at").defaultNow().notNull(),
});

export const insertWindCacheSchema = createInsertSchema(windCache).pick({
  latitude: true,
  longitude: true,
  speed: true,
  direction: true,
});

export type InsertWindCache = z.infer<typeof insertWindCacheSchema>;
export type WindCache = typeof windCache.$inferSelect;

// Game events like storms, wind coins, etc.
export const gameEvents = pgTable("game_events", {
  id: serial("id").primaryKey(),
  roomId: integer("room_id").notNull(),
  type: text("type").notNull(), // coin, storm
  latitude: doublePrecision("latitude").notNull(),
  longitude: doublePrecision("longitude").notNull(),
  value: integer("value").notNull().default(1), // For coins: number of coins
  radius: doublePrecision("radius"), // For storms: radius of effect
  expiresAt: timestamp("expires_at"), // When the event expires/disappears
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertGameEventSchema = createInsertSchema(gameEvents).pick({
  roomId: true,
  type: true,
  latitude: true,
  longitude: true,
  value: true,
  radius: true,
  expiresAt: true,
});

export type InsertGameEvent = z.infer<typeof insertGameEventSchema>;
export type GameEvent = typeof gameEvents.$inferSelect;

// For storing player-room relationships (for multi-player tracking)
export const roomPlayers = pgTable("room_players", {
  id: serial("id").primaryKey(),
  roomId: integer("room_id").notNull(),
  userId: integer("user_id").notNull(),
  joinedAt: timestamp("joined_at").defaultNow().notNull(),
});

export const insertRoomPlayerSchema = createInsertSchema(roomPlayers).pick({
  roomId: true,
  userId: true,
});

export type InsertRoomPlayer = z.infer<typeof insertRoomPlayerSchema>;
export type RoomPlayer = typeof roomPlayers.$inferSelect;

// Kite Skins available in the game
export const kiteSkins = pgTable("kite_skins", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  imageUrl: text("image_url").notNull(),
  isDefault: boolean("is_default").default(false),
});

export const insertKiteSkinSchema = createInsertSchema(kiteSkins).pick({
  name: true,
  imageUrl: true,
  isDefault: true,
});

export type InsertKiteSkin = z.infer<typeof insertKiteSkinSchema>;
export type KiteSkin = typeof kiteSkins.$inferSelect;

// Types for WebSocket messages
export type GameMessage = 
  | { type: 'joinRoom', roomId: number, username: string }
  | { type: 'leaveRoom', roomId: number, userId: number }
  | { type: 'placeKite', kite: InsertKite }
  | { type: 'updateKite', kite: Partial<Kite> & { id: number } }
  | { type: 'collectCoin', kiteId: number, eventId: number }
  | { type: 'newStorm', event: GameEvent }
  | { type: 'roomState', room: Room, players: RoomPlayer[], kites: Kite[] }
  | { type: 'gameStart', roomId: number }
  | { type: 'gameEnd', roomId: number, winner: number }
  | { type: 'windUpdate', windData: WindCache[] };

// Types for OpenWeather API responses
export interface OpenWeatherResponse {
  coord: {
    lon: number;
    lat: number;
  };
  weather: {
    id: number;
    main: string;
    description: string;
    icon: string;
  }[];
  main: {
    temp: number;
    feels_like: number;
    temp_min: number;
    temp_max: number;
    pressure: number;
    humidity: number;
  };
  wind: {
    speed: number;
    deg: number;
    gust?: number;
  };
  clouds: {
    all: number;
  };
  dt: number;
  sys: {
    type: number;
    id: number;
    country: string;
    sunrise: number;
    sunset: number;
  };
  timezone: number;
  id: number;
  name: string;
  cod: number;
}
