# Overview

This web application, "PBIS House of Champions," manages a house points system for Bush Hills STEAM Academy middle school. Students are assigned to one of five houses and earn points across academic excellence, attendance, and behavior. The system provides a comprehensive PBIS framework with enhanced dropdown categories, individual teacher tabs for recognizing MUSTANG traits, a house sorting generator, photo upload capabilities, and displays program information to parents. It features the official BHSA Mustangs Crest logo and includes comprehensive administrator authentication with role-based permissions for school leadership. The system aims to enhance positive behavior, academic achievement, and school pride.

# User Preferences

Preferred communication style: Simple, everyday language.

# Recent Changes (August 14, 2025)

## TEACHER PORTAL FULLY RESTORED - ALL FUNCTIONALITY WORKING ✅
- **Complete Feature Restoration**: All requested teacher portal features now fully operational
- **Scholar Management**: Add Scholar button with username auto-generation (first3+last3+IDdigits format)
- **Parent-Teacher Messaging**: Complete messaging system with database persistence (Nancy Law message confirmed)
- **Student Display**: Grade 6 students automatically displayed (9 students loading correctly)
- **House Standings**: All 5 houses showing current points and member counts
- **Default View Fix**: Dashboard defaults to "My Scholars" tab for immediate feature visibility
- **Authentication Stable**: JWT tokens working with proper verification for all APIs
- **Database Integration**: All features using PostgreSQL with proper data persistence

## DEPLOYMENT AUTHENTICATION COMPLETELY FIXED ✅
- **Critical Issue Resolved**: Parent, teacher, AND admin authentication now work perfectly in deployment environment
- **Admin Portal Restored**: bphillips@bhm.k12.al.us / BHSAAdmin2025! login fully operational after import fix
- **Missing Method Fixed**: Added `getParentByEmail` method to DatabaseStorage class that was causing parent login failures
- **Teacher Auth Compatibility**: Fixed `/api/teacher-auth/login` endpoint to work with frontend deployment calls
- **Database Integration**: All authentication now uses PostgreSQL with proper data persistence
- **JWT Consistency**: Hardcoded stable JWT secrets for deployment reliability ("bhsa-teacher-secret-2025-stable", "bhsa-parent-secret-2025-stable")
- **30-Day Tokens**: Extended token expiry to reduce authentication costs and improve user experience
- **Verified Credentials**: 
  - Parent: nslaw@yahoo.com / password ✅ 
  - Teacher: sarah.johnson@bhsteam.edu / BHSATeacher2025! ✅
- **Cost Optimization**: Stable authentication reduces redeployment costs and user frustration

## Teacher Username Generation System - PERMANENT SOLUTION ✅
- **Feature Added**: Teachers can now generate usernames and passwords for students they add
- **Username Pattern**: First 3 letters of first name + first 3 letters of last name + last 2 digits of student ID
- **Password Pattern**: "bhsa" + student ID (e.g., "bhsabh6001")
- **Security**: Passwords are hashed with bcrypt before database storage
- **Database Support**: PostgreSQL schema includes username and password_hash fields
- **Data Persistence**: Verified through multiple server restarts - all data survives permanently

## Parent Portal Authentication Legacy Fixes
- **Historical Issue**: Parent login previously worked in preview mode but failed in deployment
- **Root Cause**: Missing database storage methods and JWT secret inconsistency
- **Parent Credentials**: Nancy Law (nslaw@yahoo.com / password) - fully working
- **API Testing**: Confirmed add scholar endpoints work correctly via both credentials and student ID methods

## Modal Improvements (Parent & Teacher Portals)
- **Parent Portal**: Add student modal fixed with multiple exit methods:
  - Click outside modal to close
  - Large, visible X button in top-right corner with border and hover effects
  - Cancel button at bottom
  - Proper event handling to prevent stuck states
