// filepath: d:\Github\Brainforest\sap\ecosystem.config.js
module.exports = {
  apps: [
    {
      name: "brainforest-api", // Application name displayed in PM2
      script: "dist/index.js", // Path to the compiled entry point (relative to cwd)
      interpreter: "bun", // Tell PM2 to use bun to run the script
      cwd: "/home/ubuntu/brainforest-sap", // Absolute path to your deployment directory on the VM
      env_production: {
        // Environment variables for production
        NODE_ENV: "production",
        // Read PORT from VM environment, default to 8080 if not set
        PORT: process.env.PORT || 8080,
        // Read DATABASE_URL and JWT_SECRET directly from VM environment
        DATABASE_URL: process.env.DATABASE_URL,
        JWT_SECRET: process.env.JWT_SECRET,
      },
      // You can add other environments like env_development if needed
    },
  ],
};
