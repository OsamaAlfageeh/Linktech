import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  insertUserSchema, 
  insertCompanyProfileSchema, 
  insertProjectSchema, 
  insertMessageSchema,
  insertTestimonialSchema 
} from "@shared/schema";
import { z } from "zod";
import { 
  getRecommendedProjectsForCompany, 
  getRecommendedCompaniesForProject,
  getSimilarProjects,
  getTrendingProjects
} from "./recommendation";
import session from "express-session";
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import MemoryStore from "memorystore";

const SessionStore = MemoryStore(session);

export async function registerRoutes(app: Express): Promise<Server> {
  // Initialize session and passport
  app.use(session({
    secret: process.env.SESSION_SECRET || 'techlinkapp',
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false, maxAge: 24 * 60 * 60 * 1000 }, // 24 hours
    store: new SessionStore({
      checkPeriod: 86400000 // prune expired entries every 24h
    })
  }));

  app.use(passport.initialize());
  app.use(passport.session());

  // Configure passport
  passport.use(new LocalStrategy(async (username, password, done) => {
    try {
      const user = await storage.getUserByUsername(username);
      if (!user) {
        return done(null, false, { message: 'Incorrect username.' });
      }
      if (user.password !== password) { // In a real app, use bcrypt to compare passwords
        return done(null, false, { message: 'Incorrect password.' });
      }
      return done(null, user);
    } catch (err) {
      return done(err);
    }
  }));

  passport.serializeUser((user: any, done) => {
    done(null, user.id);
  });

  passport.deserializeUser(async (id: number, done) => {
    try {
      const user = await storage.getUser(id);
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
      
      const user = await storage.createUser(userData);
      
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
        return res.status(201).json({ user });
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
    res.json({ user: req.user });
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
        return res.json({ message: 'Admin user already exists', user: existingUser });
      }
      
      // إنشاء مستخدم المسؤول
      const adminUser = await storage.createUser({
        username: 'admin',
        password: 'admin123',
        email: 'admin@techlink.example',
        role: 'admin',
        name: 'مسؤول النظام',
        avatar: 'https://randomuser.me/api/portraits/men/33.jpg'
      });
      
      return res.json({ message: 'Admin user created successfully', user: adminUser });
    } catch (error) {
      console.error('Error creating admin user:', error);
      return res.status(500).json({ message: 'Error creating admin user' });
    }
  });

  app.get('/api/auth/user', (req: Request, res: Response) => {
    if (req.isAuthenticated()) {
      return res.json({ user: req.user });
    }
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
      res.json(users);
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
      
      if (profile.userId !== user.id) {
        return res.status(403).json({ message: 'Not authorized to update this profile' });
      }
      
      const updatedProfile = await storage.updateCompanyProfile(profileId, req.body);
      res.json(updatedProfile);
    } catch (error) {
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

  const httpServer = createServer(app);
  return httpServer;
}
