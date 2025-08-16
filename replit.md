# Overview

The "PBIS House of Champions" is a web application designed for Bush Hills STEAM Academy middle school to manage a house points system. Students, assigned to one of five houses, earn points for academic excellence, attendance, and behavior. The system provides a comprehensive Positive Behavioral Interventions and Supports (PBIS) framework, featuring enhanced dropdown categories, individual teacher dashboards for recognizing "MUSTANG" traits, a house sorting generator, and photo upload capabilities. It also displays program information for parents, incorporates the official BHSA Mustangs Crest logo, and includes robust administrator authentication with role-based permissions. The project includes a fully operational bi-directional parent-teacher messaging system with database persistence and reply functionality. The project's vision is to foster positive behavior, academic achievement, and school pride within the student body.

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