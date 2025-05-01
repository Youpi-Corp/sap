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
        PORT: 8080, // Or your desired production port
        DATABASE_URL:
          "postgres://brainforestadm:YoUpIfOrEsT842@localhost:5432/prod", // Your VM DB connection string
        JWT_SECRET: "youpicacaproutepipi8882", // Your production JWT secret
      },
      // You can add other environments like env_development if needed
    },
  ],
};
