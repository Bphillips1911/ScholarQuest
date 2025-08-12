# Overview

This is a House Character Development Program web application for Bush Hills STEAM Academy middle school. The system manages a house points system where students are assigned to one of five houses (Franklin, Courie, West, Blackwell, and Berruguete) and earn points in three categories: academic excellence, attendance, and behavior. The application includes a comprehensive PBIS (Positive Behavioral Interventions and Supports) system with enhanced dropdown categories for Attendance, Behavior, and Academic recognition, individual teacher tabs for recognizing MUSTANG traits, house sorting generator for balanced student distribution, photo upload capabilities for capturing memorable moments, and displays program information to parents. The app features the official BHSA Mustangs Crest logo to show school connection and pride. The system now includes comprehensive administrator authentication allowing school leadership (Principal, Assistant Principal, and Counselor) full platform access with role-based permissions.

## Latest Enhancement: Admin Authentication System Fixed
The administrator authentication system has been successfully resolved and is fully operational:
- Admin account creation with proper permissions and isActive field
- Login functionality working for both default and new admin accounts  
- QR code generation API confirmed functional with JSON responses
- Email notification structure implemented (awaiting fresh SendGrid API key)
- Complete role-based access control for Principal, Assistant Principal, and Counselor roles

# User Preferences

Preferred communication style: Simple, everyday language.

## MUSTANG Trait Definitions
- M - Make good choices
- U - Use kind words  
- S - Show school pride
- T - Tolerant of others
- A - Aim for excellence
- N - Need to be responsible
- G - Give 100% everyday

## School Administration
- Principal: Dr. Phillips
- Assistant Principal: Dr. Stewart
- School Counselor: Counselor Kirkland

# System Architecture

## Frontend Architecture
- **Framework**: React 18 with TypeScript using Vite as the build tool
- **UI Library**: Shadcn/ui components built on Radix UI primitives
- **Styling**: Tailwind CSS with custom CSS variables for theming
- **Routing**: Wouter for client-side routing
- **State Management**: TanStack React Query for server state management
- **Component Structure**: 
  - Page components for main routes (dashboard, houses, admin, etc.)
  - Reusable UI components in the shadcn/ui pattern
  - Custom components for house cards and forms
- **Responsive Design**: Mobile-first approach with proper tab layouts and button positioning
- **Admin Interface**: Fixed tab overlap issues with proper spacing and visual separation

## Backend Architecture
- **Framework**: Express.js with TypeScript
- **API Design**: RESTful API endpoints for houses, scholars, and point entries
- **Storage Layer**: In-memory storage implementation with interface for future database integration
- **Development Setup**: Vite middleware integration for development with HMR support
- **Build Process**: ESBuild for server bundling, Vite for client bundling

## Data Storage
- **Database**: PostgreSQL configured with Drizzle ORM
- **Schema**: Five main tables - houses, scholars, point_entries, pbis_entries, and pbis_photos
- **Database Provider**: Neon Database (serverless PostgreSQL)
- **Current Implementation**: In-memory storage with predefined house data and sample scholars for development
- **Migration Strategy**: Drizzle-kit for schema migrations
- **File Storage**: Local file system for photo uploads with multer middleware

## Database Schema Design
- **Houses Table**: Stores house information, colors, mottos, and point totals
- **Scholars Table**: Student records linked to houses with individual point tracking, house sorting status, unique system-generated usernames
- **Point Entries Table**: Audit trail for all point awards with reasons and timestamps
- **PBIS Entries Table**: Enhanced records for MUSTANG trait recognition with categories (attendance, behavior, academic) and subcategories
- **PBIS Photos Table**: Photo uploads for documenting MUSTANG moments with metadata
- **Teachers Table**: Role-based teacher authentication with grade-level permissions
- **Parents Table**: Parent portal access with username-based child tracking capabilities
- **Parent Teacher Messages Table**: Bi-directional messaging system with thread support, read status, and notification triggers
- **Administrators Table**: School leadership authentication with role-based permissions (Principal, Assistant Principal, Counselor)
- **Admin Sessions Table**: JWT session management for administrator authentication
- **Relationships**: Foreign key constraints ensuring data integrity between tables

