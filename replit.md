# Overview

This web application, "PBIS House of Champions," manages a house points system for Bush Hills STEAM Academy middle school. Students are assigned to one of five houses and earn points across academic excellence, attendance, and behavior. The system provides a comprehensive PBIS framework with enhanced dropdown categories, individual teacher tabs for recognizing MUSTANG traits, a house sorting generator, photo upload capabilities, and displays program information to parents. It features the official BHSA Mustangs Crest logo and includes comprehensive administrator authentication with role-based permissions for school leadership. The system aims to enhance positive behavior, academic achievement, and school pride.

# User Preferences

Preferred communication style: Simple, everyday language.

# Recent Changes (August 13, 2025)

## Teacher Username Generation System - PERMANENT SOLUTION ✅
- **Feature Added**: Teachers can now generate usernames and passwords for students they add
- **Username Pattern**: First 3 letters of first name + first 3 letters of last name + last 2 digits of student ID
- **Password Pattern**: "bhsa" + student ID (e.g., "bhsabh6001")
- **Security**: Passwords are hashed with bcrypt before database storage
- **Database Support**: PostgreSQL schema includes username and password_hash fields
- **Data Persistence**: Verified through multiple server restarts - all data survives permanently
- **Authentication**: Fixed JWT token consistency with hardcoded secret "bhsa-teacher-secret-2025-stable" for both login and middleware
- **Deployment Fix**: Resolved JWT secret mismatch that caused teacher login to work in preview but fail on deployment
- **Database Seeding**: Added teacher authentication seeding to ensure teachers exist in deployment database
- **Seeding Priority**: Teachers are now seeded before houses to guarantee deployment availability

## Parent Portal Authentication Fixes
- **Issue Fixed**: Parent login worked in preview mode but failed in deployment due to JWT secret inconsistency
- **Solution**: Hardcoded consistent JWT secret "bhsa-parent-secret-2025-stable" for all environments
- **Parent Credentials**: Nancy Law (nslaw@yahoo.com / password) - fully working
- **API Testing**: Confirmed add scholar endpoints work correctly via both credentials and student ID methods

## Parent Portal Modal Improvements  
- **Issue Fixed**: Add student modal was getting stuck and couldn't be closed
- **Solution**: Added multiple exit methods:
  - Click outside modal to close
  - Large, visible X button in top-right corner with border and hover effects
  - Cancel button at bottom
  - Proper event handling to prevent stuck states
- **Visual Enhancement**: Made X button more prominent with outline styling for better visibility in preview mode

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