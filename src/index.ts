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
console.log("CORS Origins:", process.env.NODE_ENV === "production"
  ? ["https://brain-forest.works", "https://www.brain-forest.works"]
  : "all origins (development)"
);

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
          { name: "Courses", description: "Course management endpoints" },
        ],
      },
    }))  // Puis ajoutez les autres middlewares
  .use(setupErrorHandler())
  .use(cookie())
  .use(
    cors({
      origin: (request) => {
        const origin = request.headers.get('origin');
        console.log(`CORS: Checking origin: ${origin || 'none'}`);
        console.log(`CORS: Environment: ${process.env.NODE_ENV || 'undefined'}`);

        // Always allow these production origins regardless of NODE_ENV
        const productionOrigins = [
          "https://brain-forest.works",
          "https://www.brain-forest.works"
        ];

        // If no origin (direct requests), allow
        if (!origin) {
          console.log('CORS: No origin header, allowing request');
          return true;
        }

        // Check if it's a production origin
        if (productionOrigins.includes(origin)) {
          console.log(`CORS: Production origin allowed: ${origin}`);
          return true;
        }

        // In development or for localhost, allow all
        if (process.env.NODE_ENV !== "production" ||
          origin.includes('localhost') ||
          origin.includes('127.0.0.1')) {
          console.log(`CORS: Development/localhost origin allowed: ${origin}`);
          return true;
        }

        console.log(`CORS: Origin blocked: ${origin}`);
        return false;
      },
      credentials: true,
      allowedHeaders: [
        "Content-Type",
        "Authorization",
        "X-Requested-With",
        "Accept",
        "Cookie",
        "Set-Cookie",
        "Cache-Control",
        "Pragma"
      ],
      methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
      maxAge: 86400, // 24 hours
      preflight: true
    })
  )// Add request logging middleware
  .onRequest(({ request }) => {
    const timestamp = new Date().toISOString();
    const method = request.method;
    const url = request.url;
    const origin = request.headers.get('origin');
    const userAgent = request.headers.get('user-agent');
    console.log(`[${timestamp}] ${method} ${url}`);
    console.log(`  Origin: ${origin || 'none'}`);
    console.log(`  User-Agent: ${userAgent || 'none'}`);

    // Log preflight requests specifically
    if (method === 'OPTIONS') {
      console.log(`[PREFLIGHT] ${url} from ${origin || 'unknown origin'}`);
      console.log('  Available CORS headers will be automatically handled by @elysiajs/cors');
    }
  }).use(setupRoutes).get("/health", () => {
    return success({
      status: "ok",
      timestamp: new Date().toISOString(),
    });
  })
  .get("/cors-test", ({ request }) => {
    const origin = request.headers.get('origin');
    return success({
      message: "CORS test endpoint",
      environment: process.env.NODE_ENV || "development",
      origin: origin || "none",
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
      error: 'message' in error ? error.message : "Internal Server Error",
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
