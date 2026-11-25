import { useEffect } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import Link from "@tiptap/extension-link";

interface RichComposerProps {
  value: string;
  onChange: (html: string) => void;
  onSubmit: () => void;
  disabled?: boolean;
  placeholder?: string;
}

function ToolbarButton({
  active,
  onClick,
  title,
  children,
}: {
  active?: boolean;
  onClick: () => void;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      title={title}
      className={`h-8 w-8 rounded flex items-center justify-center text-sm transition-colors ${
        active
          ? "bg-loft-plum-100 text-loft-plum-900"
          : "text-loft-plum-600 hover:bg-loft-plum-50"
      }`}
    >
      {children}
    </button>
  );
}

export function RichComposer({
  value,
  onChange,
  onSubmit,
  disabled,
  placeholder,
}: RichComposerProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
      }),
      Link.configure({
        openOnClick: false,
        autolink: true,
        HTMLAttributes: { class: "underline decoration-loft-plum-400" },
      }),
      Placeholder.configure({
        placeholder: placeholder ?? "Write a message…",
      }),
    ],
    content: value,
    editable: !disabled,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class:
          "prose prose-sm max-w-none focus:outline-none min-h-[44px] max-h-40 overflow-y-auto px-3 py-2.5 text-sm text-loft-plum-900",
      },
      handleKeyDown(_view, event) {
        if (event.key === "Enter" && !event.shiftKey) {
          event.preventDefault();
          onSubmit();
          return true;
        }
        return false;
      },
    },
  });

  useEffect(() => {
    if (!editor) return;
    if (value === "" && editor.getHTML() !== "<p></p>") {
      editor.commands.clearContent(true);
    }
  }, [value, editor]);

  useEffect(() => {
    if (!editor) return;
    editor.setEditable(!disabled);
  }, [disabled, editor]);

  if (!editor) return null;

  return (
    <div className="flex-1 rounded-2xl border border-loft-plum-200 bg-loft-plum-50/50 focus-within:ring-2 focus-within:ring-loft-plum-400 transition-shadow">
      <div className="flex items-center gap-0.5 px-2 py-1 border-b border-loft-plum-100 overflow-x-auto">
        <ToolbarButton
          active={editor.isActive("bold")}
          onClick={() => editor.chain().focus().toggleBold().run()}
          title="Bold"
        >
          <strong>B</strong>
        </ToolbarButton>
        <ToolbarButton
          active={editor.isActive("italic")}
          onClick={() => editor.chain().focus().toggleItalic().run()}
          title="Italic"
        >
          <em>I</em>
        </ToolbarButton>
        <ToolbarButton
          active={editor.isActive("strike")}
          onClick={() => editor.chain().focus().toggleStrike().run()}
          title="Strikethrough"
        >
          <span className="line-through">S</span>
        </ToolbarButton>
        <ToolbarButton
          active={editor.isActive("code")}
          onClick={() => editor.chain().focus().toggleCode().run()}
          title="Inline code"
        >
          {"</>"}
        </ToolbarButton>
        <div className="w-px h-5 bg-loft-plum-100 mx-1" />
        <ToolbarButton
          active={editor.isActive("bulletList")}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          title="Bulleted list"
        >
          •
        </ToolbarButton>
        <ToolbarButton
          active={editor.isActive("orderedList")}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          title="Numbered list"
        >
          1.
        </ToolbarButton>
        <ToolbarButton
          active={editor.isActive("blockquote")}
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          title="Quote"
        >
          ❝
        </ToolbarButton>
        <div className="w-px h-5 bg-loft-plum-100 mx-1" />
        <ToolbarButton
          active={editor.isActive("link")}
          onClick={() => {
            const url = window.prompt("Link URL:");
            if (!url) return;
            editor.chain().focus().setLink({ href: url }).run();
          }}
          title="Insert link"
        >
          🔗
        </ToolbarButton>
        <div className="flex-1" />
        <ToolbarButton
          onClick={() => editor.chain().focus().undo().run()}
          title="Undo"
        >
          ↶
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().redo().run()}
          title="Redo"
        >
          ↷
        </ToolbarButton>
      </div>
      <EditorContent editor={editor} />
    </div>
  );
}
