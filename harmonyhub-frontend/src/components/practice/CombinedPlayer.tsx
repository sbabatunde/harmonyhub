import React, {
  useRef,
  useState,
  useEffect,
  useCallback,
  useMemo,
} from "react";
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Layers,
  RotateCcw,
  Music,
  Mic2,
  SkipBack,
  SkipForward,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { motion, AnimatePresence } from "framer-motion";
import { cn, resolveAudioUrl } from "@/utils/helpers";

interface Part {
  id: number;
  partType: string;
  audioFilePath?: string | null;
}

interface LyricLine {
  start: number;
  end: number;
  text: string;
}

interface CombinedPlayerProps {
  parts: Part[];
  instrumentalPath?: string | null;
  lyrics?: LyricLine[] | null;
  title?: string;
  className?: string;
}

export const CombinedPlayer: React.FC<CombinedPlayerProps> = ({
  parts,
  instrumentalPath,
  lyrics,
  title,
  className,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [masterVolume, setMasterVolume] = useState(0.7);
  const [isMuted, setIsMuted] = useState(false);
  const [instrumentalVolume, setInstrumentalVolume] = useState(0.6);
  const [partVolumes, setPartVolumes] = useState<Record<string, number>>({});
  const [partMuted, setPartMuted] = useState<Record<string, boolean>>({});
  const [instrumentalMuted, setInstrumentalMuted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const partsWithAudio = useMemo(
    () => parts.filter((p) => p.audioFilePath),
    [parts],
  );

  const instrumentalRef = useRef<HTMLAudioElement>(null);
  const partRefsMap = useRef<Map<string, HTMLAudioElement>>(new Map());
  const isDraggingRef = useRef(false);
  const pendingSeekRef = useRef<number | null>(null);
  const masterTrackTypeRef = useRef<string | null>(null);

  useEffect(() => {
    masterTrackTypeRef.current = instrumentalPath
      ? "__instrumental__"
      : (partsWithAudio[0]?.partType ?? null);
  }, [instrumentalPath, partsWithAudio]);

  useEffect(() => {
    const vols: Record<string, number> = {};
    const muted: Record<string, boolean> = {};
    partsWithAudio.forEach((p) => {
      vols[p.partType] = 1;
      muted[p.partType] = false;
    });
    setPartVolumes(vols);
    setPartMuted(muted);
  }, [partsWithAudio]);

  const getAllAudio = useCallback((): HTMLAudioElement[] => {
    const arr: HTMLAudioElement[] = [];
    if (instrumentalRef.current) arr.push(instrumentalRef.current);
    partsWithAudio.forEach((p) => {
      const el = partRefsMap.current.get(p.partType);
      if (el) arr.push(el);
    });
    return arr;
  }, [partsWithAudio]);

  const getMasterAudio = useCallback((): HTMLAudioElement | null => {
    const type = masterTrackTypeRef.current;
    if (!type) return null;
    if (type === "__instrumental__") return instrumentalRef.current;
    return partRefsMap.current.get(type) ?? null;
  }, []);

  // Track the master's duration for the progress bar
  useEffect(() => {
    const master = getMasterAudio();
    if (!master) return;

    const handleLoadedMetadata = () => {
      if (isFinite(master.duration) && master.duration > 0) {
        setDuration(master.duration);
      }
    };

    if (isFinite(master.duration) && master.duration > 0) {
      setDuration(master.duration);
    } else {
      master.addEventListener("loadedmetadata", handleLoadedMetadata);
    }

    return () => {
      master.removeEventListener("loadedmetadata", handleLoadedMetadata);
    };
  }, [getMasterAudio, partsWithAudio, instrumentalPath]);

  // Only load metadata — full load happens on first play (iOS-safe)
  useEffect(() => {
    const audios = getAllAudio();
    audios.forEach((audio) => {
      audio.preload = "metadata";
    });
  }, [getAllAudio]);

  // Sync loop — 200ms is plenty and much lighter on mobile
  useEffect(() => {
    if (!isPlaying) return;

    const interval = setInterval(() => {
      if (isDraggingRef.current) return;

      const master = getMasterAudio();
      if (!master) return;

      const masterTime = master.currentTime;
      setCurrentTime(masterTime);

      getAllAudio().forEach((audio) => {
        if (audio === master) return;
        if (Math.abs(audio.currentTime - masterTime) > 0.15) {
          audio.currentTime = masterTime;
        }
      });

      if (master.ended || masterTime >= master.duration - 0.1) {
        getAllAudio().forEach((a) => a.pause());
        setIsPlaying(false);
      }
    }, 200);

    return () => clearInterval(interval);
  }, [isPlaying, getMasterAudio, getAllAudio]);

  useEffect(() => {
    if (instrumentalRef.current) {
      instrumentalRef.current.volume =
        masterVolume * (isMuted || instrumentalMuted ? 0 : instrumentalVolume);
    }

    partsWithAudio.forEach((p) => {
      const audio = partRefsMap.current.get(p.partType);
      if (!audio) return;
      const partVol = partVolumes[p.partType] ?? 1;
      const partIsMuted = partMuted[p.partType] ?? false;
      audio.volume = masterVolume * (isMuted || partIsMuted ? 0 : partVol);
    });
  }, [
    masterVolume,
    isMuted,
    instrumentalVolume,
    instrumentalMuted,
    partVolumes,
    partMuted,
    partsWithAudio,
  ]);

  const togglePlay = useCallback(async () => {
    const audios = getAllAudio();
    if (audios.length === 0) return;

    if (isPlaying) {
      audios.forEach((a) => a.pause());
      setIsPlaying(false);
      return;
    }

    const master = getMasterAudio() ?? audios[0];
    const startTime = master.currentTime;

    // Play master first, then the rest. iOS grants the gesture to the
    // first audio it sees; subsequent plays are allowed if they were
    // queued from the same gesture.
    try {
      audios.forEach((audio) => {
        audio.currentTime = startTime;
      });

      await master.play();

      // Attach remaining plays; some may be blocked on iOS.
      const others = audios.filter((a) => a !== master);
      const results = await Promise.allSettled(others.map((a) => a.play()));
      const blocked = results.filter((r) => r.status === "rejected").length;

      if (blocked > 0) {
        setError(
          `This device blocked ${blocked} of ${audios.length} tracks. ` +
            `Tap Play again or use a single part.`,
        );
      } else {
        setError(null);
      }
      setIsPlaying(true);
    } catch (err) {
      console.error("Playback failed:", err);
      setError("Failed to play audio. Tap again.");
      setIsPlaying(false);
    }
  }, [isPlaying, getAllAudio, getMasterAudio]);

  const handleSeekInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const time = parseFloat(e.target.value);
      if (!isFinite(time)) return;
      pendingSeekRef.current = time;
      setCurrentTime(time);

      getAllAudio().forEach((audio) => {
        if (!isNaN(audio.duration)) {
          audio.currentTime = Math.min(time, audio.duration);
        }
      });
    },
    [getAllAudio],
  );

  const handleSeekStart = useCallback(() => {
    isDraggingRef.current = true;
  }, []);

  const handleSeekCommit = useCallback(() => {
    isDraggingRef.current = false;
    pendingSeekRef.current = null;
  }, []);

  const skipForward = useCallback(
    (seconds = 10) => {
      const audios = getAllAudio();
      if (audios.length === 0) return;
      const master = getMasterAudio() ?? audios[0];
      const t = Math.min(master.currentTime + seconds, duration);
      audios.forEach((a) => {
        if (!isNaN(a.duration)) a.currentTime = Math.min(t, a.duration);
      });
      setCurrentTime(t);
    },
    [getAllAudio, getMasterAudio, duration],
  );

  const skipBackward = useCallback(
    (seconds = 10) => {
      const audios = getAllAudio();
      if (audios.length === 0) return;
      const master = getMasterAudio() ?? audios[0];
      const t = Math.max(master.currentTime - seconds, 0);
      audios.forEach((a) => (a.currentTime = t));
      setCurrentTime(t);
    },
    [getAllAudio, getMasterAudio],
  );

  const restart = useCallback(() => {
    getAllAudio().forEach((a) => (a.currentTime = 0));
    setCurrentTime(0);
  }, [getAllAudio]);

  const toggleMute = () => setIsMuted((v) => !v);
  const togglePartMute = (partType: string) =>
    setPartMuted((prev) => ({ ...prev, [partType]: !prev[partType] }));
  const setPartVolume = (partType: string, v: number) =>
    setPartVolumes((prev) => ({ ...prev, [partType]: v }));

  const formatTime = (time: number) => {
    if (!isFinite(time) || time < 0) return "0:00";
    const m = Math.floor(time / 60);
    const s = Math.floor(time % 60);
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  const currentLyricIndex = useMemo(() => {
    if (!lyrics || lyrics.length === 0) return -1;
    return lyrics.findIndex(
      (l) => currentTime >= l.start && currentTime <= l.end,
    );
  }, [currentTime, lyrics]);

  const getPartColor = (partType: string) => {
    const colors: Record<string, string> = {
      soprano: "text-ember-coral-500",
      alto: "text-brass-gold-500",
      tenor: "text-choir-sage-500",
      bass: "text-loft-plum-600",
      lead: "text-loft-plum-900",
      harmony: "text-brass-gold-600",
    };
    return colors[partType] || "text-loft-plum-500";
  };

  if (partsWithAudio.length === 0 && !instrumentalPath) return null;

  return (
    <div className={cn("space-y-4 w-full overflow-hidden", className)}>
      {/* Hidden audio elements */}
      {instrumentalPath && (
        <audio
          ref={instrumentalRef}
          src={resolveAudioUrl(instrumentalPath)}
          preload="metadata"
        />
      )}
      {partsWithAudio.map((part) => (
        <audio
          key={part.id}
          ref={(el) => {
            if (el) partRefsMap.current.set(part.partType, el);
            else partRefsMap.current.delete(part.partType);
          }}
          src={resolveAudioUrl(part.audioFilePath!)}
          preload="metadata"
        />
      ))}

      {/* Title */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <h3 className="font-display text-lg text-loft-plum-900 flex items-center min-w-0">
          <Layers className="w-5 h-5 mr-2 text-brass-gold-500 flex-shrink-0" />
          <span className="truncate">{title || "Full Practice Mix"}</span>
        </h3>
        <div className="flex items-center space-x-2 flex-shrink-0">
          {instrumentalPath && (
            <Badge variant="plum">
              <Music className="w-3 h-3 mr-1" />
              Instrumental
            </Badge>
          )}
          {partsWithAudio.length > 0 && (
            <Badge variant="gold">
              <Mic2 className="w-3 h-3 mr-1" />
              {partsWithAudio.length} Parts
            </Badge>
          )}
        </div>
      </div>

      {error && (
        <div className="bg-ember-coral-100 text-ember-coral-800 p-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      {/* Progress Bar */}
      <div className="space-y-1">
        <input
          type="range"
          min="0"
          max={duration || 0}
          step="0.1"
          value={currentTime}
          onChange={handleSeekInput}
          onMouseDown={handleSeekStart}
          onMouseUp={handleSeekCommit}
          onTouchStart={handleSeekStart}
          onTouchEnd={handleSeekCommit}
          onKeyUp={handleSeekCommit}
          className="w-full h-2 py-3 bg-transparent appearance-none cursor-pointer touch-none
                     [&::-webkit-slider-runnable-track]:h-2
                     [&::-webkit-slider-runnable-track]:bg-loft-plum-100
                     [&::-webkit-slider-runnable-track]:rounded-full
                     [&::-webkit-slider-thumb]:appearance-none
                     [&::-webkit-slider-thumb]:w-5
                     [&::-webkit-slider-thumb]:h-5
                     [&::-webkit-slider-thumb]:-mt-1.5
                     [&::-webkit-slider-thumb]:rounded-full
                     [&::-webkit-slider-thumb]:bg-loft-plum-600
                     [&::-webkit-slider-thumb]:cursor-pointer
                     [&::-webkit-slider-thumb]:shadow-md"
        />
        <div className="flex justify-between text-sm text-loft-plum-500">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>

      {/* Main Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center space-x-1 sm:space-x-2">
          <Button variant="ghost" size="sm" onClick={() => skipBackward(10)}>
            <SkipBack className="w-4 h-4" />
          </Button>

          <Button variant="primary" size="sm" onClick={togglePlay}>
            {isPlaying ? (
              <>
                <Pause className="w-4 h-4 mr-1" />
                Pause
              </>
            ) : (
              <>
                <Play className="w-4 h-4 mr-1" />
                Play All
              </>
            )}
          </Button>

          <Button variant="ghost" size="sm" onClick={() => skipForward(10)}>
            <SkipForward className="w-4 h-4" />
          </Button>

          <Button variant="ghost" size="sm" onClick={restart} title="Restart">
            <RotateCcw className="w-4 h-4" />
          </Button>
        </div>

        <div className="flex items-center space-x-1 sm:space-x-2 flex-shrink-0">
          <button
            onClick={toggleMute}
            className="p-2 rounded-lg hover:bg-loft-plum-100 transition-colors"
            title={isMuted ? "Unmute All" : "Mute All"}
          >
            {isMuted ? (
              <VolumeX className="w-5 h-5 text-loft-plum-500" />
            ) : (
              <Volume2 className="w-5 h-5 text-loft-plum-500" />
            )}
          </button>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={masterVolume}
            onChange={(e) => setMasterVolume(parseFloat(e.target.value))}
            className="w-20 sm:w-24 h-2 py-3 bg-transparent appearance-none cursor-pointer touch-none
                       [&::-webkit-slider-runnable-track]:h-1
                       [&::-webkit-slider-runnable-track]:bg-loft-plum-200
                       [&::-webkit-slider-runnable-track]:rounded-full
                       [&::-webkit-slider-thumb]:appearance-none
                       [&::-webkit-slider-thumb]:w-5
                       [&::-webkit-slider-thumb]:h-5
                       [&::-webkit-slider-thumb]:-mt-2
                       [&::-webkit-slider-thumb]:rounded-full
                       [&::-webkit-slider-thumb]:bg-loft-plum-500"
            title="Master volume"
          />
        </div>
      </div>

      {/* TV-Style Lyrics */}
      {lyrics && lyrics.length > 0 && (
        <div className="relative bg-loft-plum-900 rounded-xl p-4 sm:p-6 min-h-[140px] sm:min-h-[180px] overflow-hidden">
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
                }}
                className="text-center px-2"
              >
                {currentLyricIndex >= 0 ? (
                  <>
                    <p className="text-xl sm:text-3xl font-display text-brass-gold-400 font-bold">
                      {lyrics[currentLyricIndex]?.text}
                    </p>
                    {currentLyricIndex + 1 < lyrics.length && (
                      <p className="text-sm sm:text-lg text-loft-plum-400 mt-3 opacity-70">
                        {lyrics[currentLyricIndex + 1]?.text}
                      </p>
                    )}
                  </>
                ) : (
                  <p className="text-lg sm:text-xl text-loft-plum-400">
                    <Music className="w-8 h-8 mx-auto mb-2" />
                    Press Play to start
                  </p>
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      )}

      {/* Track Mixer */}
      <div className="bg-loft-plum-50 rounded-lg p-3 sm:p-4 space-y-3">
        <p className="text-xs font-medium text-loft-plum-500 uppercase tracking-wide">
          Track Mixer
        </p>

        {instrumentalPath && (
          <div className="flex items-center gap-2 sm:gap-3 pb-2 border-b border-loft-plum-100">
            <button
              onClick={() => setInstrumentalMuted((v) => !v)}
              className="p-1 hover:bg-loft-plum-100 rounded flex-shrink-0"
              title={instrumentalMuted ? "Unmute" : "Mute"}
            >
              {instrumentalMuted ? (
                <VolumeX className="w-4 h-4 text-loft-plum-400" />
              ) : (
                <Volume2 className="w-4 h-4 text-loft-plum-600" />
              )}
            </button>
            <span className="w-20 sm:w-24 text-sm font-medium text-loft-plum-700 flex items-center flex-shrink-0">
              <Music className="w-3 h-3 mr-1" />
              Inst.
            </span>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={instrumentalVolume}
              onChange={(e) =>
                setInstrumentalVolume(parseFloat(e.target.value))
              }
              className="flex-1 min-w-0 h-2 py-3 bg-transparent appearance-none cursor-pointer touch-none
                         [&::-webkit-slider-runnable-track]:h-1
                         [&::-webkit-slider-runnable-track]:bg-loft-plum-200
                         [&::-webkit-slider-runnable-track]:rounded-full
                         [&::-webkit-slider-thumb]:appearance-none
                         [&::-webkit-slider-thumb]:w-5
                         [&::-webkit-slider-thumb]:h-5
                         [&::-webkit-slider-thumb]:-mt-2
                         [&::-webkit-slider-thumb]:rounded-full
                         [&::-webkit-slider-thumb]:bg-loft-plum-500"
            />
            <span className="text-xs text-loft-plum-400 w-10 text-right flex-shrink-0">
              {Math.round(instrumentalVolume * 100)}%
            </span>
          </div>
        )}

        {partsWithAudio.map((part) => (
          <div key={part.id} className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={() => togglePartMute(part.partType)}
              className="p-1 hover:bg-loft-plum-100 rounded flex-shrink-0"
              title={partMuted[part.partType] ? "Unmute" : "Mute"}
            >
              {partMuted[part.partType] ? (
                <VolumeX
                  className={cn("w-4 h-4", getPartColor(part.partType))}
                />
              ) : (
                <Volume2
                  className={cn("w-4 h-4", getPartColor(part.partType))}
                />
              )}
            </button>
            <span
              className={cn(
                "w-20 sm:w-24 text-sm font-medium capitalize flex items-center flex-shrink-0",
                getPartColor(part.partType),
              )}
            >
              <Mic2 className="w-3 h-3 mr-1" />
              <span className="truncate">{part.partType}</span>
            </span>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={partVolumes[part.partType] ?? 1}
              onChange={(e) =>
                setPartVolume(part.partType, parseFloat(e.target.value))
              }
              className="flex-1 min-w-0 h-2 py-3 bg-transparent appearance-none cursor-pointer touch-none
                         [&::-webkit-slider-runnable-track]:h-1
                         [&::-webkit-slider-runnable-track]:bg-loft-plum-200
                         [&::-webkit-slider-runnable-track]:rounded-full
                         [&::-webkit-slider-thumb]:appearance-none
                         [&::-webkit-slider-thumb]:w-5
                         [&::-webkit-slider-thumb]:h-5
                         [&::-webkit-slider-thumb]:-mt-2
                         [&::-webkit-slider-thumb]:rounded-full
                         [&::-webkit-slider-thumb]:bg-loft-plum-500"
            />
            <span className="text-xs text-loft-plum-400 w-10 text-right flex-shrink-0">
              {Math.round((partVolumes[part.partType] ?? 1) * 100)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};
