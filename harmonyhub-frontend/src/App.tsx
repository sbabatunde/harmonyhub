import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useAuthStore } from "@/store/authStore";
// import { logger } from "@/utils/logger";
import { useEffect, useState } from "react";

// Layouts
import MainLayout from "@/layouts/MainLayout";
import AuthLayout from "@/layouts/AuthLayout";

// Pages
import LoginPage from "@/pages/LoginPage";
import RegisterPage from "@/pages/RegisterPage";
import DashboardPage from "@/pages/DashboardPage";
import SongsPage from "@/pages/SongsPage";
import SongDetailPage from "@/pages/SongDetailPage";
import PracticePage from "@/pages/PracticePage";
import CurriculumPage from "@/pages/CurriculumPage";
import GamesPage from "@/pages/GamesPage";
import AssignmentsPage from "@/pages/AssignmentsPage";
import TeacherDashboard from "@/pages/TeacherDashboard";
import ProfilePage from "@/pages/ProfilePage";
import { ErrorBoundary } from "@/components/ErrorBoundary";

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

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

function App() {
  const { user, fetchUser } = useAuthStore();
  const [isInitialized, setIsInitialized] = useState(false);

  // useEffect(() => {
  //   const init = async () => {
  //     logger.info("App initializing...");
  //     // fetchUser will set user if session exists, null if not
  //     await fetchUser();
  //     setIsInitialized(true);
  //   };

  //   init();
  // }, []);

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
              <Route path="/profile" element={<ProfilePage />} />
            </Route>
          </Routes>
        </Router>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
