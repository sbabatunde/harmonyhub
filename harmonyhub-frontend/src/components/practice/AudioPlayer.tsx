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
  RotateCcw,
  Volume2,
  VolumeX,
  Repeat,
  SkipBack,
  SkipForward,
  Settings2,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { cn, resolveAudioUrl } from "@/utils/helpers";

interface AudioPlayerProps {
  src: string;
  title?: string;
  onTimeUpdate?: (time: number) => void;
  onEnded?: () => void;
  className?: string;
  showLoopControls?: boolean;
  initialPlaybackRate?: number;
}

export const AudioPlayer: React.FC<AudioPlayerProps> = ({
  src,
  title,
  onTimeUpdate,
  onEnded,
  className,
  showLoopControls = true,
  initialPlaybackRate = 1,
}) => {
  const audioRef = useRef<HTMLAudioElement>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(initialPlaybackRate);
  const [loopStart, setLoopStart] = useState<number | null>(null);
  const [loopEnd, setLoopEnd] = useState<number | null>(null);
  const [isLooping, setIsLooping] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Guards to prevent re-loading the same src
  const loadedSrcRef = useRef<string>("");

  // True while user is actively dragging the seek slider.
  const isDraggingRef = useRef(false);
  // Pending seek target — only committed on drag end.
  const pendingSeekRef = useRef<number | null>(null);

  const resolvedSrc = useMemo(() => {
    if (!src) return "";
    if (
      src.startsWith("http://") ||
      src.startsWith("https://") ||
      src.startsWith("blob:")
    ) {
      return src;
    }
    return resolveAudioUrl(src);
  }, [src]);

  // Refs mirroring state used inside audio event handlers
  const loopStateRef = useRef({ isLooping, loopStart, loopEnd });
  const onTimeUpdateRef = useRef(onTimeUpdate);
  const onEndedRef = useRef(onEnded);

  useEffect(() => {
    loopStateRef.current = { isLooping, loopStart, loopEnd };
  }, [isLooping, loopStart, loopEnd]);

  useEffect(() => {
    onTimeUpdateRef.current = onTimeUpdate;
  }, [onTimeUpdate]);

  useEffect(() => {
    onEndedRef.current = onEnded;
  }, [onEnded]);

  // Set src ONLY when it genuinely changes (guarded by loadedSrcRef)
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !resolvedSrc) return;

    // Hard guard: if we've already loaded this exact src, do nothing.
    // Prevents audio.load() from resetting position to 0 on re-renders.
    if (loadedSrcRef.current === resolvedSrc) return;

    loadedSrcRef.current = resolvedSrc;
    audio.src = resolvedSrc;
    audio.load();
    setCurrentTime(0);
    setDuration(0);
    setIsPlaying(false);
    setError(null);
  }, [resolvedSrc]);

  // Attach audio element event listeners ONCE
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleLoadedMetadata = () => {
      setDuration(audio.duration || 0);
      setIsLoading(false);
    };

    const handleTimeUpdate = () => {
      // Skip while dragging so we don't fight the user's slider position
      if (isDraggingRef.current) return;

      const time = audio.currentTime;
      setCurrentTime(time);
      onTimeUpdateRef.current?.(time);

      const { isLooping, loopStart, loopEnd } = loopStateRef.current;
      if (isLooping && loopStart !== null && loopEnd !== null) {
        if (time >= loopEnd) {
          audio.currentTime = loopStart;
        }
      }
    };

    const handleEnded = () => {
      setIsPlaying(false);
      onEndedRef.current?.();
    };

    const handleWaiting = () => setIsLoading(true);
    const handlePlaying = () => {
      setIsLoading(false);
      setIsPlaying(true);
    };
    const handlePause = () => setIsPlaying(false);
    const handleError = () => {
      setError("Failed to load audio");
      setIsLoading(false);
    };

    audio.addEventListener("loadedmetadata", handleLoadedMetadata);
    audio.addEventListener("timeupdate", handleTimeUpdate);
    audio.addEventListener("ended", handleEnded);
    audio.addEventListener("waiting", handleWaiting);
    audio.addEventListener("playing", handlePlaying);
    audio.addEventListener("pause", handlePause);
    audio.addEventListener("error", handleError);

    return () => {
      audio.removeEventListener("loadedmetadata", handleLoadedMetadata);
      audio.removeEventListener("timeupdate", handleTimeUpdate);
      audio.removeEventListener("ended", handleEnded);
      audio.removeEventListener("waiting", handleWaiting);
      audio.removeEventListener("playing", handlePlaying);
      audio.removeEventListener("pause", handlePause);
      audio.removeEventListener("error", handleError);
    };
  }, []);

  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = volume;
  }, [volume]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.playbackRate = playbackRate;
      audioRef.current.preservesPitch = true;
    }
  }, [playbackRate]);

  const togglePlay = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (audio.paused) {
      audio.play().catch((err) => {
        console.error("Error playing audio:", err);
        setError("Failed to play audio");
      });
    } else {
      audio.pause();
    }
  }, []);

  // Update UI immediately while dragging; commit only on release
  const handleSeekInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const time = parseFloat(e.target.value);
      if (!isFinite(time)) return;
      pendingSeekRef.current = time;
      setCurrentTime(time);
    },
    [],
  );

  const handleSeekStart = useCallback(() => {
    isDraggingRef.current = true;
  }, []);

  const handleSeekCommit = useCallback(() => {
    const audio = audioRef.current;
    const pending = pendingSeekRef.current;

    isDraggingRef.current = false;
    pendingSeekRef.current = null;

    if (audio && pending !== null && isFinite(pending)) {
      if (Math.abs(audio.currentTime - pending) > 0.05) {
        audio.currentTime = pending;
      }
    }
  }, []);

  const skipForward = useCallback((seconds = 10) => {
    const audio = audioRef.current;
    if (!audio || !isFinite(audio.duration)) return;
    const t = Math.min(audio.currentTime + seconds, audio.duration);
    audio.currentTime = t;
    setCurrentTime(t);
  }, []);

  const skipBackward = useCallback((seconds = 10) => {
    const audio = audioRef.current;
    if (!audio) return;
    const t = Math.max(audio.currentTime - seconds, 0);
    audio.currentTime = t;
    setCurrentTime(t);
  }, []);

  const toggleMute = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.muted = !audio.muted;
    setIsMuted(audio.muted);
  }, []);

  const handleVolumeChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const v = parseFloat(e.target.value);
      const audio = audioRef.current;
      if (!audio || !isFinite(v)) return;
      audio.volume = v;
      setVolume(v);
      if (v > 0 && audio.muted) {
        audio.muted = false;
        setIsMuted(false);
      }
    },
    [],
  );

  const changePlaybackRate = useCallback((rate: number) => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.playbackRate = rate;
    audio.preservesPitch = true;
    setPlaybackRate(rate);
  }, []);

  const setLoopPoint = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const t = audio.currentTime;
    if (loopStart === null) {
      setLoopStart(t);
    } else if (loopEnd === null) {
      setLoopEnd(t);
      setIsLooping(true);
    } else {
      setLoopStart(null);
      setLoopEnd(null);
      setIsLooping(false);
    }
  }, [loopStart, loopEnd]);

  const clearLoop = useCallback(() => {
    setLoopStart(null);
    setLoopEnd(null);
    setIsLooping(false);
  }, []);

  const restartAudio = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = 0;
    setCurrentTime(0);
  }, []);

  const formatTime = useCallback((time: number) => {
    if (!isFinite(time) || time < 0) return "0:00";
    const m = Math.floor(time / 60);
    const s = Math.floor(time % 60);
    return `${m}:${s.toString().padStart(2, "0")}`;
  }, []);

  return (
    <div className={cn("space-y-4", className)}>
      <audio ref={audioRef} preload="auto" />

      {/* Title and Status */}
      <div className="flex items-center justify-between">
        {title && (
          <h3 className="font-display text-lg text-loft-plum-900 truncate">
            {title}
          </h3>
        )}
        <div className="flex items-center space-x-2">
          {isLoading && (
            <Badge variant="neutral">
              <span className="animate-pulse">Loading...</span>
            </Badge>
          )}
          {isLooping && (
            <Badge variant="gold">
              <Repeat className="w-3 h-3 mr-1" />
              Loop
            </Badge>
          )}
        </div>
      </div>

      {error && (
        <div className="bg-ember-coral-100 text-ember-coral-800 p-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      {/* Progress Bar with Loop Markers */}
      <div className="space-y-1">
        <div className="relative">
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
                       [&::-webkit-slider-thumb]:shadow-md
                       [&::-webkit-slider-thumb]:hover:bg-loft-plum-500"
          />

          {loopStart !== null && duration > 0 && (
            <div
              className="absolute top-0 w-0.5 h-5 bg-brass-gold-400 -ml-0.25 pointer-events-none"
              style={{ left: `${(loopStart / duration) * 100}%` }}
            />
          )}
          {loopEnd !== null && duration > 0 && (
            <div
              className="absolute top-0 w-0.5 h-5 bg-brass-gold-400 -ml-0.25 pointer-events-none"
              style={{ left: `${(loopEnd / duration) * 100}%` }}
            />
          )}
        </div>

        <div className="flex justify-between text-sm text-loft-plum-500">
          <span>{formatTime(currentTime)}</span>
          {isLooping && loopStart !== null && loopEnd !== null && (
            <span className="text-brass-gold-500">
              Loop: {formatTime(loopStart)} - {formatTime(loopEnd)}
            </span>
          )}
          <span>{formatTime(duration)}</span>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => skipBackward(10)}
            title="Skip back 10 seconds"
          >
            <SkipBack className="w-4 h-4" />
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={togglePlay}
            leftIcon={
              isPlaying ? (
                <Pause className="w-4 h-4" />
              ) : (
                <Play className="w-4 h-4" />
              )
            }
          >
            {isPlaying ? "Pause" : "Play"}
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => skipForward(10)}
            title="Skip forward 10 seconds"
          >
            <SkipForward className="w-4 h-4" />
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={restartAudio}
            title="Restart"
          >
            <RotateCcw className="w-4 h-4" />
          </Button>
        </div>

        <div className="flex items-center space-x-3">
          {showLoopControls && (
            <Button
              variant={isLooping ? "gold" : "ghost"}
              size="sm"
              onClick={setLoopPoint}
              title={
                loopStart === null
                  ? "Set loop start"
                  : loopEnd === null
                    ? "Set loop end"
                    : "Clear loop"
              }
            >
              <Repeat className="w-4 h-4" />
              {loopStart === null ? " A" : loopEnd === null ? " B" : ""}
            </Button>
          )}

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowSettings(!showSettings)}
            title="Playback settings"
          >
            <Settings2 className="w-4 h-4" />
          </Button>

          <div className="flex items-center space-x-2">
            <button
              onClick={toggleMute}
              className="p-2 rounded-lg hover:bg-loft-plum-100 transition-colors"
              title={isMuted ? "Unmute" : "Mute"}
            >
              {isMuted || volume === 0 ? (
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
              value={isMuted ? 0 : volume}
              onChange={handleVolumeChange}
              className="w-20 h-1 bg-loft-plum-200 rounded-full appearance-none cursor-pointer
                         [&::-webkit-slider-thumb]:appearance-none
                         [&::-webkit-slider-thumb]:w-3
                         [&::-webkit-slider-thumb]:h-3
                         [&::-webkit-slider-thumb]:rounded-full
                         [&::-webkit-slider-thumb]:bg-loft-plum-500
                         [&::-webkit-slider-thumb]:cursor-pointer"
            />
          </div>
        </div>
      </div>

      {/* Playback Settings */}
      {showSettings && (
        <div className="bg-loft-plum-50 rounded-lg p-4 space-y-3">
          <div>
            <label className="block text-sm font-medium text-loft-plum-700 mb-2">
              Playback Speed
            </label>
            <div className="flex items-center space-x-2">
              {[0.5, 0.75, 1, 1.25, 1.5].map((rate) => (
                <button
                  key={rate}
                  onClick={() => changePlaybackRate(rate)}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-sm font-medium transition-colors",
                    playbackRate === rate
                      ? "bg-loft-plum-600 text-white"
                      : "bg-white text-loft-plum-700 hover:bg-loft-plum-100",
                  )}
                >
                  {rate}x
                </button>
              ))}
            </div>
          </div>

          {isLooping && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-loft-plum-600">
                Loop: {formatTime(loopStart!)} - {formatTime(loopEnd!)}
              </span>
              <Button variant="ghost" size="sm" onClick={clearLoop}>
                Clear Loop
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
