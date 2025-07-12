# LinkTech - A Platform Connecting Entrepreneurs with Software Companies

## Overview

LinkTech is a full-stack web application that serves as a marketplace connecting entrepreneurs with software development companies in Saudi Arabia. The platform facilitates project posting, company matching, offer submission, and secure payment processing through an escrow system.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite for fast development and optimized production builds
- **UI Framework**: Tailwind CSS with shadcn/ui component library
- **State Management**: TanStack Query (React Query) for server state management
- **Routing**: Wouter for lightweight client-side routing
- **Forms**: React Hook Form with Zod validation
- **SEO**: React Helmet for meta tag management and structured data

### Backend Architecture
- **Runtime**: Node.js with TypeScript
- **Framework**: Express.js for API routes and middleware
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: Passport.js with local strategy and express-session
- **Real-time Communication**: WebSocket for live messaging
- **File Processing**: Various libraries for PDF generation and image handling

## Key Components

### Database Schema
- **Users**: Core user accounts with role-based access (entrepreneur, company, admin)
- **Company Profiles**: Extended profiles for software companies with verification system
- **Projects**: Project listings with requirements, budget, and status tracking
- **Messages**: Real-time messaging system between users
- **Project Offers**: Bid system for companies to submit proposals
- **Testimonials**: Review and rating system
- **Blog System**: Content management for blog posts and categories

### Authentication & Authorization
- Session-based authentication using Passport.js
- Role-based access control (entrepreneur, company, admin)
- Password reset functionality with email verification
- User profile verification system for companies

### Payment & Escrow System
- Integration with Stripe for payment processing
- 2.5% commission system on completed projects
- Escrow mechanism to protect both parties
- Automated payment release upon project completion

### Content Management
- Blog system with categories, posts, and comments
- Admin dashboard for content moderation
- Contact form system for customer inquiries
- Newsletter subscription management

## Data Flow

1. **User Registration**: Users register as either entrepreneurs or companies
2. **Project Creation**: Entrepreneurs post projects with detailed requirements
3. **Company Matching**: AI-powered recommendation system suggests relevant companies
4. **Offer Submission**: Companies submit proposals with pricing and timelines
5. **Agreement Process**: NDA generation and project acceptance workflow
6. **Payment Processing**: Escrow system handles secure transactions
7. **Project Execution**: Real-time messaging and milestone tracking
8. **Completion**: Final delivery and payment release

## External Dependencies

### Core Dependencies
- **Database**: @neondatabase/serverless for PostgreSQL connection
- **ORM**: drizzle-orm for type-safe database operations
- **UI Components**: @radix-ui components for accessible UI elements
- **Email Service**: @sendgrid/mail for transactional emails
- **PDF Generation**: pdfkit and pdfmake for document creation
- **WebSocket**: ws for real-time communication

### Development Tools
- **TypeScript**: Full type safety across frontend and backend
- **ESBuild**: Fast bundling for production builds
- **Drizzle Kit**: Database migration and schema management
- **PostCSS**: CSS processing with Tailwind CSS

## Deployment Strategy

### Production Configuration
- **Platform**: Replit with autoscale deployment
- **Database**: PostgreSQL 16 with connection pooling
- **Build Process**: Vite build for frontend, ESBuild for backend
- **Environment**: Node.js 20 runtime
- **Port Configuration**: Internal port 5000 mapped to external port 80

### Performance Optimizations
- Database connection pooling for production scalability
- Lazy loading for images and components
- Code splitting and bundle optimization
- CDN integration for static assets

### Security Measures
- Content filtering system to prevent contact information sharing
- SQL injection protection through Drizzle ORM
- Session security with secure cookie configuration
- Input validation using Zod schemas
- CORS configuration for API security

## Recent Changes

