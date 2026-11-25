export function textOfHtml(html: string): string {
  if (!html) return "";
  if (!html.trimStart().startsWith("<")) return html;
  return html
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}
