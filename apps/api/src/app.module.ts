import { Module } from "@nestjs/common";

import { CatalogController } from "./catalog/catalog.controller.js";
import { DatabaseModule } from "./database/database.module.js";
import { HealthController } from "./health.controller.js";
import { OutfitController } from "./outfit/outfit.controller.js";
import { OutfitService } from "./outfit/outfit.service.js";
import { ProfileController } from "./profile/profile.controller.js";
import { ProfileService } from "./profile/profile.service.js";
import { WardrobeController } from "./wardrobe/wardrobe.controller.js";
import { WardrobeService } from "./wardrobe/wardrobe.service.js";

@Module({
  imports: [DatabaseModule],
  controllers: [HealthController, CatalogController, ProfileController, WardrobeController, OutfitController],
  providers: [ProfileService, WardrobeService, OutfitService],
})
export class AppModule {}
