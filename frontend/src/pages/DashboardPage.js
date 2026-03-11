import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  MessageCircle, BookOpen, ArrowLeft, TrendingUp, Flame,
  Target, Wrench, Calendar, ArrowRight
} from "lucide-react";
import { getProgress } from "@/lib/api";
import { WaveformLogo } from "@/components/WaveformLogo";

/** Floating mesh blobs */
function MeshGradient() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <motion.div className="absolute w-[500px] h-[500px] rounded-full"
        style={{ top: "-8%", right: "-5%", background: "radial-gradient(circle, rgba(99,102,241,0.15) 0%, transparent 65%)" }}
        animate={{ x: [0, 30, 0], y: [0, 20, 0] }}
        transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }} />
      <motion.div className="absolute w-[400px] h-[400px] rounded-full"
        style={{ bottom: "5%", left: "-3%", background: "radial-gradient(circle, rgba(16,185,129,0.1) 0%, transparent 65%)" }}
        animate={{ x: [0, -20, 0], y: [0, -25, 0] }}
        transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }} />
    </div>
  );
}

/** Floating script chars */
const CHARS = ["あ", "ñ", "한", "ç", "你", "θ"];

function FloatingChars() {
  const items = useMemo(() => CHARS.map((c, i) => ({
    char: c, x: 8 + (i * 14) % 80, y: 5 + ((i * 18) % 85),
    size: 16 + (i % 3) * 6, dur: 10 + (i % 4) * 4,
  })), []);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {items.map((item, i) => (
        <motion.span key={i} className="absolute font-bold select-none"
          style={{ left: `${item.x}%`, top: `${item.y}%`, fontSize: item.size, color: "rgba(99,102,241,0.05)" }}
          animate={{ y: [-8, 8, -8], x: [-4, 4, -4] }}
          transition={{ duration: item.dur, repeat: Infinity, ease: "easeInOut", delay: i * 0.5 }}
        >{item.char}</motion.span>
      ))}
    </div>
  );
}

