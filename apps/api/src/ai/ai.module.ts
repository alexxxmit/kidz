import { Module } from "@nestjs/common";

import { AuthModule } from "../auth/auth.module.js";
import { SafetyModule } from "../safety/safety.module.js";
import { AiController } from "./ai.controller.js";
import { AiService } from "./ai.service.js";

@Module({ imports: [AuthModule, SafetyModule], controllers: [AiController], providers: [AiService] })
export class AiModule {}
