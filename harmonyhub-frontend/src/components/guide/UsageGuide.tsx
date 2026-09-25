import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  ChevronLeft,
  ChevronRight,
  Upload,

  Mic,
  Play,
  ListMusic,
  Users,
  Sparkles,
  CheckCircle,
  AlertCircle,
  Lightbulb,
  Headphones,
  Keyboard,
  Sliders,
} from "lucide-react";
import { Button } from "@/components/ui/Button";

interface UsageStep {
  title: string;
  icon: React.ReactNode;
  color: string;
  description: string;
  steps: string[];
  tips?: string[];
  warning?: string;
}

interface UsageGuideProps {
  isOpen: boolean;
  onClose: () => void;
}

export const UsageGuide: React.FC<UsageGuideProps> = ({ isOpen, onClose }) => {
  const [currentStep, setCurrentStep] = useState(0);

  const usageSteps: UsageStep[] = [
    {
      title: "Uploading a New Song",
      icon: <Upload className="w-8 h-8" />,
      color: "text-loft-plum-600",
      description: "How to add a new song to the library",
      steps: [
        "Go to Songs page from the sidebar",
        'Click "Add Song" button (Teacher/Admin only)',
        "Enter song title (required)",
        "Enter artist name (optional)",
        'Set musical key (e.g., "G", "C", "D")',
        "Set tempo/BPM (e.g., 72, 90, 120)",
        "Select difficulty level (1-5)",
        "Upload audio file (MP3, WAV, M4A)",
        "Upload sheet music PDF (optional)",
        'Check "Public Domain" if applicable',
        'Click "Add Song" to save',
      ],
      tips: [
        "Use high-quality audio files for best pitch detection results",
        "For copyright songs, add CCLI license number",
        "Start with a few songs and add more gradually",
      ],
    },
    {
      title: "Adding Song Parts (Soprano, Alto, etc.)",
      icon: <ListMusic className="w-8 h-8" />,
      color: "text-choir-sage-600",
      description: "How to create individual vocal parts for a song",
      steps: [
        "Navigate to the specific song",
        'Click on "Parts" section',
        'Click "Add Part" button',
        "Select part type (Soprano, Alto, Tenor, Bass, Lead, Harmony)",
        "Upload the audio file for that specific part",
        "Upload sheet music for that part (optional)",
        "Upload MIDI file (optional)",
        "Repeat for each voice part",
      ],
      tips: [
        "Record each part separately for best practice experience",
        "Use the same key for all parts of a song",
        'Label parts clearly (e.g., "Alto - Verse 1")',
      ],
      warning: "You can only have ONE of each part type per song",
    },
    {
      title: "Practicing a Song",
      icon: <Mic className="w-8 h-8" />,
      color: "text-ember-coral-500",
      description: "How to use the practice room effectively",
      steps: [
        "Go to Practice page",
        "Select a song from the left panel",
        "Choose your voice part (if available)",
        'Click "Start Practice" to begin',
        "Sing into your microphone",
        "Watch the pitch meter for real-time feedback",
        "Aim for green (within 10 cents of target)",
        "Use the audio player to loop difficult sections",
        "Adjust playback speed (0.5x - 1.5x) if needed",
        'Click "Stop & Save" when done',
      ],
      tips: [
        "Warm up your voice before practicing",
        "Practice in short sessions (15-20 minutes)",
        "Use the loop feature for hard passages",
        "Slow down to 0.75x for challenging sections",
      ],
    },
    {
      title: "Using Audio Player Controls",
      icon: <Sliders className="w-8 h-8" />,
      color: "text-loft-plum-600",
      description: "Master the audio player features",
      steps: [
        "Play/Pause: Click the main button or press Space",
        "Skip forward: Click Skip Forward button (10 seconds)",
        "Skip backward: Click Skip Back button (10 seconds)",
        'Loop section: Click "A" to set start, "B" to set end',
        "Clear loop: Click loop button again",
        "Change speed: Select 0.5x, 0.75x, 1x, 1.25x, or 1.5x",
        "Adjust volume: Use the volume slider",
        "Mute: Click the volume icon",
      ],
      tips: [
        "Use 0.5x speed for learning difficult vocal runs",
        "Loop a 5-10 second section to master it",
        "Use skip buttons to jump between sections",
      ],
    },
    {
      title: "Getting Karaoke Tracks",
      icon: <Sparkles className="w-8 h-8" />,
      color: "text-brass-gold-500",
      description: "How AI karaoke processing works",
      steps: [
        "Ensure the song has an audio file uploaded",
        "Go to the song detail page",
        "Look for the Karaoke section",
        'Click "Request Karaoke Processing"',
        "Wait for processing (2-5 minutes)",
        'Status will show "Processing"',
        'When done, status shows "Ready"',
        "You will see:",
        "  - Instrumental track (no vocals)",
        "  - Synchronized lyrics",
        "  - Vocal track (isolated vocals)",
      ],
      tips: [
        "Karaoke processing requires the AI service running",
        "First song may take longer (model loading)",
        "Processing happens in the background",
        "You can practice while waiting",
      ],
      warning: "AI service must be running on port 8001",
    },
    {
      title: "Playing Games",
      icon: <Play className="w-8 h-8" />,
      color: "text-brass-gold-500",
      description: "How to use the training games",
      steps: [
        "Go to Games page",
        "Choose a game:",
        "  - Pitch Perfect: Match target notes",
        "  - Interval Trainer: Identify intervals",
        "  - Rhythm Master: Tap to the beat",
        'Click "Start Game"',
        "Follow the on-screen instructions",
        "Check your score and streak",
        "Submit score automatically when done",
      ],
      tips: [
        "Play Pitch Perfect daily for pitch improvement",
        "Use headphones for best audio experience",
        "Start with easy levels, then progress",
      ],
    },
    {
      title: "Tracking Progress",
      icon: <CheckCircle className="w-8 h-8" />,
      color: "text-choir-sage-600",
      description: "How to monitor improvement",
      steps: [
        "View your Dashboard for overview stats",
        "Check practice streak (daily consistency)",
        "View average accuracy percentage",
        "Check curriculum progress",
        "View game performance",
        "See AI Coach feedback",
        "Review top practiced songs",
      ],
      tips: [
        "Aim for at least 3 practice sessions per week",
        "Try to maintain a daily streak",
        "Review AI Coach feedback regularly",
        "Focus on areas suggested by AI Coach",
      ],
    },
    {
      title: "Teacher: Managing Students",
      icon: <Users className="w-8 h-8" />,
      color: "text-loft-plum-600",
      description: "For teachers and administrators",
      steps: [
        "Go to Teacher Dashboard (auto-redirects for teachers)",
        "View student list with stats",
        "Search for specific students",
        'Click "Details" to view student info',
        'Click "View Progress" for detailed analytics',
        "Create assignments:",
        "  - Select student",
        "  - Select song",
        "  - Set due date",
        '  - Click "Create Assignment"',
        "Monitor assignment completion",
      ],
      tips: [
        "Assign songs based on student skill level",
        "Check student streaks to identify disengaged students",
        "Use progress data for personalized coaching",
      ],
    },
    {
      title: "Keyboard Shortcuts",
      icon: <Keyboard className="w-8 h-8" />,
      color: "text-loft-plum-600",
      description: "Quick reference for power users",
      steps: [
        "Space (in Rhythm Master): Tap",
        "Space (audio player): Play/Pause",
        "Escape: Close modals",
        "Click progress bar: Jump to position",
        "Drag progress bar: Seek through audio",
      ],
      tips: [
        "Use keyboard for faster game play",
        "Learn shortcuts for efficient practice",
      ],
    },
  ];

  const current = usageSteps[currentStep];

  const handleClose = () => {
    setCurrentStep(0);
    onClose();
  };

  const handleNext = () => {
    if (currentStep < usageSteps.length - 1) {
      setCurrentStep((prev) => prev + 1);
    } else {
      handleClose();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) setCurrentStep((prev) => prev - 1);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
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
              <Headphones className="w-5 h-5 text-brass-gold-400" />
              <h2 className="text-lg font-display text-white">
                How to Use HarmonyHub
              </h2>
            </div>
            <button
              onClick={handleClose}
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
                width: `${((currentStep + 1) / usageSteps.length) * 100}%`,
              }}
              transition={{ duration: 0.5 }}
            />
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentStep}
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -30 }}
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                {/* Section Header */}
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
                  <p className="text-loft-plum-500">{current.description}</p>
                </div>

                {/* Steps */}
                <div className="space-y-3">
                  {current.steps.map((step, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.1 + index * 0.05 }}
                      className="flex items-start space-x-3 bg-loft-plum-50 rounded-lg p-3"
                    >
                      <span className="w-6 h-6 rounded-full bg-loft-plum-900 text-brass-gold-400 flex items-center justify-center text-xs font-medium flex-shrink-0">
                        {index + 1}
                      </span>
                      <span className="text-sm text-loft-plum-700">{step}</span>
                    </motion.div>
                  ))}
                </div>

                {/* Tips */}
                {current.tips && (
                  <div className="bg-choir-sage-50 rounded-lg p-4">
                    <h4 className="font-medium text-choir-sage-800 mb-2 flex items-center">
                      <Lightbulb className="w-4 h-4 mr-1" />
                      Tips
                    </h4>
                    <ul className="space-y-1">
                      {current.tips.map((tip, index) => (
                        <li
                          key={index}
                          className="text-sm text-choir-sage-700 flex items-start"
                        >
                          <CheckCircle className="w-4 h-4 mr-2 mt-0.5 text-choir-sage-500 flex-shrink-0" />
                          {tip}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Warning */}
                {current.warning && (
                  <div className="bg-ember-coral-50 rounded-lg p-4">
                    <h4 className="font-medium text-ember-coral-700 flex items-center">
                      <AlertCircle className="w-4 h-4 mr-1" />
                      Important Note
                    </h4>
                    <p className="text-sm text-ember-coral-600 mt-1">
                      {current.warning}
                    </p>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between p-4 border-t border-loft-plum-100 bg-loft-plum-50">
            <Button
              variant="ghost"
              size="sm"
              onClick={handlePrevious}
              disabled={currentStep === 0}
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              Previous
            </Button>

            <div className="flex space-x-1">
              {usageSteps.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentStep(index)}
                  className={`w-2 h-2 rounded-full transition-all ${
                    index === currentStep
                      ? "bg-brass-gold-400 w-6"
                      : "bg-loft-plum-200 hover:bg-loft-plum-300"
                  }`}
                />
              ))}
            </div>

            <Button variant="primary" size="sm" onClick={handleNext}>
              {currentStep === usageSteps.length - 1 ? "Finish" : "Next"}
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
