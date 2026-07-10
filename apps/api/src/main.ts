import "reflect-metadata";

import { Logger } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { FastifyAdapter, type NestFastifyApplication } from "@nestjs/platform-fastify";

import { AppModule } from "./app.module.js";

const bootstrap = async () => {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter({ trustProxy: true, bodyLimit: 15 * 1024 * 1024 }),
    { bufferLogs: true },
  );
  app.useLogger(new Logger("KidzApi"));
  app.enableCors({
    origin: process.env.ALLOWED_ORIGINS?.split(",").map((value) => value.trim()) ?? true,
    credentials: false,
  });
  app.enableShutdownHooks();
  const port = Number(process.env.PORT ?? 3000);
  await app.listen(port, "::");
  Logger.log(`Kidz API listening on ${port}`, "Bootstrap");
};

await bootstrap();
