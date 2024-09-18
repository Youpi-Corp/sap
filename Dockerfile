# Use the Rust image for development
FROM rust:1.81-bullseye

# Set the working directory
WORKDIR /app

# Install Diesel CLI and libpq for PostgreSQL
RUN apt-get update && apt-get install -y libpq-dev
RUN cargo install diesel_cli --no-default-features --features postgres

# Copy the Cargo files and source code
COPY Cargo.toml Cargo.lock ./
COPY src ./src

# Build the application in release mode
RUN cargo build --release

# Expose the application port
EXPOSE 8080

# Default command (can be overridden in the devcontainer.json)
CMD ["cargo", "run"]
