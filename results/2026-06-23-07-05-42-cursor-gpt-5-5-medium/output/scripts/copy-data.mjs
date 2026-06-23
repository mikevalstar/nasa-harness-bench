import { cp, mkdir } from "node:fs/promises";
import { join } from "node:path";

const root = process.cwd();
const source = join(root, "data");
const target = join(root, "dist", "data");

await mkdir(join(root, "dist"), { recursive: true });
await cp(source, target, { recursive: true });
console.log("Copied data/ into dist/data/");
