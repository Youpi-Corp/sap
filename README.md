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
  - Support for multiple roles (Learner, Teacher, Designer, Admin)
  - Authorization middleware
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
│   ├── user.ts      - User routes
│   └── info.ts      - Platform information
├── db/              - Database configuration
│   ├── client.ts    - DB client
│   ├── migrate.ts   - Migration utility
│   └── schema.ts    - Database schema
├── middleware/      - Application middleware
│   ├── auth.ts      - Authentication middleware
│   └── error.ts     - Error handling
├── services/        - Business logic
│   ├── user.ts      - User service
│   └── info.ts      - Information service
├── utils/           - Utilities
│   ├── password.ts  - Password management
│   └── response.ts  - Response formatting
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

- http://localhost:8080/swagger

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

### Platform Information

- `GET /info/get`: Retrieve general information
- `PUT /info/update`: Update information (Admin only)
- `GET /info/alive`: Service health check

## Database Schema

The project uses several tables to manage an educational platform:

- **user**: System users
- **chat**: Conversations
- **module**: Educational modules
- **course**: Individual courses
- **asset**: Course resources
- **subscription**: User progress tracking
- **info**: General platform information
- **refresh_token**: Refresh token management

## Deployment

The project is configured to be deployed on Render with the provided render.yaml file.

## Development

To contribute to the project:

1. Clone the repository
2. Install dependencies with `bun install`
3. Configure your local environment
4. Launch the application in development mode with `bun run dev`

## License

This project is subject to the license conditions specified in the LICENSE file.
