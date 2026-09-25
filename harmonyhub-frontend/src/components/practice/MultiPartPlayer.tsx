import React, { useRef, useState, useEffect, useMemo } from "react";
import { Play, Pause, Volume2, VolumeX, Layers, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { cn, resolveAudioUrl } from "@/utils/helpers";

interface Part {
  id: number;
  partType: string;
  audioFilePath?: string | null;
}

interface MultiPartPlayerProps {
  parts: Part[];
  title?: string;
  className?: string;
}

export const MultiPartPlayer: React.FC<MultiPartPlayerProps> = ({
  parts,
  title,
  className,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [masterVolume, setMasterVolume] = useState(0.7); // Lower default to avoid clipping
  const [isMuted, setIsMuted] = useState(false);
  const [partVolumes, setPartVolumes] = useState<Record<string, number>>({});
  const [partMuted, setPartMuted] = useState<Record<string, boolean>>({});
  const [error, setError] = useState<string | null>(null);

  const audioRefs = useRef<Record<string, HTMLAudioElement>>({});
  const isSeekingRef = useRef(false);

  // Filter parts that have audio
  const partsWithAudio = useMemo(
    () => parts.filter((p) => p.audioFilePath),
    [parts],
  );

  // Initialize volumes
  useEffect(() => {
    const initialVolumes: Record<string, number> = {};
    const initialMuted: Record<string, boolean> = {};
    partsWithAudio.forEach((part) => {
      initialVolumes[part.partType] = 1;
      initialMuted[part.partType] = false;
    });
    setPartVolumes(initialVolumes);
    setPartMuted(initialMuted);
  }, [partsWithAudio]);

  // Set up all audio elements
  useEffect(() => {
    const audios: HTMLAudioElement[] = [];

    partsWithAudio.forEach((part) => {
      const audio = audioRefs.current[part.partType];
      if (!audio) return;

      audios.push(audio);

      const handleLoadedMetadata = () => {
        // Use the longest duration
        if (audio.duration > duration) {
          setDuration(audio.duration);
        }
      };

      audio.addEventListener("loadedmetadata", handleLoadedMetadata);
    });

    return () => {
      audios.forEach((audio) => {
        audio.removeEventListener("loadedmetadata", () => {});
      });
    };
  }, [partsWithAudio, duration]);

  // Sync playback across all audio elements
  useEffect(() => {
    if (!isPlaying) return;

    const syncInterval = setInterval(() => {
      const masterAudio = audioRefs.current[partsWithAudio[0]?.partType];
      if (!masterAudio || isSeekingRef.current) return;

      const masterTime = masterAudio.currentTime;

      // Sync all other audio elements to match master
      partsWithAudio.forEach((part) => {
        const audio = audioRefs.current[part.partType];
        if (audio && Math.abs(audio.currentTime - masterTime) > 0.1) {
          audio.currentTime = masterTime;
        }
      });

      setCurrentTime(masterTime);
    }, 100);

    return () => clearInterval(syncInterval);
  }, [isPlaying, partsWithAudio]);

  // Update volumes
  useEffect(() => {
    partsWithAudio.forEach((part) => {
      const audio = audioRefs.current[part.partType];
      if (audio) {
        const partVol = partVolumes[part.partType] ?? 1;
        const isPartMuted = partMuted[part.partType] ?? false;
        audio.volume = masterVolume * (isMuted || isPartMuted ? 0 : partVol);
      }
    });
  }, [masterVolume, isMuted, partVolumes, partMuted, partsWithAudio]);

  const togglePlay = () => {
    const audios = partsWithAudio
      .map((part) => audioRefs.current[part.partType])
      .filter(Boolean);

    if (audios.length === 0) return;

    if (isPlaying) {
      audios.forEach((audio) => audio.pause());
      setIsPlaying(false);
    } else {
      // Sync all to same time before playing
      const startTime = audios[0].currentTime;
      audios.forEach((audio) => {
        audio.currentTime = startTime;
        audio.play().catch((err) => {
          console.error("Error playing:", err);
          setError("Failed to play audio");
        });
      });
      setIsPlaying(true);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    if (!isFinite(time)) return;

    isSeekingRef.current = true;
    setCurrentTime(time);

    partsWithAudio.forEach((part) => {
      const audio = audioRefs.current[part.partType];
      if (audio) {
        audio.currentTime = time;
      }
    });

    setTimeout(() => {
      isSeekingRef.current = false;
    }, 100);
  };

  const restart = () => {
    partsWithAudio.forEach((part) => {
      const audio = audioRefs.current[part.partType];
      if (audio) audio.currentTime = 0;
    });
    setCurrentTime(0);
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
  };

  const togglePartMute = (partType: string) => {
    setPartMuted((prev) => ({
      ...prev,
      [partType]: !prev[partType],
    }));
  };

  const setPartVolume = (partType: string, volume: number) => {
    setPartVolumes((prev) => ({
      ...prev,
      [partType]: volume,
    }));
  };

  const formatTime = (time: number) => {
    if (!isFinite(time) || time < 0) return "0:00";
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

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

  if (partsWithAudio.length === 0) {
    return null;
  }

  return (
    <div className={cn("space-y-4", className)}>
      {/* Hidden audio elements */}
      {partsWithAudio.map((part) => (
        <audio
          key={part.id}
          ref={(el) => {
            if (el) audioRefs.current[part.partType] = el;
          }}
          src={resolveAudioUrl(part.audioFilePath!)}
          preload="metadata"
        />
      ))}

      {/* Title */}
      <div className="flex items-center justify-between">
        <h3 className="font-display text-lg text-loft-plum-900 flex items-center">
          <Layers className="w-5 h-5 mr-2 text-brass-gold-500" />
          {title || "All Parts Together"}
        </h3>
        <Badge variant="gold">{partsWithAudio.length} parts</Badge>
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
          onChange={handleSeek}
          className="w-full h-2 bg-loft-plum-100 rounded-full appearance-none cursor-pointer
                     [&::-webkit-slider-thumb]:appearance-none
                     [&::-webkit-slider-thumb]:w-4
                     [&::-webkit-slider-thumb]:h-4
                     [&::-webkit-slider-thumb]:rounded-full
                     [&::-webkit-slider-thumb]:bg-brass-gold-500
                     [&::-webkit-slider-thumb]:cursor-pointer"
        />
        <div className="flex justify-between text-sm text-loft-plum-500">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>

      {/* Main Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Button variant="primary" size="sm" onClick={togglePlay}>
            {isPlaying ? (
              <>
                <Pause className="w-4 h-4 mr-1" />
                Pause All
              </>
            ) : (
              <>
                <Play className="w-4 h-4 mr-1" />
                Play All
              </>
            )}
          </Button>

          <Button variant="ghost" size="sm" onClick={restart}>
            <RotateCcw className="w-4 h-4" />
          </Button>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={toggleMute}
            className="p-2 rounded-lg hover:bg-loft-plum-100"
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
                       [&::-webkit-slider-thumb]:bg-brass-gold-500"
          />
        </div>
      </div>

      {/* Individual Part Controls */}
      <div className="bg-loft-plum-50 rounded-lg p-3 space-y-2">
        <p className="text-xs font-medium text-loft-plum-500 uppercase tracking-wide mb-2">
          Individual Parts
        </p>
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
                "w-20 text-sm font-medium capitalize",
                getPartColor(part.partType),
              )}
            >
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
            <span className="text-xs text-loft-plum-400 w-8 text-right">
              {Math.round((partVolumes[part.partType] ?? 1) * 100)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};
