import { pgTable, uuid, varchar, integer, timestamp, jsonb, pgEnum } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  password: varchar('password', { length: 255 }).notNull(),
  displayName: varchar('display_name', { length: 255 }).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  lastLoginAt: timestamp('last_login_at').defaultNow(),
});

export const worlds = pgTable('worlds', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull(),
  description: varchar('description', { length: 255 }),
  systemId: integer('system_id').default(0).notNull(),
  ownerId: uuid('owner_id').references(() => users.id).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  settings: jsonb('settings').default({}).notNull(),
  coverImageId: uuid('cover_image_id').references(() => assets.id),
});

export const assetProviderEnum = pgEnum('asset_provider', ['local', 's3']);

export const assets = pgTable('assets', {
  id: uuid('id').primaryKey().defaultRandom(),
  worldId: uuid('world_id').references(() => worlds.id).notNull(),
  provider: assetProviderEnum('provider').notNull(),
  objectKey: varchar('object_key', { length: 255 }).notNull(),
  mimeType: varchar('mime_type', { length: 255 }).notNull(),
  size: integer('size').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type World = typeof worlds.$inferSelect;
export type NewWorld = typeof worlds.$inferInsert;
export type Asset = typeof assets.$inferSelect;
export type NewAsset = typeof assets.$inferInsert;
