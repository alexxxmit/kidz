import { BadRequestException, Body, Controller, Delete, Headers, Post } from "@nestjs/common";
import { GuestSessionInputSchema } from "@kidz/contracts";

import { AuthService } from "./auth.service.js";

@Controller("v1/auth")
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post("guest")
  async guest(@Body() body: unknown) {
    const parsed = GuestSessionInputSchema.safeParse(body);
    if (!parsed.success) throw new BadRequestException(parsed.error.flatten());
    return this.auth.createGuest(parsed.data);
  }

  @Delete("me")
  async remove(@Headers("authorization") token?: string) {
    return this.auth.deleteAccount(await this.auth.require(token));
  }
}
