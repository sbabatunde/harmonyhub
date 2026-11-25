import DOMPurify from "dompurify";

interface RenderOptions {
  members?: { id: number; name: string }[];
  isMine?: boolean;
}

const ALLOWED_TAGS = [
  "p",
  "br",
  "strong",
  "em",
  "s",
  "code",
  "pre",
  "ul",
  "ol",
  "li",
  "blockquote",
  "a",
  "span",
  "h1",
  "h2",
  "h3",
];

const ALLOWED_ATTR = ["href", "target", "rel", "class", "data-mention-id"];

function decorateMentions(
  html: string,
  members: { id: number; name: string }[] = [],
): string {
  if (!members.length) return html;
  return html.replace(
    /@([A-Za-z][A-Za-z0-9 _.-]{0,40}?)(?=[\s.,!?]|<\/|$)/g,
    (match, name) => {
      const m = members.find(
        (x) => x.name.toLowerCase() === String(name).trim().toLowerCase(),
      );
      if (!m) return match;
      return `<span class="mention inline-block bg-loft-plum-100 text-loft-plum-800 rounded px-1 font-medium" data-mention-id="${m.id}">@${m.name}</span>`;
    },
  );
}

export function renderMessageContent(
  content: string,
  options: RenderOptions = {},
) {
  const { members = [], isMine } = options;
  const decorated = decorateMentions(content, members);

  const clean = DOMPurify.sanitize(decorated, {
    ALLOWED_TAGS,
    ALLOWED_ATTR,
    ALLOW_DATA_ATTR: false,
  });

  return (
    <div
      className={
        isMine
          ? "message-content space-y-1 [&_a]:underline [&_a]:decoration-white/60 [&_a]:break-all [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_blockquote]:border-l-2 [&_blockquote]:border-white/40 [&_blockquote]:pl-3 [&_blockquote]:italic [&_code]:bg-white/20 [&_code]:px-1 [&_code]:rounded [&_code]:text-[13px] [&_pre]:bg-white/15 [&_pre]:p-2 [&_pre]:rounded [&_pre]:text-[12px] [&_pre]:overflow-x-auto [&_h1]:text-base [&_h1]:font-semibold [&_h2]:text-sm [&_h2]:font-semibold [&_h3]:text-sm [&_h3]:font-semibold"
          : "message-content space-y-1 [&_a]:underline [&_a]:decoration-loft-plum-400 [&_a]:break-all [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_blockquote]:border-l-2 [&_blockquote]:border-loft-plum-300 [&_blockquote]:pl-3 [&_blockquote]:italic [&_code]:bg-loft-plum-100 [&_code]:px-1 [&_code]:rounded [&_code]:text-[13px] [&_pre]:bg-loft-plum-100 [&_pre]:p-2 [&_pre]:rounded [&_pre]:text-[12px] [&_pre]:overflow-x-auto [&_h1]:text-base [&_h1]:font-semibold [&_h2]:text-sm [&_h2]:font-semibold [&_h3]:text-sm [&_h3]:font-semibold"
      }
      dangerouslySetInnerHTML={{ __html: clean }}
    />
  );
}
