import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  MessageCircle,
  BookOpen,
  BarChart3,
  ArrowLeft,
  TrendingUp,
  Flame,
  Target,
  Wrench,
  Calendar,
  ArrowRight
} from "lucide-react";
import { getProgress } from "@/lib/api";

export default function DashboardPage() {
  const navigate = useNavigate();
  const [progress, setProgress] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProgress();
  }, []);

  const loadProgress = async () => {
    try {
      const res = await getProgress();
      setProgress(res.data);
    } catch (e) {
      console.error("Failed to load progress", e);
    } finally {
      setLoading(false);
    }
  };

  const stats = progress ? [
    {
      label: "Conversations",
      value: progress.total_conversations,
      icon: MessageCircle,
      color: "bg-[#2F5233]/10 text-[#2F5233]",
      span: "col-span-1"
    },
    {
      label: "Messages Sent",
      value: progress.total_messages,
      icon: TrendingUp,
      color: "bg-amber-50 text-amber-600",
      span: "col-span-1"
    },
    {
      label: "Day Streak",
      value: progress.streak_days,
      icon: Flame,
      color: "bg-red-50 text-red-500",
      span: "col-span-1"
    },
    {
      label: "Words Saved",
      value: progress.vocabulary_count,
      icon: BookOpen,
      color: "bg-blue-50 text-blue-500",
      span: "col-span-1"
    },
  ] : [];

  const toolNames = {
    grammar_check: "Grammar Check",
    vocabulary_lookup: "Vocabulary Lookup",
    pronunciation_guide: "Pronunciation",
    start_scenario: "Scenarios",
    evaluate_response: "Evaluation"
  };

  return (
    <div className="min-h-screen bg-[#F0F4F8] noise-bg" data-testid="dashboard-page">
      {/* Header */}
      <nav className="glass-header sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <button onClick={() => navigate("/")} className="p-1 hover:bg-gray-100 rounded-lg transition-colors duration-150" data-testid="back-home-btn">
                <ArrowLeft className="w-5 h-5 text-gray-500" />
              </button>
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-[#2F5233] flex items-center justify-center">
                  <span className="text-white text-xs font-bold" style={{ fontFamily: 'Sora, sans-serif' }}>M</span>
                </div>
                <span className="font-semibold" style={{ fontFamily: 'Sora, sans-serif' }}>Dashboard</span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                onClick={() => navigate("/vocabulary")}
                className="rounded-full border-gray-200 text-gray-700 text-sm"
                data-testid="nav-vocabulary-btn"
              >
                <BookOpen className="w-4 h-4 mr-1.5" /> Vocabulary
              </Button>
              <Button
                onClick={() => navigate("/chat")}
                className="bg-[#2F5233] hover:bg-[#1E3524] text-white rounded-full text-sm shadow-md transition-transform duration-200 hover:-translate-y-0.5"
                data-testid="nav-practice-btn"
              >
                <MessageCircle className="w-4 h-4 mr-1.5" /> Practice
              </Button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        {/* Title */}
        <div className="mb-10">
          <h1 className="text-3xl md:text-4xl tracking-tight text-[#1A1A1A] mb-2" style={{ fontFamily: 'Sora, sans-serif' }}>
            Your Progress
          </h1>
          <p className="text-base text-[#71717A]">Track your English learning journey</p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-[#2F5233] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : progress ? (
          <>
            {/* Stats Bento Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10" data-testid="stats-grid">
              {stats.map((stat, idx) => (
                <div
                  key={stat.label}
                  className={`bg-white border border-gray-100 rounded-xl p-6 animate-slide-up ${stat.span}`}
                  style={{ animationDelay: `${idx * 0.08}s` }}
                  data-testid={`stat-${stat.label.toLowerCase().replace(/\s/g, '-')}`}
                >
                  <div className={`w-10 h-10 rounded-xl ${stat.color} flex items-center justify-center mb-4`}>
                    <stat.icon className="w-5 h-5" />
                  </div>
                  <p className="text-3xl font-bold text-[#1A1A1A]" style={{ fontFamily: 'Sora, sans-serif' }}>
                    {stat.value}
                  </p>
                  <p className="text-sm text-[#71717A] mt-1">{stat.label}</p>
                </div>
              ))}
            </div>

            {/* Tools Usage & Scenarios */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
              {/* Tools Usage */}
              <div className="bg-white border border-gray-100 rounded-xl p-6" data-testid="tools-usage-card">
                <div className="flex items-center gap-2 mb-6">
                  <Wrench className="w-5 h-5 text-[#2F5233]" />
                  <h3 className="text-lg font-semibold text-[#1A1A1A]" style={{ fontFamily: 'Sora, sans-serif' }}>
                    Tools Used
                  </h3>
                </div>
                {Object.keys(progress.tools_usage).length > 0 ? (
                  <div className="space-y-4">
                    {Object.entries(progress.tools_usage).map(([tool, count]) => {
                      const maxCount = Math.max(...Object.values(progress.tools_usage));
                      const pct = Math.round((count / maxCount) * 100);
                      return (
                        <div key={tool}>
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="text-sm text-[#4A4A4A]">{toolNames[tool] || tool}</span>
                            <span className="text-sm font-semibold text-[#1A1A1A]">{count}</span>
                          </div>
                          <Progress value={pct} className="h-2 bg-gray-100 [&>div]:bg-[#2F5233]" />
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-sm text-[#71717A] py-4">Start chatting to see your tool usage stats</p>
                )}
              </div>

              {/* Scenarios Practiced */}
              <div className="bg-white border border-gray-100 rounded-xl p-6" data-testid="scenarios-practiced-card">
                <div className="flex items-center gap-2 mb-6">
                  <Target className="w-5 h-5 text-[#2F5233]" />
                  <h3 className="text-lg font-semibold text-[#1A1A1A]" style={{ fontFamily: 'Sora, sans-serif' }}>
                    Scenarios Practiced
                  </h3>
                </div>
                {progress.scenarios_practiced.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {progress.scenarios_practiced.map((s) => (
                      <Badge
                        key={s}
                        className="bg-[#2F5233]/10 text-[#2F5233] border-0 px-3 py-1.5 text-sm"
                      >
                        {s.replace("_", " ")}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <div className="py-4">
                    <p className="text-sm text-[#71717A] mb-3">No scenarios practiced yet</p>
                    <Button
                      variant="outline"
                      onClick={() => navigate("/chat")}
                      className="rounded-full text-sm border-gray-200"
                      data-testid="start-scenario-btn"
                    >
                      Start a scenario <ArrowRight className="w-3 h-3 ml-1" />
                    </Button>
                  </div>
                )}
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-white border border-gray-100 rounded-xl p-6" data-testid="recent-activity-card">
              <div className="flex items-center gap-2 mb-6">
                <Calendar className="w-5 h-5 text-[#2F5233]" />
                <h3 className="text-lg font-semibold text-[#1A1A1A]" style={{ fontFamily: 'Sora, sans-serif' }}>
                  Recent Activity
                </h3>
              </div>
              {progress.recent_activity.length > 0 ? (
                <div className="space-y-3">
                  {progress.recent_activity.map((activity, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg"
                      data-testid={`activity-item-${idx}`}
                    >
                      <div className="w-2 h-2 rounded-full bg-[#2F5233]" />
                      <p className="text-sm text-[#4A4A4A] truncate flex-1">{activity.content}</p>
                      <span className="text-xs text-[#71717A] flex-shrink-0">
                        {new Date(activity.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-[#71717A] py-4">Your recent messages will appear here</p>
              )}
            </div>
          </>
        ) : (
          <div className="text-center py-20">
            <p className="text-[#71717A]">Failed to load progress data</p>
          </div>
        )}
      </div>
    </div>
  );
}
