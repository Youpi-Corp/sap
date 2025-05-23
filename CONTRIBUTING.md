# Contributing to Brainforest API

First off, thank you for considering contributing to Brainforest API! It's people like you that make Brainforest API such a great tool.

## Where do I go from here?

If you've noticed a bug or have a feature request, [make one](https://github.com/your-username/brainforest-api/issues/new)! It's generally best if you get confirmation of your bug or approval for your feature request this way before starting to code.

If you have a general question, feel free to ask in the [Discussions](https://github.com/your-username/brainforest-api/discussions) section.

## Fork & create a branch

If you decide to fix a bug or implement a feature, great!

1.  Fork the repository to your own GitHub account.
2.  Clone the project to your machine.
3.  Create a branch locally with a succinct but descriptive name, like `fix/login-bug` or `feature/new-endpoint`.
4.  Commit your changes to your branch.
5.  Push your branch to your fork.
6.  Open a pull request from your branch to the main Brainforest API repository.

## Development Setup

To get the development environment set up:

1.  **Prerequisites**:
    - Bun (latest version)
    - PostgreSQL
2.  **Installing dependencies**:
    ```bash
    bun install
    ```
3.  **Environment variable configuration**: Create a `.env` file at the root of the project. You can copy `.env.example` (if one exists) or use the following template:
    ```
    DATABASE_URL=postgres://user:password@localhost:5432/db_name
    JWT_SECRET=your_secure_secret_key
    PORT=8080
    NODE_ENV=development
    ```
    Replace the placeholder values with your actual configuration.
4.  **Database Migrations**:
    - To run existing migrations:
      ```bash
      bun run src/db/migrate.ts
      ```
    - To generate new migrations after schema changes:
      ```bash
      bunx drizzle-kit generate:pg
      ```
5.  **Starting the Application**:
    - Development mode (with auto-reloading):
      ```bash
      bun run dev
      ```
      or
      ```bash
      bun run --watch src/index.ts
      ```

## Coding Guidelines

- **TypeScript**: Follow standard TypeScript best practices.
- **Linting**: This project uses ESLint. Please ensure your code passes linting checks before submitting a pull request. You can run the linter with `bun lint` (assuming you add this script to `package.json`).
- **Testing**: Please add tests for any new features or bug fixes. (Details on running tests would go here if a testing framework is set up).
- **Commit Messages**: Follow conventional commit message standards if possible (e.g., `fix: correct login redirect`, `feat: add user profile page`).

## Pull Request Process

1.  Ensure any install or build dependencies are removed before the end of the layer when doing a build.
2.  Update the README.md with details of changes to the interface, this includes new environment variables, exposed ports, useful file locations and container parameters.
3.  Increase the version numbers in any examples files and the README.md to the new version that this Pull Request would represent. The versioning scheme we use is [SemVer](http://semver.org/).
4.  You may merge the Pull Request in once you have the sign-off of two other developers, or if you do not have permission to do that, you may request the second reviewer to merge it for you.

## Code of Conduct

This project and everyone participating in it is governed by the [Brainforest API Code of Conduct](CODE_OF_CONDUCT.md). By participating, you are expected to uphold this code. Please report unacceptable behavior.

Thank you for your contribution!
