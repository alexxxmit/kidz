import { BadRequestException, Body, Controller, Headers, Post } from "@nestjs/common";
import { AiStylistInputSchema } from "@kidz/contracts";

import { AuthService } from "../auth/auth.service.js";
import { AiService } from "./ai.service.js";

@Controller("v1/ai")
export class AiController {
  constructor(private readonly ai: AiService, private readonly auth: AuthService) {}

  @Post("stylist")
  async stylist(@Headers("authorization") authorization: string | undefined, @Body() body: unknown) {
    const context = await this.auth.require(authorization);
    const parsed = AiStylistInputSchema.safeParse(body);
    if (!parsed.success) throw new BadRequestException(parsed.error.flatten());
    if (parsed.data.ageYears !== context.ageYears) throw new BadRequestException("Age context mismatch");
    return this.ai.stylist(parsed.data);
  }
}
