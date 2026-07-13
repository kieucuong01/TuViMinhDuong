import "server-only";

function resolveArticleUploadDir() {
  const configured = process.env.CMS_ARTICLE_UPLOAD_DIR?.trim();
  if (configured) return configured.replace(/[\\\/]+$/, "");

  const cwd = /* turbopackIgnore: true */ process.cwd();
  const normalizedCwd = cwd.replace(/\\/g, "/");
  const productionRelease = normalizedCwd.match(/^(.*\/lasotinhhoa)\/releases\/[^/]+$/);
  if (productionRelease) return `${productionRelease[1]}/uploads/articles`;

  const separator = cwd.includes("\\") ? "\\" : "/";
  return `${cwd}${separator}public${separator}uploads${separator}articles`;
}

export const ARTICLE_UPLOAD_PUBLIC_PATH = "/uploads/articles";
export const ARTICLE_UPLOAD_DIR = resolveArticleUploadDir();
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
  const separator = ARTICLE_UPLOAD_DIR.includes("\\") ? "\\" : "/";
  return `${ARTICLE_UPLOAD_DIR}${separator}${fileName}`;
}
