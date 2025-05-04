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
  ndaAgreements
} from "@shared/schema";
import { db } from "./db";
import { eq, and, or, desc, asc } from "drizzle-orm";

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getUsers(): Promise<User[]>;
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
  
  // Project operations
  getProject(id: number): Promise<Project | undefined>;
  getProjects(): Promise<Project[]>;
  getProjectsByUserId(userId: number): Promise<Project[]>;
  createProject(project: InsertProject): Promise<Project>;
  updateProject(id: number, project: Partial<Project>): Promise<Project | undefined>;
  
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
  createNdaAgreement(agreement: InsertNdaAgreement): Promise<NdaAgreement>;
  updateNdaAgreementStatus(id: number, status: string): Promise<NdaAgreement | undefined>;
  signNdaAgreement(id: number, signatureInfo: any): Promise<NdaAgreement | undefined>;
  getNdaAgreements(): Promise<NdaAgreement[]>;
  setNdaPdfUrl(id: number, pdfUrl: string): Promise<NdaAgreement | undefined>;
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
  
  private userIdCounter: number = 1;
  private companyProfileIdCounter: number = 1;
  private projectIdCounter: number = 1;
  private messageIdCounter: number = 1;
  private testimonialIdCounter: number = 1;
  private projectOfferIdCounter: number = 1;
  private siteSettingsIdCounter: number = 1;
  private newsletterSubscriberIdCounter: number = 1;
  private ndaAgreementIdCounter: number = 1;
  
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
    
    this.seedData();
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
    
    const updatedOffer = { 
      ...offer, 
      depositPaid: true,
      depositAmount,
      depositDate: new Date()
    };
    this.projectOffers.set(id, updatedOffer);
    return updatedOffer;
  }
  
  async setProjectOfferContactRevealed(id: number): Promise<ProjectOffer | undefined> {
    const offer = this.projectOffers.get(id);
    if (!offer) return undefined;
    
    const updatedOffer = { ...offer, contactRevealed: true };
    this.projectOffers.set(id, updatedOffer);
    return updatedOffer;
  }
  
  // Site Settings operations
  async getSiteSetting(key: string): Promise<SiteSetting | undefined> {
    return Array.from(this.siteSettings.values()).find(
      (setting) => setting.key === key
    );
  }
  
  async setSiteSetting(key: string, value: string): Promise<SiteSetting> {
    const existingSetting = await this.getSiteSetting(key);
    const now = new Date();
    
    if (existingSetting) {
      const updatedSetting: SiteSetting = { 
        ...existingSetting, 
        value, 
        updatedAt: now 
      };
      this.siteSettings.set(existingSetting.id.toString(), updatedSetting);
      return updatedSetting;
    } else {
      const id = this.siteSettingsIdCounter++;
      const newSetting: SiteSetting = { 
        id, 
        key, 
        value, 
        updatedAt: now 
      };
      this.siteSettings.set(id.toString(), newSetting);
      return newSetting;
    }
  }
  
  async getAllSiteSettings(): Promise<SiteSetting[]> {
    return Array.from(this.siteSettings.values());
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
      signatureInfo: null,
      pdfUrl: null
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
  
  async updateNdaAgreementStatus(id: number, status: string): Promise<NdaAgreement | undefined> {
    const agreement = this.ndaAgreements.get(id);
    if (!agreement) return undefined;
    
    const updatedAgreement = { ...agreement, status };
    this.ndaAgreements.set(id, updatedAgreement);
    return updatedAgreement;
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
  
  // Seed initial data
  private seedData() {
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
    const [updatedProfile] = await db.update(schema.companyProfiles)
      .set(updates)
      .where(eq(schema.companyProfiles.id, id))
      .returning();
    return updatedProfile;
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

  // Project operations
  async getProject(id: number): Promise<Project | undefined> {
    const projects = await db.query.projects.findMany({
      where: eq(schema.projects.id, id),
      limit: 1
    });
    return projects.length > 0 ? projects[0] : undefined;
  }

  async getProjects(): Promise<Project[]> {
    return await db.query.projects.findMany();
  }

  async getProjectsByUserId(userId: number): Promise<Project[]> {
    return await db.query.projects.findMany({
      where: eq(schema.projects.userId, userId)
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

  // Message operations
  async getMessage(id: number): Promise<Message | undefined> {
    const messages = await db.query.messages.findMany({
      where: eq(schema.messages.id, id),
      limit: 1
    });
    return messages.length > 0 ? messages[0] : undefined;
  }

  async getMessages(userId: number): Promise<Message[]> {
    return await db.query.messages.findMany({
      where: or(
        eq(schema.messages.fromUserId, userId),
        eq(schema.messages.toUserId, userId)
      )
    });
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

    return await db.query.messages.findMany({
      where: whereClause,
      orderBy: asc(schema.messages.createdAt)
    });
  }

  async createMessage(message: InsertMessage): Promise<Message> {
    const [insertedMessage] = await db.insert(schema.messages)
      .values({
        ...message,
        read: false
      })
      .returning();
    return insertedMessage;
  }

  async markMessageAsRead(id: number): Promise<Message | undefined> {
    const [updatedMessage] = await db.update(schema.messages)
      .set({ read: true })
      .where(eq(schema.messages.id, id))
      .returning();
    return updatedMessage;
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

  async setSiteSetting(key: string, value: string): Promise<SiteSetting> {
    const existingSetting = await this.getSiteSetting(key);

    if (existingSetting) {
      const [updatedSetting] = await db.update(schema.siteSettings)
        .set({ value, updatedAt: new Date() })
        .where(eq(schema.siteSettings.key, key))
        .returning();
      return updatedSetting;
    } else {
      const [newSetting] = await db.insert(schema.siteSettings)
        .values({ key, value })
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
        signatureInfo: null,
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
}

// Change from MemStorage to DatabaseStorage
export const storage = new DatabaseStorage();
