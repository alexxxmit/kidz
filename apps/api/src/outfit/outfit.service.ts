import { Injectable } from "@nestjs/common";
import type { OutfitOption, WeatherContext } from "@kidz/contracts";
import { generateOutfits } from "@kidz/domain";

import { DatabaseService } from "../database/database.service.js";
import { outfitRecommendations } from "../database/schema.js";
import { ProfileService } from "../profile/profile.service.js";
import { WardrobeService } from "../wardrobe/wardrobe.service.js";

@Injectable()
export class OutfitService {
  constructor(
    private readonly database: DatabaseService,
    private readonly profiles: ProfileService,
    private readonly wardrobe: WardrobeService,
  ) {}

  async generate(profileId: string, weather: WeatherContext, intent?: string) {
    const profile = await this.profiles.find(profileId);
    const items = await this.wardrobe.list(profileId);
    const options: OutfitOption[] = generateOutfits({
      profile,
      wardrobe: items.map(({ profileId: _profileId, id: _id, createdAt: _createdAt, wearCount: _wearCount, ...item }) => item),
      weather,
      ...(intent ? { intent } : {}),
    });
    const recommendationId = crypto.randomUUID();
    await this.database.db.insert(outfitRecommendations).values({
      id: recommendationId,
      profileId,
      context: { weather, ...(intent ? { intent } : {}) },
      options,
    });
    return { id: recommendationId, profileId, weather, options, createdAt: new Date().toISOString() };
  }
}
