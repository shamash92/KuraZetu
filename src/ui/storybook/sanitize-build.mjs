import {readdir, readFile, writeFile} from "node:fs/promises";
import {homedir} from "node:os";
import {dirname, extname, resolve} from "node:path";
import {stdout} from "node:process";
import {fileURLToPath} from "node:url";

const packageRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const roots = Array.from(new Set([packageRoot, resolve(packageRoot, "../.."), homedir()].flatMap((root) => [root, root.replaceAll("\\", "/"), JSON.stringify(root).slice(1, -1)]))).sort((a, b) => b.length - a.length);
const textTypes = new Set([".html", ".json", ".js", ".css", ".map"]);
let changed = 0;

async function sanitize(directory) {
    for (const entry of await readdir(directory, {withFileTypes: true})) {
        const path = resolve(directory, entry.name);
        if (entry.isDirectory()) {
            await sanitize(path);
        } else if (textTypes.has(extname(path))) {
            const original = await readFile(path, "utf8");
            const clean = roots.reduce((text, root) => text.replaceAll(root, "."), original);
            if (/\/Users\/|\/home\/runner\/work\//.test(clean)) {
                throw new Error(`Unrecognized checkout path in generated file ${entry.name}`);
            }
            if (clean !== original) {
                await writeFile(path, clean);
                changed++;
            }
        }
    }
}

await sanitize(resolve(packageRoot, "storybook-static"));
stdout.write(`Removed checkout paths from ${changed} generated files.\n`);
