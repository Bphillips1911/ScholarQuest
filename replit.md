# Overview

The "PBIS House of Champions" is a web application for Bush Hills STEAM Academy to manage a house points system. It enables students, assigned to one of five houses (Franklin, Tesla, Curie, Nobel, Lovelace), to earn points for academic, attendance, and behavioral achievements. The system provides a comprehensive Positive Behavioral Interventions and Supports (PBIS) framework, featuring individual teacher dashboards for recognizing "MUSTANG" traits, a house sorting generator, and photo upload capabilities. It also displays program information for parents, incorporates the official BHSA Mustangs Crest logo, and includes robust administrator authentication with role-based permissions. A fully operational bi-directional parent-teacher messaging system with database persistence and reply functionality is included. The project aims to foster positive behavior, academic achievement, and school pride within the student body.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
- **Framework**: React 18 with TypeScript (Vite).
- **UI Library**: Shadcn/ui components built on Radix UI primitives.
- **Styling**: Tailwind CSS with custom CSS variables, enhanced with advanced CSS animations (floating logos, rainbow text, glow pulses).
- **Routing**: Wouter.
- **State Management**: TanStack React Query for server state.
- **Component Structure**: Page components, reusable UI components, and custom components for house cards and forms.
- **Responsive Design**: Mobile-first approach with glassmorphism effects.

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
- **Administrator Authentication**: Role-based permissions (Principal, Assistant Principal, Counselor, Database Manager), with an approval system for new administrators.
- **Teacher Authentication**: Grade-level permissions.
- **Session Management**: JWT-based sessions.
- **Credential Generation System**: Automatic username/password generation for new students.

## Development Environment
- **Hot Reload**: Vite dev server with Express middleware.
- **TypeScript**: Strict configuration with path aliases.

## UI/UX Decisions
- **Branding**: Consistent use of BHSA Mustangs Crest logo and school branding.
- **Modals**: Multiple exit methods (click outside, X button, Cancel button) and keyboard support (Escape key), with automatic form reset.
- **Animations**: Animated main landing page with 4-second welcome animation (trophy, crown, star icons), rotating house spotlights, and advanced CSS animations.
- **Login Portals**: Four distinct animated login cards (Student, Parent, Teacher, Administrator) with hover effects and account creation links.
- **Visuals**: PBIS Champion flash effects, sparkle effects, pulsing hero section glow, and celebratory animations for house cards and school logo.
- **Audio**: Ultra-fast competitive music (150ms interval, 880Hz-2349Hz, dynamic waveforms).
- **Theming**: Three-theme system (Normal, Light, Dark) for administrator and teacher dashboards with persistent settings.
- **Navigation**: Compact dropdown navigation system for administrators and teachers.
- **PBIS System**: Enhanced award/deduct system with detailed criteria and smart reason selection (dropdowns + custom input).
- **Photo Management**: Bi-directional photo upload and gallery functionality for teachers and administrators with professional interfaces.

## System Features
- **SMS Notification System**: Full Twilio SMS integration for automatic parent messaging, with smart dual-channel notifications (email and SMS).
- **Comprehensive Authentication**: Robust and consistent teacher and parent login across all environments, with a focus on deployment stability.
- **Administrator Dashboard**: Full functionality including CSV/Excel export, QR generator, email settings, parent portal info, semester reset, teacher management, and a dedicated data export center.
- **Comprehensive Mustang Points System**: Enhanced award/deduct system with detailed academic, attendance, and behavior criteria.
- **Behavioral Reflection System**: Complete teacher-to-parent reflection workflow with assignment, student response, teacher approval, and parent notification via email and parent portal display.

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

## Communication Services
- **Twilio**: SMS notification system.
- **SendGrid API**: Email notification system for various events (registrations, password resets).

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

# Recent Changes

## Student Portal Gamification System Complete (September 2025)
- **Implemented comprehensive student token management** with permanent session persistence and automatic refresh mechanisms
- **Created dedicated authentication utilities** (`client/src/lib/studentAuth.ts`) for robust token handling with expiration tracking
- **Enhanced query client** to properly recognize all student-related endpoints (`/api/mood/`, `/api/progress/`, `/api/reflection/`) for authentication
- **Fixed API request format** in mood tracker mutations from object notation to proper parameter order (method, url, data)
- **Added session maintenance** with 5-minute interval checks and automatic token refresh extending 30-day expiration
- **Improved error handling** with route-specific token clearing to prevent clearing valid tokens inappropriately
- **All mood tracker functionality now fully operational**: mood logging, progress goal creation, and daily reflections working without authentication errors
- **Built Personalized Learning Path Visualizer** with adaptive content based on student performance, goal tracking, and achievement display
- **Created Interactive Gamified Skill Tree** with animated progression, unlock animations, floating particles, and comprehensive skill tracking across academic, behavioral, social, and leadership categories
- **Implemented horizontal scrolling functionality** in skill tree with 1400px canvas width for complete node visibility and navigation
- **Added seamless integration** between Learning Path Visualizer and Skill Tree with cross-navigation buttons
- **Enhanced student dashboard** with quick access to both gamification features via dedicated buttons

## Advanced Student Portal Enhancements (September 2025)
- **Created Immersive House History Storytelling Mode** with interactive chapters for all five houses (Franklin, Tesla, Curie, Nobel, Lovelace)
- **Added audio narration system** using Web Speech API for reading story content, historical facts, achievements, and quotes
- **Integrated historical person images** and biographical information for each house founder
- **Built Personalized Dashboard Theme System** with 6 color options: Traditional, Kelly Green, Gold, Orange, Midnight Scholar, Sunrise Energy, and MUSTANG Champion
- **Implemented theme unlocking system** based on academic and behavior point achievements
- **Added comprehensive micro-animations library** with interactive scaling, entrance effects, sparkle animations, and user feedback systems
- **Enhanced student dashboard** with staggered animations, themed components, and improved user experience

## House System Migration (September 2025)
- **Completed house name migration** from legacy names (Courie, West, Blackwell, Berruguete) to modern STEAM-themed names:
  - **Franklin** (🔬) - Innovation Through Discovery (Blue #1e40af)
  - **Tesla** (⚡) - Electrifying Excellence (Purple #7c3aed)
  - **Curie** (🧪) - Pioneering Progress (Red #dc2626)
  - **Nobel** (🎯) - Excellence in Achievement (Green #059669)
  - **Lovelace** (💻) - Coding the Future (Orange #ea580c)
- **Updated all system components**: Database schema, navigation dropdowns, pledge page, tutorial content, badge definitions, and scholar assignments
- **Badge system redesigned** with house-specific themes (Tesla Electrifier, Curie Scientist, Nobel Master, Lovelace Architect)
- **Database migration completed** with all 23 scholars successfully reassigned to new house structure
- **Parent portal and enhanced portal** verified working with new house names in all functionalities