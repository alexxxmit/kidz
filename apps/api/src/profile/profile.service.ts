import { Injectable, NotFoundException } from "@nestjs/common";
import type { HairProfile, Profile, ProfileInput, StyleMixEntry } from "@kidz/contracts";
import { eq } from "drizzle-orm";

import { DatabaseService } from "../database/database.service.js";
import { profiles } from "../database/schema.js";

@Injectable()
export class ProfileService {
  constructor(private readonly database: DatabaseService) {}

  async create(input: ProfileInput): Promise<Profile> {
    const id = crypto.randomUUID();
    const [row] = await this.database.db
      .insert(profiles)
      .values({
        id,
        displayName: input.displayName,
        locale: input.locale,
        ageYears: input.ageYears,
        autonomyMode: input.autonomyMode,
        genderPresentation: input.genderPresentation,
        hairProfile: input.hairProfile,
        schoolDressCode: input.schoolDressCode,
        styleMix: input.styleMix,
      })
      .returning();
    if (!row) throw new Error("Profile insert did not return a row");
    return {
      id: row.id,
      displayName: row.displayName,
      locale: row.locale as Profile["locale"],
      ageYears: row.ageYears,
      autonomyMode: row.autonomyMode as Profile["autonomyMode"],
      genderPresentation: row.genderPresentation as Profile["genderPresentation"],
      hairProfile: row.hairProfile as HairProfile,
      schoolDressCode: row.schoolDressCode as Profile["schoolDressCode"],
      styleMix: row.styleMix as StyleMixEntry[],
      createdAt: row.createdAt.toISOString(),
    };
  }

  async find(id: string): Promise<Profile> {
    const [row] = await this.database.db.select().from(profiles).where(eq(profiles.id, id)).limit(1);
    if (!row) throw new NotFoundException("Profile not found");
    return {
      id: row.id,
      displayName: row.displayName,
      locale: row.locale as Profile["locale"],
      ageYears: row.ageYears,
      autonomyMode: row.autonomyMode as Profile["autonomyMode"],
      genderPresentation: row.genderPresentation as Profile["genderPresentation"],
      hairProfile: row.hairProfile as HairProfile,
      schoolDressCode: row.schoolDressCode as Profile["schoolDressCode"],
      styleMix: row.styleMix as StyleMixEntry[],
      createdAt: row.createdAt.toISOString(),
    };
  }
}
