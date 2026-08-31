import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BookOpen, User, FileCode, Headphones, X } from "lucide-react";
import { UserGuide } from "./UserGuide";
import { TechnicalGuide } from "./TechnicalGuide";
import { UsageGuide } from "./UsageGuide";

type GuideType = "user" | "usage" | "technical" | null;

export const GuideLauncher: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeGuide, setActiveGuide] = useState<GuideType>(null);

  const guides = [
    {
      type: "user" as GuideType,
      title: "Quick Start Guide",
      description: "Get started with HarmonyHub basics",
      icon: <User className="w-5 h-5" />,
      color: "text-choir-sage-500",
      bgColor: "bg-choir-sage-100",
    },
    {
      type: "usage" as GuideType,
      title: "How to Use",
      description: "Detailed step-by-step instructions",
      icon: <Headphones className="w-5 h-5" />,
      color: "text-brass-gold-500",
      bgColor: "bg-brass-gold-100",
    },
    {
      type: "technical" as GuideType,
      title: "Technical Guide",
      description: "Architecture, setup, and troubleshooting",
      icon: <FileCode className="w-5 h-5" />,
      color: "text-loft-plum-500",
      bgColor: "bg-loft-plum-100",
    },
  ];

  return (
    <>
      {/* Launcher Button */}
      <motion.button
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setIsMenuOpen(true)}
        className="fixed bottom-6 right-6 z-40 bg-loft-plum-900 text-brass-gold-400 rounded-full p-4 shadow-lg hover:bg-loft-plum-800 transition-colors"
        title="Help & Guides"
      >
        <BookOpen className="w-6 h-6" />
      </motion.button>

      {/* Guide Selection Menu */}
      <AnimatePresence>
        {isMenuOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMenuOpen(false)}
              className="fixed inset-0 z-40 bg-transparent"
            />

            {/* Menu */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: 20 }}
              transition={{ type: "spring", damping: 20 }}
              className="fixed bottom-20 right-6 z-50 w-80 bg-white rounded-xl shadow-2xl border border-loft-plum-100 overflow-hidden"
            >
              {/* Header */}
              <div className="p-4 bg-gradient-to-r from-loft-plum-900 to-loft-plum-700 flex items-center justify-between">
                <div>
                  <h3 className="font-display text-white">Help & Guides</h3>
                  <p className="text-xs text-loft-plum-200">
                    Choose a guide to get started
                  </p>
                </div>
                <button
                  onClick={() => setIsMenuOpen(false)}
                  className="p-1 rounded-lg hover:bg-loft-plum-600 transition-colors"
                >
                  <X className="w-5 h-5 text-loft-plum-200" />
                </button>
              </div>

              {/* Guide Options */}
              <div className="p-2">
                {guides.map((guide) => (
                  <button
                    key={guide.type}
                    onClick={() => {
                      setActiveGuide(guide.type);
                      setIsMenuOpen(false);
                    }}
                    className="w-full flex items-center space-x-3 p-3 rounded-lg hover:bg-loft-plum-50 transition-colors text-left"
                  >
                    <div
                      className={`w-10 h-10 rounded-full ${guide.bgColor} flex items-center justify-center flex-shrink-0`}
                    >
                      <span className={guide.color}>{guide.icon}</span>
                    </div>
                    <div>
                      <p className="font-medium text-loft-plum-900 text-sm">
                        {guide.title}
                      </p>
                      <p className="text-xs text-loft-plum-500">
                        {guide.description}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Guides */}
      <UserGuide
        isOpen={activeGuide === "user"}
        onClose={() => setActiveGuide(null)}
      />
      <UsageGuide
        isOpen={activeGuide === "usage"}
        onClose={() => setActiveGuide(null)}
      />
      <TechnicalGuide
        isOpen={activeGuide === "technical"}
        onClose={() => setActiveGuide(null)}
      />
    </>
  );
};
