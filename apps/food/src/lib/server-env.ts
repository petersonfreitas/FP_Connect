import "server-only";

import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { cwd, loadEnvFile } from "node:process";

let loaded = false;

export function loadServerEnv(): void {
  if (loaded) {
    return;
  }

  loaded = true;
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
