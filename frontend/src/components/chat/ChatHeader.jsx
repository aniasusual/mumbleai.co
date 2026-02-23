import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Menu, Globe, Mic, Keyboard } from "lucide-react";

export const ChatHeader = ({ currentConv, curriculum, languages, inputMode, onSetInputMode, onOpenSidebar }) => {
  const navigate = useNavigate();
  const allLangs = [...(languages.popular || []), ...(languages.others || [])];
  const getLangName = (code) => allLangs.find(l => l.code === code)?.name || "English";

  return (
    <div className="glass-header px-4 py-3 flex items-center gap-3 z-20">
      <button className="lg:hidden p-1" onClick={onOpenSidebar} data-testid="open-sidebar-btn">
        <Menu className="w-5 h-5 text-gray-600" />
      </button>
      <button onClick={() => navigate("/")} className="p-1 hover:bg-gray-100 rounded-lg transition-colors duration-150" data-testid="back-home-btn">
        <ArrowLeft className="w-4 h-4 text-gray-500" />
      </button>

      <div className="flex-1 min-w-0">
        <h2 className="text-sm font-semibold text-[#1A1A1A] truncate" style={{ fontFamily: 'Sora, sans-serif' }}>
          {currentConv?.title || "New Conversation"}
        </h2>
        <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
          {currentConv?.target_language && currentConv.native_language !== currentConv.target_language && (
            <Badge variant="outline" className="text-[10px] border-[#2F5233]/20 text-[#2F5233] flex items-center gap-1">
              <Globe className="w-2.5 h-2.5" />
              {getLangName(currentConv.native_language)} {" -> "} {getLangName(currentConv.target_language)}
            </Badge>
          )}
          {currentConv?.scenario && (
            <Badge variant="outline" className="text-[10px] border-amber-200 text-amber-600">
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
          {currentConv?.phase === "planning" && (
            <Badge className="text-[10px] border-0 bg-purple-100 text-purple-700" data-testid="phase-planning-badge">
              planning curriculum
            </Badge>
          )}
          {curriculum?.lessons && (
            <Badge variant="outline" className="text-[10px] border-[#2F5233]/20 text-[#2F5233]" data-testid="curriculum-progress-badge">
              Lesson {(curriculum.current_lesson || 0) + 1}/{curriculum.lessons.length}
              {curriculum.lessons[curriculum.current_lesson]?.title && `: ${curriculum.lessons[curriculum.current_lesson].title}`}
            </Badge>
          )}
        </div>
      </div>

      {/* Input mode toggle */}
      <div className="flex items-center bg-gray-100 rounded-full p-0.5" data-testid="input-mode-toggle">
        <button
          onClick={() => onSetInputMode("voice")}
          className={`p-2 rounded-full transition-colors duration-150 ${inputMode === "voice" ? "bg-[#2F5233] text-white" : "text-gray-500 hover:text-gray-700"}`}
          data-testid="mode-voice-btn" title="Voice mode"
        >
          <Mic className="w-4 h-4" />
        </button>
        <button
          onClick={() => onSetInputMode("text")}
          className={`p-2 rounded-full transition-colors duration-150 ${inputMode === "text" ? "bg-[#2F5233] text-white" : "text-gray-500 hover:text-gray-700"}`}
          data-testid="mode-text-btn" title="Text mode"
        >
          <Keyboard className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
