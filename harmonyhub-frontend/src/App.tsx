import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useAuthStore } from "@/store/authStore";
import { lazy, Suspense, useEffect, useState } from "react";

// Layouts
import MainLayout from "@/layouts/MainLayout";
import AuthLayout from "@/layouts/AuthLayout";
import { ErrorBoundary } from "@/components/ErrorBoundary";

// Pages — lazy-loaded
const LoginPage         = lazy(() => import("@/pages/LoginPage"));
const RegisterPage      = lazy(() => import("@/pages/RegisterPage"));
const DashboardPage     = lazy(() => import("@/pages/DashboardPage"));
const SongsPage         = lazy(() => import("@/pages/SongsPage"));
const SongDetailPage    = lazy(() => import("@/pages/SongDetailPage"));
const PracticePage      = lazy(() => import("@/pages/PracticePage"));
const CurriculumPage    = lazy(() => import("@/pages/CurriculumPage"));
const GamesPage         = lazy(() => import("@/pages/GamesPage"));
const AssignmentsPage   = lazy(() => import("@/pages/AssignmentsPage"));
const ChatPage          = lazy(() => import("@/pages/ChatPage"));
const TeacherDashboard  = lazy(() => import("@/pages/TeacherDashboard"));
const ProfilePage       = lazy(() => import("@/pages/ProfilePage"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000,
    },
  },
});

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user } = useAuthStore();
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function PageFallback() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-loft-plum-600" />
    </div>
  );
}

function App() {
  const { user } = useAuthStore();
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    const init = async () => {
      await useAuthStore.getState().fetchUser();
      setIsInitialized(true);
    };
    init();
  }, []);

  if (!isInitialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-loft-plum-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-loft-plum-600 mx-auto"></div>
          <p className="mt-4 text-loft-plum-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <Router>
          <Suspense fallback={<PageFallback />}>
            <Routes>
              <Route element={<AuthLayout />}>
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
              </Route>

              <Route
                element={
                  <ProtectedRoute>
                    <MainLayout />
                  </ProtectedRoute>
                }
              >
                <Route
                  path="/"
                  element={
                    user?.role === "teacher" || user?.role === "admin" ? (
                      <TeacherDashboard />
                    ) : (
                      <DashboardPage />
                    )
                  }
                />
                <Route path="/songs" element={<SongsPage />} />
                <Route path="/songs/:id" element={<SongDetailPage />} />
                <Route path="/practice" element={<PracticePage />} />
                <Route path="/curriculum" element={<CurriculumPage />} />
                <Route path="/games" element={<GamesPage />} />
                <Route path="/assignments" element={<AssignmentsPage />} />
                <Route path="/chat" element={<ChatPage />} />
                <Route path="/profile" element={<ProfilePage />} />
              </Route>
            </Routes>
          </Suspense>
        </Router>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;