# Brainforest API

A RESTful API for the Brainforest educational platform, developed with TypeScript, Bun, Elysia, and Drizzle ORM.

## Project Overview

This project provides a backend API for the Brainforest learning platform. It handles user authentication, profile management, platform information, and is designed to be extensible for future features.

## Technology Stack

- **Runtime**: Bun - A fast JavaScript/TypeScript runtime
- **Web Framework**: Elysia - Modern web framework for Bun
- **ORM**: Drizzle ORM - High-performance ORM for TypeScript
- **Database**: PostgreSQL
- **Authentication**: JWT (JSON Web Tokens)
- **API Documentation**: Swagger/OpenAPI

## Features

- **Complete Authentication**:
  - User registration and login
  - Session management with JWT
  - Refresh tokens
  - Cookie management
- **Role-based Access Control**:
  - Support for multiple roles (USER, ADMIN, TEACHER, CONTENT_CREATOR, MODERATOR)
  - Permission-based access control
  - Many-to-many relationship between users and roles
  - Secure role assignment and verification
  - Granular permission system for fine-tuned access control
- **User Management**:
  - Create, read, update, and delete users
  - User profiles with customizable roles
- **Interactive API Documentation**:
  - Real-time Swagger interface
- **Educational Database Structure**:
  - Support for modules, courses, assets, and conversations
  - Subscription system for progress tracking

## Project Structure

```
src/
├── api/             - API endpoint definitions
│   ├── auth.ts      - Authentication routes
│   ├── course.ts    - Course routes
│   ├── index.ts     - API index, combines all route modules
│   ├── info.ts      - Platform information routes
│   ├── module.ts    - Module routes
│   ├── role.ts      - Role management routes
│   └── user.ts      - User routes
├── db/              - Database configuration
│   ├── client.ts    - DB client
│   ├── migrate.ts   - Migration utility
│   ├── migrate-roles.ts - Script for migrating to new role system
│   ├── roles-migration.ts - Defines roles and permissions for migration
│   └── schema.ts    - Database schema
├── middleware/      - Application middleware
│   ├── auth.ts      - Authentication middleware
│   └── error.ts     - Error handling
├── scripts/         - Utility scripts
│   ├── create-admin.ts - Script to create an admin user
│   └── init-roles.ts   - Script to initialize roles and permissions
├── services/        - Business logic
│   ├── course.ts    - Course service
│   ├── info.ts      - Information service
│   ├── module.ts    - Module service
│   ├── role.ts      - Role service
│   └── user.ts      - User service
├── utils/           - Utilities
│   ├── password.ts  - Password management
│   ├── response.ts  - Response formatting
│   └── roles.ts     - Role definitions and utilities
└── index.ts         - Application entry point
```

## Installation

1. **Prerequisites**:
   - Bun (latest version)
   - PostgreSQL
2. **Installing dependencies**:
   ```
   bun install
   ```
3. **Environment variable configuration**: Create a .env file at the root of the project with the following variables:
   ```
   DATABASE_URL=postgres://user:password@localhost:5432/db_name
   JWT_SECRET=your_secure_secret_key
   PORT=8080
   NODE_ENV=development
   ```

## Database Migrations

1. **Running migrations**:
   ```
   bun run src/db/migrate.ts
   ```
2. **Generating new migrations**:
   ```
   bunx drizzle-kit generate:pg
   ```

## Starting the Application

1. **Development mode**:
   ```
   bun run --watch src/index.ts
   ```
   or
   ```
   bun run dev
   ```
2. **Production mode**:
   ```
   NODE_ENV=production bun src/index.ts
   ```
   or
   ```
   bun start
   ```

## API Documentation

The API is documented with Swagger and accessible at:

- Local: http://localhost:8080/swagger (if `PORT` is set to 8080)
- Production: https://sap-m1i0.onrender.com/swagger

## API Endpoints

### Authentication

- `POST /auth/login`: User login
- `POST /auth/register`: User registration
- `POST /auth/refresh`: Token refresh
- `POST /auth/logout`: Logout

### User Management

- `GET /user/me`: Current user profile
- `GET /user/get/:userId`: Retrieve a user by ID
- `GET /user/get_by_email/:email`: Retrieve a user by email
- `GET /user/get_email_used/:email`: Check if an email is already in use
- `POST /user/create`: Create a user (Admin only)
- `GET /user/list`: List all users (Admin only)
- `PUT /user/update/:userId`: Update a user
- `DELETE /user/delete/:userId`: Delete a user (Admin only)

### Role Management

- `GET /role/list`: List all roles (Admin only)
- `POST /role/assign`: Assign a role to a user (Admin only)
- `POST /role/remove`: Remove a role from a user (Admin only)

### Platform Information

- `GET /info/get`: Retrieve general information
- `PUT /info/update`: Update information (Admin only)
- `GET /info/alive`: Service health check

### Module Management

- `GET /module/list`: List all modules
- `GET /module/get/:moduleId`: Get a module by ID
- `POST /module/create`: Create a new module (Requires CREATE_MODULE permission or ADMIN/TEACHER role)
- `PUT /module/update/:moduleId`: Update a module (Owner or ADMIN/TEACHER role)
- `DELETE /module/delete/:moduleId`: Delete a module (Owner or ADMIN/TEACHER role)
- `GET /module/owner/:ownerId`: Get modules by owner ID

### Course Management

- `GET /course/list`: List courses based on user permissions
  - Admins see all courses
  - Regular users see only public courses and their own courses
- `GET /course/get/:courseId`: Get course by ID
  - Access granted if:
    - Course is public, OR
    - User owns the course, OR
    - User has ADMIN role
- `POST /course/create`: Create a new course
  - Requires:
    - CREATE_COURSE permission or TEACHER/ADMIN role
    - User must own the module or be an admin
- `PUT /course/update/:courseId`: Update a course
  - Access granted if user owns the course or has ADMIN role
- `DELETE /course/delete/:courseId`: Delete a course
  - Access granted if user owns the course or has ADMIN role
- `GET /course/owner/:ownerId`: Get courses by owner ID
  - When requesting your own courses or as admin: all courses
  - Otherwise: only public courses

## License

This project is subject to the license conditions specified in the LICENSE file.
