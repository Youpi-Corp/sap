# Brainforest API

A TypeScript port of the Brainforest educational platform backend using Bun, Hono, and Drizzle ORM.

## Project Structure

This project follows a clean architecture pattern:

- **Domain**: Core models and repository interfaces
- **Application**: Business logic services
- **Infrastructure**: Repository implementations, database connections, and middleware
- **Routes**: API endpoints

## Setup

1. **Install dependencies**:

   ```bash
   bun install
   ```

2. **Set up environment variables**:
   Create a `.env` file based on the `.env.example` file.

3. **Run database migrations**:

   ```bash
   bun run migrate
   ```

4. **Start the development server**:

   ```bash
   bun run dev
   ```

5. **Build for production**:
   ```bash
   bun run build
   ```

## API Documentation

The API documentation is available at `/swagger-ui/` when the server is running.

## Features

- User authentication with JWT
- Role-based access control
- OpenAPI/Swagger documentation
- Database access with Drizzle ORM
- Modern TypeScript stack with Bun runtime

## Endpoints

### Authentication

- `POST /auth/login`: Login endpoint
- `POST /auth/register`: Registration endpoint

### User Management

- `GET /user/get/{userId}`: Get user by ID
- `GET /user/get_by_email/{email}`: Get user by email
- `POST /user/create`: Create a new user (Admin only)
- `GET /user/list`: List all users (Admin only)
- `DELETE /user/delete/{userId}`: Delete a user (Admin only)
- `PUT /user/update/{userId}`: Update a user
- `GET /user/me`: Get current user profile
- `GET /user/get_email_used/{email}`: Check if an email is already used

### Info

- `GET /info/get`: Get platform information
- `GET /info/alive`: Health check endpoint

## Architecture

The application follows clean architecture principles to maintain separation of concerns:

```
src/
├── domain/           - Business entities and repository interfaces
├── application/      - Use cases and business logic
├── infrastructure/   - External systems adapters (database, auth)
├── routes/           - API endpoints
└── schema/           - Database schema definitions
```
