import "server-only";

import path from "node:path";

export const ARTICLE_UPLOAD_PUBLIC_PATH = "/uploads/articles";
export const ARTICLE_UPLOAD_DIR = path.join(process.cwd(), "public", "uploads", "articles");
export const ARTICLE_UPLOAD_MAX_BYTES = 5 * 1024 * 1024;
export const ARTICLE_UPLOAD_TYPES: Record<string, { extension: string; signatures: number[][] }> = {
  "image/jpeg": { extension: "jpg", signatures: [[0xff, 0xd8, 0xff]] },
  "image/png": { extension: "png", signatures: [[0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]] },
  "image/webp": { extension: "webp", signatures: [[0x52, 0x49, 0x46, 0x46]] },
};

const ARTICLE_UPLOAD_FILE_NAME_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*-[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(?:jpg|png|webp)$/;

export function articleUploadContentType(fileName: string) {
  if (fileName.endsWith(".jpg")) return "image/jpeg";
  if (fileName.endsWith(".png")) return "image/png";
  if (fileName.endsWith(".webp")) return "image/webp";
  return "application/octet-stream";
}

export function articleUploadFilePath(fileName: string) {
  if (!ARTICLE_UPLOAD_FILE_NAME_RE.test(fileName)) return null;

  const uploadRoot = path.resolve(ARTICLE_UPLOAD_DIR);
  const filePath = path.resolve(uploadRoot, fileName);
  if (!filePath.startsWith(`${uploadRoot}${path.sep}`)) return null;
  return filePath;
}
