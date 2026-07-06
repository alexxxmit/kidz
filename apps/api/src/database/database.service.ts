import { Injectable, OnModuleDestroy } from "@nestjs/common";
import { drizzle, type PostgresJsDatabase } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import * as schema from "./schema.js";

@Injectable()
export class DatabaseService implements OnModuleDestroy {
  private readonly client;
  readonly db: PostgresJsDatabase<typeof schema>;

  constructor() {
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) throw new Error("DATABASE_URL is required");
    this.client = postgres(databaseUrl, {
      max: Number(process.env.DB_POOL_SIZE ?? 8),
      prepare: false,
      idle_timeout: 20,
    });
    this.db = drizzle(this.client, { schema });
  }

  async onModuleDestroy() {
    await this.client.end({ timeout: 5 });
  }
}
