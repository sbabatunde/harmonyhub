import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuthStore } from "@/store/authStore";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { VOICE_PARTS } from "@/utils/constants";

const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  password_confirmation: z.string(),
  church_id: z.string().min(1, "Church ID is required"),
  voice_part: z.string().optional(),
  vocal_range_low: z.string().optional(),
  vocal_range_high: z.string().optional(),
  age_bracket: z.string().optional(),
  // ↓ Give it a default so it is ALWAYS boolean in the output type
  is_minor: z.boolean().default(false),
  // ↓ Allow empty string OR valid email
  guardian_email: z.string().email().optional().or(z.literal("")),
}).refine((data) => data.password === data.password_confirmation, {
  message: "Passwords don't match",
  path: ["password_confirmation"],
});

// ← The KEY fix: use z.input for the form data type
// z.input = what the form receives (is_minor can be undefined)
// z.output = what the resolver produces (is_minor is boolean)
type RegisterFormData = z.input<typeof registerSchema>;

export default function RegisterPage() {
  const { register: registerUser, isLoading, error } = useAuthStore();
  const navigate = useNavigate();
  const [isMinor, setIsMinor] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  });

  onSubmit = async (data: RegisterFormData) => {
    try {
      await registerUser({
        ...data,
        church_id: parseInt(data.church_id),
        is_minor: data.is_minor ?? false, // ← ensures boolean
        guardian_email: data.guardian_email || undefined,
      });
      navigate("/");
    } catch (err) {
      // Error handled in store
    }
  };


  return (
    <div className="card bg-white/95 backdrop-blur">
      <h2 className="text-2xl font-display text-loft-plum-900 mb-6">
        Join HarmonyHub
      </h2>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {error && (
          <div className="bg-ember-coral-100 text-ember-coral-800 p-3 rounded-lg">
            {error}
          </div>
        )}

        <Input
          label="Full Name"
          placeholder="John Doe"
          error={errors.name?.message}
          {...register("name")}
        />

        <Input
          label="Email"
          type="email"
          placeholder="john@example.com"
          error={errors.email?.message}
          {...register("email")}
        />

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Password"
            type="password"
            placeholder="••••••••"
            error={errors.password?.message}
            {...register("password")}
          />
          <Input
            label="Confirm Password"
            type="password"
            placeholder="••••••••"
            error={errors.password_confirmation?.message}
            {...register("password_confirmation")}
          />
        </div>

        <Input
          label="Church ID"
          placeholder="1"
          hint="Ask your church administrator for this"
          error={errors.church_id?.message}
          {...register("church_id")}
        />

        <div>
          <label className="block text-sm font-medium text-loft-plum-700 mb-1">
            Voice Part (Optional)
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

        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="is_minor"
            checked={isMinor}
            onChange={(e) => setIsMinor(e.target.checked)}
            className="rounded border-loft-plum-300 text-loft-plum-600 focus:ring-loft-plum-500"
          />
          <label htmlFor="is_minor" className="text-sm text-loft-plum-700">
            I am under 18 years old
          </label>
        </div>

        {isMinor && (
          <Input
            label="Guardian Email"
            type="email"
            placeholder="parent@example.com"
            error={errors.guardian_email?.message}
            {...register("guardian_email")}
          />
        )}

        <Button
          type="submit"
          variant="primary"
          className="w-full"
          isLoading={isLoading}
        >
          Create Account
        </Button>

        <p className="text-center text-sm text-loft-plum-600">
          Already have an account?{" "}
          <Link to="/login" className="text-loft-plum-800 hover:underline">
            Sign In
          </Link>
        </p>
      </form>
    </div>
  );
}
