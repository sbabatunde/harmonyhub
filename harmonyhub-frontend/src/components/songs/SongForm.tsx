import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { songService } from "@/api/services/songService";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Badge } from "@/components/ui/Badge";
import { DIFFICULTY_LEVELS } from "@/utils/constants";
import { Upload, FileAudio, FileText, X } from "lucide-react";
import { logger } from "@/utils/logger";

const songSchema = z.object({
  title: z.string().min(1, "Title is required"),
  artist: z.string().optional(),
  key_signature: z.string().optional(),
  tempo: z.string().optional(),
  difficulty_level: z.string().optional(),
  is_public_domain: z.boolean().default(false),
  licensing_info: z.string().optional(),
});

type SongFormData = z.infer<typeof songSchema>;

interface SongFormProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SongForm: React.FC<SongFormProps> = ({ isOpen, onClose }) => {
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [sheetMusic, setSheetMusic] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<SongFormData>({
    resolver: zodResolver(songSchema),
  });

  const createSongMutation = useMutation({
    mutationFn: (data: FormData) => songService.createSong(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["songs"] });
      onClose();
      reset();
      setAudioFile(null);
      setSheetMusic(null);
      setUploadProgress(0);
    },
  });

  const onSubmit = async (data: SongFormData) => {
    logger.info("Starting song upload...");

    const formData = new FormData();

    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined && value !== "" && value !== false) {
        formData.append(key, value.toString());
      }
    });

    if (audioFile) {
      formData.append("audio_file", audioFile);
    }
    if (sheetMusic) {
      formData.append("sheet_music", sheetMusic);
    }

    // Just call the service - interceptor handles CSRF
    createSongMutation.mutate(formData);
  };

  const handleFileChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    setter: (file: File | null) => void,
  ) => {
    const file = e.target.files?.[0] || null;
    setter(file);
  };

  const removeFile = (setter: (file: File | null) => void) => {
    setter(null);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add New Song" size="lg">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input
          label="Song Title"
          placeholder="Amazing Grace"
          error={errors.title?.message}
          {...register("title")}
        />

        <Input
          label="Artist (Optional)"
          placeholder="John Newton"
          error={errors.artist?.message}
          {...register("artist")}
        />

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Key (Optional)"
            placeholder="G"
            error={errors.key_signature?.message}
            {...register("key_signature")}
          />
          <Input
            label="Tempo/BPM (Optional)"
            type="number"
            placeholder="72"
            error={errors.tempo?.message}
            {...register("tempo")}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-loft-plum-700 mb-1">
            Difficulty Level
          </label>
          <select className="input-field" {...register("difficulty_level")}>
            <option value="">Select difficulty</option>
            {DIFFICULTY_LEVELS.map((level) => (
              <option key={level.value} value={level.value}>
                {level.label}
              </option>
            ))}
          </select>
        </div>

        {/* Audio File Upload */}
        <div>
          <label className="block text-sm font-medium text-loft-plum-700 mb-1">
            Audio File
          </label>
          {!audioFile ? (
            <label className="flex flex-col items-center justify-center border-2 border-dashed border-loft-plum-200 rounded-lg p-6 cursor-pointer hover:border-loft-plum-400 transition-colors">
              <Upload className="w-8 h-8 text-loft-plum-300 mb-2" />
              <span className="text-sm text-loft-plum-500">
                Click to upload audio file
              </span>
              <span className="text-xs text-loft-plum-400 mt-1">
                MP3, WAV, M4A (max 20MB)
              </span>
              <input
                type="file"
                accept=".mp3,.wav,.m4a,.ogg"
                onChange={(e) => handleFileChange(e, setAudioFile)}
                className="hidden"
              />
            </label>
          ) : (
            <div className="flex items-center justify-between bg-loft-plum-50 rounded-lg p-3">
              <div className="flex items-center space-x-2">
                <FileAudio className="w-5 h-5 text-choir-sage-500" />
                <span className="text-sm text-loft-plum-700">
                  {audioFile.name}
                </span>
                <span className="text-xs text-loft-plum-400">
                  ({(audioFile.size / 1024 / 1024).toFixed(2)} MB)
                </span>
              </div>
              <button
                type="button"
                onClick={() => removeFile(setAudioFile)}
                className="p-1 hover:bg-loft-plum-100 rounded"
              >
                <X className="w-4 h-4 text-loft-plum-400" />
              </button>
            </div>
          )}
        </div>

        {/* Sheet Music Upload */}
        <div>
          <label className="block text-sm font-medium text-loft-plum-700 mb-1">
            Sheet Music (PDF)
          </label>
          {!sheetMusic ? (
            <label className="flex flex-col items-center justify-center border-2 border-dashed border-loft-plum-200 rounded-lg p-6 cursor-pointer hover:border-loft-plum-400 transition-colors">
              <Upload className="w-8 h-8 text-loft-plum-300 mb-2" />
              <span className="text-sm text-loft-plum-500">
                Click to upload sheet music
              </span>
              <span className="text-xs text-loft-plum-400 mt-1">
                PDF (max 10MB)
              </span>
              <input
                type="file"
                accept=".pdf"
                onChange={(e) => handleFileChange(e, setSheetMusic)}
                className="hidden"
              />
            </label>
          ) : (
            <div className="flex items-center justify-between bg-loft-plum-50 rounded-lg p-3">
              <div className="flex items-center space-x-2">
                <FileText className="w-5 h-5 text-brass-gold-500" />
                <span className="text-sm text-loft-plum-700">
                  {sheetMusic.name}
                </span>
                <span className="text-xs text-loft-plum-400">
                  ({(sheetMusic.size / 1024 / 1024).toFixed(2)} MB)
                </span>
              </div>
              <button
                type="button"
                onClick={() => removeFile(setSheetMusic)}
                className="p-1 hover:bg-loft-plum-100 rounded"
              >
                <X className="w-4 h-4 text-loft-plum-400" />
              </button>
            </div>
          )}
        </div>

        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="is_public_domain"
            className="rounded border-loft-plum-300 text-loft-plum-600 focus:ring-loft-plum-500"
            {...register("is_public_domain")}
          />
          <label
            htmlFor="is_public_domain"
            className="text-sm text-loft-plum-700"
          >
            This song is in the public domain
          </label>
        </div>

        <Input
          label="Licensing Info (Optional)"
          placeholder="CCLI #1234567"
          error={errors.licensing_info?.message}
          {...register("licensing_info")}
        />

        {createSongMutation.isError && (
          <div className="bg-ember-coral-100 text-ember-coral-800 p-3 rounded-lg">
            Failed to upload song. Please try again.
          </div>
        )}

        <div className="flex justify-end space-x-3">
          <Button variant="outline" onClick={onClose} type="button">
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            isLoading={createSongMutation.isPending}
          >
            {createSongMutation.isPending ? "Uploading..." : "Add Song"}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
