import { pgTable, text, serial, integer, boolean, timestamp, jsonb, varchar } from "drizzle-orm/pg-core";
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
  requiresNda: boolean("requires_nda").default(false), // Indicates if NDA is required
  ndaId: integer("nda_id"), // Reference to NDA document if required
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

// Gamification related schemas
export const userAchievements = pgTable("user_achievements", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  pointsTotal: integer("points_total").default(0).notNull(),
  level: integer("level").default(1).notNull(),
  projectsPosted: integer("projects_posted").default(0),
  projectsCompleted: integer("projects_completed").default(0),
  offersReceived: integer("offers_received").default(0),
  offersAccepted: integer("offers_accepted").default(0),
  responseRate: integer("response_rate").default(0),
  responseTime: integer("response_time_minutes"),
  badges: text("badges").array().default([]),
  streak: integer("streak").default(0),
  lastActive: timestamp("last_active").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const badgeDefinitions = pgTable("badge_definitions", {
  id: serial("id").primaryKey(),
  code: text("code").notNull().unique(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  icon: text("icon").notNull(),
  requiredPoints: integer("required_points"),
  requiredLevel: integer("required_level"),
  requiredProjects: integer("required_projects"),
  requiredOffers: integer("required_offers"),
  category: text("category").notNull(), // "project", "engagement", "special", etc.
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const userActivities = pgTable("user_activities", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  activityType: text("activity_type").notNull(), // "project_post", "offer_submit", etc.
  referenceId: integer("reference_id"), // Optional ID reference to relevant entity
  pointsEarned: integer("points_earned").default(0),
  description: text("description").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertUserAchievementSchema = createInsertSchema(userAchievements).omit({ 
  id: true, 
  updatedAt: true 
});

export const insertBadgeDefinitionSchema = createInsertSchema(badgeDefinitions).omit({ 
  id: true, 
  createdAt: true 
});

export const insertUserActivitySchema = createInsertSchema(userActivities).omit({ 
  id: true, 
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
  ndaAgreement: one(ndaAgreements, {
    fields: [projects.id],
    references: [ndaAgreements.projectId],
  }),
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

// Add relations for new gamification tables
export const userAchievementsRelations = relations(userAchievements, ({ one }) => ({
  user: one(users, {
    fields: [userAchievements.userId],
    references: [users.id],
  }),
}));

export const userActivitiesRelations = relations(userActivities, ({ one }) => ({
  user: one(users, {
    fields: [userActivities.userId],
    references: [users.id],
  }),
}));

// Update user relations to include achievements and activities
export const usersRelationsUpdate = relations(users, ({ one, many }) => ({
  // Existing relations from usersRelations...
  achievements: one(userAchievements, {
    fields: [users.id],
    references: [userAchievements.userId],
  }),
  activities: many(userActivities),
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

// Gamification types
export type UserAchievement = typeof userAchievements.$inferSelect;
export type InsertUserAchievement = z.infer<typeof insertUserAchievementSchema>;

export type BadgeDefinition = typeof badgeDefinitions.$inferSelect;
export type InsertBadgeDefinition = z.infer<typeof insertBadgeDefinitionSchema>;

export type UserActivity = typeof userActivities.$inferSelect;
export type InsertUserActivity = z.infer<typeof insertUserActivitySchema>;

// Site Settings schema
export const siteSettings = pgTable("site_settings", {
  id: serial("id").primaryKey(),
  key: text("key").notNull().unique(),
  value: text("value"),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertSiteSettingsSchema = createInsertSchema(siteSettings).omit({ 
  id: true, 
  updatedAt: true 
});

export type SiteSetting = typeof siteSettings.$inferSelect;
export type InsertSiteSetting = z.infer<typeof insertSiteSettingsSchema>;

// Password Reset Tokens schema
export const passwordResetTokens = pgTable("password_reset_tokens", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  token: varchar("token", { length: 64 }).notNull().unique(),
  email: text("email").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertPasswordResetTokenSchema = createInsertSchema(passwordResetTokens).omit({ 
  id: true, 
  createdAt: true 
});

export type PasswordResetToken = typeof passwordResetTokens.$inferSelect;
export type InsertPasswordResetToken = z.infer<typeof insertPasswordResetTokenSchema>;

export const passwordResetTokensRelations = relations(passwordResetTokens, ({ one }) => ({
  user: one(users, {
    fields: [passwordResetTokens.userId],
    references: [users.id],
  }),
}));

// Newsletter subscribers schema
export const newsletterSubscribers = pgTable("newsletter_subscribers", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  name: text("name"),
  subscribed: boolean("subscribed").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// NDA Agreements schema
export const ndaAgreements = pgTable("nda_agreements", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").notNull().references(() => projects.id),
  pdfUrl: text("pdf_url"), // URL or path to the generated PDF
  status: text("status").notNull().default("pending"), // pending, signed, expired
  companySignatureInfo: jsonb("company_signature_info"), // IP, browser, timestamp
  signedAt: timestamp("signed_at"), // When the company signed
  createdAt: timestamp("created_at").defaultNow().notNull(),
  expiresAt: timestamp("expires_at"), // Optional expiration date
});

export const insertNewsletterSubscriberSchema = createInsertSchema(newsletterSubscribers).omit({ 
  id: true, 
  createdAt: true 
});

export const insertNdaAgreementSchema = createInsertSchema(ndaAgreements).omit({
  id: true,
  status: true,
  createdAt: true,
  signedAt: true
});

export type NewsletterSubscriber = typeof newsletterSubscribers.$inferSelect;
export type InsertNewsletterSubscriber = z.infer<typeof insertNewsletterSubscriberSchema>;

export type NdaAgreement = typeof ndaAgreements.$inferSelect;
export type InsertNdaAgreement = z.infer<typeof insertNdaAgreementSchema>;
