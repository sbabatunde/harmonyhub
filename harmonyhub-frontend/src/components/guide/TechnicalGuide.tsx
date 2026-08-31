import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Server,
  Cpu,
  Globe,
  Clock,
  FileCode,
  Terminal,
  Bug,
  Rocket,
  Trophy,
  CheckCircle,
  AlertCircle,
  Music,
  Mic,
  FileText,
  FolderTree,
  FolderOpen,
  Workflow,
  Lightbulb,
  Star,
  Users,
  BarChart3,
  Shield,
  Zap,
  Heart,
  TrendingUp,
  Award,
  Settings,
  Wifi,
  Lock,
  Database,
  Boxes,
  Layers,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";

interface GuideSection {
  id: string;
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  color: string;
  content: React.ReactNode;
}

interface TechnicalGuideProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TechnicalGuide: React.FC<TechnicalGuideProps> = ({
  isOpen,
  onClose,
}) => {
  const [currentSection, setCurrentSection] = useState(0);

  const sections: GuideSection[] = [
    {
      id: "overview",
      title: "Project Overview",
      subtitle: "Why HarmonyHub was built",
      icon: <Sparkles className="w-8 h-8" />,
      color: "text-brass-gold-500",
      content: (
        <div className="space-y-4">
          <div className="bg-loft-plum-50 rounded-lg p-4">
            <h3 className="font-display text-lg text-loft-plum-900 mb-2">
              The Problem
            </h3>
            <ul className="space-y-2 text-sm text-loft-plum-600">
              <li className="flex items-start">
                <Clock className="w-4 h-4 mr-2 mt-0.5 text-ember-coral-500" />
                Church choirs have limited rehearsal time (1-2 hours weekly)
              </li>
              <li className="flex items-start">
                <Users className="w-4 h-4 mr-2 mt-0.5 text-ember-coral-500" />
                Varying skill levels make group practice difficult
              </li>
              <li className="flex items-start">
                <Music className="w-4 h-4 mr-2 mt-0.5 text-ember-coral-500" />
                No way to practice between rehearsals
              </li>
              <li className="flex items-start">
                <BarChart3 className="w-4 h-4 mr-2 mt-0.5 text-ember-coral-500" />
                Teachers can't track individual progress
              </li>
            </ul>
          </div>
          <div className="bg-choir-sage-50 rounded-lg p-4">
            <h3 className="font-display text-lg text-choir-sage-800 mb-2">
              The Solution
            </h3>
            <ul className="space-y-2 text-sm text-choir-sage-700">
              <li className="flex items-start">
                <CheckCircle className="w-4 h-4 mr-2 mt-0.5 text-choir-sage-500" />
                On-demand practice materials accessible 24/7
              </li>
              <li className="flex items-start">
                <CheckCircle className="w-4 h-4 mr-2 mt-0.5 text-choir-sage-500" />
                Structured curriculum with progressive difficulty
              </li>
              <li className="flex items-start">
                <CheckCircle className="w-4 h-4 mr-2 mt-0.5 text-choir-sage-500" />
                Real-time pitch detection feedback
              </li>
              <li className="flex items-start">
                <CheckCircle className="w-4 h-4 mr-2 mt-0.5 text-choir-sage-500" />
                Gamification for engagement
              </li>
              <li className="flex items-start">
                <CheckCircle className="w-4 h-4 mr-2 mt-0.5 text-choir-sage-500" />
                AI-powered feedback and karaoke
              </li>
            </ul>
          </div>
          <div className="bg-brass-gold-50 rounded-lg p-4">
            <h3 className="font-display text-lg text-brass-gold-800 mb-2">
              What Makes It Unique
            </h3>
            <ul className="space-y-2 text-sm text-brass-gold-700">
              <li className="flex items-start">
                <Star className="w-4 h-4 mr-2 mt-0.5 text-brass-gold-500" />
                Built specifically for church music (not generic)
              </li>
              <li className="flex items-start">
                <Star className="w-4 h-4 mr-2 mt-0.5 text-brass-gold-500" />
                Combines practice, games, and AI in one platform
              </li>
              <li className="flex items-start">
                <Star className="w-4 h-4 mr-2 mt-0.5 text-brass-gold-500" />
                Church-scoped (multi-tenant) design
              </li>
              <li className="flex items-start">
                <Star className="w-4 h-4 mr-2 mt-0.5 text-brass-gold-500" />
                Child-safe with guardian email requirement
              </li>
            </ul>
          </div>
        </div>
      ),
    },
    {
      id: "architecture",
      title: "System Architecture",
      subtitle: "Three-tier distributed application",
      icon: <Server className="w-8 h-8" />,
      color: "text-loft-plum-600",
      content: (
        <div className="space-y-4">
          <div className="bg-loft-plum-50 rounded-lg p-4">
            <h3 className="font-display text-lg text-loft-plum-900 mb-3">
              Layers
            </h3>
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-full bg-loft-plum-900 flex items-center justify-center">
                  <Globe className="w-5 h-5 text-brass-gold-400" />
                </div>
                <div>
                  <p className="font-medium text-loft-plum-900">
                    Frontend (React)
                  </p>
                  <p className="text-xs text-loft-plum-500">
                    Port 3000 - UI, games, pitch detection
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-full bg-loft-plum-700 flex items-center justify-center">
                  <Server className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="font-medium text-loft-plum-900">
                    Backend (Laravel)
                  </p>
                  <p className="text-xs text-loft-plum-500">
                    Port 8000 - API, database, business logic
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-full bg-loft-plum-500 flex items-center justify-center">
                  <Cpu className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="font-medium text-loft-plum-900">
                    AI Service (Python)
                  </p>
                  <p className="text-xs text-loft-plum-500">
                    Port 8001 - Demucs, Whisper, Ollama
                  </p>
                </div>
              </div>
            </div>
          </div>
          <div className="bg-loft-plum-50 rounded-lg p-4">
            <h3 className="font-display text-lg text-loft-plum-900 mb-2">
              Data Flow
            </h3>
            <ol className="space-y-2 text-sm text-loft-plum-600">
              <li>1. User interacts with React UI</li>
              <li>2. React sends API request to Laravel</li>
              <li>3. Laravel processes business logic</li>
              <li>4. Laravel queries database or calls AI service</li>
              <li>5. AI service processes audio/ML tasks</li>
              <li>6. Results returned to React for display</li>
            </ol>
          </div>
        </div>
      ),
    },
    {
      id: "tech-stack",
      title: "Technology Stack",
      subtitle: "Why each technology was chosen",
      icon: <FileCode className="w-8 h-8" />,
      color: "text-choir-sage-600",
      content: (
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-3">
            <div className="bg-loft-plum-50 rounded-lg p-4">
              <h3 className="font-medium text-loft-plum-900">
                Laravel 13 + PHP 8.3
              </h3>
              <p className="text-sm text-loft-plum-600 mt-1">
                Chosen for Eloquent ORM, Sanctum auth, Artisan CLI, and mature
                ecosystem.
              </p>
            </div>
            <div className="bg-loft-plum-50 rounded-lg p-4">
              <h3 className="font-medium text-loft-plum-900">
                React 18 + TypeScript
              </h3>
              <p className="text-sm text-loft-plum-600 mt-1">
                Chosen for Web Audio API integration, component reusability, and
                type safety.
              </p>
            </div>
            <div className="bg-loft-plum-50 rounded-lg p-4">
              <h3 className="font-medium text-loft-plum-900">Python FastAPI</h3>
              <p className="text-sm text-loft-plum-600 mt-1">
                Chosen for ML ecosystem (PyTorch, Demucs, Whisper) and async
                processing.
              </p>
            </div>
            <div className="bg-loft-plum-50 rounded-lg p-4">
              <h3 className="font-medium text-loft-plum-900">
                SQLite (dev) / MySQL (prod)
              </h3>
              <p className="text-sm text-loft-plum-600 mt-1">
                SQLite for zero-config development. MySQL for production scale.
              </p>
            </div>
            <div className="bg-loft-plum-50 rounded-lg p-4">
              <h3 className="font-medium text-loft-plum-900">
                Zustand + TanStack Query
              </h3>
              <p className="text-sm text-loft-plum-600 mt-1">
                Zustand for client state. TanStack Query for server state
                caching.
              </p>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: "setup",
      title: "Setup & Installation",
      subtitle: "How to run the application",
      icon: <Terminal className="w-8 h-8" />,
      color: "text-ember-coral-500",
      content: (
        <div className="space-y-4">
          <div className="bg-loft-plum-900 rounded-lg p-4">
            <h3 className="font-medium text-brass-gold-400 mb-2">
              Backend Setup
            </h3>
            <pre className="text-xs text-loft-plum-200 overflow-x-auto">
              {`cd harmonyhub-backend
composer install
php artisan key:generate
php artisan migrate --seed
php artisan serve`}
            </pre>
          </div>
          <div className="bg-loft-plum-900 rounded-lg p-4">
            <h3 className="font-medium text-brass-gold-400 mb-2">
              Frontend Setup
            </h3>
            <pre className="text-xs text-loft-plum-200 overflow-x-auto">
              {`cd harmonyhub-frontend
npm install
npm run dev`}
            </pre>
          </div>
          <div className="bg-loft-plum-900 rounded-lg p-4">
            <h3 className="font-medium text-brass-gold-400 mb-2">
              AI Service Setup
            </h3>
            <pre className="text-xs text-loft-plum-200 overflow-x-auto">
              {`cd harmonyhub-ai-service
python -m venv venv
.\\venv\\Scripts\\Activate.ps1
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8001`}
            </pre>
          </div>
        </div>
      ),
    },
    {
      id: "file-structure",
      title: "Complete File Architecture",
      subtitle: "All three services in detail",
      icon: <FolderTree className="w-8 h-8" />,
      color: "text-loft-plum-600",
      content: (
        <div className="space-y-4">
          <div className="bg-loft-plum-50 rounded-lg p-4">
            <h3 className="font-display text-lg text-loft-plum-900 mb-3 flex items-center">
              <FolderOpen className="w-5 h-5 mr-2 text-loft-plum-500" />
              Project Root
            </h3>
            <pre className="text-xs text-loft-plum-600 overflow-x-auto">
              {`HarmonyHub Project/
├── harmonyhub-backend/          # Laravel (Port 8000)
├── harmonyhub-frontend/         # React (Port 3000)
└── harmonyhub-ai-service/       # Python FastAPI (Port 8001)`}
            </pre>
          </div>

          <div className="bg-loft-plum-50 rounded-lg p-4">
            <h3 className="font-display text-lg text-loft-plum-900 mb-3 flex items-center">
              <Server className="w-5 h-5 mr-2 text-loft-plum-500" />
              Backend (Laravel)
            </h3>
            <pre className="text-xs text-loft-plum-600 overflow-x-auto max-h-60 overflow-y-auto">
              {`harmonyhub-backend/
├── app/
│   ├── Enums/                   # Type-safe constants
│   ├── Models/                  # Eloquent models
│   ├── Support/
│   │   ├── Services/
│   │   │   ├── FileUploadService.php
│   │   │   └── Contracts/
│   │   └── Traits/
│   │       └── ApiResponseTrait.php
│   └── Http/Middleware/
│       └── CheckRole.php
│
├── Modules/                     # 10 modules
│   ├── Auth/                    # Authentication
│   ├── Song/                    # Song library & parts
│   ├── Church/                  # Church management
│   ├── Curriculum/              # Learning stages
│   ├── Practice/                # Practice sessions
│   ├── Assignment/              # Teacher assignments
│   ├── Game/                    # Game scores
│   ├── Teacher/                 # Student management
│   ├── Karaoke/                 # Karaoke processing
│   └── AICoach/                 # AI feedback
│
├── database/
│   ├── migrations/              # Database schema
│   └── seeders/                 # Test data
├── routes/                      # API routes
├── config/                      # Configuration
├── storage/                     # File storage
└── bootstrap/                   # App bootstrap`}
            </pre>
          </div>

          <div className="bg-loft-plum-50 rounded-lg p-4">
            <h3 className="font-display text-lg text-loft-plum-900 mb-3 flex items-center">
              <Globe className="w-5 h-5 mr-2 text-loft-plum-500" />
              Frontend (React + TypeScript)
            </h3>
            <pre className="text-xs text-loft-plum-600 overflow-x-auto max-h-60 overflow-y-auto">
              {`harmonyhub-frontend/
├── src/
│   ├── api/
│   │   ├── client.ts           # Axios instance
│   │   ├── endpoints.ts        # Endpoint constants
│   │   └── services/           # API services
│   │       ├── authService.ts
│   │       ├── songService.ts
│   │       ├── practiceService.ts
│   │       ├── curriculumService.ts
│   │       ├── assignmentService.ts
│   │       ├── gameService.ts
│   │       ├── teacherService.ts
│   │       ├── karaokeService.ts
│   │       └── aiCoachService.ts
│   │
│   ├── components/
│   │   ├── ui/                  # Button, Card, Input, Modal
│   │   ├── layout/              # MainLayout, AuthLayout
│   │   ├── practice/            # AudioPlayer
│   │   ├── games/               # 3 game components
│   │   ├── songs/               # SongForm
│   │   ├── assignments/         # AssignmentForm
│   │   ├── teacher/             # StudentProgressModal
│   │   ├── karaoke/             # KaraokePlayer
│   │   ├── coach/               # AICoachFeedback
│   │   ├── guide/               # Guide components
│   │   └── ErrorBoundary.tsx
│   │
│   ├── hooks/
│   │   └── usePitchDetection.ts
│   │
│   ├── pages/                   # 12 pages
│   ├── store/                   # Zustand state
│   ├── types/                   # TypeScript types
│   ├── utils/                   # Helpers, logger
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css                # Vesper theme`}
            </pre>
          </div>

          <div className="bg-loft-plum-50 rounded-lg p-4">
            <h3 className="font-display text-lg text-loft-plum-900 mb-3 flex items-center">
              <Cpu className="w-5 h-5 mr-2 text-loft-plum-500" />
              AI Service (Python FastAPI)
            </h3>
            <pre className="text-xs text-loft-plum-600 overflow-x-auto">
              {`harmonyhub-ai-service/
├── app/
│   ├── main.py                 # FastAPI app
│   ├── config.py               # Settings
│   ├── models/
│   │   └── schemas.py          # Pydantic models
│   ├── services/
│   │   ├── audio_processor.py
│   │   ├── karaoke_service.py  # Demucs + Whisper
│   │   └── ai_coach_service.py # Ollama + fallback
│   └── routers/
│       ├── karaoke.py
│       └── coach.py
├── storage/
│   ├── uploads/
│   ├── processed/
│   └── lyrics/
├── venv/
├── .env
├── requirements.txt
└── README.md`}
            </pre>
          </div>
        </div>
      ),
    },
    {
      id: "ai-capabilities",
      title: "What AI CAN and CANNOT Do",
      subtitle: "Understanding AI limitations",
      icon: <Cpu className="w-8 h-8" />,
      color: "text-brass-gold-500",
      content: (
        <div className="space-y-4">
          <div className="bg-choir-sage-50 rounded-lg p-4">
            <h3 className="font-display text-lg text-choir-sage-800 mb-3 flex items-center">
              <CheckCircle className="w-5 h-5 mr-2 text-choir-sage-500" />
              AI CAN Do Automatically
            </h3>
            <div className="space-y-3">
              <div className="bg-white rounded-lg p-3">
                <h4 className="font-medium text-loft-plum-900">
                  1. Separate Vocals from Instrumental
                </h4>
                <p className="text-sm text-loft-plum-600 mt-1">
                  Using <strong>Demucs</strong>, the AI separates a song into
                  vocals and instrumental tracks.
                </p>
                <p className="text-xs text-choir-sage-600 mt-2">
                  ⏱ 2-5 minutes per song (CPU)
                </p>
              </div>
              <div className="bg-white rounded-lg p-3">
                <h4 className="font-medium text-loft-plum-900">
                  2. Transcribe Lyrics with Timing
                </h4>
                <p className="text-sm text-loft-plum-600 mt-1">
                  Using <strong>Whisper</strong>, the AI creates synchronized
                  lyrics with timestamps.
                </p>
                <p className="text-xs text-choir-sage-600 mt-2">
                  ⏱ 30-60 seconds per song
                </p>
              </div>
            </div>
          </div>

          <div className="bg-ember-coral-50 rounded-lg p-4">
            <h3 className="font-display text-lg text-ember-coral-700 mb-3 flex items-center">
              <AlertCircle className="w-5 h-5 mr-2 text-ember-coral-500" />
              AI CANNOT Do (Manual Upload Required)
            </h3>
            <div className="space-y-3">
              <div className="bg-white rounded-lg p-3">
                <h4 className="font-medium text-loft-plum-900">
                  Separate Individual Voice Parts
                </h4>
                <p className="text-sm text-loft-plum-600 mt-1">
                  AI cannot separate Soprano from Alto from Tenor from Bass. You
                  must upload each part separately.
                </p>
              </div>
              <div className="bg-white rounded-lg p-3">
                <h4 className="font-medium text-loft-plum-900">
                  Generate Sheet Music
                </h4>
                <p className="text-sm text-loft-plum-600 mt-1">
                  AI cannot create PDF sheet music from audio. You must upload
                  existing files.
                </p>
              </div>
              <div className="bg-white rounded-lg p-3">
                <h4 className="font-medium text-loft-plum-900">
                  Auto-detect Song Key
                </h4>
                <p className="text-sm text-loft-plum-600 mt-1">
                  AI does not detect the musical key. You enter this manually.
                </p>
              </div>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: "ai-workflow",
      title: "How AI Processing Works",
      subtitle: "Step-by-step AI karaoke flow",
      icon: <Workflow className="w-8 h-8" />,
      color: "text-loft-plum-600",
      content: (
        <div className="space-y-4">
          <div className="bg-loft-plum-50 rounded-lg p-4">
            <h3 className="font-display text-lg text-loft-plum-900 mb-3">
              Karaoke Processing Flow
            </h3>
            <div className="space-y-3">
              {[
                {
                  step: "1",
                  title: "User Uploads Song",
                  desc: "Teacher uploads full song audio to Laravel",
                  time: "Manual",
                },
                {
                  step: "2",
                  title: "Request Karaoke",
                  desc: 'User clicks "Request Karaoke Processing"',
                  time: "Manual (1 click)",
                },
                {
                  step: "3",
                  title: "Laravel Sends to AI",
                  desc: "Laravel POSTs song data to Python service",
                  time: "Automatic",
                },
                {
                  step: "4",
                  title: "AI Downloads Audio",
                  desc: "Python service downloads the audio file",
                  time: "Automatic",
                },
                {
                  step: "5",
                  title: "Demucs Separates",
                  desc: "Separates vocals from instrumental",
                  time: "2-5 min",
                },
                {
                  step: "6",
                  title: "Whisper Transcribes",
                  desc: "Creates synchronized lyrics",
                  time: "30-60 sec",
                },
                {
                  step: "7",
                  title: "Webhook to Laravel",
                  desc: "AI service sends results back",
                  time: "Automatic",
                },
                {
                  step: "8",
                  title: "Status Updates to Ready",
                  desc: "Frontend shows karaoke player",
                  time: "Automatic",
                },
              ].map((item, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-start space-x-3"
                >
                  <div className="w-8 h-8 rounded-full bg-loft-plum-900 text-brass-gold-400 flex items-center justify-center text-sm font-medium flex-shrink-0">
                    {item.step}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <p className="font-medium text-loft-plum-900">
                        {item.title}
                      </p>
                      <Badge
                        variant={item.time.includes("Manual") ? "gold" : "sage"}
                      >
                        {item.time}
                      </Badge>
                    </div>
                    <p className="text-sm text-loft-plum-600 mt-1">
                      {item.desc}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          <div className="bg-brass-gold-50 rounded-lg p-4">
            <h3 className="font-display text-lg text-brass-gold-800 mb-2">
              Total Processing Time
            </h3>
            <p className="text-sm text-brass-gold-700">
              Approximately <strong>3-6 minutes</strong> per song on CPU. First
              song may take longer (model loading ~1-2 min).
            </p>
          </div>

          <div className="bg-loft-plum-50 rounded-lg p-4">
            <h3 className="font-display text-lg text-loft-plum-900 mb-2">
              What You Upload Manually
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white rounded-lg p-3">
                <Music className="w-5 h-5 text-loft-plum-500 mb-1" />
                <p className="text-sm font-medium text-loft-plum-900">
                  Full Song Audio
                </p>
                <p className="text-xs text-loft-plum-500">
                  Required for AI karaoke
                </p>
              </div>
              <div className="bg-white rounded-lg p-3">
                <Mic className="w-5 h-5 text-loft-plum-500 mb-1" />
                <p className="text-sm font-medium text-loft-plum-900">
                  Individual Parts
                </p>
                <p className="text-xs text-loft-plum-500">
                  Soprano, Alto, Tenor, Bass
                </p>
              </div>
              <div className="bg-white rounded-lg p-3">
                <FileText className="w-5 h-5 text-loft-plum-500 mb-1" />
                <p className="text-sm font-medium text-loft-plum-900">
                  Sheet Music
                </p>
                <p className="text-xs text-loft-plum-500">PDF files</p>
              </div>
              <div className="bg-white rounded-lg p-3">
                <Music className="w-5 h-5 text-loft-plum-500 mb-1" />
                <p className="text-sm font-medium text-loft-plum-900">
                  Song Metadata
                </p>
                <p className="text-xs text-loft-plum-500">
                  Key, tempo, difficulty
                </p>
              </div>
            </div>
          </div>

          <div className="bg-choir-sage-50 rounded-lg p-4">
            <h3 className="font-display text-lg text-choir-sage-800 mb-2">
              What AI Gives You Automatically
            </h3>
            <div className="space-y-2">
              <div className="flex items-start space-x-2">
                <CheckCircle className="w-4 h-4 text-choir-sage-500 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-choir-sage-700">
                  <strong>Instrumental Track</strong> - Song without vocals (for
                  karaoke)
                </p>
              </div>
              <div className="flex items-start space-x-2">
                <CheckCircle className="w-4 h-4 text-choir-sage-500 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-choir-sage-700">
                  <strong>Vocal Track</strong> - Isolated vocals (for reference)
                </p>
              </div>
              <div className="flex items-start space-x-2">
                <CheckCircle className="w-4 h-4 text-choir-sage-500 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-choir-sage-700">
                  <strong>Synchronized Lyrics</strong> - Text with precise
                  timing
                </p>
              </div>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: "verification",
      title: "Verification Checklist",
      subtitle: "How to verify everything works",
      icon: <CheckCircle className="w-8 h-8" />,
      color: "text-choir-sage-600",
      content: (
        <div className="space-y-4">
          {[
            {
              task: "Login with admin credentials",
              expect: "Should redirect to Teacher Dashboard",
            },
            {
              task: "Login with student credentials",
              expect: "Should redirect to Student Dashboard",
            },
            {
              task: "Add a song with audio file",
              expect: "Song appears in library with file uploaded",
            },
            {
              task: "Play Pitch Perfect game",
              expect: "Pitch meter responds to microphone",
            },
            {
              task: "Submit game score",
              expect: "Score appears in leaderboard",
            },
            {
              task: "Create practice session",
              expect: "Session saved and stats update",
            },
            {
              task: "Create assignment (teacher)",
              expect: "Assignment appears for student",
            },
            {
              task: "Complete assignment (student)",
              expect: "Status changes to completed",
            },
            {
              task: "Check AI service health",
              expect: 'GET /health returns {"status": "healthy"}',
            },
            {
              task: "Request karaoke processing",
              expect: "Status changes to processing then ready",
            },
            {
              task: "View AI Coach feedback",
              expect: "Feedback appears on dashboard",
            },
          ].map((item, index) => (
            <div key={index} className="bg-loft-plum-50 rounded-lg p-3">
              <div className="flex items-start space-x-2">
                <CheckCircle className="w-4 h-4 text-choir-sage-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium text-loft-plum-900 text-sm">
                    {item.task}
                  </p>
                  <p className="text-xs text-loft-plum-500 mt-1">
                    Expected: {item.expect}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      ),
    },
    {
      id: "troubleshooting",
      title: "Troubleshooting",
      subtitle: "Common issues and solutions",
      icon: <Bug className="w-8 h-8" />,
      color: "text-ember-coral-500",
      content: (
        <div className="space-y-4">
          {[
            {
              issue: "Login redirects back to login page",
              cause: "Session cookie not set",
              fix: "Check that auth()->login() is called in AuthService",
            },
            {
              issue: "CORS error in browser console",
              cause: "Frontend URL not in CORS config",
              fix: "Update config/cors.php allowed_origins",
            },
            {
              issue: "419 CSRF token mismatch",
              cause: "XSRF cookie not sent",
              fix: "Ensure withCredentials: true in axios",
            },
            {
              issue: 'Songs page shows "map is not a function"',
              cause: "API response structure mismatch",
              fix: "Check songService.getSongs() extracts array correctly",
            },
            {
              issue: "AI service not responding",
              cause: "Service not running or port wrong",
              fix: "Verify uvicorn running on port 8001",
            },
            {
              issue: "Karaoke stuck on processing",
              cause: "AI service crashed or timeout",
              fix: "Check AI service logs, restart service",
            },
            {
              issue: "Pitch detection not working",
              cause: "Microphone permission denied",
              fix: "Allow microphone access in browser",
            },
          ].map((item, index) => (
            <div key={index} className="bg-ember-coral-50 rounded-lg p-4">
              <h3 className="font-medium text-ember-coral-700 text-sm mb-1">
                {item.issue}
              </h3>
              <p className="text-xs text-ember-coral-600 mb-1">
                Cause: {item.cause}
              </p>
              <p className="text-xs text-ember-coral-500">Fix: {item.fix}</p>
            </div>
          ))}
        </div>
      ),
    },
    {
      id: "improvements",
      title: "Future Improvements",
      subtitle: "What could be added next",
      icon: <Rocket className="w-8 h-8" />,
      color: "text-brass-gold-500",
      content: (
        <div className="space-y-4">
          {[
            {
              title: "Mobile App",
              desc: "React Native app for iOS/Android",
              impact: "High",
              effort: "High",
            },
            {
              title: "Real-time Collaboration",
              desc: "Live practice sessions with WebSockets",
              impact: "Medium",
              effort: "High",
            },
            {
              title: "AI Vocal Assessment",
              desc: "Automatic voice quality scoring",
              impact: "High",
              effort: "Medium",
            },
            {
              title: "Song Marketplace",
              desc: "Share songs between churches",
              impact: "Medium",
              effort: "Medium",
            },
            {
              title: "Offline Mode",
              desc: "PWA with offline practice",
              impact: "Medium",
              effort: "Medium",
            },
            {
              title: "Advanced Analytics",
              desc: "Detailed progress charts and reports",
              impact: "High",
              effort: "Low",
            },
            {
              title: "Multi-language Support",
              desc: "i18n for non-English churches",
              impact: "Medium",
              effort: "Medium",
            },
            {
              title: "Attendance Tracking",
              desc: "Track choir member attendance",
              impact: "Low",
              effort: "Low",
            },
          ].map((item, index) => (
            <div key={index} className="bg-loft-plum-50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-1">
                <h3 className="font-medium text-loft-plum-900">{item.title}</h3>
                <Badge variant={item.impact === "High" ? "sage" : "gold"}>
                  Impact: {item.impact}
                </Badge>
              </div>
              <p className="text-sm text-loft-plum-600">{item.desc}</p>
              <p className="text-xs text-loft-plum-400 mt-1">
                Effort: {item.effort}
              </p>
            </div>
          ))}
        </div>
      ),
    },
    {
      id: "conclusion",
      title: "Conclusion",
      subtitle: "Summary and next steps",
      icon: <Trophy className="w-8 h-8" />,
      color: "text-brass-gold-500",
      content: (
        <div className="space-y-4 text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring" }}
            className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-brass-gold-100"
          >
            <Trophy className="w-10 h-10 text-brass-gold-500" />
          </motion.div>
          <h3 className="text-2xl font-display text-loft-plum-900">
            HarmonyHub is Ready!
          </h3>
          <p className="text-loft-plum-600">
            Your church music education platform is fully functional.
          </p>
          <div className="space-y-2">
            <p className="text-sm text-loft-plum-500">
              ✓ 10 Modules | ✓ 3 Games | ✓ AI Integration | ✓ Complete
              Documentation
            </p>
            <p className="text-sm text-loft-plum-500">
              Test with your choir. Gather feedback. Improve iteratively.
            </p>
          </div>
        </div>
      ),
    },
  ];

  const handleNext = () => {
    if (currentSection < sections.length - 1) {
      setCurrentSection((prev) => prev + 1);
    } else {
      onClose();
    }
  };
  const handlePrevious = () => {
    if (currentSection > 0) setCurrentSection((prev) => prev - 1);
  };

  const current = sections[currentSection];

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-loft-plum-950 bg-opacity-70 backdrop-blur-sm p-4"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        transition={{ type: "spring", damping: 25 }}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-loft-plum-100 bg-gradient-to-r from-loft-plum-900 to-loft-plum-700">
          <div className="flex items-center space-x-2">
            <Sparkles className="w-5 h-5 text-brass-gold-400" />
            <h2 className="text-lg font-display text-white">Technical Guide</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-loft-plum-600 transition-colors"
          >
            <X className="w-5 h-5 text-loft-plum-200" />
          </button>
        </div>

        {/* Progress Bar */}
        <div className="h-1 bg-loft-plum-100">
          <motion.div
            className="h-full bg-brass-gold-400"
            animate={{
              width: `${((currentSection + 1) / sections.length) * 100}%`,
            }}
            transition={{ duration: 0.5 }}
          />
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentSection}
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              <div className="text-center space-y-2">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", delay: 0.1 }}
                  className={`inline-flex items-center justify-center w-16 h-16 rounded-full bg-loft-plum-50 ${current.color}`}
                >
                  {current.icon}
                </motion.div>
                <h3 className="text-2xl font-display text-loft-plum-900">
                  {current.title}
                </h3>
                <p className="text-loft-plum-500">{current.subtitle}</p>
              </div>
              {current.content}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-4 border-t border-loft-plum-100 bg-loft-plum-50">
          <Button
            variant="ghost"
            size="sm"
            onClick={handlePrevious}
            disabled={currentSection === 0}
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            Previous
          </Button>
          <div className="flex space-x-1">
            {sections.map((section, index) => (
              <button
                key={section.id}
                onClick={() => setCurrentSection(index)}
                className={`w-2 h-2 rounded-full transition-all ${
                  index === currentSection
                    ? "bg-brass-gold-400 w-6"
                    : "bg-loft-plum-200 hover:bg-loft-plum-300"
                }`}
              />
            ))}
          </div>
          <Button variant="primary" size="sm" onClick={handleNext}>
            {currentSection === sections.length - 1 ? "Finish" : "Next"}
            <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
      </motion.div>
    </motion.div>
  );
};
