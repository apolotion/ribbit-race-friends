import { readFileSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const projectRoot = join(dirname(fileURLToPath(import.meta.url)), "..");

export function readProjectFile(relativePath) {
  return readFileSync(join(projectRoot, relativePath), "utf8");
}

export function readGameModuleGroup(minimumPrefix, maximumPrefix) {
  const directory = join(projectRoot, "client/game");
  return readdirSync(directory)
    .filter((name) => /^\d+-.+\.js$/i.test(name))
    .map((name) => ({ name, prefix: Number.parseInt(name, 10) }))
    .filter(({ prefix }) => prefix >= minimumPrefix && prefix <= maximumPrefix)
    .sort((left, right) => left.prefix - right.prefix || left.name.localeCompare(right.name))
    .map(({ name }) => `\n/* ${name} */\n${readFileSync(join(directory, name), "utf8")}`)
    .join("\n");
}
