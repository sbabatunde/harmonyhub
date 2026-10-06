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
  const [masterVolume, setMasterVolume] = useState(0.7);
  const [isMuted, setIsMuted] = useState(false);
  const [partVolumes, setPartVolumes] = useState<Record<string, number>>({});
  const [partMuted, setPartMuted] = useState<Record<string, boolean>>({});
  const [error, setError] = useState<string | null>(null);

  const audioRefs = useRef<Record<string, HTMLAudioElement>>({});
  const isSeekingRef = useRef(false);

  const partsWithAudio = useMemo(
    () => parts.filter((p) => p.audioFilePath),
    [parts],
  );

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

  useEffect(() => {
    const audios: HTMLAudioElement[] = [];

    partsWithAudio.forEach((part) => {
      const audio = audioRefs.current[part.partType];
      if (!audio) return;

      audios.push(audio);

      const handleLoadedMetadata = () => {
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

  // 200ms sync — lighter on mobile
  useEffect(() => {
    if (!isPlaying) return;

    const syncInterval = setInterval(() => {
      const masterAudio = audioRefs.current[partsWithAudio[0]?.partType];
      if (!masterAudio || isSeekingRef.current) return;

      const masterTime = masterAudio.currentTime;

      partsWithAudio.forEach((part) => {
        const audio = audioRefs.current[part.partType];
        if (audio && Math.abs(audio.currentTime - masterTime) > 0.15) {
          audio.currentTime = masterTime;
        }
      });

      setCurrentTime(masterTime);
    }, 200);

    return () => clearInterval(syncInterval);
  }, [isPlaying, partsWithAudio]);

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

  const togglePlay = async () => {
    const audios = partsWithAudio
      .map((part) => audioRefs.current[part.partType])
      .filter(Boolean) as HTMLAudioElement[];

    if (audios.length === 0) return;

    if (isPlaying) {
      audios.forEach((audio) => audio.pause());
      setIsPlaying(false);
      return;
    }

    const startTime = audios[0].currentTime;
    audios.forEach((audio) => (audio.currentTime = startTime));

    // iOS-safe: play the master, then the rest
    try {
      await audios[0].play();
      const results = await Promise.allSettled(
        audios.slice(1).map((a) => a.play()),
      );
      const blocked = results.filter((r) => r.status === "rejected").length;
      if (blocked > 0) {
        setError(`Device blocked ${blocked} tracks. Tap Play again.`);
      } else {
        setError(null);
      }
      setIsPlaying(true);
    } catch (err) {
      console.error("Error playing:", err);
      setError("Failed to play audio. Tap again.");
      setIsPlaying(false);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    if (!isFinite(time)) return;

    isSeekingRef.current = true;
    setCurrentTime(time);

    partsWithAudio.forEach((part) => {
      const audio = audioRefs.current[part.partType];
      if (audio) audio.currentTime = time;
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

  const toggleMute = () => setIsMuted(!isMuted);

  const togglePartMute = (partType: string) =>
    setPartMuted((prev) => ({ ...prev, [partType]: !prev[partType] }));

  const setPartVolume = (partType: string, volume: number) =>
    setPartVolumes((prev) => ({ ...prev, [partType]: volume }));

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

  if (partsWithAudio.length === 0) return null;

  return (
    <div className={cn("space-y-4 w-full overflow-hidden", className)}>
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

      <div className="flex items-center justify-between gap-2 flex-wrap">
        <h3 className="font-display text-lg text-loft-plum-900 flex items-center min-w-0">
          <Layers className="w-5 h-5 mr-2 text-brass-gold-500 flex-shrink-0" />
          <span className="truncate">{title || "All Parts Together"}</span>
        </h3>
        <Badge variant="gold">{partsWithAudio.length} parts</Badge>
      </div>

      {error && (
        <div className="bg-ember-coral-100 text-ember-coral-800 p-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      <div className="space-y-1">
        <input
          type="range"
          min="0"
          max={duration || 0}
          step="0.1"
          value={currentTime}
          onChange={handleSeek}
          className="w-full h-2 py-3 bg-transparent appearance-none cursor-pointer touch-none
                     [&::-webkit-slider-runnable-track]:h-2
                     [&::-webkit-slider-runnable-track]:bg-loft-plum-100
                     [&::-webkit-slider-runnable-track]:rounded-full
                     [&::-webkit-slider-thumb]:appearance-none
                     [&::-webkit-slider-thumb]:w-5
                     [&::-webkit-slider-thumb]:h-5
                     [&::-webkit-slider-thumb]:-mt-1.5
                     [&::-webkit-slider-thumb]:rounded-full
                     [&::-webkit-slider-thumb]:bg-brass-gold-500
                     [&::-webkit-slider-thumb]:cursor-pointer"
        />
        <div className="flex justify-between text-sm text-loft-plum-500">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center space-x-1 sm:space-x-2">
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

        <div className="flex items-center space-x-1 sm:space-x-2 flex-shrink-0">
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
            className="w-20 sm:w-24 h-2 py-3 bg-transparent appearance-none cursor-pointer touch-none
                       [&::-webkit-slider-runnable-track]:h-1
                       [&::-webkit-slider-runnable-track]:bg-loft-plum-200
                       [&::-webkit-slider-runnable-track]:rounded-full
                       [&::-webkit-slider-thumb]:appearance-none
                       [&::-webkit-slider-thumb]:w-5
                       [&::-webkit-slider-thumb]:h-5
                       [&::-webkit-slider-thumb]:-mt-2
                       [&::-webkit-slider-thumb]:rounded-full
                       [&::-webkit-slider-thumb]:bg-brass-gold-500"
          />
        </div>
      </div>

      <div className="bg-loft-plum-50 rounded-lg p-3 space-y-3">
        <p className="text-xs font-medium text-loft-plum-500 uppercase tracking-wide mb-2">
          Individual Parts
        </p>
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
                "w-16 sm:w-20 text-sm font-medium capitalize flex-shrink-0 truncate",
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
