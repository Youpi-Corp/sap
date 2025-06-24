# Brainforest API

A comprehensive RESTful API for the Brainforest educational platform, built with modern TypeScript tooling including Bun, Elysia, and Drizzle ORM. This API powers a full-featured learning management system with course creation, user management, subscriptions, and progress tracking.

## Project Overview

The Brainforest API serves as the backend for an interactive educational platform that supports:

- **Course Management**: Create, update, and organize educational content with modules and lessons
- **User Management**: Complete authentication system with role-based access control
- **Learning Progress**: Track course completion, likes, and learning analytics
- **Subscription System**: Module-based subscriptions for content access
- **Content Organization**: Hierarchical structure with modules containing multiple courses/lessons

## Technology Stack

- **Runtime**: Bun - Ultra-fast JavaScript/TypeScript runtime and package manager
- **Web Framework**: Elysia - Modern, type-safe web framework optimized for Bun
- **ORM**: Drizzle ORM - Lightweight, type-safe SQL toolkit for TypeScript
- **Database**: PostgreSQL with full migration support
- **Authentication**: JWT (JSON Web Tokens) with refresh tokens and cookie management
- **API Documentation**: Swagger/OpenAPI with interactive documentation
- **Testing**: Vitest for unit and integration testing
- **Deployment**: PM2 process management with automated CI/CD

## Features

- **Complete Authentication System**:

  - User registration and login with secure password hashing
  - JWT-based session management with refresh tokens
  - Cookie-based authentication for web clients
  - Password reset and account verification workflows

- **Advanced Role-Based Access Control**:

  - Five distinct roles: USER, ADMIN, TEACHER, CONTENT_CREATOR, MODERATOR
  - Granular permission system with 20+ permissions
  - Many-to-many user-role relationships for flexible access control
  - Dynamic role assignment and verification
  - Permission-based endpoint protection

- **Comprehensive User Management**:

  - Full CRUD operations for user accounts
  - User profile management with customizable fields
  - Email validation and duplicate prevention
  - Administrative user creation and management tools

- **Educational Content Management**:

  - **Modules**: Top-level content containers with descriptions and metadata
  - **Courses/Lessons**: Individual learning units with rich content support
  - Hierarchical content organization (Module → Courses → Content)
  - Public/private visibility controls for content
  - Course completion tracking and progress analytics

- **Subscription and Progress System**:

  - Module-based subscription model for content access
  - Course completion tracking per user
  - Learning progress analytics and reporting
  - Like/unlike functionality for courses
  - Subscription management (subscribe/unsubscribe from modules)

- **Interactive API Documentation**:

  - Real-time Swagger interface at `/swagger`
  - Comprehensive endpoint documentation with examples
  - Interactive testing environment for development

- **Production-Ready Architecture**:
  - Automated database migrations with validation
  - Comprehensive error handling and logging
  - Performance optimized with connection pooling
  - CI/CD pipeline with automated testing and deployment
  - Health check endpoints for monitoring

## Project Structure

```
src/
├── api/             - API endpoint definitions with route handlers
│   ├── auth.ts      - Authentication routes (login, register, refresh, logout)
│   ├── course.ts    - Course/lesson management routes
│   ├── index.ts     - Main API router combining all route modules
│   ├── info.ts      - Platform information and health check routes
│   ├── module.ts    - Module management and subscription routes
│   ├── role.ts      - Role assignment and management routes
│   └── user.ts      - User CRUD and profile management routes
├── db/              - Database configuration and management
│   ├── client.ts    - Database connection client
│   ├── migrate.ts   - Main migration runner
│   ├── migrate-roles.ts - Role system migration script
│   ├── roles-migration.ts - Role and permission definitions for migration
│   └── schema.ts    - Complete database schema with all tables
├── middleware/      - Application middleware
│   ├── auth.ts      - JWT authentication and authorization middleware
│   └── error.ts     - Global error handling and response formatting
├── scripts/         - Utility and setup scripts
│   ├── create-admin.ts    - Admin user creation script
│   ├── init-roles.ts      - Initialize roles and permissions
│   ├── setup-dev.ts       - Development environment setup
│   ├── validate-migration.ts - Pre-migration validation
│   ├── reset-database.ts  - Database reset utilities
│   └── manage-user-roles.ts - User role management tools
├── services/        - Business logic layer
│   ├── course.ts    - Course/lesson business logic and data operations
│   ├── info.ts      - Platform information service
│   ├── module.ts    - Module management and subscription logic
│   ├── role.ts      - Role and permission management service
│   └── user.ts      - User management and authentication logic
├── utils/           - Shared utilities and helpers
│   ├── password.ts  - Password hashing and validation
│   ├── response.ts  - Standardized API response formatting
│   └── roles.ts     - Role definitions, permissions, and validation utilities
└── index.ts         - Application entry point and server initialization
```

