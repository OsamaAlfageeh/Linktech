import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { WebSocketServer, WebSocket } from "ws";

// Track active connections
const connections = new Map<number, WebSocket>();
import { 
  insertUserSchema, 
  insertCompanyProfileSchema, 
  insertProjectSchema, 
  insertMessageSchema,
  insertTestimonialSchema,
  insertProjectOfferSchema
} from "@shared/schema";
import { z } from "zod";
import { 
  getRecommendedProjectsForCompany, 
  getRecommendedCompaniesForProject,
  getSimilarProjects,
  getTrendingProjects
} from "./recommendation";
import session from "express-session";
import { checkMessageForProhibitedContent, sanitizeMessageContent, addMessageToConversationHistory } from "./contentFilter";
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import MemoryStore from "memorystore";
import bcrypt from "bcryptjs";

const SessionStore = MemoryStore(session);

export async function registerRoutes(app: Express): Promise<Server> {
  // Initialize session and passport
  // تكوين الجلسة بشكل صحيح
  app.use(session({
    secret: process.env.SESSION_SECRET || 'techlinkapp',
    resave: true, // تعديل للتأكد من حفظ التغييرات 
    saveUninitialized: true, // تعديل للتأكد من حفظ الجلسات الجديدة
    cookie: { 
      secure: false, // تغيير إلى true في بيئة الإنتاج مع HTTPS
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 يوم
      httpOnly: true,
      sameSite: 'lax'
    },
    store: new SessionStore({
      checkPeriod: 86400000 // تنظيف الجلسات المنتهية كل 24 ساعة
    })
  }));
  
  // لتصحيح الأخطاء المتعلقة بالـ CORS مع الجلسات
  app.use((req, res, next) => {
    res.header('Access-Control-Allow-Credentials', 'true');
    next();
  });

  app.use(passport.initialize());
  app.use(passport.session());

  // Configure passport
  passport.use(new LocalStrategy(async (username, password, done) => {
    try {
      console.log(`محاولة تسجيل دخول للمستخدم: ${username}`);
      
      const user = await storage.getUserByUsername(username);
      if (!user) {
        console.log(`لم يتم العثور على مستخدم باسم: ${username}`);
        return done(null, false, { message: 'Incorrect username.' });
      }
      
      console.log(`تم العثور على المستخدم: ${username}, يتم التحقق من كلمة المرور...`);
      
      // للتوافق مع الحسابات الموجودة والمستقبلية
      let isValidPassword = false;
      
      // التحقق إذا كانت كلمة المرور مشفرة بالفعل
      if (user.password.startsWith('$2a$') || user.password.startsWith('$2b$')) {
        console.log(`كلمة المرور مشفرة للمستخدم: ${username}، استخدام bcrypt للتحقق`);
        // كلمة المرور مشفرة، استخدم bcrypt للتحقق
        isValidPassword = await bcrypt.compare(password, user.password);
        console.log(`نتيجة التحقق باستخدام bcrypt: ${isValidPassword ? 'ناجح' : 'فاشل'}`);
      } else {
        console.log(`كلمة المرور غير مشفرة للمستخدم: ${username}، استخدام المقارنة المباشرة`);
        // كلمة المرور غير مشفرة (حسابات قديمة)، قارن مباشرة
        isValidPassword = user.password === password;
        console.log(`نتيجة التحقق المباشر: ${isValidPassword ? 'ناجح' : 'فاشل'}`);
        
        // إذا نجح التحقق، قم بتحديث كلمة المرور لتكون مشفرة
        if (isValidPassword) {
          console.log(`ترحيل كلمة المرور للمستخدم: ${username} إلى bcrypt`);
          const hashedPassword = await bcrypt.hash(password, 10);
          await storage.updateUserPassword(user.id, hashedPassword);
          console.log(`تم تحديث تشفير كلمة المرور للمستخدم: ${username}`);
        }
      }
      
      if (!isValidPassword) {
        console.log(`فشل المصادقة للمستخدم: ${username} - كلمة المرور غير صحيحة`);
        return done(null, false, { message: 'Incorrect password.' });
      }
      
      console.log(`نجاح المصادقة للمستخدم: ${username} بالدور: ${user.role}`);
      return done(null, user);
    } catch (err) {
      console.error(`خطأ أثناء المصادقة للمستخدم: ${username}`, err);
      return done(err);
    }
  }));

  passport.serializeUser((user: any, done) => {
    done(null, user.id);
  });

  passport.deserializeUser(async (id: number, done) => {
    try {
      const user = await storage.getUser(id);
      if (!user) {
        return done(null, false);
      }
      // نحن لا نحتاج لإزالة كلمة المرور هنا لأن هذه المعلومات ستبقى في العملية
      // وخطوة إزالة كلمة المرور تحدث عند إرسال البيانات للمستخدم في استجابات API
      done(null, user);
    } catch (err) {
      done(err);
    }
  });

  const isAuthenticated = (req: Request, res: Response, next: Function) => {
    if (req.isAuthenticated()) {
      return next();
    }
    res.status(401).json({ message: 'Unauthorized' });
  };

  // Auth routes
  app.post('/api/auth/register', async (req: Request, res: Response) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      
      // Check if username or email exists
      const existingUsername = await storage.getUserByUsername(userData.username);
      if (existingUsername) {
        return res.status(400).json({ message: 'Username already exists' });
      }
      
      const existingEmail = await storage.getUserByEmail(userData.email);
      if (existingEmail) {
        return res.status(400).json({ message: 'Email already exists' });
      }
      
      // تشفير كلمة المرور قبل التخزين
      const hashedPassword = await bcrypt.hash(userData.password, 10);
      const securedUserData = { ...userData, password: hashedPassword };
      
      const user = await storage.createUser(securedUserData);
      
      // If user is a company, create a company profile
      if (userData.role === 'company' && req.body.companyProfile) {
        const profileData = insertCompanyProfileSchema.parse({
          ...req.body.companyProfile,
          userId: user.id
        });
        await storage.createCompanyProfile(profileData);
      }
      
      // Auto-login after registration
      req.login(user, (err) => {
        if (err) {
          return res.status(500).json({ message: 'Error logging in after registration' });
        }
        // إزالة كلمة المرور من استجابة التسجيل
        const { password, ...userWithoutPassword } = user;
        return res.status(201).json({ user: userWithoutPassword });
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Validation error', errors: error.errors });
      }
      console.error('Registration error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.post('/api/auth/login', passport.authenticate('local'), (req: Request, res: Response) => {
    console.log('تسجيل دخول ناجح للمستخدم:', req.user?.username);
    const user = req.user as any;
    // إزالة كلمة المرور من استجابة تسجيل الدخول
    const { password, ...userWithoutPassword } = user;
    console.log('إرسال استجابة تسجيل الدخول:', { user: userWithoutPassword });
    res.json({ user: userWithoutPassword });
  });

  app.post('/api/auth/logout', (req: Request, res: Response) => {
    req.logout(() => {
      res.json({ success: true });
    });
  });

  // طريقة سريعة لإنشاء حساب مسؤول (فقط للاختبار)
  app.get('/api/admin/create', async (req: Request, res: Response) => {
    try {
      // تحقق مما إذا كان يوجد مستخدم بنفس اسم المستخدم
      const existingUser = await storage.getUserByUsername('admin');
      if (existingUser) {
        // إزالة كلمة المرور من الاستجابة
        const { password, ...userWithoutPassword } = existingUser;
        return res.json({ message: 'Admin user already exists', user: userWithoutPassword });
      }
      
      // تشفير كلمة المرور للمسؤول
      const hashedPassword = await bcrypt.hash('admin123', 10);
      
      // إنشاء مستخدم المسؤول
      const adminUser = await storage.createUser({
        username: 'admin',
        password: hashedPassword,
        email: 'admin@techlink.example',
        role: 'admin',
        name: 'مسؤول النظام',
        avatar: 'https://randomuser.me/api/portraits/men/33.jpg'
      });
      
      // إزالة كلمة المرور من الاستجابة
      const { password, ...userWithoutPassword } = adminUser;
      return res.json({ message: 'Admin user created successfully', user: userWithoutPassword });
    } catch (error) {
      console.error('Error creating admin user:', error);
      return res.status(500).json({ message: 'Error creating admin user' });
    }
  });

  app.get('/api/auth/user', (req: Request, res: Response) => {
    console.log(`طلب /api/auth/user - حالة المصادقة: ${req.isAuthenticated() ? 'مصرح' : 'غير مصرح'}`);
    
    if (req.isAuthenticated()) {
      const user = req.user as any;
      console.log(`استرجاع معلومات المستخدم: ${user.username}, الدور: ${user.role}, معرف: ${user.id}`);
      
      // استثناء كلمة المرور من الاستجابة
      const { password, ...userWithoutPassword } = user;
      console.log(`إرسال معلومات المستخدم بدون كلمة المرور: `, { user: userWithoutPassword });
      
      return res.json({ user: userWithoutPassword });
    }
    
    console.log(`طلب /api/auth/user - المستخدم غير مصرح, sessionID: ${req.sessionID}`);
    return res.status(401).json({ message: 'Not authenticated' });
  });

  // جلب جميع المستخدمين (للمسؤول فقط)
  app.get('/api/users/all', async (req: Request, res: Response) => {
    try {
      // تحقق ما إذا كان المستخدم مسجل الدخول ومسؤول
      if (!req.isAuthenticated() || req.user?.role !== 'admin') {
        return res.status(403).json({ message: 'Forbidden' });
      }
      
      const users = await storage.getUsers();
      // استثناء كلمات المرور من القائمة
      const usersWithoutPasswords = users.map(user => {
        const { password, ...userWithoutPassword } = user;
        return userWithoutPassword;
      });
      
      res.json(usersWithoutPasswords);
    } catch (error) {
      console.error('Error fetching all users:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // User routes
  app.get('/api/users/:id', async (req: Request, res: Response) => {
    try {
      const user = await storage.getUser(parseInt(req.params.id));
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      const { password, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error) {
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // Company profile routes
  app.get('/api/companies', async (req: Request, res: Response) => {
    try {
      const companyProfiles = await storage.getCompanyProfiles();
      
      // Get associated user data for each profile
      const profilesWithUserData = await Promise.all(
        companyProfiles.map(async (profile) => {
          const user = await storage.getUser(profile.userId);
          return {
            ...profile,
            username: user?.username,
            name: user?.name,
            email: user?.email
          };
        })
      );
      
      res.json(profilesWithUserData);
    } catch (error) {
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.get('/api/companies/:id', async (req: Request, res: Response) => {
    try {
      const profile = await storage.getCompanyProfile(parseInt(req.params.id));
      if (!profile) {
        return res.status(404).json({ message: 'Company profile not found' });
      }
      
      const user = await storage.getUser(profile.userId);
      
      res.json({
        ...profile,
        username: user?.username,
        name: user?.name,
        email: user?.email
      });
    } catch (error) {
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.post('/api/companies', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const user = req.user as any;
      
      if (user.role !== 'company') {
        return res.status(403).json({ message: 'Only company accounts can create profiles' });
      }
      
      // Check if profile already exists
      const existingProfile = await storage.getCompanyProfileByUserId(user.id);
      if (existingProfile) {
        return res.status(400).json({ message: 'Profile already exists' });
      }
      
      const profileData = insertCompanyProfileSchema.parse({
        ...req.body,
        userId: user.id
      });
      
      const profile = await storage.createCompanyProfile(profileData);
      res.status(201).json(profile);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Validation error', errors: error.errors });
      }
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.patch('/api/companies/:id', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const user = req.user as any;
      const profileId = parseInt(req.params.id);
      
      const profile = await storage.getCompanyProfile(profileId);
      if (!profile) {
        return res.status(404).json({ message: 'Company profile not found' });
      }
      
      if (profile.userId !== user.id && user.role !== 'admin') {
        return res.status(403).json({ message: 'Not authorized to update this profile' });
      }
      
      const updatedProfile = await storage.updateCompanyProfile(profileId, req.body);
      res.json(updatedProfile);
    } catch (error) {
      res.status(500).json({ message: 'Internal server error' });
    }
  });
  
  // توثيق أو إلغاء توثيق شركة - للمسؤولين فقط
  app.patch('/api/companies/:id/verify', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const user = req.user as any;
      // تأكد من أن المستخدم مسؤول
      if (user.role !== 'admin') {
        return res.status(403).json({ message: 'هذه العملية متاحة للمسؤولين فقط' });
      }
      
      const companyId = parseInt(req.params.id);
      const verified = req.body.verified === true;
      
      const companyProfile = await storage.verifyCompany(companyId, verified);
      if (!companyProfile) {
        return res.status(404).json({ message: 'الشركة غير موجودة' });
      }
      
      res.json(companyProfile);
    } catch (error) {
      console.error('Error verifying company:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // Project routes
  app.get('/api/projects', async (req: Request, res: Response) => {
    try {
      const projects = await storage.getProjects();
      
      // Get associated user data for each project
      const projectsWithUserData = await Promise.all(
        projects.map(async (project) => {
          const user = await storage.getUser(project.userId);
          return {
            ...project,
            username: user?.username,
            name: user?.name
          };
        })
      );
      
      res.json(projectsWithUserData);
    } catch (error) {
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.get('/api/projects/:id', async (req: Request, res: Response) => {
    try {
      const project = await storage.getProject(parseInt(req.params.id));
      if (!project) {
        return res.status(404).json({ message: 'Project not found' });
      }
      
      const user = await storage.getUser(project.userId);
      
      res.json({
        ...project,
        username: user?.username,
        name: user?.name
      });
    } catch (error) {
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.get('/api/users/:userId/projects', async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.userId);
      const projects = await storage.getProjectsByUserId(userId);
      res.json(projects);
    } catch (error) {
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.post('/api/projects', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const user = req.user as any;
      
      if (user.role !== 'entrepreneur') {
        return res.status(403).json({ message: 'Only entrepreneurs can create projects' });
      }
      
      const projectData = insertProjectSchema.parse({
        ...req.body,
        userId: user.id
      });
      
      const project = await storage.createProject(projectData);
      res.status(201).json(project);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Validation error', errors: error.errors });
      }
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.patch('/api/projects/:id', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const user = req.user as any;
      const projectId = parseInt(req.params.id);
      
      const project = await storage.getProject(projectId);
      if (!project) {
        return res.status(404).json({ message: 'Project not found' });
      }
      
      if (project.userId !== user.id) {
        return res.status(403).json({ message: 'Not authorized to update this project' });
      }
      
      const updatedProject = await storage.updateProject(projectId, req.body);
      res.json(updatedProject);
    } catch (error) {
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // Message routes
  app.get('/api/messages', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const user = req.user as any;
      const messages = await storage.getMessages(user.id);
      res.json(messages);
    } catch (error) {
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.get('/api/messages/conversation/:userId', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const user = req.user as any;
      const otherUserId = parseInt(req.params.userId);
      const projectId = req.query.projectId ? parseInt(req.query.projectId as string) : undefined;
      
      const messages = await storage.getConversation(user.id, otherUserId, projectId);
      res.json(messages);
    } catch (error) {
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.post('/api/messages', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const user = req.user as any;
      
      // تحقق من محتوى الرسالة قبل الحفظ مع تمرير معرفات المستخدمين للكشف عن الأنماط المتسلسلة
      const contentCheck = checkMessageForProhibitedContent(
        req.body.content,
        user.id,
        req.body.toUserId
      );
      
      if (!contentCheck.safe) {
        // رسالة خطأ مخصصة للنمط المتسلسل
        let errorMessage = 'الرسالة تحتوي على معلومات اتصال محظورة';
        if (contentCheck.violations?.includes('نمط_متسلسل_مشبوه')) {
          errorMessage = 'تم رصد محاولة لتمرير معلومات اتصال عبر عدة رسائل';
          console.log(`تم اكتشاف نمط متسلسل مشبوه بين المستخدمين ${user.id} و ${req.body.toUserId}`);
        }
        
        // إذا احتوت الرسالة على معلومات محظورة
        return res.status(400).json({ 
          message: errorMessage,
          violations: contentCheck.violations,
          error: true
        });
      }
      
      // إضافة الرسالة إلى سجل المحادثة للفحص المستقبلي
      addMessageToConversationHistory(user.id, req.body.toUserId, req.body.content);
      
      const messageData = insertMessageSchema.parse({
        ...req.body,
        fromUserId: user.id
      });
      
      const message = await storage.createMessage(messageData);
      res.status(201).json(message);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Validation error', errors: error.errors });
      }
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.patch('/api/messages/:id/read', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const messageId = parseInt(req.params.id);
      const updatedMessage = await storage.markMessageAsRead(messageId);
      
      if (!updatedMessage) {
        return res.status(404).json({ message: 'Message not found' });
      }
      
      res.json(updatedMessage);
    } catch (error) {
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // مسارات محرك التوصية بالمشاريع
  // 1. الحصول على المشاريع الموصى بها لشركة معينة
  app.get('/api/recommendations/companies/:companyId/projects', async (req: Request, res: Response) => {
    try {
      const companyId = parseInt(req.params.companyId);
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 5;
      
      const recommendedProjects = await getRecommendedProjectsForCompany(companyId, limit);
      res.json(recommendedProjects);
    } catch (error) {
      console.error('Error in recommended projects:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });
  
  // 2. الحصول على الشركات الموصى بها لمشروع معين
  app.get('/api/recommendations/projects/:projectId/companies', async (req: Request, res: Response) => {
    try {
      const projectId = parseInt(req.params.projectId);
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 5;
      
      const recommendedCompanies = await getRecommendedCompaniesForProject(projectId, limit);
      res.json(recommendedCompanies);
    } catch (error) {
      console.error('Error in recommended companies:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });
  
  // 3. الحصول على المشاريع المشابهة لمشروع محدد
  app.get('/api/recommendations/projects/:projectId/similar', async (req: Request, res: Response) => {
    try {
      const projectId = parseInt(req.params.projectId);
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 3;
      
      const similarProjects = await getSimilarProjects(projectId, limit);
      res.json(similarProjects);
    } catch (error) {
      console.error('Error in similar projects:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });
  
  // 4. الحصول على المشاريع الرائجة (عالية الطلب)
  app.get('/api/recommendations/trending-projects', async (req: Request, res: Response) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 5;
      
      const trendingProjects = await getTrendingProjects(limit);
      res.json(trendingProjects);
    } catch (error) {
      console.error('Error in trending projects:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });
  
  // Testimonial routes
  app.get('/api/testimonials', async (req: Request, res: Response) => {
    try {
      const testimonials = await storage.getTestimonials();
      res.json(testimonials);
    } catch (error) {
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.post('/api/testimonials', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const user = req.user as any;
      
      const testimonialData = insertTestimonialSchema.parse({
        ...req.body,
        userId: user.id,
        role: user.role
      });
      
      const testimonial = await storage.createTestimonial(testimonialData);
      res.status(201).json(testimonial);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Validation error', errors: error.errors });
      }
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // Project Offers routes
  app.get('/api/projects/:projectId/offers', async (req: Request, res: Response) => {
    try {
      const projectId = parseInt(req.params.projectId);
      const project = await storage.getProject(projectId);
      
      if (!project) {
        return res.status(404).json({ message: 'Project not found' });
      }
      
      // إذا كان المستخدم مسجل الدخول وهو صاحب المشروع، أظهر كل العروض
      // إذا كان المستخدم شركة، أظهر فقط عروضها على هذا المشروع
      // إذا كان زائر، أظهر فقط عدد العروض المقدمة
      let offers = await storage.getProjectOffersByProjectId(projectId);
      
      if (req.isAuthenticated()) {
        const user = req.user as any;
        
        if (project.userId === user.id || user.role === 'admin') {
          // صاحب المشروع أو المسؤول - يرى جميع العروض
          // لكل عرض، أحضر بيانات الشركة مع إخفاء بعض المعلومات
          const offersWithCompanyData = await Promise.all(
            offers.map(async (offer) => {
              const companyProfile = await storage.getCompanyProfile(offer.companyId);
              const user = await storage.getUser(companyProfile?.userId || 0);
              
              return {
                ...offer,
                companyName: user ? (offer.contactRevealed ? user.name : `شركة ${user.name.charAt(0)}****`) : null,
                companyLogo: companyProfile?.logo || null,
                companyVerified: companyProfile?.verified || false,
                companyRating: companyProfile?.rating || null,
              };
            })
          );
          
          return res.json(offersWithCompanyData);
        } else if (user.role === 'company') {
          // المستخدم شركة - يرى فقط عروضه على هذا المشروع
          const companyProfile = await storage.getCompanyProfileByUserId(user.id);
          
          if (!companyProfile) {
            return res.status(403).json({ message: 'Company profile not found' });
          }
          
          offers = offers.filter(offer => offer.companyId === companyProfile.id);
          return res.json(offers);
        }
      }
      
      // المستخدم زائر أو غير مصرح له - يرى فقط إحصائيات العروض
      return res.json({ 
        count: offers.length,
        minAmount: offers.length > 0 ? Math.min(...offers.map(o => parseInt(o.amount.replace(/[^0-9]/g, '')))) : null,
        maxAmount: offers.length > 0 ? Math.max(...offers.map(o => parseInt(o.amount.replace(/[^0-9]/g, '')))) : null,
      });
      
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });
  
  app.post('/api/projects/:projectId/offers', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const user = req.user as any;
      const projectId = parseInt(req.params.projectId);
      
      if (user.role !== 'company') {
        return res.status(403).json({ message: 'Only companies can submit offers' });
      }
      
      const project = await storage.getProject(projectId);
      if (!project) {
        return res.status(404).json({ message: 'Project not found' });
      }
      
      const companyProfile = await storage.getCompanyProfileByUserId(user.id);
      if (!companyProfile) {
        return res.status(403).json({ message: 'Company profile not found' });
      }
      
      // تحقق مما إذا كانت الشركة قد قدمت عرضاً بالفعل
      const existingOffers = await storage.getProjectOffersByProjectId(projectId);
      const hasExistingOffer = existingOffers.some(offer => offer.companyId === companyProfile.id);
      
      if (hasExistingOffer) {
        return res.status(400).json({ message: 'You have already submitted an offer for this project' });
      }
      
      const offerData = insertProjectOfferSchema.parse({
        ...req.body,
        projectId,
        companyId: companyProfile.id
      });
      
      const offer = await storage.createProjectOffer(offerData);
      res.status(201).json(offer);
      
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors });
      }
      console.error(error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });
  
  app.patch('/api/offers/:id/accept', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const user = req.user as any;
      const offerId = parseInt(req.params.id);
      
      // تحقق من أن العرض موجود
      const offer = await storage.getProjectOffer(offerId);
      if (!offer) {
        return res.status(404).json({ message: 'Offer not found' });
      }
      
      // تحقق من أن المشروع موجود
      const project = await storage.getProject(offer.projectId);
      if (!project) {
        return res.status(404).json({ message: 'Project not found' });
      }
      
      // تحقق من أن مقدم الطلب هو صاحب المشروع
      if (project.userId !== user.id && user.role !== 'admin') {
        return res.status(403).json({ message: 'Only the project owner can accept offers' });
      }
      
      // حساب قيمة العربون (10% من قيمة العرض)
      const amount = parseInt(offer.amount.replace(/[^0-9]/g, ''));
      const depositAmount = Math.round(amount * 0.1).toString();
      
      // تحديث حالة العرض إلى 'accepted'
      const updatedOffer = await storage.updateProjectOfferStatus(offerId, 'accepted');
      
      // إرجاع العرض المحدث مع معلومات الدفع المطلوبة
      res.json({
        ...updatedOffer,
        depositAmount,
        paymentRequired: true
      });
      
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });
  
  app.post('/api/offers/:id/pay-deposit', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const user = req.user as any;
      const offerId = parseInt(req.params.id);
      const { paymentId, depositAmount } = req.body;
      
      if (!paymentId || !depositAmount) {
        return res.status(400).json({ message: 'Payment ID and deposit amount are required' });
      }
      
      // تحقق من أن العرض موجود
      const offer = await storage.getProjectOffer(offerId);
      if (!offer) {
        return res.status(404).json({ message: 'Offer not found' });
      }
      
      // تحقق من أن المشروع موجود
      const project = await storage.getProject(offer.projectId);
      if (!project) {
        return res.status(404).json({ message: 'Project not found' });
      }
      
      // تحقق من أن مقدم الطلب هو صاحب المشروع
      if (project.userId !== user.id && user.role !== 'admin') {
        return res.status(403).json({ message: 'Only the project owner can pay deposits' });
      }
      
      // تحقق من أن العرض مقبول ولم يتم دفع العربون بعد
      if (offer.status !== 'accepted' || offer.depositPaid) {
        return res.status(400).json({ message: 'Invalid offer status or deposit already paid' });
      }
      
      // تحديث العرض لتسجيل دفع العربون
      const updatedOffer = await storage.setProjectOfferDepositPaid(offerId, depositAmount);
      
      // كشف معلومات التواصل الخاصة بالشركة
      const revealedOffer = await storage.setProjectOfferContactRevealed(offerId);
      
      // الحصول على معلومات الشركة وصاحب المشروع
      const company = await storage.getCompanyProfile(offer.companyId);
      const companyUser = company ? await storage.getUser(company.userId) : null;
      const projectOwner = await storage.getUser(project.userId);
      
      // إنشاء رسالة إلى الشركة تحتوي على تفاصيل التواصل
      if (companyUser && projectOwner) {
        await storage.createMessage({
          content: `تم قبول عرضك على مشروع "${project.title}" ودفع العربون. يمكنك التواصل مع ${projectOwner.name} عبر البريد الإلكتروني: ${projectOwner.email}`,
          fromUserId: projectOwner.id,
          toUserId: companyUser.id,
          projectId: project.id
        });
      }
      
      // تحديث حالة المشروع إلى 'in-progress'
      await storage.updateProject(project.id, { status: 'in-progress' });
      
      // إرجاع معلومات العرض المحدثة
      res.json({
        success: true,
        offer: revealedOffer,
        companyContact: companyUser ? {
          name: companyUser.name,
          email: companyUser.email
        } : null
      });
      
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // Site Settings routes
  // Get a specific site setting by key
  app.get('/api/site-settings/:key', async (req: Request, res: Response) => {
    try {
      const key = req.params.key;
      const setting = await storage.getSiteSetting(key);
      
      if (!setting) {
        return res.status(404).json({ message: 'Setting not found' });
      }
      
      res.json(setting);
    } catch (error) {
      console.error('Error getting site setting:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });
  
  // Get all site settings
  app.get('/api/site-settings', async (req: Request, res: Response) => {
    try {
      const settings = await storage.getAllSiteSettings();
      res.json(settings);
    } catch (error) {
      console.error('Error getting all site settings:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });
  
  // Set a site setting (admin only)
  app.post('/api/site-settings/:key', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const user = req.user as any;
      
      // Only admin can update site settings
      if (user.role !== 'admin') {
        return res.status(403).json({ message: 'هذه العملية متاحة للمسؤولين فقط' });
      }
      
      const key = req.params.key;
      const value = req.body.value;
      
      if (value === undefined) {
        return res.status(400).json({ message: 'Value is required' });
      }
      
      const setting = await storage.setSiteSetting(key, value);
      res.json(setting);
    } catch (error) {
      console.error('Error setting site setting:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  const httpServer = createServer(app);
  
  // إنشاء خادم WebSocket
  const wss = new WebSocketServer({ 
    server: httpServer,
    path: '/ws' // تمييز مسار WebSocket عن مسارات Vite العادية
  });
  
  // استخدام ثوابت WebSocket من مكتبة ws
  
  // تخزين اتصالات المستخدمين النشطة
  const clients = new Map<number, WebSocket[]>();
  
  wss.on('connection', (ws) => {
    console.log('اتصال WebSocket جديد');
    
    let userId: number | null = null;
    
    // الاستماع لرسائل العميل
    ws.on('message', async (message) => {
      try {
        const data = JSON.parse(message.toString());
        
        // إذا كانت رسالة تسجيل دخول، قم بتخزين معرف المستخدم مع الاتصال
        if (data.type === 'auth') {
          userId = data.userId;
          
          if (typeof userId === 'number') {
            // تسجيل الاتصال للمستخدم
            if (!clients.has(userId)) {
              clients.set(userId, []);
            }
            clients.get(userId)?.push(ws);
            
            console.log(`تم تسجيل المستخدم ${userId} في نظام WebSocket`);
          }
        }
        
        // إذا كانت رسالة دردشة جديدة
        if (data.type === 'message' && userId && typeof data.toUserId === 'number') {
          console.log(`رسالة جديدة من المستخدم ${userId} إلى ${data.toUserId}`);
          
          // التحقق من محتوى الرسالة قبل الحفظ
          // فحص المحتوى مع تمرير معرفات المستخدمين للكشف عن الأنماط المتسلسلة
          const contentCheck = checkMessageForProhibitedContent(data.content, userId, data.toUserId);
          
          // التحقق من مخالفة قوانين المحتوى
          if (!contentCheck.safe) {
            console.log(`محتوى رسالة محظور من المستخدم ${userId} إلى ${data.toUserId}، المخالفات: ${contentCheck.violations?.join(', ')}`);
            
            // رسالة خطأ مخصصة للنمط المتسلسل
            let errorMessage = 'الرسالة تحتوي على معلومات اتصال محظورة';
            if (contentCheck.violations?.includes('نمط_متسلسل_مشبوه')) {
              errorMessage = 'تم رصد محاولة لتمرير معلومات اتصال عبر عدة رسائل';
            }
            
            // إرسال إشعار بالخطأ للمرسل
            ws.send(JSON.stringify({
              type: 'message_error',
              error: {
                message: errorMessage,
                violations: contentCheck.violations
              }
            }));
            
            return; // عدم إكمال معالجة الرسالة
          }
          
          // حفظ الرسالة في قاعدة البيانات
          const message = await storage.createMessage({
            content: data.content,
            fromUserId: userId,
            toUserId: data.toUserId,
            projectId: data.projectId || null
          });
          
          // إرسال الرسالة للمستخدم المستقبل إذا كان متصلاً
          if (clients.has(data.toUserId)) {
            const recipientClients = clients.get(data.toUserId) || [];
            const messageData = {
              type: 'new_message',
              message
            };
            
            // إرسال الرسالة لجميع اتصالات المستخدم المستقبل
            for (const client of recipientClients) {
              if (client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify(messageData));
              }
            }
          }
          
          // إرسال رد بنجاح إرسال الرسالة للمرسل
          ws.send(JSON.stringify({
            type: 'message_sent',
            message
          }));
        }
      } catch (error) {
        console.error('خطأ في معالجة رسالة WebSocket:', error);
      }
    });
    
    // تنظيف الاتصالات عند الانقطاع
    ws.on('close', () => {
      console.log('انقطاع اتصال WebSocket');
      
      if (userId && typeof userId === 'number') {
        const userConnections = clients.get(userId) || [];
        const index = userConnections.indexOf(ws);
        
        if (index !== -1) {
          userConnections.splice(index, 1);
        }
        
        // إزالة المستخدم من قائمة المتصلين إذا لم تكن لديه اتصالات نشطة
        if (userConnections.length === 0) {
          clients.delete(userId);
        }
      }
    });
  });

  return httpServer;
}
