# Stage 1: Build the application
FROM node:20-alpine AS builder
WORKDIR /app
COPY package.json bun.lock ./
RUN npm install -g bun
RUN bun install
COPY . .

# Stage 2: Run the application
FROM node:20-alpine
RUN apk add --no-cache postgresql-client
RUN npm install -g bun
WORKDIR /app
COPY --from=builder /app/ ./
COPY docker-entrypoint.sh ./docker-entrypoint.sh
RUN chmod +x ./docker-entrypoint.sh
# Convert Windows line endings to Unix line endings
RUN sed -i 's/\r$//' ./docker-entrypoint.sh
EXPOSE 8080
ENTRYPOINT ["./docker-entrypoint.sh"]
