import { Controller, Get } from "@nestjs/common";

@Controller("health")
export class HealthController {
  @Get()
  health() {
    return {
      status: "ok",
      service: "kidz-api",
      environment: process.env.APP_ENV ?? "development",
      timestamp: new Date().toISOString(),
    };
  }
}
