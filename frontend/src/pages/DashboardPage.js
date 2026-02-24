import { useState, useEffect } from "react";
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
    { label: "Conversations", value: progress.total_conversations, icon: MessageCircle, color: "from-indigo-500/20 to-indigo-500/5 text-indigo-400", border: "border-indigo-500/20" },
    { label: "Messages Sent", value: progress.total_messages, icon: TrendingUp, color: "from-amber-500/20 to-amber-500/5 text-amber-400", border: "border-amber-500/20" },
    { label: "Day Streak", value: progress.streak_days, icon: Flame, color: "from-rose-500/20 to-rose-500/5 text-rose-400", border: "border-rose-500/20" },
    { label: "Words Saved", value: progress.vocabulary_count, icon: BookOpen, color: "from-sky-500/20 to-sky-500/5 text-sky-400", border: "border-sky-500/20" },
  ] : [];

  const toolNames = {
    grammar_check: "Grammar Check", vocabulary_lookup: "Vocabulary Lookup",
    pronunciation_guide: "Pronunciation", start_scenario: "Scenarios", evaluate_response: "Evaluation"
  };

  return (
    <div className="min-h-screen" style={{ background: "#0f172a" }} data-testid="dashboard-page">
      <nav className="sticky top-0 z-50" style={{ background: "rgba(15,23,42,0.85)", backdropFilter: "blur(16px)", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <button onClick={() => navigate("/chat")} className="p-1.5 hover:bg-white/5 rounded-lg transition-colors" data-testid="back-home-btn">
                <ArrowLeft className="w-5 h-5 text-slate-400" />
              </button>
              <div className="flex items-center gap-2">
                <WaveformLogo size={28} className="text-indigo-400" />
                <span className="font-medium text-white" style={{ fontFamily: 'Sora, sans-serif' }}>Dashboard</span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="outline" onClick={() => navigate("/vocabulary")}
                className="rounded-full border-white/10 bg-white/5 text-slate-300 hover:bg-white/10 text-sm" data-testid="nav-vocabulary-btn">
                <BookOpen className="w-4 h-4 mr-1.5" /> Vocabulary
              </Button>
              <Button onClick={() => navigate("/chat")}
                className="text-white rounded-full text-sm"
                style={{ background: "linear-gradient(135deg, #4338ca, #6366f1)", boxShadow: "0 0 16px rgba(99,102,241,0.3)" }}
                data-testid="nav-practice-btn">
                <MessageCircle className="w-4 h-4 mr-1.5" /> Practice
              </Button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        <motion.div className="mb-10" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
          <h1 className="text-3xl md:text-4xl tracking-tight text-white font-bold mb-2" style={{ fontFamily: 'Sora, sans-serif' }}>Your Progress</h1>
          <p className="text-base text-slate-400">Track your language learning journey</p>
        </motion.div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : progress ? (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10" data-testid="stats-grid">
              {stats.map((stat, idx) => (
                <motion.div key={stat.label}
                  className={`rounded-xl p-6 border ${stat.border}`}
                  style={{ background: "rgba(255,255,255,0.03)" }}
                  initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.08, duration: 0.4 }}
                  data-testid={`stat-${stat.label.toLowerCase().replace(/\s/g, '-')}`}
                >
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center mb-4`}>
                    <stat.icon className="w-5 h-5" />
                  </div>
                  <p className="text-3xl font-bold text-white" style={{ fontFamily: 'Sora, sans-serif' }}>{stat.value}</p>
                  <p className="text-sm text-slate-400 mt-1">{stat.label}</p>
                </motion.div>
              ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
              <motion.div className="rounded-xl p-6 border border-white/8" style={{ background: "rgba(255,255,255,0.03)" }}
                initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
                data-testid="tools-usage-card">
                <div className="flex items-center gap-2 mb-6">
                  <Wrench className="w-5 h-5 text-indigo-400" />
                  <h3 className="text-lg font-semibold text-white" style={{ fontFamily: 'Sora, sans-serif' }}>Tools Used</h3>
                </div>
                {Object.keys(progress.tools_usage).length > 0 ? (
                  <div className="space-y-4">
                    {Object.entries(progress.tools_usage).map(([tool, count]) => {
                      const maxCount = Math.max(...Object.values(progress.tools_usage));
                      const pct = Math.round((count / maxCount) * 100);
                      return (
                        <div key={tool}>
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="text-sm text-slate-300">{toolNames[tool] || tool}</span>
                            <span className="text-sm font-semibold text-white">{count}</span>
                          </div>
                          <Progress value={pct} className="h-2 bg-white/5 [&>div]:bg-indigo-500" />
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-sm text-slate-500 py-4">Start chatting to see your tool usage stats</p>
                )}
              </motion.div>

              <motion.div className="rounded-xl p-6 border border-white/8" style={{ background: "rgba(255,255,255,0.03)" }}
                initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
                data-testid="scenarios-practiced-card">
                <div className="flex items-center gap-2 mb-6">
                  <Target className="w-5 h-5 text-indigo-400" />
                  <h3 className="text-lg font-semibold text-white" style={{ fontFamily: 'Sora, sans-serif' }}>Scenarios Practiced</h3>
                </div>
                {progress.scenarios_practiced.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {progress.scenarios_practiced.map((s) => (
                      <Badge key={s} className="bg-indigo-500/15 text-indigo-300 border border-indigo-500/20 px-3 py-1.5 text-sm">
                        {s.replace("_", " ")}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <div className="py-4">
                    <p className="text-sm text-slate-500 mb-3">No scenarios practiced yet</p>
                    <Button variant="outline" onClick={() => navigate("/chat")}
                      className="rounded-full text-sm border-white/10 text-slate-300 hover:bg-white/5" data-testid="start-scenario-btn">
                      Start a scenario <ArrowRight className="w-3 h-3 ml-1" />
                    </Button>
                  </div>
                )}
              </motion.div>
            </div>

            <motion.div className="rounded-xl p-6 border border-white/8" style={{ background: "rgba(255,255,255,0.03)" }}
              initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
              data-testid="recent-activity-card">
              <div className="flex items-center gap-2 mb-6">
                <Calendar className="w-5 h-5 text-indigo-400" />
                <h3 className="text-lg font-semibold text-white" style={{ fontFamily: 'Sora, sans-serif' }}>Recent Activity</h3>
              </div>
              {progress.recent_activity.length > 0 ? (
                <div className="space-y-3">
                  {progress.recent_activity.map((activity, idx) => (
                    <div key={idx} className="flex items-center gap-3 p-3 bg-white/3 rounded-lg border border-white/5" data-testid={`activity-item-${idx}`}>
                      <div className="w-2 h-2 rounded-full bg-indigo-400" />
                      <p className="text-sm text-slate-300 truncate flex-1">{activity.content}</p>
                      <span className="text-xs text-slate-500 flex-shrink-0">{new Date(activity.created_at).toLocaleDateString()}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-slate-500 py-4">Your recent messages will appear here</p>
              )}
            </motion.div>
          </>
        ) : (
          <div className="text-center py-20"><p className="text-slate-500">Failed to load progress data</p></div>
        )}
      </div>
    </div>
  );
}
