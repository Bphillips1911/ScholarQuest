# Overview

The "PBIS House of Champions" is a web application designed for Bush Hills STEAM Academy middle school to manage a house points system. Students, assigned to one of five houses, earn points for academic excellence, attendance, and behavior. The system provides a comprehensive Positive Behavioral Interventions and Supports (PBIS) framework, featuring enhanced dropdown categories, individual teacher dashboards for recognizing "MUSTANG" traits, a house sorting generator, and photo upload capabilities. It also displays program information for parents, incorporates the official BHSA Mustangs Crest logo, and includes robust administrator authentication with role-based permissions. The project includes a fully operational bi-directional parent-teacher messaging system with database persistence and reply functionality. The project's vision is to foster positive behavior, academic achievement, and school pride within the student body.

## Recent Changes (August 2025)
- **DEPLOYMENT SYNC ISSUE IDENTIFIED**: Found misalignment between preview and deployment environments affecting message display and authentication
- **Database Storage Architecture Fixed**: Resolved duplicate method conflicts in DatabaseStorage class affecting parent/teacher data retrieval
- **Admin Message Display Corrected**: Fixed sender type display to show "admin" instead of "parent" using proper database field mapping
- **Date Formatting Enhanced**: Implemented robust error handling for "invalid date" displays with fallback to "Recently"
- **Teacher Authentication System**: Verified David Thompson credentials (david.thompson@bhsteam.edu / teacher123) working in preview environment
- **Messaging Synchronization Fixed**: Resolved database storage inconsistencies between preview and deployment environments
- **Teacher Reply System Fixed**: Resolved database foreign key constraint issue preventing teachers from replying to parent messages when scholar_id is null

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
- **Framework**: React 18 with TypeScript (Vite).
- **UI Library**: Shadcn/ui components built on Radix UI primitives.
- **Styling**: Tailwind CSS with custom CSS variables.
- **Routing**: Wouter.
- **State Management**: TanStack React Query for server state.
- **Component Structure**: Page components, reusable UI components, and custom components for house cards and forms.
- **Responsive Design**: Mobile-first approach.

## Backend Architecture
- **Framework**: Express.js with TypeScript.
- **API Design**: RESTful API for houses, scholars, and point entries.
- **Build Process**: ESBuild for server bundling, Vite for client bundling.

## Data Storage
- **Database**: PostgreSQL with Drizzle ORM, hosted on Neon Database.
- **Schema**: Tables for houses, scholars, point entries, PBIS entries, PBIS photos, teachers, parents, parent-teacher messages, administrators, and admin sessions.
- **Scholars Table**: Includes automatic system-generated usernames (first3+last3+IDdigits format).
- **File Storage**: Local file system for photo uploads using multer.

## Authentication and Authorization
- **Administrator Authentication**: Role-based permissions for Principal, Assistant Principal, and Counselor.
- **Teacher Authentication**: Grade-level permissions.
- **Session Management**: JWT-based sessions.

## Development Environment
- **Hot Reload**: Vite dev server with Express middleware.
- **TypeScript**: Strict configuration with path aliases.

## UI/UX Decisions
- Consistent use of BHSA Mustangs Crest logo and school branding.
- Modals with multiple exit methods (click outside, X button, Cancel button) and keyboard support (Escape key).
- Automatic form reset on modal close.
- Responsive design for mobile-first experience.
- **PBIS Champion Flash Effects**: Golden title animations, sparkle effects, and pulsing hero section glow
- **Educational Background Music**: Toggle-controlled Web Audio API implementation with user interaction compliance
- **Celebratory Animations**: House cards and school logo with gentle bounce/celebration movements

# Deployment Troubleshooting

## Preview vs Deployment Environment Sync Issues (August 2025)

**Symptoms:**
- Admin portal shows teachers as "parent" instead of correct sender type
- Only 2 parent accounts visible instead of all 13
- David Thompson login fails with "invalid login"  
- "Invalid Date" displaying in message timestamps
- General misalignment between preview and deployment environments

**Root Cause:**
Deployment environment is running older code or has different database state than preview environment.

**Resolution Steps:**
1. **Ensure Code Deployment**: Verify deployment has latest code including:
   - Fixed `DatabaseStorage.getMessagesForAdmin()` method using `getMessagesForAdminFixed`
   - Resolved duplicate method conflicts in `server/db-storage.ts`
   - Updated admin portal date formatting with error handling
   - Proper sender type field mapping (`actual_sender_type` vs `sender_type`)

2. **Database Synchronization**: Verify deployment database has:
   - All 13 parent accounts from development
   - Teacher credentials (david.thompson@bhsteam.edu / teacher123)  
   - Proper message data with correct sender_type values

3. **Environment Variables**: Ensure deployment has same database connection and configuration as preview

**Verified Working State (Preview):**
- ✅ 13 parent accounts retrieved correctly
- ✅ David Thompson authentication working
- ✅ Admin messages showing correct sender types  
- ✅ Date formatting with proper error handling
- ✅ All database storage methods using fixed implementations

# External Dependencies

## Database Services
- **Neon Database**: Serverless PostgreSQL hosting.
- **Drizzle ORM**: Type-safe database queries.

## UI and Styling
- **Radix UI**: Accessible component primitives.
- **Tailwind CSS**: Utility-first CSS framework.
- **Lucide React**: Icon library.
- **Embla Carousel**: Carousel component.

## Development Tools
- **Vite**: Build tool and development server.
- **TanStack React Query**: Server state management.
- **Wouter**: React router.
- **ESBuild**: JavaScript bundler.
- **React Hook Form**: Form handling.

## Email Notification System
- **Service Provider**: SendGrid API.
- **Notification Types**: Teacher registrations, parent signups, student registrations, password reset requests.

## Data Export System
- **Export Formats**: CSV and Excel (.xlsx) from admin portal.

## Form Validation
- **Zod**: Schema validation.
- **Drizzle-Zod**: Integration with Drizzle schemas.
- **Hookform Resolvers**: Integration with React Hook Form.

## Utility Libraries
- **date-fns**: Date manipulation.
- **clsx & tailwind-merge**: Conditional CSS class composition.
- **class-variance-authority**: Type-safe component variant handling.
- **nanoid**: URL-safe unique ID generation.