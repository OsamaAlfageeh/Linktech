import * as schema from "@shared/schema";
import { 
  User, InsertUser, 
  CompanyProfile, InsertCompanyProfile,
  Project, InsertProject,
  Message, InsertMessage,
  Testimonial, InsertTestimonial,
  ProjectOffer, InsertProjectOffer,
  SiteSetting, InsertSiteSetting,
  siteSettings,
  passwordResetTokens,
  InsertPasswordResetToken,
  NewsletterSubscriber, InsertNewsletterSubscriber,
  newsletterSubscribers,
  NdaAgreement, InsertNdaAgreement,
  ndaAgreements,
  blogCategories, blogPosts, blogComments,
  PremiumClient, InsertPremiumClient,
  premiumClients,
  ContactMessage, InsertContactMessage,
  contactMessages,
  FeaturedClient, InsertFeaturedClient,
  featuredClients,
  Notification, InsertNotification,
  notifications,
  PersonalInformation, InsertPersonalInformation,
  personalInformation,
} from "@shared/schema";
import { sql } from "drizzle-orm";
import { db } from "./db";
import { eq, and, or, desc, asc } from "drizzle-orm";

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getUsers(): Promise<User[]>;
  getUsersByRole(role: string): Promise<User[]>;
  updateUser(id: number, updates: Partial<User>): Promise<User | undefined>;
  updateUserPassword(id: number, hashedPassword: string): Promise<User | undefined>;
  
  // Password reset operations
  createPasswordResetToken(email: string, token: string, expiresAt: Date): Promise<boolean>;
  getPasswordResetToken(token: string): Promise<{userId: number, email: string, expiresAt: Date} | undefined>;
  deletePasswordResetToken(token: string): Promise<boolean>;
  
  // Company profile operations
  getCompanyProfile(id: number): Promise<CompanyProfile | undefined>;
  getCompanyProfileByUserId(userId: number): Promise<CompanyProfile | undefined>;
  createCompanyProfile(profile: InsertCompanyProfile): Promise<CompanyProfile>;
  updateCompanyProfile(id: number, profile: Partial<CompanyProfile>): Promise<CompanyProfile | undefined>;
  getCompanyProfiles(): Promise<CompanyProfile[]>;
  getVerifiedCompanies(): Promise<CompanyProfile[]>;
  verifyCompany(id: number, verified: boolean): Promise<CompanyProfile | undefined>;
  
  // Personal information operations
  getPersonalInformationByUserId(userId: number): Promise<PersonalInformation | undefined>;
  createPersonalInformation(info: InsertPersonalInformation): Promise<PersonalInformation>;
  updatePersonalInformation(userId: number, info: Partial<PersonalInformation>): Promise<PersonalInformation | undefined>;
  
  // Project operations
  getProject(id: number): Promise<Project | undefined>;
  getProjects(): Promise<Project[]>;
  getProjectsWithUserData(): Promise<(Project & { username?: string; name?: string })[]>;
  getProjectsByUserId(userId: number): Promise<Project[]>;
  createProject(project: InsertProject): Promise<Project>;
  updateProject(id: number, project: Partial<Project>): Promise<Project | undefined>;
  deleteProject(id: number): Promise<boolean>;
  
  // Message operations
  getMessage(id: number): Promise<Message | undefined>;
  getMessages(userId: number): Promise<Message[]>;
  getConversation(user1Id: number, user2Id: number, projectId?: number): Promise<Message[]>;
  createMessage(message: InsertMessage): Promise<Message>;
  markMessageAsRead(id: number): Promise<Message | undefined>;
  markAllMessagesAsRead(fromUserId: number, toUserId: number): Promise<number>; // عدد الرسائل التي تم تحديثها
  updateMessageDeliveryStatus(id: number, status: 'pending' | 'delivered' | 'failed'): Promise<Message | undefined>;
  
  // Testimonial operations
  getTestimonial(id: number): Promise<Testimonial | undefined>;
  getTestimonials(): Promise<Testimonial[]>;
  createTestimonial(testimonial: InsertTestimonial): Promise<Testimonial>;

  // Project Offer operations
  getProjectOffer(id: number): Promise<ProjectOffer | undefined>;
  getProjectOffersByProjectId(projectId: number): Promise<ProjectOffer[]>;
  getProjectOffersByCompanyId(companyId: number): Promise<ProjectOffer[]>;
  getAllProjectOffers(): Promise<ProjectOffer[]>;
  createProjectOffer(offer: InsertProjectOffer): Promise<ProjectOffer>;
  updateProjectOfferStatus(id: number, status: string): Promise<ProjectOffer | undefined>;
  setProjectOfferDepositPaid(id: number, depositAmount: string): Promise<ProjectOffer | undefined>;
  setProjectOfferContactRevealed(id: number): Promise<ProjectOffer | undefined>;
  
  // Site Settings operations
  getSiteSetting(key: string): Promise<SiteSetting | undefined>;
  setSiteSetting(key: string, value: string): Promise<SiteSetting>;
  getAllSiteSettings(): Promise<SiteSetting[]>;
  
  // Newsletter Subscriber operations
  getNewsletterSubscriberByEmail(email: string): Promise<NewsletterSubscriber | undefined>;
  createNewsletterSubscriber(subscriber: InsertNewsletterSubscriber): Promise<NewsletterSubscriber>;
  getNewsletterSubscribers(): Promise<NewsletterSubscriber[]>;
  updateNewsletterSubscriber(id: number, updates: Partial<NewsletterSubscriber>): Promise<NewsletterSubscriber | undefined>;
  
  // NDA Agreement operations
  getNdaAgreement(id: number): Promise<NdaAgreement | undefined>;
  getNdaAgreementByProjectId(projectId: number): Promise<NdaAgreement | undefined>;
  getNdaByProjectAndCompany(projectId: number, companyUserId: number): Promise<NdaAgreement | undefined>;
  createNdaAgreement(agreement: InsertNdaAgreement): Promise<NdaAgreement>;
  updateNdaAgreement(id: number, updates: Partial<NdaAgreement>): Promise<NdaAgreement | undefined>;
  updateNdaAgreementStatus(id: number, status: string): Promise<NdaAgreement | undefined>;
  signNdaAgreement(id: number, signatureInfo: any): Promise<NdaAgreement | undefined>;
  getNdaAgreements(): Promise<NdaAgreement[]>;
  setNdaPdfUrl(id: number, pdfUrl: string): Promise<NdaAgreement | undefined>;
  
  // Notification operations
  createNotification(notification: InsertNotification): Promise<Notification>;
  getNotificationsByUserId(userId: number): Promise<Notification[]>;
  markNotificationAsRead(id: number): Promise<Notification | undefined>;
  markAllNotificationsAsRead(userId: number): Promise<void>;
  
  // Blog operations
  getBlogCategories(): Promise<{ id: number; name: string; slug: string; description: string | null; image: string | null; parentId: number | null; order: number | null; createdAt: Date; updatedAt: Date; }[]>;
  getBlogCategory(id: number): Promise<{ id: number; name: string; slug: string; description: string | null; image: string | null; parentId: number | null; order: number | null; createdAt: Date; updatedAt: Date; } | undefined>;
  getBlogCategoryBySlug(slug: string): Promise<{ id: number; name: string; slug: string; description: string | null; image: string | null; parentId: number | null; order: number | null; createdAt: Date; updatedAt: Date; } | undefined>;
  createBlogCategory(category: any): Promise<{ id: number; name: string; slug: string; description: string | null; image: string | null; parentId: number | null; order: number | null; createdAt: Date; updatedAt: Date; }>;
  updateBlogCategory(id: number, category: any): Promise<{ id: number; name: string; slug: string; description: string | null; image: string | null; parentId: number | null; order: number | null; createdAt: Date; updatedAt: Date; } | undefined>;
  deleteBlogCategory(id: number): Promise<boolean>;
  getBlogPosts(categoryId?: number): Promise<{ id: number; title: string; slug: string; excerpt: string | null; content: string; status: string; featuredImage: string | null; authorId: number; categoryId: number | null; tags: string[] | null; metaTitle: string | null; metaDescription: string | null; metaKeywords: string | null; published: boolean | null; views: number | null; publishedAt: Date | null; createdAt: Date; updatedAt: Date; }[]>;
  getBlogPost(id: number): Promise<{ id: number; title: string; slug: string; excerpt: string | null; content: string; status: string; featuredImage: string | null; authorId: number; categoryId: number | null; tags: string[] | null; metaTitle: string | null; metaDescription: string | null; metaKeywords: string | null; published: boolean | null; views: number | null; publishedAt: Date | null; createdAt: Date; updatedAt: Date; } | undefined>;
  getBlogPostBySlug(slug: string): Promise<{ id: number; title: string; slug: string; excerpt: string | null; content: string; status: string; featuredImage: string | null; authorId: number; categoryId: number | null; tags: string[] | null; metaTitle: string | null; metaDescription: string | null; metaKeywords: string | null; published: boolean | null; views: number | null; publishedAt: Date | null; createdAt: Date; updatedAt: Date; } | undefined>;
  createBlogPost(post: any): Promise<{ id: number; title: string; slug: string; excerpt: string | null; content: string; status: string; featuredImage: string | null; authorId: number; categoryId: number | null; tags: string[] | null; metaTitle: string | null; metaDescription: string | null; metaKeywords: string | null; published: boolean | null; views: number | null; publishedAt: Date | null; createdAt: Date; updatedAt: Date; }>;
  updateBlogPost(id: number, post: any): Promise<{ id: number; title: string; slug: string; excerpt: string | null; content: string; status: string; featuredImage: string | null; authorId: number; categoryId: number | null; tags: string[] | null; metaTitle: string | null; metaDescription: string | null; metaKeywords: string | null; published: boolean | null; views: number | null; publishedAt: Date | null; createdAt: Date; updatedAt: Date; } | undefined>;
  deleteBlogPost(id: number): Promise<boolean>;
  incrementBlogPostViewCount(id: number): Promise<boolean>;
  getBlogCommentsByPost(postId: number): Promise<{ id: number; postId: number; userId: number | null; parentId: number | null; authorName: string | null; authorEmail: string | null; content: string; status: string; createdAt: Date; updatedAt: Date; }[]>;
  getBlogComment(id: number): Promise<{ id: number; postId: number; userId: number | null; parentId: number | null; authorName: string | null; authorEmail: string | null; content: string; status: string; createdAt: Date; updatedAt: Date; } | undefined>;
  createBlogComment(comment: any): Promise<{ id: number; postId: number; userId: number | null; parentId: number | null; authorName: string | null; authorEmail: string | null; content: string; status: string; createdAt: Date; updatedAt: Date; }>;
  updateBlogCommentStatus(id: number, status: string): Promise<{ id: number; postId: number; userId: number | null; parentId: number | null; authorName: string | null; authorEmail: string | null; content: string; status: string; createdAt: Date; updatedAt: Date; } | undefined>;
  deleteBlogComment(id: number): Promise<boolean>;
  getPublishedBlogPosts(): Promise<{ id: number; title: string; slug: string; excerpt: string | null; content: string; status: string; featuredImage: string | null; authorId: number; categoryId: number | null; tags: string[] | null; metaTitle: string | null; metaDescription: string | null; metaKeywords: string | null; published: boolean | null; views: number | null; publishedAt: Date | null; createdAt: Date; updatedAt: Date; }[]>;
  getBlogPost(id: number): Promise<{ id: number; title: string; slug: string; excerpt: string | null; content: string; status: string; featuredImage: string | null; authorId: number; categoryId: number | null; tags: string[] | null; metaTitle: string | null; metaDescription: string | null; metaKeywords: string | null; published: boolean | null; views: number | null; publishedAt: Date | null; createdAt: Date; updatedAt: Date; } | undefined>;
  getBlogPostBySlug(slug: string): Promise<{ id: number; title: string; slug: string; excerpt: string | null; content: string; status: string; featuredImage: string | null; authorId: number; categoryId: number | null; tags: string[] | null; metaTitle: string | null; metaDescription: string | null; metaKeywords: string | null; published: boolean | null; views: number | null; publishedAt: Date | null; createdAt: Date; updatedAt: Date; } | undefined>;
  
  // عمليات عملاء التميز
  getPremiumClients(): Promise<PremiumClient[]>;
  getPremiumClientById(id: number): Promise<PremiumClient | undefined>;
  getPremiumClientsByCategory(category: string): Promise<PremiumClient[]>;
  getActivePremiumClients(): Promise<PremiumClient[]>;
  getFeaturedPremiumClients(): Promise<PremiumClient[]>;
  createPremiumClient(client: InsertPremiumClient): Promise<PremiumClient>;
  updatePremiumClient(id: number, updates: Partial<InsertPremiumClient>): Promise<PremiumClient | undefined>;
  deletePremiumClient(id: number): Promise<boolean>;
  
  // عمليات رسائل الاتصال
  getContactMessages(): Promise<ContactMessage[]>;
  getContactMessageById(id: number): Promise<ContactMessage | undefined>;
  createContactMessage(message: InsertContactMessage): Promise<ContactMessage>;
  updateContactMessageStatus(id: number, status: string): Promise<ContactMessage | undefined>;
  addNoteToContactMessage(id: number, note: string): Promise<ContactMessage | undefined>;
  replyToContactMessage(id: number, replyMessage: string): Promise<ContactMessage | undefined>;

  // عمليات مساعد الذكاء الاصطناعي
  createAiProjectAnalysis(analysis: schema.InsertAiProjectAnalysis): Promise<schema.AiProjectAnalysis>;
  getAiProjectAnalysis(id: number): Promise<schema.AiProjectAnalysis | undefined>;
  getUserAiAnalyses(userId: number): Promise<schema.AiProjectAnalysis[]>;
  createAnalysisRating(rating: schema.InsertAnalysisRating): Promise<schema.AnalysisRating>;
  getAnalysisRatings(analysisId: number): Promise<schema.AnalysisRating[]>;
  deleteContactMessage(id: number): Promise<boolean>;
  
  // Featured clients
  getFeaturedClients(): Promise<FeaturedClient[]>;
  getActiveFeaturedClients(): Promise<FeaturedClient[]>;
  getFeaturedClient(id: number): Promise<FeaturedClient | undefined>;
  createFeaturedClient(client: InsertFeaturedClient): Promise<FeaturedClient>;
  updateFeaturedClient(id: number, updates: Partial<FeaturedClient>): Promise<FeaturedClient | undefined>;
  deleteFeaturedClient(id: number): Promise<boolean>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private companyProfiles: Map<number, CompanyProfile>;
  private projects: Map<number, Project>;
  private messages: Map<number, Message>;
  private testimonials: Map<number, Testimonial>;
  private projectOffers: Map<number, ProjectOffer>;
  private siteSettings: Map<string, SiteSetting>;
  private passwordResetTokens: Map<string, {userId: number, email: string, expiresAt: Date}>;
  private newsletterSubscribers: Map<number, NewsletterSubscriber>;
  private ndaAgreements: Map<number, NdaAgreement>;
  private premiumClients: Map<number, PremiumClient>;
  private notifications: Map<number, Notification>;
  private personalInformations: Map<number, PersonalInformation>;
  
  private userIdCounter: number = 1;
  private companyProfileIdCounter: number = 1;
  private projectIdCounter: number = 1;
  private messageIdCounter: number = 1;
  private testimonialIdCounter: number = 1;
  private projectOfferIdCounter: number = 1;
  private siteSettingsIdCounter: number = 1;
  private contactMessageIdCounter: number = 1;
  private aiAnalysisIdCounter: number = 1;
  private analysisRatingIdCounter: number = 1;
  private newsletterSubscriberIdCounter: number = 1;
  private ndaAgreementIdCounter: number = 1;
  private premiumClientIdCounter: number = 1;
  private notificationIdCounter: number = 1;
  private personalInformationIdCounter: number = 1;
  
  constructor() {
    this.users = new Map();
    this.companyProfiles = new Map();
    this.projects = new Map();
    this.messages = new Map();
    this.testimonials = new Map();
    this.projectOffers = new Map();
    this.siteSettings = new Map();
    this.passwordResetTokens = new Map();
    this.newsletterSubscribers = new Map();
    this.ndaAgreements = new Map();
    this.premiumClients = new Map();
    this.notifications = new Map();
    this.personalInformations = new Map();
    this.contactMessages = new Map();
    this.aiProjectAnalyses = new Map();
    this.analysisRatings = new Map();
    
    this.seedData();
    this.seedDefaultSiteSettings();
  }
    getProjectsWithUserData(): Promise<(Project & { username?: string; name?: string; })[]> {
        throw new Error("Method not implemented.");
    }
    deleteProject(id: number): Promise<boolean> {
        throw new Error("Method not implemented.");
    }
    getBlogCategories(): Promise<{ id: number; name: string; slug: string; description: string | null; image: string | null; parentId: number | null; order: number | null; createdAt: Date; updatedAt: Date; }[]> {
        throw new Error("Method not implemented.");
    }
    getBlogCategory(id: number): Promise<{ id: number; name: string; slug: string; description: string | null; image: string | null; parentId: number | null; order: number | null; createdAt: Date; updatedAt: Date; } | undefined> {
        throw new Error("Method not implemented.");
    }
    getBlogCategoryBySlug(slug: string): Promise<{ id: number; name: string; slug: string; description: string | null; image: string | null; parentId: number | null; order: number | null; createdAt: Date; updatedAt: Date; } | undefined> {
        throw new Error("Method not implemented.");
    }
    createBlogCategory(category: any): Promise<{ id: number; name: string; slug: string; description: string | null; image: string | null; parentId: number | null; order: number | null; createdAt: Date; updatedAt: Date; }> {
        throw new Error("Method not implemented.");
    }
    updateBlogCategory(id: number, category: any): Promise<{ id: number; name: string; slug: string; description: string | null; image: string | null; parentId: number | null; order: number | null; createdAt: Date; updatedAt: Date; } | undefined> {
        throw new Error("Method not implemented.");
    }
    deleteBlogCategory(id: number): Promise<boolean> {
        throw new Error("Method not implemented.");
    }
    getBlogPosts(categoryId?: number): Promise<{ id: number; title: string; slug: string; excerpt: string | null; content: string; status: string; featuredImage: string | null; authorId: number; categoryId: number | null; tags: string[] | null; metaTitle: string | null; metaDescription: string | null; metaKeywords: string | null; published: boolean | null; views: number | null; publishedAt: Date | null; createdAt: Date; updatedAt: Date; }[]> {
        throw new Error("Method not implemented.");
    }
    getBlogPost(id: number): Promise<{ id: number; title: string; slug: string; excerpt: string | null; content: string; status: string; featuredImage: string | null; authorId: number; categoryId: number | null; tags: string[] | null; metaTitle: string | null; metaDescription: string | null; metaKeywords: string | null; published: boolean | null; views: number | null; publishedAt: Date | null; createdAt: Date; updatedAt: Date; } | undefined>;
    getBlogPost(id: number): Promise<{ id: number; title: string; slug: string; excerpt: string | null; content: string; status: string; featuredImage: string | null; authorId: number; categoryId: number | null; tags: string[] | null; metaTitle: string | null; metaDescription: string | null; metaKeywords: string | null; published: boolean | null; views: number | null; publishedAt: Date | null; createdAt: Date; updatedAt: Date; } | undefined>;
    getBlogPost(id: unknown): Promise<{ id: number; title: string; slug: string; excerpt: string | null; content: string; status: string; featuredImage: string | null; authorId: number; categoryId: number | null; tags: string[] | null; metaTitle: string | null; metaDescription: string | null; metaKeywords: string | null; published: boolean | null; views: number | null; publishedAt: Date | null; createdAt: Date; updatedAt: Date; } | undefined> | Promise<{ id: number; title: string; slug: string; excerpt: string | null; content: string; status: string; featuredImage: string | null; authorId: number; categoryId: number | null; tags: string[] | null; metaTitle: string | null; metaDescription: string | null; metaKeywords: string | null; published: boolean | null; views: number | null; publishedAt: Date | null; createdAt: Date; updatedAt: Date; } | undefined> {
        throw new Error("Method not implemented.");
    }
    getBlogPostBySlug(slug: string): Promise<{ id: number; title: string; slug: string; excerpt: string | null; content: string; status: string; featuredImage: string | null; authorId: number; categoryId: number | null; tags: string[] | null; metaTitle: string | null; metaDescription: string | null; metaKeywords: string | null; published: boolean | null; views: number | null; publishedAt: Date | null; createdAt: Date; updatedAt: Date; } | undefined>;
    getBlogPostBySlug(slug: string): Promise<{ id: number; title: string; slug: string; excerpt: string | null; content: string; status: string; featuredImage: string | null; authorId: number; categoryId: number | null; tags: string[] | null; metaTitle: string | null; metaDescription: string | null; metaKeywords: string | null; published: boolean | null; views: number | null; publishedAt: Date | null; createdAt: Date; updatedAt: Date; } | undefined>;
    getBlogPostBySlug(slug: unknown): Promise<{ id: number; title: string; slug: string; excerpt: string | null; content: string; status: string; featuredImage: string | null; authorId: number; categoryId: number | null; tags: string[] | null; metaTitle: string | null; metaDescription: string | null; metaKeywords: string | null; published: boolean | null; views: number | null; publishedAt: Date | null; createdAt: Date; updatedAt: Date; } | undefined> | Promise<{ id: number; title: string; slug: string; excerpt: string | null; content: string; status: string; featuredImage: string | null; authorId: number; categoryId: number | null; tags: string[] | null; metaTitle: string | null; metaDescription: string | null; metaKeywords: string | null; published: boolean | null; views: number | null; publishedAt: Date | null; createdAt: Date; updatedAt: Date; } | undefined> {
        throw new Error("Method not implemented.");
    }
    createBlogPost(post: any): Promise<{ id: number; title: string; slug: string; excerpt: string | null; content: string; status: string; featuredImage: string | null; authorId: number; categoryId: number | null; tags: string[] | null; metaTitle: string | null; metaDescription: string | null; metaKeywords: string | null; published: boolean | null; views: number | null; publishedAt: Date | null; createdAt: Date; updatedAt: Date; }> {
        throw new Error("Method not implemented.");
    }
    updateBlogPost(id: number, post: any): Promise<{ id: number; title: string; slug: string; excerpt: string | null; content: string; status: string; featuredImage: string | null; authorId: number; categoryId: number | null; tags: string[] | null; metaTitle: string | null; metaDescription: string | null; metaKeywords: string | null; published: boolean | null; views: number | null; publishedAt: Date | null; createdAt: Date; updatedAt: Date; } | undefined> {
        throw new Error("Method not implemented.");
    }
    deleteBlogPost(id: number): Promise<boolean> {
        throw new Error("Method not implemented.");
    }
    incrementBlogPostViewCount(id: number): Promise<boolean> {
        throw new Error("Method not implemented.");
    }
    getBlogCommentsByPost(postId: number): Promise<{ id: number; postId: number; userId: number | null; parentId: number | null; authorName: string | null; authorEmail: string | null; content: string; status: string; createdAt: Date; updatedAt: Date; }[]> {
        throw new Error("Method not implemented.");
    }
    getBlogComment(id: number): Promise<{ id: number; postId: number; userId: number | null; parentId: number | null; authorName: string | null; authorEmail: string | null; content: string; status: string; createdAt: Date; updatedAt: Date; } | undefined> {
        throw new Error("Method not implemented.");
    }
    createBlogComment(comment: any): Promise<{ id: number; postId: number; userId: number | null; parentId: number | null; authorName: string | null; authorEmail: string | null; content: string; status: string; createdAt: Date; updatedAt: Date; }> {
        throw new Error("Method not implemented.");
    }
    updateBlogCommentStatus(id: number, status: string): Promise<{ id: number; postId: number; userId: number | null; parentId: number | null; authorName: string | null; authorEmail: string | null; content: string; status: string; createdAt: Date; updatedAt: Date; } | undefined> {
        throw new Error("Method not implemented.");
    }
    deleteBlogComment(id: number): Promise<boolean> {
        throw new Error("Method not implemented.");
    }
    getPublishedBlogPosts(): Promise<{ id: number; title: string; slug: string; excerpt: string | null; content: string; status: string; featuredImage: string | null; authorId: number; categoryId: number | null; tags: string[] | null; metaTitle: string | null; metaDescription: string | null; metaKeywords: string | null; published: boolean | null; views: number | null; publishedAt: Date | null; createdAt: Date; updatedAt: Date; }[]> {
        throw new Error("Method not implemented.");
    }
    getContactMessages(): Promise<ContactMessage[]> {
        throw new Error("Method not implemented.");
    }
    getContactMessageById(id: number): Promise<ContactMessage | undefined> {
        throw new Error("Method not implemented.");
    }
    createContactMessage(message: InsertContactMessage): Promise<ContactMessage> {
        throw new Error("Method not implemented.");
    }
    updateContactMessageStatus(id: number, status: string): Promise<ContactMessage | undefined> {
        throw new Error("Method not implemented.");
    }
    addNoteToContactMessage(id: number, note: string): Promise<ContactMessage | undefined> {
        throw new Error("Method not implemented.");
    }
    replyToContactMessage(id: number, replyMessage: string): Promise<ContactMessage | undefined> {
        throw new Error("Method not implemented.");
    }
    createAiProjectAnalysis(analysis: schema.InsertAiProjectAnalysis): Promise<schema.AiProjectAnalysis> {
        throw new Error("Method not implemented.");
    }
    getAiProjectAnalysis(id: number): Promise<schema.AiProjectAnalysis | undefined> {
        throw new Error("Method not implemented.");
    }
    getUserAiAnalyses(userId: number): Promise<schema.AiProjectAnalysis[]> {
        throw new Error("Method not implemented.");
    }
    createAnalysisRating(rating: schema.InsertAnalysisRating): Promise<schema.AnalysisRating> {
        throw new Error("Method not implemented.");
    }
    getAnalysisRatings(analysisId: number): Promise<schema.AnalysisRating[]> {
        throw new Error("Method not implemented.");
    }
    deleteContactMessage(id: number): Promise<boolean> {
        throw new Error("Method not implemented.");
    }
    getFeaturedClients(): Promise<FeaturedClient[]> {
        throw new Error("Method not implemented.");
    }
    getActiveFeaturedClients(): Promise<FeaturedClient[]> {
        throw new Error("Method not implemented.");
    }
    getFeaturedClient(id: number): Promise<FeaturedClient | undefined> {
        throw new Error("Method not implemented.");
    }
    createFeaturedClient(client: InsertFeaturedClient): Promise<FeaturedClient> {
        throw new Error("Method not implemented.");
    }
    updateFeaturedClient(id: number, updates: Partial<FeaturedClient>): Promise<FeaturedClient | undefined> {
        throw new Error("Method not implemented.");
    }
    deleteFeaturedClient(id: number): Promise<boolean> {
        throw new Error("Method not implemented.");
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
  
  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.email === email,
    );
  }
  
  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userIdCounter++;
    const now = new Date();
    const user: User = { ...insertUser, id, createdAt: now };
    this.users.set(id, user);
    return user;
  }
  
  async getUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }
  
  async getUsersByRole(role: string): Promise<User[]> {
    return Array.from(this.users.values()).filter(user => user.role === role);
  }

  async updateUser(id: number, updates: Partial<User>): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;
    
    const updatedUser = { ...user, ...updates };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  async updateUserPassword(id: number, hashedPassword: string): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;
    
    const updatedUser = { ...user, password: hashedPassword };
    this.users.set(id, updatedUser);
    return updatedUser;
  }
  
  // Password reset operations
  async createPasswordResetToken(email: string, token: string, expiresAt: Date): Promise<boolean> {
    try {
      const user = await this.getUserByEmail(email);
      if (!user) {
        return false;
      }
      
      // Store the token with user info
      this.passwordResetTokens.set(token, {
        userId: user.id,
        email: user.email,
        expiresAt
      });
      
      return true;
    } catch (error) {
      console.error('Error creating password reset token:', error);
      return false;
    }
  }
  
  async getPasswordResetToken(token: string): Promise<{userId: number, email: string, expiresAt: Date} | undefined> {
    const tokenData = this.passwordResetTokens.get(token);
    
    if (!tokenData) {
      return undefined;
    }
    
    // Check if token has expired
    if (tokenData.expiresAt < new Date()) {
      // Expired token, remove it and return undefined
      this.passwordResetTokens.delete(token);
      return undefined;
    }
    
    return tokenData;
  }
  
  async deletePasswordResetToken(token: string): Promise<boolean> {
    return this.passwordResetTokens.delete(token);
  }
  
  // Company profile operations
  async getCompanyProfile(id: number): Promise<CompanyProfile | undefined> {
    return this.companyProfiles.get(id);
  }
  
  async getCompanyProfileByUserId(userId: number): Promise<CompanyProfile | undefined> {
    return Array.from(this.companyProfiles.values()).find(
      (profile) => profile.userId === userId,
    );
  }
  
  async createCompanyProfile(profile: InsertCompanyProfile): Promise<CompanyProfile> {
    const id = this.companyProfileIdCounter++;
    const companyProfile: CompanyProfile = { 
      ...profile, 
      id, 
      rating: 0,
      reviewCount: 0 
    };
    this.companyProfiles.set(id, companyProfile);
    return companyProfile;
  }
  
  async updateCompanyProfile(id: number, updates: Partial<CompanyProfile>): Promise<CompanyProfile | undefined> {
    const profile = this.companyProfiles.get(id);
    if (!profile) return undefined;
    
    const updatedProfile = { ...profile, ...updates };
    this.companyProfiles.set(id, updatedProfile);
    return updatedProfile;
  }
  
  async getCompanyProfiles(): Promise<CompanyProfile[]> {
    return Array.from(this.companyProfiles.values());
  }
  
  async getVerifiedCompanies(): Promise<CompanyProfile[]> {
    return Array.from(this.companyProfiles.values()).filter(
      (profile) => profile.verified === true
    );
  }
  
  async verifyCompany(id: number, verified: boolean): Promise<CompanyProfile | undefined> {
    const profile = this.companyProfiles.get(id);
    if (!profile) return undefined;
    
    const updatedProfile = { ...profile, verified };
    this.companyProfiles.set(id, updatedProfile);
    return updatedProfile;
  }
  
  // Personal information operations
  async getPersonalInformationByUserId(userId: number): Promise<PersonalInformation | undefined> {
    return Array.from(this.personalInformations.values()).find(
      (info) => info.userId === userId,
    );
  }
  
  async createPersonalInformation(info: InsertPersonalInformation): Promise<PersonalInformation> {
    const id = this.personalInformationIdCounter++;
    const now = new Date();
    const personalInfo: PersonalInformation = { 
      ...info, 
      id,
      isComplete: true,
      createdAt: now,
      updatedAt: now
    };
    this.personalInformations.set(id, personalInfo);
    return personalInfo;
  }
  
  async updatePersonalInformation(userId: number, info: Partial<PersonalInformation>): Promise<PersonalInformation | undefined> {
    const existingInfo = await this.getPersonalInformationByUserId(userId);
    if (!existingInfo) return undefined;
    
    const updatedInfo = { 
      ...existingInfo, 
      ...info, 
      updatedAt: new Date() 
    };
    this.personalInformations.set(existingInfo.id, updatedInfo);
    return updatedInfo;
  }
  
  // Project operations
  async getProject(id: number): Promise<Project | undefined> {
    return this.projects.get(id);
  }
  
  async getProjects(): Promise<Project[]> {
    return Array.from(this.projects.values());
  }
  
  async getProjectsByUserId(userId: number): Promise<Project[]> {
    return Array.from(this.projects.values()).filter(
      (project) => project.userId === userId,
    );
  }
  
  async createProject(project: InsertProject): Promise<Project> {
    const id = this.projectIdCounter++;
    const now = new Date();
    const newProject: Project = { 
      ...project, 
      id, 
      status: "open", 
      highlightStatus: undefined,
      createdAt: now 
    };
    this.projects.set(id, newProject);
    return newProject;
  }
  
  async updateProject(id: number, updates: Partial<Project>): Promise<Project | undefined> {
    const project = this.projects.get(id);
    if (!project) return undefined;
    
    const updatedProject = { ...project, ...updates };
    this.projects.set(id, updatedProject);
    return updatedProject;
  }

  
  // Message operations
  async getMessage(id: number): Promise<Message | undefined> {
    return this.messages.get(id);
  }
  
  async getMessages(userId: number): Promise<Message[]> {
    return Array.from(this.messages.values()).filter(
      (message) => message.toUserId === userId || message.fromUserId === userId,
    );
  }
  
  async getConversation(user1Id: number, user2Id: number, projectId?: number): Promise<Message[]> {
    return Array.from(this.messages.values())
      .filter(message => {
        const usersMatch = (
          (message.fromUserId === user1Id && message.toUserId === user2Id) ||
          (message.fromUserId === user2Id && message.toUserId === user1Id)
        );
        
        if (projectId) {
          return usersMatch && message.projectId === projectId;
        }
        
        return usersMatch;
      })
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  }
  
  async createMessage(message: InsertMessage): Promise<Message> {
    const id = this.messageIdCounter++;
    const now = new Date();
    const newMessage: Message = { ...message, id, read: false, createdAt: now };
    this.messages.set(id, newMessage);
    return newMessage;
  }
  
  async markMessageAsRead(id: number): Promise<Message | undefined> {
    const message = this.messages.get(id);
    if (!message) return undefined;
    
    const updatedMessage = { ...message, read: true };
    this.messages.set(id, updatedMessage);
    return updatedMessage;
  }
  
  async markAllMessagesAsRead(fromUserId: number, toUserId: number): Promise<number> {
    // تحديث جميع الرسائل غير المقروءة من مرسل معين إلى مستقبل معين
    let updatedCount = 0;
    
    // الحصول على جميع الرسائل من المرسل إلى المستقبل
    const messagesToUpdate = Array.from(this.messages.values())
      .filter(message => message.fromUserId === fromUserId && message.toUserId === toUserId && !message.read);
    
    // تحديث كل رسالة
    for (const message of messagesToUpdate) {
      const updatedMessage = { ...message, read: true };
      this.messages.set(message.id, updatedMessage);
      updatedCount++;
    }
    
    return updatedCount;
  }
  
  async updateMessageDeliveryStatus(id: number, status: 'pending' | 'delivered' | 'failed'): Promise<Message | undefined> {
    const message = this.messages.get(id);
    if (!message) return undefined;
    
    // إضافة حالة التسليم كخاصية إضافية
    const updatedMessage = { 
      ...message, 
      deliveryStatus: status,
      updatedAt: new Date() 
    };
    
    this.messages.set(id, updatedMessage);
    return updatedMessage;
  }
  
  // Testimonial operations
  async getTestimonial(id: number): Promise<Testimonial | undefined> {
    return this.testimonials.get(id);
  }
  
  async getTestimonials(): Promise<Testimonial[]> {
    return Array.from(this.testimonials.values());
  }
  
  async createTestimonial(testimonial: InsertTestimonial): Promise<Testimonial> {
    const id = this.testimonialIdCounter++;
    const now = new Date();
    const newTestimonial: Testimonial = { ...testimonial, id, createdAt: now };
    this.testimonials.set(id, newTestimonial);
    return newTestimonial;
  }
  
  // Project Offer operations
  async getProjectOffer(id: number): Promise<ProjectOffer | undefined> {
    return this.projectOffers.get(id);
  }
  
  async getProjectOffersByProjectId(projectId: number): Promise<ProjectOffer[]> {
    return Array.from(this.projectOffers.values()).filter(
      (offer) => offer.projectId === projectId
    );
  }
  
  async getProjectOffersByCompanyId(companyId: number): Promise<ProjectOffer[]> {
    return Array.from(this.projectOffers.values()).filter(
      (offer) => offer.companyId === companyId
    );
  }
  
  async getAllProjectOffers(): Promise<ProjectOffer[]> {
    return Array.from(this.projectOffers.values());
  }
  
  async createProjectOffer(offer: InsertProjectOffer): Promise<ProjectOffer> {
    const id = this.projectOfferIdCounter++;
    const now = new Date();
    const newOffer: ProjectOffer = { 
      ...offer, 
      id, 
      status: 'pending',
      depositPaid: false,
      depositAmount: null,
      depositDate: null,
      contactRevealed: false,
      createdAt: now 
    };
    this.projectOffers.set(id, newOffer);
    return newOffer;
  }
  
  async updateProjectOfferStatus(id: number, status: string): Promise<ProjectOffer | undefined> {
    const offer = this.projectOffers.get(id);
    if (!offer) return undefined;
    
    const updatedOffer = { ...offer, status };
    this.projectOffers.set(id, updatedOffer);
    return updatedOffer;
  }
  
  async setProjectOfferDepositPaid(id: number, depositAmount: string): Promise<ProjectOffer | undefined> {
    const offer = this.projectOffers.get(id);
    if (!offer) return undefined;
    
    console.log(`تحديث معلومات دفع العربون للعرض رقم ${id}، المبلغ: ${depositAmount}`);
    
    const updatedOffer = { 
      ...offer, 
      depositPaid: true,
      depositAmount,
      depositDate: new Date()
    };
    this.projectOffers.set(id, updatedOffer);
    
    console.log(`تم تحديث حالة دفع العربون للعرض رقم ${id}، الحالة الجديدة:`, updatedOffer.depositPaid);
    
    // تخزين حالة الدفع في ذاكرة المتصفح عبر localStorage
    const companyId = updatedOffer.companyId;
    console.log(`حفظ معلومات شركة ${companyId} في قائمة الشركات المكشوفة`);
    
    return updatedOffer;
  }
  
  async setProjectOfferContactRevealed(id: number): Promise<ProjectOffer | undefined> {
    const offer = this.projectOffers.get(id);
    if (!offer) return undefined;
    
    console.log(`كشف معلومات التواصل للعرض رقم ${id}`);
    
    const updatedOffer = { ...offer, contactRevealed: true };
    this.projectOffers.set(id, updatedOffer);
    
    console.log(`تم تحديث حالة كشف معلومات التواصل للعرض رقم ${id}، الحالة الجديدة:`, updatedOffer.contactRevealed);
    
    return updatedOffer;
  }
  
  // Site Settings operations
  async getSiteSetting(key: string): Promise<SiteSetting | undefined> {
    return Array.from(this.siteSettings.values()).find(
      (setting) => setting.key === key
    );
  }
  
  async setSiteSetting(key: string, value: string): Promise<SiteSetting> {
    const now = new Date();
    
    // البحث عن الإعداد الموجود بناءً على المفتاح
    let existingId: string | null = null;
    for (const [id, setting] of this.siteSettings.entries()) {
      if (setting.key === key) {
        existingId = id;
        break;
      }
    }
    
    if (existingId) {
      // تحديث الإعداد الموجود
      const existingSetting = this.siteSettings.get(existingId)!;
      const updatedSetting: SiteSetting = { 
        ...existingSetting, 
        value, 
        updatedAt: now 
      };
      this.siteSettings.set(existingId, updatedSetting);
      console.log(`setSiteSetting: تم تحديث ${key} = ${value}`);
      return updatedSetting;
    } else {
      // إنشاء إعداد جديد
      const id = this.siteSettingsIdCounter++;
      const newSetting: SiteSetting = { 
        id, 
        key, 
        value, 
        updatedAt: now 
      };
      this.siteSettings.set(id.toString(), newSetting);
      console.log(`setSiteSetting: تم إنشاء ${key} = ${value} مع معرف ${id}`);
      return newSetting;
    }
  }
  
  async getAllSiteSettings(): Promise<SiteSetting[]> {
    const settings = Array.from(this.siteSettings.values());
    console.log(`getAllSiteSettings: إرجاع ${settings.length} إعدادات`);
    return settings;
  }

  // إضافة إعدادات افتراضية للموقع
  private seedDefaultSiteSettings() {
    console.log('تحميل الإعدادات الافتراضية للموقع...');
    const defaultSettings = [
      { key: 'contact_email', value: 'info@linktech.sa' },
      { key: 'contact_phone', value: '+966501234567' },
      { key: 'contact_address', value: 'الرياض، المملكة العربية السعودية' },
      { key: 'contact_whatsapp', value: '+966501234567' },
      { key: 'business_hours', value: 'الأحد - الخميس: 9:00 صباحاً - 5:00 مساءً' }
    ];

    defaultSettings.forEach(setting => {
      const id = this.siteSettingsIdCounter++;
      const siteSetting: SiteSetting = {
        id,
        key: setting.key,
        value: setting.value,
        updatedAt: new Date()
      };
      this.siteSettings.set(id.toString(), siteSetting);
      console.log(`تم إضافة إعداد: ${setting.key} = ${setting.value}`);
    });
    console.log(`تم تحميل ${this.siteSettings.size} إعدادات افتراضية`);
  }
  
  // Newsletter Subscriber operations
  async getNewsletterSubscriberByEmail(email: string): Promise<NewsletterSubscriber | undefined> {
    return Array.from(this.newsletterSubscribers.values()).find(
      (subscriber) => subscriber.email === email
    );
  }
  
  async createNewsletterSubscriber(subscriber: InsertNewsletterSubscriber): Promise<NewsletterSubscriber> {
    const id = this.newsletterSubscriberIdCounter++;
    const now = new Date();
    const newSubscriber: NewsletterSubscriber = { 
      ...subscriber, 
      id, 
      createdAt: now 
    };
    this.newsletterSubscribers.set(id, newSubscriber);
    return newSubscriber;
  }
  
  async getNewsletterSubscribers(): Promise<NewsletterSubscriber[]> {
    return Array.from(this.newsletterSubscribers.values());
  }
  
  async updateNewsletterSubscriber(id: number, updates: Partial<NewsletterSubscriber>): Promise<NewsletterSubscriber | undefined> {
    const subscriber = this.newsletterSubscribers.get(id);
    if (!subscriber) return undefined;
    
    const updatedSubscriber = { ...subscriber, ...updates };
    this.newsletterSubscribers.set(id, updatedSubscriber);
    return updatedSubscriber;
  }
  
  // NDA Agreement operations
  async getNdaAgreement(id: number): Promise<NdaAgreement | undefined> {
    return this.ndaAgreements.get(id);
  }
  
  async getNdaAgreementByProjectId(projectId: number): Promise<NdaAgreement | undefined> {
    return Array.from(this.ndaAgreements.values()).find(
      (agreement) => agreement.projectId === projectId
    );
  }
  
  async createNdaAgreement(agreement: InsertNdaAgreement): Promise<NdaAgreement> {
    const id = this.ndaAgreementIdCounter++;
    const now = new Date();
    const newAgreement: NdaAgreement = {
      ...agreement,
      id,
      createdAt: now,
      status: 'pending',
      signedAt: null,
      pdfUrl: null,
      sadiqEnvelopeId: null,
      sadiqReferenceNumber: null,
      sadiqDocumentId: null,
      envelopeStatus: null
    };
    this.ndaAgreements.set(id, newAgreement);
    
    // If this NDA is linked to a project, update the project's ndaId
    if (agreement.projectId) {
      const project = this.projects.get(agreement.projectId);
      if (project) {
        const updatedProject = { ...project, ndaId: id, requiresNda: true };
        this.projects.set(agreement.projectId, updatedProject);
      }
    }
    
    return newAgreement;
  }

  async updateNdaAgreement(id: number, updates: Partial<NdaAgreement>): Promise<NdaAgreement | undefined> {
    const agreement = this.ndaAgreements.get(id);
    if (!agreement) return undefined;
    
    const updatedAgreement = { ...agreement, ...updates };
    this.ndaAgreements.set(id, updatedAgreement);
    return updatedAgreement;
  }
  
  async updateNdaAgreementStatus(id: number, status: string): Promise<NdaAgreement | undefined> {
    const agreement = this.ndaAgreements.get(id);
    if (!agreement) return undefined;
    
    const updatedAgreement = { ...agreement, status };
    this.ndaAgreements.set(id, updatedAgreement);
    return updatedAgreement;
  }

  // New methods for two-stage NDA workflow
  async getNdaByProjectAndCompany(projectId: number, companyUserId: number): Promise<NdaAgreement | undefined> {
    return Array.from(this.ndaAgreements.values()).find(
      (nda) => nda.projectId === projectId && 
        (nda.companySignatureInfo as any)?.companyUserId === companyUserId
    );
  }

  async getNda(id: number): Promise<NdaAgreement | undefined> {
    return this.ndaAgreements.get(id);
  }

  async createNda(ndaData: Partial<NdaAgreement>): Promise<NdaAgreement> {
    const id = this.ndaAgreementIdCounter++;
    const now = new Date();
    const newNda: NdaAgreement = {
      id,
      projectId: ndaData.projectId!,
      status: ndaData.status || 'awaiting_entrepreneur',
      companySignatureInfo: ndaData.companySignatureInfo || null,
      entrepreneurInfo: ndaData.entrepreneurInfo || null,
      createdAt: now,
      signedAt: null,
      expiresAt: null,
      pdfUrl: null,
      sadiqEnvelopeId: null,
      sadiqReferenceNumber: null,
      sadiqDocumentId: null,
      envelopeStatus: null,
      ...ndaData
    };
    this.ndaAgreements.set(id, newNda);
    return newNda;
  }

  async updateNda(id: number, updates: Partial<NdaAgreement>): Promise<NdaAgreement | undefined> {
    const nda = this.ndaAgreements.get(id);
    if (!nda) return undefined;
    
    const updatedNda = { ...nda, ...updates };
    this.ndaAgreements.set(id, updatedNda);
    return updatedNda;
  }

  // Notification methods
  async createNotification(notification: InsertNotification): Promise<Notification> {
    const id = this.notificationIdCounter++;
    const now = new Date();
    const newNotification: Notification = {
      ...notification,
      id,
      isRead: false,
      createdAt: now,
    };
    this.notifications.set(id, newNotification);
    return newNotification;
  }

  async getNotificationsByUserId(userId: number): Promise<Notification[]> {
    return Array.from(this.notifications.values())
      .filter(notification => notification.userId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async markNotificationAsRead(id: number): Promise<Notification | undefined> {
    const notification = this.notifications.get(id);
    if (!notification) return undefined;
    
    const updatedNotification = { ...notification, isRead: true };
    this.notifications.set(id, updatedNotification);
    return updatedNotification;
  }

  async markAllNotificationsAsRead(userId: number): Promise<void> {
    for (const [id, notification] of this.notifications.entries()) {
      if (notification.userId === userId && !notification.isRead) {
        const updatedNotification = { ...notification, isRead: true };
        this.notifications.set(parseInt(id), updatedNotification);
      }
    }
  }
  
  async signNdaAgreement(id: number, signatureInfo: any): Promise<NdaAgreement | undefined> {
    const agreement = this.ndaAgreements.get(id);
    if (!agreement) return undefined;
    
    const now = new Date();
    const updatedAgreement = { 
      ...agreement, 
      status: 'signed',
      signedAt: now,
      companySignatureInfo: signatureInfo
    };
    this.ndaAgreements.set(id, updatedAgreement);
    return updatedAgreement;
  }
  
  async getNdaAgreements(): Promise<NdaAgreement[]> {
    return Array.from(this.ndaAgreements.values());
  }
  
  async setNdaPdfUrl(id: number, pdfUrl: string): Promise<NdaAgreement | undefined> {
    const agreement = this.ndaAgreements.get(id);
    if (!agreement) return undefined;
    
    const updatedAgreement = { ...agreement, pdfUrl };
    this.ndaAgreements.set(id, updatedAgreement);
    return updatedAgreement;
  }
  
  // وظائف عملاء التميز
  async getPremiumClients(): Promise<PremiumClient[]> {
    return Array.from(this.premiumClients.values());
  }
  
  async getPremiumClientById(id: number): Promise<PremiumClient | undefined> {
    return this.premiumClients.get(id);
  }
  
  async getPremiumClientsByCategory(category: string): Promise<PremiumClient[]> {
    return Array.from(this.premiumClients.values()).filter(
      (client) => client.category === category
    );
  }
  
  async getActivePremiumClients(): Promise<PremiumClient[]> {
    return Array.from(this.premiumClients.values()).filter(
      (client) => client.active === true
    );
  }
  
  async getFeaturedPremiumClients(): Promise<PremiumClient[]> {
    return Array.from(this.premiumClients.values()).filter(
      (client) => client.featured === true && client.active === true
    );
  }
  
  async createPremiumClient(client: InsertPremiumClient): Promise<PremiumClient> {
    const id = this.premiumClientIdCounter++;
    const now = new Date();
    const premiumClient: PremiumClient = { 
      ...client, 
      id, 
      createdAt: now, 
      updatedAt: now
    };
    this.premiumClients.set(id, premiumClient);
    return premiumClient;
  }
  
  async updatePremiumClient(id: number, updates: Partial<InsertPremiumClient>): Promise<PremiumClient | undefined> {
    const client = this.premiumClients.get(id);
    if (!client) return undefined;
    
    const updatedClient = { 
      ...client, 
      ...updates, 
      updatedAt: new Date() 
    };
    this.premiumClients.set(id, updatedClient);
    return updatedClient;
  }
  
  async deletePremiumClient(id: number): Promise<boolean> {
    return this.premiumClients.delete(id);
  }
  
  // Seed initial data
  private seedData() {
    // إضافة بعض عملاء التميز للاختبار
    const client1: PremiumClient = {
      id: this.premiumClientIdCounter++,
      name: "شركة المستقبل",
      description: "شركة رائدة في مجال تطوير التطبيقات والحلول التقنية المبتكرة",
      logo: "https://placehold.co/400x200/2563eb/ffffff?text=المستقبل",
      category: "تكنولوجيا المعلومات",
      website: "https://example.com",
      benefits: ["تطوير تطبيقات متكاملة", "حلول ذكاء اصطناعي", "استشارات تقنية"],
      featured: true,
      active: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.premiumClients.set(client1.id, client1);

    const client2: PremiumClient = {
      id: this.premiumClientIdCounter++,
      name: "مؤسسة الإبداع",
      description: "مؤسسة متخصصة في دعم المشاريع الريادية وتطوير حلول الأعمال الرقمية",
      logo: "https://placehold.co/400x200/059669/ffffff?text=الإبداع",
      category: "ريادة الأعمال",
      website: "https://example.org",
      benefits: ["تمويل المشاريع الناشئة", "مساحات عمل مشتركة", "برامج تدريبية"],
      featured: true,
      active: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.premiumClients.set(client2.id, client2);

    const client3: PremiumClient = {
      id: this.premiumClientIdCounter++,
      name: "شركة التقنية المتقدمة",
      description: "شركة متخصصة في تطوير الحلول التقنية المتقدمة والبنية التحتية السحابية",
      logo: "https://placehold.co/400x200/7c3aed/ffffff?text=التقنية",
      category: "تكنولوجيا المعلومات",
      website: null,
      benefits: ["خدمات الحوسبة السحابية", "إدارة البنية التحتية", "حلول أمنية"],
      featured: false,
      active: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.premiumClients.set(client3.id, client3);
    
    // إضافة مستخدم مسؤول (admin)
    const adminUser: User = {
      id: this.userIdCounter++,
      username: "admin",
      password: "admin123",
      email: "admin@linktech.app",
      role: "admin",
      name: "مسؤول النظام",
      avatar: "https://randomuser.me/api/portraits/men/33.jpg",
      createdAt: new Date()
    };
    this.users.set(adminUser.id, adminUser);
    
    // Create some sample users
    const user1: User = {
      id: this.userIdCounter++,
      username: "ahmed_entrepreneur",
      password: "password123",
      email: "ahmed@example.com",
      role: "entrepreneur",
      name: "أحمد السيد",
      avatar: "https://randomuser.me/api/portraits/men/1.jpg",
      createdAt: new Date()
    };
    this.users.set(user1.id, user1);
    
    const user2: User = {
      id: this.userIdCounter++,
      username: "tech_solutions",
      password: "password123",
      email: "tech@example.com",
      role: "company",
      name: "تك سوليوشنز",
      avatar: "https://randomuser.me/api/portraits/men/2.jpg",
      createdAt: new Date()
    };
    this.users.set(user2.id, user2);
    
    const user3: User = {
      id: this.userIdCounter++,
      username: "digital_hub",
      password: "password123",
      email: "digital@example.com",
      role: "company",
      name: "ديجيتال هب",
      avatar: "https://randomuser.me/api/portraits/women/3.jpg",
      createdAt: new Date()
    };
    this.users.set(user3.id, user3);
    
    const user4: User = {
      id: this.userIdCounter++,
      username: "smart_code",
      password: "password123",
      email: "smart@example.com",
      role: "company",
      name: "سمارت كود",
      avatar: "https://randomuser.me/api/portraits/men/4.jpg",
      createdAt: new Date()
    };
    this.users.set(user4.id, user4);
    
    const user5: User = {
      id: this.userIdCounter++,
      username: "sara_entrepreneur",
      password: "password123",
      email: "sara@example.com",
      role: "entrepreneur",
      name: "سارة العمري",
      avatar: "https://randomuser.me/api/portraits/women/5.jpg",
      createdAt: new Date()
    };
    this.users.set(user5.id, user5);
    
    // Create company profiles
    const company1: CompanyProfile = {
      id: this.companyProfileIdCounter++,
      userId: user2.id,
      description: "متخصصون في تطوير تطبيقات الجوال والويب للشركات والمؤسسات، مع خبرة تزيد عن 8 سنوات في مجال البرمجة.",
      logo: "https://randomuser.me/api/portraits/men/2.jpg",
      coverPhoto: "https://images.unsplash.com/photo-1560179707-f14e90ef3623",
      website: "https://techsolutions.example.com",
      location: "الرياض، المملكة العربية السعودية",
      skills: ["تطبيقات الويب", "تطبيقات الجوال", "الذكاء الاصطناعي"],
      rating: 4.7,
      reviewCount: 48
    };
    this.companyProfiles.set(company1.id, company1);
    
    const company2: CompanyProfile = {
      id: this.companyProfileIdCounter++,
      userId: user3.id,
      description: "شركة رائدة في مجال التحول الرقمي وتطوير الحلول المتكاملة للشركات الناشئة والمؤسسات الكبيرة.",
      logo: "https://randomuser.me/api/portraits/women/3.jpg",
      coverPhoto: "https://images.unsplash.com/photo-1522071820081-009f0129c71c",
      website: "https://digitalhub.example.com",
      location: "جدة، المملكة العربية السعودية",
      skills: ["التحول الرقمي", "تجارة إلكترونية", "برمجة خلفية"],
      rating: 4.9,
      reviewCount: 62
    };
    this.companyProfiles.set(company2.id, company2);
    
    const company3: CompanyProfile = {
      id: this.companyProfileIdCounter++,
      userId: user4.id,
      description: "متخصصون في تطوير واجهات المستخدم وتجربة المستخدم، مع تركيز على تصميم تطبيقات سهلة الاستخدام.",
      logo: "https://randomuser.me/api/portraits/men/4.jpg",
      coverPhoto: "https://images.unsplash.com/photo-1556761175-4b46a572b786",
      website: "https://smartcode.example.com",
      location: "الدمام، المملكة العربية السعودية",
      skills: ["تصميم UI/UX", "تطوير واجهات", "مواقع تفاعلية"],
      rating: 4.1,
      reviewCount: 27
    };
    this.companyProfiles.set(company3.id, company3);
    
    // Create projects
    const project1: Project = {
      id: this.projectIdCounter++,
      title: "تطبيق توصيل طلبات للمطاعم",
      description: "نبحث عن شركة برمجة متخصصة لتطوير تطبيق جوّال لتوصيل الطعام من المطاعم المحلية، مع لوحة تحكم للمطاعم ونظام تتبع للسائقين.",
      budget: "50,000 - 80,000 ريال",
      duration: "3-6 أشهر",
      skills: ["تطبيق جوال", "iOS", "Android", "لوحة تحكم"],
      userId: user1.id,
      status: "open",
      highlightStatus: "عالي الطلب",
      createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000) // 5 days ago
    };
    this.projects.set(project1.id, project1);
    
    const project2: Project = {
      id: this.projectIdCounter++,
      title: "منصة تعليمية تفاعلية",
      description: "تطوير منصة تعليمية على الويب تدعم الدورات التفاعلية، والاختبارات، ومنتدى للطلاب. يجب أن تكون متوافقة مع الأجهزة المختلفة.",
      budget: "70,000 - 120,000 ريال",
      duration: "4-8 أشهر",
      skills: ["تطوير ويب", "تصميم UI/UX", "React", "Node.js"],
      userId: user5.id,
      status: "open",
      highlightStatus: "جديد",
      createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) // 2 days ago
    };
    this.projects.set(project2.id, project2);
    
    const project3: Project = {
      id: this.projectIdCounter++,
      title: "نظام إدارة عقارات",
      description: "نظام متكامل لإدارة العقارات يشمل إدارة الممتلكات، والإيجارات، والصيانة، والفواتير، مع تطبيق جوال للمستأجرين والملاك.",
      budget: "100,000 - 150,000 ريال",
      duration: "6-10 أشهر",
      skills: ["نظام إدارة", "تطبيق ويب", "تطبيق جوال", "API"],
      userId: user1.id,
      status: "open",
      highlightStatus: undefined,
      createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000) // 10 days ago
    };
    this.projects.set(project3.id, project3);
    
    // Create testimonials
    const testimonial1: Testimonial = {
      id: this.testimonialIdCounter++,
      userId: user1.id,
      content: "وجدت الشريك المثالي لتنفيذ مشروعي من خلال المنصة. تواصلت مع عدة شركات مميزة واخترت الأنسب. التطبيق الآن يعمل بكفاءة عالية ولدينا أكثر من 10,000 مستخدم نشط.",
      role: "entrepreneur",
      companyName: undefined,
      userTitle: "مؤسس تطبيق \"طلباتي\"",
      rating: 5,
      avatar: "https://randomuser.me/api/portraits/men/1.jpg",
      createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // 30 days ago
    };
    this.testimonials.set(testimonial1.id, testimonial1);
    
    const testimonial2: Testimonial = {
      id: this.testimonialIdCounter++,
      userId: user5.id,
      content: "المنصة ساعدتنا في الوصول لعملاء جدد وتنفيذ مشاريع متنوعة. نظام التواصل سهل وفعال، والدعم الفني ممتاز. حققنا نمواً بنسبة 40% في عدد المشاريع منذ انضمامنا للمنصة.",
      role: "company",
      companyName: "شركة ديجيتال هب",
      userTitle: "مديرة تطوير الأعمال",
      rating: 4.5,
      avatar: "https://randomuser.me/api/portraits/women/5.jpg",
      createdAt: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000) // 45 days ago
    };
    this.testimonials.set(testimonial2.id, testimonial2);
  }
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: number): Promise<User | undefined> {
    const users = await db.query.users.findMany({
      where: eq(schema.users.id, id),
      limit: 1
    });
    return users.length > 0 ? users[0] : undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const users = await db.query.users.findMany({
      where: eq(schema.users.username, username),
      limit: 1
    });
    return users.length > 0 ? users[0] : undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const users = await db.query.users.findMany({
      where: eq(schema.users.email, email),
      limit: 1
    });
    return users.length > 0 ? users[0] : undefined;
  }

  async createUser(user: InsertUser): Promise<User> {
    const [insertedUser] = await db.insert(schema.users)
      .values(user)
      .returning();
    return insertedUser;
  }

  async getUsers(): Promise<User[]> {
    return await db.query.users.findMany();
  }
  
  async getUsersByRole(role: string): Promise<User[]> {
    return await db.query.users.findMany({
      where: eq(schema.users.role, role)
    });
  }

  async updateUser(id: number, updates: Partial<User>): Promise<User | undefined> {
    const [updatedUser] = await db.update(schema.users)
      .set(updates)
      .where(eq(schema.users.id, id))
      .returning();
    return updatedUser;
  }
  
  async updateUserPassword(id: number, hashedPassword: string): Promise<User | undefined> {
    const [updatedUser] = await db.update(schema.users)
      .set({ password: hashedPassword })
      .where(eq(schema.users.id, id))
      .returning();
    return updatedUser;
  }

  // Password reset operations
  async createPasswordResetToken(email: string, token: string, expiresAt: Date): Promise<boolean> {
    try {
      const user = await this.getUserByEmail(email);
      if (!user) {
        return false;
      }
      
      // First, delete any existing tokens for this user
      await db.delete(passwordResetTokens)
        .where(eq(passwordResetTokens.userId, user.id));
      
      // Then create the new token
      await db.insert(passwordResetTokens).values({
        userId: user.id,
        email,
        token,
        expiresAt
      });
      
      return true;
    } catch (error) {
      console.error('Error creating password reset token:', error);
      return false;
    }
  }
  
  async getPasswordResetToken(token: string): Promise<{ userId: number, email: string, expiresAt: Date } | undefined> {
    try {
      const tokens = await db.select()
        .from(passwordResetTokens)
        .where(eq(passwordResetTokens.token, token));
      
      if (!tokens.length) {
        return undefined;
      }
      
      const tokenData = tokens[0];
      
      // Check if token has expired
      if (tokenData.expiresAt < new Date()) {
        // Token expired, delete it
        await this.deletePasswordResetToken(token);
        return undefined;
      }
      
      return {
        userId: tokenData.userId,
        email: tokenData.email,
        expiresAt: tokenData.expiresAt
      };
    } catch (error) {
      console.error('Error getting password reset token:', error);
      return undefined;
    }
  }
  
  async deletePasswordResetToken(token: string): Promise<boolean> {
    try {
      await db.delete(passwordResetTokens)
        .where(eq(passwordResetTokens.token, token));
      
      return true;
    } catch (error) {
      console.error('Error deleting password reset token:', error);
      return false;
    }
  }

  // Company profile operations
  async getCompanyProfile(id: number): Promise<CompanyProfile | undefined> {
    const profiles = await db.query.companyProfiles.findMany({
      where: eq(schema.companyProfiles.id, id),
      limit: 1
    });
    return profiles.length > 0 ? profiles[0] : undefined;
  }

  async getCompanyProfileByUserId(userId: number): Promise<CompanyProfile | undefined> {
    const profiles = await db.query.companyProfiles.findMany({
      where: eq(schema.companyProfiles.userId, userId),
      limit: 1
    });
    return profiles.length > 0 ? profiles[0] : undefined;
  }

  async createCompanyProfile(profile: InsertCompanyProfile): Promise<CompanyProfile> {
    const [insertedProfile] = await db.insert(schema.companyProfiles)
      .values({
        ...profile,
        rating: 0,
        reviewCount: 0
      })
      .returning();
    return insertedProfile;
  }

  async updateCompanyProfile(id: number, updates: Partial<CompanyProfile>): Promise<CompanyProfile | undefined> {
    try {
      console.log(`تحديث ملف الشركة في قاعدة البيانات - الهوية: ${id}`);
      console.log('البيانات المراد تحديثها:', JSON.stringify(updates));
      
      // تحقق من وجود الملف قبل التحديث
      const existingProfile = await this.getCompanyProfile(id);
      if (!existingProfile) {
        console.log(`خطأ: لم يتم العثور على ملف الشركة برقم ${id} في قاعدة البيانات`);
        return undefined;
      }
      
      console.log('بيانات الملف الحالي قبل التحديث:', JSON.stringify(existingProfile));
      
      // تنفيذ التحديث
      const [updatedProfile] = await db.update(schema.companyProfiles)
        .set(updates)
        .where(eq(schema.companyProfiles.id, id))
        .returning();
      
      if (!updatedProfile) {
        console.log(`تحذير: لم يتم العثور على نتائج بعد تحديث الملف برقم ${id}`);
        return undefined;
      }
      
      console.log('نجاح تحديث ملف الشركة. البيانات المحدثة:', JSON.stringify(updatedProfile));
      return updatedProfile;
    } catch (error) {
      console.error('خطأ في تحديث ملف الشركة في قاعدة البيانات:', error);
      throw error;
    }
  }

  async getCompanyProfiles(): Promise<CompanyProfile[]> {
    return await db.query.companyProfiles.findMany();
  }
  
  async getVerifiedCompanies(): Promise<CompanyProfile[]> {
    return await db.query.companyProfiles.findMany({
      where: eq(schema.companyProfiles.verified, true)
    });
  }

  async verifyCompany(
    id: number, 
    verified: boolean, 
    verificationData: {
      verifiedBy?: number;
      verificationNotes?: string;
      verificationDocuments?: any;
    } = {}
  ): Promise<CompanyProfile | undefined> {
    const updateData: any = { verified };
    
    if (verified) {
      updateData.verificationDate = new Date();
      if (verificationData.verifiedBy) updateData.verifiedBy = verificationData.verifiedBy;
      if (verificationData.verificationNotes) updateData.verificationNotes = verificationData.verificationNotes;
      if (verificationData.verificationDocuments) updateData.verificationDocuments = verificationData.verificationDocuments;
    } else {
      // إذا كان إلغاء التوثيق، نحتفظ بالمستندات ولكن نمسح البيانات الأخرى
      updateData.verificationDate = null;
      updateData.verifiedBy = null;
      updateData.verificationNotes = null;
    }
    
    const [updatedProfile] = await db.update(schema.companyProfiles)
      .set(updateData)
      .where(eq(schema.companyProfiles.id, id))
      .returning();
    return updatedProfile;
  }

  // Personal information operations
  async getPersonalInformationByUserId(userId: number): Promise<PersonalInformation | undefined> {
    const personalInfos = await db.query.personalInformation.findMany({
      where: eq(personalInformation.userId, userId),
      limit: 1
    });
    return personalInfos.length > 0 ? personalInfos[0] : undefined;
  }

  async createPersonalInformation(info: InsertPersonalInformation): Promise<PersonalInformation> {
    const [insertedInfo] = await db.insert(personalInformation)
      .values(info)
      .returning();
    return insertedInfo;
  }

  async updatePersonalInformation(userId: number, info: Partial<PersonalInformation>): Promise<PersonalInformation | undefined> {
    const [updatedInfo] = await db.update(personalInformation)
      .set(info)
      .where(eq(personalInformation.userId, userId))
      .returning();
    return updatedInfo;
  }

  // Project operations
  async getProject(id: number): Promise<Project | undefined> {
    const projects = await db.query.projects.findMany({
      where: eq(schema.projects.id, id),
      limit: 1
    });
    return projects.length > 0 ? projects[0] : undefined;
  }

  async getProjects(): Promise<Project[]> {
    return await db.query.projects.findMany({
      orderBy: [desc(schema.projects.createdAt)] // Newest projects first
    });
  }

  async getProjectsWithUserData(): Promise<(Project & { username?: string; name?: string })[]> {
    const projects = await db.query.projects.findMany({
      orderBy: [desc(schema.projects.createdAt)],
      with: {
        user: {
          columns: {
            username: true,
            name: true
          }
        }
      }
    });
    
    return projects.map(project => ({
      ...project,
      username: project.user?.username,
      name: project.user?.name,
      user: undefined // Remove nested user object
    }));
  }

  async getProjectsByUserId(userId: number): Promise<Project[]> {
    return await db.query.projects.findMany({
      where: eq(schema.projects.userId, userId),
      orderBy: [desc(schema.projects.createdAt)] // Newest projects first
    });
  }

  async createProject(project: InsertProject): Promise<Project> {
    const [insertedProject] = await db.insert(schema.projects)
      .values({
        ...project,
        status: "open",
      })
      .returning();
    return insertedProject;
  }

  async updateProject(id: number, updates: Partial<Project>): Promise<Project | undefined> {
    const [updatedProject] = await db.update(schema.projects)
      .set(updates)
      .where(eq(schema.projects.id, id))
      .returning();
    return updatedProject;
  }

  async deleteProject(id: number): Promise<boolean> {
    try {
      // Check if project has any accepted or completed offers
      const projectOffers = await db.query.projectOffers.findMany({
        where: eq(schema.projectOffers.projectId, id)
      });
      
      const hasActiveOffers = projectOffers.some(offer => 
        offer.status === 'accepted' || offer.status === 'completed'
      );
      
      if (hasActiveOffers) {
        return false; // Cannot delete project with active offers
      }
      
      // Delete all pending offers first  
      await db.delete(schema.projectOffers)
        .where(and(
          eq(schema.projectOffers.projectId, id),
          eq(schema.projectOffers.status, 'pending')
        ));
      
      // Delete the project
      await db.delete(schema.projects)
        .where(eq(schema.projects.id, id));
      
      return true;
    } catch (error) {
      console.error('Error deleting project:', error);
      return false;
    }
  }

  // Message operations
  async getMessage(id: number): Promise<Message | undefined> {
    const messages = await db.query.messages.findMany({
      where: eq(schema.messages.id, id),
      limit: 1
    });
    return messages.length > 0 ? messages[0] : undefined;
  }

  async getMessages(userId: number): Promise<Message[]> {
    const messages = await db.query.messages.findMany({
      where: or(
        eq(schema.messages.fromUserId, userId),
        eq(schema.messages.toUserId, userId)
      ),
      with: {
        fromUser: true,
        toUser: true,
        project: true
      },
      orderBy: [desc(schema.messages.createdAt)]
    });
    
    console.log(`استرجاع ${messages.length} رسالة للمستخدم ${userId}`);
    return messages;
  }

  async getConversation(user1Id: number, user2Id: number, projectId?: number): Promise<Message[]> {
    let whereClause;
    if (projectId) {
      whereClause = and(
        or(
          and(
            eq(schema.messages.fromUserId, user1Id),
            eq(schema.messages.toUserId, user2Id)
          ),
          and(
            eq(schema.messages.fromUserId, user2Id),
            eq(schema.messages.toUserId, user1Id)
          )
        ),
        eq(schema.messages.projectId, projectId)
      );
    } else {
      whereClause = or(
        and(
          eq(schema.messages.fromUserId, user1Id),
          eq(schema.messages.toUserId, user2Id)
        ),
        and(
          eq(schema.messages.fromUserId, user2Id),
          eq(schema.messages.toUserId, user1Id)
        )
      );
    }

    const messages = await db.query.messages.findMany({
      where: whereClause,
      with: {
        fromUser: true,
        toUser: true,
        project: true
      },
      orderBy: asc(schema.messages.createdAt)
    });
    
    console.log(`استرجاع ${messages.length} رسالة في المحادثة بين ${user1Id} و ${user2Id}${projectId ? ` للمشروع ${projectId}` : ''}`);
    return messages;
  }

  async createMessage(message: InsertMessage): Promise<Message> {
    const [insertedMessage] = await db.insert(schema.messages)
      .values({
        ...message,
        read: false
      })
      .returning();
    
    // إضافة معلومات المرسل والمستقبل
    const messageWithDetails = await db.query.messages.findFirst({
      where: eq(schema.messages.id, insertedMessage.id),
      with: {
        fromUser: true,
        toUser: true,
        project: true
      }
    });
    
    console.log(`تم إنشاء رسالة جديدة: ${insertedMessage.id}`);
    return messageWithDetails || insertedMessage;
  }

  async markMessageAsRead(id: number): Promise<Message | undefined> {
    const [updatedMessage] = await db.update(schema.messages)
      .set({ read: true })
      .where(eq(schema.messages.id, id))
      .returning();
    
    if (updatedMessage) {
      // إضافة معلومات المرسل والمستقبل
      const messageWithDetails = await db.query.messages.findFirst({
        where: eq(schema.messages.id, updatedMessage.id),
        with: {
          fromUser: true,
          toUser: true,
          project: true
        }
      });
      
      console.log(`تم تحديد الرسالة ${id} كمقروءة`);
      return messageWithDetails || updatedMessage;
    }
    
    return undefined;
  }

  // Testimonial operations
  async getTestimonial(id: number): Promise<Testimonial | undefined> {
    const testimonials = await db.query.testimonials.findMany({
      where: eq(schema.testimonials.id, id),
      limit: 1
    });
    return testimonials.length > 0 ? testimonials[0] : undefined;
  }

  async getTestimonials(): Promise<Testimonial[]> {
    return await db.query.testimonials.findMany();
  }

  async createTestimonial(testimonial: InsertTestimonial): Promise<Testimonial> {
    const [insertedTestimonial] = await db.insert(schema.testimonials)
      .values(testimonial)
      .returning();
    return insertedTestimonial;
  }
  
  // Project Offer operations
  async getProjectOffer(id: number): Promise<ProjectOffer | undefined> {
    const offers = await db.query.projectOffers.findMany({
      where: eq(schema.projectOffers.id, id),
      limit: 1
    });
    return offers.length > 0 ? offers[0] : undefined;
  }
  
  async getProjectOffersByProjectId(projectId: number): Promise<ProjectOffer[]> {
    return await db.query.projectOffers.findMany({
      where: eq(schema.projectOffers.projectId, projectId)
    });
  }
  
  async getProjectOffersByCompanyId(companyId: number): Promise<ProjectOffer[]> {
    return await db.query.projectOffers.findMany({
      where: eq(schema.projectOffers.companyId, companyId)
    });
  }
  
  async getAllProjectOffers(): Promise<ProjectOffer[]> {
    return await db.query.projectOffers.findMany();
  }
  
  async createProjectOffer(offer: InsertProjectOffer): Promise<ProjectOffer> {
    const [insertedOffer] = await db.insert(schema.projectOffers)
      .values({
        ...offer,
        status: 'pending',
        depositPaid: false,
        contactRevealed: false
      })
      .returning();
    return insertedOffer;
  }
  
  async updateProjectOfferStatus(id: number, status: string): Promise<ProjectOffer | undefined> {
    const [updatedOffer] = await db.update(schema.projectOffers)
      .set({ status })
      .where(eq(schema.projectOffers.id, id))
      .returning();
    return updatedOffer;
  }
  
  async setProjectOfferDepositPaid(id: number, depositAmount: string): Promise<ProjectOffer | undefined> {
    const now = new Date();
    const [updatedOffer] = await db.update(schema.projectOffers)
      .set({ 
        depositPaid: true, 
        depositAmount,
        depositDate: now
      })
      .where(eq(schema.projectOffers.id, id))
      .returning();
    return updatedOffer;
  }
  
  async setProjectOfferContactRevealed(id: number): Promise<ProjectOffer | undefined> {
    const [updatedOffer] = await db.update(schema.projectOffers)
      .set({ contactRevealed: true })
      .where(eq(schema.projectOffers.id, id))
      .returning();
    return updatedOffer;
  }
  
  // Site Settings operations
  async getSiteSetting(key: string): Promise<SiteSetting | undefined> {
    const settings = await db.query.siteSettings.findMany({
      where: eq(schema.siteSettings.key, key),
      limit: 1
    });
    return settings.length > 0 ? settings[0] : undefined;
  }

  async setSiteSetting(key: string, value: string, category?: string, description?: string, updatedBy?: number): Promise<SiteSetting> {
    const existingSetting = await this.getSiteSetting(key);

    if (existingSetting) {
      const [updatedSetting] = await db.update(schema.siteSettings)
        .set({ 
          value, 
          updatedAt: new Date(),
          ...(category && { category }),
          ...(description && { description }),
          ...(updatedBy && { updatedBy })
        })
        .where(eq(schema.siteSettings.key, key))
        .returning();
      return updatedSetting;
    } else {
      const [newSetting] = await db.insert(schema.siteSettings)
        .values({ 
          key, 
          value,
          category: category || 'general',
          description: description || '',
          updatedBy: updatedBy || 1
        })
        .returning();
      return newSetting;
    }
  }

  async getAllSiteSettings(): Promise<SiteSetting[]> {
    return await db.query.siteSettings.findMany();
  }
  
  // Newsletter Subscriber operations
  async getNewsletterSubscriberByEmail(email: string): Promise<NewsletterSubscriber | undefined> {
    const subscribers = await db.query.newsletterSubscribers.findMany({
      where: eq(schema.newsletterSubscribers.email, email),
      limit: 1
    });
    return subscribers.length > 0 ? subscribers[0] : undefined;
  }
  
  async createNewsletterSubscriber(subscriber: InsertNewsletterSubscriber): Promise<NewsletterSubscriber> {
    const [insertedSubscriber] = await db.insert(schema.newsletterSubscribers)
      .values(subscriber)
      .returning();
    return insertedSubscriber;
  }
  
  async getNewsletterSubscribers(): Promise<NewsletterSubscriber[]> {
    return await db.query.newsletterSubscribers.findMany();
  }
  
  async updateNewsletterSubscriber(id: number, updates: Partial<NewsletterSubscriber>): Promise<NewsletterSubscriber | undefined> {
    const [updatedSubscriber] = await db.update(schema.newsletterSubscribers)
      .set(updates)
      .where(eq(schema.newsletterSubscribers.id, id))
      .returning();
    return updatedSubscriber;
  }
  
  // NDA Agreement operations
  async getNdaAgreement(id: number): Promise<NdaAgreement | undefined> {
    const agreements = await db.query.ndaAgreements.findMany({
      where: eq(schema.ndaAgreements.id, id),
      limit: 1
    });
    return agreements.length > 0 ? agreements[0] : undefined;
  }
  
  async getNdaAgreementByProjectId(projectId: number): Promise<NdaAgreement | undefined> {
    const agreements = await db.query.ndaAgreements.findMany({
      where: eq(schema.ndaAgreements.projectId, projectId),
      limit: 1
    });
    return agreements.length > 0 ? agreements[0] : undefined;
  }
  
  async createNdaAgreement(agreement: InsertNdaAgreement): Promise<NdaAgreement> {
    // 1. Create the NDA record
    const [newAgreement] = await db.insert(schema.ndaAgreements)
      .values({
        ...agreement,
        status: 'pending',
        signedAt: null,
        pdfUrl: null
      })
      .returning();
    
    // 2. Update the project if needed to set ndaId and requiresNda
    if (agreement.projectId) {
      await db.update(schema.projects)
        .set({
          ndaId: newAgreement.id,
          requiresNda: true
        })
        .where(eq(schema.projects.id, agreement.projectId));
    }
    
    return newAgreement;
  }

  async updateNdaAgreement(id: number, updates: Partial<NdaAgreement>): Promise<NdaAgreement | undefined> {
    const [updatedAgreement] = await db.update(schema.ndaAgreements)
      .set(updates)
      .where(eq(schema.ndaAgreements.id, id))
      .returning();
    return updatedAgreement;
  }
  
  async updateNdaAgreementStatus(id: number, status: string): Promise<NdaAgreement | undefined> {
    const [updatedAgreement] = await db.update(schema.ndaAgreements)
      .set({ status })
      .where(eq(schema.ndaAgreements.id, id))
      .returning();
    return updatedAgreement;
  }
  
  async signNdaAgreement(id: number, signatureInfo: any): Promise<NdaAgreement | undefined> {
    const now = new Date();
    const [updatedAgreement] = await db.update(schema.ndaAgreements)
      .set({
        status: 'signed',
        signedAt: now,
        companySignatureInfo: signatureInfo
      })
      .where(eq(schema.ndaAgreements.id, id))
      .returning();
    return updatedAgreement;
  }
  
  async getNdaAgreements(): Promise<NdaAgreement[]> {
    return await db.query.ndaAgreements.findMany();
  }
  
  async setNdaPdfUrl(id: number, pdfUrl: string): Promise<NdaAgreement | undefined> {
    const [updatedAgreement] = await db.update(schema.ndaAgreements)
      .set({ pdfUrl })
      .where(eq(schema.ndaAgreements.id, id))
      .returning();
    return updatedAgreement;
  }

  // عمليات عملاء التميز
  async getPremiumClients(): Promise<PremiumClient[]> {
    return await db.query.premiumClients.findMany();
  }
  
  async getPremiumClientById(id: number): Promise<PremiumClient | undefined> {
    return await db.query.premiumClients.findFirst({
      where: eq(schema.premiumClients.id, id)
    });
  }
  
  async getPremiumClientsByCategory(category: string): Promise<PremiumClient[]> {
    return await db.query.premiumClients.findMany({
      where: eq(schema.premiumClients.category, category)
    });
  }
  
  async getActivePremiumClients(): Promise<PremiumClient[]> {
    return await db.query.premiumClients.findMany({
      where: eq(schema.premiumClients.active, true)
    });
  }
  
  async getFeaturedPremiumClients(): Promise<PremiumClient[]> {
    return await db.query.premiumClients.findMany({
      where: and(
        eq(schema.premiumClients.featured, true),
        eq(schema.premiumClients.active, true)
      )
    });
  }
  
  async createPremiumClient(client: InsertPremiumClient): Promise<PremiumClient> {
    const [newClient] = await db.insert(schema.premiumClients)
      .values(client)
      .returning();
    return newClient;
  }
  
  async updatePremiumClient(id: number, updates: Partial<InsertPremiumClient>): Promise<PremiumClient | undefined> {
    const [updatedClient] = await db.update(schema.premiumClients)
      .set(updates)
      .where(eq(schema.premiumClients.id, id))
      .returning();
    return updatedClient;
  }
  
  async deletePremiumClient(id: number): Promise<boolean> {
    const result = await db.delete(schema.premiumClients)
      .where(eq(schema.premiumClients.id, id));
    return result.rowCount > 0;
  }

  // عمليات رسائل الاتصال
  async getContactMessages(): Promise<ContactMessage[]> {
    return await db.select().from(schema.contactMessages).orderBy(desc(schema.contactMessages.createdAt));
  }

  async getContactMessageById(id: number): Promise<ContactMessage | undefined> {
    const [message] = await db.select().from(schema.contactMessages).where(eq(schema.contactMessages.id, id));
    return message || undefined;
  }

  async createContactMessage(message: InsertContactMessage): Promise<ContactMessage> {
    const [result] = await db.insert(schema.contactMessages).values(message).returning();
    return result;
  }

  async updateContactMessageStatus(id: number, status: string): Promise<ContactMessage | undefined> {
    const [result] = await db.update(schema.contactMessages)
      .set({ status, updatedAt: new Date() })
      .where(eq(schema.contactMessages.id, id))
      .returning();
    return result || undefined;
  }

  async addNoteToContactMessage(id: number, note: string): Promise<ContactMessage | undefined> {
    const [result] = await db.update(schema.contactMessages)
      .set({ notes: note, updatedAt: new Date() })
      .where(eq(schema.contactMessages.id, id))
      .returning();
    return result || undefined;
  }

  async replyToContactMessage(id: number, replyMessage: string): Promise<ContactMessage | undefined> {
    const [result] = await db.update(schema.contactMessages)
      .set({ 
        replyMessage: replyMessage, 
        repliedAt: new Date(), 
        status: "replied",
        updatedAt: new Date() 
      })
      .where(eq(schema.contactMessages.id, id))
      .returning();
    return result || undefined;
  }

  async deleteContactMessage(id: number): Promise<boolean> {
    const result = await db.delete(schema.contactMessages).where(eq(schema.contactMessages.id, id));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  // عمليات المدونة
  async getBlogCategories() {
    return await db.query.blogCategories.findMany();
  }
  
  async getBlogCategory(id: number) {
    const categories = await db.query.blogCategories.findMany({
      where: eq(schema.blogCategories.id, id),
      limit: 1
    });
    return categories.length > 0 ? categories[0] : undefined;
  }
  
  async getBlogCategoryBySlug(slug: string) {
    const categories = await db.query.blogCategories.findMany({
      where: eq(schema.blogCategories.slug, slug),
      limit: 1
    });
    return categories.length > 0 ? categories[0] : undefined;
  }
  
  async createBlogCategory(category: any) {
    const [newCategory] = await db.insert(schema.blogCategories)
      .values({
        ...category,
        createdAt: new Date(),
        updatedAt: new Date()
      })
      .returning();
    return newCategory;
  }
  
  async updateBlogCategory(id: number, category: any) {
    const [updatedCategory] = await db.update(schema.blogCategories)
      .set({
        ...category,
        updatedAt: new Date()
      })
      .where(eq(schema.blogCategories.id, id))
      .returning();
    return updatedCategory;
  }
  
  async deleteBlogCategory(id: number): Promise<boolean> {
    try {
      await db.delete(schema.blogCategories)
        .where(eq(schema.blogCategories.id, id));
      return true;
    } catch (error) {
      console.error('Error deleting blog category:', error);
      return false;
    }
  }
  
  async getBlogPosts(options?: { categoryId?: number, limit?: number, offset?: number }) {
    let query = db.select().from(schema.blogPosts);
    
    if (options?.categoryId) {
      query = query.where(eq(schema.blogPosts.categoryId, options.categoryId));
    }
    
    query = query.orderBy(desc(schema.blogPosts.createdAt));
    
    if (options?.limit) {
      query = query.limit(options.limit);
    }
    
    if (options?.offset) {
      query = query.offset(options.offset);
    }
    
    return await query;
  }
  
  async getPublishedBlogPosts() {
    return await db.query.blogPosts.findMany({
      where: and(
        eq(schema.blogPosts.published, true),
        eq(schema.blogPosts.status, "published")
      )
    });
  }
  
  async getBlogPost(id: number) {
    const posts = await db.query.blogPosts.findMany({
      where: eq(schema.blogPosts.id, id),
      limit: 1
    });
    return posts.length > 0 ? posts[0] : undefined;
  }
  
  async getBlogPostBySlug(slug: string) {
    const posts = await db.query.blogPosts.findMany({
      where: eq(schema.blogPosts.slug, slug),
      limit: 1
    });
    return posts.length > 0 ? posts[0] : undefined;
  }
  
  async createBlogPost(post: any) {
    const [newPost] = await db.insert(schema.blogPosts)
      .values({
        ...post,
        publishedAt: post.status === 'published' ? new Date() : null,
        createdAt: new Date(),
        updatedAt: new Date()
      })
      .returning();
    return newPost;
  }
  
  async updateBlogPost(id: number, post: any) {
    // If changing status to published and it wasn't published before, set publishedAt
    let updateData = { ...post, updatedAt: new Date() };
    
    if (post.status === 'published' && post.published) {
      const currentPost = await this.getBlogPost(id);
      if (currentPost && (!currentPost.publishedAt || currentPost.status !== 'published')) {
        updateData.publishedAt = new Date();
      }
    }
    
    const [updatedPost] = await db.update(schema.blogPosts)
      .set(updateData)
      .where(eq(schema.blogPosts.id, id))
      .returning();
    return updatedPost;
  }
  
  async deleteBlogPost(id: number): Promise<boolean> {
    try {
      await db.delete(schema.blogPosts)
        .where(eq(schema.blogPosts.id, id));
      return true;
    } catch (error) {
      console.error('Error deleting blog post:', error);
      return false;
    }
  }
  
  async incrementBlogPostViewCount(id: number): Promise<boolean> {
    try {
      await db.update(schema.blogPosts)
        .set({ 
          views: sql`${schema.blogPosts.views} + 1`,
          updatedAt: new Date()
        })
        .where(eq(schema.blogPosts.id, id));
      return true;
    } catch (error) {
      console.error('Error incrementing blog post view count:', error);
      return false;
    }
  }
  
  async getBlogCommentsByPost(postId: number) {
    return await db.select()
      .from(schema.blogComments)
      .where(eq(schema.blogComments.postId, postId))
      .orderBy(asc(schema.blogComments.createdAt));
  }
  
  async getBlogComment(id: number) {
    const comments = await db.select()
      .from(schema.blogComments)
      .where(eq(schema.blogComments.id, id))
      .limit(1);
    return comments.length > 0 ? comments[0] : undefined;
  }
  
  async createBlogComment(comment: any) {
    const [newComment] = await db.insert(schema.blogComments)
      .values({
        ...comment,
        createdAt: new Date(),
        updatedAt: new Date()
      })
      .returning();
    return newComment;
  }
  
  async updateBlogCommentStatus(id: number, status: string) {
    const [updatedComment] = await db.update(schema.blogComments)
      .set({ status, updatedAt: new Date() })
      .where(eq(schema.blogComments.id, id))
      .returning();
    return updatedComment;
  }


  async getContactStats() {
    try {
      const stats = await db.select({
        totalMessages: sql`COUNT(*)`,
        newMessages: sql`COUNT(CASE WHEN status = 'new' THEN 1 END)`,
        readMessages: sql`COUNT(CASE WHEN status = 'read' THEN 1 END)`, 
        repliedMessages: sql`COUNT(CASE WHEN status = 'replied' THEN 1 END)`,
        thisWeek: sql`COUNT(CASE WHEN created_at >= NOW() - INTERVAL '7 days' THEN 1 END)`,
        thisMonth: sql`COUNT(CASE WHEN created_at >= NOW() - INTERVAL '30 days' THEN 1 END)`
      }).from(schema.contactMessages);

      const result = stats[0];
      
      return {
        totalMessages: Number(result.totalMessages) || 0,
        newMessages: Number(result.newMessages) || 0,
        readMessages: Number(result.readMessages) || 0,
        repliedMessages: Number(result.repliedMessages) || 0,
        thisWeek: Number(result.thisWeek) || 0,
        thisMonth: Number(result.thisMonth) || 0,
        responseRate: Number(result.totalMessages) > 0 
          ? Math.round((Number(result.repliedMessages) / Number(result.totalMessages)) * 100)
          : 0
      };
    } catch (error) {
      console.error('Error getting contact stats:', error);
      return {
        totalMessages: 0,
        newMessages: 0,
        readMessages: 0,
        repliedMessages: 0,
        thisWeek: 0,
        thisMonth: 0,
        responseRate: 0
      };
    }
  }
  
  async deleteBlogComment(id: number): Promise<boolean> {
    try {
      await db.delete(schema.blogComments)
        .where(eq(schema.blogComments.id, id));
      return true;
    } catch (error) {
      console.error('Error deleting blog comment:', error);
      return false;
    }
  }
  
  // أساليب وظيفية مطلوبة
  async markAllMessagesAsRead(fromUserId: number, toUserId: number): Promise<number> {
    const result = await db.update(schema.messages)
      .set({ read: true })
      .where(and(
        eq(schema.messages.fromUserId, fromUserId),
        eq(schema.messages.toUserId, toUserId),
        eq(schema.messages.read, false)
      ));
    return result.rowCount || 0;
  }
  
  async updateMessageDeliveryStatus(id: number, status: 'pending' | 'delivered' | 'failed'): Promise<Message | undefined> {
    // تحديث حالة توصيل الرسالة في قاعدة البيانات
    // هذه دالة وهمية لأن schema.messages لا يحتوي على حقل deliveryStatus
    // في تطبيق حقيقي، سنضيف هذا الحقل إلى نموذج الرسائل
    return await this.getMessage(id);
  }

  // دوال مساعد الذكاء الاصطناعي
  async createAiProjectAnalysis(analysis: schema.InsertAiProjectAnalysis): Promise<schema.AiProjectAnalysis> {
    const [newAnalysis] = await db.insert(schema.aiProjectAnalysis)
      .values(analysis)
      .returning();
    return newAnalysis;
  }

  async getAiProjectAnalysis(id: number): Promise<schema.AiProjectAnalysis | undefined> {
    const analysis = await db.select()
      .from(schema.aiProjectAnalysis)
      .where(eq(schema.aiProjectAnalysis.id, id))
      .limit(1);
    return analysis[0];
  }

  async getUserAiAnalyses(userId: number): Promise<schema.AiProjectAnalysis[]> {
    return await db.select()
      .from(schema.aiProjectAnalysis)
      .where(eq(schema.aiProjectAnalysis.userId, userId))
      .orderBy(desc(schema.aiProjectAnalysis.createdAt));
  }

  async createAnalysisRating(rating: schema.InsertAnalysisRating): Promise<schema.AnalysisRating> {
    const [newRating] = await db.insert(schema.analysisRatings)
      .values(rating)
      .returning();
    return newRating;
  }

  async getAnalysisRatings(analysisId: number): Promise<schema.AnalysisRating[]> {
    return await db.select()
      .from(schema.analysisRatings)
      .where(eq(schema.analysisRatings.analysisId, analysisId))
      .orderBy(desc(schema.analysisRatings.createdAt));
  }

  // Site settings methods
  async getAllSiteSettings(): Promise<SiteSetting[]> {
    return await db.select().from(siteSettings);
  }

  async getSiteSettingsByCategory(category: string): Promise<SiteSetting[]> {
    return await db.select().from(siteSettings).where(eq(siteSettings.category, category));
  }

  // Featured clients operations
  async getFeaturedClients(): Promise<FeaturedClient[]> {
    return await db.select().from(featuredClients).orderBy(asc(featuredClients.order));
  }

  async getActiveFeaturedClients(): Promise<FeaturedClient[]> {
    return await db.select()
      .from(featuredClients)
      .where(eq(featuredClients.active, true))
      .orderBy(asc(featuredClients.order));
  }

  async getFeaturedClient(id: number): Promise<FeaturedClient | undefined> {
    const clients = await db.select()
      .from(featuredClients)
      .where(eq(featuredClients.id, id))
      .limit(1);
    return clients[0];
  }

  async createFeaturedClient(client: InsertFeaturedClient): Promise<FeaturedClient> {
    const [newClient] = await db.insert(featuredClients)
      .values(client)
      .returning();
    return newClient;
  }

  async updateFeaturedClient(id: number, updates: Partial<FeaturedClient>): Promise<FeaturedClient | undefined> {
    const [updatedClient] = await db.update(featuredClients)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(featuredClients.id, id))
      .returning();
    return updatedClient;
  }

  async deleteFeaturedClient(id: number): Promise<boolean> {
    try {
      await db.delete(featuredClients)
        .where(eq(featuredClients.id, id));
      return true;
    } catch (error) {
      console.error('Error deleting featured client:', error);
      return false;
    }
  }

  // NDA Agreement operations for DatabaseStorage
  async getNdaAgreement(id: number): Promise<NdaAgreement | undefined> {
    const ndas = await db.select().from(schema.ndaAgreements)
      .where(eq(schema.ndaAgreements.id, id))
      .limit(1);
    return ndas[0];
  }

  async getNdaAgreementByProjectId(projectId: number): Promise<NdaAgreement | undefined> {
    const ndas = await db.select().from(schema.ndaAgreements)
      .where(eq(schema.ndaAgreements.projectId, projectId))
      .limit(1);
    return ndas[0];
  }

  async getNdaByProjectAndCompany(projectId: number, companyUserId: number): Promise<NdaAgreement | undefined> {
    const ndas = await db.select().from(schema.ndaAgreements)
      .where(eq(schema.ndaAgreements.projectId, projectId));
    
    // Since companySignatureInfo is JSON, we need to filter in application layer
    return ndas.find(nda => {
      const companyInfo = nda.companySignatureInfo as any;
      return companyInfo?.companyUserId === companyUserId;
    });
  }

  async createNdaAgreement(agreement: InsertNdaAgreement): Promise<NdaAgreement> {
    const [newNda] = await db.insert(schema.ndaAgreements)
      .values(agreement)
      .returning();
    return newNda;
  }

  async updateNdaAgreement(id: number, updates: Partial<NdaAgreement>): Promise<NdaAgreement | undefined> {
    const [updatedNda] = await db.update(schema.ndaAgreements)
      .set(updates)
      .where(eq(schema.ndaAgreements.id, id))
      .returning();
    return updatedNda;
  }

  async updateNdaAgreementStatus(id: number, status: string): Promise<NdaAgreement | undefined> {
    const [updatedNda] = await db.update(schema.ndaAgreements)
      .set({ status })
      .where(eq(schema.ndaAgreements.id, id))
      .returning();
    return updatedNda;
  }

  async signNdaAgreement(id: number, signatureInfo: any): Promise<NdaAgreement | undefined> {
    const [updatedNda] = await db.update(schema.ndaAgreements)
      .set({ 
        status: 'signed',
        signedAt: new Date(),
        companySignatureInfo: signatureInfo
      })
      .where(eq(schema.ndaAgreements.id, id))
      .returning();
    return updatedNda;
  }

  async getNdaAgreements(): Promise<NdaAgreement[]> {
    return await db.select().from(schema.ndaAgreements);
  }

  async setNdaPdfUrl(id: number, pdfUrl: string): Promise<NdaAgreement | undefined> {
    const [updatedNda] = await db.update(schema.ndaAgreements)
      .set({ pdfUrl })
      .where(eq(schema.ndaAgreements.id, id))
      .returning();
    return updatedNda;
  }

  // For compatibility with two-stage workflow
  async createNda(ndaData: Partial<NdaAgreement>): Promise<NdaAgreement> {
    const [newNda] = await db.insert(schema.ndaAgreements)
      .values({
        projectId: ndaData.projectId!,
        status: ndaData.status || 'awaiting_entrepreneur',
        companySignatureInfo: ndaData.companySignatureInfo || null,
        entrepreneurInfo: ndaData.entrepreneurInfo || null,
        pdfUrl: null,
        sadiqEnvelopeId: null,
        sadiqReferenceNumber: null,
        sadiqDocumentId: null,
        envelopeStatus: null,
        signedAt: null,
        expiresAt: null,
        ...ndaData
      })
      .returning();
    return newNda;
  }

  async getNda(id: number): Promise<NdaAgreement | undefined> {
    return await this.getNdaAgreement(id);
  }

  async updateNda(id: number, updates: Partial<NdaAgreement>): Promise<NdaAgreement | undefined> {
    return await this.updateNdaAgreement(id, updates);
  }

  // Notification operations for DatabaseStorage
  async createNotification(notification: InsertNotification): Promise<Notification> {
    const [newNotification] = await db.insert(schema.notifications)
      .values(notification)
      .returning();
    return newNotification;
  }

  async getNotificationsByUserId(userId: number): Promise<Notification[]> {
    return await db.select().from(schema.notifications)
      .where(eq(schema.notifications.userId, userId))
      .orderBy(desc(schema.notifications.createdAt));
  }

  async markNotificationAsRead(id: number): Promise<Notification | undefined> {
    const [updatedNotification] = await db.update(schema.notifications)
      .set({ isRead: true })
      .where(eq(schema.notifications.id, id))
      .returning();
    return updatedNotification;
  }

  async markAllNotificationsAsRead(userId: number): Promise<void> {
    await db.update(schema.notifications)
      .set({ isRead: true })
      .where(and(
        eq(schema.notifications.userId, userId),
        eq(schema.notifications.isRead, false)
      ));
  }

}

// Change from MemStorage to DatabaseStorage
export const storage = new DatabaseStorage();
