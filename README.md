# Brainforest - Sap (Backend)

This is the backend API for the Brainforest application, built with Bun and Elysia.js. It handles business logic, data storage, and authentication.

## Features

- RESTful API for frontend communication
- User authentication and session management (JWT-based)
- CRUD operations for modules, users, and other resources
- Database integration with Drizzle ORM

## Tech Stack

- **Runtime**: [Bun](https://bun.sh/)
- **Framework**: [Elysia.js](https://elysiajs.com/)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **ORM**: [Drizzle ORM](https://orm.drizzle.team/)
- **Database**: [PostgreSQL](https://www.postgresql.org/)
- **Testing**: [Vitest](https://vitest.dev/)
- **Linting**: [ESLint](https://eslint.org/)

## Getting Started

### Prerequisites

- [Bun](https://bun.sh/)
- [Docker](https://www.docker.com/) and [Docker Compose](https://docs.docker.com/compose/) (for running the database)

### Installation

1.  Navigate to the backend directory:
    ```sh
    cd brainforest/sap
    ```
2.  Install the dependencies:
    ```sh
    bun install
    ```

### Database Setup

1.  Create a `.env` file in the `sap` directory by copying the example:
    ```sh
    cp .env.example .env
    ```
2.  Update the `DATABASE_URL` in your `.env` file with your database credentials.
    ```env
    # .env
    DATABASE_URL="postgresql://user:password@localhost:5432/brainforest?schema=public"
    JWT_SECRET="your-super-secret-key"
    ```
3.  Start the PostgreSQL database using Docker Compose:
    ```sh
    docker-compose up -d
    ```
4.  Run the development setup script to apply migrations:
    ```sh
    bun run setup
    ```

### Running the Development Server

To start the local development server with auto-reloading, run:

```sh
bun run dev
```

The API will be available at `http://localhost:8080` and the API documentation at `http://localhost:8080/swagger`.

## Available Scripts

- `bun run dev`: Starts the development server with hot-reloading.
- `bun run build`: Compiles TypeScript and builds the application for production.
- `bun start`: Starts the production server.
- `bun run lint`: Lints the codebase using ESLint.
- `bun run db:migrate`: Applies database migrations.
- `bun run test:watch`: Runs tests in watch mode.

## Testing

This project uses [Vitest](https://vitest.dev/) for testing. Tests are located in the `src/__tests__` directory.

To run tests:
```sh
bun test
```

## Security

Security policies and procedures for reporting vulnerabilities are detailed in the root `SECURITY.md` file.

## Contributing

Contributions are welcome! Please read our `CONTRIBUTING.md` file for details on our code of conduct and the process for submitting pull requests.


