import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { songService } from "@/api/services/songService";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Spinner } from "@/components/ui/Spinner";
import type { Song } from "@/types";

interface SongPickerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (song: Song) => void;
}

export function SongPicker({ isOpen, onClose, onSelect }: SongPickerProps) {
  const [search, setSearch] = useState("");
  const { data: songs = [], isLoading } = useQuery({
    queryKey: ["songs-for-assignment"],
    queryFn: () => songService.getSongs(),
    enabled: isOpen,
    staleTime: 60_000,
  });

  const filtered = useMemo(() => {
    if (!search.trim()) return songs;
    const q = search.toLowerCase();
    return songs.filter(
      (s) =>
        s.title?.toLowerCase().includes(q) ||
        s.artist?.toLowerCase().includes(q),
    );
  }, [songs, search]);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Share a song" size="lg">
      <div className="space-y-4">
        <Input
          placeholder="Search songs by title or artist…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          autoFocus
        />
        <div className="max-h-96 overflow-y-auto rounded-xl border border-loft-plum-100 divide-y divide-loft-plum-100">
          {isLoading ? (
            <div className="py-10 flex justify-center">
              <Spinner />
            </div>
          ) : filtered.length === 0 ? (
            <p className="p-6 text-center text-sm text-loft-plum-500">
              {songs.length === 0
                ? "No songs in your library yet."
                : "No matches."}
            </p>
          ) : (
            filtered.map((song) => (
              <button
                key={song.id}
                type="button"
                onClick={() => {
                  onSelect(song);
                  onClose();
                }}
                className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-loft-plum-50 transition-colors"
              >
                <div className="h-9 w-9 shrink-0 rounded-lg bg-brass-gold-100 text-brass-gold-700 flex items-center justify-center">
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M9 18V5l12-2v13" />
                    <circle cx="6" cy="18" r="3" />
                    <circle cx="18" cy="16" r="3" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-loft-plum-900 truncate">
                    {song.title}
                  </p>
                  <p className="text-xs text-loft-plum-500 truncate">
                    {song.artist ?? "Unknown artist"}
                    {song.keySignature ? ` · Key of ${song.keySignature}` : ""}
                  </p>
                </div>
              </button>
            ))
          )}
        </div>
      </div>
    </Modal>
  );
}
