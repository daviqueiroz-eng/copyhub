/**
 * Utilities to bridge plain-text legacy content with the rich text editor.
 * Existing rows in the DB were stored as plain text. We treat them as text
 * on hydration (escaping HTML special chars) and convert HTML back to plain
 * for features that still expect plain text (copy, share, viral check, etc.)
 */

export function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** Detect if a string already looks like HTML produced by the editor. */
export function looksLikeHtml(value: string): boolean {
  if (!value) return false;
  return /<\/?(p|br|strong|em|u|span|h[1-6]|ul|ol|li|a|img|mark|s|blockquote|code|pre|hr|div|table|tr|td)\b/i.test(
    value,
  );
}

/** Convert legacy plain text to safe HTML preserving paragraphs/line breaks. */
export function plainToHtml(text: string): string {
  if (!text) return "";
  const escaped = escapeHtml(text);
  // Each paragraph (split by blank line) becomes <p>...</p>; single newlines -> <br>
  return escaped
    .split(/\n{2,}/)
    .map((para) => `<p>${para.replace(/\n/g, "<br>")}</p>`)
    .join("");
}

/** Normalize whatever is stored to valid HTML for TipTap initial content. */
export function toEditorHtml(value: string | null | undefined): string {
  if (!value) return "";
  return looksLikeHtml(value) ? value : plainToHtml(value);
}

/** Strip HTML tags, decode entities, keep paragraph/br as newlines. */
export function htmlToPlain(html: string | null | undefined): string {
  if (!html) return "";
  if (!looksLikeHtml(html)) return html;
  const div = document.createElement("div");
  div.innerHTML = html
    .replace(/<\/p>\s*<p[^>]*>/gi, "\n\n")
    .replace(/<br\s*\/?\s*>/gi, "\n")
    .replace(/<\/(h[1-6]|li|div)>/gi, "\n");
  return (div.textContent || "").replace(/\n{3,}/g, "\n\n").trim();
}