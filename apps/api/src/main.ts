import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { cwd, loadEnvFile } from "node:process";
import { AppModule } from "./app.module";
import { AppConfigService } from "./config/app-config.service";
import { requestMetricsMiddleware } from "./observability/request-metrics.middleware";

loadLocalEnv();

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.use(requestMetricsMiddleware);
  app.setGlobalPrefix("api");

  const config = app.get(AppConfigService);
  await app.listen(config.port);
}

void bootstrap();

function loadLocalEnv(): void {
  const envPath = findUp(".env", cwd());

  if (envPath) {
    loadEnvFile(envPath);
  }
}

function findUp(fileName: string, startDirectory: string): string | undefined {
  let directory = startDirectory;

  while (true) {
    const candidate = join(directory, fileName);
    if (existsSync(candidate)) {
      return candidate;
    }

    const parent = dirname(directory);
    if (parent === directory) {
      return undefined;
    }

    directory = parent;
  }
}
