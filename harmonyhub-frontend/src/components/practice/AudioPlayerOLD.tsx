import React, { useRef, useState, useEffect, useCallback } from "react";
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
import { cn } from "@/utils/helpers";
import { resolveAudioUrl } from "@/utils/helpers";

interface AudioPlayerProps {
  src: string;
  title?: string;
  onTimeUpdate?: (time: number) => void;
  onEnded?: () => void;
  className?: string;
  showLoopControls?: boolean;
  showWaveform?: boolean;
  initialPlaybackRate?: number;
}

export const AudioPlayer: React.FC<AudioPlayerProps> = ({
  src,
  title,
  onTimeUpdate,
  onEnded,
  className,
  showLoopControls = true,
  showWaveform = false,
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

  // Audio event listeners
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleLoadedMetadata = () => {
      setDuration(audio.duration);
      setIsLoading(false);
    };
    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
      onTimeUpdate?.(audio.currentTime);

      // Handle looping
      if (isLooping && loopStart !== null && loopEnd !== null) {
        if (audio.currentTime >= loopEnd) {
          audio.currentTime = loopStart;
        }
      }
    };
    const handleEnded = () => {
      setIsPlaying(false);
      onEnded?.();
    };
    const handleWaiting = () => setIsLoading(true);
    const handlePlaying = () => setIsLoading(false);
    const handleError = () => {
      setError("Failed to load audio");
      setIsLoading(false);
    };

    audio.addEventListener("loadedmetadata", handleLoadedMetadata);
    audio.addEventListener("timeupdate", handleTimeUpdate);
    audio.addEventListener("ended", handleEnded);
    audio.addEventListener("waiting", handleWaiting);
    audio.addEventListener("playing", handlePlaying);
    audio.addEventListener("error", handleError);

    return () => {
      audio.removeEventListener("loadedmetadata", handleLoadedMetadata);
      audio.removeEventListener("timeupdate", handleTimeUpdate);
      audio.removeEventListener("ended", handleEnded);
      audio.removeEventListener("waiting", handleWaiting);
      audio.removeEventListener("playing", handlePlaying);
      audio.removeEventListener("error", handleError);
    };
  }, [onTimeUpdate, onEnded, isLooping, loopStart, loopEnd]);

  // Update volume when changed
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  // Playback controls
  const togglePlay = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
    } else {
      audio.play();
    }
    setIsPlaying(!isPlaying);
  }, [isPlaying]);

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  const skipForward = (seconds: number = 10) => {
    if (audioRef.current) {
      const newTime = Math.min(
        audioRef.current.currentTime + seconds,
        duration,
      );
      audioRef.current.currentTime = newTime;
      setCurrentTime(newTime);
    }
  };

  const skipBackward = (seconds: number = 10) => {
    if (audioRef.current) {
      const newTime = Math.max(audioRef.current.currentTime - seconds, 0);
      audioRef.current.currentTime = newTime;
      setCurrentTime(newTime);
    }
  };

  const toggleMute = () => {
    if (audioRef.current) {
      audioRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    if (audioRef.current) {
      audioRef.current.volume = newVolume;
      if (newVolume > 0 && isMuted) {
        audioRef.current.muted = false;
        setIsMuted(false);
      }
    }
  };

  const changePlaybackRate = (rate: number) => {
    if (audioRef.current) {
      audioRef.current.playbackRate = rate;
      audioRef.current.preservesPitch = true;
      setPlaybackRate(rate);
    }
  };

  const setLoopPoint = () => {
    if (loopStart === null) {
      setLoopStart(currentTime);
    } else if (loopEnd === null) {
      setLoopEnd(currentTime);
      setIsLooping(true);
    } else {
      setLoopStart(null);
      setLoopEnd(null);
      setIsLooping(false);
    }
  };

  const clearLoop = () => {
    setLoopStart(null);
    setLoopEnd(null);
    setIsLooping(false);
  };

  const formatTime = (time: number) => {
    if (!isFinite(time)) return "0:00";
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };
  const resolvedSrc = resolveAudioUrl(src);

  return (
    <div className={cn("space-y-4", className)}>
      <audio ref={audioRef} src={resolvedSrc} preload="metadata" />

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
            onChange={handleSeek}
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

          {/* Loop markers */}
          {loopStart !== null && (
            <div
              className="absolute top-0 w-0.5 h-5 bg-brass-gold-400 -ml-0.25"
              style={{ left: `${(loopStart / duration) * 100}%` }}
              title={`Loop start: ${formatTime(loopStart)}`}
            />
          )}
          {loopEnd !== null && (
            <div
              className="absolute top-0 w-0.5 h-5 bg-brass-gold-400 -ml-0.25"
              style={{ left: `${(loopEnd / duration) * 100}%` }}
              title={`Loop end: ${formatTime(loopEnd)}`}
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
          {/* Skip Backward */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => skipBackward(10)}
            title="Skip back 10 seconds"
          >
            <SkipBack className="w-4 h-4" />
          </Button>

          {/* Play/Pause */}
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

          {/* Skip Forward */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => skipForward(10)}
            title="Skip forward 10 seconds"
          >
            <SkipForward className="w-4 h-4" />
          </Button>

          {/* Restart */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              if (audioRef.current) {
                audioRef.current.currentTime = 0;
                setCurrentTime(0);
              }
            }}
            title="Restart"
          >
            <RotateCcw className="w-4 h-4" />
          </Button>
        </div>

        <div className="flex items-center space-x-3">
          {/* Loop Controls */}
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

          {/* Settings */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowSettings(!showSettings)}
            title="Playback settings"
          >
            <Settings2 className="w-4 h-4" />
          </Button>

          {/* Volume Control */}
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
      {/* Playback Settings Panel */}
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
