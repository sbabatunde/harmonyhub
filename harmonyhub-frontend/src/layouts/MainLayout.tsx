import { Outlet, NavLink, useNavigate, useLocation } from "react-router-dom";
import { useAuthStore } from "@/store/authStore";
import { useState, useEffect } from "react";
import {
  Home,
  Music,
  Mic,
  BookOpen,
  Gamepad2,
  ClipboardList,
  LogOut,
  Menu,
  X,
  User,

} from "lucide-react";
import { cn } from "@/utils/helpers";
import { GuideLauncher } from "@/components/guide/GuideLauncher";

export default function MainLayout() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const navItems = [
    { to: "/", label: "Dashboard", icon: Home },
    { to: "/songs", label: "Songs", icon: Music },
    { to: "/practice", label: "Practice", icon: Mic },
    { to: "/curriculum", label: "Curriculum", icon: BookOpen },
    { to: "/games", label: "Games", icon: Gamepad2 },
    { to: "/assignments", label: "Assignments", icon: ClipboardList },
    { to: "/profile", label: "Profile", icon: User },
  ];

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-loft-plum-50">
      <GuideLauncher />
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex lg:flex-col lg:fixed lg:inset-y-0 lg:w-64 bg-loft-plum-900">
        <div className="flex items-center justify-center h-16 border-b border-loft-plum-800">
          <h1 className="text-2xl font-display text-brass-gold-400">
            HarmonyHub
          </h1>
        </div>
        <nav className="flex-1 px-4 py-6 space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  cn(
                    "flex items-center px-4 py-3 rounded-lg text-sm font-medium transition-colors",
                    isActive
                      ? "bg-loft-plum-800 text-brass-gold-400"
                      : "text-loft-plum-300 hover:bg-loft-plum-800 hover:text-white",
                  )
                }
              >
                <Icon className="w-5 h-5 mr-3" />
                {item.label}
              </NavLink>
            );
          })}
        </nav>
        <div className="p-4 border-t border-loft-plum-800">
          <div className="flex items-center space-x-3 mb-3">
            <div className="w-10 h-10 rounded-full bg-brass-gold-400 flex items-center justify-center">
              <span className="text-loft-plum-900 font-medium">
                {user?.name?.[0]?.toUpperCase() || "U"}
              </span>
            </div>
            <div>
              <p className="text-sm font-medium text-white">{user?.name}</p>
              <p className="text-xs text-loft-plum-400 capitalize">
                {user?.role}
              </p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center w-full px-4 py-2 rounded-lg text-sm text-loft-plum-300 hover:bg-ember-coral-600 hover:text-white transition-colors"
          >
            <LogOut className="w-5 h-5 mr-3" />
            Logout
          </button>
        </div>
      </aside>

      {/* Mobile Header */}
      <div className="lg:hidden bg-loft-plum-900 text-white">
        <div className="flex items-center justify-between px-4 py-3">
          <h1 className="text-xl font-display text-brass-gold-400">
            HarmonyHub
          </h1>
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-2 rounded-lg hover:bg-loft-plum-800"
          >
            {isMobileMenuOpen ? (
              <X className="w-6 h-6" />
            ) : (
              <Menu className="w-6 h-6" />
            )}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <nav className="px-4 pb-4 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    cn(
                      "flex items-center px-4 py-3 rounded-lg text-sm font-medium transition-colors",
                      isActive
                        ? "bg-loft-plum-800 text-brass-gold-400"
                        : "text-loft-plum-300 hover:bg-loft-plum-800 hover:text-white",
                    )
                  }
                >
                  <Icon className="w-5 h-5 mr-3" />
                  {item.label}
                </NavLink>
              );
            })}
            <button
              onClick={handleLogout}
              className="flex items-center w-full px-4 py-3 rounded-lg text-sm text-ember-coral-400 hover:bg-ember-coral-600 hover:text-white transition-colors"
            >
              <LogOut className="w-5 h-5 mr-3" />
              Logout
            </button>
          </nav>
        )}
      </div>

      {/* Main Content */}
      <div className="lg:pl-64">
        <main className="max-w-7xl mx-auto px-4 py-8 lg:px-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
