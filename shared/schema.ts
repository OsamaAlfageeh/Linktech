import { pgTable, text, serial, integer, boolean, timestamp, jsonb, varchar, real } from "drizzle-orm/pg-core";
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

// User settings schema
export const userSettings = pgTable("user_settings", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().unique().references(() => users.id),
  emailNotifications: boolean("email_notifications").default(true),
  pushNotifications: boolean("push_notifications").default(true),
  messageNotifications: boolean("message_notifications").default(true),
  offerNotifications: boolean("offer_notifications").default(true),
  systemNotifications: boolean("system_notifications").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
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
  verified: boolean("verified").default(false), // حقل للتوثيق
  verificationDate: timestamp("verification_date"), // تاريخ التوثيق
  verifiedBy: integer("verified_by"), // معرف المسؤول الذي قام بالتوثيق
  verificationDocuments: jsonb("verification_documents"), // مستندات التحقق
  registrationDocument: text("registration_document"), // السجل التجاري
  verificationNotes: text("verification_notes"), // ملاحظات المراجع عن التوثيق
  legalName: text("legal_name"), // الاسم القانوني للشركة
  commercialRegistration: text("commercial_registration"), // رقم السجل التجاري
  vatRegistration: text("vat_registration"), // رقم التسجيل الضريبي
  // معلومات شخصية لتوقيع اتفاقيات عدم الإفصاح
  fullName: text("full_name"), // الاسم الكامل للمفوض بالتوقيع
  nationalId: text("national_id"), // رقم الهوية الوطنية
  phone: text("phone"), // رقم الجوال
  birthDate: text("birth_date"), // تاريخ الميلاد
  address: text("address"), // العنوان الوطني
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

export const insertUserSettingsSchema = createInsertSchema(userSettings).omit({ 
  id: true, 
  createdAt: true,
  updatedAt: true 
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

// Notifications schema
export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  type: text("type").notNull(), // "nda_request", "nda_completed", "proposal", "message", "system", etc.
  title: text("title").notNull(),
  content: text("content").notNull(),
  isRead: boolean("is_read").notNull().default(false),
  actionUrl: text("action_url"), // Optional URL for the action button
  metadata: jsonb("metadata"), // Additional data like projectId, userId, etc.
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertUserAchievementSchema = createInsertSchema(userAchievements).omit({ 
  id: true, 
  updatedAt: true 
});

export const insertNotificationSchema = createInsertSchema(notifications).omit({ 
  id: true, 
  isRead: true,
  createdAt: true 
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
  settings: one(userSettings, {
    fields: [users.id],
    references: [userSettings.userId],
  }),
  projects: many(projects),
  testimonials: many(testimonials),
  sentMessages: many(messages, { relationName: "sentMessages" }),
  receivedMessages: many(messages, { relationName: "receivedMessages" }),
}));

export const userSettingsRelations = relations(userSettings, ({ one }) => ({
  user: one(users, {
    fields: [userSettings.userId],
    references: [users.id],
  }),
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

// Export notification types
export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = z.infer<typeof insertNotificationSchema>;

export type UserSettings = typeof userSettings.$inferSelect;
export type InsertUserSettings = z.infer<typeof insertUserSettingsSchema>;

// Site Settings schema - removed duplicate, using the one defined later

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
  status: text("status").notNull().default("awaiting_entrepreneur"), // awaiting_entrepreneur, ready_for_sadiq, invitation_sent, signed, expired
  companySignatureInfo: jsonb("company_signature_info"), // Company signer details, IP, browser, timestamp
  entrepreneurInfo: jsonb("entrepreneur_info"), // Entrepreneur details for Sadiq integration
  signedAt: timestamp("signed_at"), // When the company signed
  createdAt: timestamp("created_at").defaultNow().notNull(),
  expiresAt: timestamp("expires_at"), // Optional expiration date
  // Sadiq integration fields
  sadiqEnvelopeId: text("sadiq_envelope_id"), // Sadiq envelope ID
  sadiqReferenceNumber: text("sadiq_reference_number"), // Sadiq reference number
  sadiqDocumentId: text("sadiq_document_id"), // Sadiq document ID
  envelopeStatus: text("envelope_status"), // Sadiq envelope status (invitation_sent, in_progress, completed, etc.)
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

export const ndaAgreementsRelations = relations(ndaAgreements, ({ one }) => ({
  project: one(projects, {
    fields: [ndaAgreements.projectId],
    references: [projects.id],
  }),
}));

// Personal information schema (required for NDA agreements)
export const personalInformation = pgTable("personal_information", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id).unique(),
  fullName: text("full_name").notNull(),
  idNumber: text("id_number").notNull(), // National ID (هوية وطنية)
  mobileNumber: text("mobile_number").notNull(),
  dateOfBirth: text("date_of_birth").notNull(),
  nationalAddress: text("national_address").notNull(), // العنوان الوطني
  isComplete: boolean("is_complete").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertPersonalInformationSchema = createInsertSchema(personalInformation).omit({ 
  id: true, 
  isComplete: true,
  createdAt: true,
  updatedAt: true 
});

export type PersonalInformation = typeof personalInformation.$inferSelect;
export type InsertPersonalInformation = z.infer<typeof insertPersonalInformationSchema>;

export const personalInformationRelations = relations(personalInformation, ({ one }) => ({
  user: one(users, {
    fields: [personalInformation.userId],
    references: [users.id],
  }),
}));

// Add personal info to user relations
export const usersPersonalInfoRelation = relations(users, ({ one }) => ({
  personalInfo: one(personalInformation, {
    fields: [users.id],
    references: [personalInformation.userId],
  }),
}));

// العملاء المميزون - Featured Clients
export const featuredClients = pgTable("featured_clients", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  logo: text("logo").notNull(), // URL to the logo image
  website: text("website"),
  description: text("description"),
  category: text("category"), // نوع العميل (تقني، طبي، تجاري، إلخ)
  order: integer("order").default(0), // ترتيب العرض
  active: boolean("active").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertFeaturedClientSchema = createInsertSchema(featuredClients).omit({ 
  id: true,
  createdAt: true,
  updatedAt: true 
});

export type FeaturedClient = typeof featuredClients.$inferSelect;
export type InsertFeaturedClient = z.infer<typeof insertFeaturedClientSchema>;

// مخطط نظام المدونة

// فئات المدونة
export const blogCategories = pgTable("blog_categories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  slug: text("slug").notNull().unique(),
  description: text("description"),
  image: text("image"),
  parentId: integer("parent_id"),
  order: integer("order").default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// المقالات
export const blogPosts = pgTable("blog_posts", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  slug: text("slug").notNull().unique(),
  excerpt: text("excerpt"),
  content: text("content").notNull(),
  status: text("status").notNull().default("draft"), // draft, published, archived
  featuredImage: text("featured_image"),
  authorId: integer("author_id").notNull().references(() => users.id),
  categoryId: integer("category_id").references(() => blogCategories.id),
  tags: text("tags").array(),
  metaTitle: text("meta_title"),
  metaDescription: text("meta_description"),
  metaKeywords: text("meta_keywords"),
  published: boolean("published").default(false),
  views: integer("views").default(0),
  publishedAt: timestamp("published_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// تعليقات المدونة
export const blogComments = pgTable("blog_comments", {
  id: serial("id").primaryKey(),
  postId: integer("post_id").notNull().references(() => blogPosts.id),
  userId: integer("user_id").references(() => users.id),
  parentId: integer("parent_id").references(() => blogComments.id),
  authorName: text("author_name"),
  authorEmail: text("author_email"),
  content: text("content").notNull(),
  status: text("status").notNull().default("pending"), // pending, approved, spam
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// مخططات Insert لنظام المدونة
export const insertBlogCategorySchema = createInsertSchema(blogCategories).omit({ 
  id: true,
  createdAt: true,
  updatedAt: true 
});

export const insertBlogPostSchema = createInsertSchema(blogPosts).omit({ 
  id: true,
  views: true,
  createdAt: true,
  updatedAt: true 
});

export const insertBlogCommentSchema = createInsertSchema(blogComments).omit({ 
  id: true,
  createdAt: true,
  updatedAt: true 
});

// تم نقل نموذج عملاء التميز إلى الجزء الأسفل من الملف

// العلاقات لنظام المدونة
export const blogCategoriesRelations = relations(blogCategories, ({ one, many }) => ({
  parent: one(blogCategories, {
    fields: [blogCategories.parentId],
    references: [blogCategories.id],
    relationName: "parentCategory",
  }),
  children: many(blogCategories, {
    relationName: "parentCategory",
  }),
  posts: many(blogPosts),
}));

export const blogPostsRelations = relations(blogPosts, ({ one, many }) => ({
  author: one(users, {
    fields: [blogPosts.authorId],
    references: [users.id],
  }),
  category: one(blogCategories, {
    fields: [blogPosts.categoryId],
    references: [blogCategories.id],
  }),
  comments: many(blogComments),
}));

export const blogCommentsRelations = relations(blogComments, ({ one, many }) => ({
  post: one(blogPosts, {
    fields: [blogComments.postId],
    references: [blogPosts.id],
  }),
  user: one(users, {
    fields: [blogComments.userId],
    references: [users.id],
  }),
  parent: one(blogComments, {
    fields: [blogComments.parentId],
    references: [blogComments.id],
    relationName: "parentComment",
  }),
  replies: many(blogComments, {
    relationName: "parentComment",
  }),
}));

// تحديث علاقات المستخدم لإضافة المقالات
export const usersBlogRelations = relations(users, ({ many }) => ({
  blogPosts: many(blogPosts),
  blogComments: many(blogComments),
}));

// نموذج عملاء التميز - الجهات والشركاء المميزين
export const premiumClients = pgTable("premium_clients", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  logo: text("logo").notNull(),
  description: text("description").notNull(),
  website: text("website"),
  category: text("category").notNull(), // حكومي، جمعية خيرية، شركة كبرى، إلخ
  benefits: text("benefits").array(), // المزايا الخاصة المقدمة
  featured: boolean("featured").default(false), // هل يتم عرضه في الصفحة الرئيسية
  active: boolean("active").default(true), // نشط أو غير نشط
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertPremiumClientSchema = createInsertSchema(premiumClients).omit({ 
  id: true, 
  createdAt: true,
  updatedAt: true
});

export type PremiumClient = typeof premiumClients.$inferSelect;
export type InsertPremiumClient = z.infer<typeof insertPremiumClientSchema>;

// أنواع البيانات لنظام المدونة
export type BlogCategory = typeof blogCategories.$inferSelect;
export type InsertBlogCategory = z.infer<typeof insertBlogCategorySchema>;

export type BlogPost = typeof blogPosts.$inferSelect;
export type InsertBlogPost = z.infer<typeof insertBlogPostSchema>;

export type BlogComment = typeof blogComments.$inferSelect;
export type InsertBlogComment = z.infer<typeof insertBlogCommentSchema>;

// جدول رسائل نموذج الاتصال
export const contactMessages = pgTable("contact_messages", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  phone: text("phone"),
  subject: text("subject").default("استفسار عام"),
  message: text("message").notNull(),
  status: text("status").notNull().default("new"), // new, read, replied, archived
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  notes: text("admin_notes"),
  replyMessage: text("reply_message"),
  repliedAt: timestamp("replied_at"),
});

export const insertContactMessageSchema = createInsertSchema(contactMessages).omit({ 
  id: true, 
  status: true,
  createdAt: true,
  updatedAt: true,
  notes: true,
  replyMessage: true,
  repliedAt: true 
});

export type ContactMessage = typeof contactMessages.$inferSelect;
export type InsertContactMessage = z.infer<typeof insertContactMessageSchema>;

// جدول إحصائيات الزيارات
export const visitStats = pgTable("visit_stats", {
  id: serial("id").primaryKey(),
  date: text("date").notNull(), // تاريخ بصيغة YYYY-MM-DD
  pageUrl: text("page_url").notNull(), // المسار المزار
  pageTitle: text("page_title"), // عنوان الصفحة
  userAgent: text("user_agent"), // معلومات المتصفح
  ipAddress: text("ip_address"), // عنوان IP (مجهول)
  referrer: text("referrer"), // الموقع المرجع
  sessionId: text("session_id"), // معرف الجلسة
  userId: integer("user_id").references(() => users.id), // المستخدم المسجل (اختياري)
  country: text("country"), // البلد
  city: text("city"), // المدينة
  deviceType: text("device_type"), // نوع الجهاز (desktop, mobile, tablet)
  browserName: text("browser_name"), // اسم المتصفح
  isUniqueVisitor: boolean("is_unique_visitor").default(false), // زائر جديد
  timeSpent: integer("time_spent"), // الوقت المقضي بالثواني
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// جدول إحصائيات يومية مجمعة
export const dailyStats = pgTable("daily_stats", {
  id: serial("id").primaryKey(),
  date: text("date").notNull().unique(), // تاريخ بصيغة YYYY-MM-DD
  totalVisits: integer("total_visits").default(0), // إجمالي الزيارات
  uniqueVisitors: integer("unique_visitors").default(0), // الزوار الفريدون
  pageViews: integer("page_views").default(0), // مشاهدات الصفحات
  avgTimeSpent: integer("avg_time_spent").default(0), // متوسط الوقت المقضي
  bounceRate: integer("bounce_rate").default(0), // معدل الارتداد (%)
  topPages: jsonb("top_pages"), // أهم الصفحات [{url, views}]
  topReferrers: jsonb("top_referrers"), // أهم المراجع [{referrer, visits}]
  deviceStats: jsonb("device_stats"), // إحصائيات الأجهزة {desktop, mobile, tablet}
  browserStats: jsonb("browser_stats"), // إحصائيات المتصفحات
  countryStats: jsonb("country_stats"), // إحصائيات البلدان
  newUsers: integer("new_users").default(0), // المستخدمون الجدد
  returningUsers: integer("returning_users").default(0), // المستخدمون العائدون
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertVisitStatsSchema = createInsertSchema(visitStats).omit({ 
  id: true, 
  createdAt: true 
});

export const insertDailyStatsSchema = createInsertSchema(dailyStats).omit({ 
  id: true, 
  createdAt: true,
  updatedAt: true 
});

export type VisitStats = typeof visitStats.$inferSelect;
export type InsertVisitStats = z.infer<typeof insertVisitStatsSchema>;

export type DailyStats = typeof dailyStats.$inferSelect;
export type InsertDailyStats = z.infer<typeof insertDailyStatsSchema>;

// جداول مساعد الذكاء الاصطناعي للمشاريع
export const aiProjectAnalysis = pgTable("ai_project_analysis", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  sessionId: text("session_id").notNull(),
  projectIdea: text("project_idea").notNull(),
  projectType: text("project_type"), // web, mobile, desktop, ai, etc
  businessSize: text("business_size"), // individual, small, medium, enterprise
  expectedUsers: integer("expected_users"),
  budget: text("budget"), // low, medium, high, custom
  timeline: text("timeline"), // urgent, normal, flexible
  technicalComplexity: text("technical_complexity"), // simple, medium, complex
  integrationNeeds: text("integration_needs").array(),
  securityRequirements: text("security_requirements"), // basic, standard, high
  analysisResult: text("analysis_result").notNull(), // JSON string containing AI analysis
  estimatedCost: text("estimated_cost"),
  recommendedTechnologies: text("recommended_technologies").array(),
  projectPhases: text("project_phases"), // JSON string
  riskAssessment: text("risk_assessment"),
  status: text("status").notNull().default("draft"), // draft, completed, archived
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertAiProjectAnalysisSchema = createInsertSchema(aiProjectAnalysis).omit({ 
  id: true, 
  createdAt: true,
  updatedAt: true
});

export type AiProjectAnalysis = typeof aiProjectAnalysis.$inferSelect;
export type InsertAiProjectAnalysis = z.infer<typeof insertAiProjectAnalysisSchema>;

// جدول قوالب المشاريع المحددة مسبقاً
export const projectTemplates = pgTable("project_templates", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  category: text("category").notNull(), // web, mobile, ai, etc
  description: text("description").notNull(),
  basePrice: integer("base_price"), // السعر الأساسي بالريال
  complexityMultiplier: real("complexity_multiplier").default(1.0),
  estimatedDays: integer("estimated_days"),
  requiredSkills: text("required_skills").array(),
  features: text("features").array(),
  technicalSpecs: text("technical_specs"), // JSON string
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertProjectTemplateSchema = createInsertSchema(projectTemplates).omit({ 
  id: true, 
  createdAt: true,
  updatedAt: true
});

export type ProjectTemplate = typeof projectTemplates.$inferSelect;
export type InsertProjectTemplate = z.infer<typeof insertProjectTemplateSchema>;

// جدول إعدادات الموقع
export const siteSettings = pgTable("site_settings", {
  id: serial("id").primaryKey(),
  key: text("key").notNull().unique(),
  value: text("value").notNull(),
  description: text("description"),
  category: text("category").default("general"),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  updatedBy: integer("updated_by").references(() => users.id),
});

export const insertSiteSettingSchema = createInsertSchema(siteSettings).omit({ 
  id: true, 
  updatedAt: true
});

export type SiteSetting = typeof siteSettings.$inferSelect;
export type InsertSiteSetting = z.infer<typeof insertSiteSettingSchema>;

// جدول تقييم المستخدمين لدقة التوصيات
export const analysisRatings = pgTable("analysis_ratings", {
  id: serial("id").primaryKey(),
  analysisId: integer("analysis_id").references(() => aiProjectAnalysis.id).notNull(),
  userId: integer("user_id").references(() => users.id).notNull(),
  accuracyRating: integer("accuracy_rating"), // 1-5
  usefulnessRating: integer("usefulness_rating"), // 1-5
  priceAccuracy: integer("price_accuracy"), // 1-5
  feedback: text("feedback"),
  actualProjectCost: integer("actual_project_cost"), // التكلفة الفعلية إذا تم تنفيذ المشروع
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertAnalysisRatingSchema = createInsertSchema(analysisRatings).omit({ 
  id: true, 
  createdAt: true
});

export type AnalysisRating = typeof analysisRatings.$inferSelect;
export type InsertAnalysisRating = z.infer<typeof insertAnalysisRatingSchema>;
