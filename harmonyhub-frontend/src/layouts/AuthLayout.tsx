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
          <img
            src="/logo.png"
            alt="HarmonyHub"
            className="h-20 w-20 mx-auto mb-2"
          />
          <p className="text-loft-plum-200">
            Evening rehearsals, voices in harmony
          </p>
        </div>
        <Outlet />
      </div>
    </div>
  );
}
