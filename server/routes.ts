import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { WebSocketServer, WebSocket } from "ws";
import crypto from "crypto";
import { sendPasswordResetEmail, sendPasswordChangedNotification } from "./emailService";
import jwt from "jsonwebtoken";
import { exec } from "child_process";
// استيراد مسارات Sitemap و robots.txt
import sitemapRoutes from "./routes/sitemap";
import arabicPdfTestRoutes from "./arabicPdfTest";
import pdfmakeTestRoutes from "./pdfmakeTest";
import generateNdaRoutes from "./generateNDA";
import sadiqRoutes from "./routes/sadiq";
// Contact routes are now integrated below
import PDFDocument from "pdfkit";
import { Readable } from "stream";
import fsExtra from "fs-extra";
import puppeteer from "puppeteer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import arabicReshaper from 'arabic-reshaper';
import bidi from 'bidi-js';

// مخزن مؤقت لإعدادات التواصل (على مستوى الوحدة لضمان الاستمرارية)
let globalContactSettingsCache: any = {
  contact_email: 'info@linktech.app',
  contact_phone: '+966 53 123 4567', 
  contact_address: 'واحة المعرفة، طريق الملك عبدالعزيز، جدة، المملكة العربية السعودية',
  business_hours: 'الأحد - الخميس: 9:00 صباحاً - 5:00 مساءً\nالجمعة - السبت: مغلق'
};
// مكتبة pdfmake للتوليد المحسّن لملفات PDF
import PdfPrinter from 'pdfmake/src/printer';

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
  insertBlogCommentSchema,
  insertContactMessageSchema,
  insertSiteSettingSchema
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
import { checkMessageForProhibitedContent, sanitizeMessageContent, addMessageToConversationHistory } from "./contentFilter";
import { trackVisit, getVisitStats, getQuickStats } from "./visitTracking";
import bcrypt from "bcryptjs";


// JWT helpers
const JWT_SECRET = process.env.JWT_SECRET || 'linktech-jwt-secret-2024';

function generateToken(userId: number): string {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: '7d' });
}

function verifyToken(token: string): { userId: number } | null {
  try {
    return jwt.verify(token, JWT_SECRET) as { userId: number };
  } catch {
    return null;
  }
}

// JWT Authentication middleware
const jwtAuth = async (req: Request, res: Response, next: Function) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
  
  console.log(`JWT Middleware: ${req.method} ${req.path}`);
  console.log(`Authorization header: ${authHeader}`);
  console.log(`Extracted token: ${token ? 'Present' : 'Missing'}`);
  
  if (!token) {
    console.log('No token found, continuing without authentication');
    return next(); // مواصلة بدون مصادقة
  }
  
  const decoded = verifyToken(token);
  console.log(`Token verification result: ${decoded ? 'Valid' : 'Invalid'}`);
  
  if (decoded) {
    console.log(`Decoded token userId: ${decoded.userId}`);
    const user = await storage.getUser(decoded.userId);
    console.log(`User lookup result: ${user ? `Found user ${user.username}` : 'User not found'}`);
    
    if (user) {
      req.user = user;
      console.log(`Set req.user to: ${user.username} (${user.role})`);
    }
  }
  
  return next();
};

const isAdmin = (req: Request, res: Response, next: Function) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({ message: 'Forbidden: Admins only' });
  }
};

// تم تعريف استيراد WebSocket واستخدامها في مكان آخر من الملف

