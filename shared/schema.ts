import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// Type definitions
export interface ProjectAttachment {
  id: string;          // Unique identifier for the attachment
  name: string;        // Original filename
  url: string;         // URL to access the file
  type: string;        // MIME type (e.g., "image/jpeg", "application/pdf")
  size: number;        // File size in bytes
  uploadedAt: string;  // ISO date string
}

// User roles enumeration
export const UserRole = {
  ENTREPRENEUR: "entrepreneur",
  COMPANY: "company",
} as const;

// User schema
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email").notNull().unique(),
  role: text("role").notNull(),
  name: text("name").notNull(),
  avatar: text("avatar"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Company profile schema
export const companyProfiles = pgTable("company_profiles", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  description: text("description").notNull(),
  logo: text("logo"),
  coverPhoto: text("cover_photo"),
  website: text("website"),
  location: text("location"),
  skills: text("skills").array(),
  rating: integer("rating"),
  reviewCount: integer("review_count").default(0),
  verified: boolean("verified").default(false), // إضافة حقل للتوثيق
});

// Project schema
export const projects = pgTable("projects", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  budget: text("budget").notNull(),
  duration: text("duration").notNull(),
  skills: text("skills").array(),
  status: text("status").notNull().default("open"),
  userId: integer("user_id").notNull().references(() => users.id),
  highlightStatus: text("highlight_status"), // For "high demand", "new", etc.
  attachments: jsonb("attachments"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Offer schema
export const projectOffers = pgTable("project_offers", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").notNull().references(() => projects.id),
  companyId: integer("company_id").notNull().references(() => companyProfiles.id), 
  amount: text("amount").notNull(),
  duration: text("duration").notNull(),
  description: text("description").notNull(),
  status: text("status").default("pending").notNull(), // pending, accepted, rejected, completed
  depositPaid: boolean("deposit_paid").default(false),
  depositAmount: text("deposit_amount"),
  depositDate: timestamp("deposit_date"),
  contactRevealed: boolean("contact_revealed").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Message schema
export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  content: text("content").notNull(),
  fromUserId: integer("from_user_id").notNull().references(() => users.id),
  toUserId: integer("to_user_id").notNull().references(() => users.id),
  projectId: integer("project_id").references(() => projects.id),
  read: boolean("read").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Testimonial schema
export const testimonials = pgTable("testimonials", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  content: text("content").notNull(),
  role: text("role").notNull(), // "entrepreneur" or "company"
  companyName: text("company_name"),
  userTitle: text("user_title"),
  rating: integer("rating").notNull(),
  avatar: text("avatar"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({ id: true, createdAt: true });

export const insertCompanyProfileSchema = createInsertSchema(companyProfiles).omit({ 
  id: true, 
  rating: true, 
  reviewCount: true 
});

export const insertProjectSchema = createInsertSchema(projects).omit({ 
  id: true, 
  status: true, 
  highlightStatus: true, 
  createdAt: true 
}).extend({
  attachments: z.array(z.object({
    id: z.string(),
    name: z.string(),
    url: z.string(),
    type: z.string(),
    size: z.number(),
    uploadedAt: z.string()
  })).optional()
});

export const insertMessageSchema = createInsertSchema(messages).omit({ 
  id: true, 
  read: true, 
  createdAt: true 
});

export const insertTestimonialSchema = createInsertSchema(testimonials).omit({ 
  id: true, 
  createdAt: true 
});

export const insertProjectOfferSchema = createInsertSchema(projectOffers).omit({
  id: true,
  status: true,
  depositPaid: true,
  depositAmount: true,
  depositDate: true,
  contactRevealed: true,
  createdAt: true
});

// Relation definitions
export const usersRelations = relations(users, ({ one, many }) => ({
  companyProfile: one(companyProfiles, {
    fields: [users.id],
    references: [companyProfiles.userId],
  }),
  projects: many(projects),
  testimonials: many(testimonials),
  sentMessages: many(messages, { relationName: "sentMessages" }),
  receivedMessages: many(messages, { relationName: "receivedMessages" }),
}));

export const companyProfilesRelations = relations(companyProfiles, ({ one }) => ({
  user: one(users, {
    fields: [companyProfiles.userId],
    references: [users.id],
  }),
}));

export const projectsRelations = relations(projects, ({ one, many }) => ({
  user: one(users, {
    fields: [projects.userId],
    references: [users.id],
  }),
  messages: many(messages),
  offers: many(projectOffers),
}));

export const projectOffersRelations = relations(projectOffers, ({ one }) => ({
  project: one(projects, {
    fields: [projectOffers.projectId],
    references: [projects.id],
  }),
  company: one(companyProfiles, {
    fields: [projectOffers.companyId],
    references: [companyProfiles.id],
  }),
}));

export const messagesRelations = relations(messages, ({ one }) => ({
  fromUser: one(users, {
    fields: [messages.fromUserId],
    references: [users.id],
    relationName: "sentMessages",
  }),
  toUser: one(users, {
    fields: [messages.toUserId],
    references: [users.id],
    relationName: "receivedMessages",
  }),
  project: one(projects, {
    fields: [messages.projectId],
    references: [projects.id],
  }),
}));

export const testimonialsRelations = relations(testimonials, ({ one }) => ({
  user: one(users, {
    fields: [testimonials.userId],
    references: [users.id],
  }),
}));

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type CompanyProfile = typeof companyProfiles.$inferSelect;
export type InsertCompanyProfile = z.infer<typeof insertCompanyProfileSchema>;

export type Project = typeof projects.$inferSelect;
export type InsertProject = z.infer<typeof insertProjectSchema>;

export type Message = typeof messages.$inferSelect;
export type InsertMessage = z.infer<typeof insertMessageSchema>;

export type Testimonial = typeof testimonials.$inferSelect;
export type InsertTestimonial = z.infer<typeof insertTestimonialSchema>;

export type ProjectOffer = typeof projectOffers.$inferSelect;
export type InsertProjectOffer = z.infer<typeof insertProjectOfferSchema>;
