import { motion, AnimatePresence } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Menu, Globe, Mic, Keyboard, FlaskConical, RefreshCw, Sparkles } from "lucide-react";

const PhaseBadge = ({ phase }) => {
  if (phase === "planning") {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.8 }}
        data-testid="phase-planning-badge"
      >
        <Badge className="text-[10px] border-0 gap-1 font-semibold bg-gradient-to-r from-violet-500 to-purple-500 text-white shadow-sm shadow-violet-200">
          <Sparkles className="w-2.5 h-2.5" />
          planning curriculum
        </Badge>
      </motion.div>
    );
  }
  if (phase === "testing") {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.8 }}
        data-testid="phase-testing-badge"
      >
        <Badge className="text-[10px] border-0 gap-1 font-semibold bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-sm shadow-amber-200 animate-pulse">
          <FlaskConical className="w-2.5 h-2.5" />
          quiz in progress
        </Badge>
      </motion.div>
    );
  }
  if (phase === "revision") {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.8 }}
        data-testid="phase-revision-badge"
      >
        <Badge className="text-[10px] border-0 gap-1 font-semibold bg-gradient-to-r from-teal-500 to-emerald-500 text-white shadow-sm shadow-teal-200 animate-pulse">
          <RefreshCw className="w-2.5 h-2.5" />
          revision session
        </Badge>
      </motion.div>
    );
  }
  return null;
};

export const ChatHeader = ({ currentConv, curriculum, languages, inputMode, onSetInputMode, onOpenSidebar, sidebarVisible }) => {
  const allLangs = [...(languages.popular || []), ...(languages.others || [])];
  const getLangName = (code) => allLangs.find(l => l.code === code)?.name || "English";

  return (
    <div
      className="px-4 py-3 flex items-center gap-3 z-20"
      style={{
        background: "rgba(248,247,244,0.88)",
        backdropFilter: "blur(16px)",
        borderBottom: "1px solid rgba(0,0,0,0.06)",
        paddingTop: "calc(0.75rem + env(safe-area-inset-top, 0px))",
      }}
      data-testid="chat-header"
    >
      {!sidebarVisible && (
        <button className="p-1.5 rounded-lg hover:bg-indigo-50 transition-colors" onClick={onOpenSidebar} data-testid="open-sidebar-btn">
          <Menu className="w-5 h-5 text-slate-500" />
        </button>
      )}

      <div className="flex-1 min-w-0">
        <h2 className="text-sm font-semibold text-slate-800 truncate" style={{ fontFamily: 'Sora, sans-serif' }}>
          {currentConv?.title || "New Conversation"}
        </h2>
        <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
          {currentConv?.target_language && currentConv.native_language !== currentConv.target_language && (
            <Badge variant="outline" className="text-[10px] border-indigo-200 text-indigo-600 bg-indigo-50 flex items-center gap-1">
              <Globe className="w-2.5 h-2.5" />
              {getLangName(currentConv.native_language)} {" -> "} {getLangName(currentConv.target_language)}
            </Badge>
          )}
          {currentConv?.scenario && (
            <Badge variant="outline" className="text-[10px] border-amber-200 text-amber-600 bg-amber-50">
              {currentConv.scenario.replace("_", " ")}
            </Badge>
          )}
          {currentConv?.proficiency_level && (
            <Badge className={`text-[10px] border-0 ${
              currentConv.proficiency_level === "beginner" ? "bg-blue-100 text-blue-700" :
              currentConv.proficiency_level === "intermediate" ? "bg-amber-100 text-amber-700" :
              "bg-emerald-100 text-emerald-700"
            }`} data-testid="proficiency-badge">
              {currentConv.proficiency_level}
            </Badge>
          )}
          <AnimatePresence mode="wait">
            <PhaseBadge phase={currentConv?.phase} />
          </AnimatePresence>
          {curriculum?.lessons && (
            <Badge variant="outline" className="text-[10px] border-indigo-200 text-indigo-600 bg-indigo-50" data-testid="curriculum-progress-badge">
              Lesson {(curriculum.current_lesson || 0) + 1}/{curriculum.lessons.length}
              {curriculum.lessons[curriculum.current_lesson]?.title && `: ${curriculum.lessons[curriculum.current_lesson].title}`}
            </Badge>
          )}
        </div>
      </div>

      {/* Input mode toggle */}
      <div className="flex items-center bg-white rounded-full p-0.5 shadow-sm border border-slate-100" data-testid="input-mode-toggle">
        <motion.button
          onClick={() => onSetInputMode("voice")}
          className={`p-2 rounded-full transition-all duration-200 ${inputMode === "voice" ? "text-white shadow-md" : "text-slate-400 hover:text-indigo-500"}`}
          style={inputMode === "voice" ? { background: "linear-gradient(135deg, #4338ca, #6366f1)" } : {}}
          whileTap={{ scale: 0.92 }}
          data-testid="mode-voice-btn" title="Voice mode"
        >
          <Mic className="w-4 h-4" />
        </motion.button>
        <motion.button
          onClick={() => onSetInputMode("text")}
          className={`p-2 rounded-full transition-all duration-200 ${inputMode === "text" ? "text-white shadow-md" : "text-slate-400 hover:text-indigo-500"}`}
          style={inputMode === "text" ? { background: "linear-gradient(135deg, #4338ca, #6366f1)" } : {}}
          whileTap={{ scale: 0.92 }}
          data-testid="mode-text-btn" title="Text mode"
        >
          <Keyboard className="w-4 h-4" />
        </motion.button>
      </div>
    </div>
  );
};
