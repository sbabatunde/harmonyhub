import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { teacherService, type Student } from "@/api/services/teacherService";
import { useCreateChatRoom } from "@/hooks/useChatRooms";
import { useAuthStore } from "@/store/authStore";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Spinner } from "@/components/ui/Spinner";

interface NewChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: (roomId: number) => void;
}

type Mode = "direct" | "group";

export function NewChatModal({ isOpen, onClose, onCreated }: NewChatModalProps) {
  const { user } = useAuthStore();
  const [mode, setMode] = useState<Mode>("direct");
  const [groupName, setGroupName] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const createRoom = useCreateChatRoom();

  const isTeacherOrAdmin =
    user?.role === "teacher" || user?.role === "admin";

  const { data: students = [], isLoading } = useQuery({
    queryKey: ["students"],
    queryFn: () => teacherService.getStudents(),
    enabled: isOpen && isTeacherOrAdmin,
    staleTime: 60_000,
  });

  const filtered = useMemo(() => {
    if (!searchTerm.trim()) return students;
    const q = searchTerm.toLowerCase();
    return students.filter(
      (s) =>
        s.name?.toLowerCase().includes(q) ||
        s.email?.toLowerCase().includes(q),
    );
  }, [students, searchTerm]);

  const reset = () => {
    setMode("direct");
    setGroupName("");
    setSearchTerm("");
    setSelectedIds([]);
    createRoom.reset();
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const toggleMember = (id: number) => {
    if (mode === "direct") {
      // single-select behaviour for DMs
      setSelectedIds((prev) => (prev[0] === id ? [] : [id]));
    } else {
      setSelectedIds((prev) =>
        prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
      );
    }
  };

  const canSubmit =
    mode === "direct"
      ? selectedIds.length === 1
      : selectedIds.length >= 2 &&
        (groupName.trim().length === 0 || groupName.trim().length >= 2);

  const handleSubmit = async () => {
    if (!canSubmit || createRoom.isPending) return;
    try {
      const room = await createRoom.mutateAsync({
        name: mode === "group" ? groupName.trim() || undefined : undefined,
        is_group: mode === "group",
        member_ids: selectedIds,
      });
      onCreated(room.id);
      handleClose();
    } catch {
      // createRoom.error renders below
    }
  };

  const errorMessage = (() => {
    if (!createRoom.isError) return null;
    const err = createRoom.error as { response?: { data?: { message?: string } } };
    return err?.response?.data?.message ?? "Could not create the conversation.";
  })();

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="New conversation"
      size="lg"
    >
      <div className="space-y-5">
        {/* Mode toggle */}
        <div className="grid grid-cols-2 gap-2 p-1 rounded-xl bg-loft-plum-50 border border-loft-plum-100">
          <button
            type="button"
            onClick={() => {
              setMode("direct");
              setSelectedIds((prev) => prev.slice(0, 1));
            }}
            className={`py-2 rounded-lg text-sm font-medium transition-colors ${
              mode === "direct"
                ? "bg-white text-loft-plum-900 shadow-sm"
                : "text-loft-plum-600 hover:text-loft-plum-800"
            }`}
          >
            Direct message
          </button>
          <button
            type="button"
            onClick={() => setMode("group")}
            disabled={!isTeacherOrAdmin}
            className={`py-2 rounded-lg text-sm font-medium transition-colors ${
              mode === "group"
                ? "bg-white text-loft-plum-900 shadow-sm"
                : "text-loft-plum-600 hover:text-loft-plum-800"
            } disabled:opacity-40 disabled:cursor-not-allowed`}
          >
            Group chat
          </button>
        </div>

        {/* Group name */}
        {mode === "group" && (
          <Input
            label="Group name"
            placeholder="e.g. Sunday Sopranos"
            value={groupName}
            onChange={(e) => setGroupName(e.target.value)}
            hint="Optional — you can name it later"
          />
        )}

        {/* Search */}
        <div>
          <label className="block text-sm font-medium text-loft-plum-700 mb-1">
            {mode === "direct" ? "Choose a person" : "Add members"}
          </label>
          <Input
            placeholder="Search by name or email…"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Selected chips (group mode only) */}
        {mode === "group" && selectedIds.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {selectedIds.map((id) => {
              const s = students.find((x) => x.id === id);
              if (!s) return null;
              return (
                <span
                  key={id}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-loft-plum-100 text-loft-plum-800 text-xs font-medium"
                >
                  {s.name}
                  <button
                    type="button"
                    onClick={() => toggleMember(id)}
                    className="hover:text-ember-coral-600 transition-colors"
                    aria-label={`Remove ${s.name}`}
                  >
                    <svg
                      width="12"
                      height="12"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="3"
                    >
                      <path d="M6 6l12 12M18 6L6 18" />
                    </svg>
                  </button>
                </span>
              );
            })}
          </div>
        )}

        {/* Student list */}
        <div className="max-h-72 overflow-y-auto rounded-xl border border-loft-plum-100 divide-y divide-loft-plum-100">
          {isLoading ? (
            <div className="py-10 flex justify-center">
              <Spinner />
            </div>
          ) : !isTeacherOrAdmin ? (
            <div className="p-6 text-sm text-loft-plum-500 text-center">
              Students can't start new conversations. Your teacher will message
              you.
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-6 text-sm text-loft-plum-500 text-center">
              {students.length === 0
                ? "No students in your church yet."
                : "No one matches that search."}
            </div>
          ) : (
            filtered.map((s: Student) => {
              const selected = selectedIds.includes(s.id);
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => toggleMember(s.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${
                    selected
                      ? "bg-loft-plum-50"
                      : "hover:bg-loft-plum-50/60"
                  }`}
                >
                  <div className="h-9 w-9 shrink-0 rounded-full bg-brass-gold-100 text-brass-gold-700 flex items-center justify-center font-semibold">
                    {s.name?.charAt(0).toUpperCase() ?? "?"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-loft-plum-900 truncate">
                      {s.name}
                    </p>
                    <p className="text-xs text-loft-plum-500 truncate">
                      {s.email}
                      {s.voicePart ? ` · ${s.voicePart}` : ""}
                    </p>
                  </div>
                  <span
                    className={`h-5 w-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                      selected
                        ? "bg-loft-plum-600 border-loft-plum-600"
                        : "border-loft-plum-300"
                    }`}
                    aria-hidden
                  >
                    {selected && (
                      <svg
                        width="12"
                        height="12"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="white"
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M20 6L9 17l-5-5" />
                      </svg>
                    )}
                  </span>
                </button>
              );
            })
          )}
        </div>

        {errorMessage && (
          <p className="text-sm text-ember-coral-600">{errorMessage}</p>
        )}

        {/* Actions */}
        <div className="flex justify-between items-center gap-3 pt-1">
          <p className="text-xs text-loft-plum-500">
            {mode === "direct"
              ? selectedIds.length === 0
                ? "Pick one person to start a DM."
                : "Ready to create the conversation."
              : `${selectedIds.length} member${selectedIds.length === 1 ? "" : "s"} selected`}
          </p>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleClose} type="button">
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleSubmit}
              disabled={!canSubmit}
              isLoading={createRoom.isPending}
              type="button"
            >
              {mode === "direct" ? "Start chat" : "Create group"}
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
}