- July 12, 2025: إنشاء نظام "عملاء نفخر بهم" المنفصل
  - تم إنشاء جدول featured_clients منفصل بدلاً من استخدام الشركات الموثقة
  - أضيف صفحة إدارة "عملاء نفخر بهم" في لوحة الإدارة (/admin/featured-clients-management)
  - تم إضافة APIs كاملة لإدارة العملاء (إضافة، تحديث، حذف، عرض)
  - تم تحديث مكون FeaturedClients ليعمل مع البيانات الجديدة
  - أضيف رابط "عملاء نفخر بهم" في قائمة تنقل لوحة الإدارة
  - تم تحديث جميع النصوص من "العملاء المميزين" إلى "عملاء نفخر بهم"
  - النظام جاهز للاستخدام والإدارة من قبل المستخدم

- June 26, 2025: إصلاح شامل ونهائي لنظام البيانات الشخصية وتوقيع اتفاقيات عدم الإفصاح (NDA)
  - أضيفت الحقول المطلوبة لقاعدة البيانات (fullName, nationalId, phone, birthDate, address)
  - تم إنشاء واجهة كاملة لإدخال وعرض البيانات الشخصية في لوحة الشركة
  - تم إصلاح API endpoint لحفظ البيانات الشخصية باستخدام نقطة النهاية العادية
  - أضيف متغير isPersonalInfoComplete للتحقق من اكتمال البيانات
  - تم حل مشكلة عدم اختفاء المربع التحذيري بعد حفظ البيانات نهائياً
  - استبدال نظام إعادة تحميل الصفحة بنظام تحديث ذكي باستخدام React Query
  - تحسين updatePersonalInfoMutation2 لاستخدام invalidateQueries و refetch
  - أضيف قسم أخضر يظهر عند اكتمال البيانات مع زر للانتقال لتوقيع اتفاقيات NDA
  - تم اختبار النظام وتأكيد عمله بشكل صحيح مع البيانات الحقيقية
  - إصلاح نهائي لزر توقيع اتفاقية عدم الإفصاح - إزالة التعطيل الثابت وإضافة فحص ذكي للبيانات
  - إصلاح خطأ 404 في زر "إكمال البيانات الشخصية" - تصحيح الرابط للوجه لصفحة لوحة التحكم
  - تحسين مكون NdaSection بإضافة فحص البيانات الشخصية وعرض مؤشرات واضحة للحالة

- June 23, 2025: إصلاح شامل لنظام المحادثات (Messages System)
  - إصلاح APIs الخلفية لاسترجاع وإرسال الرسائل مع دعم العلاقات
  - تحديث نظام قاعدة البيانات للعمل مع المحادثات والمستخدمين والمشاريع
  - إصلاح واجهة المحادثات الأمامية وتنظيم عرض البيانات
  - تحسين عرض قائمة المحادثات مع معلومات المستخدمين والمشاريع
  - إضافة نظام تحديث تلقائي للرسائل كل 10 ثوان
  - دمج مكون ConversationWrapper مباشرة في صفحة الرسائل لحل مشاكل التحميل
  - تحسين تجربة المستخدم مع إظهار حالة الرسائل (مقروءة/غير مقروءة)

- June 23, 2025: إصلاح نظام إدارة رسائل التواصل وإحصائياتها
  - تم إصلاح APIs رسائل التواصل وإزالة ملف contactRoutes المعطل
  - تم إضافة API `/api/contact-stats` لعرض إحصائيات التواصل الشاملة
  - تم تحديث لوحة الإدارة لعرض إحصائيات التواصل بشكل مرئي
  - تم إصلاح نظام تسجيل الدخول للمدير (admin/admin123)
  - تم إضافة 3 رسائل تواصل تجريبية في قاعدة البيانات
  - تم حذف قسم الإحصائيات من صفحة "إدارة رسائل التواصل" (بقيت في تبويب إدارة التواصل فقط)
  - تم إصلاح إحصائيات التواصل في تبويب "إدارة التواصل" بلوحة الإدارة الرئيسية

- June 21, 2025: إصلاح مشكلة ربط إعدادات التواصل بصفحة "تواصل معنا"
  - تم إضافة API `/api/contact-info` لعرض معلومات التواصل المحفوظة
  - تم إصلاح آلية حفظ واسترجاع إعدادات الموقع في لوحة الإدارة

## Changelog

- June 21, 2025. Initial setup

## User Preferences

Preferred communication style: Simple, everyday language.