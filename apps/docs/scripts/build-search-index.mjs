// Builds the Pagefind search index from the HTML pages prerendered by `next build`.
//
// Next.js writes prerendered App Router pages to one of two layouts:
// - `.next/server/app/<path>.html` for a plain `next build`.
// - `.next/server/route-cache/APP_PAGE/<hash>/$/<path>.html` when a build adapter is
//   active, which is the case on Vercel since Next.js 16.3.8.
// The Pagefind CLI can only point at one directory and derives result URLs from file
// paths, so the hashed layout would yield broken links. Each page is indexed here with
// its route-relative path instead, which keeps the URLs identical across both layouts.

import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

import * as pagefind from "pagefind";

const SERVER_DIR = ".next/server";
const OUTPUT_PATH = "public/_pagefind";

const listHtmlFiles = async (directory) => {
  try {
    const entries = await readdir(directory, { recursive: true });
    return entries.filter((entry) => entry.endsWith(".html"));
  } catch (error) {
    if (error.code === "ENOENT") {
      return [];
    }
    throw error;
  }
};

const listRouteCacheRoots = async () => {
  const appPageDir = path.join(SERVER_DIR, "route-cache", "APP_PAGE");
  try {
    const hashes = await readdir(appPageDir);
    return hashes.map((hash) => path.join(appPageDir, hash, "$"));
  } catch (error) {
    if (error.code === "ENOENT") {
      return [];
    }
    throw error;
  }
};

const collectPages = async () => {
  const roots = [
    path.join(SERVER_DIR, "app"),
    ...(await listRouteCacheRoots()),
  ];
  const pages = new Map();
  for (const root of roots) {
    for (const file of await listHtmlFiles(root)) {
      const sourcePath = file.split(path.sep).join("/");
      if (!pages.has(sourcePath)) {
        pages.set(sourcePath, path.join(root, file));
      }
    }
  }
  return pages;
};

const pages = await collectPages();
if (pages.size === 0) {
  throw new Error(
    `No prerendered HTML found under ${SERVER_DIR}. Did \`next build\` run first?`,
  );
}

const { index, errors: createErrors } = await pagefind.createIndex();
if (!index) {
  throw new Error(
    `Pagefind could not create an index: ${createErrors.join(", ")}`,
  );
}

for (const [sourcePath, filePath] of pages) {
  const content = await readFile(filePath, "utf8");
  const { errors } = await index.addHTMLFile({ sourcePath, content });
  if (errors.length > 0) {
    throw new Error(
      `Pagefind could not index ${sourcePath}: ${errors.join(", ")}`,
    );
  }
}

const { errors: writeErrors } = await index.writeFiles({
  outputPath: OUTPUT_PATH,
});
if (writeErrors.length > 0) {
  throw new Error(
    `Pagefind could not write the index: ${writeErrors.join(", ")}`,
  );
}

await pagefind.close();
console.log(`Pagefind indexed ${pages.size} pages into ${OUTPUT_PATH}`);
