import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { DOC_BASE_URL, WORKSPACE_DOC } from "../config.js";

const IMAGE_EXT = /\.(png|jpe?g|gif|webp|bmp)$/i;

const normalizeUrl = (href: string): string | null => {
  if (href.startsWith("http://") || href.startsWith("https://")) {
    try {
      const u = new URL(href);
      if (!u.hostname.endsWith("hub.ag3nts.org")) return null;
      return u.toString();
    } catch {
      return null;
    }
  }
  if (href.startsWith("/dane/doc/")) {
    return `https://hub.ag3nts.org${href}`;
  }
  if (href.startsWith("dane/doc/")) {
    return `https://hub.ag3nts.org/${href}`;
  }
  return null;
};

const docBaseForDir = (baseDir: string) =>
  baseDir ? `${DOC_BASE_URL}/${baseDir}/` : `${DOC_BASE_URL}/`;

const extractLinks = (markdown: string, baseDir: string): string[] => {
  const out = new Set<string>();
  const base = docBaseForDir(baseDir);

  for (const m of markdown.matchAll(/\[include file="([^"]+)"\]/g)) {
    const rel = m[1];
    out.add(new URL(rel, base).toString());
  }

  for (const m of markdown.matchAll(/\[[^\]]*]\(([^)]+)\)/g)) {
    const raw = m[1].trim();
    const withoutTitle = raw.split(/\s+/)[0];
    if (!withoutTitle.endsWith(".md") && !IMAGE_EXT.test(withoutTitle)) continue;
    const abs = normalizeUrl(withoutTitle);
    if (abs) out.add(abs);
    else if (withoutTitle.endsWith(".md") || IMAGE_EXT.test(withoutTitle)) {
      const resolved = new URL(withoutTitle, base);
      if (resolved.hostname.endsWith("hub.ag3nts.org")) out.add(resolved.toString());
    }
  }

  return [...out];
};

const urlToLocalPath = (url: string): string => {
  const u = new URL(url);
  const prefix = "/dane/doc/";
  const idx = u.pathname.indexOf(prefix);
  const rel = idx >= 0 ? u.pathname.slice(prefix.length) : u.pathname.replace(/^\//, "");
  return path.join(WORKSPACE_DOC, rel);
};

const fetchText = async (url: string): Promise<string> => {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`GET ${url} failed: ${res.status}`);
  }
  return res.text();
};

const fetchBinary = async (url: string): Promise<Uint8Array> => {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`GET ${url} failed: ${res.status}`);
  }
  return new Uint8Array(await res.arrayBuffer());
};

/**
 * Recursively downloads hub.ag3nts.org/dane/doc/*.md and assets; stores under workspace/doc/.
 */
export const fetchAndCacheDocs = async (): Promise<{
  files: string[];
  imagePaths: string[];
}> => {
  await mkdir(WORKSPACE_DOC, { recursive: true });

  const queue: string[] = [`${DOC_BASE_URL}/index.md`];
  const seen = new Set<string>();
  const savedFiles: string[] = [];
  const imagePaths: string[] = [];

  while (queue.length) {
    const url = queue.shift()!;
    if (seen.has(url)) continue;
    seen.add(url);

    const localPath = urlToLocalPath(url);
    await mkdir(path.dirname(localPath), { recursive: true });

    if (IMAGE_EXT.test(url)) {
      const buf = await fetchBinary(url);
      await writeFile(localPath, buf);
      savedFiles.push(localPath);
      imagePaths.push(localPath);
      continue;
    }

    if (!url.endsWith(".md")) continue;

    const text = await fetchText(url);
    await writeFile(localPath, text, "utf8");
    savedFiles.push(localPath);

    const pathname = new URL(url).pathname.replace(/^\/dane\/doc\/?/, "").replace(/^\//, "");
    const dir = path.posix.dirname(pathname);
    const baseDir = dir === "." ? "" : dir;

    for (const next of extractLinks(text, baseDir)) {
      if (!seen.has(next)) queue.push(next);
    }
  }

  return { files: savedFiles, imagePaths };
};
