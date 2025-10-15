# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Essential Commands
- `pnpm dev` - Start development server with Turbo
- `pnpm build` - Build for production with Turbo
- `pnpm start` - Start production server
- `pnpm lint` - Run Biome linter
- `pnpm lint:fix` - Run Biome linter with auto-fix
- `pnpm check` - Run Biome for all checks (lint + format)
- `pnpm check:fix` - Run Biome checks with auto-fix
- `pnpm type` - Run TypeScript type checking

### Database Commands
- `pnpm db:push` - Push Prisma schema changes to database
- `pnpm db:studio` - Open Prisma Studio database browser

## Architecture Overview

### Core Technology Stack
- **Framework**: Next.js 15 with App Router
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: NextAuth.js v5 (beta)
- **AI Integration**: Multiple providers (OpenAI, Together AI, Ollama, LM Studio)
- **Rich Text Editor**: Plate.js (ProseMirror-based)
- **Styling**: Tailwind CSS
- **State Management**: Zustand
- **File Uploads**: UploadThing
- **Drag & Drop**: DND Kit

### Key Architectural Patterns

#### Presentation System
The application uses a **document-centric architecture** where:

1. **BaseDocument** - Universal document entity with type discriminator
2. **Presentation** - Specialized document type storing slide content as JSON
3. **CustomTheme** - User-defined styling configurations
4. **GeneratedImage** - AI-generated image registry

#### Content Structure
- Presentations store slide content as structured JSON in the database
- Each slide contains Plate.js editor content with custom layout elements
- Layout system uses custom element types (bullets, timelines, charts, etc.)
- Themes are applied via CSS variables and comprehensive theme objects

#### AI Generation Pipeline
1. **Outline Generation**: Creates structured outline from user prompt
2. **Web Search Integration**: Uses Tavily API for research context (optional)
3. **Slide Content Generation**: Converts outline to slide content via streaming AI
4. **Image Generation**: Creates relevant images using various AI models

### Custom Element System

#### Layout Elements (src/components/presentation/editor/lib.ts)
- **Groups**: Bullet lists, timelines, cycles, comparisons, etc.
- **Charts**: Pie, bar, area, radar, scatter, line charts
- **Interactive**: Buttons, before/after comparisons, pros/cons

#### Element Capabilities
- **Orientation**: Vertical/horizontal for supported elements
- **Sidedness**: Single/double layouts
- **Numbering**: Automatic numbering support
- **Chart Compatibility**: Charts can convert between compatible data structures

### Database Schema
- **User Authentication**: NextAuth integration with role-based access
- **Document Management**: Unified document system with type polymorphism
- **Theme System**: User-created themes with JSON configuration storage
- **Content Relationships**: Proper foreign key relationships with cascade deletion

### Environment Configuration
Environment variables are validated through `@t3-oss/env-nextjs` with Zod schemas. Required variables include:
- Database connection
- AI provider API keys (OpenAI, Together AI)
- Authentication secrets (NextAuth, Google OAuth)
- File upload tokens (UploadThing)
- External API keys (Unsplash, Tavily)

## Development Guidelines

### Code Organization
- **App Router**: All routes in `src/app/` following Next.js 15 conventions
- **Components**: Organized by feature (presentation, plate, ui, auth)
- **Server Code**: Separate server-only utilities in `src/server/`
- **Types**: Comprehensive TypeScript definitions throughout

### State Management
- **Global State**: Zustand stores for presentation state
- **Form State**: React Hook Form with Zod validation
- **Editor State**: Plate.js editor state management
- **Auth State**: NextAuth session management

### Styling Approach
- **Component-First**: Tailwind utility classes for component styling
- **Theme System**: CSS custom properties for dynamic theming
- **Responsive Design**: Mobile-first responsive patterns
- **Animation**: Framer Motion for complex animations

### AI Integration
- **Model Picker**: Unified interface for multiple AI providers
- **Streaming Responses**: Real-time content generation
- **Local Models**: Support for Ollama and LM Studio
- **Error Handling**: Comprehensive error recovery for AI failures

## Testing and Quality

### Code Quality Tools
- **Biome**: Linting and formatting (replaces ESLint/Prettier)
- **TypeScript**: Strict type checking enabled
- **Prisma**: Type-safe database operations

### Development Workflow
1. Use `pnpm dev` for local development with hot reload
2. Run `pnpm check:fix` before committing changes
3. Use `pnpm type` to verify type correctness
4. Test with local AI models when possible (Ollama/LM Studio)

## Key Files to Understand

### Core Application Files
- `src/app/api/presentation/generate/route.ts` - Main presentation generation endpoint
- `src/components/presentation/editor/lib.ts` - Custom element definitions and utilities
- `src/lib/presentation/themes.ts` - Theme system implementation
- `prisma/schema.prisma` - Database schema definition
- `src/env.js` - Environment variable validation

### Configuration Files
- `next.config.js` - Next.js configuration
- `tailwind.config.ts` - Tailwind CSS configuration
- `package.json` - Dependencies and scripts