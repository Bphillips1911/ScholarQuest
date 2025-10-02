# Overview

The "PBIS House of Champions" is a web application for Bush Hills STEAM Academy, designed to manage a house points system. Production URL: https://pbishouseofchampions.com It allows students to earn points for academic, attendance, and behavioral achievements within a comprehensive Positive Behavioral Interventions and Supports (PBIS) framework. Key features include individual teacher dashboards for recognizing "MUSTANG" traits, a house sorting generator, photo upload capabilities, and program information for parents. The application also incorporates the official BHSA Mustangs Crest logo, robust administrator authentication with role-based permissions, and a bi-directional parent-teacher messaging system. The project aims to foster positive behavior, academic achievement, and school pride.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend
- **Framework**: React 18 with TypeScript (Vite).
- **UI Library**: Shadcn/ui built on Radix UI.
- **Styling**: Tailwind CSS with custom CSS and advanced animations.
- **Routing**: Wouter.
- **State Management**: TanStack React Query for server state.
- **Design**: Mobile-first, glassmorphism effects, consistent BHSA branding, animated login portals, and a three-theme system (Normal, Light, Dark) for dashboards.
- **Animations**: Welcome animations, rotating house spotlights, glow pulses, sparkle effects, PBIS Champion flash effects, and celebratory animations.
- **Audio**: Ultra-fast competitive music.
- **Accessibility**: High contrast mode, font size controls, screen reader announcements, reduced motion support.
- **Gamification**: Student token management, personalized learning path visualizer, and an interactive gamified skill tree with animated progression.
- **Student Portal Enhancements**: Immersive house history storytelling mode with audio narration, personalized dashboard themes (6 options), and micro-animations library.

## Backend
- **Framework**: Express.js with TypeScript.
- **API Design**: RESTful API for houses, scholars, and point entries.
- **Build Process**: ESBuild for server, Vite for client.

## Data Storage
- **Database**: PostgreSQL with Drizzle ORM, hosted on Neon Database.
- **Schema**: Tables for houses, scholars, point entries, PBIS entries, PBIS photos, teachers, parents, parent-teacher messages, administrators, and admin sessions.
- **Scholars Table**: Automatic system-generated usernames.
- **File Storage**: Local file system for photo uploads (multer).

## Authentication and Authorization
- **Administrator**: Role-based permissions (Principal, Assistant Principal, Counselor, Database Manager) with approval system.
- **Teacher**: Grade-level permissions with role-specific restrictions (Unified Arts teachers cannot add/deactivate students).
- **Session Management**: JWT-based sessions.
- **Credential Generation**: Automatic username/password generation for new students.

## System Features
- **SMS Notification System**: Twilio integration for automatic parent messaging (SMS and email).
- **Comprehensive Authentication**: Robust teacher and parent login.
- **Administrator Dashboard**: CSV/Excel export, QR generator, email settings, parent portal info, semester reset, teacher management, data export center.
- **Comprehensive Mustang Points System**: Enhanced award/deduct system with detailed criteria.
- **Behavioral Reflection System**: Teacher-to-parent workflow with assignment, student response, teacher approval, and parent notification. Includes a comprehensive reflection rejection system with predefined reasons.
- **Photo Management**: Bi-directional photo upload and gallery for teachers and administrators.
- **Advanced UI System**: Micro-interactions, contextual emoji feedback, gamified achievement system, enhanced mobile responsiveness, and interactive house cards/achievement badges.
- **House System**: Renamed to honor diverse STEAM pioneers (Johnson, Marshall, West, Drew, Tesla) with updated icons and storytelling.
- **Role-Based Permissions**: Unified Arts teachers have restricted permissions - cannot add new students or deactivate student accounts, maintaining focus on their instructional role while preserving access to points, messaging, and class management features.
- **Four Advanced Features (2025)**: 
  - One-Click Student Progress Report Generator: AI-powered comprehensive reporting with customizable date ranges and detailed analytics
  - Interactive Achievement Playground: Gamified progress tracking with animated badges, unlockable achievements, and experience points (available in both student dashboard and admin monitoring)
  - Interactive Teacher Performance Heatmap (Admin-Only): Advanced analytics dashboard with color-coded performance metrics, trend analysis, and CSV export
  - AI-Powered Adaptive Recommendation Engine: Personalized learning insights with implementation tracking and success metrics
- **Student Achievement System**: Full gamification with experience points, achievement levels, category filtering, progress visualization, and integration with student dashboard navigation.
- **Staff Champions Awards**: Recognition program for teachers and staff with role-based admin access (Dr. Phillips and Dr. Tiffani only). Features separate point categories for teachers (15 categories) and staff (12 categories), auto-refresh functionality, and comprehensive tracking. Staff members include secretaries, nurses, bookkeeper, CNP staff, ISS facilitator, custodians, and SRO with dedicated recognition categories.

# External Dependencies

## Database Services
- **Neon Database**: Serverless PostgreSQL hosting.
- **Drizzle ORM**: Type-safe database queries.

## UI and Styling
- **Radix UI**: Accessible component primitives.
- **Tailwind CSS**: Utility-first CSS framework.
- **Lucide React**: Icon library.
- **Embla Carousel**: Carousel component.
- **Shadcn/ui**: Component library.

## Development Tools
- **Vite**: Build tool and development server.
- **TanStack React Query**: Server state management.
- **Wouter**: React router.
- **ESBuild**: JavaScript bundler.
- **React Hook Form**: Form handling.

## Communication Services
- **Twilio**: SMS notification system.
- **SendGrid API**: Email notification system.

## Data Export
- **CSV and Excel (.xlsx)** export formats.

## Form Validation
- **Zod**: Schema validation.
- **Drizzle-Zod**: Drizzle schema integration.
- **Hookform Resolvers**: React Hook Form integration.

## Utility Libraries
- **date-fns**: Date manipulation.
- **clsx & tailwind-merge**: Conditional CSS class composition.
- **class-variance-authority**: Type-safe component variant handling.
- **nanoid**: URL-safe unique ID generation.