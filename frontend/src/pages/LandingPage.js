import { useNavigate } from "react-router-dom";
import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { Button } from "@/components/ui/button";
import { WaveformLogo } from "@/components/WaveformLogo";
import {
  Mic, BookOpen, BarChart3, ArrowRight, Sparkles, Brain,
  Languages, AudioLines, Target, GraduationCap,
  Briefcase, Plane, UtensilsCrossed, MessageSquare,
  ChevronRight, Zap, Eye
} from "lucide-react";

/* ─── animation helpers ─── */
const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i = 0) => ({ opacity: 1, y: 0, transition: { delay: i * 0.1, duration: 0.6, ease: [0.22, 1, 0.36, 1] } }),
};

const fadeIn = {
  hidden: { opacity: 0 },
  visible: (i = 0) => ({ opacity: 1, transition: { delay: i * 0.12, duration: 0.7 } }),
};

const scaleIn = {
  hidden: { opacity: 0, scale: 0.92 },
  visible: (i = 0) => ({ opacity: 1, scale: 1, transition: { delay: i * 0.1, duration: 0.5, ease: [0.22, 1, 0.36, 1] } }),
};

function Section({ children, className = "", id }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  return (
    <motion.section
      ref={ref}
      id={id}
      initial="hidden"
      animate={inView ? "visible" : "hidden"}
      className={className}
    >
      {children}
    </motion.section>
  );
}

/* ─── data ─── */
const FEATURES = [
  {
    icon: Mic,
    title: "Voice-First",
    desc: "Speak naturally. mumble listens, understands, and responds with voice. Like a real conversation.",
    span: "md:col-span-2",
  },
  {
    icon: Languages,
    title: "50+ Languages",
    desc: "From Spanish to Japanese, learn any language with a tutor that speaks them all.",
    span: "",
  },
  {
    icon: AudioLines,
    title: "Karaoke Tracking",
    desc: "Watch words highlight in real-time as the AI speaks. Follow along and connect sound to text.",
    span: "",
  },
  {
    icon: Brain,
    title: "Smart Subagents",
    desc: "Grammar, vocabulary, pronunciation, and evaluation — specialized AI tools working behind the scenes.",
    span: "md:col-span-2",
  },
];

const STEPS = [
  { num: "01", title: "Pick your language", desc: "Choose from 50+ languages. Set your native tongue and target." },
  { num: "02", title: "Start talking", desc: "mumble assesses your level through natural conversation." },
  { num: "03", title: "Get your plan", desc: "A personalized curriculum is built around your goals and timeline." },
  { num: "04", title: "Practice daily", desc: "Real scenarios, grammar drills, vocabulary — all adapting to you." },
];

const SCENARIOS = [
  { icon: Briefcase, title: "Job Interview", desc: "Nail your next interview with confident, practiced answers." },
  { icon: Plane, title: "Travel", desc: "Navigate airports, hotels, and directions in any language." },
  { icon: UtensilsCrossed, title: "Restaurant", desc: "Order like a local. Allergies, specials, and small talk." },
  { icon: MessageSquare, title: "Small Talk", desc: "Master the art of casual conversation with anyone." },
];

const TOOLS = [
  { icon: Target, label: "Grammar Check", desc: "Instant corrections with clear explanations" },
  { icon: BookOpen, label: "Vocabulary", desc: "Learn words in context with examples" },
  { icon: AudioLines, label: "Pronunciation", desc: "IPA guides and phonetic breakdowns" },
  { icon: Eye, label: "Evaluation", desc: "Detailed assessment of your responses" },
];

/* ─── components ─── */
function GlowOrb({ className }) {
  return <div className={`absolute rounded-full blur-[120px] opacity-20 pointer-events-none ${className}`} />;
}

function FloatingGrid() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <div className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `linear-gradient(rgba(74,222,128,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(74,222,128,0.3) 1px, transparent 1px)`,
          backgroundSize: '60px 60px',
        }}
      />
    </div>
  );
}

