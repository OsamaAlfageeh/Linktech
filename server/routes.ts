import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { WebSocketServer, WebSocket } from "ws";
import crypto from "crypto";
import { sendPasswordResetEmail, sendPasswordChangedNotification } from "./emailService";
// استيراد مسارات Sitemap و robots.txt
import sitemapRoutes from "./routes/sitemap";
import arabicPdfTestRoutes from "./arabicPdfTest";
import pdfmakeTestRoutes from "./pdfmakeTest";
import PDFDocument from "pdfkit";
import { Readable } from "stream";
import fsExtra from "fs-extra";
import puppeteer from "puppeteer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import arabicReshaper from 'arabic-reshaper';
import bidiFactory from 'bidi-js';
const bidi = bidiFactory();

// Track active connections
const connections = new Map<number, WebSocket>();
import { 
  insertUserSchema, 
  insertCompanyProfileSchema, 
  insertProjectSchema, 
  insertMessageSchema,
  insertTestimonialSchema,
  insertProjectOfferSchema,
  insertNewsletterSubscriberSchema,
  insertNdaAgreementSchema,
  insertBlogCategorySchema,
  insertBlogPostSchema,
  insertBlogCommentSchema
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

// تم تعريف استيراد WebSocket واستخدامها في مكان آخر من الملف

export async function registerRoutes(app: Express): Promise<Server> {
  // Initialize session and passport
  // تكوين الجلسة بشكل صحيح
  app.use(session({
    secret: process.env.SESSION_SECRET || 'linktechapp',
    resave: true, // تعديل للتأكد من حفظ التغييرات 
    saveUninitialized: true, // تعديل للتأكد من حفظ الجلسات الجديدة
    cookie: { 
      secure: false, // تغيير إلى true في بيئة الإنتاج مع HTTPS
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 يوم
      httpOnly: true,
      sameSite: 'lax',
      path: '/'
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
        email: 'admin@linktech.app',
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
      console.log(`طلب قائمة الشركات - حالة المصادقة: ${req.isAuthenticated() ? 'مصرح' : 'غير مصرح'}`);
      
      // المستخدم مسجل دخول والمستخدم هو مسؤول، نعرض جميع الشركات
      if (req.isAuthenticated() && (req.user as any).role === 'admin') {
        console.log(`المستخدم مسؤول، عرض جميع الشركات`);
        
        const companyProfiles = await storage.getCompanyProfiles();
        console.log(`تم العثور على ${companyProfiles.length} شركة في قاعدة البيانات`);
        
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
        
        console.log(`تم تحضير ${profilesWithUserData.length} ملف شركة للمسؤول`);
        res.json(profilesWithUserData);
      } else {
        // الشركات تظهر للمستخدمين المسجلين
        console.log(`طلب قائمة الشركات من مستخدم ليس مسؤول أو زائر غير مسجل`);
        
        if (req.isAuthenticated()) {
          // للمستخدمين المسجلين - ارسال قائمة الشركات (محجوبة جزئياً) 
          const companyProfiles = await storage.getCompanyProfiles();
          
          // الحصول على بيانات المستخدم المرتبطة بكل شركة
          const profilesWithUserData = await Promise.all(
            companyProfiles.map(async (profile) => {
              const user = await storage.getUser(profile.userId);
              return {
                ...profile,
                username: user?.username,
                name: user?.name
              };
            })
          );
          
          console.log(`تم إرسال ${profilesWithUserData.length} شركة للمستخدم المسجل`);
          res.json(profilesWithUserData);
        } else {
          // للزوار غير المسجلين - لا نرسل أي شركات
          console.log(`زائر غير مسجل - عدم إرسال بيانات الشركات`);
          res.json([]);
        }
      }
    } catch (error) {
      console.error('خطأ في استرجاع قائمة الشركات:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // الحصول على بيانات الشركة بواسطة معرف المستخدم
  app.get('/api/companies/user/:userId', isAuthenticated, async (req: Request, res: Response) => {
    try {
      console.log(`طلب ملف الشركة للمستخدم رقم ${req.params.userId} - حالة المصادقة: ${req.isAuthenticated() ? 'مصرح' : 'غير مصرح'}`);
      
      const userId = parseInt(req.params.userId);
      if (isNaN(userId)) {
        return res.status(400).json({ message: 'Invalid user ID' });
      }
      
      // التحقق من أن المستخدم هو صاحب الملف أو مسؤول
      const currentUser = req.user as any;
      if (currentUser.id !== userId && currentUser.role !== 'admin') {
        console.log(`رفض وصول غير مصرح: المستخدم ${currentUser.id} حاول الوصول إلى ملف الشركة للمستخدم ${userId}`);
        return res.status(403).json({ message: 'Forbidden: You are not authorized to view this profile' });
      }
      
      // البحث عن ملف الشركة بناءً على معرف المستخدم
      const profile = await storage.getCompanyProfileByUserId(userId);
      if (!profile) {
        console.log(`لم يتم العثور على ملف للشركة للمستخدم ${userId}`);
        return res.status(404).json({ message: 'Company profile not found' });
      }
      
      // الحصول على بيانات المستخدم
      const user = await storage.getUser(userId);
      if (!user) {
        console.log(`لم يتم العثور على بيانات المستخدم ${userId}`);
        return res.status(404).json({ message: 'User not found' });
      }
      
      // بناء كائن الاستجابة
      const response = {
        ...profile,
        username: user.username,
        name: user.name,
        email: user.email
      };
      
      console.log(`تم إرسال بيانات الشركة "${user.name}" بنجاح`);
      res.json(response);
    } catch (error) {
      console.error(`خطأ في استرجاع بيانات الشركة:`, error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });
  
  app.get('/api/companies/:id', async (req: Request, res: Response) => {
    try {
      console.log(`طلب تفاصيل الشركة برقم ${req.params.id} - حالة المصادقة: ${req.isAuthenticated() ? 'مصرح' : 'غير مصرح'}`);
      
      const companyId = parseInt(req.params.id);
      if (isNaN(companyId)) {
        return res.status(400).json({ message: 'Invalid company ID' });
      }
      
      const profile = await storage.getCompanyProfile(companyId);
      if (!profile) {
        console.log(`لم يتم العثور على ملف للشركة برقم ${companyId}`);
        return res.status(404).json({ message: 'Company profile not found' });
      }
      
      const user = await storage.getUser(profile.userId);
      if (!user) {
        console.log(`لم يتم العثور على حساب المستخدم المرتبط بالشركة ${companyId}`);
        return res.status(404).json({ message: 'Company user not found' });
      }
      
      // بناء كائن الاستجابة
      const response = {
        ...profile,
        username: user.username,
        name: user.name,
        email: user.email
      };
      
      console.log(`تم إرسال بيانات الشركة "${user.name}" بنجاح`);
      res.json(response);
    } catch (error) {
      console.error(`خطأ في استرجاع بيانات الشركة:`, error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // كشف معلومات التواصل للشركة بعد دفع الرسوم
  app.post('/api/companies/:id/reveal-contact', isAuthenticated, async (req: Request, res: Response) => {
    try {
      console.log(`طلب كشف معلومات التواصل للشركة رقم ${req.params.id}`);
      const companyId = parseInt(req.params.id);
      
      if (isNaN(companyId)) {
        return res.status(400).json({ message: 'معرف الشركة غير صالح' });
      }
      
      const { paymentId, amount } = req.body;
      
      if (!paymentId) {
        return res.status(400).json({ message: 'معرف الدفع مطلوب' });
      }
      
      // في البيئة الحقيقية، هنا يمكن التحقق من صحة عملية الدفع مع ميسر
      console.log(`تم استلام معلومات الدفع: معرف الدفع=${paymentId}، المبلغ=${amount}`);
      
      // للتبسيط، سنعتبر أن جميع عمليات الدفع ناجحة في بيئة التطوير
      
      // إنشاء سجل للدفع في قاعدة البيانات
      // يمكن إضافة هذه الوظيفة لاحقاً للتتبع الكامل لعمليات الدفع
      
      console.log(`تم كشف معلومات التواصل للشركة رقم ${companyId} بنجاح`);
      
      // الرد بنجاح
      res.status(200).json({ 
        success: true, 
        message: 'تم كشف معلومات التواصل بنجاح',
        companyId 
      });
    } catch (error) {
      console.error(`خطأ في معالجة طلب كشف معلومات التواصل:`, error);
      res.status(500).json({ message: 'خطأ في الخادم الداخلي' });
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
      
      console.log(`طلب تحديث ملف الشركة برقم ${profileId} - المستخدم: ${user.username}`);
      console.log('بيانات التحديث:', JSON.stringify(req.body));
      
      const profile = await storage.getCompanyProfile(profileId);
      if (!profile) {
        console.log(`خطأ: لم يتم العثور على ملف الشركة برقم ${profileId}`);
        return res.status(404).json({ message: 'Company profile not found' });
      }
      
      if (profile.userId !== user.id && user.role !== 'admin') {
        console.log(`خطأ: المستخدم ${user.username} غير مصرح له بتحديث ملف الشركة ${profileId}`);
        return res.status(403).json({ message: 'Not authorized to update this profile' });
      }
      
      const updatedProfile = await storage.updateCompanyProfile(profileId, req.body);
      console.log('تم تحديث ملف الشركة بنجاح:', JSON.stringify(updatedProfile));
      res.json(updatedProfile);
    } catch (error) {
      console.error('خطأ في تحديث ملف الشركة:', error);
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
      
      // التحقق من صحة المعلمات
      const companyIdStr = req.params.id;
      if (!companyIdStr || isNaN(parseInt(companyIdStr))) {
        return res.status(400).json({ message: 'معرف الشركة غير صالح' });
      }
      
      const companyId = parseInt(companyIdStr);
      if (companyId <= 0) {
        return res.status(400).json({ message: 'معرف الشركة يجب أن يكون رقمًا موجبًا' });
      }
      
      // التحقق من حالة التوثيق
      if (req.body.verified === undefined) {
        return res.status(400).json({ message: 'يجب تحديد حالة التوثيق (verified)' });
      }
      
      const verified = req.body.verified === true;
      
      // التحقق من الملاحظات والمستندات
      let verificationNotes = '';
      if (req.body.verificationNotes) {
        if (typeof req.body.verificationNotes !== 'string') {
          return res.status(400).json({ message: 'يجب أن تكون ملاحظات التوثيق نص' });
        }
        
        if (req.body.verificationNotes.length > 1000) {
          return res.status(400).json({ message: 'ملاحظات التوثيق طويلة جداً (الحد الأقصى 1000 حرف)' });
        }
        
        verificationNotes = req.body.verificationNotes;
      }
      
      // التحقق من المستندات
      let verificationDocuments = null;
      if (req.body.verificationDocuments) {
        if (!Array.isArray(req.body.verificationDocuments)) {
          return res.status(400).json({ message: 'يجب أن تكون مستندات التوثيق مصفوفة' });
        }
        
        // يمكن إضافة المزيد من التحقق من حجم المستندات وعددها هنا
        if (req.body.verificationDocuments.length > 10) {
          return res.status(400).json({ message: 'عدد مستندات التوثيق كبير جداً (الحد الأقصى 10 مستندات)' });
        }
        
        verificationDocuments = req.body.verificationDocuments;
      }
      
      // جمع بيانات التحقق
      const verificationData = {
        verifiedBy: user.id, // معرف المسؤول الذي قام بالتوثيق
        verificationDate: new Date(),
        verificationNotes,
        verificationDocuments
      };
      
      console.log(`توثيق شركة ${companyId} بواسطة المسؤول ${user.id} - الحالة: ${verified ? 'موثقة' : 'غير موثقة'}`);
      
      // التحقق من وجود الشركة قبل محاولة التوثيق
      const existingCompany = await storage.getCompanyProfile(companyId);
      if (!existingCompany) {
        return res.status(404).json({ message: 'الشركة غير موجودة' });
      }
      
      const companyProfile = await storage.verifyCompany(companyId, verified, verificationData);
      if (!companyProfile) {
        return res.status(404).json({ message: 'فشل في تحديث حالة توثيق الشركة' });
      }
      
      // إرسال إشعار بالبريد الإلكتروني (إذا كان التحقق صحيحاً)
      if (verified) {
        try {
          const { sendCompanyVerificationEmail } = await import('./emailService');
          
          // الحصول على معلومات المستخدم للشركة
          const companyUser = await storage.getUser(companyProfile.userId);
          if (companyUser && companyUser.email) {
            console.log(`جاري إرسال بريد إلكتروني لإشعار الشركة بنتيجة التوثيق: ${companyUser.email}`);
            
            // استدعاء دالة إرسال بريد التوثيق
            const emailSent = await sendCompanyVerificationEmail(
              companyUser.email,
              companyUser.name || companyUser.username,
              companyProfile.name,
              req.body.verificationNotes || ''
            );
            
            if (emailSent) {
              console.log(`تم إرسال بريد إشعار التوثيق بنجاح إلى: ${companyUser.email}`);
            } else {
              console.warn(`فشل في إرسال بريد إشعار التوثيق إلى: ${companyUser.email}`);
            }
          } else {
            console.warn('لم يتم العثور على معلومات المستخدم أو البريد الإلكتروني للشركة');
          }
        } catch (emailError) {
          console.error('خطأ في إرسال إشعار التوثيق:', emailError);
          // لا نريد إيقاف العملية إذا فشل إرسال البريد الإلكتروني
        }
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
      console.log(`طلب قائمة المشاريع - حالة المصادقة: ${req.isAuthenticated() ? 'مصرح' : 'غير مصرح'}`);
      
      // فقط المستخدمين المسجلين يمكنهم مشاهدة المشاريع
      if (!req.isAuthenticated()) {
        console.log(`رفض طلب غير مصرح للوصول إلى قائمة المشاريع`);
        return res.json([]); // إرجاع مصفوفة فارغة للمستخدمين غير المسجلين
      }
      
      // المسؤولون يمكنهم مشاهدة جميع المشاريع
      // المستخدمون العاديون يرون فقط مشاريعهم الخاصة
      const user = req.user as any;
      let projects: any[] = [];
      
      if (user.role === 'admin') {
        console.log(`المستخدم مسؤول، عرض جميع المشاريع`);
        projects = await storage.getProjects();
      } else if (user.role === 'entrepreneur') {
        console.log(`مستخدم عادي (${user.username})، عرض المشاريع الخاصة فقط`);
        projects = await storage.getProjectsByUserId(user.id);
      } else if (user.role === 'company') {
        console.log(`شركة (${user.username})، عرض المشاريع المتاحة للشركات`);
        
        try {
          // الشركات تستطيع مشاهدة المشاريع المتاحة فقط (مشاريع رواد الأعمال)
          const allProjects = await storage.getProjects();
          console.log(`عدد المشاريع الكلي: ${allProjects.length}`);
          
          // طباعة معلومات جميع المشاريع للتشخيص
          console.log('تفاصيل جميع المشاريع المتاحة في النظام:');
          for (const p of allProjects) {
            const pOwner = await storage.getUser(p.userId);
            console.log(`- مشروع #${p.id}: "${p.title}" - المالك: ${pOwner?.username} (${pOwner?.role})`);
          }
          
          // المشاريع المتاحة للشركات هي جميع المشاريع المنشأة من قبل رواد الأعمال
          // بما أن جميع المشاريع في النظام حالياً منشأة من قبل رواد الأعمال، فسنعرضها كلها للشركات
          projects = allProjects;
          
          console.log(`عدد المشاريع المتاحة للشركة: ${projects.length}`);
        } catch (error) {
          console.error('خطأ أثناء محاولة الحصول على المشاريع للشركة:', error);
          projects = [];
        }
      }
      
      // الحصول على بيانات المستخدم المرتبطة بكل مشروع
      const projectsWithUserData = await Promise.all(
        projects.map(async (project) => {
          const projectUser = await storage.getUser(project.userId);
          return {
            ...project,
            username: projectUser?.username,
            name: projectUser?.name
          };
        })
      );
      
      console.log(`إرسال ${projectsWithUserData.length} مشروع للمستخدم ${user.username}`);
      res.json(projectsWithUserData);
    } catch (error) {
      console.error('خطأ في استرجاع المشاريع:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.get('/api/projects/:id', async (req: Request, res: Response) => {
    try {
      console.log(`طلب تفاصيل المشروع برقم ${req.params.id} - حالة المصادقة: ${req.isAuthenticated() ? 'مصرح' : 'غير مصرح'}`);
      
      // فقط المستخدمين المسجلين يمكنهم مشاهدة تفاصيل المشاريع
      if (!req.isAuthenticated()) {
        console.log(`رفض طلب غير مصرح للوصول إلى تفاصيل المشروع ${req.params.id}`);
        return res.status(401).json({ message: 'Unauthorized access to project details' });
      }
      
      const projectId = parseInt(req.params.id);
      const project = await storage.getProject(projectId);
      
      if (!project) {
        return res.status(404).json({ message: 'Project not found' });
      }
      
      // المستخدم مرتبط بالمشروع، أو مسؤول، أو شركة مصرح لها بمشاهدة المشاريع المتاحة
      const user = req.user as any;
      
      // إذا كان المستخدم غير مسؤول وغير صاحب المشروع وهو ليس شركة
      if (user.role !== 'admin' && project.userId !== user.id && user.role !== 'company') {
        console.log(`رفض وصول غير مصرح: المستخدم ${user.username} حاول الوصول إلى مشروع المستخدم ${project.userId}`);
        return res.status(403).json({ message: 'Forbidden: You are not authorized to view this project' });
      }
      
      // إذا كان المستخدم شركة، تأكد من أن المشروع منشأ من قبل رائد أعمال
      if (user.role === 'company') {
        const projectOwner = await storage.getUser(project.userId);
        if (!projectOwner || projectOwner.role !== 'entrepreneur') {
          console.log(`رفض وصول شركة: المستخدم ${user.username} حاول الوصول إلى مشروع غير منشأ من رائد أعمال`);
          return res.status(403).json({ message: 'Forbidden: This project is not available for companies' });
        }
      }
      
      const projectUser = await storage.getUser(project.userId);
      
      console.log(`تم ارسال تفاصيل المشروع "${project.title}" للمستخدم ${user.username}`);
      res.json({
        ...project,
        username: projectUser?.username,
        name: projectUser?.name
      });
    } catch (error) {
      console.error('خطأ في استرجاع تفاصيل المشروع:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // تغيير حالة المشروع (مفتوح/مغلق) - للمسؤولين أو مالك المشروع
  app.patch('/api/projects/:id/status', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const user = req.user as any;
      const projectId = parseInt(req.params.id);
      const { status } = req.body;
      
      if (status !== 'open' && status !== 'closed') {
        return res.status(400).json({ message: 'الحالة غير صالحة. يجب أن تكون "open" أو "closed".' });
      }
      
      // التحقق من وجود المشروع
      const project = await storage.getProject(projectId);
      if (!project) {
        return res.status(404).json({ message: 'المشروع غير موجود' });
      }
      
      // التحقق من الصلاحيات - فقط المسؤول أو صاحب المشروع يمكنه تغيير الحالة
      if (user.role !== 'admin' && project.userId !== user.id) {
        return res.status(403).json({ message: 'غير مصرح لك بتعديل هذا المشروع' });
      }
      
      // تحديث حالة المشروع
      const updatedProject = await storage.updateProject(projectId, { status });
      
      console.log(`تم تغيير حالة المشروع ${projectId} إلى "${status}" بواسطة المستخدم ${user.username}`);
      res.json(updatedProject);
    } catch (error) {
      console.error('خطأ في تحديث حالة المشروع:', error);
      res.status(500).json({ message: 'خطأ في الخادم' });
    }
  });

  app.get('/api/users/:userId/projects', async (req: Request, res: Response) => {
    try {
      console.log(`طلب مشاريع المستخدم ${req.params.userId} - حالة المصادقة: ${req.isAuthenticated() ? 'مصرح' : 'غير مصرح'}`);
      
      // فقط المستخدمين المسجلين يمكنهم مشاهدة مشاريع المستخدمين
      if (!req.isAuthenticated()) {
        console.log(`رفض طلب غير مصرح للوصول إلى مشاريع المستخدم ${req.params.userId}`);
        return res.json([]); // إرجاع مصفوفة فارغة للمستخدمين غير المسجلين
      }
      
      const userId = parseInt(req.params.userId);
      const user = req.user as any;
      
      // المستخدم يمكنه فقط الوصول إلى مشاريعه الخاصة
      // (المسؤولون يمكنهم الوصول إلى جميع المشاريع)
      if (user.role !== 'admin' && user.id !== userId) {
        console.log(`رفض وصول غير مصرح: المستخدم ${user.username} حاول الوصول إلى مشاريع المستخدم ${userId}`);
        return res.json([]); // إرجاع مصفوفة فارغة للوصول غير المصرح
      }
      
      const projects = await storage.getProjectsByUserId(userId);
      console.log(`تم إرسال ${projects.length} مشروع للمستخدم ${user.username} (مشاريع المستخدم ${userId})`);
      res.json(projects);
    } catch (error) {
      console.error('خطأ في استرجاع مشاريع المستخدم:', error);
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

  // NDA routes - مسارات اتفاقيات عدم الإفصاح
  // إنشاء اتفاقية عدم إفصاح جديدة
  app.post('/api/projects/:projectId/nda', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const user = req.user as any;
      const projectId = parseInt(req.params.projectId);
      
      // التحقق من وجود المشروع
      const project = await storage.getProject(projectId);
      if (!project) {
        return res.status(404).json({ message: 'المشروع غير موجود' });
      }
      
      // تأكد من أن المستخدم هو شركة
      if (user.role !== 'company') {
        return res.status(403).json({ message: 'فقط الشركات يمكنها توقيع اتفاقيات عدم الإفصاح' });
      }
      
      // الحصول على ملف تعريف الشركة
      const companyProfile = await storage.getCompanyProfileByUserId(user.id);
      if (!companyProfile) {
        return res.status(404).json({ message: 'ملف تعريف الشركة غير موجود' });
      }
      
      // إنشاء بيانات اتفاقية عدم الإفصاح - تعيين الحالة مباشرة كـ "active" بدلاً من "pending"
      const ndaData = insertNdaAgreementSchema.parse({
        projectId,
        status: 'active', // تغيير الحالة لتكون سارية فوراً بدون الحاجة لمراجعة
        companySignatureInfo: {
          companyId: companyProfile.id,
          companyName: user.name,
          signerName: req.body.signerName || user.name,
          signerTitle: req.body.signerTitle || 'ممثل الشركة',
          signerIp: req.ip,
          timestamp: new Date().toISOString()
        },
        signedAt: new Date(),
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // تنتهي بعد 30 يوم
      });
      
      // إنشاء اتفاقية عدم الإفصاح
      const nda = await storage.createNdaAgreement(ndaData);
      
      // تحديث المشروع بإضافة علامة تتطلب اتفاقية عدم إفصاح ورقم الاتفاقية
      await storage.updateProject(projectId, {
        requiresNda: true,
        ndaId: nda.id
      });
      
      res.status(201).json(nda);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'خطأ في التحقق من البيانات', errors: error.errors });
      }
      console.error('خطأ في إنشاء اتفاقية عدم الإفصاح:', error);
      res.status(500).json({ message: 'خطأ في الخادم الداخلي' });
    }
  });
  
  // وظيفة إنشاء ملف PDF لاتفاقية عدم الإفصاح
  async function generateNdaPdf(nda: any, project: any, company: any): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      try {
        // وظيفة مساعدة لإعادة تشكيل النص العربي 
        // تقوم بتحويل النص العربي إلى النموذج المناسب لعرضه في ملف PDF
        function reshapeArabicText(text: string): string {
          try {
            // النهج المحسن لمعالجة النص العربي
            
            // 1. إعادة تشكيل النص العربي (دمج الحروف بشكل صحيح)
            const reshaped = arabicReshaper.reshape(text);
            
            // 2. تصحيح اتجاه النص من اليمين إلى اليسار
            const bidiText = bidi.getDisplay(reshaped);
            
            return bidiText;
          } catch (error) {
            console.error('خطأ في تحويل النص العربي:', error);
            return text; // في حالة حدوث خطأ، إرجاع النص الأصلي
          }
        }
      
        const chunks: Buffer[] = [];
        const doc = new PDFDocument({ 
          size: 'A4',
          margin: 50,
          info: {
            Title: `اتفاقية عدم إفصاح - ${project.title}`,
            Author: 'منصة لينكتك',
            Subject: 'اتفاقية عدم إفصاح',
          },
          // إضافة دعم اللغة العربية
          lang: 'ar',
          features: ['rtla']
        });

        // تحديد مسار ملف الخط العربي
        const arabicFontPath = path.join(process.cwd(), 'assets', 'fonts', 'Cairo-Regular.ttf');
        console.log('مسار ملف الخط العربي:', arabicFontPath);
        
        // التحقق من وجود ملف الخط
        const fontExists = fs.existsSync(arabicFontPath);
        console.log('هل يوجد ملف الخط؟', fontExists);
        
        // تسجيل واستخدام الخط العربي
        if (fontExists) {
          try {
            doc.registerFont('Arabic', arabicFontPath);
            doc.font('Arabic');
            console.log('تم تسجيل واستخدام الخط العربي بنجاح');
          } catch (fontError) {
            console.error('خطأ في تسجيل الخط العربي:', fontError);
            console.log('الاستبدال بالخط الافتراضي Helvetica');
            doc.font('Helvetica');
          }
        } else {
          console.log('ملف الخط العربي غير موجود، استخدام الخط الافتراضي Helvetica');
          doc.font('Helvetica');
        }
        
        // تضبيط اتجاه RTL
        doc.text('', 0, 0, { align: 'right' });

        // التقاط البيانات المكتوبة في الملف
        doc.on('data', (chunk) => chunks.push(Buffer.from(chunk)));
        doc.on('end', () => {
          const result = Buffer.concat(chunks);
          resolve(result);
        });
        doc.on('error', (err) => reject(err));

        // تعريف خيارات نص RTL
        const rtlOptions = { 
          align: 'right',
          features: ['rtla']  // تفعيل الكتابة من اليمين لليسار
        };
        
        // إضافة الشعار والعنوان باستخدام معالجة النص العربي محسنة
        // 1. إعادة تشكيل النص العربي مع bidi
        const titleReshaped = arabicReshaper.reshape('اتفاقية عدم إفصاح');
        const titleBidi = bidi.getDisplay(titleReshaped);
        doc.fontSize(22).text(titleBidi, { align: 'center' });
        doc.moveDown();
        
        const projectTitleText = `مشروع: ${project.title}`;
        const projectTitleReshaped = arabicReshaper.reshape(projectTitleText);
        const projectTitleBidi = bidi.getDisplay(projectTitleReshaped);
        doc.fontSize(16).text(projectTitleBidi, { align: 'center' });
        doc.moveDown(2);

        // معلومات الأطراف
        const partiesTitleReshaped = arabicReshaper.reshape('أطراف الاتفاقية:');
        const partiesTitleBidi = bidi.getDisplay(partiesTitleReshaped);
        doc.fontSize(14).text(partiesTitleBidi, { align: 'right', underline: true });
        doc.moveDown();
        
        const firstPartyText = `الطرف الأول (صاحب المشروع): ${project.ownerName || 'غير محدد'}`;
        const firstPartyReshaped = arabicReshaper.reshape(firstPartyText);
        const firstPartyBidi = bidi.getDisplay(firstPartyReshaped);
        doc.fontSize(12).text(firstPartyBidi, { align: 'right' });
        
        // معلومات الشركة
        const companyName = company?.name || nda.companySignatureInfo?.companyName || 'غير محدد';
        const secondPartyText = `الطرف الثاني (الشركة): ${companyName}`;
        const secondPartyReshaped = arabicReshaper.reshape(secondPartyText);
        const secondPartyBidi = bidi.getDisplay(secondPartyReshaped);
        doc.fontSize(12).text(secondPartyBidi, { align: 'right' });
        doc.moveDown();

        // معلومات التوقيع
        if (nda.signedAt) {
          const signDateText = `تم توقيع هذه الاتفاقية بتاريخ: ${new Date(nda.signedAt).toLocaleDateString('ar-SA')}`;
          const signDateReshaped = arabicReshaper.reshape(signDateText);
          const signDateBidi = bidi.getDisplay(signDateReshaped);
          doc.fontSize(12).text(signDateBidi, { align: 'right' });
          
          const signerText = `تم التوقيع بواسطة: ${nda.companySignatureInfo.signerName} (${nda.companySignatureInfo.signerTitle})`;
          const signerReshaped = arabicReshaper.reshape(signerText);
          const signerBidi = bidi.getDisplay(signerReshaped);
          doc.fontSize(12).text(signerBidi, { align: 'right' });
          
          const ipText = `عنوان IP للتوقيع: ${nda.companySignatureInfo.signerIp}`;
          const ipReshaped = arabicReshaper.reshape(ipText);
          const ipBidi = bidi.getDisplay(ipReshaped);
          doc.fontSize(11).text(ipBidi, { align: 'right' });
        }
        doc.moveDown(2);

        // نص الاتفاقية
        const agreementTitleReshaped = arabicReshaper.reshape('نص اتفاقية عدم الإفصاح:');
        const agreementTitleBidi = bidi.getDisplay(agreementTitleReshaped);
        doc.fontSize(14).text(agreementTitleBidi, { align: 'right', underline: true });
        doc.moveDown();
        
        // المقدمة
        const introTitleReshaped = arabicReshaper.reshape("المقدمة:");
        const introTitleBidi = bidi.getDisplay(introTitleReshaped);
        doc.fontSize(12).text(introTitleBidi, { align: 'right', bold: true });
        
        const introTextReshaped = arabicReshaper.reshape("هذه الاتفاقية (\"الاتفاقية\") محررة ومبرمة بتاريخ التوقيع الإلكتروني بين الطرف الأول (صاحب المشروع) والطرف الثاني (الشركة).");
        const introTextBidi = bidi.getDisplay(introTextReshaped);
        doc.fontSize(11).text(introTextBidi, { align: 'right' });
        doc.moveDown();

        // الغرض
        const purposeTitleReshaped = arabicReshaper.reshape("الغرض:");
        const purposeTitleBidi = bidi.getDisplay(purposeTitleReshaped);
        doc.fontSize(12).text(purposeTitleBidi, { align: 'right', bold: true });
        
        const purposeTextReshaped = arabicReshaper.reshape("لغرض تقييم إمكانية التعاون في تنفيذ المشروع المذكور، من الضروري أن يقوم الطرف الأول بالكشف عن معلومات سرية وملكية فكرية للطرف الثاني.");
        const purposeTextBidi = bidi.getDisplay(purposeTextReshaped);
        doc.fontSize(11).text(purposeTextBidi, { align: 'right' });
        doc.moveDown();

        // المعلومات السرية
        const confidentialTitleReshaped = arabicReshaper.reshape("المعلومات السرية:");
        const confidentialTitleBidi = bidi.getDisplay(confidentialTitleReshaped);
        doc.fontSize(12).text(confidentialTitleBidi, { align: 'right', bold: true });
        
        const confidentialTextReshaped = arabicReshaper.reshape("تشمل \"المعلومات السرية\" جميع المعلومات والبيانات المتعلقة بالمشروع بما في ذلك على سبيل المثال لا الحصر: المواصفات التقنية، الوثائق، الرسومات، الخطط، الاستراتيجيات، الأفكار، المنهجيات، التصاميم، الشفرة المصدرية، واجهات المستخدم، أسرار تجارية، وأي معلومات أخرى تتعلق بالمشروع.");
        const confidentialTextBidi = bidi.getDisplay(confidentialTextReshaped);
        doc.fontSize(11).text(confidentialTextBidi, { align: 'right' });
        doc.moveDown();

        // التزامات الطرف المستلم
        const obligationsTitleReshaped = arabicReshaper.reshape("التزامات الطرف الثاني:");
        const obligationsTitleBidi = bidi.getDisplay(obligationsTitleReshaped);
        doc.fontSize(12).text(obligationsTitleBidi, { align: 'right', bold: true });
        
        const obligationsIntroReshaped = arabicReshaper.reshape("يوافق الطرف الثاني على:");
        const obligationsIntroBidi = bidi.getDisplay(obligationsIntroReshaped);
        doc.fontSize(11).text(obligationsIntroBidi, { align: 'right' });
        
        const obligations = [
          "الحفاظ على سرية جميع المعلومات السرية وعدم الكشف عنها لأي طرف ثالث.",
          "استخدام المعلومات السرية فقط لغرض تقييم إمكانية التعاون في تنفيذ المشروع.",
          "عدم نسخ أو تصوير أو تخزين أي من المعلومات السرية إلا بقدر ما هو ضروري لتحقيق الغرض من هذه الاتفاقية.",
          "اتخاذ جميع الإجراءات المعقولة للحفاظ على سرية المعلومات السرية بنفس مستوى العناية الذي يستخدمه لحماية معلوماته السرية الخاصة.",
          "إبلاغ الطرف الأول فوراً في حالة علمه بأي استخدام أو كشف غير مصرح به للمعلومات السرية."
        ];
        
        obligations.forEach((obligation, index) => {
          const obligationText = `${index + 1}. ${obligation}`;
          const obligationReshaped = arabicReshaper.reshape(obligationText);
          const obligationBidi = bidi.getDisplay(obligationReshaped);
          doc.fontSize(11).text(obligationBidi, { align: 'right' });
        });
        doc.moveDown();

        // مدة الاتفاقية
        const durationTitleReshaped = arabicReshaper.reshape("مدة الاتفاقية:");
        const durationTitleBidi = bidi.getDisplay(durationTitleReshaped);
        doc.fontSize(12).text(durationTitleBidi, { align: 'right', bold: true });
        
        const durationTextReshaped = arabicReshaper.reshape("تبقى هذه الاتفاقية سارية المفعول لمدة سنتين (2) من تاريخ توقيعها.");
        const durationTextBidi = bidi.getDisplay(durationTextReshaped);
        doc.fontSize(11).text(durationTextBidi, { align: 'right' });
        doc.moveDown();

        // القانون الحاكم
        const lawTitleReshaped = arabicReshaper.reshape("القانون الحاكم:");
        const lawTitleBidi = bidi.getDisplay(lawTitleReshaped);
        doc.fontSize(12).text(lawTitleBidi, { align: 'right', bold: true });
        
        const lawTextReshaped = arabicReshaper.reshape("تخضع هذه الاتفاقية وتفسر وفقاً لقوانين المملكة العربية السعودية.");
        const lawTextBidi = bidi.getDisplay(lawTextReshaped);
        doc.fontSize(11).text(lawTextBidi, { align: 'right' });
        doc.moveDown();

        // توقيع إلكتروني
        const signTitleReshaped = arabicReshaper.reshape("توقيع إلكتروني:");
        const signTitleBidi = bidi.getDisplay(signTitleReshaped);
        doc.fontSize(12).text(signTitleBidi, { align: 'right', bold: true });
        
        const signTextReshaped = arabicReshaper.reshape("يقر الطرفان بأن هذه الاتفاقية قد تم توقيعها إلكترونياً وأن هذا التوقيع الإلكتروني له نفس الأثر القانوني كالتوقيع اليدوي.");
        const signTextBidi = bidi.getDisplay(signTextReshaped);
        doc.fontSize(11).text(signTextBidi, { align: 'right' });
        doc.moveDown(2);

        // مكان للتوقيعات
        const signaturesTitleReshaped = arabicReshaper.reshape("التوقيعات:");
        const signaturesTitleBidi = bidi.getDisplay(signaturesTitleReshaped);
        doc.fontSize(12).text(signaturesTitleBidi, { align: 'right', underline: true });
        doc.moveDown();
        
        const firstPartySignReshaped = arabicReshaper.reshape("الطرف الأول (صاحب المشروع):");
        const firstPartySignBidi = bidi.getDisplay(firstPartySignReshaped);
        doc.fontSize(11).text(firstPartySignBidi, { align: 'right' });
        doc.moveDown();
        
        const nameFieldReshaped = arabicReshaper.reshape("الاسم: ___________________");
        const nameFieldBidi = bidi.getDisplay(nameFieldReshaped);
        doc.fontSize(11).text(nameFieldBidi, { align: 'right' });
        
        const dateFieldReshaped = arabicReshaper.reshape("التاريخ: ___________________");
        const dateFieldBidi = bidi.getDisplay(dateFieldReshaped);
        doc.fontSize(11).text(dateFieldBidi, { align: 'right' });
        doc.moveDown();
        
        const secondPartySignReshaped = arabicReshaper.reshape("الطرف الثاني (الشركة):");
        const secondPartySignBidi = bidi.getDisplay(secondPartySignReshaped);
        doc.fontSize(11).text(secondPartySignBidi, { align: 'right' });
        doc.moveDown();
        
        const companyNameTextReshaped = arabicReshaper.reshape(`الاسم: ${nda.companySignatureInfo?.signerName || '___________________'}`);
        const companyNameTextBidi = bidi.getDisplay(companyNameTextReshaped);
        doc.fontSize(11).text(companyNameTextBidi, { align: 'right' });
        
        const dateTextReshaped = arabicReshaper.reshape(`التاريخ: ${nda.signedAt ? new Date(nda.signedAt).toLocaleDateString('ar-SA') : '___________________'}`);
        const dateTextBidi = bidi.getDisplay(dateTextReshaped);
        doc.fontSize(11).text(dateTextBidi, { align: 'right' });
        
        // إضافة الرقم التسلسلي والصفحات
        const totalPages = doc.bufferedPageRange().count;
        for (let i = 0; i < totalPages; i++) {
          doc.switchToPage(i);
          
          const footerTextReshaped = arabicReshaper.reshape(
            `منصة لينكتك - اتفاقية عدم إفصاح - رقم الاتفاقية: ${nda.id} - الصفحة ${i + 1} من ${totalPages}`
          );
          const footerTextBidi = bidi.getDisplay(footerTextReshaped);
          
          doc.fontSize(8).text(
            footerTextBidi,
            50,
            doc.page.height - 50,
            { align: 'center' }
          );
        }

        // إنهاء الملف
        doc.end();
      } catch (error) {
        reject(error);
      }
    });
  }

  // الحصول على اتفاقية عدم إفصاح محددة بواسطة المعرف
  app.get('/api/nda/:id', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const ndaId = parseInt(req.params.id);
      const nda = await storage.getNdaAgreement(ndaId);
      
      if (!nda) {
        return res.status(404).json({ message: 'اتفاقية عدم الإفصاح غير موجودة' });
      }
      
      // التحقق من صلاحية الوصول - فقط صاحب المشروع أو الشركة الموقعة أو المسؤول
      const user = req.user as any;
      const project = await storage.getProject(nda.projectId);
      
      if (!project) {
        return res.status(404).json({ message: 'المشروع غير موجود' });
      }
      
      const companyProfile = await storage.getCompanyProfileByUserId(user.id);
      const isCompanySigner = companyProfile && 
        typeof nda.companySignatureInfo === 'object' && 
        'companyId' in nda.companySignatureInfo && 
        nda.companySignatureInfo.companyId === companyProfile.id;
      
      if (user.role === 'admin' || project.userId === user.id || isCompanySigner) {
        return res.json(nda);
      }
      
      res.status(403).json({ message: 'غير مصرح بالوصول إلى هذه الاتفاقية' });
    } catch (error) {
      console.error('خطأ في استرجاع اتفاقية عدم الإفصاح:', error);
      res.status(500).json({ message: 'خطأ في الخادم الداخلي' });
    }
  });
  
  // تنزيل اتفاقية عدم الإفصاح بصيغة PDF
  // لاحظ: لا نستخدم isAuthenticated هنا بل سنتحقق يدويًا لتسهيل التنزيل
  app.get('/api/nda/:id/download-pdf', async (req: Request, res: Response) => {
    // التحقق من المصادقة - يدويًا بدون middleware
    if (!req.isAuthenticated()) {
      console.log('محاولة تنزيل PDF بدون مصادقة، sessionID:', req.sessionID);
      // في حالة الطلب عبر iframe أو مباشر، نستخدم إعادة التوجيه بدلاً من الخطأ
      if (req.query.t) {
        console.log('الطلب من iframe أو window.open، إعادة توجيه إلى صفحة تسجيل الدخول');
        return res.redirect('/auth');
      } else {
        return res.status(401).json({ message: 'يرجى تسجيل الدخول أولاً' });
      }
    }
    
    console.log('محاولة تنزيل PDF من المستخدم:', (req.user as any).username, 'sessionID:', req.sessionID);
    
    try {
      const ndaId = parseInt(req.params.id);
      const nda = await storage.getNdaAgreement(ndaId);
      
      if (!nda) {
        return res.status(404).json({ message: 'اتفاقية عدم الإفصاح غير موجودة' });
      }
      
      // التحقق من صلاحية الوصول - فقط صاحب المشروع أو الشركة الموقعة أو المسؤول
      const user = req.user as any;
      const project = await storage.getProject(nda.projectId);
      
      if (!project) {
        return res.status(404).json({ message: 'المشروع غير موجود' });
      }
      
      // التحقق من صلاحية الوصول
      const isProjectOwner = project.userId === user.id;
      const isAdmin = user.role === 'admin';
      const isCompanySigner = nda.companyId === user.id;
      
      if (!isProjectOwner && !isAdmin && !isCompanySigner) {
        return res.status(403).json({ message: 'غير مصرح لك بالوصول إلى هذه الاتفاقية' });
      }
      
      // الحصول على معلومات الشركة إذا كانت متاحة
      let company = null;
      if (nda.companyId) {
        company = await storage.getCompanyProfile(nda.companyId);
      }
      
      // تعيين رؤوس الاستجابة وإرسال الملف
      const fileName = encodeURIComponent(`اتفاقية-عدم-إفصاح-${ndaId}.pdf`);
      
      // تعيين رؤوس CORS لدعم طلبات iframe
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
      res.setHeader('Access-Control-Allow-Credentials', 'true');
      
      // تعيين رؤوس المحتوى
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
      
      // تحديد بعض المعلومات
      // استخراج معلومات الشركة
      const companyInfo = nda.companySignatureInfo ? nda.companySignatureInfo : {};
      const companyNameStr = company ? (company.name || 'غير محدد') : 
                            (companyInfo && typeof companyInfo === 'object' && 'companyName' in companyInfo ? 
                             companyInfo.companyName : 'غير محدد');
      
      // استخراج اسم صاحب المشروع
      const projectOwner = project.userId ? (await storage.getUser(project.userId))?.name || 'غير محدد' : 'غير محدد';
      
      // استخدام PDFKit بدلاً من Puppeteer
      console.log('استخدام PDFKit لإنشاء ملف PDF');
      
      // تحديد مسار القالب باستخدام المسار المطلق
      const currentDir = process.cwd(); // الحصول على المسار الحالي
      
      const templatePath = path.join(currentDir, 'server', 'templates', 'nda-template.html');
      console.log('مسار قالب الاتفاقية:', templatePath);
      
      // التحقق من وجود ملف القالب
      const templateExists = await fsExtra.pathExists(templatePath);
      console.log('هل يوجد ملف القالب؟', templateExists);
      
      // إذا لم يكن موجوداً، نستخدم قالب مضمن بدلاً من قراءة الملف
      let templateHtml = '';
      
      if (templateExists) {
        templateHtml = await fsExtra.readFile(templatePath, 'utf8');
        console.log('تم قراءة القالب من الملف');
      } else {
        console.log('القالب غير موجود، استخدام قالب مضمن');
        templateHtml = `
        <!DOCTYPE html>
        <html lang="ar" dir="rtl">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>اتفاقية عدم الإفصاح</title>
          <style>
            body { font-family: Arial, sans-serif; direction: rtl; padding: 20px; }
            .header { text-align: center; margin-bottom: 30px; }
            .section { margin-bottom: 20px; }
            .footer { margin-top: 50px; text-align: center; font-size: 12px; }
            .signature { margin-top: 40px; border-top: 1px solid #ccc; padding-top: 20px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>اتفاقية عدم الإفصاح</h1>
            <h2>{{PROJECT_TITLE}}</h2>
          </div>
          <div class="section">
            <p><strong>صاحب المشروع:</strong> {{PROJECT_OWNER_NAME}}</p>
            <p><strong>الشركة:</strong> {{COMPANY_NAME}}</p>
            <p><strong>التاريخ:</strong> {{CURRENT_DATE}}</p>
          </div>
          <div class="section">
            <h3>نص الاتفاقية:</h3>
            <p>يتعهد الطرف الثاني (الشركة) بالحفاظ على سرية المعلومات المتعلقة بالمشروع وعدم الإفصاح عنها لأي طرف ثالث.</p>
            <p>تسري هذه الاتفاقية لمدة سنتين من تاريخ توقيعها.</p>
          </div>
          <div class="signature">
            <p>{{SIGNATURE_STATUS}}</p>
            {{SIGNATURE_INFO}}
          </div>
          <div class="footer">
            <p>منصة لينكتك &copy; 2025 | {{GENERATION_DATE}}</p>
          </div>
        </body>
        </html>
        `;
      }
      
      // تاريخ اليوم بالتنسيق العربي
      const arabicDate = new Date().toLocaleDateString('ar-SA');
      const generationTime = new Date().toLocaleString('ar-SA');
      
      // إعداد معلومات التوقيع
      let signatureStatus = 'الحالة: لم يتم التوقيع بعد. هذه نسخة مسودة فقط.';
      let signatureInfo = '';
      
      if (nda.signedAt) {
        const companySignInfo = nda.companySignatureInfo as any || {};
        const signerName = typeof companySignInfo === 'object' && companySignInfo.signerName ? companySignInfo.signerName : 'غير محدد';
        const signerTitle = typeof companySignInfo === 'object' && companySignInfo.signerTitle ? companySignInfo.signerTitle : 'غير محدد';
        const signedDate = new Date(nda.signedAt).toLocaleDateString('ar-SA');
        
        signatureStatus = 'الحالة: تم التوقيع';
        signatureInfo = `
          <div class="signature-info">تم التوقيع بواسطة: ${signerName}</div>
          <div class="signature-info">المنصب: ${signerTitle}</div>
          <div class="signature-info">التاريخ: ${signedDate}</div>
        `;
      }
      
      // استبدال القيم في القالب
      templateHtml = templateHtml
        .replace('{{PROJECT_TITLE}}', project.title)
        .replace('{{PROJECT_OWNER_NAME}}', projectOwner)
        .replace('{{COMPANY_NAME}}', companyNameStr)
        .replace('{{CURRENT_DATE}}', arabicDate)
        .replace('{{SIGNATURE_STATUS}}', signatureStatus)
        .replace('{{SIGNATURE_INFO}}', signatureInfo)
        .replace('{{GENERATION_DATE}}', generationTime);
      
      // استخدام PDFKit بدلاً من Puppeteer
      console.log('استخدام PDFKit لإنشاء ملف PDF بدلاً من Puppeteer');
      
      // وظيفة مساعدة لإعادة تشكيل النص العربي 
      // تقوم بتحويل النص العربي إلى النموذج المناسب لعرضه في ملف PDF
      function reshapeArabicText(text: string): string {
        try {
          // النهج المحسن لمعالجة النص العربي
          
          // 1. إعادة تشكيل النص العربي (دمج الحروف بشكل صحيح)
          const reshaped = arabicReshaper.reshape(text);
          
          // 2. تصحيح اتجاه النص من اليمين إلى اليسار
          const bidiText = bidi.getDisplay(reshaped);
          
          return bidiText;
        } catch (error) {
          console.error('خطأ في تحويل النص العربي:', error);
          return text; // في حالة حدوث خطأ، إرجاع النص الأصلي
        }
      }
      
      // إضافة مسار الخط العربي المطلق
      const arabicFontPath = path.join(process.cwd(), 'assets', 'fonts', 'Cairo-Regular.ttf');
      
      // إنشاء وثيقة PDF جديدة مع دعم اللغة العربية
      const doc = new PDFDocument({
        size: 'A4',
        margin: 50,
        autoFirstPage: true,
        bufferPages: true,
        layout: 'portrait',
        info: {
          Title: `اتفاقية عدم إفصاح - NDA`,
          Author: 'منصة لينكتك',
          Subject: 'اتفاقية عدم إفصاح',
        }
      });
      
      // تسجيل الخط العربي
      doc.registerFont('Arabic', arabicFontPath);
      
      // استخدام الخط العربي
      doc.font('Arabic');
      
      // إنشاء stream للحصول على البايتات
      const chunks: Buffer[] = [];
      doc.on('data', (chunk) => chunks.push(Buffer.from(chunk)));
      
      // وعد يتم تنفيذه عند اكتمال المستند
      const pdfPromise = new Promise<Buffer>((resolve, reject) => {
        doc.on('end', () => {
          const pdfBuffer = Buffer.concat(chunks);
          resolve(pdfBuffer);
        });
        doc.on('error', reject);
      });
      
      // إضافة عنوان المستند
      doc.fontSize(22).text(reshapeArabicText('اتفاقية عدم الإفصاح'), { 
        align: 'center',
        direction: 'rtl' // استخدام اتجاه من اليمين إلى اليسار
      });
      doc.moveDown();
      
      // إضافة عنوان المشروع
      const projectTitle = reshapeArabicText(`المشروع: ${project.title}`);
      doc.fontSize(16).text(projectTitle, { 
        align: 'center',
        direction: 'rtl'
      });
      doc.moveDown(2);
      
      // معلومات الأطراف
      const partiesTitle = reshapeArabicText('أطراف الاتفاقية:');
      doc.fontSize(14).text(partiesTitle, { 
        align: 'right', 
        underline: true,
        direction: 'rtl'
      });
      doc.moveDown();
      
      const firstPartyText = reshapeArabicText(`الطرف الأول (صاحب المشروع): ${projectOwner}`);
      doc.fontSize(12).text(firstPartyText, { align: 'right', direction: 'rtl' });
      doc.moveDown();
      
      const secondPartyText = reshapeArabicText(`الطرف الثاني (الشركة): ${companyNameStr}`);
      doc.fontSize(12).text(secondPartyText, { align: 'right', direction: 'rtl' });
      doc.moveDown(2);
      
      // محتوى الاتفاقية
      const termsTitle = reshapeArabicText('بنود الاتفاقية:');
      doc.fontSize(14).text(termsTitle, { align: 'right', underline: true, direction: 'rtl' });
      doc.moveDown();
      
      const term1 = reshapeArabicText('١. يلتزم الطرف الثاني بالحفاظ على سرية جميع المعلومات والبيانات المتعلقة بالمشروع المذكور أعلاه، وعدم الإفصاح عنها لأي طرف ثالث دون موافقة خطية مسبقة من الطرف الأول.');
      doc.fontSize(11).text(term1, { align: 'right', direction: 'rtl' });
      doc.moveDown();
      
      const term2 = reshapeArabicText('٢. تشمل المعلومات السرية على سبيل المثال لا الحصر: خطط العمل، التصاميم، الرسومات، البرمجيات، الأفكار، المفاهيم، والتفاصيل التقنية والتجارية.');
      doc.fontSize(11).text(term2, { align: 'right', direction: 'rtl' });
      doc.moveDown();
      
      const term3 = reshapeArabicText('٣. تستمر التزامات السرية لمدة سنتين من تاريخ توقيع هذه الاتفاقية.');
      doc.fontSize(11).text(term3, { align: 'right', direction: 'rtl' });
      doc.moveDown(2);
      
      // معلومات التوقيع
      const signatureTitle = reshapeArabicText('حالة التوقيع:');
      doc.fontSize(14).text(signatureTitle, { align: 'right', underline: true, direction: 'rtl' });
      doc.moveDown();
      
      if (nda.status === 'signed' && nda.signedAt) {
        const signDateStr = new Date(nda.signedAt).toLocaleDateString('ar-SA');
        const signedText = reshapeArabicText(`تم توقيع هذه الاتفاقية بتاريخ: ${signDateStr}`);
        doc.fontSize(12).text(signedText, { align: 'right', direction: 'rtl' });
        
        const signerInfo = nda.companySignatureInfo as any || {};
        if (signerInfo.signerName) {
          const signerNameText = reshapeArabicText(`تم التوقيع بواسطة: ${signerInfo.signerName}`);
          doc.fontSize(12).text(signerNameText, { align: 'right', direction: 'rtl' });
        }
        if (signerInfo.signerTitle) {
          const signerTitleText = reshapeArabicText(`المنصب: ${signerInfo.signerTitle}`);
          doc.fontSize(12).text(signerTitleText, { align: 'right', direction: 'rtl' });
        }
      } else {
        const draftText = reshapeArabicText('حالة الاتفاقية: مسودة (غير موقعة)');
        doc.fontSize(12).text(draftText, { align: 'right', direction: 'rtl' });
      }
      
      doc.moveDown(2);
      
      // تذييل الصفحة
      const todayDate = new Date().toLocaleDateString('ar-SA');
      const footerText = reshapeArabicText(`تم إنشاء هذا المستند بواسطة منصة لينكتك - ${todayDate}`);
      doc.fontSize(10).text(footerText, { align: 'center', direction: 'rtl' });
      
      // إنهاء المستند
      doc.end();
      
      // انتظار اكتمال إنشاء المستند
      const pdfBuffer = await pdfPromise;
      
      // إرسال الملف مباشرة في الاستجابة
      res.contentType('application/pdf');
      res.send(pdfBuffer);
      
    } catch (error) {
      console.error('خطأ في إنشاء ملف PDF للاتفاقية:', error);
      res.status(500).json({ message: 'خطأ في إنشاء ملف PDF للاتفاقية' });
    }
  });
  
  // الحصول على جميع اتفاقيات عدم الإفصاح لمشروع محدد
  app.get('/api/projects/:projectId/nda', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const projectId = parseInt(req.params.projectId);
      const project = await storage.getProject(projectId);
      
      if (!project) {
        return res.status(404).json({ message: 'المشروع غير موجود' });
      }
      
      // التحقق من صلاحية الوصول - فقط صاحب المشروع أو المسؤول
      const user = req.user as any;
      
      if (user.role !== 'admin' && project.userId !== user.id) {
        return res.status(403).json({ message: 'غير مصرح بالوصول إلى اتفاقيات عدم الإفصاح لهذا المشروع' });
      }
      
      // الحصول على اتفاقية عدم الإفصاح الخاصة بالمشروع
      const ndaAgreement = await storage.getNdaAgreementByProjectId(projectId);
      
      // إذا وجدت اتفاقية، نرسلها كمصفوفة تحتوي على عنصر واحد
      // إذا لم توجد، نرسل مصفوفة فارغة
      const ndaAgreements = ndaAgreement ? [ndaAgreement] : [];
      res.json(ndaAgreements);
    } catch (error) {
      console.error('خطأ في استرجاع اتفاقيات عدم الإفصاح للمشروع:', error);
      res.status(500).json({ message: 'خطأ في الخادم الداخلي' });
    }
  });
  
  // تحديث حالة اتفاقية عدم إفصاح (لتغيير الحالة، تحميل ملف PDF، إلخ)
  app.patch('/api/nda/:id', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const ndaId = parseInt(req.params.id);
      const nda = await storage.getNdaAgreement(ndaId);
      
      if (!nda) {
        return res.status(404).json({ message: 'اتفاقية عدم الإفصاح غير موجودة' });
      }
      
      // التحقق من صلاحية الوصول - فقط المسؤول يمكنه تحديث الاتفاقية
      const user = req.user as any;
      
      if (user.role !== 'admin') {
        return res.status(403).json({ message: 'فقط المسؤولون يمكنهم تحديث اتفاقيات عدم الإفصاح' });
      }
      
      // تحديث حالة اتفاقية عدم الإفصاح
      if (req.body.status) {
        const updatedNda = await storage.updateNdaAgreementStatus(ndaId, req.body.status);
        return res.json(updatedNda);
      }
      
      // تحديث رابط ملف PDF
      if (req.body.pdfUrl) {
        const updatedNda = await storage.setNdaPdfUrl(ndaId, req.body.pdfUrl);
        return res.json(updatedNda);
      }
      
      res.status(400).json({ message: 'لم يتم تحديد حقول للتحديث (status أو pdfUrl)' });
    } catch (error) {
      console.error('خطأ في تحديث اتفاقية عدم الإفصاح:', error);
      res.status(500).json({ message: 'خطأ في الخادم الداخلي' });
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
      const otherUserId = parseInt(req.params.userId); // معرف المستخدم الآخر في المحادثة
      const projectId = req.query.projectId ? parseInt(req.query.projectId as string) : undefined;
      
      console.log(`طلب المحادثة مع المستخدم: ${otherUserId} من المستخدم: ${user.id}, بخصوص المشروع: ${projectId || 'غير محدد'}`);
      
      // إذا كان المستخدم مسؤول، اسمح له بعرض أي محادثة
      if (user.role === 'admin') {
        // إذا تم تحديد معرفين مختلفين من قبل المسؤول
        const adminRequestedOtherUserId = req.query.otherUserId ? parseInt(req.query.otherUserId as string) : undefined;
        if (adminRequestedOtherUserId) {
          console.log(`طلب المسؤول لعرض المحادثة بين المستخدمين: ${otherUserId} و ${adminRequestedOtherUserId}`);
          const messages = await storage.getConversation(otherUserId, adminRequestedOtherUserId, projectId);
          return res.json(messages);
        }
      }
      
      // الحصول على المحادثة بين المستخدم الحالي والمستخدم الآخر
      const messages = await storage.getConversation(user.id, otherUserId, projectId);
      
      // لوغ عدد الرسائل المسترجعة
      console.log(`تم استرجاع ${messages.length} رسالة في المحادثة بين ${user.id} و ${otherUserId}`);
      
      // إضافة معلومات المستخدمين إلى الرسائل
      const messagesWithUserDetails = await Promise.all(
        messages.map(async (message) => {
          const fromUser = await storage.getUser(message.fromUserId);
          const toUser = await storage.getUser(message.toUserId);
          
          return {
            ...message,
            fromUser: fromUser ? {
              name: fromUser.name || fromUser.username,
              avatar: fromUser.avatar || null
            } : null,
            toUser: toUser ? {
              name: toUser.name || toUser.username,
              avatar: toUser.avatar || null
            } : null
          };
        })
      );
      
      res.json(messagesWithUserDetails);
    } catch (error) {
      console.error('خطأ في الحصول على المحادثة:', error);
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
      console.log(`طلب المشاريع الرائجة - حالة المصادقة: ${req.isAuthenticated() ? 'مصرح' : 'غير مصرح'}`);
      
      // تم تعديل الشروط للسماح بعرض المشاريع الرائجة في الواجهة العامة
      // لا نحتاج للتحقق من تسجيل الدخول لهذا المسار لأنه يستخدم في الصفحة الرئيسية
      
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 5;
      
      const trendingProjects = await getTrendingProjects(limit);
      
      // التعامل مع المستخدمين المسجلين
      if (req.isAuthenticated()) {
        const user = req.user as any;
        console.log(`جلب المشاريع الرائجة للمستخدم ${user.username} (الدور: ${user.role})`);
        
        // المسؤولون يمكنهم مشاهدة جميع المشاريع الرائجة
        // المستخدمون العاديون يمكنهم مشاهدة مشاريعهم الرائجة فقط
        // الشركات يمكنها مشاهدة المشاريع الرائجة المتاحة
        let filteredProjects = trendingProjects;
        
        if (user.role === 'entrepreneur') {
          // رواد الأعمال يشاهدون فقط مشاريعهم الرائجة
          filteredProjects = trendingProjects.filter(project => project.userId === user.id);
        }
        
        console.log(`إرسال ${filteredProjects.length} مشروع رائج للمستخدم ${user.username}`);
        return res.json(filteredProjects);
      } else {
        // للزوار والمستخدمين غير المسجلين - إظهار كافة المشاريع الرائجة العامة
        console.log(`إرسال ${trendingProjects.length} مشروع رائج للزائر غير المسجل`);
        return res.json(trendingProjects);
      }
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
      
      // حساب قيمة العربون (2.5% من قيمة العرض)
      const amount = parseInt(offer.amount.replace(/[^0-9]/g, ''));
      const depositAmount = Math.round(amount * 0.025).toString();
      
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
      
      // إرسال إشعار بتحديث العرض عبر WebSocket
      if (company && companyUser) {
        // إشعار صاحب المشروع
        const projectOwnerConnections = clients.get(project.userId);
        if (projectOwnerConnections) {
          const notification = JSON.stringify({
            type: "offer_updated",
            offerId: offerId,
            message: "تم تحديث العرض وكشف معلومات الشركة بعد دفع العربون"
          });
          
          projectOwnerConnections.forEach(client => {
            if (client.readyState === OPEN) {
              client.send(notification);
            }
          });
        }
        
        // إشعار الشركة
        const companyConnections = clients.get(companyUser.id);
        if (companyConnections) {
          const notification = JSON.stringify({
            type: "offer_accepted_paid",
            offerId: offerId,
            projectId: project.id,
            message: `تم قبول عرضك على المشروع "${project.title}" ودفع العربون`
          });
          
          companyConnections.forEach(client => {
            if (client.readyState === OPEN) {
              client.send(notification);
            }
          });
        }
      }
      
      // إرجاع معلومات العرض المحدثة
      res.json({
        success: true,
        offer: revealedOffer,
        companyContact: companyUser ? {
          name: companyUser.name,
          email: companyUser.email,
          username: companyUser.username
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
  
  // Newsletter subscription
  app.post('/api/newsletter/subscribe', async (req: Request, res: Response) => {
    try {
      const { email, name } = req.body;
      
      if (!email) {
        return res.status(400).json({ message: 'البريد الإلكتروني مطلوب' });
      }
      
      // التحقق مما إذا كان البريد الإلكتروني موجودًا بالفعل
      const existingSubscriber = await storage.getNewsletterSubscriberByEmail(email);
      
      if (existingSubscriber) {
        // إذا كان مشترك بالفعل ولكن قد ألغى اشتراكه سابقًا
        if (!existingSubscriber.subscribed) {
          await storage.updateNewsletterSubscriber(existingSubscriber.id, { subscribed: true });
          return res.status(200).json({ message: 'تم إعادة الاشتراك بنجاح' });
        }
        // إذا كان مشترك بالفعل
        return res.status(200).json({ message: 'أنت مشترك بالفعل في القائمة البريدية' });
      }
      
      // إنشاء اشتراك جديد
      const subscriberData = insertNewsletterSubscriberSchema.parse({
        email,
        name: name || null,
        subscribed: true
      });
      
      await storage.createNewsletterSubscriber(subscriberData);
      
      // تسجيل نجاح الاشتراك في السجل
      console.log(`تم اشتراك البريد الإلكتروني ${email} في النشرة البريدية`);
      
      res.status(201).json({ message: 'تم الاشتراك بنجاح' });
    } catch (error) {
      console.error('خطأ في الاشتراك بالنشرة البريدية:', error);
      
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'بيانات غير صالحة', errors: error.errors });
      }
      
      res.status(500).json({ message: 'حدث خطأ أثناء الاشتراك' });
    }
  });
  
  // Newsletter unsubscribe
  app.post('/api/newsletter/unsubscribe', async (req: Request, res: Response) => {
    try {
      const { email } = req.body;
      
      if (!email) {
        return res.status(400).json({ message: 'البريد الإلكتروني مطلوب' });
      }
      
      // التحقق مما إذا كان البريد الإلكتروني موجودًا
      const subscriber = await storage.getNewsletterSubscriberByEmail(email);
      
      if (!subscriber) {
        return res.status(404).json({ message: 'البريد الإلكتروني غير مشترك في القائمة البريدية' });
      }
      
      // تحديث حالة الاشتراك
      await storage.updateNewsletterSubscriber(subscriber.id, { subscribed: false });
      
      res.status(200).json({ message: 'تم إلغاء الاشتراك بنجاح' });
    } catch (error) {
      console.error('خطأ في إلغاء الاشتراك من النشرة البريدية:', error);
      res.status(500).json({ message: 'حدث خطأ أثناء إلغاء الاشتراك' });
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
  const OPEN = WebSocket.OPEN; // تعريف ثابت الاتصال المفتوح
  
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
        
        // حالة تحديث قراءة الرسالة
        if (data.type === 'read_messages' && userId) {
          console.log(`تحديث حالة قراءة الرسائل للمستخدم ${userId}, المرسل: ${data.fromUserId}`);
          
          try {
            if (data.messageIds && Array.isArray(data.messageIds) && data.messageIds.length > 0) {
              // تحديث حالة قراءة عدة رسائل محددة
              const updatedMessages = await Promise.all(
                data.messageIds.map(id => storage.markMessageAsRead(id))
              );
              
              console.log(`تم تحديث ${updatedMessages.filter(Boolean).length} رسالة كمقروءة`);
              
              // إعلام المرسل بأن رسائله قد تمت قراءتها
              if (data.fromUserId && clients.has(data.fromUserId)) {
                const recipientClients = clients.get(data.fromUserId) || [];
                
                for (const client of recipientClients) {
                  if (client.readyState === 1) { // WebSocket.OPEN = 1
                    client.send(JSON.stringify({
                      type: 'messages_read',
                      messageIds: data.messageIds,
                      readByUserId: userId
                    }));
                  }
                }
              }
            } else if (data.fromUserId) {
              // تحديث جميع الرسائل غير المقروءة من مرسل معين
              const updatedCount = await storage.markAllMessagesAsRead(data.fromUserId, userId);
              
              console.log(`تم تحديث ${updatedCount} رسالة كمقروءة من المستخدم ${data.fromUserId}`);
              
              // إعلام المرسل بأن جميع رسائله قد تمت قراءتها
              if (clients.has(data.fromUserId)) {
                const recipientClients = clients.get(data.fromUserId) || [];
                
                for (const client of recipientClients) {
                  if (client.readyState === 1) { // WebSocket.OPEN = 1
                    client.send(JSON.stringify({
                      type: 'all_messages_read',
                      readByUserId: userId
                    }));
                  }
                }
              }
            }
            
            // إرسال تأكيد للمستخدم الذي قام بتحديث حالة القراءة
            ws.send(JSON.stringify({
              type: 'read_confirmation',
              success: true
            }));
          } catch (error) {
            console.error('خطأ في تحديث حالة قراءة الرسائل:', error);
            ws.send(JSON.stringify({
              type: 'read_confirmation',
              success: false,
              error: 'حدث خطأ أثناء تحديث حالة قراءة الرسائل'
            }));
          }
        }
        
        // إذا كانت رسالة دردشة جديدة
        else if (data.type === 'message' && userId && typeof data.toUserId === 'number') {
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
          
          // التعرف على رسائل العميل ذات المعرف المؤقت
          const clientMessageId = data.tempMessageId || null;
          
          // إرسال الرسالة للمستخدم المستقبل إذا كان متصلاً
          let deliveryStatus = 'pending';
          let deliveryAttempts = 0;
          const maxAttempts = 5; // زيادة عدد المحاولات من 3 إلى 5
          
          const attemptDelivery = async () => {
            deliveryAttempts++;
            
            if (clients.has(data.toUserId)) {
              const recipientClients = clients.get(data.toUserId) || [];
              // الحصول على معلومات المرسل لإضافتها إلى الإشعار
              const sender = await storage.getUser(userId);
              const senderName = sender ? sender.name : undefined;
              
              const messageData = {
                type: 'new_message',
                message: {
                  ...message,
                  senderName  // إضافة اسم المرسل إلى الرسالة
                }
              };
              
              let deliveredToAtLeastOne = false;
              
              // إرسال الرسالة لجميع اتصالات المستخدم المستقبل
              for (const client of recipientClients) {
                if (client.readyState === 1) { // WebSocket.OPEN = 1
                  try {
                    client.send(JSON.stringify(messageData));
                    deliveredToAtLeastOne = true;
                  } catch (error) {
                    console.error(`فشل إرسال الرسالة للمستقبل ${data.toUserId}:`, error);
                  }
                }
              }
              
              if (deliveredToAtLeastOne) {
                deliveryStatus = 'delivered';
                // تسجيل حالة التسليم في قاعدة البيانات
                await storage.updateMessageDeliveryStatus(message.id, 'delivered');
                
                // إبلاغ المرسل بنجاح تسليم الرسالة
                try {
                  if (clients.has(userId)) {
                    const senderClients = clients.get(userId) || [];
                    for (const client of senderClients) {
                      if (client.readyState === WebSocket.OPEN) {
                        client.send(JSON.stringify({
                          type: 'message_delivered',
                          messageId: message.id,
                          tempMessageId: clientMessageId
                        }));
                      }
                    }
                  }
                } catch (error) {
                  console.error('خطأ في إرسال إشعار نجاح التسليم للمرسل:', error);
                }
                
                return true;
              }
            }
            
            // إذا وصلنا هنا، فإن الرسالة لم يتم تسليمها
            if (deliveryAttempts < maxAttempts) {
              // جدولة محاولة أخرى بعد فترة زمنية
              console.log(`محاولة إرسال الرسالة ${message.id} مرة أخرى (${deliveryAttempts}/${maxAttempts})`);
              setTimeout(attemptDelivery, 3000 * deliveryAttempts); // زيادة وقت الانتظار مع كل محاولة
              return false;
            } else {
              // استنفدنا عدد المحاولات، تحديث الحالة إلى "فشل"
              deliveryStatus = 'failed';
              await storage.updateMessageDeliveryStatus(message.id, 'failed');
              console.log(`فشل إرسال الرسالة ${message.id} بعد ${maxAttempts} محاولات`);
              
              // إبلاغ المرسل بالفشل النهائي
              try {
                ws.send(JSON.stringify({
                  type: 'message_delivery_failed',
                  messageId: message.id,
                  reason: 'المستلم غير متصل بعد عدة محاولات'
                }));
              } catch (error) {
                console.error('فشل في إرسال إشعار فشل التسليم للمرسل:', error);
              }
              
              return false;
            }
          };
          
          // بدء محاولة الإرسال الأولى
          attemptDelivery();
          
          // إرسال رد بنجاح إرسال الرسالة للمرسل مع معرف الرسالة المؤقت للتتبع
          ws.send(JSON.stringify({
            type: 'message_sent',
            message,
            tempMessageId: clientMessageId,
            deliveryStatus: 'processing'
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

  // مسارات API للمدونة
  
  // الحصول على جميع فئات المدونة
  app.get('/api/blog/categories', async (req: Request, res: Response) => {
    try {
      const categories = await storage.getBlogCategories();
      res.json(categories);
    } catch (error) {
      console.error('Error fetching blog categories:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });
  
  // الحصول على فئة محددة
  app.get('/api/blog/categories/:id', async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const category = await storage.getBlogCategory(id);
      
      if (!category) {
        return res.status(404).json({ message: 'Category not found' });
      }
      
      res.json(category);
    } catch (error) {
      console.error('Error fetching blog category:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });
  
  // الحصول على فئة بواسطة الرابط المخصص
  app.get('/api/blog/categories/slug/:slug', async (req: Request, res: Response) => {
    try {
      const { slug } = req.params;
      const category = await storage.getBlogCategoryBySlug(slug);
      
      if (!category) {
        return res.status(404).json({ message: 'Category not found' });
      }
      
      res.json(category);
    } catch (error) {
      console.error('Error fetching blog category by slug:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });
  
  // إنشاء فئة جديدة
  app.post('/api/blog/categories', isAuthenticated, async (req: Request, res: Response) => {
    try {
      // التحقق من صلاحيات المستخدم (يجب أن يكون مسؤولاً)
      if (req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Forbidden - Admin access required' });
      }
      
      const category = await storage.createBlogCategory(req.body);
      res.status(201).json(category);
    } catch (error) {
      console.error('Error creating blog category:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });
  
  // تحديث فئة
  app.patch('/api/blog/categories/:id', isAuthenticated, async (req: Request, res: Response) => {
    try {
      // التحقق من صلاحيات المستخدم (يجب أن يكون مسؤولاً)
      if (req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Forbidden - Admin access required' });
      }
      
      const id = parseInt(req.params.id);
      const category = await storage.updateBlogCategory(id, req.body);
      res.json(category);
    } catch (error) {
      console.error('Error updating blog category:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });
  
  // حذف فئة
  app.delete('/api/blog/categories/:id', isAuthenticated, async (req: Request, res: Response) => {
    try {
      // التحقق من صلاحيات المستخدم (يجب أن يكون مسؤولاً)
      if (req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Forbidden - Admin access required' });
      }
      
      const id = parseInt(req.params.id);
      const success = await storage.deleteBlogCategory(id);
      
      if (success) {
        res.json({ success: true });
      } else {
        res.status(404).json({ message: 'Category not found or could not be deleted' });
      }
    } catch (error) {
      console.error('Error deleting blog category:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });
  
  // الحصول على المقالات (للمسؤولين - جميع المقالات بما في ذلك المسودات)
  app.get('/api/blog/posts/all', isAuthenticated, async (req: Request, res: Response) => {
    try {
      // التحقق من صلاحيات المستخدم (يجب أن يكون مسؤولاً)
      if (req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Forbidden - Admin access required' });
      }
      
      const { limit, offset, categoryId } = req.query;
      const options: { limit?: number; offset?: number; categoryId?: number } = {};
      
      if (limit) options.limit = parseInt(limit as string);
      if (offset) options.offset = parseInt(offset as string);
      if (categoryId) options.categoryId = parseInt(categoryId as string);
      
      const posts = await storage.getBlogPosts(options);
      res.json(posts);
    } catch (error) {
      console.error('Error fetching all blog posts:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });
  
  // الحصول على المقالات المنشورة (للعامة)
  app.get('/api/blog/posts', async (req: Request, res: Response) => {
    try {
      const { limit, offset, categoryId } = req.query;
      const options: { limit?: number; offset?: number; categoryId?: number } = {};
      
      if (limit) options.limit = parseInt(limit as string);
      if (offset) options.offset = parseInt(offset as string);
      if (categoryId) options.categoryId = parseInt(categoryId as string);
      
      const posts = await storage.getPublishedBlogPosts(options);
      res.json(posts);
    } catch (error) {
      console.error('Error fetching published blog posts:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });
  
  // الحصول على مقال محدد
  app.get('/api/blog/posts/:id', async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const post = await storage.getBlogPost(id);
      
      if (!post) {
        return res.status(404).json({ message: 'Post not found' });
      }
      
      // التحقق من صلاحيات المستخدم للمقالات غير المنشورة
      if (post.status !== 'published') {
        if (!req.isAuthenticated() || req.user.role !== 'admin') {
          return res.status(403).json({ message: 'Forbidden - Post is not published' });
        }
      }
      
      // زيادة عدد المشاهدات للمقالات المنشورة
      if (post.status === 'published') {
        await storage.incrementBlogPostViewCount(id);
      }
      
      res.json(post);
    } catch (error) {
      console.error('Error fetching blog post:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });
  
  // الحصول على مقال بواسطة الرابط المخصص
  app.get('/api/blog/posts/slug/:slug', async (req: Request, res: Response) => {
    try {
      const { slug } = req.params;
      const post = await storage.getBlogPostBySlug(slug);
      
      if (!post) {
        return res.status(404).json({ message: 'Post not found' });
      }
      
      // التحقق من صلاحيات المستخدم للمقالات غير المنشورة
      if (post.status !== 'published') {
        if (!req.isAuthenticated() || req.user.role !== 'admin') {
          return res.status(403).json({ message: 'Forbidden - Post is not published' });
        }
      }
      
      // زيادة عدد المشاهدات للمقالات المنشورة
      if (post.status === 'published') {
        await storage.incrementBlogPostViewCount(post.id);
      }
      
      res.json(post);
    } catch (error) {
      console.error('Error fetching blog post by slug:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });
  
  // إنشاء مقال جديد
  app.post('/api/blog/posts', isAuthenticated, async (req: Request, res: Response) => {
    try {
      // التحقق من صلاحيات المستخدم (يجب أن يكون مسؤولاً)
      if (req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Forbidden - Admin access required' });
      }
      
      // إضافة معرف المؤلف
      const postData = { ...req.body, authorId: req.user.id };
      
      const post = await storage.createBlogPost(postData);
      res.status(201).json(post);
    } catch (error) {
      console.error('Error creating blog post:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });
  
  // تحديث مقال
  app.patch('/api/blog/posts/:id', isAuthenticated, async (req: Request, res: Response) => {
    try {
      // التحقق من صلاحيات المستخدم (يجب أن يكون مسؤولاً)
      if (req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Forbidden - Admin access required' });
      }
      
      const id = parseInt(req.params.id);
      const post = await storage.updateBlogPost(id, req.body);
      res.json(post);
    } catch (error) {
      console.error('Error updating blog post:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });
  
  // حذف مقال
  app.delete('/api/blog/posts/:id', isAuthenticated, async (req: Request, res: Response) => {
    try {
      // التحقق من صلاحيات المستخدم (يجب أن يكون مسؤولاً)
      if (req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Forbidden - Admin access required' });
      }
      
      const id = parseInt(req.params.id);
      const success = await storage.deleteBlogPost(id);
      
      if (success) {
        res.json({ success: true });
      } else {
        res.status(404).json({ message: 'Post not found or could not be deleted' });
      }
    } catch (error) {
      console.error('Error deleting blog post:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });
  
  // الحصول على تعليقات المقال
  app.get('/api/blog/posts/:postId/comments', async (req: Request, res: Response) => {
    try {
      const postId = parseInt(req.params.postId);
      const comments = await storage.getBlogCommentsByPost(postId);
      res.json(comments);
    } catch (error) {
      console.error('Error fetching blog comments:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });
  
  // إضافة تعليق جديد
  app.post('/api/blog/comments', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const commentData = { ...req.body, userId: req.user.id };
      const comment = await storage.createBlogComment(commentData);
      res.status(201).json(comment);
    } catch (error) {
      console.error('Error creating blog comment:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });
  
  // تغيير حالة تعليق (للمسؤولين فقط)
  app.patch('/api/blog/comments/:id/status', isAuthenticated, async (req: Request, res: Response) => {
    try {
      // التحقق من صلاحيات المستخدم (يجب أن يكون مسؤولاً)
      if (req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Forbidden - Admin access required' });
      }
      
      const id = parseInt(req.params.id);
      const { status } = req.body;
      
      if (!status) {
        return res.status(400).json({ message: 'Status is required' });
      }
      
      const success = await storage.updateBlogCommentStatus(id, status);
      
      if (success) {
        res.json({ success: true });
      } else {
        res.status(404).json({ message: 'Comment not found or could not be updated' });
      }
    } catch (error) {
      console.error('Error updating blog comment status:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });
  
  // حذف تعليق
  app.delete('/api/blog/comments/:id', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const comment = await storage.getBlogComment(id);
      
      if (!comment) {
        return res.status(404).json({ message: 'Comment not found' });
      }
      
      // التحقق من صلاحيات المستخدم (يجب أن يكون صاحب التعليق أو مسؤولاً)
      if (comment.userId !== req.user.id && req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Forbidden - Not authorized to delete this comment' });
      }
      
      const success = await storage.deleteBlogComment(id);
      
      if (success) {
        res.json({ success: true });
      } else {
        res.status(500).json({ message: 'Comment could not be deleted' });
      }
    } catch (error) {
      console.error('Error deleting blog comment:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });
  
  // استخدام مسارات Sitemap و robots.txt من ملف منفصل
  app.use(sitemapRoutes);
  
  // استخدام مسارات اختبار PDF العربي
  app.use(arabicPdfTestRoutes);
  app.use(pdfmakeTestRoutes);
  
  // صفحة HTML تحتوي على زر تنزيل وعرض لملف PDF
  app.get('/arabic-pdf-test', (req: Request, res: Response) => {
    res.send(`
      <!DOCTYPE html>
      <html lang="ar" dir="rtl">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>اختبار PDF باللغة العربية</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
            text-align: center;
          }
          h1 {
            color: #333;
          }
          .btn {
            display: inline-block;
            margin: 10px;
            padding: 12px 30px;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-size: 18px;
            text-decoration: none;
            color: white;
          }
          .download-btn {
            background-color: #4CAF50;
          }
          .view-btn {
            background-color: #2196F3;
          }
          .option {
            margin: 30px 0;
            padding: 20px;
            border: 1px solid #ddd;
            border-radius: 8px;
          }
        </style>
      </head>
      <body>
        <h1>اختبار عرض النصوص العربية في ملفات PDF</h1>
        
        <div class="option">
          <h2>الخيار 1: عرض PDF في المتصفح</h2>
          <p>سيتم عرض ملف PDF مباشرة في المتصفح</p>
          <a href="/api/view-arabic-pdf" class="btn view-btn" target="_blank">عرض الملف</a>
        </div>
        
        <div class="option">
          <h2>الخيار 2: تنزيل PDF</h2>
          <p>سيتم تنزيل ملف PDF للاحتفاظ به على جهازك</p>
          <a href="/api/test-arabic-pdf" class="btn download-btn">تنزيل الملف</a>
        </div>
      </body>
      </html>
    `);
  });

  // نقطة نهاية جديدة لعرض ملف PDF مباشرة في المتصفح
  app.get('/api/view-arabic-pdf', async (req: Request, res: Response) => {
    try {
      console.log('اختبار إنشاء PDF باللغة العربية - عرض مباشر');
      
      // مساعدة لإعادة تشكيل و bidi مع تحسين لمعالجة ترتيب الكلمات
      function toArabic(text: string): string {
        try {
          // 1) reshape: يربط الحروف مع بعض
          const reshaped = arabicReshaper.reshape(text);
          
          // 2) معالجة خاصة للاتجاه من اليمين لليسار
          // تقسيم النص إلى جمل/سطور (اختياري)
          const lines = reshaped.split('\n');
          const processedLines = lines.map(line => {
            // تقسيم كل سطر إلى كلمات
            const words = line.split(' ');
            // عكس ترتيب الكلمات (حتى تظهر من اليمين إلى اليسار)
            const reversedWords = words.reverse();
            // إعادة دمج الكلمات المعكوسة
            return reversedWords.join(' ');
          });
          
          // إعادة دمج السطور
          const processedText = processedLines.join('\n');
          
          // 3) استخدام bidi للحصول على النص المرئي النهائي
          return bidi.getVisualString(processedText);
        } catch (error) {
          console.error('خطأ في معالجة النص العربي:', error);
          return text; // إرجاع النص الأصلي في حالة الخطأ
        }
      }
      
      // إنشاء وثيقة PDF جديدة
      const doc = new PDFDocument({
        size: 'A4',
        margin: 50,
        info: {
          Title: 'اختبار دعم اللغة العربية',
          Author: 'لينكتك',
          Subject: 'اختبار توليد ملفات PDF بالعربية',
        }
      });
      
      // تحميل الخط العربي
      const fontPath = path.join(process.cwd(), 'attached_assets', 'Cairo-Regular.ttf');
      doc.font(fontPath);
      
      // إعداد رأس الاستجابة لعرض PDF مباشرة في المتصفح
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'inline; filename=arabic-test.pdf');
      
      // توجيه مخرجات PDF مباشرة إلى الاستجابة
      doc.pipe(res);
      
      // إضافة محتوى باللغة العربية للاختبار
      doc.fontSize(24).text(toArabic('مرحبًا بكم في اختبار دعم اللغة العربية'), {
        align: 'right'
      });
      
      doc.moveDown();
      doc.fontSize(16).text(toArabic('هذا اختبار لعرض النصوص العربية في ملفات PDF'), {
        align: 'right'
      });
      
      doc.moveDown();
      doc.fontSize(14).text(toArabic('محتوى فقرة تجريبية باللغة العربية. نختبر هنا قدرة المكتبة على عرض النصوص العربية بشكل صحيح مع دعم التشكيل والاتجاه من اليمين إلى اليسار.'), {
        align: 'right'
      });
      
      doc.moveDown();
      const currentDate = new Date();
      const dateString = currentDate.toLocaleDateString('ar-SA');
      doc.fontSize(12).text(toArabic(`تاريخ إنشاء المستند: ${dateString}`), {
        align: 'right'
      });
      
      doc.moveDown();
      doc.fontSize(14).text(toArabic('أرقام للاختبار: ١٢٣٤٥٦٧٨٩٠'), {
        align: 'right'
      });
      
      // إنهاء المستند
      doc.end();
      
    } catch (error) {
      console.error('خطأ في إنشاء PDF للاختبار (عرض):', error);
      res.status(500).json({ message: 'حدث خطأ أثناء إنشاء PDF للاختبار' });
    }
  });

  // نقطة نهاية لاختبار دعم اللغة العربية في ملفات PDF (تنزيل)
  app.get('/api/test-arabic-pdf', async (req: Request, res: Response) => {
    try {
      console.log('اختبار إنشاء PDF باللغة العربية');
      
      // مساعدة لإعادة تشكيل و bidi مع تحسين لمعالجة ترتيب الكلمات
      function toArabic(text: string): string {
        try {
          // 1) reshape: يربط الحروف مع بعض
          const reshaped = arabicReshaper.reshape(text);
          
          // 2) معالجة خاصة للاتجاه من اليمين لليسار
          // تقسيم النص إلى جمل/سطور (اختياري)
          const lines = reshaped.split('\n');
          const processedLines = lines.map(line => {
            // تقسيم كل سطر إلى كلمات
            const words = line.split(' ');
            // عكس ترتيب الكلمات (حتى تظهر من اليمين إلى اليسار)
            const reversedWords = words.reverse();
            // إعادة دمج الكلمات المعكوسة
            return reversedWords.join(' ');
          });
          
          // إعادة دمج السطور
          const processedText = processedLines.join('\n');
          
          // 3) استخدام bidi للحصول على النص المرئي النهائي
          return bidi.getVisualString(processedText);
        } catch (error) {
          console.error('خطأ في معالجة النص العربي:', error);
          return text; // إرجاع النص الأصلي في حالة الخطأ
        }
      }
      
      // إضافة مسار الخط العربي المطلق
      const arabicFontPath = path.join(process.cwd(), 'assets', 'fonts', 'Cairo-Regular.ttf');
      
      // إنشاء وثيقة PDF جديدة مع دعم اللغة العربية
      const doc = new PDFDocument({
        size: 'A4',
        margin: 50,
        info: {
          Title: 'وثيقة اختبار اللغة العربية',
          Author: 'منصة لينكتك',
          Subject: 'اختبار',
        }
      });
      
      // تسجيل الخط العربي
      doc.registerFont('Cairo', arabicFontPath);
      
      // استخدام الخط العربي
      doc.font('Cairo');
      
      // إنشاء stream للحصول على البايتات
      const chunks: Buffer[] = [];
      doc.on('data', (chunk) => chunks.push(Buffer.from(chunk)));
      
      // الوعد باكتمال إنشاء PDF
      const pdfPromise = new Promise<Buffer>((resolve, reject) => {
        doc.on('end', () => {
          const pdfData = Buffer.concat(chunks);
          resolve(pdfData);
        });
        doc.on('error', reject);
      });
      
      // إضافة عنوان المستند
      doc.fontSize(24).text(toArabic('اختبار دعم اللغة العربية'), { 
        align: 'center' 
      });
      doc.moveDown();
      
      // إضافة نصوص للاختبار
      doc.fontSize(18).text(toArabic('هذا نص عربي للتجربة'), { 
        align: 'right'
      });
      doc.moveDown();
      
      doc.fontSize(14).text(toArabic('١٢٣٤٥ - أرقام عربية للتجربة'), { 
        align: 'right'
      });
      doc.moveDown();
      
      doc.fontSize(12).text(toArabic('هذه فقرة طويلة باللغة العربية لاختبار ظهور النصوص الطويلة وكيفية التعامل معها في مستندات PDF. يجب أن تظهر النصوص العربية من اليمين إلى اليسار بشكل صحيح مع حروف متصلة.'), { 
        align: 'right'
      });
      doc.moveDown(2);
      
      // اختبار كلمات منفصلة
      doc.fontSize(16).text(toArabic('كلمات - منفصلة - للاختبار'), { 
        align: 'right'
      });
      doc.moveDown();
      
      // اختبار جملة مع أرقام وعلامات خاصة
      doc.fontSize(14).text(toArabic('تاريخ الاختبار: ١٥-٠٥-٢٠٢٥'), { 
        align: 'right'
      });
      doc.moveDown(2);
      
      // تذييل المستند
      doc.fontSize(10).text(toArabic('تم إنشاء هذا المستند للاختبار فقط - منصة لينكتك ©'), { 
        align: 'center'
      });
      
      // إنهاء المستند
      doc.end();
      
      // انتظار اكتمال إنشاء المستند
      const pdfBuffer = await pdfPromise;
      
      // إنشاء ملف في المجلد العام ليكون متاحًا للتنزيل عبر الوصول المباشر
      const publicPdfPath = path.join(process.cwd(), 'public', 'arabic-test.pdf');
      
      // التأكد من وجود مجلد public
      const publicDir = path.join(process.cwd(), 'public');
      if (!fs.existsSync(publicDir)) {
        fs.mkdirSync(publicDir, { recursive: true });
      }
      
      // كتابة الملف في المجلد العام
      fs.writeFileSync(publicPdfPath, pdfBuffer);
      
      // تعديل صفحة HTML للإشارة إلى المسار الجديد
      res.send(`<!DOCTYPE html>
      <html lang="ar" dir="rtl">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>PDF تم توليده بنجاح</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
            text-align: center;
          }
          h1 { color: #4CAF50; }
          .download-btn {
            display: inline-block;
            background-color: #4CAF50;
            color: white;
            padding: 12px 30px;
            margin: 20px 0;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-size: 18px;
            text-decoration: none;
          }
        </style>
      </head>
      <body>
        <h1>تم إنشاء ملف PDF بنجاح!</h1>
        <p>تم إنشاء ملف PDF بنجاح ويمكنك تنزيله من خلال الرابط أدناه</p>
        <a href="/arabic-test.pdf" class="download-btn" download>تنزيل الملف</a>
        <p>أو، يمكنك الوصول للملف مباشرة من:</p>
        <a href="/arabic-test.pdf" target="_blank">/arabic-test.pdf</a>
      </body>
      </html>`);
      
    } catch (error) {
      console.error('خطأ في إنشاء PDF للاختبار:', error);
      res.status(500).json({ message: 'حدث خطأ أثناء إنشاء PDF للاختبار' });
    }
  });

  return httpServer;
}
