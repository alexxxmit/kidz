import { Module } from "@nestjs/common";

import { AiModule } from "./ai/ai.module.js";
import { AdminModule } from "./admin/admin.module.js";
import { AuthModule } from "./auth/auth.module.js";
import { CatalogController } from "./catalog/catalog.controller.js";
import { DatabaseModule } from "./database/database.module.js";
import { HealthController } from "./health.controller.js";
import { OutfitController } from "./outfit/outfit.controller.js";
import { OutfitService } from "./outfit/outfit.service.js";
import { ProfileController } from "./profile/profile.controller.js";
import { ProfileService } from "./profile/profile.service.js";
import { SocialModule } from "./social/social.module.js";
import { WardrobeController } from "./wardrobe/wardrobe.controller.js";
import { WardrobeService } from "./wardrobe/wardrobe.service.js";

@Module({
  imports: [DatabaseModule, AuthModule, AiModule, SocialModule, AdminModule],
  controllers: [HealthController, CatalogController, ProfileController, WardrobeController, OutfitController],
  providers: [ProfileService, WardrobeService, OutfitService],
})
export class AppModule {}
