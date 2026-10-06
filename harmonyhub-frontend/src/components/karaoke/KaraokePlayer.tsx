import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { karaokeService } from "@/api/services/karaokeService";
import { songService } from "@/api/services/songService";
import { AudioPlayer } from "@/components/practice/AudioPlayer";
import { LyricsEditor } from "@/components/karaoke/LyricsEditor";

import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import { motion, AnimatePresence } from "framer-motion";
import { Edit3, Music, ListMusic } from "lucide-react";

interface KaraokePlayerProps {
  songId: number;
}

export const KaraokePlayer: React.FC<KaraokePlayerProps> = ({ songId }) => {
  const [isLyricsEditorOpen, setIsLyricsEditorOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [songDuration] = useState(300);

  const { data: karaokeTrack, isLoading } = useQuery({
    queryKey: ["karaoke-track", songId],
    queryFn: () => karaokeService.getTrack(songId),
  });

  const { data: songParts } = useQuery({
    queryKey: ["song-parts", songId],
    queryFn: () => songService.getSongParts(songId),
  });

  const currentLyricIndex = useMemo(() => {
    if (!karaokeTrack?.lyrics_data || karaokeTrack.lyrics_data.length === 0) {
      return -1;
    }
    return karaokeTrack.lyrics_data.findIndex(
      (lyric) => currentTime >= lyric.start && currentTime <= lyric.end,
    );
  }, [currentTime, karaokeTrack]);

  if (isLoading) return <Spinner />;
  if (!karaokeTrack) return null;

  return (
    <div className="space-y-4 w-full overflow-hidden">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <Badge variant="sage">Ready</Badge>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsLyricsEditorOpen(true)}
        >
          <Edit3 className="w-4 h-4 mr-1" />
          Edit Lyrics
        </Button>
      </div>

      {karaokeTrack.instrumental_file_path && (
        <AudioPlayer
          src={karaokeTrack.instrumental_file_path}
          title="Instrumental"
          onTimeUpdate={setCurrentTime}
        />
      )}

      {karaokeTrack.lyrics_data && karaokeTrack.lyrics_data.length > 0 && (
        <div className="relative bg-loft-plum-900 rounded-xl p-4 sm:p-6 min-h-[140px] sm:min-h-[200px] overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-loft-plum-800 to-loft-plum-900 opacity-50" />

          <div className="relative z-10 flex items-center justify-center h-full">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentLyricIndex}
                initial={{ opacity: 0, y: 20, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -20, scale: 0.9 }}
                transition={{
                  type: "spring",
                  damping: 20,
                  stiffness: 200,
                  duration: 0.5,
                }}
                className="text-center px-2"
              >
                {currentLyricIndex >= 0 ? (
                  <>
                    <p className="text-xl sm:text-3xl font-display text-brass-gold-400 font-bold">
                      {karaokeTrack.lyrics_data[currentLyricIndex]?.text}
                    </p>

                    {currentLyricIndex + 1 <
                      karaokeTrack.lyrics_data.length && (
                      <p className="text-sm sm:text-lg text-loft-plum-400 mt-3 opacity-70">
                        {karaokeTrack.lyrics_data[currentLyricIndex + 1]?.text}
                      </p>
                    )}
                  </>
                ) : (
                  <p className="text-lg sm:text-xl text-loft-plum-400">
                    <Music className="w-8 h-8 mx-auto mb-2" />
                    Waiting for lyrics...
                  </p>
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      )}

      {songParts && songParts.length > 0 && (
        <div>
          <h4 className="font-medium text-loft-plum-900 mb-2 flex items-center">
            <ListMusic className="w-4 h-4 mr-2" />
            AI-Generated Voice Parts
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {songParts.map((part) => (
              <div
                key={part.id}
                className="bg-loft-plum-50 rounded-lg p-3 overflow-hidden"
              >
                <p className="text-sm font-medium text-loft-plum-900 capitalize mb-2">
                  {part.partType}
                </p>
                {part.audioFilePath && <AudioPlayer src={part.audioFilePath} />}
              </div>
            ))}
          </div>
        </div>
      )}

      <LyricsEditor
        songId={songId}
        isOpen={isLyricsEditorOpen}
        onClose={() => setIsLyricsEditorOpen(false)}
        currentLyrics={karaokeTrack.lyrics_data}
        songDuration={songDuration}
      />
    </div>
  );
};
