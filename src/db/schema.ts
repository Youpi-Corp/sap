import {
  pgTable,
  serial,
  varchar,
  text,
  integer,
  boolean,
} from "drizzle-orm/pg-core";

// User table
export const users = pgTable("user", {
  id: serial("id").primaryKey(),
  pseudo: varchar("pseudo", { length: 100 }),
  email: varchar("email", { length: 100 }),
  password_hash: text("password_hash"),
  role: varchar("role", { length: 4 }),
});

// Chat table
export const chats = pgTable("chat", {
  id: serial("id").primaryKey(),
  content: text("content"),
});

// Module table
export const modules = pgTable("module", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }),
  content: text("content"),
  user_id: integer("user_id").references(() => users.id),
});

// Asset table
export const assets = pgTable("asset", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }),
  content: text("content"),
  documentation: text("documentation"),
  likes: integer("likes"),
  views: integer("views"),
  public: boolean("public"),
  user_id: integer("user_id").references(() => users.id),
  chat_id: integer("chat_id").references(() => chats.id),
});

// Course table
export const courses = pgTable("course", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }),
  content: text("content"),
  module_id: integer("module_id").references(() => modules.id),
  level: integer("level"),
  likes: integer("likes"),
  views: integer("views"),
  public: boolean("public"),
  chat_id: integer("chat_id").references(() => chats.id),
});

// Subscription table
export const subscriptions = pgTable("subscription", {
  id: serial("id").primaryKey(),
  progress: integer("progress"),
  time_spent: integer("time_spent"),
  favorite: boolean("favorite"),
  liked: boolean("liked"),
  user_id: integer("user_id").references(() => users.id),
  course_id: integer("course_id").references(() => courses.id),
});

// Info table
export const info = pgTable("info", {
  cgu: text("cgu").notNull(),
  legal_mentions: text("legal_mentions"),
});

// Refresh token table
export const refreshTokens = pgTable("refresh_token", {
  id: serial("id").primaryKey(),
  token: text("token").notNull(),
  user_id: text("user_id").notNull(),
  expires_at: text("expires_at").notNull(),
});
