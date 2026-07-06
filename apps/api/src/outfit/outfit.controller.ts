import { BadRequestException, Body, Controller, Post } from "@nestjs/common";
import { WeatherContextSchema } from "@kidz/contracts";
import { z } from "zod";

import { OutfitService } from "./outfit.service.js";

const GenerateOutfitSchema = z.object({
  profileId: z.string().uuid(),
  weather: WeatherContextSchema,
  intent: z.string().trim().max(280).optional(),
});

@Controller("v1/outfits")
export class OutfitController {
  constructor(private readonly outfits: OutfitService) {}

  @Post("generate")
  async generate(@Body() body: unknown) {
    const parsed = GenerateOutfitSchema.safeParse(body);
    if (!parsed.success) throw new BadRequestException(parsed.error.flatten());
    return this.outfits.generate(parsed.data.profileId, parsed.data.weather, parsed.data.intent);
  }
}