## Authentication and Authorization
- **Administrator Authentication**: ✅ FULLY WORKING - Complete authentication system for school leadership with JWT session tokens
  - Principal: Dr. Phillips (dr.phillips@bhsteam.edu) - Full platform access including admin settings
  - Assistant Principal: Dr. Stewart (dr.stewart@bhsteam.edu) - Full platform access except admin settings  
  - Counselor: Counselor Kirkland (counselor.kirkland@bhsteam.edu) - Student management and reports access
  - Default password: BHSAAdmin2025! (confirmed working)
  - Admin signup creates accounts with proper isActive field and permissions
- **Teacher Authentication**: Existing teacher authentication system with grade-level permissions
- **Session Management**: JWT-based sessions with secure token storage and validation
- **Role-based Permissions**: Different access levels based on administrative role

## Development Environment
- **Hot Reload**: Vite dev server with Express middleware integration
- **TypeScript**: Strict configuration with path aliases for clean imports
- **Code Quality**: Structured with shared types and schemas between client and server
- **Replit Integration**: Custom plugins for development environment support

# External Dependencies

## Database Services
- **Neon Database**: Serverless PostgreSQL hosting
- **Drizzle ORM**: Type-safe database queries and migrations
- **connect-pg-simple**: PostgreSQL session store (prepared for future auth)

## UI and Styling
- **Radix UI**: Accessible component primitives for complex UI components
- **Tailwind CSS**: Utility-first CSS framework with custom design system
- **Lucide React**: Icon library for consistent iconography
- **Embla Carousel**: Carousel component for image/content rotation

## Development Tools
- **Vite**: Build tool and development server
- **TanStack React Query**: Server state management and caching
- **Wouter**: Lightweight React router
- **ESBuild**: Fast JavaScript bundler for production builds
- **React Hook Form**: Form handling with validation

## Visual Assets and Branding
- **School Logo**: Bush Hills STEAM Academy (BHSA) Mustangs Crest integrated throughout the app
- **Asset Management**: Vite-based asset importing with @assets/ alias for images and media
- **School Branding**: Consistent use of school identity in navigation, dashboard, admin panel, and parent communications

## Email Notification System
- **Service Provider**: SendGrid API for reliable email delivery (✓ WORKING)
- **Administrator Email**: BHSAHouses25@gmail.com (verified sender, configured via admin settings)
- **API Configuration**: Full Access SendGrid API key with verified sender authentication
- **Notification Types**: Teacher registrations, parent signups, student registrations, password reset requests
- **Email Templates**: HTML-formatted notifications with school branding and detailed information
- **Admin Configuration**: Admin settings page (/admin-settings) for email management and testing
- **Automated Alerts**: Real-time notifications sent when new users register in the system
- **Delivery Notes**: Initial emails may go to spam folder; users should check spam/promotions tabs

## Data Export System
- **Export Formats**: CSV and Excel (.xlsx) formats available from admin portal
- **Data Included**: Student name, ID, grade level, house assignment, all point categories (academic, attendance, behavior), total points, date added
- **File Naming**: Automatic date-stamped filenames (bhsa-scholars-YYYY-MM-DD.csv/.xlsx)
- **Admin Access**: Export buttons in admin panel for instant data download
- **Spreadsheet Features**: Excel exports include proper column widths and formatting

## Form Validation
- **Zod**: Schema validation library
- **Drizzle-Zod**: Integration between Drizzle schemas and Zod validation
- **Hookform Resolvers**: Bridge between React Hook Form and Zod

## Utility Libraries
- **date-fns**: Date manipulation and formatting
- **clsx & tailwind-merge**: Conditional CSS class composition
- **class-variance-authority**: Type-safe component variant handling
- **nanoid**: URL-safe unique ID generation