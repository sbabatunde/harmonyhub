import { Outlet } from "react-router-dom";

export default function AuthLayout() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-loft-plum-900 via-loft-plum-800 to-loft-plum-900">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-brass-gold-400 rounded-full opacity-10 blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-choir-sage-400 rounded-full opacity-10 blur-3xl"></div>
      </div>
      <div className="relative w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-display text-brass-gold-400 mb-2">
            HarmonyHub
          </h1>
          <p className="text-loft-plum-200">
            Evening rehearsals, voices in harmony
          </p>
        </div>
        <Outlet />
      </div>
    </div>
  );
}