- **Teacher Portal**: Add Scholar modal enhanced with improved UX (CONFIRMED WORKING):
  - Keyboard support (Escape key to close)
  - Enhanced backdrop click handling  
  - Automatic form reset when modal closes
  - Better visual styling for close button with hover effects
  - Form validation prevents submission without required fields
  - Sticky header for better navigation in scrollable content
  - User confirmed: X button and all closing mechanisms working properly

# System Architecture

## Frontend Architecture
- **Framework**: React 18 with TypeScript using Vite.
- **UI Library**: Shadcn/ui components built on Radix UI primitives.
- **Styling**: Tailwind CSS with custom CSS variables.
- **Routing**: Wouter for client-side routing.
- **State Management**: TanStack React Query for server state management.
- **Component Structure**: Page components, reusable UI components following shadcn/ui patterns, custom components for house cards and forms.
- **Responsive Design**: Mobile-first approach.

## Backend Architecture
- **Framework**: Express.js with TypeScript.
- **API Design**: RESTful API for houses, scholars, and point entries.
- **Build Process**: ESBuild for server bundling, Vite for client bundling.

## Data Storage
- **Database**: PostgreSQL configured with Drizzle ORM.
- **Database Provider**: Neon Database (serverless PostgreSQL).
- **Schema**: Five main tables (houses, scholars, point_entries, pbis_entries, pbis_photos) plus tables for teachers, parents, parent-teacher messages, administrators, and admin sessions.
- **Scholars Table**: Includes automatic system-generated usernames (format: first3+last3+IDdigits).
- **File Storage**: Local file system for photo uploads using multer.

## Authentication and Authorization
- **Administrator Authentication**: Fully working system for Principal (full access), Assistant Principal (full except admin settings), and Counselor (student management/reports). Default password: BHSAAdmin2025!.
- **Teacher Authentication**: Existing system with grade-level permissions.
- **Session Management**: JWT-based sessions.
- **Role-based Permissions**: Access levels based on administrative roles.

## Development Environment
- **Hot Reload**: Vite dev server with Express middleware.
- **TypeScript**: Strict configuration with path aliases.
- **Replit Integration**: Custom plugins for development environment support.

# External Dependencies

## Database Services
- **Neon Database**: Serverless PostgreSQL hosting.
- **Drizzle ORM**: Type-safe database queries and migrations.

## UI and Styling
- **Radix UI**: Accessible component primitives.
- **Tailwind CSS**: Utility-first CSS framework.
- **Lucide React**: Icon library.
- **Embla Carousel**: Carousel component.

## Development Tools
- **Vite**: Build tool and development server.
- **TanStack React Query**: Server state management.
- **Wouter**: Lightweight React router.
- **ESBuild**: Fast JavaScript bundler.
- **React Hook Form**: Form handling with validation.

## Visual Assets and Branding
- **School Logo**: Bush Hills STEAM Academy (BHSA) Mustangs Crest.
- **Asset Management**: Vite-based asset importing with @assets/ alias.
- **School Branding**: Consistent use of school identity.

## Email Notification System
- **Service Provider**: SendGrid API.
- **Administrator Email**: BHSAHouses25@gmail.com.
- **Notification Types**: Teacher registrations, parent signups, student registrations, password reset requests.
- **Email Templates**: HTML-formatted with school branding.
- **Admin Configuration**: Admin settings page for email management.

## Data Export System
- **Export Formats**: CSV and Excel (.xlsx) available from admin portal.
- **Data Included**: Student name, ID, grade level, house assignment, all point categories, total points, date added.
- **File Naming**: Automatic date-stamped filenames.

## Form Validation
- **Zod**: Schema validation library.
- **Drizzle-Zod**: Integration between Drizzle schemas and Zod.
- **Hookform Resolvers**: Bridge between React Hook Form and Zod.

## Utility Libraries
- **date-fns**: Date manipulation and formatting.
- **clsx & tailwind-merge**: Conditional CSS class composition.
- **class-variance-authority**: Type-safe component variant handling.
- **nanoid**: URL-safe unique ID generation.