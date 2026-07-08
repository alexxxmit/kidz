import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

import postgres from "postgres";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) throw new Error("DATABASE_URL is required");

const sql = postgres(databaseUrl, { max: 1, prepare: false });
const migrationsDir = fileURLToPath(new URL("../../migrations", import.meta.url));

try {
  const migrationFiles = (await readdir(migrationsDir))
    .filter((file) => file.endsWith(".sql"))
    .sort();
  for (const file of migrationFiles) {
    const migration = await readFile(join(migrationsDir, file), "utf8");
    await sql.unsafe(migration);
    console.log(`Applied migration ${file}`);
  }
  console.log("Database migration completed");
} finally {
  await sql.end({ timeout: 5 });
}
