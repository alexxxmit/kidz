import { BadRequestException, Body, Controller, Get, Param, Post } from "@nestjs/common";
import { ProfileInputSchema } from "@kidz/contracts";

import { ProfileService } from "./profile.service.js";

@Controller("v1/profiles")
export class ProfileController {
  constructor(private readonly profiles: ProfileService) {}

  @Post()
  async create(@Body() body: unknown) {
    const parsed = ProfileInputSchema.safeParse(body);
    if (!parsed.success) throw new BadRequestException(parsed.error.flatten());
    return this.profiles.create(parsed.data);
  }

  @Get(":id")
  async find(@Param("id") id: string) {
    return this.profiles.find(id);
  }
}
