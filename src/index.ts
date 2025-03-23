import { Elysia } from "elysia";
import { swagger } from "@elysiajs/swagger";
import { cors } from "@elysiajs/cors";
import { cookie } from "@elysiajs/cookie";
import { setupRoutes } from "./api";
import { setupErrorHandler } from "./middleware/error";
import { success, error } from "./utils/response";

// Log startup info
console.log("Starting server...");
console.log("Environment:", process.env.NODE_ENV || "development");
console.log("Port:", process.env.PORT || "8080");

// Get port from environment variable
const port = parseInt(process.env.PORT || "8080");

// Create the application with minimal config
const app = new Elysia()
  // IMPORTANT: Placez Swagger en premier, avant les autres middlewares
  .use(
    swagger({
      path: "/swagger",
      documentation: {
        info: {
          title: "Brainforest API",
          version: "1.0.0",
          description: "RESTful API for the Brainforest learning platform",
        },
        tags: [
          { name: "Authentication", description: "Auth endpoints" },
          { name: "Users", description: "User management endpoints" },
          { name: "Info", description: "Info endpoints" },
          { name: "System", description: "System health endpoints" },
        ],
      },
    })
  )
  // Puis ajoutez les autres middlewares
  .use(setupErrorHandler())
  .use(cookie())
  .use(
    cors({
      allowedHeaders: [
        "Content-Type",
        "Authorization",
        "X-Requested-With",
        "Accept",
      ],
      maxAge: 3600,
    })
  )
  .use(setupRoutes)
  .get("/health", () => {
    return success({
      status: "ok",
      timestamp: new Date().toISOString(),
    });
  })
  // Add a catch-all 404 route for any unmatched paths
  .all("*", ({ path }) => {
    return error(`Route not found: ${path}`, 404);
  })
  // Handle 404 errors in onError callback as well
  .onError(({ code, error, set, path }) => {
    set.status = code === "NOT_FOUND" ? 404 : 500;

    if (code === "NOT_FOUND") {
      console.log(`404 Not Found: ${path}`);
      return {
        success: false,
        error: `Route not found: ${path}`,
        statusCode: 404,
      };
    }

    // Other errors
    console.error(`Error [${code}]:`, error);
    return {
      success: false,
      error: error.message || "Internal Server Error",
      statusCode: set.status,
    };
  });

// Create server with logger
console.log(`Starting server with port: ${port}`);

// Start the server
app.listen(port, () => {
  console.log(`🚀 Server running at http://localhost:${port}`);
  console.log(`📚 Swagger UI available at http://localhost:${port}/swagger`);
});

// No default export to avoid double instantiation
