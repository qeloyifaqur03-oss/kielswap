import { loadEnvConfig } from "@next/env";
import { readFileSync } from "fs";
import { join } from "path";
import { getRedis } from "../lib/redis";
import { hashCodeSync } from "../lib/access-scripts";

// Load environment variables from .env.local
loadEnvConfig(process.cwd());

// Debug: check if env vars are loaded (without leaking secrets)
console.log("env ok:", !!process.env.UPSTASH_REDIS_REST_URL, !!process.env.UPSTASH_REDIS_REST_TOKEN);

// Initialize Redis client after env is loaded
const redis = getRedis();

const ACCESS_CODES_FILE = join(process.cwd(), "scripts", "access-codes.txt");

async function seedAccessCodes(dryRun: boolean = false) {
  console.log(dryRun ? "🔍 DRY RUN MODE" : "🌱 Seeding access codes...\n");

  try {
    const fileContent = readFileSync(ACCESS_CODES_FILE, "utf-8");
    const lines = fileContent.split("\n");
    
    let added = 0;
    let skipped = 0;

    for (const line of lines) {
      const trimmed = line.trim();
      
      // Skip empty lines and comments
      if (!trimmed || trimmed.startsWith("#")) {
        skipped++;
        continue;
      }

      try {
        const hash = hashCodeSync(trimmed);
        const key = `access:${hash}`;

        if (dryRun) {
          console.log(`[DRY RUN] Would add: ${trimmed} -> ${key}`);
          added++;
        } else {
          // Store just "1" to mark code as valid, with nx:true to avoid overwriting
          const result = await redis.set(key, "1", { nx: true });
          if (result === "OK" || result === "ok") {
            added++;
          } else {
            // Key already exists (result is null)
            skipped++;
            console.log(`[SKIP] Key already exists: ${key}`);
          }
        }
      } catch (error) {
        console.error(`Error processing code "${trimmed}":`, error);
        skipped++;
      }
    }

    console.log(`\n✅ Done!`);
    console.log(`   Added: ${added}`);
    console.log(`   Skipped: ${skipped}`);
    console.log(`   Total: ${added + skipped}`);
    
    if (dryRun) {
      console.log(`\n⚠️  This was a dry run. No codes were actually added.`);
      console.log(`   Run without --dry-run to seed the codes.`);
    }
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      console.error(`❌ File not found: ${ACCESS_CODES_FILE}`);
      console.error(`   Please create the file with one access code per line.`);
    } else {
      console.error("❌ Error:", error);
    }
    process.exit(1);
  }
}

// Parse command line args
const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run") || args.includes("-d");

seedAccessCodes(dryRun)
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Fatal error:", error);
    process.exit(1);
  });

