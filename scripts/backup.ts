import { exec } from "child_process";
import { promisify } from "util";
import * as dotenv from "dotenv";
import { format } from "date-fns";
import * as fs from "fs";
import * as path from "path";

dotenv.config();

const execAsync = promisify(exec);

async function backupDatabase() {
  const timestamp = format(new Date(), "yyyyMMdd_HHmmss");
  const backupDir = path.join(__dirname, "../backups");
  const backupFile = path.join(backupDir, `backup_${timestamp}.sql`);

  // Create backups directory if it doesn't exist
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }

  try {
    console.log("Starting database backup...");
    await execAsync(`pg_dump "${process.env.DATABASE_URL}" > ${backupFile}`);
    console.log(`Backup completed successfully: ${backupFile}`);
  } catch (error) {
    console.error("Backup failed:", error);
    process.exit(1);
  }
}

backupDatabase().catch(console.error);
