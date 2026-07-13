import { BadRequestException, Body, Controller, Get, Headers, Param, ParseUUIDPipe, Post } from "@nestjs/common";
import { AiStylistInputSchema, TryOnSubmitInputSchema, WardrobeVisionInputSchema } from "@kidz/contracts";

import { AuthService } from "../auth/auth.service.js";
import { AiService } from "./ai.service.js";
import { TryOnService } from "./try-on.service.js";

@Controller("v1/ai")
export class AiController {
  constructor(private readonly ai: AiService, private readonly auth: AuthService, private readonly tryOn: TryOnService) {}

  @Post("stylist")
  async stylist(@Headers("authorization") authorization: string | undefined, @Body() body: unknown) {
    const context = await this.auth.require(authorization);
    const parsed = AiStylistInputSchema.safeParse(body);
    if (!parsed.success) throw new BadRequestException(parsed.error.flatten());
    if (parsed.data.ageYears !== context.ageYears) throw new BadRequestException("Age context mismatch");
    return this.ai.stylist(parsed.data);
  }

  @Post("wardrobe-vision")
  async wardrobeVision(@Headers("authorization") authorization: string | undefined, @Body() body: unknown) {
    const context = await this.auth.require(authorization);
    const parsed = WardrobeVisionInputSchema.safeParse(body);
    if (!parsed.success) throw new BadRequestException(parsed.error.flatten());
    if (parsed.data.ageYears !== context.ageYears) throw new BadRequestException("Age context mismatch");
    return this.ai.analyzeWardrobe(parsed.data);
  }

  @Post("try-on")
  async submitTryOn(@Headers("authorization") authorization: string | undefined, @Body() body: unknown) {
    const context = await this.auth.require(authorization);
    const parsed = TryOnSubmitInputSchema.safeParse(body);
    if (!parsed.success) throw new BadRequestException(parsed.error.flatten());
    if (parsed.data.ageYears !== context.ageYears) throw new BadRequestException("Age context mismatch");
    return this.tryOn.submit(context, parsed.data);
  }

  @Get("try-on/:id")
  async tryOnStatus(@Headers("authorization") authorization: string | undefined, @Param("id", new ParseUUIDPipe()) id: string) {
    return this.tryOn.status(await this.auth.require(authorization), id);
  }
}
