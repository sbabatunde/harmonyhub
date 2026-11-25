import { Link } from "react-router-dom";
import type { ChatMessage } from "@/types";
import { textOfHtml } from "@/utils/html";

interface PinnedDrawerProps {
  isOpen: boolean;
  messages: ChatMessage[];
  isLoading: boolean;
  onClose: () => void;
  onUnpin: (messageId: number) => void;
  onJumpTo?: (message: ChatMessage) => void;
}

export function PinnedDrawer({
  isOpen,
  messages,
  isLoading,
  onClose,
  onUnpin,
  onJumpTo,
}: PinnedDrawerProps) {
  if (!isOpen) return null;

  return (
    <>
      <div
        className="fixed inset-0 bg-black/30 z-40 md:hidden"
        onClick={onClose}
      />
      <aside
        className={`
          fixed z-50 bg-white shadow-2xl flex flex-col
          inset-x-0 bottom-0 max-h-[70vh] rounded-t-2xl
          md:inset-y-0 md:right-0 md:left-auto md:max-h-none md:w-96 md:rounded-none md:border-l md:border-loft-plum-100
          animate-[slideUp_180ms_ease-out] md:animate-[slideInRight_180ms_ease-out]
        `}
      >
        <header className="flex items-center justify-between px-4 py-3 border-b border-loft-plum-100">
          <h3 className="font-display text-lg text-loft-plum-900">
            Pinned messages
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-loft-plum-100 text-loft-plum-600"
            aria-label="Close pinned messages"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
            >
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </header>
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {isLoading ? (
            <div className="py-10 flex justify-center">
              <span className="h-6 w-6 border-2 border-loft-plum-400 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : messages.length === 0 ? (
            <p className="py-10 text-center text-sm text-loft-plum-500">
              No pinned messages yet.
            </p>
          ) : (
            messages.map((m) => (
              <div
                key={m.id}
                className="rounded-xl border border-loft-plum-100 p-3 hover:bg-loft-plum-50/50 transition-colors"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-medium text-loft-plum-700">
                    {m.sender_name ?? "someone"}
                  </span>
                  <div className="flex items-center gap-1">
                    {onJumpTo && (
                      <button
                        type="button"
                        onClick={() => onJumpTo(m)}
                        className="text-[11px] px-2 py-1 rounded hover:bg-loft-plum-100 text-loft-plum-600"
                      >
                        Jump
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => onUnpin(m.id)}
                      className="text-[11px] px-2 py-1 rounded hover:bg-ember-coral-50 text-ember-coral-600"
                    >
                      Unpin
                    </button>
                  </div>
                </div>
                <div className="mt-1 text-sm text-loft-plum-800 line-clamp-3">
                  {m.type === "voice" ? (
                    "🎤 Voice message"
                  ) : m.song ? (
                    <span className="inline-flex items-center gap-1">
                      🎵{" "}
                      <Link
                        to={`/songs/${m.song.id}`}
                        className="underline decoration-loft-plum-300"
                      >
                        {m.song.title}
                      </Link>
                    </span>
                  ) : (
                    textOfHtml(m.content ?? "")
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </aside>
    </>
  );
}
