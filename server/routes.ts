import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { WebSocketServer, WebSocket } from "ws";
import crypto from "crypto";
import { sendPasswordResetEmail, sendPasswordChangedNotification } from "./emailService";

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

import {
  getEnhancedRecommendationsForProject,
  getEnhancedRecommendationsForCompany,
  getEnhancedSimilarProjects,
  discoverProjectDomains,
  discoverTrendingTechnologies,
  analyzeProject,
  analyzeCompany
} from "./aiRecommendation";
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
  
  // Password reset routes
  app.post('/api/auth/forgot-password', async (req: Request, res: Response) => {
    try {
      const { email } = req.body;
      if (!email) {
        return res.status(400).json({ message: 'Email is required' });
      }
      
      // Check if user exists
      const user = await storage.getUserByEmail(email);
      if (!user) {
        // لأسباب أمنية، نخبر المستخدم أن البريد تم إرساله حتى لو كان البريد غير موجود
        return res.json({ success: true, message: 'If your email exists in our system, you will receive a password reset link' });
      }
      
      // Generate token
      const token = crypto.randomBytes(32).toString('hex');
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 24); // الرمز صالح لمدة 24 ساعة
      
      // Store token
      const success = await storage.createPasswordResetToken(email, token, expiresAt);
      if (!success) {
        return res.status(500).json({ message: 'Failed to create password reset token' });
      }
      
      // Generate reset link
      const resetLink = `${req.protocol}://${req.get('host')}/auth/reset-password/${token}`;
      
      // Send email
      console.log("إرسال بريد إعادة تعيين كلمة المرور إلى:", user.email);
      let emailSent = false;
      
      try {
        emailSent = await sendPasswordResetEmail(
          user.email,
          user.name,
          token,
          resetLink
        );
        console.log("نتيجة إرسال البريد الإلكتروني:", emailSent ? "ناجح" : "فاشل");
      } catch (error) {
        console.error("استثناء أثناء إرسال البريد الإلكتروني:", error);
      }
      
      // في بيئة التطوير، نعرض دائماً الرابط (سواء نجح إرسال البريد أم لا)
      // في بيئة الإنتاج، يمكن تعديل هذا الشرط ليكون process.env.NODE_ENV !== 'production'
      const isDevelopment = true;
      
      if (isDevelopment || !emailSent) {
        console.log("عرض رابط إعادة التعيين في بيئة التطوير:", resetLink);
        return res.json({ 
          success: true, 
          message: 'Password reset link generated. For development purposes, it is returned in this response.', 
          resetLink: resetLink,
          emailSent: emailSent
        });
      }
      
      // هذا الجزء سيتم تنفيذه فقط في حالة نجاح إرسال البريد في بيئة الإنتاج
      res.json({ 
        success: true, 
        message: 'Password reset link has been sent to your email'
      });
    } catch (error) {
      console.error('Error in forgot password:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });
  
  // Verify password reset token
  app.get('/api/auth/reset-password/:token', async (req: Request, res: Response) => {
    try {
      const { token } = req.params;
      
      const tokenData = await storage.getPasswordResetToken(token);
      if (!tokenData) {
        return res.status(400).json({ message: 'Invalid or expired token' });
      }
      
      res.json({ valid: true, email: tokenData.email });
    } catch (error) {
      console.error('Error verifying reset token:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });
  
  // Reset password with token
  app.post('/api/auth/reset-password/:token', async (req: Request, res: Response) => {
    try {
      const { token } = req.params;
      const { password } = req.body;
      
      if (!password) {
        return res.status(400).json({ message: 'Password is required' });
      }
      
      // Check if token is valid
      const tokenData = await storage.getPasswordResetToken(token);
      if (!tokenData) {
        return res.status(400).json({ message: 'Invalid or expired token' });
      }
      
      // Hash the new password
      const hashedPassword = await bcrypt.hash(password, 10);
      
      // Update the user's password
      const updatedUser = await storage.updateUserPassword(tokenData.userId, hashedPassword);
      if (!updatedUser) {
        return res.status(500).json({ message: 'Failed to update password' });
      }
      
      // Delete the token so it can't be used again
      await storage.deletePasswordResetToken(token);
      
      res.json({ success: true, message: 'Password has been reset successfully' });
    } catch (error) {
      console.error('Error resetting password:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
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

  // Company profile routes - الشركات لا تظهر أبداً للزوار أو العملاء
  app.get('/api/companies', async (req: Request, res: Response) => {
    try {
      // المستخدم مسجل دخول والمستخدم هو مسؤول، نعرض جميع الشركات
      if (req.isAuthenticated() && (req.user as any).role === 'admin') {
        const companyProfiles = await storage.getCompanyProfiles();
        
        // الحصول على بيانات المستخدم المرتبطة بكل شركة
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
      } else {
        // الزوار والعملاء لا يرون الشركات أبداً
        res.json([]);
      }
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
  
  // محرك التوصيات المعزز بالذكاء الاصطناعي
  // 1. الحصول على الشركات الموصى بها لمشروع معين (نسخة معززة)
  app.get('/api/ai-recommendations/projects/:projectId/companies', async (req: Request, res: Response) => {
    try {
      const projectId = parseInt(req.params.projectId);
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 5;
      
      // استخدام محرك التوصيات المعزز
      const recommendedCompanies = await getEnhancedRecommendationsForProject(projectId, limit);
      
      // إذا كان هناك مستخدم مسجل الدخول وهو صاحب المشروع، أظهر المعلومات مع تعمية الشركات
      if (req.isAuthenticated()) {
        const user = req.user as any;
        const project = await storage.getProject(projectId);
        
        if (project && project.userId === user.id) {
          const companiesWithBlurredData = await Promise.all(
            recommendedCompanies.map(async ({ company, matchScore, matchDetails }) => {
              const companyUser = await storage.getUser(company.userId);
              
              // إنشاء اسم مستعار مختصر
              const blurredName = companyUser?.name 
                ? `شركة ${companyUser.name.charAt(0)}...` 
                : 'شركة متخصصة';
              
              return {
                company: {
                  ...company,
                  blurredName,
                  verified: company.verified,
                  rating: company.rating,
                  skills: company.skills
                },
                matchScore,
                matchDetails
              };
            })
          );
          
          return res.json(companiesWithBlurredData);
        }
      }
      
      // للزوار أو الشركات الأخرى، إخفاء المعلومات تماماً
      res.json([]);
    } catch (error) {
      console.error('Error fetching AI recommendations:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });
  
  // 2. الحصول على المشاريع الموصى بها لشركة معينة (نسخة معززة)
  app.get('/api/ai-recommendations/companies/:companyId/projects', async (req: Request, res: Response) => {
    try {
      const companyId = parseInt(req.params.companyId);
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 5;
      
      // استخدام محرك التوصيات المعزز
      const recommendedProjects = await getEnhancedRecommendationsForCompany(companyId, limit);
      res.json(recommendedProjects);
    } catch (error) {
      console.error('Error fetching AI recommendations:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });
  
  // 3. الحصول على المشاريع المشابهة لمشروع معين (نسخة معززة)
  app.get('/api/ai-recommendations/projects/:projectId/similar', async (req: Request, res: Response) => {
    try {
      const projectId = parseInt(req.params.projectId);
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 3;
      
      // استخدام محرك التوصيات المعزز
      const similarProjects = await getEnhancedSimilarProjects(projectId, limit);
      res.json(similarProjects);
    } catch (error) {
      console.error('Error fetching AI similar projects:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });
  
  // 4. تحليل اتجاهات السوق - المجالات الشائعة
  app.get('/api/ai-recommendations/market/domains', async (req: Request, res: Response) => {
    try {
      const domains = await discoverProjectDomains();
      res.json(domains);
    } catch (error) {
      console.error('Error discovering market domains:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });
  
  // 5. تحليل اتجاهات السوق - التقنيات الشائعة
  app.get('/api/ai-recommendations/market/technologies', async (req: Request, res: Response) => {
    try {
      const technologies = await discoverTrendingTechnologies();
      res.json(technologies);
    } catch (error) {
      console.error('Error discovering trending technologies:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });
  
  // 6. تحليل مشروع محدد
  app.get('/api/ai-recommendations/analyze/project/:projectId', async (req: Request, res: Response) => {
    try {
      const projectId = parseInt(req.params.projectId);
      const project = await storage.getProject(projectId);
      
      if (!project) {
        return res.status(404).json({ message: 'Project not found' });
      }
      
      // التحقق من صلاحية الوصول - يمكن فقط لصاحب المشروع أو مسؤول النظام رؤية التحليل
      if (req.isAuthenticated()) {
        const user = req.user as any;
        
        if (project.userId === user.id || user.role === 'admin') {
          const analyzedProject = analyzeProject(project);
          return res.json(analyzedProject);
        }
      }
      
      res.status(403).json({ message: 'Unauthorized' });
    } catch (error) {
      console.error('Error analyzing project:', error);
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

  // Project Offers routes - الشركات تظهر فقط بشكل معمّى للعميل صاحب المشروع
  app.get('/api/projects/:projectId/offers', async (req: Request, res: Response) => {
    try {
      const projectId = parseInt(req.params.projectId);
      const project = await storage.getProject(projectId);
      
      if (!project) {
        return res.status(404).json({ message: 'Project not found' });
      }
      
      // إذا كان المستخدم مسجل الدخول وهو صاحب المشروع، أظهر كل العروض مع تعمية معلومات الشركات
      // إذا كان المستخدم شركة، أظهر فقط عروضه على هذا المشروع
      // إذا كان زائر، أظهر فقط عدد العروض المقدمة
      let offers = await storage.getProjectOffersByProjectId(projectId);
      
      if (req.isAuthenticated()) {
        const user = req.user as any;
        
        if (project.userId === user.id) {
          // صاحب المشروع - يرى جميع العروض مع تعمية معلومات الشركات
          const offersWithBlurredCompanyData = await Promise.all(
            offers.map(async (offer) => {
              const companyProfile = await storage.getCompanyProfile(offer.companyId);
              const companyUser = await storage.getUser(companyProfile?.userId || 0);
              
              // إذا كان العرض مقبول وتم الدفع، نكشف معلومات الشركة
              if (offer.status === 'accepted' && offer.depositPaid) {
                return {
                  ...offer,
                  companyName: companyUser?.name,
                  companyLogo: companyProfile?.logo,
                  companyVerified: companyProfile?.verified,
                  companyRating: companyProfile?.rating,
                  companyEmail: companyUser?.email,
                  companyUsername: companyUser?.username,
                  companyContactRevealed: true
                };
              }
              
              // وإلا نعرض المعلومات بشكل معمّى
              return {
                ...offer,
                // تعمية اسم الشركة مع الإشارة إلى حالة التوثيق فقط
                companyName: companyProfile?.verified 
                  ? `شركة موثقة ${companyUser?.name ? companyUser.name.charAt(0) : ''}***` 
                  : `شركة ${companyUser?.name ? companyUser.name.charAt(0) : ''}***`,
                companyLogo: null, // إخفاء الشعار
                companyVerified: companyProfile?.verified || false,
                companyRating: companyProfile?.rating, // نعرض التقييم لأنه مفيد للمقارنة
                companyBlurred: true // علامة للواجهة للإشارة إلى أن المعلومات معمّاة
              };
            })
          );
          
          return res.json(offersWithBlurredCompanyData);
        } else if (user.role === 'admin') {
          // المسؤولون - يرون جميع البيانات كاملة
          const offersWithFullCompanyData = await Promise.all(
            offers.map(async (offer) => {
              const companyProfile = await storage.getCompanyProfile(offer.companyId);
              const companyUser = await storage.getUser(companyProfile?.userId || 0);
              
              return {
                ...offer,
                company: {
                  ...companyProfile,
                  username: companyUser?.username,
                  name: companyUser?.name,
                  email: companyUser?.email
                }
              };
            })
          );
          
          return res.json(offersWithFullCompanyData);
        } else if (user.role === 'company') {
          // الشركة - ترى فقط عروضها على هذا المشروع
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
  
  // إحصائيات المنصة للزوار - فقط الأرقام بدون معلومات تفصيلية
  app.get('/api/platform-stats', async (req: Request, res: Response) => {
    try {
      // الحصول على عدد الشركات (الجميع، ليس فقط الموثقة)
      const companyProfiles = await storage.getCompanyProfiles();
      const companiesCount = companyProfiles.length;
      
      // الحصول على عدد العروض المقدمة
      const offers = await storage.getAllProjectOffers();
      const offersCount = offers.length;
      
      // الحصول على متوسط وقت الاستجابة (30 دقيقة كقيمة ثابتة للعرض التسويقي)
      const responseTimeMinutes = 30;
      
      // الحصول على عدد المشاريع المكتملة
      const projects = await storage.getProjects();
      const completedProjectsCount = projects.filter(project => project.status === 'completed').length;
      
      // الاستجابة بالإحصائيات
      res.json({
        companiesCount,
        offersCount,
        responseTimeMinutes,
        completedProjectsCount
      });
    } catch (error) {
      console.error('Error getting platform stats:', error);
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
