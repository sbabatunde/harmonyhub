import { useState, useRef, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { useQuery, useMutation } from "@tanstack/react-query";
import { usePitchDetection } from "@/hooks/usePitchDetection";
import { songService } from "@/api/services/songService";
import { practiceService } from "@/api/services/practiceService";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { AudioPlayer } from "@/components/practice/AudioPlayer";
import { Spinner } from "@/components/ui/Spinner";
import { Song, SongPart } from "@/types";
import { Mic, Music, Play, Square, Target, Clock, Save } from "lucide-react";
import { logger } from "@/utils/logger";

export default function PracticePage() {
  const [searchParams] = useSearchParams();
  const songIdFromUrl = searchParams.get("song");

  const [selectedSong, setSelectedSong] = useState<Song | null>(null);
  const [selectedPart, setSelectedPart] = useState<SongPart | null>(null);
  const [isPracticing, setIsPracticing] = useState(false);
  // const [practiceStartTime, setPracticeStartTime] = useState<number | null>(
  //   null,
  // );
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [accuracyReadings, setAccuracyReadings] = useState<number[]>([]);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const { pitch, note, cents, startListening, stopListening, error } =
    usePitchDetection();

  const { data: songs, isLoading: isLoadingSongs } = useQuery({
    queryKey: ["songs"],
    queryFn: () => songService.getSongs(),
  });

  const { data: songParts } = useQuery({
    queryKey: ["song-parts", selectedSong?.id],
    queryFn: () => songService.getSongParts(selectedSong!.id),
    enabled: !!selectedSong,
  });

  useEffect(() => {
    if (songIdFromUrl && songs && songs.length > 0) {
      const songFromUrl = songs.find(
        (s: Song) => s.id === parseInt(songIdFromUrl),
      );
      if (songFromUrl) {
        setSelectedSong(songFromUrl);
        logger.info("Song auto-selected from URL", { songId: songFromUrl.id });
      }
    }
  }, [songIdFromUrl, songs]);

  const savePracticeMutation = useMutation({
    mutationFn: (data: any) => practiceService.createSession(data),
    onSuccess: () => {
      setSaveMessage("Practice session saved!");
      setTimeout(() => setSaveMessage(null), 3000);
    },
  });

  // Timer
  useEffect(() => {
    if (isPracticing) {
      timerRef.current = setInterval(() => {
        setElapsedSeconds((prev) => prev + 1);
      }, 1000);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPracticing]);

  // Track accuracy
  useEffect(() => {
    if (isPracticing && pitch && note) {
      const accuracy = Math.max(0, 100 - Math.abs(cents));
      setAccuracyReadings((prev) => [...prev, accuracy]);
    }
  }, [pitch, note, cents, isPracticing]);

  const handleStartPractice = async () => {
    await startListening();
    setIsPracticing(true);
    setElapsedSeconds(0);
    setAccuracyReadings([]);
    setSaveMessage(null);
  };

  const handleStopPractice = () => {
    stopListening();
    setIsPracticing(false);

    if (timerRef.current) clearInterval(timerRef.current);

    // Calculate average accuracy
    const avgAccuracy =
      accuracyReadings.length > 0
        ? accuracyReadings.reduce((sum, acc) => sum + acc, 0) /
          accuracyReadings.length
        : null;

    const durationMinutes = Math.round(elapsedSeconds / 60);

    if (durationMinutes > 0 && selectedSong) {
      savePracticeMutation.mutate({
        song_part_id: selectedPart?.id || null,
        practice_date: new Date().toISOString().split("T")[0],
        duration_minutes: durationMinutes,
        average_pitch_accuracy: avgAccuracy
          ? Math.round(avgAccuracy * 100) / 100
          : null,
        notes: `Practiced ${selectedSong.title}${selectedPart ? ` - ${selectedPart.partType}` : ""}`,
      });
    }
  };

  const getPitchColor = () => {
    if (!pitch) return "text-loft-plum-400";
    if (Math.abs(cents) < 10) return "text-choir-sage-500";
    if (Math.abs(cents) < 25) return "text-brass-gold-500";
    return "text-ember-coral-500";
  };

  const formatElapsedTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  if (isLoadingSongs) return <Spinner />;

  const songList = Array.isArray(songs) ? songs : [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-display text-loft-plum-900">
          Practice Room
        </h1>
        <p className="text-loft-plum-600 mt-1">
          Practice your parts and improve your voice
        </p>
      </div>

      {saveMessage && (
        <div className="bg-choir-sage-100 text-choir-sage-800 p-3 rounded-lg">
          <Save className="w-4 h-4 inline mr-2" />
          {saveMessage}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Song Selection */}
        <div className="lg:col-span-1 space-y-4">
          <Card>
            <h2 className="text-xl font-display text-loft-plum-900 mb-4">
              Select Song
            </h2>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {songList.map((song: Song) => (
                <button
                  key={song.id}
                  onClick={() => {
                    setSelectedSong(song);
                    setSelectedPart(null);
                  }}
                  className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${
                    selectedSong?.id === song.id
                      ? "bg-loft-plum-100 border-loft-plum-300 border"
                      : "hover:bg-loft-plum-50 border border-transparent"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-loft-plum-900">
                        {song.title}
                      </p>
                      {song.artist && (
                        <p className="text-sm text-loft-plum-500">
                          {song.artist}
                        </p>
                      )}
                    </div>
                    <Music className="w-4 h-4 text-loft-plum-400" />
                  </div>
                </button>
              ))}
            </div>
          </Card>

          {selectedSong && songParts && songParts.length > 0 && (
            <Card>
              <h2 className="text-xl font-display text-loft-plum-900 mb-4">
                Voice Parts
              </h2>
              <div className="space-y-2">
                {songParts.map((part: SongPart) => (
                  <button
                    key={part.id}
                    onClick={() => setSelectedPart(part)}
                    className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${
                      selectedPart?.id === part.id
                        ? "bg-brass-gold-100 border-brass-gold-300 border"
                        : "hover:bg-loft-plum-50 border border-transparent"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-loft-plum-900 capitalize">
                        {part.partType}
                      </span>
                      {part.audioFilePath && (
                        <Play className="w-4 h-4 text-loft-plum-400" />
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </Card>
          )}
        </div>

        {/* Practice Area */}
        <div className="lg:col-span-2 space-y-4">
          {selectedSong ? (
            <>
              {/* Audio Player */}
              {selectedPart?.audioFilePath && (
                <Card>
                  <AudioPlayer
                    src={selectedPart.audioFilePath}
                    title={`${selectedSong.title} - ${selectedPart.partType} Part`}
                  />
                </Card>
              )}

              {/* Pitch Detector */}
              <Card className="text-center space-y-6">
                <h2 className="text-2xl font-display text-loft-plum-800">
                  Pitch Detector
                </h2>

                {error && (
                  <div className="bg-ember-coral-100 text-ember-coral-800 p-3 rounded-lg">
                    {error}
                  </div>
                )}

                <div className="space-y-2">
                  <div className={`text-6xl font-display ${getPitchColor()}`}>
                    {note || "---"}
                  </div>
                  <p className="text-loft-plum-500">
                    {pitch ? `${pitch.toFixed(1)} Hz` : "Start singing..."}
                  </p>
                  {pitch && (
                    <Badge
                      variant={
                        Math.abs(cents) < 10
                          ? "sage"
                          : Math.abs(cents) < 25
                            ? "gold"
                            : "coral"
                      }
                    >
                      <Target className="w-4 h-4 mr-1" />
                      {cents > 0 ? "+" : ""}
                      {cents.toFixed(0)} cents
                    </Badge>
                  )}
                </div>

                <div className="flex justify-center space-x-4">
                  {!isPracticing ? (
                    <Button
                      variant="sage"
                      size="lg"
                      onClick={handleStartPractice}
                    >
                      <Mic className="w-5 h-5 mr-2" />
                      Start Practice
                    </Button>
                  ) : (
                    <Button
                      variant="coral"
                      size="lg"
                      onClick={handleStopPractice}
                    >
                      <Square className="w-5 h-5 mr-2" />
                      Stop & Save
                    </Button>
                  )}
                </div>
              </Card>

              {/* Practice Info */}
              <Card>
                <h2 className="text-xl font-display text-loft-plum-900 mb-4">
                  Practice Session
                </h2>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm text-loft-plum-500">Song</p>
                    <p className="font-medium text-loft-plum-900 truncate">
                      {selectedSong.title}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-loft-plum-500">Part</p>
                    <p className="font-medium text-loft-plum-900 capitalize">
                      {selectedPart?.partType || "Full Song"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-loft-plum-500 flex items-center">
                      <Clock className="w-4 h-4 mr-1" />
                      Duration
                    </p>
                    <p className="font-medium text-loft-plum-900">
                      {formatElapsedTime(elapsedSeconds)}
                    </p>
                  </div>
                </div>
                {isPracticing && (
                  <div className="mt-4">
                    <Badge variant="sage">
                      <span className="animate-pulse">●</span> In Progress
                    </Badge>
                  </div>
                )}
              </Card>
            </>
          ) : (
            <Card className="text-center py-12">
              <Music className="w-16 h-16 text-loft-plum-300 mx-auto mb-4" />
              <h2 className="text-xl font-display text-loft-plum-900 mb-2">
                Select a Song to Begin
              </h2>
              <p className="text-loft-plum-500">
                Choose a song from the list to start practicing
              </p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
