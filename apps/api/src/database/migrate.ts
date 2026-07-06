import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

import postgres from "postgres";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) throw new Error("DATABASE_URL is required");

const sql = postgres(databaseUrl, { max: 1, prepare: false });
const migrationPath = fileURLToPath(new URL("../../migrations/0001_vertical_slice.sql", import.meta.url));

try {
  const migration = await readFile(migrationPath, "utf8");
  await sql.unsafe(migration);
  console.log("Database migration completed");
} finally {
  await sql.end({ timeout: 5 });
}
