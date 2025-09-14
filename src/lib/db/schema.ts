import { pgTable, uuid, varchar, text, integer, timestamp, pgEnum } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

// Enums
export const cityEnum = pgEnum('city', ['Chandigarh', 'Mohali', 'Zirakpur', 'Panchkula', 'Other']);
export const propertyTypeEnum = pgEnum('property_type', ['Apartment', 'Villa', 'Plot', 'Office', 'Retail']);
export const bhkEnum = pgEnum('bhk', ['1', '2', '3', '4', 'Studio']);
export const purposeEnum = pgEnum('purpose', ['Buy', 'Rent']);
export const timelineEnum = pgEnum('timeline', ['0-3m', '3-6m', '>6m', 'Exploring']);
export const sourceEnum = pgEnum('source', ['Website', 'Referral', 'Walk-in', 'Call', 'Other']);
export const statusEnum = pgEnum('status', ['New', 'Qualified', 'Contacted', 'Visited', 'Negotiation', 'Converted', 'Dropped']);

// Buyers table
export const buyers = pgTable('buyers', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  fullName: varchar('full_name', { length: 80 }).notNull(),
  email: varchar('email'),
  phone: varchar('phone', { length: 15 }).notNull(),
  city: cityEnum('city').notNull(),
  propertyType: propertyTypeEnum('property_type').notNull(),
  bhk: bhkEnum('bhk'),
  purpose: purposeEnum('purpose').notNull(),
  budgetMin: integer('budget_min'),
  budgetMax: integer('budget_max'),
  timeline: timelineEnum('timeline').notNull(),
  source: sourceEnum('source').notNull(),
  status: statusEnum('status').notNull().default('New'),
  notes: text('notes'),
  tags: text('tags').array().default(sql`'{}'`),
  ownerId: uuid('owner_id').notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull().$onUpdate(() => new Date()),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Buyer history table
export const buyerHistory = pgTable('buyer_history', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  buyerId: uuid('buyer_id').notNull().references(() => buyers.id, { onDelete: 'cascade' }),
  changedBy: uuid('changed_by').notNull(),
  changedAt: timestamp('changed_at').defaultNow().notNull(),
  diff: text('diff').notNull(), // JSON string of { field: [oldValue, newValue] }
});

// Type exports for TypeScript
export type Buyer = typeof buyers.$inferSelect;
export type NewBuyer = typeof buyers.$inferInsert;
export type BuyerHistory = typeof buyerHistory.$inferSelect;
export type NewBuyerHistory = typeof buyerHistory.$inferInsert;

// Enum type exports
export type City = typeof cityEnum.enumValues[number];
export type PropertyType = typeof propertyTypeEnum.enumValues[number];
export type BHK = typeof bhkEnum.enumValues[number];
export type Purpose = typeof purposeEnum.enumValues[number];
export type Timeline = typeof timelineEnum.enumValues[number];
export type Source = typeof sourceEnum.enumValues[number];
export type Status = typeof statusEnum.enumValues[number];
