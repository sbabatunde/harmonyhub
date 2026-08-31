import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  ChevronLeft,
  ChevronRight,
  Home,
  Music,
  Mic,
  Gamepad2,
  BookOpen,
  ClipboardList,
  User,
  Sparkles,
  CheckCircle,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useAuthStore } from "@/store/authStore";

interface GuideStep {
  title: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  tips: string[];
}

interface UserGuideProps {
  isOpen: boolean;
  onClose: () => void;
}

export const UserGuide: React.FC<UserGuideProps> = ({ isOpen, onClose }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const { user } = useAuthStore();

  const isTeacher = user?.role === "teacher" || user?.role === "admin";

  const steps: GuideStep[] = [
    {
      title: "Welcome to HarmonyHub!",
      description: "Your journey to becoming a better singer starts here.",
      icon: <Sparkles className="w-8 h-8" />,
      color: "text-brass-gold-500",
      tips: ["Practice regularly", "Track your progress", "Have fun learning"],
    },
    {
      title: "Your Dashboard",
      description:
        "This is your home base. See your stats, streaks, and AI Coach feedback.",
      icon: <Home className="w-8 h-8" />,
      color: "text-loft-plum-600",
      tips: [
        "Check your practice streak",
        "View AI Coach recommendations",
        "See your game performance",
      ],
    },
    {
      title: "Song Library",
      description:
        "Browse and select songs to practice. Each song has different voice parts.",
      icon: <Music className="w-8 h-8" />,
      color: "text-choir-sage-600",
      tips: [
        "Choose songs for your voice part",
        "Practice with audio and sheet music",
        "Use the loop feature for hard sections",
      ],
    },
    {
      title: "Practice Room",
      description: "Sing along with real-time pitch detection feedback.",
      icon: <Mic className="w-8 h-8" />,
      color: "text-ember-coral-500",
      tips: [
        "Watch the pitch meter as you sing",
        "Aim for green (within 10 cents)",
        "Save your practice sessions",
      ],
    },
    {
      title: "Training Games",
      description: "Learn through play with three fun games.",
      icon: <Gamepad2 className="w-8 h-8" />,
      color: "text-brass-gold-500",
      tips: [
        "Pitch Perfect: Match the target note",
        "Interval Trainer: Recognize intervals by ear",
        "Rhythm Master: Tap along to the beat",
      ],
    },
    {
      title: "Curriculum",
      description: "Follow a structured learning path to improve your skills.",
      icon: <BookOpen className="w-8 h-8" />,
      color: "text-choir-sage-600",
      tips: [
        "Complete stages in order",
        "Reach 70% accuracy to unlock next stage",
        "Track your progress",
      ],
    },
    ...(isTeacher
      ? [
          {
            title: "Teacher Dashboard",
            description: "Manage your students and track their progress.",
            icon: <ClipboardList className="w-8 h-8" />,
            color: "text-loft-plum-600",
            tips: [
              "View student statistics",
              "Create assignments",
              "Monitor practice sessions",
            ],
          } as GuideStep,
        ]
      : [
          {
            title: "Assignments",
            description: "See what your teacher has assigned for you.",
            icon: <ClipboardList className="w-8 h-8" />,
            color: "text-loft-plum-600",
            tips: [
              "Complete assignments on time",
              "Practice assigned songs",
              "Mark as complete when done",
            ],
          } as GuideStep,
        ]),
    {
      title: "Your Profile",
      description: "Update your vocal range and personal information.",
      icon: <User className="w-8 h-8" />,
      color: "text-loft-plum-600",
      tips: [
        "Set your voice part (Soprano, Alto, Tenor, Bass)",
        "Update your vocal range",
        "Keep your information current",
      ],
    },
  ];

  const handleClose = () => {
    setCurrentStep(0);
    onClose();
  };

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep((prev) => prev + 1);
    } else {
      handleClose();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) setCurrentStep((prev) => prev - 1);
  };

  if (!isOpen) return null;

  const currentGuideStep = steps[currentStep];

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-loft-plum-950 bg-opacity-50 backdrop-blur-sm"
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          transition={{ type: "spring", damping: 20 }}
          className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden"
        >
          {/* Progress Bar */}
          <div className="h-1 bg-loft-plum-100">
            <div
              className="h-full bg-brass-gold-400 transition-all duration-500"
              style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
            />
          </div>

          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-loft-plum-100">
            <h2 className="text-lg font-display text-loft-plum-900">
              Quick Start Guide
            </h2>
            <button
              onClick={handleClose}
              className="p-1 rounded-lg hover:bg-loft-plum-100 transition-colors"
            >
              <X className="w-5 h-5 text-loft-plum-500" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="text-center space-y-4"
            >
              {/* Icon */}
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", delay: 0.1 }}
                className={`inline-flex items-center justify-center w-20 h-20 rounded-full bg-loft-plum-50 ${currentGuideStep.color}`}
              >
                {currentGuideStep.icon}
              </motion.div>

              {/* Title */}
              <h3 className="text-2xl font-display text-loft-plum-900">
                {currentGuideStep.title}
              </h3>

              {/* Description */}
              <p className="text-loft-plum-600">
                {currentGuideStep.description}
              </p>

              {/* Tips */}
              <div className="space-y-2">
                {currentGuideStep.tips.map((tip, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 + index * 0.1 }}
                    className="flex items-center space-x-2 text-left bg-loft-plum-50 rounded-lg p-3"
                  >
                    <CheckCircle className="w-4 h-4 text-choir-sage-500 flex-shrink-0" />
                    <span className="text-sm text-loft-plum-700">{tip}</span>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* Step Indicators */}
            <div className="flex justify-center space-x-1">
              {steps.map((_, index) => (
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
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between p-4 border-t border-loft-plum-100">
            <Button
              variant="ghost"
              size="sm"
              onClick={handlePrevious}
              disabled={currentStep === 0}
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              Previous
            </Button>
            <span className="text-sm text-loft-plum-400">
              {currentStep + 1} of {steps.length}
            </span>
            <Button variant="primary" size="sm" onClick={handleNext}>
              {currentStep === steps.length - 1 ? "Get Started" : "Next"}
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
