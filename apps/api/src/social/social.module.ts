import { Module } from "@nestjs/common";

import { AuthModule } from "../auth/auth.module.js";
import { SafetyModule } from "../safety/safety.module.js";
import { SocialController } from "./social.controller.js";
import { SocialService } from "./social.service.js";

@Module({ imports: [AuthModule, SafetyModule], controllers: [SocialController], providers: [SocialService] })
export class SocialModule {}
