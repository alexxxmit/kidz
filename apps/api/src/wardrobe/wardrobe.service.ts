import { Injectable } from "@nestjs/common";
import type { WardrobeItem, WardrobeItemInput } from "@kidz/contracts";
import { asc, eq } from "drizzle-orm";

import { DatabaseService } from "../database/database.service.js";
import { wardrobeItems } from "../database/schema.js";

@Injectable()
export class WardrobeService {
  constructor(private readonly database: DatabaseService) {}

  async create(input: WardrobeItemInput): Promise<WardrobeItem> {
    const id = crypto.randomUUID();
    const [row] = await this.database.db
      .insert(wardrobeItems)
      .values({
        id,
        profileId: input.profileId,
        name: input.name,
        category: input.category,
        slot: input.slot,
        colors: input.colors,
        warmth: input.warmth,
        styleIds: input.styleIds,
        careState: input.careState,
        fitState: input.fitState,
        imageUri: input.imageUri,
      })
      .returning();
    if (!row) throw new Error("Wardrobe item insert did not return a row");
    return this.toContract(row);
  }

  async list(profileId: string): Promise<WardrobeItem[]> {
    const rows = await this.database.db
      .select()
      .from(wardrobeItems)
      .where(eq(wardrobeItems.profileId, profileId))
      .orderBy(asc(wardrobeItems.createdAt));
    return rows.map((row) => this.toContract(row));
  }

  private toContract(row: typeof wardrobeItems.$inferSelect): WardrobeItem {
    return {
      id: row.id,
      profileId: row.profileId,
      name: row.name,
      category: row.category as WardrobeItem["category"],
      slot: row.slot as WardrobeItem["slot"],
      colors: row.colors as string[],
      warmth: row.warmth,
      styleIds: row.styleIds as string[],
      careState: row.careState as WardrobeItem["careState"],
      fitState: row.fitState as WardrobeItem["fitState"],
      ...(row.imageUri ? { imageUri: row.imageUri } : {}),
      wearCount: row.wearCount,
      createdAt: row.createdAt.toISOString(),
    };
  }
}
