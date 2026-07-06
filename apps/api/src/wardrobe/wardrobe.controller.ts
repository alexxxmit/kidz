import { BadRequestException, Body, Controller, Get, Post, Query } from "@nestjs/common";
import { WardrobeItemInputSchema } from "@kidz/contracts";
import { z } from "zod";

import { WardrobeService } from "./wardrobe.service.js";

@Controller("v1/wardrobe/items")
export class WardrobeController {
  constructor(private readonly wardrobe: WardrobeService) {}

  @Post()
  async create(@Body() body: unknown) {
    const parsed = WardrobeItemInputSchema.safeParse(body);
    if (!parsed.success) throw new BadRequestException(parsed.error.flatten());
    return this.wardrobe.create(parsed.data);
  }

  @Get()
  async list(@Query("profileId") profileIdInput?: string) {
    const parsed = z.string().uuid().safeParse(profileIdInput);
    if (!parsed.success) throw new BadRequestException("Valid profileId is required");
    return { items: await this.wardrobe.list(parsed.data) };
  }
}
