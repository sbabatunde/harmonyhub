import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { karaokeService, LyricLine } from "@/api/services/karaokeService";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import {
  Save,
  Clock,
  ChevronUp,
  ChevronDown,
  Wand2,
  Trash2,
  Plus,
  AlertCircle,
} from "lucide-react";

interface LyricsEditorProps {
  songId: number;
  isOpen: boolean;
  onClose: () => void;
  currentLyrics?: LyricLine[] | null;
  songDuration?: number;
}

export const LyricsEditor: React.FC<LyricsEditorProps> = ({
  songId,
  isOpen,
  onClose,
  currentLyrics,
  songDuration = 300,
}) => {
  const [lyricsText, setLyricsText] = useState(() => {
    if (currentLyrics && currentLyrics.length > 0) {
      return currentLyrics.map((l) => l.text).join("\n");
    }
    return "";
  });

  const [lyrics, setLyrics] = useState<LyricLine[]>(() => {
    return currentLyrics || [];
  });

  const [selectedLine, setSelectedLine] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const updateLyricsMutation = useMutation({
    mutationFn: (lyricsData: LyricLine[]) =>
      karaokeService.updateLyrics(songId, lyricsData, songDuration),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["karaoke-track", songId] });
      queryClient.invalidateQueries({ queryKey: ["karaoke-status", songId] });
      onClose();
    },
  });

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const autoDistribute = () => {
    const lines = lyricsText
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.length > 0);

    if (lines.length === 0) {
      setError("Please enter lyrics first (one line per lyric line)");
      return;
    }

    const timePerLine = songDuration / lines.length;

    const distributed: LyricLine[] = lines.map((text, index) => ({
      start: roundTo(index * timePerLine),
      end: roundTo((index + 1) * timePerLine - 0.1),
      text,
    }));

    setLyrics(distributed);
    setSelectedLine(null);
    setError(null);
  };

  const roundTo = (num: number) => {
    return Math.round(num * 100) / 100;
  };

  /**
   * Adjust timing of a line and CASCADE to all subsequent lines.
   * This maintains the gap between lines.
   */
  const adjustTiming = (index: number, delta: number) => {
    setLyrics((prev) => {
      const updated = [...prev];

      // Shift the selected line AND all lines after it
      for (let i = index; i < updated.length; i++) {
        updated[i] = {
          ...updated[i],
          start: roundTo(Math.max(0, updated[i].start + delta)),
          end: roundTo(Math.max(0.1, updated[i].end + delta)),
        };
      }

      return updated;
    });
  };

  /**
   * Adjust ONLY the selected line (without cascading).
   * Useful for fine-tuning a single line's timing.
   */
  const adjustSingleLine = (index: number, delta: number) => {
    setLyrics((prev) => {
      const updated = [...prev];
      updated[index] = {
        ...updated[index],
        start: roundTo(Math.max(0, updated[index].start + delta)),
        end: roundTo(Math.max(0.1, updated[index].end + delta)),
      };
      return updated;
    });
  };

  const removeLine = (index: number) => {
    setLyrics((prev) => prev.filter((_, i) => i !== index));
    setSelectedLine(null);
  };

  const addLineAfter = (index: number) => {
    setLyrics((prev) => {
      const updated = [...prev];
      const newStart = roundTo(updated[index].end);
      const newEnd = roundTo(newStart + 5);

      const newLine: LyricLine = {
        start: newStart,
        end: newEnd,
        text: "New line",
      };

      updated.splice(index + 1, 0, newLine);

      // Shift all subsequent lines down
      for (let i = index + 2; i < updated.length; i++) {
        updated[i] = {
          ...updated[i],
          start: roundTo(updated[i].start + 5),
          end: roundTo(updated[i].end + 5),
        };
      }

      return updated;
    });
  };

  const handleSave = () => {
    if (lyrics.length === 0) {
      setError("No lyrics to save. Please add lyrics first.");
      return;
    }
    updateLyricsMutation.mutate(lyrics);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Edit Karaoke Lyrics"
      size="xl"
    >
      <div className="space-y-6">
        {/* Instructions */}
        <div className="bg-choir-sage-50 rounded-lg p-4">
          <h3 className="font-medium text-choir-sage-800 mb-2 flex items-center">
            <Wand2 className="w-4 h-4 mr-2" />
            Simple Lyrics Editor
          </h3>
          <ol className="text-sm text-choir-sage-700 space-y-1">
            <li>1. Paste your lyrics (one line per lyric line)</li>
            <li>2. Click "Auto-Distribute" to spread evenly</li>
            <li>
              3. Use <strong>▲▼</strong> to shift a line AND all lines after it
            </li>
            <li>
              4. Use <strong>Shift+▲▼</strong> to adjust only that line
            </li>
            <li>5. Save when satisfied</li>
          </ol>
        </div>

        {/* Lyrics Input */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium text-loft-plum-700">
              Paste Lyrics
            </label>
            <Badge variant="neutral">{formatTime(songDuration)} song</Badge>
          </div>
          <textarea
            value={lyricsText}
            onChange={(e) => setLyricsText(e.target.value)}
            rows={8}
            className="input-field font-mono text-sm w-full"
            placeholder={
              "Amazing grace\nHow sweet the sound\nThat saved a wretch\nLike me"
            }
          />
          <div className="flex items-center space-x-3 mt-3">
            <Button variant="primary" onClick={autoDistribute}>
              <Wand2 className="w-4 h-4 mr-2" />
              Auto-Distribute
            </Button>
            {lyrics.length > 0 && (
              <Badge variant="sage">{lyrics.length} lines</Badge>
            )}
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-ember-coral-100 text-ember-coral-800 p-3 rounded-lg flex items-center">
            <AlertCircle className="w-4 h-4 mr-2" />
            <span className="text-sm">{error}</span>
          </div>
        )}

        {/* Lyrics Preview */}
        {lyrics.length > 0 && (
          <div>
            <h4 className="font-medium text-loft-plum-900 mb-3 flex items-center">
              <Clock className="w-4 h-4 mr-2" />
              Adjust Timing
              <span className="text-xs text-loft-plum-400 ml-2">
                (▲▼ shifts this line and all after it)
              </span>
            </h4>
            <div className="space-y-2 max-h-64 overflow-y-auto pr-2">
              {lyrics.map((lyric, index) => (
                <div
                  key={index}
                  className={`flex items-center space-x-2 p-3 rounded-lg transition-colors ${
                    selectedLine === index
                      ? "bg-brass-gold-50 border border-brass-gold-300"
                      : "bg-loft-plum-50 hover:bg-loft-plum-100"
                  }`}
                  onClick={() => setSelectedLine(index)}
                >
                  <span className="w-8 text-xs text-loft-plum-400 font-mono flex-shrink-0">
                    {index + 1}
                  </span>

                  <span className="text-xs font-mono text-loft-plum-600 bg-white px-2 py-1 rounded flex-shrink-0">
                    {formatTime(lyric.start)}
                  </span>

                  <input
                    value={lyric.text}
                    onChange={(e) => {
                      const updated = [...lyrics];
                      updated[index] = {
                        ...updated[index],
                        text: e.target.value,
                      };
                      setLyrics(updated);
                    }}
                    className="flex-1 text-sm text-loft-plum-900 bg-transparent border-b border-transparent focus:border-loft-plum-300 focus:outline-none px-1"
                  />

                  {/* Cascade adjustment - shifts this line AND all after it */}
                  <div className="flex flex-col space-y-0.5 flex-shrink-0">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        adjustTiming(index, +0.5); // Move later (cascade)
                      }}
                      className="p-1 hover:bg-loft-plum-200 rounded"
                      title="Move later (this line + all after)"
                    >
                      <ChevronDown className="w-3 h-3 text-choir-sage-500" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        adjustTiming(index, -0.5); // Move earlier (cascade)
                      }}
                      className="p-1 hover:bg-loft-plum-200 rounded"
                      title="Move earlier (this line + all after)"
                    >
                      <ChevronUp className="w-3 h-3 text-ember-coral-500" />
                    </button>
                  </div>

                  {/* Single line adjustment - only this line */}
                  <div className="flex flex-col space-y-0.5 flex-shrink-0">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        adjustSingleLine(index, +0.5);
                      }}
                      className="p-1 hover:bg-loft-plum-200 rounded"
                      title="Adjust ONLY this line later"
                    >
                      <ChevronDown className="w-2.5 h-2.5 text-loft-plum-400" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        adjustSingleLine(index, -0.5);
                      }}
                      className="p-1 hover:bg-loft-plum-200 rounded"
                      title="Adjust ONLY this line earlier"
                    >
                      <ChevronUp className="w-2.5 h-2.5 text-loft-plum-400" />
                    </button>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      addLineAfter(index);
                    }}
                    className="p-1.5 hover:bg-loft-plum-200 rounded flex-shrink-0"
                    title="Add line after"
                  >
                    <Plus className="w-3.5 h-3.5 text-choir-sage-500" />
                  </button>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removeLine(index);
                    }}
                    className="p-1.5 hover:bg-ember-coral-100 rounded flex-shrink-0"
                    title="Remove line"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-ember-coral-500" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Save Buttons */}
        <div className="flex justify-end space-x-3 pt-4 border-t border-loft-plum-100">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleSave}
            isLoading={updateLyricsMutation.isPending}
            disabled={lyrics.length === 0}
          >
            <Save className="w-4 h-4 mr-2" />
            Save Lyrics
          </Button>
        </div>
      </div>
    </Modal>
  );
};