/* ─── page ─── */
export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#060A06] text-gray-100 overflow-x-hidden" style={{ fontFamily: 'DM Sans, sans-serif' }}>
      {/* ── NAV ── */}
      <nav className="fixed top-0 w-full z-50 backdrop-blur-xl bg-[#060A06]/70 border-b border-white/[0.04]" data-testid="navbar">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 flex items-center justify-between h-16">
          <button onClick={() => navigate("/")} className="flex items-center gap-2 group" data-testid="logo-button">
            <WaveformLogo size={32} className="text-emerald-400 group-hover:text-emerald-300 transition-colors duration-300" />
            <span className="text-base font-medium text-white tracking-tight" style={{ fontFamily: 'Sora, sans-serif' }}>
              mumble
            </span>
          </button>
          <div className="hidden md:flex items-center gap-8">
            {[
              { label: "Features", href: "#features" },
              { label: "How it works", href: "#how-it-works" },
              { label: "Scenarios", href: "#scenarios" },
            ].map(l => (
              <a key={l.href} href={l.href} className="text-sm text-gray-500 hover:text-gray-200 transition-colors duration-200">{l.label}</a>
            ))}
          </div>
          <Button
            onClick={() => navigate("/chat")}
            className="bg-emerald-500 hover:bg-emerald-400 text-black font-semibold rounded-full px-6 h-9 text-sm shadow-[0_0_20px_rgba(52,211,153,0.15)] hover:shadow-[0_0_30px_rgba(52,211,153,0.25)] transition-all duration-300"
            data-testid="nav-start-btn"
          >
            Start Free
          </Button>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section className="relative pt-32 pb-24 md:pt-44 md:pb-36 overflow-hidden" data-testid="hero-section">
        <GlowOrb className="w-[500px] h-[500px] bg-emerald-600 -top-40 -left-40" />
        <GlowOrb className="w-[400px] h-[400px] bg-emerald-500 -bottom-20 right-0" />
        <FloatingGrid />

        <div className="relative max-w-7xl mx-auto px-6 lg:px-8">
          <div className="max-w-3xl">
            <motion.div variants={fadeUp} initial="hidden" animate="visible" custom={0}>
              <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/5 text-emerald-400 text-xs font-medium tracking-wide mb-8">
                <Zap className="w-3 h-3" />
                AI-Powered Language Tutor
              </span>
            </motion.div>

            <motion.h1
              variants={fadeUp} initial="hidden" animate="visible" custom={1}
              className="text-4xl sm:text-5xl lg:text-7xl tracking-tight leading-[1.08] text-white mb-6"
              style={{ fontFamily: 'Sora, sans-serif', fontWeight: 600 }}
            >
              Learn any language<br />
              <span className="text-emerald-400">by actually speaking it</span>
            </motion.h1>

            <motion.p
              variants={fadeUp} initial="hidden" animate="visible" custom={2}
              className="text-base md:text-lg text-gray-400 leading-relaxed max-w-xl mb-10"
            >
              mumble is your personal tutor that listens, corrects, and adapts.
              Voice-first, 50+ languages, real-time feedback. No textbooks, just conversations.
            </motion.p>

            <motion.div
              variants={fadeUp} initial="hidden" animate="visible" custom={3}
              className="flex flex-col sm:flex-row gap-4"
            >
              <Button
                onClick={() => navigate("/chat")}
                className="bg-emerald-500 hover:bg-emerald-400 text-black font-semibold rounded-full px-8 py-6 text-base shadow-[0_0_30px_rgba(52,211,153,0.2)] hover:shadow-[0_0_40px_rgba(52,211,153,0.35)] transition-all duration-300"
                data-testid="hero-start-btn"
              >
                Start a conversation
                <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                onClick={() => navigate("/dashboard")}
                className="rounded-full px-8 py-6 text-base border-white/10 bg-white/[0.03] hover:bg-white/[0.06] text-gray-300"
                data-testid="hero-dashboard-btn"
              >
                View Dashboard
              </Button>
            </motion.div>
          </div>

          {/* Hero visual — floating karaoke demo */}
          <motion.div
            variants={fadeIn} initial="hidden" animate="visible" custom={4}
            className="hidden lg:block absolute right-8 top-16 w-[380px]"
          >
            <div className="relative rounded-2xl border border-white/[0.06] bg-white/[0.02] backdrop-blur-sm p-6 shadow-[0_0_60px_rgba(0,0,0,0.3)]">
              <div className="flex items-center gap-2 mb-4">
                <WaveformLogo size={20} className="text-emerald-400" />
                <span className="text-xs text-gray-500">mumble speaking...</span>
                <div className="flex items-center gap-[2px] ml-auto">
                  {[1,2,3,4,5].map(i => (
                    <motion.div
                      key={i}
                      className="w-[2px] bg-emerald-400 rounded-full"
                      animate={{ height: [3, 12, 3] }}
                      transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.1 }}
                    />
                  ))}
                </div>
              </div>
              <p className="text-sm leading-relaxed text-gray-400">
                <span className="text-gray-600">Hola,</span>{" "}
                <span className="text-gray-600">me</span>{" "}
                <span className="text-gray-600">llamo</span>{" "}
                <span className="bg-emerald-500/15 text-emerald-300 px-1 rounded">mumble</span>{" "}
                <span className="text-gray-600/40">y</span>{" "}
                <span className="text-gray-600/40">estoy</span>{" "}
                <span className="text-gray-600/40">aqui</span>{" "}
                <span className="text-gray-600/40">para</span>{" "}
                <span className="text-gray-600/40">ayudarte.</span>
              </p>
              <div className="mt-4 flex items-center gap-3">
                <div className="h-px flex-1 bg-gradient-to-r from-emerald-500/20 to-transparent" />
                <span className="text-[10px] text-emerald-500/50 uppercase tracking-wider">karaoke mode</span>
                <div className="h-px flex-1 bg-gradient-to-l from-emerald-500/20 to-transparent" />
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── FEATURES BENTO ── */}
      <Section id="features" className="relative py-24 md:py-32">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <motion.p variants={fadeUp} custom={0} className="text-xs uppercase tracking-[0.2em] text-emerald-500/70 mb-3">Core Features</motion.p>
          <motion.h2
            variants={fadeUp} custom={1}
            className="text-3xl md:text-4xl tracking-tight text-white mb-14"
            style={{ fontFamily: 'Sora, sans-serif', fontWeight: 600 }}
          >
            Built different from day one
          </motion.h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {FEATURES.map((f, i) => (
              <motion.div
                key={f.title}
                variants={scaleIn} custom={i}
                className={`group relative rounded-2xl border border-white/[0.06] bg-white/[0.02] p-8 hover:bg-white/[0.04] hover:border-emerald-500/20 transition-all duration-500 ${f.span}`}
                data-testid={`feature-card-${i}`}
              >
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-5 group-hover:bg-emerald-500/20 transition-colors duration-300">
                  <f.icon className="w-5 h-5 text-emerald-400" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2" style={{ fontFamily: 'Sora, sans-serif' }}>{f.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </Section>

      {/* ── TOOLS ── */}
      <Section className="relative py-24 md:py-32 border-t border-white/[0.04]">
        <GlowOrb className="w-[300px] h-[300px] bg-emerald-700 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
        <div className="relative max-w-7xl mx-auto px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <motion.p variants={fadeUp} custom={0} className="text-xs uppercase tracking-[0.2em] text-emerald-500/70 mb-3">Under the hood</motion.p>
              <motion.h2
                variants={fadeUp} custom={1}
                className="text-3xl md:text-4xl tracking-tight text-white mb-6"
                style={{ fontFamily: 'Sora, sans-serif', fontWeight: 600 }}
              >
                Real-time AI tools<br />working for you
              </motion.h2>
              <motion.p variants={fadeUp} custom={2} className="text-gray-500 leading-relaxed mb-8 max-w-md">
                Every message you send activates specialized AI subagents. You can watch them work
                in real-time — grammar checking, looking up vocabulary, evaluating your response.
              </motion.p>
              <motion.div variants={fadeUp} custom={3}>
                <Button
                  onClick={() => navigate("/chat")}
                  className="bg-white/[0.06] hover:bg-white/[0.1] text-white border border-white/10 rounded-full px-6 h-10 text-sm transition-all duration-300"
                  data-testid="tools-try-btn"
                >
                  Try it yourself <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </motion.div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {TOOLS.map((tool, i) => (
                <motion.div
                  key={tool.label}
                  variants={scaleIn} custom={i}
                  className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5 hover:bg-white/[0.04] transition-colors duration-300"
                  data-testid={`tool-card-${i}`}
                >
                  <tool.icon className="w-4 h-4 text-emerald-400 mb-3" />
                  <p className="text-sm font-medium text-white mb-1">{tool.label}</p>
                  <p className="text-xs text-gray-600">{tool.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </Section>

      {/* ── HOW IT WORKS ── */}
      <Section id="how-it-works" className="relative py-24 md:py-32 border-t border-white/[0.04]">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <motion.p variants={fadeUp} custom={0} className="text-xs uppercase tracking-[0.2em] text-emerald-500/70 mb-3">How it works</motion.p>
          <motion.h2
            variants={fadeUp} custom={1}
            className="text-3xl md:text-4xl tracking-tight text-white mb-14"
            style={{ fontFamily: 'Sora, sans-serif', fontWeight: 600 }}
          >
            Four steps to fluency
          </motion.h2>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {STEPS.map((step, i) => (
              <motion.div
                key={step.num}
                variants={fadeUp} custom={i}
                className="relative"
                data-testid={`step-${i}`}
              >
                <span className="text-5xl font-bold text-emerald-500/10 mb-2 block" style={{ fontFamily: 'Sora, sans-serif' }}>
                  {step.num}
                </span>
                <h3 className="text-base font-semibold text-white mb-2">{step.title}</h3>
                <p className="text-sm text-gray-600 leading-relaxed">{step.desc}</p>
                {i < STEPS.length - 1 && (
                  <div className="hidden md:block absolute top-8 -right-3 w-6">
                    <ChevronRight className="w-4 h-4 text-emerald-500/20" />
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </Section>

      {/* ── SCENARIOS ── */}
      <Section id="scenarios" className="relative py-24 md:py-32 border-t border-white/[0.04]">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex items-end justify-between mb-14">
            <div>
              <motion.p variants={fadeUp} custom={0} className="text-xs uppercase tracking-[0.2em] text-emerald-500/70 mb-3">Practice Scenarios</motion.p>
              <motion.h2
                variants={fadeUp} custom={1}
                className="text-3xl md:text-4xl tracking-tight text-white"
                style={{ fontFamily: 'Sora, sans-serif', fontWeight: 600 }}
              >
                Real conversations,<br />real confidence
              </motion.h2>
            </div>
            <motion.div variants={fadeIn} custom={2}>
              <Button
                variant="ghost"
                onClick={() => navigate("/chat")}
                className="text-emerald-400 hover:text-emerald-300 hidden md:flex items-center gap-1 text-sm"
                data-testid="view-all-scenarios-btn"
              >
                View all <ChevronRight className="w-4 h-4" />
              </Button>
            </motion.div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {SCENARIOS.map((s, i) => (
              <motion.button
                key={s.title}
                variants={scaleIn} custom={i}
                onClick={() => navigate("/chat")}
                className="group text-left rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6 hover:bg-white/[0.05] hover:border-emerald-500/20 transition-all duration-500"
                data-testid={`scenario-card-${i}`}
              >
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-4 group-hover:bg-emerald-500/20 transition-colors duration-300">
                  <s.icon className="w-5 h-5 text-emerald-400" />
                </div>
                <h3 className="text-sm font-semibold text-white mb-1.5">{s.title}</h3>
                <p className="text-xs text-gray-600 leading-relaxed">{s.desc}</p>
              </motion.button>
            ))}
          </div>
        </div>
      </Section>

      {/* ── CURRICULUM ── */}
      <Section className="relative py-24 md:py-32 border-t border-white/[0.04]">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div className="order-2 lg:order-1">
              <motion.div
                variants={scaleIn} custom={0}
                className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6 backdrop-blur-sm"
              >
                <div className="flex items-center gap-3 mb-5">
                  <GraduationCap className="w-5 h-5 text-emerald-400" />
                  <span className="text-sm font-medium text-white">Your Learning Plan</span>
                  <span className="ml-auto text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">Active</span>
                </div>
                {["Greetings & Introductions", "Numbers & Time", "Restaurant & Food", "Travel Basics", "Daily Routines"].map((lesson, i) => (
                  <div key={lesson} className="flex items-center gap-3 py-2.5 border-t border-white/[0.04]">
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold ${
                      i < 2 ? "bg-emerald-500/20 text-emerald-400" : i === 2 ? "bg-emerald-500 text-black" : "bg-white/[0.06] text-gray-600"
                    }`}>
                      {i < 2 ? "✓" : i + 1}
                    </div>
                    <span className={`text-sm ${i <= 2 ? "text-gray-300" : "text-gray-600"}`}>{lesson}</span>
                    {i === 2 && <span className="ml-auto text-[10px] text-emerald-400">In progress</span>}
                  </div>
                ))}
              </motion.div>
            </div>
            <div className="order-1 lg:order-2">
              <motion.p variants={fadeUp} custom={0} className="text-xs uppercase tracking-[0.2em] text-emerald-500/70 mb-3">Personalized Learning</motion.p>
              <motion.h2
                variants={fadeUp} custom={1}
                className="text-3xl md:text-4xl tracking-tight text-white mb-6"
                style={{ fontFamily: 'Sora, sans-serif', fontWeight: 600 }}
              >
                A curriculum built<br />around you
              </motion.h2>
              <motion.p variants={fadeUp} custom={2} className="text-gray-500 leading-relaxed mb-6 max-w-md">
                After assessing your level, mumble collaborates with you to build a personalized
                lesson plan. Set your goals, timeline, and topics — then follow a structured path to fluency.
              </motion.p>
              <motion.div variants={fadeUp} custom={3}>
                <Button
                  onClick={() => navigate("/chat")}
                  className="bg-emerald-500 hover:bg-emerald-400 text-black font-semibold rounded-full px-6 h-10 text-sm shadow-[0_0_20px_rgba(52,211,153,0.15)] transition-all duration-300"
                  data-testid="curriculum-start-btn"
                >
                  Build your plan <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </motion.div>
            </div>
          </div>
        </div>
      </Section>

      {/* ── CTA ── */}
      <Section className="relative py-28 md:py-36">
        <GlowOrb className="w-[600px] h-[600px] bg-emerald-600 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
        <div className="relative max-w-3xl mx-auto px-6 lg:px-8 text-center">
          <motion.h2
            variants={fadeUp} custom={0}
            className="text-3xl md:text-5xl tracking-tight text-white mb-6"
            style={{ fontFamily: 'Sora, sans-serif', fontWeight: 600 }}
          >
            Stop studying.<br />
            <span className="text-emerald-400">Start speaking.</span>
          </motion.h2>
          <motion.p variants={fadeUp} custom={1} className="text-gray-500 text-base md:text-lg mb-10 max-w-lg mx-auto">
            The best way to learn a language is to use it. mumble gives you a patient,
            always-available conversation partner who adapts to your level.
          </motion.p>
          <motion.div variants={fadeUp} custom={2}>
            <Button
              onClick={() => navigate("/chat")}
              className="bg-emerald-500 hover:bg-emerald-400 text-black font-semibold rounded-full px-10 py-6 text-base shadow-[0_0_40px_rgba(52,211,153,0.25)] hover:shadow-[0_0_60px_rgba(52,211,153,0.4)] transition-all duration-300"
              data-testid="cta-start-btn"
            >
              Begin your first lesson
              <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
          </motion.div>
        </div>
      </Section>

      {/* ── FOOTER ── */}
      <footer className="border-t border-white/[0.04] py-8" data-testid="footer">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <WaveformLogo size={24} className="text-emerald-400" />
            <span className="text-sm text-gray-600" style={{ fontFamily: 'Sora, sans-serif' }}>mumble</span>
          </div>
          <div className="flex items-center gap-6">
            {[
              { label: "Practice", href: "/chat" },
              { label: "Dashboard", href: "/dashboard" },
              { label: "Vocabulary", href: "/vocabulary" },
            ].map(l => (
              <button key={l.href} onClick={() => navigate(l.href)} className="text-xs text-gray-600 hover:text-gray-400 transition-colors duration-200">
                {l.label}
              </button>
            ))}
          </div>
          <p className="text-xs text-gray-700">AI-powered language learning</p>
        </div>
      </footer>
    </div>
  );
}
