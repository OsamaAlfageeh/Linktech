# LinkTech - A Platform Connecting Entrepreneurs with Software Companies

## Overview

LinkTech is a full-stack web application designed as a marketplace to connect entrepreneurs with software development companies in Saudi Arabia. Its core purpose is to facilitate project posting by entrepreneurs, enable software companies to submit offers, and manage secure transactions through an escrow system. The platform aims to streamline the process of finding and collaborating on software development projects, providing a transparent and efficient environment for both parties.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### UI/UX Decisions
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **UI Framework**: Tailwind CSS with shadcn/ui components
- **Routing**: Wouter for client-side routing
- **Forms**: React Hook Form with Zod validation
- **SEO**: React Helmet

### Technical Implementations
- **Backend Runtime**: Node.js with TypeScript
- **Backend Framework**: Express.js
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: JWT-based authentication system
- **Real-time Communication**: WebSockets for live messaging
- **Payment & Escrow**: Stripe integration with a 2.5% commission system and automated payment release.
- **Content Management**: Blog system with admin moderation, contact forms, and newsletter management.
- **Digital Signature Integration**: Complete Sadiq API integration with dynamic authentication service, automated token management, document lifecycle tracking, and Nafath identity verification.
- **AI Assistant**: Project AI assistant for analysis powered by Anthropic API.

### Feature Specifications
- **User Roles**: Entrepreneur, Company, Admin with role-based access control.
- **Company Profiles**: Detailed profiles with verification.
- **Project Listings**: Comprehensive project posting with budget and status tracking.
- **Offer System**: Companies submit proposals.
- **Messaging**: Real-time chat.
- **Testimonials**: Review and rating system.
- **NDA Digital Signatures**: Full Sadiq integration with dynamic authentication, document upload, invitation management, status tracking, and signed document retrieval.
- **Real-Time Notification System**: Complete database-backed notification system integrated with two-stage NDA workflow. Notifications are created when companies initiate NDA requests and when entrepreneurs complete their information.
- **Two-Stage NDA Workflow**: Realistic notification-based process where companies initiate NDA requests, entrepreneurs are notified to complete their information separately, and Sadiq integration proceeds automatically after both parties provide data.
- **Data Flow**: Covers user registration, project creation, AI-powered company matching, offer submission, dynamic NDA generation with Sadiq integration, secure payment via escrow, project execution with messaging, and final completion.
- **Security Measures**: Content filtering, SQL injection protection, session security, input validation, CORS configuration, dynamic token management for external services.

### System Design Choices
- **State Management**: TanStack Query (React Query) for server state.
- **Database Schema**: Includes Users, Company Profiles, Projects, Messages, Project Offers, Testimonials, Blog System, NDA Agreements with Sadiq tracking fields, Notifications system with real-time user alerts.
- **Authentication**: JWT-based system for internal auth, dynamic token management for external services (Sadiq).
- **External Service Integration**: Smart authentication service with automatic token refresh, fallback mechanisms, and comprehensive error handling.
- **Deployment**: Configured for Replit with autoscale deployment, PostgreSQL 16, Vite for frontend, ESBuild for backend, and Node.js 20.
- **Performance**: Database connection pooling, lazy loading, code splitting, CDN integration, intelligent token caching.

## External Dependencies

- **Database**: @neondatabase/serverless (for PostgreSQL connection)
- **ORM**: drizzle-orm
- **UI Components**: @radix-ui
- **Email Service**: @sendgrid/mail
- **PDF Generation**: pdfkit, pdfmake, pdf-lib
- **WebSocket**: ws
- **Payment Gateway**: Stripe (for payment processing)
- **Authentication**: Passport.js (for initial strategy)
- **Type Safety**: TypeScript
- **Bundling**: ESBuild
- **Database Migration**: Drizzle Kit
- **CSS Processing**: PostCSS (with Tailwind CSS)