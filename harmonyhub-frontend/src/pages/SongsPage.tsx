import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { songService } from "@/api/services/songService";
import { Song } from "@/types";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import { EmptyState } from "@/components/ui/EmptyState";
import { SongForm } from "@/components/songs/SongForm";
import { useAuthStore } from "@/store/authStore";
import { Music, Clock, Key, Trash2, Play, Eye } from "lucide-react";
import { logger } from "@/utils/logger";

export default function SongsPage() {
  const [page, setPage] = useState(1);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const {
    data: songs,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["songs", page],
    queryFn: () => songService.getSongs(page),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => songService.deleteSong(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["songs"] });
    },
  });

  const canManageSongs = user?.role === "teacher" || user?.role === "admin";

  const handlePractice = (songId: number) => {
    logger.info("Navigating to practice", { songId });
    navigate(`/practice?song=${songId}`);
  };

  if (isLoading) return <Spinner />;
  if (error) {
    return (
      <div className="text-ember-coral-500 text-center py-8">
        Error loading songs. Please try again.
      </div>
    );
  }

  const songList = Array.isArray(songs) ? songs : [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-display text-loft-plum-900">
            Song Library
          </h1>
          <p className="text-loft-plum-600 mt-1">
            {songList.length} songs in your church's collection
          </p>
        </div>
        {canManageSongs && (
          <Button variant="primary" onClick={() => setIsFormOpen(true)}>
            Add Song
          </Button>
        )}
      </div>

      {songList.length === 0 ? (
        <EmptyState
          icon="🎵"
          title="No songs yet"
          description="Start building your church's music library"
          actionLabel={canManageSongs ? "Add Your First Song" : undefined}
          onAction={canManageSongs ? () => setIsFormOpen(true) : undefined}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence>
            {songList.map((song: Song, index) => (
              <motion.div
                key={song.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ delay: index * 0.05, duration: 0.3 }}
              >
                <Card hoverable className="space-y-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-display text-lg text-loft-plum-900">
                        {song.title}
                      </h3>
                      {song.artist && (
                        <p className="text-sm text-loft-plum-500">
                          {song.artist}
                        </p>
                      )}
                    </div>
                    <Badge variant="plum">Level {song.difficultyLevel}</Badge>
                  </div>

                  <div className="flex items-center space-x-2 flex-wrap">
                    {song.keySignature && (
                      <Badge variant="neutral">
                        <Key className="w-3 h-3 mr-1" />
                        {song.keySignature}
                      </Badge>
                    )}
                    {song.tempo && (
                      <Badge variant="neutral">
                        <Clock className="w-3 h-3 mr-1" />
                        {song.tempo} BPM
                      </Badge>
                    )}
                    {song.isPublicDomain && (
                      <Badge variant="sage">Public Domain</Badge>
                    )}
                  </div>

                  <div className="flex justify-between items-center pt-2 border-t border-loft-plum-100">
                    <Button
                      variant="outline"
                      size="sm"
                      leftIcon={<Play className="w-4 h-4" />}
                      onClick={() => handlePractice(song.id)}
                    >
                      Practice
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      leftIcon={<Eye className="w-4 h-4" />}
                      onClick={() => navigate(`/songs/${song.id}`)}
                    >
                      Details
                    </Button>
                    {canManageSongs && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteMutation.mutate(song.id)}
                        className="text-ember-coral-600 hover:bg-ember-coral-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      <SongForm isOpen={isFormOpen} onClose={() => setIsFormOpen(false)} />
    </div>
  );
}
