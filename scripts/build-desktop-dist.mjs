import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const outDir = path.join(root, "desktop-dist");
const dirs = ["css", "js", "img", "kanjivg"];
const files = ["desktop-viewer.html"];

await fs.rm(outDir, { recursive: true, force: true });
await fs.mkdir(outDir, { recursive: true });

for (const dir of dirs) {
  await fs.cp(path.join(root, dir), path.join(outDir, dir), { recursive: true });
}

for (const file of files) {
  await fs.copyFile(path.join(root, file), path.join(outDir, file));
}

console.log(`Prepared ${outDir}`);

