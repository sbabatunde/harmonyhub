import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { songService } from "@/api/services/songService";
import { karaokeService } from "@/api/services/karaokeService";
import { Spinner } from "@/components/ui/Spinner";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { AudioPlayer } from "@/components/practice/AudioPlayer";
import { CombinedPlayer } from "@/components/practice/CombinedPlayer";
import { KaraokePlayer } from "@/components/karaoke/KaraokePlayer";
import {
  Music,
  Key,
  Clock,
  FileText,
  Sparkles,
  Loader,
  Upload,
  ListMusic,
  Plus,
  X,
  Mic2,
  ArrowLeft,
  Layers,
} from "lucide-react";

// ---------- Part Upload Form ----------
interface PartUploadFormProps {
  songId: number;
  isOpen: boolean;
  onClose: () => void;
}

const PartUploadForm: React.FC<PartUploadFormProps> = ({
  songId,
  isOpen,
  onClose,
}) => {
  const [partType, setPartType] = useState("");
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const queryClient = useQueryClient();

  const partTypes = [
    { value: "soprano", label: "Soprano" },
    { value: "alto", label: "Alto" },
    { value: "tenor", label: "Tenor" },
    { value: "bass", label: "Bass" },
    { value: "lead", label: "Lead" },
    { value: "harmony", label: "Harmony" },
  ];

  const uploadPartMutation = useMutation({
    mutationFn: (formData: FormData) =>
      songService.createSongPart(songId, formData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["song", songId] });
      queryClient.invalidateQueries({ queryKey: ["song-parts", songId] });
      onClose();
      setPartType("");
      setAudioFile(null);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!partType || !audioFile) {
      alert("Please select a part type and upload an audio file");
      return;
    }
    const formData = new FormData();
    formData.append("part_type", partType);
    formData.append("audio_file", audioFile);
    uploadPartMutation.mutate(formData);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add Song Part" size="md">
      <form
        onSubmit={handleSubmit}
        className="space-y-4 max-h-[60vh] overflow-y-auto pr-2"
      >
        <div>
          <label className="block text-sm font-medium text-loft-plum-700 mb-1">
            Part Type
          </label>
          <select
            value={partType}
            onChange={(e) => setPartType(e.target.value)}
            className="input-field"
            required
          >
            <option value="">Select part type</option>
            {partTypes.map((part) => (
              <option key={part.value} value={part.value}>
                {part.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-loft-plum-700 mb-1">
            Audio File (Required)
          </label>
          {!audioFile ? (
            <label className="flex flex-col items-center justify-center border-2 border-dashed border-loft-plum-200 rounded-lg p-4 cursor-pointer hover:border-loft-plum-400 transition-colors">
              <Upload className="w-6 h-6 text-loft-plum-300 mb-1" />
              <span className="text-sm text-loft-plum-500">
                Click to upload audio
              </span>
              <span className="text-xs text-loft-plum-400 mt-1">
                MP3, WAV, M4A
              </span>
              <input
                type="file"
                accept=".mp3,.wav,.m4a,.ogg"
                onChange={(e) => setAudioFile(e.target.files?.[0] || null)}
                className="hidden"
                required
              />
            </label>
          ) : (
            <div className="flex items-center justify-between bg-loft-plum-50 rounded-lg p-3">
              <span className="text-sm text-loft-plum-700 truncate">
                {audioFile.name}
              </span>
              <button
                type="button"
                onClick={() => setAudioFile(null)}
                className="p-1 hover:bg-loft-plum-100 rounded flex-shrink-0"
              >
                <X className="w-4 h-4 text-loft-plum-400" />
              </button>
            </div>
          )}
        </div>

        <div className="flex justify-end space-x-3 pt-2 border-t border-loft-plum-100">
          <Button variant="outline" type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            isLoading={uploadPartMutation.isPending}
          >
            Upload Part
          </Button>
        </div>
      </form>
    </Modal>
  );
};

// ---------- Main Page ----------
export default function SongDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isPartFormOpen, setIsPartFormOpen] = useState(false);

  const songId = parseInt(id || "0");

  const { data: song, isLoading } = useQuery({
    queryKey: ["song", songId],
    queryFn: async () => {
      const result = await songService.getSong(songId);
      return result || null;
    },
    enabled: songId > 0,
  });

  const { data: karaokeStatus } = useQuery({
    queryKey: ["karaoke-status", songId],
    queryFn: () => karaokeService.getStatus(songId),
    enabled: songId > 0,
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      if (status === "processing" || status === "pending") return 5000;
      return false;
    },
  });

  // Fetch full karaoke track (for instrumental + lyrics in CombinedPlayer)
  const { data: karaokeTrack } = useQuery({
    queryKey: ["karaoke-track", songId],
    queryFn: () => karaokeService.getTrack(songId),
    enabled: songId > 0 && karaokeStatus?.status === "ready",
  });

  const requestKaraokeMutation = useMutation({
    mutationFn: () => karaokeService.requestProcessing(songId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["karaoke-status", songId] });
    },
  });

  if (isLoading) return <Spinner />;
  if (!song) {
    return (
      <div className="text-center py-12">
        <p className="text-loft-plum-500">Song not found</p>
        <Button
          variant="outline"
          className="mt-4"
          onClick={() => navigate("/songs")}
        >
          Back to Songs
        </Button>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      {/* Back */}
      <button
        onClick={() => navigate("/songs")}
        className="flex items-center text-loft-plum-600 hover:text-loft-plum-800 transition-colors"
      >
        <ArrowLeft className="w-4 h-4 mr-1" />
        Back to Songs
      </button>

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-4xl font-display text-loft-plum-900">
            {song.title}
          </h1>
          {song.artist && (
            <p className="text-lg text-loft-plum-600 mt-1">{song.artist}</p>
          )}
        </div>
        <Badge variant="plum" className="text-lg">
          Level {song.difficultyLevel}
        </Badge>
      </div>

      {/* Metadata */}
      <div className="flex items-center space-x-3 flex-wrap">
        {song.keySignature && (
          <Badge variant="neutral">
            <Key className="w-3 h-3 mr-1" />
            Key: {song.keySignature}
          </Badge>
        )}
        {song.tempo && (
          <Badge variant="neutral">
            <Clock className="w-3 h-3 mr-1" />
            {song.tempo} BPM
          </Badge>
        )}
        {song.isPublicDomain && <Badge variant="sage">Public Domain</Badge>}
      </div>

      {/* Full Track */}
      {song.audioFilePath && (
        <Card>
          <h2 className="text-xl font-display text-loft-plum-900 mb-4 flex items-center">
            <Music className="w-5 h-5 mr-2 text-loft-plum-500" />
            Full Track
          </h2>
          <AudioPlayer src={song.audioFilePath} />
        </Card>
      )}

      {/* Karaoke Section */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-display text-loft-plum-900 flex items-center">
            <Sparkles className="w-5 h-5 mr-2 text-brass-gold-500" />
            Karaoke
          </h2>
          {karaokeStatus?.status === "ready" && (
            <Badge variant="sage">Ready</Badge>
          )}
          {karaokeStatus?.status === "processing" && (
            <Badge variant="gold">
              <Loader className="w-3 h-3 mr-1 animate-spin" />
              Processing
            </Badge>
          )}
          {karaokeStatus?.status === "failed" && (
            <Badge variant="coral">Failed</Badge>
          )}
        </div>

        {!karaokeStatus || karaokeStatus.status === "failed" ? (
          <div className="text-center py-6">
            <Sparkles className="w-12 h-12 text-brass-gold-300 mx-auto mb-4" />
            <p className="text-loft-plum-600 mb-4">
              Generate instrumental track and synchronized lyrics using AI
            </p>
            <Button
              variant="primary"
              onClick={() => requestKaraokeMutation.mutate()}
              isLoading={requestKaraokeMutation.isPending}
            >
              <Sparkles className="w-4 h-4 mr-2" />
              Request Karaoke Processing
            </Button>
            {karaokeStatus?.status === "failed" && (
              <p className="text-sm text-ember-coral-500 mt-2">
                Previous attempt failed: {karaokeStatus.error_message}
              </p>
            )}
          </div>
        ) : karaokeStatus.status === "processing" ? (
          <div className="text-center py-6">
            <Loader className="w-8 h-8 text-brass-gold-500 animate-spin mx-auto mb-4" />
            <p className="text-loft-plum-600">Processing karaoke track...</p>
            <p className="text-sm text-loft-plum-400 mt-2">
              This may take 3-6 minutes
            </p>
          </div>
        ) : (
          <KaraokePlayer songId={songId} />
        )}
      </Card>

      {/* Full Practice Experience — only when there are parts */}
      {song.parts && song.parts.length > 0 && (
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-display text-loft-plum-900 flex items-center">
              <Layers className="w-5 h-5 mr-2 text-brass-gold-500" />
              Full Practice Experience
            </h2>
            <Badge variant="gold">All-in-One</Badge>
          </div>
          <p className="text-sm text-loft-plum-600 mb-4">
            Play all voice parts together with the instrumental and live lyrics.
            Adjust the mixer to focus on your part.
          </p>
          <CombinedPlayer
            parts={song.parts}
            instrumentalPath={
              karaokeTrack?.instrumental_file_path || song.audioFilePath
            }
            lyrics={karaokeTrack?.lyrics_data}
            title={`${song.title} — Full Mix`}
          />
        </Card>
      )}

      {/* Voice Parts (individual) */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-display text-loft-plum-900 flex items-center">
            <ListMusic className="w-5 h-5 mr-2 text-loft-plum-500" />
            Voice Parts
          </h2>
          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsPartFormOpen(true)}
          >
            <Plus className="w-4 h-4 mr-1" />
            Add Part
          </Button>
        </div>

        {song.parts && song.parts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {song.parts.map((part) => (
              <div key={part.id} className="bg-loft-plum-50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-display text-lg text-loft-plum-900 capitalize">
                    {part.partType}
                  </h3>
                  <Badge variant="gold">{part.partType}</Badge>
                </div>
                {part.audioFilePath && <AudioPlayer src={part.audioFilePath} />}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-6">
            <Mic2 className="w-12 h-12 text-loft-plum-300 mx-auto mb-3" />
            <p className="text-loft-plum-500 mb-4">
              No voice parts yet. Add parts for practice.
            </p>
          </div>
        )}
      </Card>

      {/* Sheet Music */}
      {song.sheetMusicPath && (
        <Card>
          <h2 className="text-xl font-display text-loft-plum-900 mb-4 flex items-center">
            <FileText className="w-5 h-5 mr-2 text-loft-plum-500" />
            Sheet Music
          </h2>
          <a
            href={song.sheetMusicPath}
            target="_blank"
            rel="noopener noreferrer"
            className="text-loft-plum-600 hover:text-loft-plum-800 underline"
          >
            View Sheet Music
          </a>
        </Card>
      )}

      <PartUploadForm
        songId={songId}
        isOpen={isPartFormOpen}
        onClose={() => setIsPartFormOpen(false)}
      />
    </motion.div>
  );
}
