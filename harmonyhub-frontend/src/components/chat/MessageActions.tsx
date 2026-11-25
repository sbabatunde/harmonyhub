import { useEffect, useRef, useState } from "react";
import type { ChatMessage } from "@/types";

export type MessageAction =
  | "reply"
  | "reply_privately"
  | "forward"
  | "pin"
  | "unpin"
  | "edit"
  | "delete"
  | "select"
  | "copy"
  | "copy_link";

interface MessageActionsProps {
  message: ChatMessage;
  isMine: boolean;
  canEdit: boolean;
  canDelete: boolean;
  canPin: boolean;
  align: "left" | "right";
  onAction: (action: MessageAction) => void;
}

interface Item {
  action: MessageAction;
  label: string;
  icon: React.ReactNode;
  danger?: boolean;
}

function Icon({ d }: { d: string }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d={d} />
    </svg>
  );
}

export function MessageActions({
  message,
  isMine,
  canEdit,
  canDelete,
  canPin,
  align,
  onAction,
}: MessageActionsProps) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement | null>(null);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent | TouchEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("touchstart", onDoc);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("touchstart", onDoc);
    };
  }, [open]);

  const items: Item[] = [
    {
      action: "reply",
      label: "Reply",
      icon: <Icon d="M9 17l-6-5 6-5M3 12h12a6 6 0 0 1 6 6v1" />,
    },
    ...(isMine
      ? []
      : [
          {
            action: "reply_privately" as const,
            label: "Reply privately",
            icon: (
              <Icon d="M12 22s8-4.5 8-12a8 8 0 0 0-16 0c0 7.5 8 12 8 12z" />
            ),
          },
        ]),
    {
      action: "forward",
      label: "Forward",
      icon: <Icon d="M15 17l6-5-6-5M21 12H9a6 6 0 0 0-6 6v1" />,
    },
    {
      action: "copy",
      label: "Copy",
      icon: <Icon d="M9 9h10v10H9zM5 15V5h10" />,
    },
    ...(canPin
      ? [
          message.pinned_at
            ? {
                action: "unpin" as const,
                label: "Unpin",
                icon: <Icon d="M12 2l3 7 7 .5-5 5 2 8-7-4-7 4 2-8-5-5 7-.5z" />,
              }
            : {
                action: "pin" as const,
                label: "Pin",
                icon: <Icon d="M12 2l3 7 7 .5-5 5 2 8-7-4-7 4 2-8-5-5 7-.5z" />,
              },
        ]
      : []),
    {
      action: "select",
      label: "Select",
      icon: <Icon d="M4 4h4M4 12h2M4 20h4M20 4h-4M20 12h-2M20 20h-4" />,
    },
    ...(canEdit
      ? [
          {
            action: "edit" as const,
            label: "Edit",
            icon: (
              <Icon d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z" />
            ),
          },
        ]
      : []),
    ...(canDelete
      ? [
          {
            action: "delete" as const,
            label: "Delete",
            icon: <Icon d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14" />,
            danger: true,
          },
        ]
      : []),
  ];

  return (
    <div
      ref={wrapRef}
      className={`relative ${align === "right" ? "ml-2" : "mr-2"}`}
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="h-8 w-8 rounded-full bg-white/90 hover:bg-loft-plum-100 text-loft-plum-600 flex items-center justify-center shadow-sm opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity"
        aria-label="Message actions"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
          <circle cx="12" cy="5" r="1.8" />
          <circle cx="12" cy="12" r="1.8" />
          <circle cx="12" cy="19" r="1.8" />
        </svg>
      </button>

      {open && (
        <div
          className={`absolute z-30 top-9 ${
            align === "right" ? "right-0" : "left-0"
          } min-w-[180px] rounded-xl border border-loft-plum-100 bg-white shadow-lg py-1 animate-[fadeIn_120ms_ease-out]`}
        >
          {items.map((item) => (
            <button
              key={item.action}
              type="button"
              onClick={() => {
                setOpen(false);
                onAction(item.action);
              }}
              className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm text-left transition-colors ${
                item.danger
                  ? "text-ember-coral-600 hover:bg-ember-coral-50"
                  : "text-loft-plum-800 hover:bg-loft-plum-50"
              }`}
            >
              <span className="text-loft-plum-500">{item.icon}</span>
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
