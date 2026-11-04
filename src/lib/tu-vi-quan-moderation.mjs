/** @param {string} input */
export function moderateWish(input) {
  const text = input.normalize("NFC").trim();
  if (!text || text.length > 120) return { ok: false, text, reason: "length" };
  const scan = text.normalize("NFKC").replace(/[\p{Cf}\p{Cc}]/gu, "");
  if (/(?:\b(?:https?|ftp)\s*[:/]|www\s*\.|[\p{L}\d-]+[.。][a-z]{2,63}\b|[\p{L}\d-]+\s*[.。]\s*(?:vn|com|net|org|io|me|info|xyz|app|link|edu|gov)\b)/iu.test(scan)) return { ok: false, text, reason: "link" };
  if (/[\p{L}\d._%+-]\s*(?:@|\[at\]|\(at\))\s*[\p{L}\d-]+/iu.test(scan)) return { ok: false, text, reason: "email" };
  if (/(?:\p{Nd}[\s().+\-]*){8,}/u.test(scan)) return { ok: false, text, reason: "phone" };
  const plain = scan.toLowerCase().normalize("NFD").replace(/\p{M}/gu, "").replace(/đ/g, "d").replace(/[^\p{L}\p{N}]+/gu, " ");
  // shortcut: bounded phrase filter, with reporting and human review for context and new evasions.
  if (/\b(?:dit me|dit con me|du ma|du me|dm may|may la con cho|do cho|mat lon|thang ngu|do ngu|che[tm] di|giet may|giet het|danh chet|do rac ruoi)\b/.test(plain)) {
    return { ok: false, text, reason: "abuse" };
  }
  if (/[\p{Cf}\p{Cc}<>]/u.test(text)) return { ok: false, text, reason: "format" };
  return { ok: true, text };
}