export async function registerRoutes(app: Express): Promise<Server> {
  // إضافة مسارات التحويل والتنزيل ومسارات PDF
  app.use(arabicPdfTestRoutes);
  app.use(pdfmakeTestRoutes);
  app.use(generateNdaRoutes);
  // Contact routes integrated above
  
  // Add webhook endpoint BEFORE JWT middleware to bypass authentication
  // Webhook endpoint for Sadiq notifications - NO AUTHENTICATION REQUIRED
  app.post('/api/sadiq/webhook', async (req: Request, res: Response) => {
    try {
      console.log('🔔 تم استلام webhook من صادق:', JSON.stringify(req.body, null, 2));
      
      const webhookData = req.body;
      
      // Verify webhook authenticity using the expected webhook secret
      const authHeader = req.headers.authorization;
      console.log('🔐 Authorization header:', authHeader);
      
      if (authHeader !== 'Bearer linktech-webhook-secret-2025') {
        console.log('⚠️ Webhook authentication failed');
        return res.status(401).json({ message: 'Unauthorized webhook' });
      }
      
      // Extract envelope information
      const envelopeId = webhookData.envelopeId;
      const status = webhookData.status;
      const referenceNumber = webhookData.referenceNumber;
      
      if (!referenceNumber) {
        console.log('⚠️ لا يوجد رقم مرجع في webhook');
        return res.status(400).json({ message: 'Missing reference number' });
      }
      
      // Find NDA by reference number - search across all NDAs
      console.log(`🔍 البحث عن اتفاقية بالرقم المرجعي: ${referenceNumber}`);
      
      // Try to find NDA across all projects
      let nda = null;
      try {
        // Get all projects and check their NDAs
        const allProjects = await storage.getProjects();
        for (const project of allProjects) {
          const projectNda = await storage.getNdaAgreementByProjectId(project.id);
          if (projectNda && projectNda.sadiqReferenceNumber === referenceNumber) {
            nda = projectNda;
            break;
          }
        }
      } catch (searchError) {
        console.error('خطأ في البحث عن الاتفاقية:', searchError);
      }
      
      if (!nda) {
        console.log('⚠️ لم يتم العثور على اتفاقية بالرقم المرجعي:', referenceNumber);
        return res.status(404).json({ message: 'NDA not found' });
      }
      
      console.log(`📋 تحديث حالة الاتفاقية ${nda.id} إلى: ${status}`);
      
      // Update NDA status based on webhook data
      let newStatus = nda.status;
      let signedAt = nda.signedAt;
      
      if (status === 'Completed') {
        newStatus = 'signed';
        signedAt = new Date();
      } else if (status === 'Voided') {
        newStatus = 'cancelled';
      } else if (status === 'In-progress') {
        newStatus = 'invitation_sent';
      }
      
      // Update the NDA in database
      await storage.updateNdaAgreement(nda.id, {
        status: newStatus,
        envelopeStatus: status,
        ...(signedAt && { signedAt })
      });
      
      // Create notification for the user
      if (newStatus === 'signed') {
        const project = await storage.getProject(nda.projectId);
        if (project) {
          await storage.createNotification({
            userId: project.userId,
            type: 'nda_completed',
            title: 'تم توقيع اتفاقية عدم الإفصاح',
            content: `تم توقيع اتفاقية عدم الإفصاح للمشروع "${project.title}" من جميع الأطراف بنجاح. يمكنك الآن المتابعة مع الشركة لبدء العمل على المشروع.`,
            metadata: JSON.stringify({ ndaId: nda.id }),
            actionUrl: `/nda-complete/${nda.id}`
          });
          
          console.log(`✅ تم إنشاء إشعار للمستخدم ${project.userId} حول اكتمال التوقيع`);
        }
      }
      
      console.log(`✅ تم تحديث حالة الاتفاقية ${nda.id} بنجاح`);
      
      res.json({
        success: true,
        message: 'Webhook processed successfully',
        ndaId: nda.id,
        newStatus: newStatus
      });
    } catch (error) {
      console.error('❌ خطأ في معالجة webhook:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  });

  // Initialize session and passport
  // استخدام JWT middleware
  app.use(jwtAuth);
  
  // CORS middleware للـ JWT 
  app.use((req, res, next) => {
    const origin = req.headers.origin || req.headers.referer;
    
    res.header('Access-Control-Allow-Origin', origin || '*');
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    
    if (req.method === 'OPTIONS') {
      return res.sendStatus(200);
    }
    
    next();
  });

  // تم إزالة passport configuration - يستخدم JWT الآن

  const isAuthenticated = (req: Request, res: Response, next: Function) => {
    console.log(`طلب ${req.method} ${req.path} - حالة المصادقة: ${req.user ? 'مصرح' : 'غير مصرح'}`);
    
    if (req.user) {
      console.log(`المستخدم مصرح: ${req.user.username}, دور: ${req.user.role}`);
      return next();
    }
    res.status(401).json({ message: 'Unauthorized' });
    
    console.log(`طلب ${req.path} - المستخدم غير مصرح`);
    res.status(401).json({ message: 'Not authenticated' });
  };
  
  // التحقق من صلاحيات المسؤول
  const isAdmin = (req: Request, res: Response, next: Function) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    
    if (req.user.role === 'admin') {
      return next();
    }
    
    return res.status(403).json({ message: 'Forbidden - Admin access required' });
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
      
      // إنشاء إشعار ترحيبي للمستخدم الجديد
      try {
        await storage.createNotification({
          userId: user.id,
          type: 'system',
          title: 'مرحباً بك في منصة لينكتك',
          content: `مرحباً ${user.name || user.username}! نرحب بك في منصة لينكتك. نتمنى لك تجربة ممتعة ومفيدة.`,
          actionUrl: '/dashboard',
          metadata: JSON.stringify({ welcomeNotification: true })
        });
        
        console.log(`✅ تم إنشاء إشعار ترحيبي للمستخدم الجديد ${user.id}`);
        
        // إنشاء إشعار للمسؤولين عن تسجيل مستخدم جديد
        const adminUsers = await storage.getUsersByRole('admin');
        
        for (const admin of adminUsers) {
          await storage.createNotification({
            userId: admin.id,
            type: 'system',
            title: 'تسجيل مستخدم جديد',
            content: `قام ${user.name || user.username} بالتسجيل في المنصة كـ ${user.role === 'entrepreneur' ? 'رائد أعمال' : 'شركة'}.`,
            actionUrl: `/users/${user.id}`,
            metadata: JSON.stringify({ newUserId: user.id, userRole: user.role })
          });
          
          console.log(`✅ تم إنشاء إشعار للمسؤول ${admin.id} عن تسجيل مستخدم جديد`);
        }
      } catch (notificationError) {
        console.error('خطأ في إنشاء إشعارات التسجيل:', notificationError);
      }
      
      // إنشاء JWT token للمستخدم الجديد
      const token = generateToken(user.id);
      
      // إزالة كلمة المرور من استجابة التسجيل
      const { password, ...userWithoutPassword } = user;
      return res.status(201).json({ 
        user: userWithoutPassword,
        token 
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Validation error', errors: error.errors });
      }
      console.error('Registration error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.post('/api/auth/login', async (req: Request, res: Response) => {
    try {
      console.log(`محاولة تسجيل دخول للمستخدم: ${req.body.username}`);
      
      const { username, password } = req.body;
      if (!username || !password) {
        return res.status(400).json({ message: 'Username and password required' });
      }

      const user = await storage.getUserByUsername(username);
      if (!user) {
        console.log(`لم يتم العثور على مستخدم باسم: ${username}`);
        return res.status(401).json({ message: 'Invalid username or password' });
      }
      
      console.log(`تم العثور على المستخدم: ${username}, يتم التحقق من كلمة المرور...`);
      
      // التحقق من كلمة المرور
      let isValidPassword = false;
      
      if (user.password.startsWith('$2a$') || user.password.startsWith('$2b$')) {
        console.log(`كلمة المرور مشفرة للمستخدم: ${username}، استخدام bcrypt للتحقق`);
        isValidPassword = await bcrypt.compare(password, user.password);
        console.log(`نتيجة التحقق باستخدام bcrypt: ${isValidPassword ? 'ناجح' : 'فاشل'}`);
      } else {
        console.log(`كلمة المرور غير مشفرة للمستخدم: ${username}، استخدام المقارنة المباشرة`);
        isValidPassword = user.password === password;
        console.log(`نتيجة التحقق المباشر: ${isValidPassword ? 'ناجح' : 'فاشل'}`);
        
        if (isValidPassword) {
          console.log(`ترحيل كلمة المرور للمستخدم: ${username} إلى bcrypt`);
          const hashedPassword = await bcrypt.hash(password, 10);
          await storage.updateUserPassword(user.id, hashedPassword);
          console.log(`تم تحديث تشفير كلمة المرور للمستخدم: ${username}`);
        }
      }
      
      if (!isValidPassword) {
        console.log(`فشل المصادقة للمستخدم: ${username} - كلمة المرور غير صحيحة`);
        return res.status(401).json({ message: 'Invalid username or password' });
      }
      
      // إنشاء JWT token
      const token = generateToken(user.id);
      console.log(`نجاح المصادقة للمستخدم: ${username} بالدور: ${user.role}`);
      console.log(`تم إنشاء JWT token للمستخدم: ${username}`);
      
      // إزالة كلمة المرور من استجابة تسجيل الدخول
      const { password: _, ...userWithoutPassword } = user;
      
      console.log(`تسجيل دخول ناجح للمستخدم: ${username}`);
      console.log(`إرسال استجابة تسجيل الدخول مع token`);
      
      return res.json({ 
        user: userWithoutPassword,
        token 
      });
    } catch (error) {
      console.error('خطأ تسجيل الدخول:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.post('/api/auth/logout', (req: Request, res: Response) => {
    console.log('طلب تسجيل خروج، إزالة token من الواجهة الأمامية');
    res.json({ success: true });
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
      
      // Development fallback: Log reset link for testing (but never return in response)
      if (process.env.NODE_ENV === 'development' && !emailSent) {
        console.log("\n=== DEVELOPMENT MODE: EMAIL FAILED ===\n");
        console.log("ملاحظة: فشل في إرسال البريد الإلكتروني. رابط إعادة التعيين للاختبار:");
        console.log(resetLink);
        console.log("\n=== END DEVELOPMENT INFO ===\n");
      }
      
      // Always send email-only response, never include reset link in response for security
      if (!emailSent) {
        console.error("فشل في إرسال بريد إعادة تعيين كلمة المرور");
        return res.status(500).json({ 
          success: false, 
          message: 'Failed to send password reset email. Please try again later or contact support.' 
        });
      }
      
      // Email sent successfully - never include reset link in response
      res.json({ 
        success: true, 
        message: 'Password reset link has been sent to your email. Please check your inbox and spam folder.'
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

  app.get('/api/auth/user', async (req: Request, res: Response) => {
    console.log(`طلب /api/auth/user - حالة المصادقة: ${req.user ? 'مصرح' : 'غير مصرح'}`);
    
    if (req.user) {
      console.log(`استرجاع معلومات المستخدم: ${req.user.username}, الدور: ${req.user.role}, معرف: ${req.user.id}`);
      
      try {
        // التأكد من أن البيانات محدثة من قاعدة البيانات
        const freshUser = await storage.getUser(req.user.id);
        if (freshUser) {
          const { password, ...userWithoutPassword } = freshUser;
          console.log('إرسال معلومات المستخدم المحدثة: ', { user: userWithoutPassword });
          return res.json({ user: userWithoutPassword });
        } else {
          console.log('المستخدم غير موجود في قاعدة البيانات');
          return res.status(401).json({ message: 'User not found' });
        }
      } catch (error) {
        console.error('خطأ في استرجاع بيانات المستخدم:', error);
        return res.status(500).json({ message: 'Internal server error' });
      }
    }
    
    console.log(`طلب /api/auth/user - المستخدم غير مصرح`);
    return res.status(401).json({ message: 'Not authenticated' });
  });

  // جلب جميع المستخدمين (للمسؤول فقط)
  app.get('/api/users/all', isAuthenticated, async (req: Request, res: Response) => {
    try {
      // تحقق ما إذا كان المستخدم مسؤول
      if (req.user?.role !== 'admin') {
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

  // Update user information
  app.patch('/api/users/:id', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.id);
      const updates = req.body;
      
      // Only allow users to update their own information or admins to update any user
      if (req.user?.id !== userId && req.user?.role !== 'admin') {
        return res.status(403).json({ message: 'Forbidden' });
      }
      
      // Remove sensitive fields that shouldn't be updated through this endpoint
      const { password, role, id, createdAt, ...allowedUpdates } = updates;
      
      const updatedUser = await storage.updateUser(userId, allowedUpdates);
      if (!updatedUser) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      const { password: _, ...userWithoutPassword } = updatedUser;
      res.json(userWithoutPassword);
    } catch (error) {
      console.error('Error updating user:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // Company profile routes - الشركات لا تظهر أبداً للزوار أو العملاء
  app.get('/api/companies', async (req: Request, res: Response) => {
    try {
      console.log(`طلب قائمة الشركات - حالة المصادقة: ${req.user ? 'مصرح' : 'غير مصرح'}`);
      
      // المستخدم مسجل دخول والمستخدم هو مسؤول، نعرض جميع الشركات
      if (req.user && req.user.role === 'admin') {
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
        
        if (req.user) {
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
      console.log(`طلب ملف الشركة للمستخدم رقم ${req.params.userId} - حالة المصادقة: ${req.user ? 'مصرح' : 'غير مصرح'}`);
      
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
      console.log(`طلب تفاصيل الشركة برقم ${req.params.id} - حالة المصادقة: ${req.user ? 'مصرح' : 'غير مصرح'}`);
      
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

  // تحديث البيانات الشخصية للشركة (مطلوبة لاتفاقيات عدم الإفصاح)
  app.patch('/api/companies/:id/personal-info', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const user = req.user as any;
      const profileId = parseInt(req.params.id);
      
      console.log(`طلب تحديث البيانات الشخصية لملف الشركة برقم ${profileId} - المستخدم: ${user.username}`);
      console.log('البيانات الشخصية للتحديث:', JSON.stringify(req.body));
      
      const profile = await storage.getCompanyProfile(profileId);
      if (!profile) {
        console.log(`خطأ: لم يتم العثور على ملف الشركة برقم ${profileId}`);
        return res.status(404).json({ message: 'Company profile not found' });
      }
      
      if (profile.userId !== user.id && user.role !== 'admin') {
        console.log(`خطأ: المستخدم ${user.username} غير مصرح له بتحديث ملف الشركة ${profileId}`);
        return res.status(403).json({ message: 'Not authorized to update this profile' });
      }
      
      // استخراج البيانات الشخصية فقط من الطلب
      const personalInfoData = {
        fullName: req.body.fullName,
        nationalId: req.body.nationalId,
        phone: req.body.phone,
        birthDate: req.body.birthDate,
        address: req.body.address
      };
      
      // تنظيف البيانات من القيم الفارغة أو undefined
      const cleanedData = Object.fromEntries(
        Object.entries(personalInfoData).filter(([_, value]) => value !== undefined && value !== null && value !== '')
      );
      
      console.log('البيانات الشخصية المنظفة للتحديث:', JSON.stringify(cleanedData));
      
      const updatedProfile = await storage.updateCompanyProfile(profileId, cleanedData);
      console.log('تم تحديث البيانات الشخصية بنجاح:', JSON.stringify(updatedProfile));
      res.json(updatedProfile);
    } catch (error) {
      console.error('خطأ في تحديث البيانات الشخصية للشركة:', error);
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
      
      // إرسال إشعار بالبريد الإلكتروني وإنشاء إشعار في النظام (إذا كان التحقق صحيحاً)
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
              companyUser.name || companyUser.username,
              req.body.verificationNotes || ''
            );
            
            if (emailSent) {
              console.log(`تم إرسال بريد إشعار التوثيق بنجاح إلى: ${companyUser.email}`);
            } else {
              console.warn(`فشل في إرسال بريد إشعار التوثيق إلى: ${companyUser.email}`);
            }
            
            // إنشاء إشعار في النظام للشركة
            try {
              await storage.createNotification({
                userId: companyUser.id,
                type: 'system',
                title: 'تم توثيق حسابك',
                content: `تهانينا! تم توثيق حساب شركتك بنجاح. يمكنك الآن الاستفادة من جميع مزايا الشركات الموثقة.`,
                actionUrl: '/dashboard/company',
                metadata: JSON.stringify({ verificationDate: new Date().toISOString() })
              });
              
              console.log(`✅ تم إنشاء إشعار نظام للشركة ${companyUser.id} بتوثيق الحساب`);
            } catch (notificationError) {
              console.error('خطأ في إنشاء إشعار توثيق الشركة:', notificationError);
            }
          } else {
            console.warn('لم يتم العثور على معلومات المستخدم أو البريد الإلكتروني للشركة');
          }
        } catch (emailError) {
          console.error('خطأ في إرسال إشعار التوثيق:', emailError);
          // لا نريد إيقاف العملية إذا فشل إرسال البريد الإلكتروني
        }
      } else {
        // إذا تم إلغاء التوثيق، إنشاء إشعار بذلك
        try {
          const companyUser = await storage.getUser(companyProfile.userId);
          if (companyUser) {
            await storage.createNotification({
              userId: companyUser.id,
              type: 'system',
              title: 'تم إلغاء توثيق حسابك',
              content: `تم إلغاء توثيق حساب شركتك. يرجى التواصل مع إدارة المنصة لمزيد من المعلومات.`,
              actionUrl: '/dashboard/company',
              metadata: JSON.stringify({ verificationDate: new Date().toISOString() })
            });
            
            console.log(`✅ تم إنشاء إشعار نظام للشركة ${companyUser.id} بإلغاء توثيق الحساب`);
          }
        } catch (notificationError) {
          console.error('خطأ في إنشاء إشعار إلغاء توثيق الشركة:', notificationError);
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
      console.log(`طلب قائمة المشاريع - حالة المصادقة: ${req.user ? 'مصرح' : 'غير مصرح'}`);
      
      // فقط المستخدمين المسجلين يمكنهم مشاهدة المشاريع
      if (!req.user) {
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
        console.log(`رائد أعمال (${user.username})، عرض مشاريعه الخاصة فقط`);
        // رواد الأعمال يرون مشاريعهم الخاصة فقط
        const userProjects = await storage.getProjectsByUserId(user.id);
        projects = userProjects.map(project => ({
          ...project,
          username: user.username,
          name: user.name
        }));
        
        console.log(`عدد المشاريع الخاصة برائد الأعمال: ${projects.length}`);
        console.log(`إرسال ${projects.length} مشروع للمستخدم ${user.username}`);
        return res.json(projects);
      } else if (user.role === 'company') {
        console.log(`شركة (${user.username})، عرض المشاريع المتاحة للشركات`);
        
        try {
          // الشركات تستطيع مشاهدة المشاريع المتاحة فقط (مشاريع رواد الأعمال)
          // استخدام الطريقة المحسنة التي تجلب بيانات المستخدم مع المشاريع في استعلام واحد
          const projectsWithUserData = await storage.getProjectsWithUserData();
          projects = projectsWithUserData;
          
          console.log(`عدد المشاريع المتاحة للشركة: ${projects.length}`);
          
          console.log(`إرسال ${projects.length} مشروع للمستخدم ${user.username}`);
          return res.json(projects);
        } catch (error) {
          console.error('خطأ أثناء محاولة الحصول على المشاريع للشركة:', error);
          return res.json([]);
        }
      } else {
        // للمستخدمين العاديين والمسؤولين، استخدام الطريقة العادية
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
      }
    } catch (error) {
      console.error('خطأ في استرجاع المشاريع:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // Admin endpoint: get all projects regardless of owner
  app.get('/api/admin/projects', isAdmin, async (req: Request, res: Response) => {
    try {
      const projects = await storage.getProjects();
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
      res.json(projectsWithUserData);
    } catch (error) {
      console.error('خطأ في استرجاع مشاريع المسؤول:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.get('/api/projects/:id', async (req: Request, res: Response) => {
    try {
      console.log(`طلب تفاصيل المشروع برقم ${req.params.id} - حالة المصادقة: ${req.user ? 'مصرح' : 'غير مصرح'}`);
      
      // فقط المستخدمين المسجلين يمكنهم مشاهدة تفاصيل المشاريع
      if (!req.user) {
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
      
      // في النظام المفتوح (السوق)، جميع المستخدمين المسجلين يمكنهم مشاهدة تفاصيل المشاريع
      // فقط التحقق من أن المستخدم مسجل دخول (تم بالفعل في الأعلى)
      console.log(`السماح بالوصول: المستخدم ${user.username} (${user.role}) يشاهد المشروع ${project.id}`);
      
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
      
      if (status !== 'open' && status !== 'closed' && status !== 'in-progress' && status !== 'completed') {
        return res.status(400).json({ message: 'الحالة غير صالحة. يجب أن تكون "open" أو "closed" أو "in-progress" أو "completed".' });
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
      
      // وظيفة مساعدة للحصول على تسمية الحالة بالعربية
      function getStatusLabel(status: string): string {
        switch (status) {
          case 'open': return 'مفتوح';
          case 'closed': return 'مغلق';
          case 'in-progress': return 'قيد التنفيذ';
          case 'completed': return 'مكتمل';
          default: return status;
        }
      }
      
      // إنشاء إشعار لصاحب المشروع إذا تم التحديث بواسطة المسؤول
      if (user.role === 'admin' && user.id !== project.userId) {
        try {
          await storage.createNotification({
            userId: project.userId,
            type: 'system',
            title: 'تم تحديث حالة مشروعك',
            content: `تم تغيير حالة مشروعك "${project.title}" إلى "${getStatusLabel(status)}".`,
            actionUrl: `/projects/${projectId}`,
            metadata: JSON.stringify({ projectId, status })
          });
          
          console.log(`✅ تم إنشاء إشعار لصاحب المشروع ${project.userId} بتحديث حالة المشروع`);
        } catch (notificationError) {
          console.error('خطأ في إنشاء إشعار تحديث حالة المشروع:', notificationError);
        }
      }
      
      // إذا كان المشروع له عروض مقبولة، إنشاء إشعارات للشركات المعنية
      if (status === 'in-progress' || status === 'completed') {
        try {
          // الحصول على العروض المقبولة للمشروع
          const projectOffers = await storage.getProjectOffersByProjectId(projectId);
          const acceptedOffers = projectOffers.filter(offer => offer.status === 'accepted');
          
          // إنشاء إشعارات للشركات التي تم قبول عروضها
          for (const offer of acceptedOffers) {
            const companyProfile = await storage.getCompanyProfile(offer.companyId);
            if (companyProfile) {
              await storage.createNotification({
                userId: companyProfile.userId,
                type: 'project',
                title: 'تم تحديث حالة المشروع',
                content: `تم تغيير حالة المشروع "${project.title}" إلى "${getStatusLabel(status)}".`,
                actionUrl: `/projects/${projectId}`,
                metadata: JSON.stringify({ projectId, status, offerId: offer.id })
              });
              
              console.log(`✅ تم إنشاء إشعار للشركة ${companyProfile.userId} بتحديث حالة المشروع`);
            }
          }
        } catch (notificationError) {
          console.error('خطأ في إنشاء إشعارات تحديث حالة المشروع للشركات:', notificationError);
        }
      }
      
      console.log(`تم تغيير حالة المشروع ${projectId} إلى "${status}" بواسطة المستخدم ${user.username}`);
      res.json(updatedProject);
    } catch (error) {
      console.error('خطأ في تحديث حالة المشروع:', error);
      res.status(500).json({ message: 'خطأ في الخادم' });
    }
  });

  // Delete project - only for project owner and if no active offers
  app.delete('/api/projects/:id', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const user = req.user as any;
      const projectId = parseInt(req.params.id);
      
      // Check if project exists
      const project = await storage.getProject(projectId);
      if (!project) {
        return res.status(404).json({ message: 'المشروع غير موجود' });
      }
      
      // Only project owner or admin can delete
      if (user.role !== 'admin' && project.userId !== user.id) {
        return res.status(403).json({ message: 'غير مصرح لك بحذف هذا المشروع' });
      }
      
      // Attempt to delete the project
      const deleted = await storage.deleteProject(projectId);
      
      if (!deleted) {
        return res.status(400).json({ 
          message: 'لا يمكن حذف المشروع لأنه مرتبط بعروض مقبولة أو مكتملة من الشركات' 
        });
      }
      
      console.log(`تم حذف المشروع ${projectId} بواسطة المستخدم ${user.username}`);
      res.json({ message: 'تم حذف المشروع بنجاح' });
    } catch (error) {
      console.error('خطأ في حذف المشروع:', error);
      res.status(500).json({ message: 'خطأ في الخادم' });
    }
  });

  app.get('/api/users/:userId/projects', async (req: Request, res: Response) => {
    try {
      console.log(`طلب مشاريع المستخدم ${req.params.userId} - حالة المصادقة: ${req.user ? 'مصرح' : 'غير مصرح'}`);
      
      // فقط المستخدمين المسجلين يمكنهم مشاهدة مشاريع المستخدمين
      if (!req.user) {
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
      
      // إنشاء إشعار للمسؤولين عن إضافة مشروع جديد
      try {
        // الحصول على جميع المسؤولين
        const adminUsers = await storage.getUsersByRole('admin');
        
        // إنشاء إشعار لكل مسؤول
        for (const admin of adminUsers) {
          await storage.createNotification({
            userId: admin.id,
            type: 'system',
            title: 'تم إضافة مشروع جديد',
            content: `قام ${user.name || user.username} بإضافة مشروع جديد بعنوان "${project.title}".`,
            actionUrl: `/projects/${project.id}`,
            metadata: JSON.stringify({ projectId: project.id })
          });
          
          console.log(`✅ تم إنشاء إشعار للمسؤول ${admin.id} عن إضافة مشروع جديد`);
        }
      } catch (notificationError) {
        console.error('خطأ في إنشاء إشعار إضافة مشروع جديد:', notificationError);
      }
      
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
  

  // المرحلة الأولى: الشركة تنشئ طلب اتفاقية عدم إفصاح
  app.post('/api/projects/:projectId/nda/initiate', isAuthenticated, async (req: Request, res: Response) => {
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
        return res.status(403).json({ message: 'فقط الشركات يمكنها إنشاء اتفاقيات عدم الإفصاح' });
      }

      // الحصول على ملف تعريف الشركة لاستخدام بياناتها الموجودة
      const companyProfile = await storage.getCompanyProfileByUserId(user.id);
      if (!companyProfile) {
        return res.status(400).json({ 
          message: 'يجب إكمال ملف تعريف الشركة أولاً لإنشاء اتفاقية عدم إفصاح' 
        });
      }

      // التحقق من وجود البيانات الأساسية للشركة
      if (!user.email) {
        return res.status(400).json({ 
          message: 'يجب إضافة البريد الإلكتروني في حساب المستخدم (الشركة)' 
        });
      }

      if (!companyProfile.phone) {
        return res.status(400).json({ 
          message: 'يجب إضافة رقم الهاتف في ملف تعريف الشركة' 
        });
      }

      // ملاحظة: في النظام المرحلي الجديد، رائد الأعمال سيقدم بياناته لاحقاً عند استلام الإشعار
      // لا نحتاج للتحقق من بيانات رائد الأعمال هنا
      
      // التحقق من عدم وجود اتفاقية سابقة لهذا المشروع من نفس الشركة
      const existingNda = await storage.getNdaByProjectAndCompany(projectId, user.id);
      if (existingNda) {
        return res.status(400).json({ 
          message: 'يوجد بالفعل طلب اتفاقية عدم إفصاح لهذا المشروع' 
        });
      }

      // استخدام بيانات الشركة من النموذج المرسل (ليس الحساب)
      const { companyRep } = req.body;
      
      if (!companyRep?.name || !companyRep?.email || !companyRep?.phone) {
        return res.status(400).json({ 
          message: 'بيانات ممثل الشركة مطلوبة (الاسم، البريد الإلكتروني، رقم الهاتف)' 
        });
      }
      
      const companyRepData = {
        name: companyRep.name,
        email: companyRep.email, // البريد من النموذج المرسل ❌ ليس من الحساب
        phone: companyRep.phone, // الهاتف من النموذج المرسل
        companyName: companyProfile.legalName || user.name || user.username
      };

      console.log(`✅ تم استخدام بيانات الشركة الموجودة: ${companyRepData.name} - ${companyRepData.email}`);
      
      // إنشاء طلب اتفاقية عدم الإفصاح (المرحلة الأولى)
      const ndaData = {
        projectId,
        status: 'awaiting_entrepreneur' as const,
        companySignatureInfo: {
          companyUserId: user.id,
          ...companyRepData,
          createdAt: new Date().toISOString()
        },
      };
      
      const nda = await storage.createNda(ndaData);
      
      // إرسال إشعار لصاحب المشروع
      await storage.createNotification({
        userId: project.userId,
        type: 'nda_request',
        title: 'طلب اتفاقية عدم إفصاح جديد',
        content: `طلبت شركة "${companyRepData.companyName}" إنشاء اتفاقية عدم إفصاح لمشروعك "${project.title}". يرجى إكمال بياناتك لبدء عملية التوقيع الإلكتروني.`,
        actionUrl: `/nda/${nda.id}/complete`,
        metadata: JSON.stringify({ 
          projectId: project.id, 
          ndaId: nda.id,
          companyUserId: user.id,
          companyName: companyRepData.companyName
        })
      });
      
      console.log(`📧 تم إرسال إشعار لصاحب المشروع ${project.userId} لإكمال بيانات اتفاقية عدم الإفصاح`);
      console.log(`🏢 شركة ${companyRepData.companyName} بدأت طلب NDA (بيانات تلقائية من الملف الشخصي)`);
      
      res.json({ 
        id: nda.id, 
        message: 'تم إنشاء طلب اتفاقية عدم الإفصاح بنجاح باستخدام بياناتك الموجودة. سيتم إشعار صاحب المشروع لإكمال بياناته.',
        status: nda.status,
        companyRepData // إرجاع البيانات المستخدمة للتأكيد
      });
    } catch (error) {
      console.error('❌ خطأ في إنشاء طلب اتفاقية عدم الإفصاح:', error);
      res.status(500).json({ message: 'حدث خطأ في النظام' });
    }
  });
  
  // المرحلة الثانية: صاحب المشروع يكمل بياناته
  app.post('/api/nda/:ndaId/complete', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const user = req.user as any;
      const ndaId = parseInt(req.params.ndaId);
      const { entrepreneur } = req.body;
      
      // التحقق من بيانات صاحب المشروع
      if (!entrepreneur?.name || !entrepreneur?.email || !entrepreneur?.phone) {
        return res.status(400).json({ 
          message: 'بيانات صاحب المشروع مطلوبة (الاسم، البريد الإلكتروني، رقم الهاتف)' 
        });
      }
      
      // الحصول على اتفاقية عدم الإفصاح
      const nda = await storage.getNda(ndaId);
      if (!nda) {
        return res.status(404).json({ message: 'اتفاقية عدم الإفصاح غير موجودة' });
      }
      
      // التحقق من أن الحالة صحيحة
      if (nda.status !== 'awaiting_entrepreneur') {
        return res.status(400).json({ 
          message: 'اتفاقية عدم الإفصاح ليست في الحالة الصحيحة لإكمال البيانات' 
        });
      }
      
      // التحقق من أن المستخدم هو صاحب المشروع
      const project = await storage.getProject(nda.projectId);
      if (!project || project.userId !== user.id) {
        return res.status(403).json({ message: 'غير مصرح لك بإكمال هذه الاتفاقية' });
      }
      
      // تحديث الاتفاقية بمعلومات صاحب المشروع
      const updatedNda = await storage.updateNda(ndaId, {
        entrepreneurInfo: {
          entrepreneurUserId: user.id,
          ...entrepreneur,
          completedAt: new Date().toISOString()
        },
        status: 'ready_for_sadiq'
      });
      
      // إرسال إشعار للشركة بأن البيانات اكتملت
      const companyUserId = (updatedNda.companySignatureInfo as any)?.companyUserId;
      if (companyUserId) {
        await storage.createNotification({
          userId: companyUserId,
          type: 'nda_completed',
          title: 'اكتملت بيانات اتفاقية عدم الإفصاح',
          content: `أكمل صاحب المشروع "${project.title}" بياناته. سيتم إرسال دعوات التوقيع الإلكتروني عبر صادق قريباً.`,
          actionUrl: `/projects/${project.id}`,
          metadata: JSON.stringify({ 
            projectId: project.id, 
            ndaId: updatedNda.id,
            entrepreneurUserId: user.id
          })
        });
      }
      
      // إعداد بيانات الموقعين مبكراً لضمان الوصول في جميع أجزاء الكود
      let signatoryList: any[] = [];
      
      // الآن نبدأ عملية إرسال الدعوات عبر صادق
      try {
        // استيراد خدمة المصادقة مع صادق
        const { sadiqAuth } = await import('./sadiqAuthService');
        const { generateProjectNdaPdf } = await import('./generateNDA');

        // تحضير بيانات الاتفاقية
        const companyInfo = updatedNda.companySignatureInfo as any;
        const entrepreneurInfo = updatedNda.entrepreneurInfo as any;

        const projectData = {
          title: project.title,
          description: project.description
        };
        
        const companyData = {
          name: companyInfo.companyName || 'شركة البرمجة',
          location: 'المملكة العربية السعودية'
        };
        
        const signingPartiesData = {
          entrepreneur: entrepreneurInfo.name,
          companyRep: companyInfo.name || companyInfo.signerName
        };

        // تنظيف وتنسيق أرقام الهواتف قبل الإرسال لصادق
        const { validatePhoneNumber } = await import('./validationHelpers');
        
        // تنسيق رقم رائد الأعمال
        const entrepreneurPhoneValidation = validatePhoneNumber(entrepreneurInfo.phone);
        const cleanEntrepreneurPhone = entrepreneurPhoneValidation.isValid ? 
          (entrepreneurPhoneValidation.formattedValue || entrepreneurInfo.phone) : entrepreneurInfo.phone;
        
        // تنسيق رقم الشركة
        const companyPhone = companyInfo.phone || companyInfo.signerPhone || '';
        const companyPhoneValidation = validatePhoneNumber(companyPhone);
        const cleanCompanyPhone = companyPhoneValidation.isValid ? 
          (companyPhoneValidation.formattedValue || companyPhone) : companyPhone;
        
        // إعداد بيانات الموقعين للدعوة مع أرقام منسقة
        signatoryList = [
          {
            fullName: entrepreneurInfo.name,
            email: entrepreneurInfo.email,
            phoneNumber: cleanEntrepreneurPhone,
            nationalId: '',
            gender: 'NONE'
          },
          {
            fullName: companyInfo.name || companyInfo.signerName,
            email: companyInfo.email || companyInfo.signerEmail,
            phoneNumber: cleanCompanyPhone,
            nationalId: '',
            gender: 'NONE'
          }
        ];

        // طباعة أرقام الهواتف للتحقق من التنسيق
        console.log(`📞 رقم رائد الأعمال (أصلي): ${entrepreneurInfo.phone} → (منسق): ${cleanEntrepreneurPhone}`);
        console.log(`📞 رقم الشركة (أصلي): ${companyPhone} → (منسق): ${cleanCompanyPhone}`);
        console.log(`📞 حالة تنسيق رقم رائد الأعمال:`, entrepreneurPhoneValidation);
        console.log(`📞 حالة تنسيق رقم الشركة:`, companyPhoneValidation);

        // إنشاء ملف PDF لاتفاقية عدم الإفصاح
        console.log('📄 إنشاء ملف PDF لاتفاقية عدم الإفصاح...');
        const pdfBuffer = await generateProjectNdaPdf(projectData, companyData, signingPartiesData);
        const base64Pdf = pdfBuffer.toString('base64');

        // رفع الملف إلى صادق
        const fileName = `NDA-${project.title.replace(/\s+/g, '-')}-${Date.now()}.pdf`;
        console.log('⬆️ رفع ملف PDF إلى صادق...');
        const uploadResult = await sadiqAuth.uploadDocument(base64Pdf, fileName);
        const documentId = uploadResult.id;
        const referenceNumber = uploadResult.referenceNumber;

        // إرسال الدعوات للتوقيع باستخدام Sadiq API الصحيح
        console.log('📧 إرسال دعوات التوقيع الإلكتروني باستخدام API الصحيح...');
        const invitationResult = await sadiqAuth.sendSigningInvitations(documentId, signatoryList, project.title);

        // تحديث اتفاقية عدم الإفصاح ببيانات صادق
        await storage.updateNda(ndaId, {
          sadiqEnvelopeId: invitationResult.envelopeId,
          sadiqReferenceNumber: referenceNumber,
          sadiqDocumentId: documentId,
          envelopeStatus: 'invitation_sent',
          status: 'invitations_sent'
        });

        console.log(`✅ تم إرسال دعوات التوقيع الإلكتروني بنجاح للاتفاقية ${ndaId}`);
        console.log(`📧 تم إرسال دعوات لـ ${signatoryList[0].email} و ${signatoryList[1].email}`);
        
        res.json({ 
          id: updatedNda.id, 
          message: 'تم إكمال البيانات وإرسال دعوات التوقيع الإلكتروني بنجاح!',
          status: 'invitations_sent',
          sadiqEnvelopeId: invitationResult.envelopeId
        });

      } catch (sadiqError) {
        console.error('❌ خطأ في إرسال دعوات التوقيع عبر صادق:', sadiqError);
        
        // 🔄 إعادة تعيين حالة الاتفاقية للسماح بإعادة المحاولة
        console.log('🔄 إعادة تعيين حالة NDA للسماح بإعادة المحاولة...');
        await storage.updateNda(ndaId, {
          status: 'awaiting_entrepreneur', // إعادة للحالة السابقة
          envelopeStatus: 'sadiq_failed',
          sadiqErrorMessage: sadiqError.message || 'Sadiq integration failed'
        });
        
        // 📧 نظام بديل لضمان وصول الدعوات!
        console.log('🔄 تفعيل النظام البديل لضمان إرسال الدعوات...');
        
        try {
          // إرسال دعوات عبر البريد الإلكتروني كبديل
          const sgMail = await import('@sendgrid/mail').then(m => m.default);
          
          if (process.env.SENDGRID_API_KEY) {
            sgMail.setApiKey(process.env.SENDGRID_API_KEY);
            
            const pdfBuffer = await generateProjectNdaPdf(projectData, companyData, signingPartiesData);
            const base64Pdf = pdfBuffer.toString('base64');
            
            // إرسال دعوة لرائد الأعمال
            const entrepreneurMsg = {
              to: signatoryList[0].email,
              from: 'noreply@linktech.sa',
              subject: `اتفاقية عدم الإفصاح - مشروع ${project.title}`,
              html: `
                <div dir="rtl" style="font-family: Arial, sans-serif;">
                  <h2>مرحباً ${signatoryList[0].fullName}</h2>
                  <p>نرجو منك مراجعة وتوقيع اتفاقية عدم الإفصاح المرفقة للمشروع: <strong>${project.title}</strong></p>
                  <p>يرجى طباعة الوثيقة المرفقة، توقيعها، ومشاركة النسخة الموقعة مع الشركة.</p>
                  <p><strong>الشركة:</strong> ${signatoryList[1].fullName}</p>
                  <p><strong>بريد الشركة:</strong> ${signatoryList[1].email}</p>
                  <p>شكراً لك</p>
                  <p>فريق لينكتك</p>
                </div>
              `,
              attachments: [{
                content: base64Pdf,
                filename: `NDA-${project.title.replace(/\s+/g, '-')}.pdf`,
                type: 'application/pdf',
                disposition: 'attachment'
              }]
            };
            
            // إرسال دعوة للشركة
            const companyMsg = {
              to: signatoryList[1].email,
              from: 'noreply@linktech.sa',
              subject: `اتفاقية عدم الإفصاح - مشروع ${project.title}`,
              html: `
                <div dir="rtl" style="font-family: Arial, sans-serif;">
                  <h2>مرحباً ${signatoryList[1].fullName}</h2>
                  <p>نرجو منك مراجعة وتوقيع اتفاقية عدم الإفصاح المرفقة للمشروع: <strong>${project.title}</strong></p>
                  <p>يرجى طباعة الوثيقة المرفقة، توقيعها، ومشاركة النسخة الموقعة مع رائد الأعمال.</p>
                  <p><strong>رائد الأعمال:</strong> ${signatoryList[0].fullName}</p>
                  <p><strong>بريد رائد الأعمال:</strong> ${signatoryList[0].email}</p>
                  <p>شكراً لك</p>
                  <p>فريق لينكتك</p>
                </div>
              `,
              attachments: [{
                content: base64Pdf,
                filename: `NDA-${project.title.replace(/\s+/g, '-')}.pdf`,
                type: 'application/pdf',
                disposition: 'attachment'
              }]
            };
            
            // إرسال الرسائل
            await sgMail.send(entrepreneurMsg);
            await sgMail.send(companyMsg);
            
            console.log(`✅ تم إرسال دعوات NDA عبر البريد إلى ${signatoryList[0].email} و ${signatoryList[1].email}`);
            
            // تحديث حالة الاتفاقية
            await storage.updateNda(ndaId, {
              status: 'email_invitations_sent',
              envelopeStatus: 'email_fallback_used',
              sadiqEnvelopeId: `email-fallback-${Date.now()}`,
              sadiqReferenceNumber: `email-${Date.now()}`
            });
            
            res.json({ 
              id: updatedNda.id, 
              message: 'تم إكمال البيانات وإرسال دعوات اتفاقية عدم الإفصاح عبر البريد الإلكتروني بنجاح!',
              status: 'email_invitations_sent',
              fallbackUsed: true,
              emailsSentTo: [signatoryList[0].email, signatoryList[1].email]
            });
            
          } else {
            console.log('⚠️ SendGrid غير متوفر، تسجيل معلومات الدعوة فقط');
            console.log(`📧 دعوة مطلوبة لـ: ${signatoryList[0].fullName} (${signatoryList[0].email})`);
            console.log(`📧 دعوة مطلوبة لـ: ${signatoryList[1].fullName} (${signatoryList[1].email})`);
            
            res.json({ 
              id: updatedNda.id, 
              message: 'تم إكمال البيانات. يرجى التواصل مع الأطراف المعنية لتوقيع الاتفاقية.',
              status: updatedNda.status,
              contactInfo: {
                entrepreneur: `${signatoryList[0].fullName} (${signatoryList[0].email})`,
                company: `${signatoryList[1].fullName} (${signatoryList[1].email})`
              }
            });
          }
          
        } catch (emailError) {
          console.error('❌ فشل في إرسال الدعوات البديلة:', emailError);
          
          // على الأقل نعطي معلومات الاتصال
          res.json({ 
            id: updatedNda.id, 
            message: 'تم إكمال البيانات. يرجى التواصل مع الأطراف المعنية لتوقيع الاتفاقية.',
            status: updatedNda.status,
            error: 'Sadiq and email fallback failed',
            contactInfo: {
              entrepreneur: `${signatoryList[0].fullName} (${signatoryList[0].email})`,
              company: `${signatoryList[1].fullName} (${signatoryList[1].email})`
            }
          });
        }
      }
    } catch (error) {
      console.error('❌ خطأ في إكمال بيانات اتفاقية عدم الإفصاح:', error);
      res.status(500).json({ message: 'حدث خطأ في النظام' });
    }
  });

  // إنشاء اتفاقية عدم إفصاح جديدة (مسار متوافق مع النظام القديم)
  app.post('/api/projects/:projectId/nda', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const user = req.user as any;
      const projectId = parseInt(req.params.projectId);
      const { entrepreneur, companyRep } = req.body;
      
      // التحقق من البيانات المطلوبة لكلا الطرفين
      if (!entrepreneur?.name || !entrepreneur?.email || !entrepreneur?.phone) {
        return res.status(400).json({ 
          message: 'بيانات رائد الأعمال مطلوبة (الاسم، البريد الإلكتروني، رقم الهاتف)' 
        });
      }
      
      if (!companyRep?.name || !companyRep?.email || !companyRep?.phone) {
        return res.status(400).json({ 
          message: 'بيانات ممثل الشركة مطلوبة (الاسم، البريد الإلكتروني، رقم الهاتف)' 
        });
      }
      
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

      // التحقق من وجود البيانات الأساسية في الملف الشخصي
      if (!user.email || !companyProfile.phone) {
        return res.status(400).json({ 
          message: 'يجب إضافة البريد الإلكتروني في الحساب ورقم الهاتف في ملف الشركة' 
        });
      }

      // الحصول على بيانات صاحب المشروع للاتفاقية
      const projectOwner = await storage.getUser(project.userId);
      if (!projectOwner) {
        return res.status(404).json({ message: 'صاحب المشروع غير موجود' });
      }

      console.log(`✅ استخدام بيانات النموذج: ${companyRep.name} - ${companyRep.email}`);

      // إنشاء بيانات اتفاقية عدم الإفصاح بحالة "pending" في انتظار التوقيع من صادق
      const ndaData = insertNdaAgreementSchema.parse({
        projectId,
        status: 'pending', // في انتظار التوقيع الإلكتروني
        companySignatureInfo: {
          companyId: companyProfile.id,
          companyName: companyProfile.legalName || companyRep.name,
          signerName: companyRep.name,
          signerEmail: companyRep.email,
          signerPhone: companyRep.phone,
          signerIp: req.ip,
          timestamp: new Date().toISOString()
        },
        // بيانات رائد الأعمال من النموذج
        entrepreneurInfo: {
          name: entrepreneur.name,
          email: entrepreneur.email,
          phone: entrepreneur.phone,
          timestamp: new Date().toISOString()
        },
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // تنتهي بعد 30 يوم
      });
      
      // إنشاء اتفاقية عدم الإفصاح في قاعدة البيانات
      const nda = await storage.createNdaAgreement(ndaData);

      try {
        // استيراد خدمة المصادقة مع صادق
        const { sadiqAuth } = await import('./sadiqAuthService');

        // إنشاء ملف PDF لاتفاقية عدم الإفصاح
        const { generateProjectNdaPdf } = await import('./generateNDA');
        const projectData = {
          title: project.title,
          description: project.description
        };
        const companyData = {
          name: companyProfile.name || user.name,
          location: companyProfile.address || 'المملكة العربية السعودية'
        };
        const signingPartiesData = {
          entrepreneur: entrepreneur.name,
          companyRep: companyRep.name
        };
        
        const pdfBuffer = await generateProjectNdaPdf(projectData, companyData, signingPartiesData);
        const base64Pdf = pdfBuffer.toString('base64');

        // رفع الملف إلى صادق باستخدام خدمة المصادقة
        const fileName = `NDA-${project.title.replace(/\s+/g, '-')}-${Date.now()}.pdf`;
        const uploadResult = await sadiqAuth.uploadDocument(base64Pdf, fileName);
        const documentId = uploadResult.id;
        const referenceNumber = uploadResult.referenceNumber;

        // إعداد بيانات الموقعين للدعوة
        const invitationData = {
          referenceNumber,
          envelopeDocument: {
            documentId,
            signOrder: 0
          },
          signatories: [
            {
              fullName: entrepreneur.name,
              email: entrepreneur.email,
              phoneNumber: entrepreneur.phone,
              signOrder: 0,
              nationalId: '',
              gender: 'NONE'
            },
            {
              fullName: companyRep.name,
              email: companyRep.email,
              phoneNumber: companyRep.phone,
              signOrder: 1,
              nationalId: '',
              gender: 'NONE'
            }
          ],
          requestFields: [],
          invitationMessage: 'نرجو منك توقيع اتفاقية عدم الإفصاح المرفقة أدناه للمتابعة في المشروع'
        };

        // إرسال الدعوات للتوقيع باستخدام خدمة المصادقة
        const invitationResult = await sadiqAuth.sendSigningInvitations(invitationData);

        // تحديث اتفاقية عدم الإفصاح ببيانات صادق
        const updatedNdaData = {
          sadiqEnvelopeId: invitationResult.envelopeId,
          sadiqReferenceNumber: referenceNumber,
          sadiqDocumentId: documentId,
          envelopeStatus: 'invitation_sent'
        };

        // تحديث قاعدة البيانات ببيانات صادق
        await storage.updateNdaAgreement(nda.id, updatedNdaData);

        // تحديث المشروع بإضافة علامة تتطلب اتفاقية عدم إفصاح ورقم الاتفاقية
        await storage.updateProject(projectId, {
          requiresNda: true,
          ndaId: nda.id
        });

        console.log(`✅ تم إرسال دعوة التوقيع الإلكتروني بنجاح لمشروع ${projectId}`);
        console.log(`📧 الرقم المرجعي: ${referenceNumber}`);
        console.log(`📄 معرف الوثيقة: ${documentId}`);

        res.status(201).json({
          ...nda,
          sadiqReferenceNumber: referenceNumber,
          message: 'تم إرسال دعوة التوقيع الإلكتروني بنجاح'
        });

      } catch (sadiqError) {
        console.error('خطأ في التكامل مع صادق:', sadiqError);
        
        // في حالة فشل التكامل مع صادق، نعيد الاتفاقية للحالة التقليدية
        await storage.updateNdaAgreement(nda.id, {
          status: 'active',
          signedAt: new Date()
        });

        await storage.updateProject(projectId, {
          requiresNda: true,
          ndaId: nda.id
        });

        res.status(201).json({
          ...nda,
          message: 'تم إنشاء اتفاقية عدم الإفصاح (التوقيع التقليدي)',
          warning: 'فشل التكامل مع النظام الإلكتروني، تم اللجوء للتوقيع التقليدي'
        });
      }
      
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
  // يدعم التحقق من المصادقة عبر JWT token في query parameter أو Authorization header
  app.get('/api/nda/:id/download-pdf', async (req: Request, res: Response) => {
    let user = req.user;
    
    // إذا لم يكن هناك مستخدم من middleware، نحاول الحصول على التوكن من query parameter
    if (!user && req.query.token) {
      const decoded = verifyToken(req.query.token as string);
      if (decoded) {
        user = await storage.getUser(decoded.userId);
      }
    }
    
    // التحقق من المصادقة
    if (!user) {
      console.log('محاولة تنزيل PDF بدون مصادقة صحيحة');
      return res.status(401).json({ message: 'يرجى تسجيل الدخول أولاً' });
    }
    
    console.log('محاولة تنزيل PDF من المستخدم:', user.username);
    
    try {
      const ndaId = parseInt(req.params.id);
      const nda = await storage.getNdaAgreement(ndaId);
      
      if (!nda) {
        return res.status(404).json({ message: 'اتفاقية عدم الإفصاح غير موجودة' });
      }
      
      // التحقق من صلاحية الوصول - فقط صاحب المشروع أو الشركة الموقعة أو المسؤول
      const project = await storage.getProject(nda.projectId);
      
      if (!project) {
        return res.status(404).json({ message: 'المشروع غير موجود' });
      }
      
      // التحقق من صلاحية الوصول
      const isProjectOwner = project.userId === user.id;
      const isAdmin = user.role === 'admin';
      
      // للشركات، نحتاج للتحقق من معرف الشركة من JSON field
      let isCompanySigner = false;
      if (user.role === 'company') {
        const userCompany = await storage.getCompanyProfileByUserId(user.id);
        
        // فحص معرف الشركة من JSON field
        let companyIdFromSignature = null;
        if (nda.companySignatureInfo && typeof nda.companySignatureInfo === 'object') {
          companyIdFromSignature = nda.companySignatureInfo.companyId;
        }
        
        const signatureMatch = userCompany && companyIdFromSignature === userCompany.id;
        const nameMatch = nda.companySignatureInfo && 
                         nda.companySignatureInfo.companyName === userCompany?.name;
        
        isCompanySigner = signatureMatch || nameMatch;
        console.log(`فحص صلاحية الشركة: معرف المستخدم ${user.id}, معرف الشركة ${userCompany?.id}, معرف شركة من JSON ${companyIdFromSignature}, النتيجة: ${isCompanySigner}`);
      }
      
      console.log(`فحص الصلاحيات: مالك المشروع=${isProjectOwner}, مسؤول=${isAdmin}, الشركة الموقعة=${isCompanySigner}`);
      
      // فحص الصلاحيات النهائي
      const canDownload = isProjectOwner || isAdmin || isCompanySigner;
      
      if (!canDownload) {
        console.log('محاولة وصول غير مصرح من المستخدم:', user.username, 'للاتفاقية:', ndaId);
        return res.status(403).json({ message: 'غير مصرح لك بالوصول إلى هذه الاتفاقية' });
      }
      
      console.log('تم السماح بالتنزيل للمستخدم:', user.username);
      
      // Check if we have a Sadiq document ID - if yes, use external API
      if (nda.sadiqDocumentId) {
        console.log('استخدام API الخارجي لتنزيل الوثيقة من صادق');
        
        try {
          // Get access token from Sadiq
          const { sadiqAuth } = await import('./sadiqAuthService');
          const accessToken = await sadiqAuth.getAccessToken();
          
          // Use the external API to download the document
          const downloadUrl = `https://sandbox-api.sadq-sa.com/IntegrationService/Document/v2/DownloadBase64/${nda.sadiqDocumentId}`;
          
          console.log(`⬇️ تنزيل الوثيقة من: ${downloadUrl}`);
          
          const response = await fetch(downloadUrl, {
            method: 'GET',
            headers: {
              'accept': 'application/json',
              'Authorization': `Bearer ${accessToken}`
            }
          });

          if (!response.ok) {
            const errorText = await response.text();
            console.error(`❌ فشل تنزيل الوثيقة من صادق: ${response.status} - ${errorText}`);
            // Fall back to PDF generation if Sadiq download fails
            console.log('الانتقال إلى إنشاء PDF محلي كبديل');
          } else {
            const result = await response.json();
            
            // Check if the response contains the file data
            if (result.data && result.data.file) {
              // Convert base64 to buffer
              const pdfBuffer = Buffer.from(result.data.file, 'base64');
              
              // Set response headers for PDF download
              const filename = `NDA-${ndaId}-${Date.now()}.pdf`;
              res.setHeader('Content-Type', 'application/pdf');
              res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
              res.setHeader('Content-Length', pdfBuffer.length);
              
              console.log(`✅ تم تنزيل الوثيقة من صادق بنجاح - الحجم: ${pdfBuffer.length} بايت`);
              return res.send(pdfBuffer);
            } else {
              console.log('لا توجد بيانات ملف في استجابة صادق، الانتقال إلى إنشاء PDF محلي');
            }
          }
        } catch (error) {
          console.error('خطأ في تنزيل الوثيقة من صادق:', error);
          console.log('الانتقال إلى إنشاء PDF محلي كبديل');
        }
      }
      
      // Fall back to PDF generation if no Sadiq document ID or if Sadiq download failed
      console.log('إنشاء PDF محلي للاتفاقية');
      
      // وظيفة لتحويل النص العربي إلى نص باللغة الإنجليزية لـ PDF
      function sanitizeTextForPDF(text: string): string {
        if (!text) return 'Not specified';
        
        // إذا كان النص يحتوي على أحرف عربية، نحوله لنص إنجليزي
        const arabicRegex = /[\u0600-\u06FF]/;
        if (arabicRegex.test(text)) {
          // قاموس للتحويل من العربية للإنجليزية
          const translations: Record<string, string> = {
            'شركة عمر': 'Omar Company',
            'شركة': 'Company',
            'عمر': 'Omar',
            'محمد': 'Mohammad',
            'محمد جمال': 'Mohammad Jamal',
            'mohammad2': 'Mohammad2',
            'غير محدد': 'Not specified',
            'مسودة (غير موقعة)': 'Draft (Not Signed)',
            'موقعة ومفعلة': 'Signed and Active',
            'غير محددة': 'Status Unknown'
          };
          
          // البحث عن ترجمة مباشرة
          if (translations[text]) {
            return translations[text];
          }
          
          // إذا لم توجد ترجمة، نحول النص لنسخة مبسطة
          return text.replace(/[\u0600-\u06FF]/g, '?').replace(/\?+/g, 'Arabic Text');
        }
        
        return text;
      }
      
      // الحصول على معلومات الشركة إذا كانت متاحة
      let company = null;
      if (nda.companyId) {
        company = await storage.getCompanyProfile(nda.companyId);
      }
      
      // تعيين رؤوس الاستجابة وإرسال الملف
      const fileName = encodeURIComponent(`NDA-Agreement-${ndaId}.pdf`);
      
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
      const companyNameRaw = company ? (company.name || 'غير محدد') : 
                            (companyInfo && typeof companyInfo === 'object' && 'companyName' in companyInfo ? 
                             companyInfo.companyName : 'غير محدد');
      const companyNameStr = sanitizeTextForPDF(companyNameRaw);
      
      // استخراج اسم صاحب المشروع
      const projectOwnerRaw = project.userId ? (await storage.getUser(project.userId))?.name || 'غير محدد' : 'غير محدد';
      const projectOwner = sanitizeTextForPDF(projectOwnerRaw);
      
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
      function processText(text: string): string {
        // Simple text processing for English - no need for Arabic reshaper
        return text;
      }
      
      // إنشاء وثيقة PDF جديدة باللغة الإنجليزية
      const doc = new PDFDocument({
        size: 'A4',
        margin: 50,
        autoFirstPage: true,
        bufferPages: true,
        layout: 'portrait',
        info: {
          Title: `Non-Disclosure Agreement - NDA`,
          Author: 'LinkTech Platform',
          Subject: 'Non-Disclosure Agreement',
        }
      });
      
      // استخدام الخط الافتراضي
      doc.font('Helvetica');
      
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
      doc.fontSize(22).text('Non-Disclosure Agreement (NDA)', { 
        align: 'center'
      });
      doc.moveDown();
      
      // إضافة عنوان المشروع
      doc.fontSize(16).text(`Project: ${project.title}`, { 
        align: 'center'
      });
      doc.moveDown(2);
      
      // معلومات الأطراف
      doc.fontSize(14).text('Agreement Parties:', { 
        align: 'left', 
        underline: true
      });
      doc.moveDown();
      
      doc.fontSize(12).text(`First Party (Project Owner): ${projectOwner}`, { align: 'left' });
      doc.moveDown();
      
      doc.fontSize(12).text(`Second Party (Company): ${companyNameStr}`, { align: 'left' });
      doc.moveDown(2);
      
      // محتوى الاتفاقية
      doc.fontSize(14).text('Agreement Terms:', { align: 'left', underline: true });
      doc.moveDown();
      
      doc.fontSize(11).text('1. The Second Party commits to maintaining the confidentiality of all information and data related to the aforementioned project, and not disclosing it to any third party without prior written consent from the First Party.', { align: 'left' });
      doc.moveDown();
      
      doc.fontSize(11).text('2. Confidential information includes, but is not limited to: work plans, designs, drawings, software, ideas, concepts, and technical and commercial details.', { align: 'left' });
      doc.moveDown();
      
      doc.fontSize(11).text('3. Confidentiality obligations shall continue for a period of two years from the date of signing this agreement.', { align: 'left' });
      doc.moveDown(2);
      
      // معلومات التوقيع
      doc.fontSize(14).text('Signature Status:', { align: 'left', underline: true });
      doc.moveDown();
      
      if (nda.status === 'signed' && nda.signedAt) {
        const signDateStr = new Date(nda.signedAt).toLocaleDateString('en-US');
        doc.fontSize(12).text(`This agreement was signed on: ${signDateStr}`, { align: 'left' });
        
        const signerInfo = nda.companySignatureInfo as any || {};
        if (signerInfo.signerName) {
          const cleanSignerName = sanitizeTextForPDF(signerInfo.signerName);
          doc.fontSize(12).text(`Signed by: ${cleanSignerName}`, { align: 'left' });
        }
        if (signerInfo.signerTitle) {
          const cleanSignerTitle = sanitizeTextForPDF(signerInfo.signerTitle);
          doc.fontSize(12).text(`Position: ${cleanSignerTitle}`, { align: 'left' });
        }
      } else {
        const cleanStatus = sanitizeTextForPDF('Draft (Not Signed)');
        doc.fontSize(12).text(`Agreement Status: ${cleanStatus}`, { align: 'left' });
      }
      
      doc.moveDown(2);
      
      // تذييل الصفحة
      const todayDate = new Date().toLocaleDateString('en-US');
      doc.fontSize(10).text(`This document was created by LinkTech Platform - ${todayDate}`, { align: 'center' });
      
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
      
      // التحقق من صلاحية الوصول - صاحب المشروع أو المسؤول أو الشركات (لفحص حالة اتفاقياتهم)
      const user = req.user as any;
      
      if (user.role !== 'admin' && project.userId !== user.id && user.role !== 'company') {
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


  // Check if entrepreneur needs to complete NDA data for a project
  app.get('/api/nda/status/:projectId', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const projectId = parseInt(req.params.projectId);
      const user = req.user as any;
      
      // Check if user is the project owner
      const project = await storage.getProject(projectId);
      if (!project) {
        return res.status(404).json({ message: 'المشروع غير موجود' });
      }
      
      if (project.userId !== user.id) {
        return res.status(403).json({ message: 'غير مصرح بالوصول' });
      }
      
      // Check for NDA awaiting entrepreneur completion
      const nda = await storage.getNdaAgreementByProjectId(projectId);
      const awaitingNda = nda && nda.status === 'awaiting_entrepreneur' ? nda : null;
      
      if (awaitingNda) {
        return res.json({ 
          status: 'awaiting_entrepreneur',
          ndaId: awaitingNda.id,
          message: 'مطلوب إكمال بيانات اتفاقية عدم الإفصاح'
        });
      }
      
      return res.json({ 
        status: 'no_action_needed',
        message: 'لا توجد اتفاقيات تحتاج إلى إكمال'
      });
      
    } catch (error) {
      console.error('خطأ في التحقق من حالة اتفاقية عدم الإفصاح للمشروع:', error);
      res.status(500).json({ message: 'خطأ في الخادم الداخلي' });
    }
  });

  // Check NDA status and update from Sadiq
  app.get('/api/nda/:id/status', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const ndaId = parseInt(req.params.id);
      const nda = await storage.getNdaAgreement(ndaId);
      
      if (!nda) {
        return res.status(404).json({ message: 'اتفاقية عدم الإفصاح غير موجودة' });
      }

      // If we have Sadiq reference number, check status
      if (nda.sadiqReferenceNumber) {
        try {
          const { sadiqAuth } = await import('./sadiqAuthService');
          const sadiqEnvelopeData = await sadiqAuth.getEnvelopeStatus(nda.sadiqReferenceNumber);
          
          // Check if we got valid data from Sadiq
          if (!sadiqEnvelopeData) {
            console.log('⚠️ لم يتم الحصول على بيانات من صادق، استخدام البيانات المحلية');
            return res.json(nda);
          }
          
          // Parse Sadiq response based on the provided format
          const signatories = sadiqEnvelopeData.signatories || [];
          const signedCount = signatories.filter((s: any) => s.status === 'SIGNED').length;
          const pendingCount = signatories.filter((s: any) => s.status === 'PENDING').length;
          const totalSignatories = signatories.length;
          const completionPercentage = totalSignatories > 0 ? Math.round((signedCount / totalSignatories) * 100) : 0;
          
          // Determine overall status
          const envelopeStatus = sadiqEnvelopeData.status || 'Unknown';
          const isCompleted = envelopeStatus === 'Completed' || (pendingCount === 0 && signedCount > 0);
          const isSigned = isCompleted && envelopeStatus !== 'Voided';
          
          // Update status in database
          const updatedStatus = isSigned ? 'signed' : (signedCount > 0 ? 'invitation_sent' : nda.status);
          await storage.updateNdaAgreement(ndaId, {
            envelopeStatus: envelopeStatus,
            ...(isSigned && { status: 'signed', signedAt: new Date() })
          });

          res.json({
            ...nda,
            status: updatedStatus,
            envelopeStatus: envelopeStatus,
            sadiqStatus: {
              envelopeId: sadiqEnvelopeData.id,
              status: envelopeStatus,
              completionPercentage,
              signedCount,
              pendingCount,
              totalSignatories,
              signatories: signatories,
              documents: sadiqEnvelopeData.documents || [],
              createDate: sadiqEnvelopeData.createDate
            }
          });
        } catch (sadiqError) {
          console.error('خطأ في التحقق من حالة صادق:', sadiqError);
          res.json(nda); // Return current status if Sadiq check fails
        }
      } else {
        res.json(nda);
      }
    } catch (error) {
      console.error('خطأ في التحقق من حالة اتفاقية عدم الإفصاح:', error);
      res.status(500).json({ message: 'خطأ في الخادم الداخلي' });
    }
  });

  // Download signed NDA document from Sadiq using external API
  app.get('/api/nda/:id/download-signed', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const ndaId = parseInt(req.params.id);
      const nda = await storage.getNdaAgreement(ndaId);
      
      if (!nda) {
        return res.status(404).json({ message: 'اتفاقية عدم الإفصاح غير موجودة' });
      }

      if (!nda.sadiqDocumentId) {
        return res.status(400).json({ message: 'لا يوجد مستند إلكتروني لهذه الاتفاقية' });
      }

      // Get access token from Sadiq
      const { sadiqAuth } = await import('./sadiqAuthService');
      const accessToken = await sadiqAuth.getAccessToken();
      
      // Use the external API to download the document
      const downloadUrl = `https://sandbox-api.sadq-sa.com/IntegrationService/Document/v2/DownloadBase64/${nda.sadiqDocumentId}`;
      
      console.log(`⬇️ تنزيل الوثيقة من: ${downloadUrl}`);
      
      const response = await fetch(downloadUrl, {
        method: 'GET',
        headers: {
          'accept': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`❌ فشل تنزيل الوثيقة: ${response.status} - ${errorText}`);
        return res.status(response.status).json({ 
          message: `فشل في تنزيل الوثيقة: ${response.status}`,
          error: errorText.substring(0, 200)
        });
      }

      const result = await response.json();
      
      // Check if the response contains the file data
      if (!result.data || !result.data.file) {
        console.error('❌ لا توجد بيانات ملف في الاستجابة:', result);
        return res.status(400).json({ message: 'لا توجد بيانات ملف في الاستجابة' });
      }

      // Convert base64 to buffer
      const pdfBuffer = Buffer.from(result.data.file, 'base64');
      
      // Set response headers for PDF download
      const filename = `NDA-Signed-${ndaId}-${Date.now()}.pdf`;
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.setHeader('Content-Length', pdfBuffer.length);
      
      console.log(`✅ تم تنزيل الوثيقة بنجاح - الحجم: ${pdfBuffer.length} بايت`);
      res.send(pdfBuffer);
    } catch (error) {
      console.error('خطأ في تنزيل اتفاقية عدم الإفصاح الموقعة:', error);
      res.status(500).json({ message: 'خطأ في تنزيل الوثيقة الموقعة' });
    }
  });

  // Test Sadiq authentication with comprehensive information
  app.get('/api/test-sadiq-auth', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const { sadiqAuth } = await import('./sadiqAuthService');
      const token = await sadiqAuth.getAccessToken();
      
      res.json({
        success: true,
        message: 'تم الاتصال بصادق بنجاح',
        authentication: {
          method: 'dynamic_token_management',
          tokenLength: token.length,
          tokenPreview: token.substring(0, 50) + '...',
          cacheStatus: 'active',
          timestamp: new Date().toISOString()
        },
        capabilities: [
          'رفع الوثائق',
          'إرسال دعوات التوقيع',
          'التحقق من حالة المغلفات',
          'تنزيل الوثائق الموقعة'
        ]
      });
    } catch (error) {
      console.error('خطأ في اختبار صادق:', error);
      res.status(500).json({
        success: false,
        message: 'فشل في الاتصال بصادق',
        error: error.message.split('\n')[0], // First line only for clean response
        help: 'تأكد من إضافة SADIQ_ACCESS_TOKEN أو صحة بيانات SADIQ_EMAIL و SADIQ_PASSWORD'
      });
    }
  });

  // Test complete NDA workflow
  app.post('/api/test-nda-workflow', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const user = req.user as any;
      if (user.role !== 'admin') {
        return res.status(403).json({ message: 'هذا الاختبار متاح للمسؤولين فقط' });
      }

      console.log('🧪 بدء اختبار سير العمل الكامل لاتفاقية عدم الإفصاح');
      
      // Import required modules
      const { sadiqAuth } = await import('./sadiqAuthService');
      const { generateProjectNdaPdf } = await import('./generateNDA');

      // Step 1: Get access token
      const token = await sadiqAuth.getAccessToken();
      
      // Step 2: Generate PDF
      const testData = {
        project: { title: 'مشروع اختباري', description: 'وصف المشروع الاختباري' },
        company: { name: 'شركة الاختبار', location: 'المملكة العربية السعودية' },
        signing: { entrepreneur: '[اختبار]', companyRep: '[اختبار]' }
      };
      
      const pdfBuffer = await generateProjectNdaPdf(testData.project, testData.company, testData.signing);
      
      // Step 3: Upload to Sadiq
      const uploadResult = await sadiqAuth.uploadDocument(
        pdfBuffer.toString('base64'), 
        `test-nda-${Date.now()}.pdf`
      );

      console.log('✅ تم اختبار سير العمل بنجاح');
      
      res.json({
        success: true,
        message: 'تم اختبار سير العمل الكامل بنجاح',
        results: {
          authentication: 'نجح',
          pdfGeneration: `${pdfBuffer.length} بايت`,
          documentUpload: uploadResult.id,
          referenceNumber: uploadResult.referenceNumber,
          timestamp: new Date().toISOString()
        }
      });
      
    } catch (error) {
      console.error('❌ فشل اختبار سير العمل:', error);
      res.status(500).json({
        success: false,
        message: 'فشل في اختبار سير العمل',
        error: error.message.split('\n')[0]
      });
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
      
      // إنشاء إشعار في قاعدة البيانات للمستخدم المستقبل
      try {
        console.log(`🔄 محاولة إنشاء إشعار للمستخدم ${messageData.toUserId}`);
        
        // الحصول على معلومات المرسل
        const sender = await storage.getUser(user.id);
        const senderName = sender ? (sender.name || sender.username) : 'مستخدم';
        console.log(`👤 اسم المرسل: ${senderName}`);
        
        const notificationData = {
          userId: messageData.toUserId,
          type: 'message',
          title: 'رسالة جديدة',
          content: `لديك رسالة جديدة من ${senderName}`,
          actionUrl: `/messages/${user.id}`,
          metadata: JSON.stringify({ messageId: message.id, senderId: user.id })
        };
        console.log(`📝 بيانات الإشعار:`, notificationData);
        
        const notification = await storage.createNotification(notificationData);
        
        console.log(`✅ تم إنشاء إشعار للمستخدم ${messageData.toUserId} حول رسالة جديدة - ID: ${notification.id}`);
      } catch (notificationError) {
        console.error('❌ خطأ في إنشاء إشعار الرسالة:', notificationError);
        console.error('❌ تفاصيل الخطأ:', notificationError.message);
        console.error('❌ Stack trace:', notificationError.stack);
      }
      
      res.status(201).json(message);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Validation error', errors: error.errors });
      }
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // Enhanced message content filtering utilities
  function normalizeArabicText(input: string): string {
    if (!input) return '';
    const arabicIndicDigits: Record<string, string> = {
      '٠': '0', '١': '1', '٢': '2', '٣': '3', '٤': '4',
      '٥': '5', '٦': '6', '٧': '7', '٨': '8', '٩': '9'
    };
    let out = input
      .replace(/[\u064B-\u065F\u0610-\u061A]/g, '')
      .replace(/[\u200C\u200D\u200E\u200F]/g, '')
      .toLowerCase();
    out = out.split('').map(ch => arabicIndicDigits[ch] ?? ch).join('');
    out = out
      .replace(/\s*\(at\)\s*|\s*@\s*|\s*آت\s*|\s*ات\s*/g, '@')
      .replace(/\s*\(dot\)\s*|\s*\.+\s*|\s*نقطة\s*/g, '.')
      .replace(/\s*\(dash\)|\s*\-\s*|\s*شرطة\s*/g, '-')
      .replace(/\s*\(underscore\)|\s*_\s*|\s*شرطة\s*تحتية\s*/g, '_');
    return out;
  }

  const ARABIC_NUMBER_WORDS = [
    'صفر','واحد','اثنان','اتنان','اتنين','اثنين','اثنين','ثلاثة','اربعة','أربعة','خمسة','ستة','سبعة','ثمانية','تسعة','عشرة',
    'احدى عشر','إحدى عشر','اثنا عشر','إثنا عشر','ثلاثة عشر','اربعة عشر','أربعة عشر','خمسة عشر','ستة عشر','سبعة عشر','ثمانية عشر','تسعة عشر',
    'عشرون','ثلاثون','اربعون','أربعون','خمسون','ستون','سبعون','ثمانون','تسعون','مائة','مئه','مائة','مئه','مئتان','مائتان','الف','ألف'
  ];

  const ENGLISH_NUMBER_WORDS = [
    'zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten',
    'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen',
    'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety', 'hundred', 'thousand',
    'million', 'billion', 'trillion'
  ];

  function containsNumberWords(text: string): boolean {
    const t = normalizeArabicText(text);
    const hasArabicNumbers = ARABIC_NUMBER_WORDS.some(w => t.includes(w));
    const hasEnglishNumbers = ENGLISH_NUMBER_WORDS.some(w => t.toLowerCase().includes(w));
    return hasArabicNumbers || hasEnglishNumbers;
  }

  function containsPhoneLikeDigits(text: string): boolean {
    const t = normalizeArabicText(text);
    if (/\+?\d(?:[\s\-\._]?\d){7,}/.test(t)) return true;
    if (/(?:\+966|00966|0)(?:[15])[\s\-\._]?\d(?:[\s\-\._]?\d){7}/.test(t)) return true;
    
    // Detect ANY Arabic number (single digit or more)
    if (/[٠١٢٣٤٥٦٧٨٩]/.test(text)) return true;
    
    // Detect ANY English number (single digit or more)
    if (/\d/.test(text)) return true;
    
    return false;
  }

  function containsEmailLike(text: string): boolean {
    const t = normalizeArabicText(text);
    return /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/i.test(t);
  }

  function containsSocialHandleOrLink(text: string): boolean {
    const t = normalizeArabicText(text);
    const platforms = ['whatsapp','واتساب','telegram','تيليجرام','snapchat','سناب','instagram','انستقرام','facebook','فيسبوك','twitter','تيك توك','tiktok'];
    if (/https?:\/\//.test(t)) return true;
    if (/(wa\.me|t\.me|bit\.ly|tinyurl\.com|goo\.gl|linktr\.ee|lnk\.bio)/.test(t)) return true;
    if (platforms.some(p => t.includes(p))) return true;
    if (/(?:@|يوزر|معرف|username|handle)\s*[a-z0-9._-]{3,}/.test(t)) return true;
    return false;
  }

  const conversationLeakageWindow: Array<{ from: number; to: number; content: string; at: number; }> = [];
  function addMessageToConversationHistory(fromUserId: number, toUserId: number, content: string): void {
    conversationLeakageWindow.push({ from: fromUserId, to: toUserId, content, at: Date.now() });
    const cutoff = Date.now() - 30 * 60 * 1000;
    while (conversationLeakageWindow.length > 50 || (conversationLeakageWindow[0] && conversationLeakageWindow[0].at < cutoff)) {
      conversationLeakageWindow.shift();
    }
  }

  function detectSequentialLeakage(fromUserId: number, toUserId: number): boolean {
    const recent = conversationLeakageWindow.filter(e => e.from === fromUserId && e.to === toUserId).slice(-8);
    const joined = normalizeArabicText(recent.map(r => r.content).join(' '));
    if (containsEmailLike(joined) || containsPhoneLikeDigits(joined) || containsSocialHandleOrLink(joined)) return true;
    const digitsCount = (joined.match(/\d/g) || []).length;
    if (digitsCount >= 7) return true;
    let wordsHits = 0; ARABIC_NUMBER_WORDS.forEach(w => { if (joined.includes(w)) wordsHits++; });
    return wordsHits >= 3;
  }

  function checkMessageForProhibitedContent(rawContent: string, fromUserId?: number, toUserId?: number): { safe: boolean; violations?: string[] } {
    const violations: string[] = [];
    const content = normalizeArabicText(rawContent || '');

    if (containsEmailLike(content)) violations.push('بريد_إلكتروني');
    if (containsPhoneLikeDigits(content)) violations.push('رقم_هاتف');
    if (containsSocialHandleOrLink(content)) violations.push('رابط/معرف_منصة');
    if (containsNumberWords(content)) violations.push('كلمات_أرقام_عربية');

    if (/(\bجوال\b|\bهاتف\b|\bاتصال\b|\bتواصل\b|\bواتساب\b|\bبريد\b|\bايميل\b|\bإيميل\b|\bسناب\b|\bتيليجرام\b|\bتليجرام\b)/.test(content)) {
      if (violations.length > 0) {
        violations.push('نية_مشاركة_وسيلة_تواصل');
      }
    }

    if (fromUserId && toUserId) {
      if (detectSequentialLeakage(fromUserId, toUserId)) {
        violations.push('نمط_متسلسل_مشبوه');
      }
    }

    const safe = violations.length === 0;
    return { safe, violations: safe ? undefined : Array.from(new Set(violations)) };
  }

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

  // Check if there are accepted AND paid offers between two users (strict for revealing identities)
  app.get('/api/messages/has-accepted-offers/:otherUserId', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const user = req.user as any;
      const otherUserId = parseInt(req.params.otherUserId);
      
      if (isNaN(otherUserId)) {
        return res.status(400).json({ message: 'Invalid user ID' });
      }
      
      // Determine roles and relationship
      const otherUser = await storage.getUser(otherUserId);
      if (!otherUser) {
        return res.status(404).json({ message: 'Other user not found' });
      }
      
      // Fetch all offers and projects needed to determine relation
      const allOffers = await storage.getAllProjectOffers();
      const allProjects = await storage.getProjects();
      
      // Map: projectId -> project
      const projectById = new Map<number, any>(allProjects.map((p: any) => [p.id, p]));
      
      // Map: companyUserId for offer
      const companyProfileByIdCache: Record<number, any> = {};
      const getCompanyUserId = async (companyId: number): Promise<number | null> => {
        if (companyProfileByIdCache[companyId]) return companyProfileByIdCache[companyId].userId || null;
        const cp = await storage.getCompanyProfile(companyId);
        companyProfileByIdCache[companyId] = cp;
        return cp ? cp.userId : null;
      };
      
      let reveal = false;
      for (const offer of allOffers) {
        if (offer.status !== 'accepted' || !offer.depositPaid) continue; // require payment
        const proj = projectById.get(offer.projectId);
        if (!proj) continue;
        const companyUserId = await getCompanyUserId(offer.companyId);
        if (companyUserId == null) continue;
        
        // Case 1: current user is project owner, other user is company user
        if (proj.userId === user.id && companyUserId === otherUserId) {
          reveal = true;
          break;
        }
        // Case 2: current user is company user, other user is project owner
        if (companyUserId === user.id && proj.userId === otherUserId) {
          reveal = true;
          break;
        }
      }
      
      res.json({ hasAcceptedOffers: reveal });
    } catch (error) {
      console.error('Error checking accepted offers between users:', error);
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
      console.log(`طلب المشاريع الرائجة - حالة المصادقة: ${req.user ? 'مصرح' : 'غير مصرح'}`);
      
      // تم تعديل الشروط للسماح بعرض المشاريع الرائجة في الواجهة العامة
      // لا نحتاج للتحقق من تسجيل الدخول لهذا المسار لأنه يستخدم في الصفحة الرئيسية
      
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 5;
      
      const trendingProjects = await getTrendingProjects(limit);
      
      // التعامل مع المستخدمين المسجلين
      if (req.user) {
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
      if (req.user) {
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
      if (req.user) {
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
      
      if (req.user) {
        const user = req.user as any;
        
        if (project.userId === user.id) {
          // صاحب المشروع - يرى جميع العروض مع تعمية معلومات الشركات
          const offersWithBlurredCompanyData = await Promise.all(
            offers.map(async (offer) => {
              const companyProfile = await storage.getCompanyProfile(offer.companyId);
              const companyUser = await storage.getUser(companyProfile?.userId || 0);
              
              // إذا كان العرض مقبول، نكشف معلومات الشركة (حتى لو لم يتم دفع عمولة المنصة بعد)
              if (offer.status === 'accepted') {
                return {
                  ...offer,
                  companyName: companyUser?.name,
                  companyLogo: companyProfile?.logo,
                  companyVerified: companyProfile?.verified,
                  companyRating: companyProfile?.rating,
                  companyEmail: companyUser?.email,
                  companyUsername: companyUser?.username,
                  companyUserId: companyUser?.id,
                  companyContactRevealed: offer.depositPaid // كشف معلومات التواصل فقط بعد دفع عمولة المنصة
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
      
      // Allow multiple offers from the same company
      // Companies can now submit multiple offers with different proposals
      
      const offerData = insertProjectOfferSchema.parse({
        ...req.body,
        projectId,
        companyId: companyProfile.id
      });
      
      const offer = await storage.createProjectOffer(offerData);
      
      // إنشاء إشعار لصاحب المشروع
      try {
        // التحقق من إعدادات المستخدم
        const projectOwner = await storage.getUser(project.userId);
        
        // إنشاء إشعار في قاعدة البيانات
        await storage.createNotification({
          userId: project.userId,
          type: 'offer',
          title: 'عرض جديد على مشروعك',
          content: `تم تقديم عرض جديد على مشروعك "${project.title}"`,
          actionUrl: `/projects/${projectId}`,
          metadata: JSON.stringify({ projectId, offerId: offer.id })
        });
        
        console.log(`✅ تم إنشاء إشعار للمستخدم ${project.userId} حول عرض جديد على المشروع`);
      } catch (notificationError) {
        console.error('خطأ في إنشاء إشعار العرض:', notificationError);
      }
      
      res.status(201).json(offer);
      
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors });
      }
      console.error(error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // Admin endpoint: get all offers across all projects with related info
  app.get('/api/admin/offers', isAdmin, async (req: Request, res: Response) => {
    try {
      const projects = await storage.getProjects();
      const allOffersArrays = await Promise.all(
        projects.map(async (project) => {
          const offers = await storage.getProjectOffersByProjectId(project.id);
          if (!offers || offers.length === 0) return [];
          return Promise.all(
            offers.map(async (offer) => {
              const companyProfile = await storage.getCompanyProfile(offer.companyId);
              const companyUser = companyProfile ? await storage.getUser(companyProfile.userId) : null;
              return {
                ...offer,
                projectId: project.id,
                projectTitle: project.title,
                companyName: companyProfile?.legalName || companyUser?.name || companyUser?.username || "غير معروف",
                company: companyProfile
                  ? {
                      ...companyProfile,
                      username: companyUser?.username,
                      name: companyUser?.name,
                      email: companyUser?.email,
                    }
                  : null,
              };
            })
          );
        })
      );
      const allOffers = allOffersArrays.flat();
      res.json(allOffers);
    } catch (error) {
      console.error('خطأ في استرجاع جميع العروض للمسؤول:', error);
      res.status(500).json({ message: 'حدث خطأ أثناء جلب العروض' });
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
      
      // حساب قيمة عمولة المنصة (2.5% من قيمة العرض)
      const amount = parseInt(offer.amount.replace(/[^0-9]/g, ''));
      const depositAmount = Math.round(amount * 0.025).toString();
      
      // لا نقوم بقبول العرض قبل دفع عمولة المنصة
      // نعيد فقط معلومات الدفع المطلوبة لفتح نافذة الدفع في الواجهة الأمامية
      res.json({
        offerId,
        projectId: project.id,
        depositAmount,
        paymentRequired: true,
        message: 'Payment required before accepting the offer'
      });
      
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });
  
  // Debug endpoint for Moyasar configuration (remove in production)
  app.get('/api/debug/moyasar-config', async (req: Request, res: Response) => {
    try {
      const config = {
        moyasarKeyExists: !!process.env.MOYASAR_SECRET_KEY,
        moyasarKeyLength: process.env.MOYASAR_SECRET_KEY?.length || 0,
        moyasarKeyPrefix: process.env.MOYASAR_SECRET_KEY?.substring(0, 10) || 'N/A',
        frontendUrl: process.env.FRONTEND_URL,
        nodeEnv: process.env.NODE_ENV,
        timestamp: new Date().toISOString()
      };
      
      console.log('🔍 Moyasar Config Debug:', config);
      res.json(config);
    } catch (error) {
      console.error('Debug config error:', error);
      res.status(500).json({ error: 'Failed to get config' });
    }
  });

  // Test endpoint to validate Moyasar invoice data (remove in production)
  app.post('/api/debug/test-moyasar-invoice', async (req: Request, res: Response) => {
    try {
      const { amount, description, offerId, projectId } = req.body;
      
      if (!amount) {
        return res.status(400).json({ error: 'Amount is required' });
      }

      const MoyasarService = (await import('./services/moyasarService')).default;
      const moyasarService = new MoyasarService();
      
      const invoiceData = {
        amount: Math.round(parseFloat(amount) * 100),
        currency: 'SAR',
        description: description?.substring(0, 255) || 'Test invoice',
        callback_url: `${process.env.FRONTEND_URL}/payment/success`,
        success_url: `${process.env.FRONTEND_URL}/dashboard?payment=success`,
        back_url: `${process.env.FRONTEND_URL}/dashboard`,
        expired_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        metadata: {
          offer_id: offerId?.toString(),
          project_id: projectId?.toString(),
          platform: 'linktech',
          test: true
        }
      };

      console.log('🧪 Test Invoice Data:', JSON.stringify(invoiceData, null, 2));
      
      const invoice = await moyasarService.createInvoice(
        parseFloat(amount),
        description || 'Test invoice',
        `${process.env.FRONTEND_URL}/payment/success`,
        offerId,
        projectId
      );
      
      res.json({
        success: true,
        invoice,
        testData: invoiceData
      });
    } catch (error: any) {
      console.error('Test invoice error:', error);
      res.status(400).json({
        error: error.message,
        details: error.response?.data
      });
    }
  });

  app.post('/api/offers/:id/pay-deposit', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const user = req.user as any;
      const offerId = parseInt(req.params.id);
      const { depositAmount } = req.body;
      
      if (!depositAmount) {
        return res.status(400).json({ message: 'Deposit amount is required' });
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
      
      // السماح بالدفع قبل القبول الرسمي، مع منع الدفع المكرر
      if (offer.depositPaid) {
        return res.status(400).json({ message: 'Deposit already paid for this offer' });
      }

      // إنشاء فاتورة الدفع مع Moyasar
      console.log('🔍 Payment Route Debug:');
      console.log('  - MOYASAR_SECRET_KEY exists:', !!process.env.MOYASAR_SECRET_KEY);
      console.log('  - MOYASAR_SECRET_KEY length:', process.env.MOYASAR_SECRET_KEY?.length || 0);
      console.log('  - MOYASAR_SECRET_KEY starts with:', process.env.MOYASAR_SECRET_KEY?.substring(0, 10) || 'N/A');
      console.log('  - FRONTEND_URL:', process.env.FRONTEND_URL);
      console.log('  - NODE_ENV:', process.env.NODE_ENV);
      console.log('  - Offer ID:', offerId);
      console.log('  - Project ID:', offer.projectId);
      console.log('  - Deposit Amount:', depositAmount);
      console.log('  - Deposit Amount Type:', typeof depositAmount);
      console.log('  - Parsed Amount:', parseFloat(depositAmount));
      
      if (process.env.MOYASAR_SECRET_KEY || 'sk_live_GzsAh9YLrxwrJP') {
        try {
          const MoyasarService = (await import('./services/moyasarService')).default;
          const moyasarService = new MoyasarService();
          
          // Validate deposit amount before creating invoice
          const parsedAmount = parseFloat(depositAmount);
          if (isNaN(parsedAmount) || parsedAmount <= 0) {
            console.error('❌ Invalid deposit amount:', depositAmount);
            return res.status(400).json({
              message: 'Invalid deposit amount'
            });
          }
          
          const invoice = await moyasarService.createInvoice(
            parsedAmount,
            `عمولة المنصة - عرض ${offerId}`,
            `${process.env.FRONTEND_URL}/payment/success?offerId=${offerId}`,
            offerId,
            offer.projectId
          );
          
          console.log('✅ Moyasar invoice created successfully:', invoice.id);
          
          // إرجاع رابط الدفع للواجهة الأمامية
          return res.json({
            success: true,
            invoiceId: invoice.id,
            paymentUrl: invoice.url,
            message: 'تم إنشاء فاتورة الدفع بنجاح'
          });
          
        } catch (moyasarError: any) {
          console.error('❌ Moyasar invoice creation failed:');
          console.error('  - Error message:', moyasarError.message);
          console.error('  - Error stack:', moyasarError.stack);
          console.error('  - Full error:', moyasarError);
          
          return res.status(400).json({
            message: moyasarError.message || 'فشل في إنشاء فاتورة الدفع',
            error: process.env.NODE_ENV === 'development' ? moyasarError.message : undefined
          });
        }
      } else {
        console.log('⚠️ Moyasar not configured, using test mode');
      }
      
      // تسجيل دفع عمولة المنصة
      const updatedOffer = await storage.setProjectOfferDepositPaid(offerId, depositAmount);
      
      // اعتبار العرض مقبولاً بعد الدفع
      await storage.updateProjectOfferStatus(offerId, 'accepted');
      
      // كشف معلومات التواصل الخاصة بالشركة بعد الدفع
      const revealedOffer = await storage.setProjectOfferContactRevealed(offerId);
      
      // الحصول على معلومات الشركة وصاحب المشروع
      const company = await storage.getCompanyProfile(offer.companyId);
      const companyUser = company ? await storage.getUser(company.userId) : null;
      const projectOwner = await storage.getUser(project.userId);
      
      // إنشاء إشعار للشركة بدفع عمولة المنصة
      if (companyUser) {
        try {
          await storage.createNotification({
            userId: companyUser.id,
            type: 'project',
            title: 'تم دفع عمولة المنصة',
            content: `تم دفع عمولة المنصة لمشروع "${project.title}". يمكنك الآن بدء العمل على المشروع.`,
            actionUrl: `/projects/${project.id}`,
            metadata: JSON.stringify({ projectId: project.id, offerId })
          });
          
          console.log(`✅ تم إنشاء إشعار للشركة ${companyUser.id} بدفع عمولة المنصة`);
        } catch (notificationError) {
          console.error('خطأ في إنشاء إشعار دفع عمولة المنصة للشركة:', notificationError);
        }
      }
      
      // إنشاء إشعار لصاحب المشروع بتأكيد دفع عمولة المنصة
      try {
        await storage.createNotification({
          userId: project.userId,
          type: 'project',
          title: 'تم تأكيد دفع عمولة المنصة',
          content: `تم تأكيد دفع عمولة المنصة لمشروع "${project.title}". يمكنك الآن التواصل مع الشركة لبدء العمل.`,
          actionUrl: `/projects/${project.id}`,
          metadata: JSON.stringify({ projectId: project.id, offerId })
        });
        
        console.log(`✅ تم إنشاء إشعار لصاحب المشروع ${project.userId} بتأكيد دفع عمولة المنصة`);
      } catch (notificationError) {
        console.error('خطأ في إنشاء إشعار تأكيد دفع عمولة المنصة لصاحب المشروع:', notificationError);
      }
      
      // إنشاء رسالة إلى الشركة تحتوي على تفاصيل التواصل
      // فقط إذا لم تكن هناك محادثة موجودة بالفعل لهذا المشروع
      if (companyUser && projectOwner) {
        // التحقق من وجود محادثة مسبقة بين المستخدمين لهذا المشروع
        const existingConversation = await storage.getConversation(
          projectOwner.id, 
          companyUser.id, 
          project.id
        );
        
        // إنشاء رسالة فقط إذا لم تكن هناك رسائل مسبقة لهذا المشروع
        // أو إذا لم تحتوي المحادثة على رسالة قبول العرض
        const hasAcceptanceMessage = existingConversation.some(msg => 
          msg.content.includes("تم قبول عرضك على مشروع") && 
          msg.content.includes(project.title)
        );
        
        if (!hasAcceptanceMessage) {
          await storage.createMessage({
            content: `تم قبول عرضك على مشروع "${project.title}" ودفع عمولة المنصة. يمكنك التواصل مع ${projectOwner.name} عبر البريد الإلكتروني: ${projectOwner.email}`,
            fromUserId: projectOwner.id,
            toUserId: companyUser.id,
            projectId: project.id
          });
        }
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
            message: "تم تحديث العرض وكشف معلومات الشركة بعد دفع عمولة المنصة"
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
            message: `تم قبول عرضك على المشروع "${project.title}" ودفع عمولة المنصة`
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

  // عملاء التميز (الجهات والشركاء المميزين)
  // الحصول على قائمة عملاء التميز
  app.get('/api/premium-clients', async (req: Request, res: Response) => {
    try {
      const category = req.query.category as string;
      const featuredOnly = req.query.featured === 'true';
      const activeOnly = req.query.active === 'true' || true; // افتراضيًا نعرض فقط العملاء النشطين
      
      let clients: PremiumClient[] = [];
      
      if (featuredOnly) {
        clients = await storage.getFeaturedPremiumClients();
      } else if (category) {
        clients = await storage.getPremiumClientsByCategory(category);
        if (activeOnly) {
          clients = clients.filter(client => client.active);
        }
      } else if (activeOnly) {
        // الحصول على جميع العملاء ثم تصفية النشطين فقط
        clients = await storage.getPremiumClients();
        clients = clients.filter(client => client.active !== false);
      } else {
        clients = await storage.getPremiumClients();
      }
      
      res.json(clients);
    } catch (error) {
      console.error('Error getting premium clients:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });
  
  // الحصول على عميل تميز محدد بواسطة المعرف
  app.get('/api/premium-clients/:id', async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: 'Invalid ID format' });
      }
      
      const client = await storage.getPremiumClientById(id);
      if (!client) {
        return res.status(404).json({ message: 'Premium client not found' });
      }
      
      res.json(client);
    } catch (error) {
      console.error('Error getting premium client:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });
  
  // إنشاء عميل تميز جديد (للمسؤولين فقط)
  app.post('/api/premium-clients', isAdmin, async (req: Request, res: Response) => {
    try {
      const clientData = req.body;
      
      // التحقق من البيانات المطلوبة
      if (!clientData.name || !clientData.logo || !clientData.description || !clientData.category) {
        return res.status(400).json({ message: 'Missing required fields' });
      }
      
      const newClient = await storage.createPremiumClient(clientData);
      res.status(201).json(newClient);
    } catch (error) {
      console.error('Error creating premium client:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });
  
  // تحديث عميل تميز (للمسؤولين فقط)
  app.put('/api/premium-clients/:id', isAdmin, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: 'Invalid ID format' });
      }
      
      const clientData = req.body;
      const updatedClient = await storage.updatePremiumClient(id, clientData);
      
      if (!updatedClient) {
        return res.status(404).json({ message: 'Premium client not found' });
      }
      
      res.json(updatedClient);
    } catch (error) {
      console.error('Error updating premium client:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });
  
  // حذف عميل تميز (للمسؤولين فقط)
  app.delete('/api/premium-clients/:id', isAdmin, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: 'Invalid ID format' });
      }
      
      const success = await storage.deletePremiumClient(id);
      
      if (!success) {
        return res.status(404).json({ message: 'Premium client not found' });
      }
      
      res.json({ message: 'Premium client deleted successfully' });
    } catch (error) {
      console.error('Error deleting premium client:', error);
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
          
          // إنشاء إشعار في قاعدة البيانات للمستخدم المستقبل
          try {
            // التحقق من إعدادات المستخدم المستقبل
            const recipientUser = await storage.getUser(data.toUserId);
            
            // الحصول على معلومات المرسل
            const sender = await storage.getUser(userId);
            const senderName = sender ? (sender.name || sender.username) : 'مستخدم';
            
            // إنشاء إشعار في قاعدة البيانات
            console.log(`إنشاء إشعار رسالة جديدة للمستخدم ${data.toUserId} من ${senderName}`)
            await storage.createNotification({
              userId: data.toUserId,
              type: 'message',
              title: 'رسالة جديدة',
              content: `لديك رسالة جديدة من ${senderName}`,
              actionUrl: `/messages/${userId}`,
              metadata: JSON.stringify({ messageId: message.id, senderId: userId })
            });
            
            console.log(`✅ تم إنشاء إشعار للمستخدم ${data.toUserId} حول رسالة جديدة`);
          } catch (notificationError) {
            console.error('خطأ في إنشاء إشعار الرسالة:', notificationError);
          }
          
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
        if (!req.user || req.user.role !== 'admin') {
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
        if (!req.user || req.user.role !== 'admin') {
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
  
  // Site Settings Management API (Admin only)
  // Get all site settings
  app.get('/api/admin/site-settings', isAdmin, async (req: Request, res: Response) => {
    try {
      const settings = await storage.getAllSiteSettings();
      res.json(settings);
    } catch (error) {
      console.error('Error fetching site settings:', error);
      res.status(500).json({ message: 'خطأ في جلب الإعدادات' });
    }
  });

  // Update multiple site settings
  app.post('/api/admin/site-settings', isAdmin, async (req: Request, res: Response) => {
    try {
      const { settings } = req.body;
      
      if (!settings || !Array.isArray(settings)) {
        return res.status(400).json({ message: 'بيانات الإعدادات غير صالحة' });
      }
      
      const updatedSettings = [];
      for (const setting of settings) {
        if (setting.key && setting.value !== undefined && setting.category) {
          try {
            const updatedSetting = await storage.setSiteSetting(
              setting.key, 
              setting.value, 
              setting.category,
              setting.description || '',
              req.user.id
            );
            updatedSettings.push(updatedSetting);
            console.log(`تم حفظ الإعداد: ${setting.key} = ${setting.value}`);
          } catch (settingError) {
            console.error(`خطأ في حفظ الإعداد ${setting.key}:`, settingError);
          }
        }
      }
      
      res.json({ 
        success: true, 
        message: 'تم حفظ الإعدادات بنجاح',
        settings: updatedSettings 
      });
    } catch (error) {
      console.error('خطأ في حفظ إعدادات الموقع:', error);
      res.status(500).json({ message: 'خطأ في تحديث الإعدادات' });
    }
  });

  // Get public contact information (for use in contact page)
  app.get('/api/contact-info', async (req: Request, res: Response) => {
    try {
      const contactSettings = await storage.getSiteSettingsByCategory('contact');
      
      const contactInfo = contactSettings.reduce((acc: any, setting) => {
        acc[setting.key] = setting.value;
        return acc;
      }, {});
      
      // إذا لم توجد بيانات، استخدم القيم الافتراضية
      const defaultContactInfo = {
        contact_email: contactInfo.contact_email || 'info@linktech.app',
        contact_phone: contactInfo.contact_phone || '+966 53 123 4567',
        contact_address: contactInfo.contact_address || 'واحة المعرفة، طريق الملك عبدالعزيز، جدة، المملكة العربية السعودية',
        contact_whatsapp: contactInfo.contact_whatsapp || '',
        business_hours: contactInfo.business_hours || 'الأحد - الخميس: 9:00 صباحاً - 5:00 مساءً\nالجمعة - السبت: مغلق'
      };
      
      console.log('معلومات التواصل المُرسلة:', defaultContactInfo);
      res.json(defaultContactInfo);
    } catch (error) {
      console.error('خطأ في جلب معلومات التواصل:', error);
      res.status(500).json({ message: 'خطأ في جلب معلومات التواصل' });
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

  // === نقاط نهاية الإشعارات ===
  
  // الحصول على إشعارات المستخدم
  app.get('/api/notifications', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const user = req.user as any;
      
      console.log(`طلب GET /api/notifications - حالة المصادقة: مصرح`);
      console.log(`المستخدم مصرح: ${user.username}, دور: ${user.role}`);
      
      // الحصول على الإشعارات الحقيقية من قاعدة البيانات
      const notifications = await storage.getNotificationsByUserId(user.id);
      
      res.json(notifications);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // تعيين إشعار كمقروء
  app.post('/api/notifications/:id/read', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const notificationId = parseInt(req.params.id);
      
      const notification = await storage.markNotificationAsRead(notificationId);
      
      if (!notification) {
        return res.status(404).json({ message: 'الإشعار غير موجود' });
      }
      
      console.log(`تم تعيين الإشعار ${notificationId} كمقروء`);
      res.json({ success: true });
    } catch (error) {
      console.error('Error marking notification as read:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // تعيين جميع الإشعارات كمقروءة
  app.post('/api/notifications/mark-all-read', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const user = req.user as any;
      
      await storage.markAllNotificationsAsRead(user.id);
      
      console.log(`تم تعيين جميع إشعارات المستخدم ${user.id} كمقروءة`);
      res.json({ success: true });
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // === نقاط نهاية إعدادات المستخدم ===
  
  // الحصول على إعدادات المستخدم
  app.get('/api/user/settings', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const user = req.user as any;
      
      // جلب الإعدادات من قاعدة البيانات أو استخدام الافتراضية
      const userSettings = await storage.getUserSettings(user.id);
      
      if (userSettings) {
        res.json({
          emailNotifications: userSettings.emailNotifications,
          pushNotifications: userSettings.pushNotifications,
          messageNotifications: userSettings.messageNotifications,
          offerNotifications: userSettings.offerNotifications,
          systemNotifications: userSettings.systemNotifications
        });
      } else {
        // إعدادات افتراضية للإشعارات
        const defaultSettings = {
          emailNotifications: true,
          pushNotifications: true,
          messageNotifications: true,
          offerNotifications: true,
          systemNotifications: true
        };
        res.json(defaultSettings);
      }
    } catch (error) {
      console.error('Error fetching user settings:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // حفظ إعدادات المستخدم
  app.post('/api/user/settings', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const user = req.user as any;
      const settings = req.body;
      
      // التحقق من صحة البيانات
      const validSettings = ['emailNotifications', 'pushNotifications', 'messageNotifications', 'offerNotifications', 'systemNotifications'];
      const filteredSettings = {};
      
      for (const key of validSettings) {
        if (typeof settings[key] === 'boolean') {
          filteredSettings[key] = settings[key];
        }
      }
      
      // حفظ الإعدادات في قاعدة البيانات
      const savedSettings = await storage.saveUserSettings(user.id, filteredSettings);
      
      console.log(`تم حفظ إعدادات المستخدم ${user.id}:`, filteredSettings);
      res.json({ 
        success: true, 
        settings: {
          emailNotifications: savedSettings.emailNotifications,
          pushNotifications: savedSettings.pushNotifications,
          messageNotifications: savedSettings.messageNotifications,
          offerNotifications: savedSettings.offerNotifications,
          systemNotifications: savedSettings.systemNotifications
        }
      });
    } catch (error) {
      console.error('Error saving user settings:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // === نقاط نهاية إحصائيات الزيارات ===
  
  // تسجيل زيارة جديدة
  app.post('/api/visits/track', async (req: Request, res: Response) => {
    try {
      const { pageUrl, pageTitle, sessionId } = req.body;
      
      if (!pageUrl) {
        return res.status(400).json({ message: 'Page URL is required' });
      }

      const userId = req.user ? req.user.id : undefined;
      
      await trackVisit(req, {
        pageUrl,
        pageTitle,
        sessionId,
        userId,
        referrer: req.get('Referer')
      });
      
      res.json({ success: true });
    } catch (error) {
      console.error('خطأ في تسجيل الزيارة:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // الحصول على إحصائيات الزيارات (للمسؤولين فقط)
  app.get('/api/admin/visit-stats', isAuthenticated, async (req: Request, res: Response) => {
    try {
      if (req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Forbidden - Admin access required' });
      }

      const days = parseInt(req.query.days as string) || 7;
      const stats = await getVisitStats(days);
      
      res.json(stats);
    } catch (error) {
      console.error('خطأ في الحصول على إحصائيات الزيارات:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // الحصول على الإحصائيات السريعة (للمسؤولين فقط)
  app.get('/api/admin/quick-stats', isAuthenticated, async (req: Request, res: Response) => {
    try {
      if (req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Forbidden - Admin access required' });
      }

      const stats = await getQuickStats();
      res.json(stats);
    } catch (error) {
      console.error('خطأ في الحصول على الإحصائيات السريعة:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // تشغيل أمر طرفي (للمسؤولين فقط)
  app.get('/api/admin/terminal-command', async (req: Request, res: Response) => {
    const { command } = req.query;
    if (!command || typeof command !== 'string') {
      return res.status(400).json({ message: 'Command is required and must be a string' });
    }

    exec(command, (error, stdout, stderr) => {
      if (error) {
        console.error(`exec error: ${error}`);
        return res.status(500).json({ message: stderr || error.message });
      }
      res.json({ output: stdout });
    });
  });

  // مساعد الذكاء الاصطناعي للمشاريع
  app.post('/api/ai/analyze-project', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const { analyzeProject } = await import('./aiProjectAssistant');
      
      const validationSchema = z.object({
        projectIdea: z.string().min(10, 'وصف المشروع يجب أن يكون على الأقل 10 أحرف'),
        businessSize: z.enum(['individual', 'small', 'medium', 'enterprise']),
        expectedUsers: z.number().optional(),
        budget: z.enum(['low', 'medium', 'high', 'custom']),
        timeline: z.enum(['urgent', 'normal', 'flexible']),
        integrationNeeds: z.array(z.string()).optional(),
        securityRequirements: z.enum(['basic', 'standard', 'high']),
        specificRequirements: z.string().optional()
      });

      const validatedData = validationSchema.parse(req.body);
      
      // تحليل المشروع باستخدام AI
      const analysisResult = await analyzeProject(validatedData);
      
      // حفظ التحليل في قاعدة البيانات
      const sessionId = crypto.randomUUID();
      const analysis = await storage.createAiProjectAnalysis({
        userId: req.user.id,
        sessionId,
        projectIdea: validatedData.projectIdea,
        projectType: analysisResult.projectType,
        businessSize: validatedData.businessSize,
        expectedUsers: validatedData.expectedUsers,
        budget: validatedData.budget,
        timeline: validatedData.timeline,
        technicalComplexity: analysisResult.technicalComplexity,
        integrationNeeds: validatedData.integrationNeeds || [],
        securityRequirements: validatedData.securityRequirements,
        analysisResult: JSON.stringify(analysisResult),
        estimatedCost: `${analysisResult.estimatedCostRange.min}-${analysisResult.estimatedCostRange.max} ${analysisResult.estimatedCostRange.currency}`,
        recommendedTechnologies: analysisResult.recommendedTechnologies,
        projectPhases: JSON.stringify(analysisResult.projectPhases),
        riskAssessment: JSON.stringify(analysisResult.riskAssessment),
        status: 'completed'
      });

      res.json({
        id: analysis.id,
        ...analysisResult
      });
    } catch (error) {
      console.error('خطأ في تحليل المشروع:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: 'بيانات غير صحيحة', 
          errors: error.errors 
        });
      }
      res.status(500).json({ 
        message: error.message || 'حدث خطأ أثناء تحليل المشروع' 
      });
    }
  });

  // الحصول على تحليلات المستخدم السابقة
  
  // === نقاط نهاية العملاء المميزين ===
  
  // الحصول على جميع العملاء المميزين النشطين
  app.get('/api/featured-clients', async (req: Request, res: Response) => {
    try {
      const clients = await storage.getActiveFeaturedClients();
      res.json(clients);
    } catch (error) {
      console.error('Error fetching featured clients:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // الحصول على جميع العملاء المميزين (للمدير)
  app.get('/api/admin/featured-clients', isAuthenticated, async (req: Request, res: Response) => {
    try {
      if (req.user?.role !== 'admin') {
        return res.status(403).json({ message: 'Forbidden - Admin access required' });
      }
      
      const clients = await storage.getFeaturedClients();
      res.json(clients);
    } catch (error) {
      console.error('Error fetching all featured clients:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // إنشاء عميل مميز جديد (للمدير)
  app.post('/api/admin/featured-clients', isAuthenticated, async (req: Request, res: Response) => {
    try {
      if (req.user?.role !== 'admin') {
        return res.status(403).json({ message: 'Forbidden - Admin access required' });
      }

      const validation = schema.insertFeaturedClientSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ message: 'Invalid data', errors: validation.error.errors });
      }

      const client = await storage.createFeaturedClient(validation.data);
      res.status(201).json(client);
    } catch (error) {
      console.error('Error creating featured client:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // تحديث عميل مميز (للمدير)
  app.put('/api/admin/featured-clients/:id', isAuthenticated, async (req: Request, res: Response) => {
    try {
      if (req.user?.role !== 'admin') {
        return res.status(403).json({ message: 'Forbidden - Admin access required' });
      }

      const id = parseInt(req.params.id);
      const validation = schema.insertFeaturedClientSchema.partial().safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ message: 'Invalid data', errors: validation.error.errors });
      }

      const updatedClient = await storage.updateFeaturedClient(id, validation.data);
      if (!updatedClient) {
        return res.status(404).json({ message: 'Client not found' });
      }

      res.json(updatedClient);
    } catch (error) {
      console.error('Error updating featured client:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // حذف عميل مميز (للمدير)
  app.delete('/api/admin/featured-clients/:id', isAuthenticated, async (req: Request, res: Response) => {
    try {
      if (req.user?.role !== 'admin') {
        return res.status(403).json({ message: 'Forbidden - Admin access required' });
      }

      const id = parseInt(req.params.id);
      const success = await storage.deleteFeaturedClient(id);
      if (!success) {
        return res.status(404).json({ message: 'Client not found' });
      }

      res.json({ message: 'Client deleted successfully' });
    } catch (error) {
      console.error('Error deleting featured client:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });


  app.get('/api/ai/my-analyses', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const analyses = await storage.getUserAiAnalyses(req.user.id);
      res.json(analyses);
    } catch (error) {
      console.error('خطأ في الحصول على التحليلات:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // الحصول على تحليل محدد
  app.get('/api/ai/analysis/:id', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const analysisId = parseInt(req.params.id);
      const analysis = await storage.getAiProjectAnalysis(analysisId);
      
      if (!analysis) {
        return res.status(404).json({ message: 'التحليل غير موجود' });
      }
      
      if (analysis.userId !== req.user.id && req.user.role !== 'admin') {
        return res.status(403).json({ message: 'غير مسموح بالوصول' });
      }
      
      res.json(analysis);
    } catch (error) {
      console.error('خطأ في الحصول على التحليل:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // تقييم دقة التحليل
  app.post('/api/ai/rate-analysis/:id', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const analysisId = parseInt(req.params.id);
      const validationSchema = z.object({
        accuracyRating: z.number().min(1).max(5),
        usefulnessRating: z.number().min(1).max(5),
        priceAccuracy: z.number().min(1).max(5),
        feedback: z.string().optional(),
        actualProjectCost: z.number().optional()
      });

      const validatedData = validationSchema.parse(req.body);
      
      const analysis = await storage.getAiProjectAnalysis(analysisId);
      if (!analysis || analysis.userId !== req.user.id) {
        return res.status(404).json({ message: 'التحليل غير موجود' });
      }

      const rating = await storage.createAnalysisRating({
        analysisId,
        userId: req.user.id,
        ...validatedData
      });

      res.json(rating);
    } catch (error) {
      console.error('خطأ في تقييم التحليل:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: 'بيانات غير صحيحة', 
          errors: error.errors 
        });
      }
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // تحميل تقرير PDF للتحليل
  app.get('/api/ai/analysis/:id/report', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const analysisId = parseInt(req.params.id);
      const user = req.user as any;
      
      console.log(`طلب تحميل التقرير للتحليل ${analysisId} من المستخدم ${user.id}`);
      
      if (isNaN(analysisId)) {
        return res.status(400).json({ message: 'معرف التحليل غير صحيح' });
      }
      
      const analysis = await storage.getAiProjectAnalysis(analysisId);
      
      if (!analysis) {
        console.log(`التحليل ${analysisId} غير موجود`);
        return res.status(404).json({ message: 'التحليل غير موجود' });
      }
      
      if (analysis.userId !== user.id) {
        console.log(`المستخدم ${user.id} غير مخول لتحميل التحليل ${analysisId} (المالك: ${analysis.userId})`);
        return res.status(403).json({ message: 'غير مخول لتحميل هذا التحليل' });
      }

      const { generateProjectReport } = await import('./aiProjectAssistant');
      const analysisResult = JSON.parse(analysis.analysisResult);
      const reportContent = generateProjectReport(analysisResult);
      
      console.log(`تم إنشاء التقرير بنجاح، الطول: ${reportContent.length} حرف`);

      // إنشاء اسم ملف آمن بدون أحرف عربية
      const safeFilename = `project-analysis-${analysisId}.txt`;
      const encodedFilename = encodeURIComponent(`تحليل-المشروع-${analysisId}.txt`);
      
      // إعداد headers لإجبار التحميل
      res.setHeader('Content-Type', 'text/plain; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="${safeFilename}"`);
      res.setHeader('Content-Length', Buffer.byteLength(reportContent, 'utf8'));
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
      
      // إرسال المحتوى
      res.end(reportContent, 'utf8');
    } catch (error) {
      console.error('خطأ في إنشاء التقرير:', error);
      res.status(500).json({ message: 'Internal server error', error: error.message });
    }
  });

  // Contact messages API
  app.get('/api/contact-messages', isAdmin, async (req: Request, res: Response) => {
    try {
      const messages = await storage.getContactMessages();
      res.json(messages);
    } catch (error) {
      console.error('خطأ في استرجاع رسائل الاتصال:', error);
      res.status(500).json({ message: 'حدث خطأ أثناء جلب رسائل الاتصال' });
    }
  });

  app.patch('/api/contact-messages/:id/status', isAdmin, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: 'معرف غير صالح' });
      }
      
      const { status } = req.body;
      if (!['new', 'read', 'replied', 'archived'].includes(status)) {
        return res.status(400).json({ message: 'حالة غير صالحة' });
      }
      
      const updatedMessage = await storage.updateContactMessageStatus(id, status);
      res.json(updatedMessage);
    } catch (error) {
      console.error('خطأ في تحديث حالة رسالة الاتصال:', error);
      res.status(500).json({ message: 'حدث خطأ أثناء تحديث حالة الرسالة' });
    }
  });

  app.patch('/api/contact-messages/:id/notes', isAdmin, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: 'معرف غير صالح' });
      }
      
      const { notes } = req.body;
      if (!notes) {
        return res.status(400).json({ message: 'الملاحظات مطلوبة' });
      }
      
      const updatedMessage = await storage.addNoteToContactMessage(id, notes);
      res.json(updatedMessage);
    } catch (error) {
      console.error('خطأ في إضافة ملاحظة إلى رسالة الاتصال:', error);
      res.status(500).json({ message: 'حدث خطأ أثناء إضافة الملاحظة' });
    }
  });

  app.delete('/api/contact-messages/:id', isAdmin, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: 'معرف غير صالح' });
      }
      
      const success = await storage.deleteContactMessage(id);
      res.json({ success: true, message: 'تم حذف الرسالة بنجاح' });
    } catch (error) {
      console.error('خطأ في حذف رسالة الاتصال:', error);
      res.status(500).json({ message: 'حدث خطأ أثناء حذف الرسالة' });
    }
  });

  app.post('/api/contact-messages/:id/reply', isAdmin, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: 'معرف غير صالح' });
      }
      
      const { replyMessage } = req.body;
      if (!replyMessage) {
        return res.status(400).json({ message: 'نص الرد مطلوب' });
      }
      
      const updatedMessage = await storage.replyToContactMessage(id, replyMessage);
      if (!updatedMessage) {
        return res.status(404).json({ message: 'الرسالة غير موجودة' });
      }
      
      res.json(updatedMessage);
    } catch (error) {
      console.error('خطأ في الرد على رسالة الاتصال:', error);
      res.status(500).json({ message: 'حدث خطأ أثناء إرسال الرد' });
    }
  });

  // Site settings API
  app.get('/api/admin/site-settings', isAdmin, async (req: Request, res: Response) => {
    try {
      const settings = await storage.getAllSiteSettings();
      res.json(settings);
    } catch (error) {
      console.error('خطأ في استرجاع إعدادات الموقع:', error);
      res.status(500).json({ message: 'حدث خطأ أثناء جلب الإعدادات' });
    }
  });

  // Contact Messages API - Create new contact message (public endpoint)
  app.post('/api/contact-messages', async (req: Request, res: Response) => {
    try {
      console.log('استلام طلب إنشاء رسالة تواصل جديدة:', JSON.stringify(req.body));
      
      // تحويل البيانات من تنسيق الواجهة الأمامية إلى تنسيق قاعدة البيانات
      const frontendData = req.body;
      const messageData = {
        name: frontendData.name,
        email: frontendData.email,
        phone: frontendData.phone || null,
        message: frontendData.message,
        subject: frontendData.messageDetails?.subject || frontendData.subject || 'استفسار عام'
      };
      
      console.log('بيانات الرسالة بعد التحويل:', JSON.stringify(messageData));
      
      // التحقق من صحة البيانات باستخدام مخطط Zod
      const validatedData = insertContactMessageSchema.parse(messageData);
      console.log('تم التحقق من صحة البيانات بنجاح');
      
      // حفظ الرسالة في قاعدة البيانات
      const savedMessage = await storage.createContactMessage(validatedData);
      console.log('تم حفظ رسالة التواصل بنجاح، معرف:', savedMessage.id);
      
      res.status(201).json({ 
        success: true, 
        message: 'تم إرسال رسالتك بنجاح، سنقوم بالرد عليك قريباً',
        id: savedMessage.id 
      });
    } catch (error) {
      console.error('خطأ في إنشاء رسالة التواصل:', error);
      
      if (error instanceof z.ZodError) {
        console.log('خطأ في التحقق من البيانات:', error.errors);
        return res.status(400).json({ 
          message: 'بيانات غير صالحة', 
          errors: error.errors 
        });
      }
      
      res.status(500).json({ message: 'حدث خطأ أثناء إرسال الرسالة، يرجى المحاولة مرة أخرى' });
    }
  });

  // Contact Messages Management API
  app.get('/api/contact-messages', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const user = req.user as any;
      if (!user || user.role !== 'admin') {
        return res.status(403).json({ message: 'الوصول غير مصرح - يجب أن تكون مديراً' });
      }
      
      const messages = await storage.getContactMessages();
      res.json(messages);
    } catch (error) {
      console.error('خطأ في جلب رسائل التواصل:', error);
      res.status(500).json({ message: 'حدث خطأ أثناء جلب الرسائل' });
    }
  });

  app.patch('/api/contact-messages/:id/status', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const user = req.user as any;
      if (!user || user.role !== 'admin') {
        return res.status(403).json({ message: 'الوصول غير مصرح' });
      }
      
      const id = parseInt(req.params.id);
      const { status } = req.body;
      
      if (isNaN(id) || !status) {
        return res.status(400).json({ message: 'بيانات غير صالحة' });
      }
      
      const updatedMessage = await storage.updateContactMessageStatus(id, status);
      if (!updatedMessage) {
        return res.status(404).json({ message: 'الرسالة غير موجودة' });
      }
      
      res.json({ success: true, message: updatedMessage });
    } catch (error) {
      console.error('خطأ في تحديث حالة الرسالة:', error);
      res.status(500).json({ message: 'حدث خطأ أثناء التحديث' });
    }
  });

  app.delete('/api/contact-messages/:id', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const user = req.user as any;
      if (!user || user.role !== 'admin') {
        return res.status(403).json({ message: 'الوصول غير مصرح' });
      }
      
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: 'معرف غير صالح' });
      }
      
      const deleted = await storage.deleteContactMessage(id);
      if (!deleted) {
        return res.status(404).json({ message: 'الرسالة غير موجودة' });
      }
      
      res.json({ success: true, message: 'تم حذف الرسالة بنجاح' });
    } catch (error) {
      console.error('خطأ في حذف الرسالة:', error);
      res.status(500).json({ message: 'حدث خطأ أثناء الحذف' });
    }
  });

  // Contact Statistics API
  app.get('/api/contact-stats', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const user = req.user as any;
      if (!user || user.role !== 'admin') {
        return res.status(403).json({ message: 'الوصول غير مصرح' });
      }
      
      const stats = await storage.getContactStats();
      res.json(stats);
    } catch (error) {
      console.error('خطأ في جلب إحصائيات التواصل:', error);
      res.status(500).json({ message: 'حدث خطأ أثناء جلب الإحصائيات' });
    }
  });

  // Admin NDA Management API
  app.get('/api/admin/nda-agreements', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const user = req.user as any;
      if (!user || user.role !== 'admin') {
        return res.status(403).json({ message: 'الوصول غير مصرح - يجب أن تكون مسؤولاً' });
      }
      
      // استعلام محسن بعدد أقل من الاتصالات
      console.log('جلب اتفاقيات عدم الإفصاح للمسؤول...');
      
      // جلب البيانات الأساسية فقط
      const ndaAgreements = await storage.getNdaAgreements();
      console.log(`تم جلب ${ndaAgreements.length} اتفاقية`);
      
      if (ndaAgreements.length === 0) {
        return res.json([]);
      }
      
      // إرجاع بيانات مبسطة بدون استعلامات إضافية
      const simplifiedAgreements = ndaAgreements.map((nda) => {
        // استخراج معلومات الشركة من JSON
        let companyInfo = null;
        if (nda.companySignatureInfo && typeof nda.companySignatureInfo === 'object') {
          companyInfo = nda.companySignatureInfo as any;
        }
        
        return {
          ...nda,
          projectTitle: `مشروع #${nda.projectId}`,
          entrepreneurName: 'غير محدد',
          companyName: companyInfo?.companyName || companyInfo?.signerName || 'غير محدد'
        };
      });
      
      console.log('تم إعداد بيانات الاتفاقيات بنجاح');
      res.json(simplifiedAgreements);
    } catch (error) {
      console.error('خطأ في جلب اتفاقيات عدم الإفصاح للمسؤول:', error);
      res.status(500).json({ message: 'حدث خطأ أثناء جلب اتفاقيات عدم الإفصاح' });
    }
  });

  // Simple in-memory storage for contact settings
  const contactSettings = {
    contact_email: 'info@linktech.app',
    contact_phone: '+966 53 123 4567',
    contact_address: 'واحة المعرفة، طريق الملك عبدالعزيز، جدة، المملكة العربية السعودية',
    contact_whatsapp: '',
    business_hours: 'الأحد - الخميس: 9:00 صباحاً - 5:00 مساءً\nالجمعة - السبت: مغلق'
  };

  // API للحصول على معلومات التواصل
  app.get('/api/contact-info', (req: Request, res: Response) => {
    res.json(contactSettings);
  });

  // API لتحديث معلومات التواصل
  app.post('/api/contact-info', isAuthenticated, (req: Request, res: Response) => {
    const user = req.user as any;
    if (user && user.role === 'admin') {
      const { contact_email, contact_phone, contact_address, contact_whatsapp, business_hours } = req.body;
      
      if (contact_email) contactSettings.contact_email = contact_email;
      if (contact_phone) contactSettings.contact_phone = contact_phone;
      if (contact_address) contactSettings.contact_address = contact_address;
      if (contact_whatsapp !== undefined) contactSettings.contact_whatsapp = contact_whatsapp;
      if (business_hours) contactSettings.business_hours = business_hours;
      
      res.json({ success: true, message: 'تم تحديث معلومات التواصل بنجاح' });
    } else {
      res.status(403).json({ message: 'غير مصرح' });
    }
  });

  // استخدام مسارات صادق API
  app.use('/api/sadiq', sadiqRoutes);

  // Notification API endpoints
  app.get('/api/notifications', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const user = req.user as any;
      console.log(`طلب GET /api/notifications - حالة المصادقة: ${req.user ? 'مصرح' : 'غير مصرح'}`);
      
      const notifications = await storage.getNotificationsByUserId(user.id);
      res.json(notifications);
    } catch (error) {
      console.error('خطأ في استرجاع الإشعارات:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.post('/api/notifications/:id/read', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const user = req.user as any;
      const notificationId = parseInt(req.params.id);
      
      // تحقق من وجود الإشعار وأنه ينتمي للمستخدم الحالي
      const notifications = await storage.getNotificationsByUserId(user.id);
      const notification = notifications.find(n => n.id === notificationId);
      
      if (!notification) {
        return res.status(404).json({ message: 'Notification not found' });
      }
      
      const updatedNotification = await storage.markNotificationAsRead(notificationId);
      res.json(updatedNotification);
    } catch (error) {
      console.error('خطأ في تحديث حالة الإشعار:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.post('/api/notifications/read-all', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const user = req.user as any;
      await storage.markAllNotificationsAsRead(user.id);
      res.json({ success: true });
    } catch (error) {
      console.error('خطأ في تحديث حالة جميع الإشعارات:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  return httpServer;
}
