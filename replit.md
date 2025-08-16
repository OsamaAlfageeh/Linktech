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
- **Authentication**: Passport.js (session-based, moving to JWT)
- **Real-time Communication**: WebSockets for live messaging
- **Payment & Escrow**: Stripe integration with a 2.5% commission system and automated payment release.
- **Content Management**: Blog system with admin moderation, contact forms, and newsletter management.
- **NDA Generation**: Utilizes PDF libraries for secure NDA generation.
- **AI Assistant**: Project AI assistant for analysis.

### Feature Specifications
- **User Roles**: Entrepreneur, Company, Admin with role-based access control.
- **Company Profiles**: Detailed profiles with verification.
- **Project Listings**: Comprehensive project posting with budget and status tracking.
- **Offer System**: Companies submit proposals.
- **Messaging**: Real-time chat.
- **Testimonials**: Review and rating system.
- **Data Flow**: Covers user registration, project creation, AI-powered company matching, offer submission, NDA generation, secure payment via escrow, project execution with messaging, and final completion.
- **Security Measures**: Content filtering, SQL injection protection, session security, input validation, CORS configuration.

### System Design Choices
- **State Management**: TanStack Query (React Query) for server state.
- **Database Schema**: Includes Users, Company Profiles, Projects, Messages, Project Offers, Testimonials, Blog System.
- **Authentication**: Transitioned from session/cookie to JWT for enhanced security and statelessness.
- **Deployment**: Configured for Replit with autoscale deployment, PostgreSQL 16, Vite for frontend, ESBuild for backend, and Node.js 20.
- **Performance**: Database connection pooling, lazy loading, code splitting, CDN integration.

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