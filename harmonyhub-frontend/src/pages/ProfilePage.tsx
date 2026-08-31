import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuthStore } from "@/store/authStore";
import { authService } from "@/api/services/authService";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Spinner } from "@/components/ui/Spinner";
import { VOICE_PARTS } from "@/utils/constants";
import { User, Music, Mail, Church, Mic2 } from "lucide-react";
import { logger } from "@/utils/logger";

const profileSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  voice_part: z.string().optional(),
  vocal_range_low: z.string().optional(),
  vocal_range_high: z.string().optional(),
});

type ProfileFormData = z.infer<typeof profileSchema>;

export default function ProfilePage() {
  const { user, fetchUser } = useAuthStore();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: user?.name || "",
      voice_part: user?.voice_part || "",
      vocal_range_low: user?.vocal_range_low || "",
      vocal_range_high: user?.vocal_range_high || "",
    },
  });

  useEffect(() => {
    if (user) {
      reset({
        name: user.name,
        voice_part: user.voice_part || "",
        vocal_range_low: user.vocal_range_low || "",
        vocal_range_high: user.vocal_range_high || "",
      });
    }
  }, [user, reset]);

  const onSubmit = async (data: ProfileFormData) => {
    setIsSaving(true);
    setSaveMessage(null);

    logger.info("Profile update attempt", data);

    try {
      // Just call the service - interceptor handles CSRF
      await authService.updateProfile(data);
      await fetchUser();
      setIsEditing(false);
      setSaveMessage("Profile updated successfully!");
      setTimeout(() => setSaveMessage(null), 3000);
    } catch (error: any) {
      logger.error("Profile update failed", error as Error, {
        status: error.response?.status,
        data: error.response?.data,
      });
      setSaveMessage("Failed to update profile. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  if (!user) return <Spinner />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-display text-loft-plum-900">My Profile</h1>
        <p className="text-loft-plum-600 mt-1">
          Manage your personal information
        </p>
      </div>

      {saveMessage && (
        <div
          className={`p-4 rounded-lg ${
            saveMessage.includes("success")
              ? "bg-choir-sage-100 text-choir-sage-800"
              : "bg-ember-coral-100 text-ember-coral-800"
          }`}
        >
          {saveMessage}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Summary */}
        <div className="lg:col-span-1">
          <Card className="text-center">
            <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-loft-plum-900 text-brass-gold-400 text-4xl font-display mb-4">
              {user.name?.[0]?.toUpperCase() || "U"}
            </div>
            <h2 className="text-xl font-display text-loft-plum-900">
              {user.name}
            </h2>
            <p className="text-loft-plum-500">{user.email}</p>

            <div className="mt-4 space-y-2">
              <div className="flex items-center justify-center space-x-2">
                <Badge variant="plum" className="capitalize">
                  {user.role}
                </Badge>
                {user.voice_part && user.voice_part !== "unknown" && (
                  <Badge variant="gold" className="capitalize">
                    {user.voice_part}
                  </Badge>
                )}
              </div>
              {user.church_name && (
                <p className="text-sm text-loft-plum-500 flex items-center justify-center">
                  <Church className="w-4 h-4 mr-1" />
                  {user.church_name}
                </p>
              )}
            </div>
          </Card>

          {/* Vocal Range */}
          <Card className="mt-4">
            <h3 className="font-display text-lg text-loft-plum-900 mb-3 flex items-center">
              <Mic2 className="w-5 h-5 mr-2 text-loft-plum-500" />
              Vocal Range
            </h3>
            {user.vocal_range_low && user.vocal_range_high ? (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-loft-plum-500">Lowest Note</span>
                  <span className="font-medium text-loft-plum-900">
                    {user.vocal_range_low}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-loft-plum-500">Highest Note</span>
                  <span className="font-medium text-loft-plum-900">
                    {user.vocal_range_high}
                  </span>
                </div>
              </div>
            ) : (
              <p className="text-sm text-loft-plum-500">
                Add your vocal range to track your progress
              </p>
            )}
          </Card>
        </div>

        {/* Edit Form */}
        <div className="lg:col-span-2">
          <Card>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-display text-loft-plum-900">
                Profile Information
              </h2>
              {!isEditing ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEditing(true)}
                >
                  Edit Profile
                </Button>
              ) : (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsEditing(false)}
                >
                  Cancel
                </Button>
              )}
            </div>

            {!isEditing ? (
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-sm font-medium text-loft-plum-500 mb-1 flex items-center">
                      <User className="w-4 h-4 mr-2" />
                      Full Name
                    </h3>
                    <p className="text-loft-plum-900">{user.name}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-loft-plum-500 mb-1 flex items-center">
                      <Mail className="w-4 h-4 mr-2" />
                      Email
                    </h3>
                    <p className="text-loft-plum-900">{user.email}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-sm font-medium text-loft-plum-500 mb-1 flex items-center">
                      <Music className="w-4 h-4 mr-2" />
                      Voice Part
                    </h3>
                    <p className="text-loft-plum-900 capitalize">
                      {user.voice_part || "Not specified"}
                    </p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-loft-plum-500 mb-1">
                      Vocal Range
                    </h3>
                    <p className="text-loft-plum-900">
                      {user.vocal_range_low && user.vocal_range_high
                        ? `${user.vocal_range_low} - ${user.vocal_range_high}`
                        : "Not specified"}
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <Input
                  label="Full Name"
                  error={errors.name?.message}
                  {...register("name")}
                />

                <div>
                  <label className="block text-sm font-medium text-loft-plum-700 mb-1">
                    Voice Part
                  </label>
                  <select className="input-field" {...register("voice_part")}>
                    <option value="">Select voice part</option>
                    {VOICE_PARTS.map((part) => (
                      <option key={part.value} value={part.value}>
                        {part.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="Vocal Range Low"
                    placeholder="C3"
                    error={errors.vocal_range_low?.message}
                    {...register("vocal_range_low")}
                  />
                  <Input
                    label="Vocal Range High"
                    placeholder="C5"
                    error={errors.vocal_range_high?.message}
                    {...register("vocal_range_high")}
                  />
                </div>

                <div className="flex justify-end">
                  <Button type="submit" variant="primary" isLoading={isSaving}>
                    Save Changes
                  </Button>
                </div>
              </form>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