export default function DashboardPage() {
  const navigate = useNavigate();
  const [progress, setProgress] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadProgress(); }, []);

  const loadProgress = async () => {
    try {
      const res = await getProgress();
      setProgress(res.data);
    } catch (e) { console.error("Failed to load progress", e); }
    finally { setLoading(false); }
  };

  const stats = progress ? [
    { label: "Conversations", value: progress.total_conversations, icon: MessageCircle, bg: "#d1fae5", iconColor: "#059669", textColor: "#065f46" },
    { label: "Messages Sent", value: progress.total_messages, icon: TrendingUp, bg: "#bfdbfe", iconColor: "#2563eb", textColor: "#1e40af" },
    { label: "Day Streak", value: progress.streak_days, icon: Flame, bg: "#fecdd3", iconColor: "#e11d48", textColor: "#9f1239" },
    { label: "Words Saved", value: progress.vocabulary_count, icon: BookOpen, bg: "#e9d5ff", iconColor: "#7c3aed", textColor: "#5b21b6" },
  ] : [];

  const toolNames = {
    grammar_check: "Grammar Check", vocabulary_lookup: "Vocabulary Lookup",
    pronunciation_guide: "Pronunciation", start_scenario: "Scenarios", evaluate_response: "Evaluation"
  };

  return (
    <div className="min-h-screen relative overflow-x-hidden" style={{ background: "#f8f7f4" }} data-testid="dashboard-page">
      <MeshGradient />
      <FloatingChars />

      {/* Header */}
      <nav className="sticky top-0 z-50" style={{ background: "rgba(248,247,244,0.88)", backdropFilter: "blur(16px)", borderBottom: "1px solid rgba(0,0,0,0.06)", paddingTop: "env(safe-area-inset-top, 0px)" }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <button onClick={() => navigate("/chat")} className="p-1.5 hover:bg-indigo-50 rounded-lg transition-colors" data-testid="back-home-btn">
                <ArrowLeft className="w-5 h-5 text-slate-400" />
              </button>
              <div className="flex items-center gap-2">
                <WaveformLogo size={28} className="text-indigo-600" />
                <span className="font-semibold text-slate-800" style={{ fontFamily: 'Sora, sans-serif' }}>Dashboard</span>
              </div>
            </div>
            <div className="flex items-center gap-2 sm:gap-3">
              <Button variant="outline" onClick={() => navigate("/vocabulary")}
                className="rounded-full border-slate-200 text-slate-600 hover:border-indigo-300 hover:text-indigo-600 text-sm transition-all px-2.5 sm:px-4" data-testid="nav-vocabulary-btn">
                <BookOpen className="w-4 h-4 sm:mr-1.5" /> <span className="hidden sm:inline">Vocabulary</span>
              </Button>
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Button onClick={() => navigate("/chat")}
                  className="text-white rounded-full text-sm shadow-[0_2px_12px_rgba(99,102,241,0.3)] hover:shadow-[0_4px_20px_rgba(99,102,241,0.4)] transition-shadow px-2.5 sm:px-4"
                  style={{ background: "linear-gradient(135deg, #4338ca, #6366f1)" }}
                  data-testid="nav-practice-btn">
                  <MessageCircle className="w-4 h-4 sm:mr-1.5" /> <span className="hidden sm:inline">Practice</span>
                </Button>
              </motion.div>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12 relative z-10">
        <motion.div className="mb-10" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <h1 className="text-3xl md:text-4xl tracking-tight text-slate-900 font-bold mb-2" style={{ fontFamily: 'Sora, sans-serif' }}>Your Progress</h1>
          <p className="text-base text-slate-500">Track your language learning journey</p>
        </motion.div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : progress ? (
          <>
            {/* Stats — each card has its own vibrant bg color matching landing page sections */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-10" data-testid="stats-grid">
              {stats.map((stat, idx) => (
                <motion.div key={stat.label}
                  className="rounded-2xl p-6 relative overflow-hidden"
                  style={{ background: stat.bg }}
                  initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.08, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                  whileHover={{ y: -3, boxShadow: "0 8px 30px rgba(0,0,0,0.08)" }}
                  data-testid={`stat-${stat.label.toLowerCase().replace(/\s/g, '-')}`}
                >
                  <motion.div className="w-10 h-10 rounded-xl bg-white/60 flex items-center justify-center mb-4 backdrop-blur-sm"
                    whileHover={{ scale: 1.1, rotate: 5 }} transition={{ type: "spring", stiffness: 300 }}>
                    <stat.icon className="w-5 h-5" style={{ color: stat.iconColor }} />
                  </motion.div>
                  <p className="text-3xl font-bold" style={{ fontFamily: 'Sora, sans-serif', color: stat.textColor }}>{stat.value}</p>
                  <p className="text-sm mt-1" style={{ color: stat.iconColor, opacity: 0.7 }}>{stat.label}</p>
                </motion.div>
              ))}
            </div>

            {/* Tools & Scenarios — blue and violet backgrounds */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
              <motion.div className="rounded-2xl p-6 relative overflow-hidden" style={{ background: "#bfdbfe" }}
                initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
                data-testid="tools-usage-card">
                <div className="flex items-center gap-2 mb-6">
                  <Wrench className="w-5 h-5 text-blue-600" />
                  <h3 className="text-lg font-semibold text-blue-900" style={{ fontFamily: 'Sora, sans-serif' }}>Tools Used</h3>
                </div>
                {Object.keys(progress.tools_usage).length > 0 ? (
                  <div className="space-y-4">
                    {Object.entries(progress.tools_usage).map(([tool, count]) => {
                      const maxCount = Math.max(...Object.values(progress.tools_usage));
                      const pct = Math.round((count / maxCount) * 100);
                      return (
                        <div key={tool}>
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="text-sm text-blue-800/70">{toolNames[tool] || tool}</span>
                            <span className="text-sm font-semibold text-blue-900">{count}</span>
                          </div>
                          <Progress value={pct} className="h-2 bg-white/50 [&>div]:bg-blue-600" />
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-sm text-blue-600/60 py-4">Start chatting to see your tool usage stats</p>
                )}
              </motion.div>

              <motion.div className="rounded-2xl p-6 relative overflow-hidden" style={{ background: "#e9d5ff" }}
                initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }}
                data-testid="scenarios-practiced-card">
                <div className="flex items-center gap-2 mb-6">
                  <Target className="w-5 h-5 text-violet-600" />
                  <h3 className="text-lg font-semibold text-violet-900" style={{ fontFamily: 'Sora, sans-serif' }}>Scenarios Practiced</h3>
                </div>
                {progress.scenarios_practiced.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {progress.scenarios_practiced.map((s) => (
                      <Badge key={s} className="bg-white/60 text-violet-700 border-0 px-3 py-1.5 text-sm backdrop-blur-sm">
                        {s.replace("_", " ")}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <div className="py-4">
                    <p className="text-sm text-violet-600/60 mb-3">No scenarios practiced yet</p>
                    <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                      <Button variant="outline" onClick={() => navigate("/chat")}
                        className="rounded-full text-sm border-violet-300 text-violet-700 bg-white/50 hover:bg-white/70 transition-all" data-testid="start-scenario-btn">
                        Start a scenario <ArrowRight className="w-3 h-3 ml-1" />
                      </Button>
                    </motion.div>
                  </div>
                )}
              </motion.div>
            </div>

            {/* Recent Activity — amber/orange background */}
            <motion.div className="rounded-2xl p-6 relative overflow-hidden" style={{ background: "#fed7aa" }}
              initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.55 }}
              data-testid="recent-activity-card">
              <div className="flex items-center gap-2 mb-6">
                <Calendar className="w-5 h-5 text-amber-700" />
                <h3 className="text-lg font-semibold text-amber-900" style={{ fontFamily: 'Sora, sans-serif' }}>Recent Activity</h3>
              </div>
              {progress.recent_activity.length > 0 ? (
                <div className="space-y-3">
                  {progress.recent_activity.map((activity, idx) => (
                    <motion.div key={idx}
                      className="flex items-center gap-3 p-3 bg-white/50 rounded-xl backdrop-blur-sm"
                      initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.6 + idx * 0.05 }}
                      data-testid={`activity-item-${idx}`}
                    >
                      <div className="w-2 h-2 rounded-full bg-amber-500" />
                      <p className="text-sm text-amber-900/70 truncate flex-1">{activity.content}</p>
                      <span className="text-xs text-amber-600/60 flex-shrink-0">{new Date(activity.created_at).toLocaleDateString()}</span>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-amber-600/60 py-4">Your recent messages will appear here</p>
              )}
            </motion.div>
          </>
        ) : (
          <div className="text-center py-20"><p className="text-slate-400">Failed to load progress data</p></div>
        )}
      </div>
    </div>
  );
}
