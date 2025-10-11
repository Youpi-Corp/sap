#!/usr/bin/env bun
/**
 * Script to test email functionality
 * Run with: bun run src/scripts/test-email.ts <email_address>
 * 
 * Example:
 * bun run src/scripts/test-email.ts user@example.com
 */

import { emailService } from "../services/email";

async function testEmail(): Promise<void> {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.error("❌ Error: Email address required");
    console.log("\n📖 Usage: bun run src/scripts/test-email.ts <email_address>");
    console.log("\n📝 Example:");
    console.log("   bun run src/scripts/test-email.ts user@example.com");
    process.exit(1);
  }

  const testEmail = args[0];

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(testEmail)) {
    console.error("❌ Error: Invalid email format");
    process.exit(1);
  }

  console.log("\n🧪 Testing Email Service");
  console.log("=".repeat(60));
  console.log("📧 Test email address:", testEmail);
  console.log("=".repeat(60));

  try {
    // Test account deletion email
    console.log("\n📤 Sending account deletion test email...");
    await emailService.sendAccountDeletionEmail(testEmail, "Test User");
    
    console.log("\n✅ Email sent successfully!");
    console.log("\n💡 Tips:");
    console.log("   - Check your inbox (and spam folder)");
    console.log("   - If using console mode, check the terminal output above");
    console.log("   - To enable real email sending, configure RESEND_API_KEY or SENDGRID_API_KEY");
    console.log("   - See EMAIL_SETUP.md for detailed configuration instructions\n");
  } catch (error) {
    console.error("\n❌ Error sending email:", error);
    process.exit(1);
  }
}

testEmail();