## Installation

### Prerequisites

- **Bun** (latest version) - Download from [bun.sh](https://bun.sh)
- **PostgreSQL** (version 12 or higher)
- **Node.js** (for PM2 in production, optional for development)

### Quick Start

1. **Clone the repository and install dependencies**:

   ```bash
   git clone <repository-url>
   cd brainforest-api
   bun install
   ```

2. **Environment Configuration**:
   Create a `.env` file in the project root:

   ```env
   DATABASE_URL=postgresql://username:password@localhost:5432/brainforest
   JWT_SECRET=your_super_secure_jwt_secret_key_here
   PORT=8080
   NODE_ENV=development
   ```

3. **Database Setup**:

   ```bash
   # Run automated development setup (recommended)
   bun run setup

   # Or manual setup:
   bun run db:migrate    # Run database migrations
   bun run init:roles    # Initialize roles and permissions
   bun run create:admin  # Create an admin user (optional)
   ```

4. **Start Development Server**:
   ```bash
   bun run dev
   ```

The API will be available at `http://localhost:8080` with interactive documentation at `http://localhost:8080/swagger`.

## Database Management

### Migrations

The project uses Drizzle ORM for type-safe database operations with a comprehensive migration system:

```bash
# Generate new migration after schema changes
bun run db:generate

# Run pending migrations with validation
bun run migrate

# Push schema changes directly (development only)
bun run db:push

# Open Drizzle Studio for database inspection
bun run db:studio

# Reset database (destructive - use with caution)
bun run db:reset
```

### Database Scripts

```bash
# Development environment setup
bun run setup                    # Complete development setup
bun run db:validate              # Validate migration files and connection

# Role and user management
bun run init:roles               # Initialize roles and permissions
bun run create:admin             # Create admin user interactively
bun run migrate:roles            # Migrate to new role system

# Database utilities
bun run db:force-reset           # Force reset database (emergency use)
```

## Development

### Available Scripts

```bash
# Development
bun run dev                      # Start development server with hot reload
bun run test:watch               # Run tests in watch mode
bun run lint                     # Run ESLint code quality checks

# Building
bun run build                    # Build for production (cross-platform)
bun run build:win                # Build for Windows
bun run start                    # Start production server

# Database operations
bun run migrate                  # Run migrations with validation
bun run db:studio                # Open database management interface

# Utilities
bun run setup                    # Complete development environment setup
```

### Testing

The project includes comprehensive testing with Vitest:

```bash
# Run tests in watch mode during development
bun run test:watch

# Run tests once
bunx vitest run

# Run tests with coverage
bunx vitest run --coverage
```

## API Documentation

The API features comprehensive interactive documentation built with Swagger/OpenAPI:

- **Development**: http://localhost:8080/swagger
- **Production**: https://sap-m1i0.onrender.com/swagger
- **Detailed Documentation**: See [API_ROUTES.md](API_ROUTES.md) for complete endpoint documentation

### Key Features:

- Interactive testing interface with authentication support
- Real-time schema validation and examples
- Complete request/response documentation
- Authentication flow testing

## API Endpoints

### Authentication (`/auth`)

- `POST /auth/login` - User authentication with email/password
- `POST /auth/register` - Create new user account
- `POST /auth/refresh` - Refresh JWT access token
- `POST /auth/logout` - Secure user logout

### User Management (`/user`)

- `GET /user/me` - Get current user profile
- `GET /user/get/:userId` - Retrieve specific user by ID
- `GET /user/get_by_email/:email` - Find user by email address
- `GET /user/get_email_used/:email` - Check email availability
- `POST /user/create` - Create user (Admin only)
- `GET /user/list` - List all users with pagination (Admin only)
- `PUT /user/update/:userId` - Update user information
- `DELETE /user/delete/:userId` - Delete user account (Admin only)

### Role Management (`/role`)

- `GET /role/list` - List all available roles (Admin only)
- `POST /role/assign` - Assign role to user (Admin only)
- `POST /role/remove` - Remove role from user (Admin only)

### Module Management (`/module`)

- `GET /module/list` - List all modules (filtered by permissions)
- `GET /module/public` - Get public modules (no authentication required)
- `GET /module/get/:moduleId` - Get module details by ID
- `GET /module/owner/:ownerId` - Get modules by owner
- `GET /module/subscribed` - Get user's subscribed modules
- `GET /module/is-subscribed/:moduleId` - Check subscription status
- `POST /module/create` - Create new module
- `PUT /module/update/:moduleId` - Update module (owner/admin only)
- `POST /module/subscribe/:moduleId` - Subscribe to module
- `DELETE /module/unsubscribe/:moduleId` - Unsubscribe from module
- `DELETE /module/delete/:moduleId` - Delete module and all courses (owner/admin only)
- `POST /module/add-course/:moduleId/:courseId` - Add course to module
- `DELETE /module/remove-course/:moduleId/:courseId` - Remove course from module
- `GET /module/courses/:moduleId` - Get all courses in module

### Course/Lesson Management (`/course`)

- `GET /course/list` - List courses (filtered by user permissions)
- `GET /course/get/:courseId` - Get course details with access control
- `POST /course/create` - Create new course (requires permissions)
- `PUT /course/update/:courseId` - Update course content (owner/admin only)
- `DELETE /course/delete/:courseId` - Delete course (owner/admin only)
- `GET /course/owner/:ownerId` - Get courses by owner
- `POST /course/like/:courseId` - Like a course
- `DELETE /course/unlike/:courseId` - Unlike a course
- `GET /course/has-liked/:courseId` - Check if user liked course
- `GET /course/likes-count/:courseId` - Get total likes for course
- `POST /course/complete/:courseId` - Mark course as completed
- `GET /course/is-completed/:courseId` - Check if course is completed

### Platform Information (`/info`)

- `GET /info/get` - Get general platform information
- `PUT /info/update` - Update platform information (Admin only)
- `GET /info/alive` - Health check endpoint for monitoring

### Access Control Summary

**Public Access**: Module browsing, health checks  
**Authenticated Users**: Content viewing, subscriptions, progress tracking  
**Content Creators**: Course creation, own content management  
**Teachers**: Enhanced course management, grading capabilities  
**Admins**: Full system access, user management, platform configuration

For detailed API documentation with request/response examples, see [API_ROUTES.md](API_ROUTES.md).

## Deployment

The project supports multiple deployment strategies with automated CI/CD:

### Production Deployment

**Automatic Deployment**:

- Pushes to `main` branch trigger production deployment
- Pushes to `dev` branch trigger development environment deployment

**Manual Deployment**:

```bash
# Build the application
bun run build

# Start with PM2 (recommended for production)
pm2 start "bun dist/index.js" --name brainforest-api

# Or direct execution
NODE_ENV=production bun dist/index.js
```

### Environment Variables

Ensure these environment variables are configured in production:

```env
# Database
DATABASE_URL=postgresql://user:password@host:5432/database

# Authentication
JWT_SECRET=your_production_jwt_secret

# Server
PORT=8080
NODE_ENV=production
HOST=0.0.0.0
```

### Deployment Features

- **Health Checks**: `/info/alive` endpoint for monitoring
- **Process Management**: PM2 integration for process monitoring and restart
- **Database Migrations**: Automated migration validation and execution
- **Error Handling**: Comprehensive error logging and reporting
- **Performance Monitoring**: Built-in request/response logging

## Contributing

### Development Workflow

1. **Setup**: Run `bun run setup` for complete development environment
2. **Coding**: Follow TypeScript best practices and ESLint rules
3. **Testing**: Write tests for new features and run `bun run test:watch`
4. **Documentation**: Update API documentation and README as needed
5. **Migration**: Generate database migrations for schema changes

### Code Quality

- **TypeScript**: Strict type checking enabled
- **ESLint**: Code quality and consistency enforcement
- **Drizzle**: Type-safe database operations
- **Testing**: Comprehensive test coverage with Vitest

## License

This project is licensed under the terms specified in the [LICENSE](LICENSE) file.

## Additional Resources

- **API Routes**: [API_ROUTES.md](API_ROUTES.md) - Complete endpoint documentation
- **Migration Guide**: [MIGRATION_GUIDE.md](MIGRATION_GUIDE.md) - Database migration procedures
- **Contributing**: [CONTRIBUTING.md](CONTRIBUTING.md) - Development guidelines
- **Security**: [SECURITY.md](SECURITY.md) - Security policies and reporting
- **Changelog**: [CHANGELOG.md](CHANGELOG.md) - Version history and updates

---

**Live API**: https://sap-m1i0.onrender.com  
**Documentation**: https://sap-m1i0.onrender.com/swagger
