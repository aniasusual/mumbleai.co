import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Menu, Globe, Mic, Keyboard } from "lucide-react";

export const ChatHeader = ({ currentConv, curriculum, languages, inputMode, onSetInputMode, onOpenSidebar }) => {
  const navigate = useNavigate();
  const allLangs = [...(languages.popular || []), ...(languages.others || [])];
  const getLangName = (code) => allLangs.find(l => l.code === code)?.name || "English";

  return (
    <div
      className="px-4 py-3 flex items-center gap-3 z-20"
      style={{
        background: "rgba(15, 23, 42, 0.8)",
        backdropFilter: "blur(16px)",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
      }}
      data-testid="chat-header"
    >
      <button className="lg:hidden p-1.5 rounded-lg hover:bg-white/5 transition-colors" onClick={onOpenSidebar} data-testid="open-sidebar-btn">
        <Menu className="w-5 h-5 text-slate-400" />
      </button>
      <button onClick={() => navigate("/")} className="p-1.5 hover:bg-white/5 rounded-lg transition-colors duration-200" data-testid="back-home-btn">
        <ArrowLeft className="w-4 h-4 text-slate-400" />
      </button>

      <div className="flex-1 min-w-0">
        <h2 className="text-sm font-semibold text-white truncate" style={{ fontFamily: 'Sora, sans-serif' }}>
          {currentConv?.title || "New Conversation"}
        </h2>
        <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
          {currentConv?.target_language && currentConv.native_language !== currentConv.target_language && (
            <Badge variant="outline" className="text-[10px] border-indigo-500/30 text-indigo-300 bg-indigo-500/10 flex items-center gap-1">
              <Globe className="w-2.5 h-2.5" />
              {getLangName(currentConv.native_language)} {" -> "} {getLangName(currentConv.target_language)}
            </Badge>
          )}
          {currentConv?.scenario && (
            <Badge variant="outline" className="text-[10px] border-amber-500/30 text-amber-300 bg-amber-500/10">
              {currentConv.scenario.replace("_", " ")}
            </Badge>
          )}
          {currentConv?.proficiency_level && (
            <Badge className={`text-[10px] border-0 ${
              currentConv.proficiency_level === "beginner" ? "bg-sky-500/15 text-sky-300" :
              currentConv.proficiency_level === "intermediate" ? "bg-amber-500/15 text-amber-300" :
              "bg-emerald-500/15 text-emerald-300"
            }`} data-testid="proficiency-badge">
              {currentConv.proficiency_level}
            </Badge>
          )}
          {currentConv?.phase === "planning" && (
            <Badge className="text-[10px] border-0 bg-purple-500/15 text-purple-300" data-testid="phase-planning-badge">
              planning curriculum
            </Badge>
          )}
          {curriculum?.lessons && (
            <Badge variant="outline" className="text-[10px] border-indigo-500/30 text-indigo-300 bg-indigo-500/10" data-testid="curriculum-progress-badge">
              Lesson {(curriculum.current_lesson || 0) + 1}/{curriculum.lessons.length}
              {curriculum.lessons[curriculum.current_lesson]?.title && `: ${curriculum.lessons[curriculum.current_lesson].title}`}
            </Badge>
          )}
        </div>
      </div>

      {/* Input mode toggle */}
      <div className="flex items-center bg-white/5 rounded-full p-0.5 border border-white/8" data-testid="input-mode-toggle">
        <motion.button
          onClick={() => onSetInputMode("voice")}
          className={`p-2 rounded-full transition-all duration-200 ${inputMode === "voice" ? "text-white" : "text-slate-500 hover:text-slate-300"}`}
          style={inputMode === "voice" ? { background: "linear-gradient(135deg, #4338ca, #6366f1)" } : {}}
          whileTap={{ scale: 0.92 }}
          data-testid="mode-voice-btn" title="Voice mode"
        >
          <Mic className="w-4 h-4" />
        </motion.button>
        <motion.button
          onClick={() => onSetInputMode("text")}
          className={`p-2 rounded-full transition-all duration-200 ${inputMode === "text" ? "text-white" : "text-slate-500 hover:text-slate-300"}`}
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
