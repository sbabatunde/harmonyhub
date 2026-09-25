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

  // Refs
  const instrumentalRef = useRef<HTMLAudioElement>(null);
  const partRefsMap = useRef<Map<string, HTMLAudioElement>>(new Map());
  const isDraggingRef = useRef(false);
  const pendingSeekRef = useRef<number | null>(null);
  const masterTrackTypeRef = useRef<string | null>(null);

  // Decide which track is the "master clock"
  useEffect(() => {
    masterTrackTypeRef.current = instrumentalPath
      ? "__instrumental__"
      : (partsWithAudio[0]?.partType ?? null);
  }, [instrumentalPath, partsWithAudio]);

  // Initialize per-part volumes once
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

  // Helper: get all audio elements (instrumental + parts)
  const getAllAudio = useCallback((): HTMLAudioElement[] => {
    const arr: HTMLAudioElement[] = [];
    if (instrumentalRef.current) arr.push(instrumentalRef.current);
    partsWithAudio.forEach((p) => {
      const el = partRefsMap.current.get(p.partType);
      if (el) arr.push(el);
    });
    return arr;
  }, [partsWithAudio]);

  // Get master clock element
  const getMasterAudio = useCallback((): HTMLAudioElement | null => {
    const type = masterTrackTypeRef.current;
    if (!type) return null;
    if (type === "__instrumental__") return instrumentalRef.current;
    return partRefsMap.current.get(type) ?? null;
  }, []);

  // Set up event listeners for all tracks
  useEffect(() => {
    const audios = getAllAudio();
    const listeners: Array<{
      audio: HTMLAudioElement;
      handler: () => void;
    }> = [];

    audios.forEach((audio) => {
      const handler = () => {
        if (audio.duration > duration && isFinite(audio.duration)) {
          setDuration(audio.duration);
        }
      };
      audio.addEventListener("loadedmetadata", handler);
      listeners.push({ audio, handler });
      audio.load();
    });

    return () => {
      listeners.forEach(({ audio, handler }) =>
        audio.removeEventListener("loadedmetadata", handler),
      );
    };
  }, [getAllAudio, duration]);

  // Sync loop — runs while playing
  useEffect(() => {
    if (!isPlaying) return;

    const interval = setInterval(() => {
      if (isDraggingRef.current) return;

      const master = getMasterAudio();
      if (!master) return;

      const masterTime = master.currentTime;
      setCurrentTime(masterTime);

      // Drift-correct every track against the master
      getAllAudio().forEach((audio) => {
        if (audio === master) return;
        if (Math.abs(audio.currentTime - masterTime) > 0.15) {
          audio.currentTime = masterTime;
        }
      });

      // End-of-track
      if (master.ended || masterTime >= master.duration - 0.1) {
        getAllAudio().forEach((a) => a.pause());
        setIsPlaying(false);
      }
    }, 100);

    return () => clearInterval(interval);
  }, [isPlaying, getMasterAudio, getAllAudio]);

  // Apply volumes whenever anything changes
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

    // Sync all to master's current position before starting
    const master = getMasterAudio() ?? audios[0];
    const startTime = master.currentTime;

    try {
      await Promise.all(
        audios.map((audio) => {
          audio.currentTime = startTime;
          return audio.play();
        }),
      );
      setIsPlaying(true);
      setError(null);
    } catch (err) {
      console.error("Playback failed:", err);
      setError("Failed to play audio. Try again.");
      setIsPlaying(false);
    }
  }, [isPlaying, getAllAudio, getMasterAudio]);

  // Seek handling — UI updates live, audio elements updated on every change
  const handleSeekInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const time = parseFloat(e.target.value);
      if (!isFinite(time)) return;
      pendingSeekRef.current = time;
      setCurrentTime(time);

      // Live update all elements so music follows the slider
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
    <div className={cn("space-y-4", className)}>
      {/* Hidden audio elements */}
      {instrumentalPath && (
        <audio
          ref={instrumentalRef}
          src={resolveAudioUrl(instrumentalPath)}
          preload="auto"
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
          preload="auto"
        />
      ))}

      {/* Title */}
      <div className="flex items-center justify-between">
        <h3 className="font-display text-lg text-loft-plum-900 flex items-center">
          <Layers className="w-5 h-5 mr-2 text-brass-gold-500" />
          {title || "Full Practice Mix"}
        </h3>
        <div className="flex items-center space-x-2">
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
          className="w-full h-2 bg-loft-plum-100 rounded-full appearance-none cursor-pointer
                     [&::-webkit-slider-thumb]:appearance-none
                     [&::-webkit-slider-thumb]:w-4
                     [&::-webkit-slider-thumb]:h-4
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
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
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

        <div className="flex items-center space-x-2">
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
            className="w-24 h-1 bg-loft-plum-200 rounded-full appearance-none cursor-pointer
                       [&::-webkit-slider-thumb]:appearance-none
                       [&::-webkit-slider-thumb]:w-3
                       [&::-webkit-slider-thumb]:h-3
                       [&::-webkit-slider-thumb]:rounded-full
                       [&::-webkit-slider-thumb]:bg-loft-plum-500"
            title="Master volume"
          />
        </div>
      </div>

      {/* TV-Style Lyrics */}
      {lyrics && lyrics.length > 0 && (
        <div className="relative bg-loft-plum-900 rounded-xl p-6 min-h-[180px] overflow-hidden">
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
                className="text-center"
              >
                {currentLyricIndex >= 0 ? (
                  <>
                    <p className="text-3xl font-display text-brass-gold-400 font-bold">
                      {lyrics[currentLyricIndex]?.text}
                    </p>
                    {currentLyricIndex + 1 < lyrics.length && (
                      <p className="text-lg text-loft-plum-400 mt-3 opacity-70">
                        {lyrics[currentLyricIndex + 1]?.text}
                      </p>
                    )}
                  </>
                ) : (
                  <p className="text-xl text-loft-plum-400">
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
      <div className="bg-loft-plum-50 rounded-lg p-4 space-y-3">
        <p className="text-xs font-medium text-loft-plum-500 uppercase tracking-wide">
          Track Mixer
        </p>

        {instrumentalPath && (
          <div className="flex items-center space-x-3 pb-2 border-b border-loft-plum-100">
            <button
              onClick={() => setInstrumentalMuted((v) => !v)}
              className="p-1 hover:bg-loft-plum-100 rounded"
              title={instrumentalMuted ? "Unmute" : "Mute"}
            >
              {instrumentalMuted ? (
                <VolumeX className="w-4 h-4 text-loft-plum-400" />
              ) : (
                <Volume2 className="w-4 h-4 text-loft-plum-600" />
              )}
            </button>
            <span className="w-24 text-sm font-medium text-loft-plum-700 flex items-center">
              <Music className="w-3 h-3 mr-1" />
              Instrumental
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
              className="flex-1 h-1 bg-loft-plum-200 rounded-full appearance-none cursor-pointer
                         [&::-webkit-slider-thumb]:appearance-none
                         [&::-webkit-slider-thumb]:w-3
                         [&::-webkit-slider-thumb]:h-3
                         [&::-webkit-slider-thumb]:rounded-full
                         [&::-webkit-slider-thumb]:bg-loft-plum-500"
            />
            <span className="text-xs text-loft-plum-400 w-10 text-right">
              {Math.round(instrumentalVolume * 100)}%
            </span>
          </div>
        )}

        {partsWithAudio.map((part) => (
          <div key={part.id} className="flex items-center space-x-3">
            <button
              onClick={() => togglePartMute(part.partType)}
              className="p-1 hover:bg-loft-plum-100 rounded"
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
                "w-24 text-sm font-medium capitalize flex items-center",
                getPartColor(part.partType),
              )}
            >
              <Mic2 className="w-3 h-3 mr-1" />
              {part.partType}
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
              className="flex-1 h-1 bg-loft-plum-200 rounded-full appearance-none cursor-pointer
                         [&::-webkit-slider-thumb]:appearance-none
                         [&::-webkit-slider-thumb]:w-3
                         [&::-webkit-slider-thumb]:h-3
                         [&::-webkit-slider-thumb]:rounded-full
                         [&::-webkit-slider-thumb]:bg-loft-plum-500"
            />
            <span className="text-xs text-loft-plum-400 w-10 text-right">
              {Math.round((partVolumes[part.partType] ?? 1) * 100)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};
