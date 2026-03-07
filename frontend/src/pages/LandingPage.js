import { useNavigate } from "react-router-dom";
import { useRef, useEffect, useState, useMemo } from "react";
import {
  motion, useScroll, useTransform, useSpring, useInView,
  AnimatePresence,
} from "framer-motion";
import { WaveformLogo } from "@/components/WaveformLogo";
import { useAuth } from "@/hooks/useAuth";
import {
  Mic, ArrowRight, Brain, AudioLines, Target, Volume2,
  Briefcase, Plane, UtensilsCrossed, MessageSquare, GraduationCap,
  Sparkles, BookOpen, ChevronDown, Check, Zap, Crown,
  Globe, Shield, Users, Clock,
} from "lucide-react";

/* ═══════════════════════════════════════════
   RICH SECTION COLORS — bold, saturated
   ═══════════════════════════════════════════ */
const BG = {
  hero:      "#f8f7f4",
  features:  "#d1fae5",
  tools:     "#bfdbfe",
  demo:      "#e9d5ff",
  scenarios: "#fed7aa",
  pricing:   "#fce4ec",
  cta:       "#f8f7f4",
  footer:    "#1e1b4b",
};

/* ═══════════════════════════════════════════
   SCROLL PROGRESS
   ═══════════════════════════════════════════ */
function ScrollProgress() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 100, damping: 30 });
  return (
    <motion.div className="fixed top-0 left-0 right-0 h-[2px] z-[60] origin-left"
      style={{ scaleX, background: "linear-gradient(90deg, #6366f1, #10b981, #ec4899, #f59e0b)" }} />
  );
}

/* ═══════════════════════════════════════════
   ANIMATION HELPERS
   ═══════════════════════════════════════════ */
function Reveal({ children, className, delay = 0 }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  return (
    <motion.div ref={ref} className={className}
      initial={{ opacity: 0, y: 32 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ delay, duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
    >{children}</motion.div>
  );
}

function WordReveal({ text, className, as: Tag = "h1" }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-50px" });
  return (
    <Tag ref={ref} className={className}>
      {text.split(" ").map((w, i) => (
        <motion.span key={i} className="inline-block mr-[0.3em]"
          initial={{ opacity: 0, y: 32, filter: "blur(5px)" }}
          animate={inView ? { opacity: 1, y: 0, filter: "blur(0px)" } : {}}
          transition={{ delay: i * 0.05, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        >{w}</motion.span>
      ))}
    </Tag>
  );
}

/* ═══════════════════════════════════════════
   MESH GRADIENT BACKGROUND
   ═══════════════════════════════════════════ */
function MeshBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <motion.div className="absolute w-[600px] h-[600px] rounded-full"
        style={{ top: "-10%", left: "-5%", background: "radial-gradient(circle, rgba(99,102,241,0.25) 0%, transparent 65%)" }}
        animate={{ x: [0, 40, 0], y: [0, 30, 0] }}
        transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }} />
      <motion.div className="absolute w-[500px] h-[500px] rounded-full"
        style={{ top: "20%", right: "-5%", background: "radial-gradient(circle, rgba(236,72,153,0.2) 0%, transparent 65%)" }}
        animate={{ x: [0, -30, 0], y: [0, 40, 0] }}
        transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }} />
      <motion.div className="absolute w-[450px] h-[450px] rounded-full"
        style={{ bottom: "5%", left: "30%", background: "radial-gradient(circle, rgba(16,185,129,0.18) 0%, transparent 65%)" }}
        animate={{ x: [0, 35, 0], y: [0, -25, 0] }}
        transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }} />
    </div>
  );
}

/* ═══════════════════════════════════════════
   FLOATING SCRIPT CHARACTERS — drift around
   ═══════════════════════════════════════════ */
const CHARS = ["あ", "ñ", "ü", "ش", "한", "ç", "你", "ж", "θ", "ê", "ß", "ø"];

function FloatingChars() {
  const items = useMemo(() => CHARS.map((c, i) => ({
    char: c, x: 5 + (i * 8) % 90, y: 10 + ((i * 17) % 80),
    size: 14 + (i % 3) * 6, dur: 10 + (i % 4) * 5,
  })), []);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {items.map((item, i) => (
        <motion.span key={i}
          className="absolute font-bold select-none"
          style={{ left: `${item.x}%`, top: `${item.y}%`, fontSize: item.size, color: "rgba(99,102,241,0.08)" }}
          animate={{ y: [-10, 10, -10], x: [-5, 5, -5], rotate: [-5, 5, -5] }}
          transition={{ duration: item.dur, repeat: Infinity, ease: "easeInOut", delay: i * 0.7 }}
        >{item.char}</motion.span>
      ))}
    </div>
  );
}

/* ═══════════════════════════════════════════
   SOUND WAVE ANIMATION
   ═══════════════════════════════════════════ */
function SoundWave({ barCount = 24, color = "#6366f1", height = 48 }) {
  return (
    <div className="flex items-end gap-[3px]" style={{ height }}>
      {Array.from({ length: barCount }).map((_, i) => (
        <motion.div key={i}
          className="rounded-full"
          style={{ width: 3, background: color, opacity: 0.6 + (i % 3) * 0.15 }}
          animate={{ height: [4, height * (0.3 + Math.sin(i * 0.5) * 0.35 + 0.35), 4] }}
          transition={{
            duration: 0.8 + (i % 5) * 0.15,
            repeat: Infinity,
            ease: "easeInOut",
            delay: i * 0.04,
          }}
        />
      ))}
    </div>
  );
}

/* ═══════════════════════════════════════════
   MORPHING HELLO TEXT
   ═══════════════════════════════════════════ */
const LANGUAGES_CYCLE = ["Spanish", "French", "Japanese", "German", "Italian", "Korean", "Arabic", "Portuguese", "Mandarin", "Hindi"];
const LANG_COLORS = ["#4f46e5", "#be185d", "#059669", "#b45309", "#dc2626", "#7c3aed", "#0284c7", "#c2410c", "#059669", "#be185d"];

function LanguageCarousel() {
  const [idx, setIdx] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setIdx(p => (p + 1) % LANGUAGES_CYCLE.length), 2400);
    return () => clearInterval(t);
  }, []);

  return (
    <span className="inline-flex relative h-[1.2em] overflow-hidden align-bottom min-w-[3ch]">
      <AnimatePresence mode="wait">
        <motion.span key={idx}
          className="font-bold whitespace-nowrap"
          style={{ color: LANG_COLORS[idx] }}
          initial={{ y: "100%", opacity: 0, rotateX: -45 }}
          animate={{ y: "0%", opacity: 1, rotateX: 0 }}
          exit={{ y: "-100%", opacity: 0, rotateX: 45 }}
          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        >{LANGUAGES_CYCLE[idx]}</motion.span>
      </AnimatePresence>
    </span>
  );
}

/* ═══════════════════════════════════════════
   NAVBAR
   ═══════════════════════════════════════════ */
function Navbar() {
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", h, { passive: true });
    return () => window.removeEventListener("scroll", h);
  }, []);

  return (
    <motion.nav className="fixed top-0 left-0 right-0 z-50 transition-all duration-300"
      style={{
        background: scrolled ? "rgba(248,247,244,0.9)" : "transparent",
        backdropFilter: scrolled ? "blur(16px)" : "none",
        borderBottom: scrolled ? "1px solid rgba(0,0,0,0.06)" : "1px solid transparent",
      }}
      initial={{ y: -60, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 0.2, duration: 0.5 }}
      data-testid="navbar"
    >
      <div className="max-w-6xl mx-auto px-6 flex items-center justify-between h-14">
        <button onClick={() => navigate("/")} className="flex items-center gap-1.5 group" data-testid="logo-button">
          <WaveformLogo size={28} className="text-indigo-600 transition-transform duration-300 group-hover:scale-105" />
          <span className="text-[15px] font-semibold tracking-tight text-slate-900" style={{ fontFamily: "Sora" }}>mumble</span>
        </button>
        <div className="hidden md:flex items-center gap-7">
          {["Features", "How it works", "Scenarios", "Pricing"].map(l => (
            <a key={l} href={`#${l.toLowerCase().replace(/ /g, "-")}`}
              className="text-[13px] font-medium text-slate-500 transition-colors duration-200 hover:text-indigo-600">{l}</a>
          ))}
        </div>
        <button onClick={() => navigate("/chat")}
          className="relative text-[13px] font-semibold px-5 py-2.5 rounded-full bg-indigo-600 text-white overflow-hidden group transition-all duration-300 hover:-translate-y-px shadow-[0_2px_12px_rgba(99,102,241,0.3)] hover:shadow-[0_4px_20px_rgba(99,102,241,0.5)]"
          data-testid="nav-start-btn">
          <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
          <span className="relative flex items-center gap-1.5">Get Started <ArrowRight className="w-3.5 h-3.5 transition-transform duration-300 group-hover:translate-x-0.5" /></span>
        </button>
      </div>
    </motion.nav>
  );
}

/* ═══════════════════════════════════════════
   HERO — mesh gradient + morphing text
   ═══════════════════════════════════════════ */

function AnimatedStat({ value, label, delay }) {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const inView = useInView(ref, { once: true });
  useEffect(() => {
    if (!inView) return;
    let start = 0;
    const end = parseInt(value);
    const duration = 1800;
    const step = Math.max(1, Math.floor(end / (duration / 16)));
    const timer = setInterval(() => {
      start += step;
      if (start >= end) { start = end; clearInterval(timer); }
      setCount(start);
    }, 16);
    return () => clearInterval(timer);
  }, [inView, value]);

  return (
    <motion.div ref={ref} className="text-center"
      initial={{ opacity: 0, y: 16 }} animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ delay, duration: 0.5 }}>
      <span className="text-2xl md:text-3xl font-bold text-indigo-600 tabular-nums" style={{ fontFamily: "Sora" }}>{count}+</span>
      <p className="text-[11px] md:text-xs text-slate-500 mt-0.5">{label}</p>
    </motion.div>
  );
}

function HeroSection() {
  const navigate = useNavigate();
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], [0, 120]);
  const opacity = useTransform(scrollYProgress, [0, 0.6], [1, 0]);

  return (
    <section ref={ref} className="relative min-h-screen flex flex-col justify-center pt-16 pb-8 overflow-hidden"
      style={{ background: BG.hero }} data-testid="hero-section">
      <MeshBackground />
      <FloatingChars />

      <motion.div className="relative max-w-5xl mx-auto px-6 w-full text-center z-10" style={{ y, opacity }}>
        <motion.span
          className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-[11px] font-medium tracking-wider uppercase mb-8 border border-indigo-200 text-indigo-600 bg-indigo-50"
          initial={{ opacity: 0, scale: 0.85 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5 }}>
          <Sparkles className="w-3 h-3" /> AI-Powered Language Tutor
        </motion.span>

        <h1 className="text-5xl md:text-7xl font-bold tracking-tighter text-slate-900 mb-6" style={{ fontFamily: "Sora", lineHeight: 1.15 }}>
          <motion.span className="block"
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            Learn <LanguageCarousel />
          </motion.span>
          <motion.span className="block text-slate-400"
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.6 }}>
            by actually speaking it
          </motion.span>
        </h1>

        <motion.p className="text-base md:text-xl text-slate-600 leading-relaxed max-w-2xl mx-auto mb-4"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7 }}>
          Have real voice conversations with an AI that corrects your grammar, builds your vocabulary,
          and adapts to your level.{" "}
          <span className="text-emerald-600 font-semibold">50+ languages</span>. Real-time spoken feedback.
        </motion.p>

        <motion.p className="text-sm text-slate-400 mb-8"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.85 }}>
          <Shield className="w-3.5 h-3.5 inline-block mr-1 -mt-0.5" />
          Free to start — no credit card required
        </motion.p>

        {/* Sound wave */}
        <motion.div className="flex justify-center mb-8"
          initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.9, duration: 0.6 }}>
          <SoundWave barCount={32} color="#6366f1" height={40} />
        </motion.div>

        <motion.div className="flex flex-col sm:flex-row gap-4 justify-center mb-14"
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.1 }}>
          <motion.button onClick={() => navigate("/chat")}
            className="relative rounded-full px-9 py-4 text-sm font-semibold bg-indigo-600 text-white overflow-hidden group shadow-[0_4px_24px_rgba(99,102,241,0.35)]"
            whileHover={{ scale: 1.04, boxShadow: "0 6px 32px rgba(99,102,241,0.5)" }}
            whileTap={{ scale: 0.97 }}
            transition={{ type: "spring", stiffness: 400, damping: 17 }}
            data-testid="hero-start-btn">
            <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/25 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
            <span className="relative flex items-center gap-2">
              Start a conversation <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
            </span>
          </motion.button>
          <motion.button onClick={() => navigate("/dashboard")}
            className="rounded-full px-9 py-4 text-sm font-medium text-slate-600 border-2 border-slate-200 bg-white/70 backdrop-blur-sm group overflow-hidden relative"
            whileHover={{ scale: 1.04, borderColor: "#818cf8" }}
            whileTap={{ scale: 0.97 }}
            transition={{ type: "spring", stiffness: 400, damping: 17 }}
            data-testid="hero-dashboard-btn">
            <span className="relative flex items-center gap-2 transition-colors duration-300 group-hover:text-indigo-600">
              View Dashboard <ArrowRight className="w-4 h-4 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300" />
            </span>
          </motion.button>
        </motion.div>

        {/* Animated stats */}
        <motion.div className="flex justify-center gap-10 md:gap-16"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.4 }}>
          <AnimatedStat value="50" label="Languages" delay={1.5} />
          <AnimatedStat value="4" label="AI Agents" delay={1.6} />
          <AnimatedStat value="100" label="Free Credits" delay={1.7} />
        </motion.div>
      </motion.div>

      <motion.div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.5 }}>
        <motion.div animate={{ y: [0, 6, 0] }} transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}>
          <ChevronDown className="w-5 h-5 text-slate-400" />
        </motion.div>
      </motion.div>
    </section>
  );
}

/* ═══════════════════════════════════════════
   FEATURES — saturated green bg, inline rows
   ═══════════════════════════════════════════ */
const FEATURES = [
  { icon: Mic, label: "Voice-First Learning", desc: "Speak naturally and hear instant spoken corrections. Like having a patient tutor who never judges — just helps you get better.", accent: "#059669" },
  { icon: AudioLines, label: "Live Word Tracking", desc: "Every word highlights as the AI speaks, connecting sound to text so you absorb pronunciation and reading simultaneously.", accent: "#be185d" },
  { icon: Brain, label: "Real-Time Corrections", desc: "Grammar, vocabulary, and pronunciation tools activate as you talk — corrections appear mid-conversation, not after a quiz.", accent: "#4338ca" },
  { icon: GraduationCap, label: "Remembers Your Weaknesses", desc: "Your personal curriculum evolves with every session. It tracks mistakes, revisits weak spots, and levels up when you're ready.", accent: "#b45309" },
];

function FeaturesSection() {
  return (
    <section id="features" className="relative py-24 md:py-32" style={{ background: BG.features }} data-testid="features-section">
      <div className="max-w-5xl mx-auto px-6">
        <Reveal>
          <span className="text-[13px] font-semibold tracking-wider uppercase mb-3 block text-emerald-700">Core Features</span>
        </Reveal>
        <WordReveal text="Everything you need to speak confidently" as="h2"
          className="text-3xl md:text-5xl font-bold tracking-tight text-emerald-950 mb-14" />
        <div>
          {FEATURES.map((f, i) => (
            <FeatureStrip key={f.label} f={f} i={i} isLast={i === FEATURES.length - 1} />
          ))}
        </div>
      </div>
    </section>
  );
}

function FeatureStrip({ f, i, isLast }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  const [hovered, setHovered] = useState(false);
  return (
    <motion.div ref={ref}
      className={`group py-7 md:py-9 ${!isLast ? "border-b border-emerald-300/40" : ""}`}
      initial={{ opacity: 0, x: i % 2 === 0 ? -30 : 30 }}
      animate={inView ? { opacity: 1, x: 0 } : {}}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}>
      <div className="flex flex-col md:flex-row md:items-center gap-3 md:gap-8">
        <div className="flex items-center gap-4 md:w-72 flex-shrink-0">
          <motion.span className="text-[11px] font-mono text-emerald-600/50"
            animate={hovered ? { scale: 1.2, color: f.accent } : { scale: 1 }}
            transition={{ duration: 0.2 }}>0{i + 1}</motion.span>
          <motion.div
            animate={hovered ? { scale: 1.3, rotate: 12, color: f.accent } : { scale: 1, rotate: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 15 }}>
            <f.icon className="w-5 h-5" style={{ color: f.accent }} />
          </motion.div>
          <h3 className="text-lg md:text-xl font-semibold tracking-tight text-emerald-950" style={{ fontFamily: "Sora" }}>{f.label}</h3>
        </div>
        <p className="text-sm md:text-[15px] leading-relaxed md:flex-1 max-w-xl text-emerald-800/70">{f.desc}</p>
        <motion.div className="hidden md:block w-16 h-[3px] rounded-full flex-shrink-0 origin-left"
          style={{ background: f.accent }}
          initial={{ scaleX: 0, opacity: 0 }}
          animate={hovered ? { scaleX: 1, opacity: 1 } : { scaleX: 0, opacity: 0 }}
          transition={{ duration: 0.35, ease: "easeOut" }} />
      </div>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════
   HOW IT WORKS — blue bg, timeline
   ═══════════════════════════════════════════ */
const STEPS = [
  { icon: Target, title: "Just start talking", desc: "Open a conversation, pick your language, and speak. No textbooks, no drills — just talk like you would to a friend." },
  { icon: Brain, title: "AI listens and understands", desc: "Your Tutor agent transcribes speech, spots grammar mistakes, identifies new vocabulary, and figures out what you're trying to say." },
  { icon: Volume2, title: "Get spoken feedback instantly", desc: "Hear corrections with word-by-word highlights. Your Tester agent quizzes you, and the Revision Coach helps you practice weak spots." },
  { icon: GraduationCap, title: "Watch yourself improve", desc: "Your Planner agent builds a curriculum that evolves with you — harder lessons as you improve, extra practice where you struggle." },
];

function HowItWorksSection() {
  return (
    <section id="how-it-works" className="relative py-24 md:py-32" style={{ background: BG.tools }} data-testid="tools-section">
      <div className="max-w-4xl mx-auto px-6">
        <div className="text-center mb-16">
          <Reveal>
            <span className="text-[13px] font-semibold tracking-wider uppercase mb-3 block text-blue-700">How it works</span>
          </Reveal>
          <WordReveal text="Four steps to fluency" as="h2"
            className="text-3xl md:text-5xl font-bold tracking-tight text-blue-950" />
        </div>
        <div className="relative">
          <div className="absolute left-6 md:left-7 top-0 bottom-0 w-px bg-gradient-to-b from-blue-400 via-blue-300 to-transparent" />
          <div className="space-y-10 md:space-y-14">
            {STEPS.map((s, i) => <TimelineStep key={s.title} s={s} i={i} />)}
          </div>
        </div>
      </div>
    </section>
  );
}

function TimelineStep({ s, i }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  return (
    <motion.div ref={ref} className="relative flex gap-6 md:gap-9"
      initial={{ opacity: 0, y: 24 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ delay: i * 0.15, duration: 0.55, ease: [0.22, 1, 0.36, 1] }}>
      <div className="relative z-10 flex-shrink-0 w-12 md:w-14 flex items-start justify-center pt-0.5">
        <motion.div className="w-11 h-11 rounded-full flex items-center justify-center bg-white border-2 border-blue-200 shadow-sm relative"
          whileHover={{ scale: 1.15, boxShadow: "0 4px 16px rgba(59,130,246,0.25)" }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}>
          <s.icon className="w-5 h-5 text-blue-600" />
          {/* Pulse ring on appear */}
          {inView && (
            <motion.span className="absolute inset-0 rounded-full border-2 border-blue-300"
              initial={{ scale: 1, opacity: 0.6 }}
              animate={{ scale: 1.6, opacity: 0 }}
              transition={{ delay: i * 0.15 + 0.3, duration: 0.8, ease: "easeOut" }} />
          )}
        </motion.div>
      </div>
      <div className="pb-1">
        <span className="text-[10px] font-mono tracking-wider text-blue-400">STEP 0{i + 1}</span>
        <h3 className="text-base md:text-lg font-semibold tracking-tight text-blue-950 mt-0.5 mb-1.5" style={{ fontFamily: "Sora" }}>{s.title}</h3>
        <p className="text-sm leading-relaxed max-w-md text-blue-800/60">{s.desc}</p>
      </div>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════
   AGENTS — Meet Your AI Team
   ═══════════════════════════════════════════ */
const AGENTS = [
  {
    name: "Tutor",
    role: "Your conversation partner",
    desc: "Teaches you through natural conversation. Corrects grammar in real-time, introduces new vocabulary in context, and adjusts difficulty based on how you're doing. Like having a native speaker friend who's also a teacher.",
    icon: MessageSquare,
    color: "#6366f1",
    bg: "rgba(99,102,241,0.06)",
    border: "rgba(99,102,241,0.12)",
    features: ["Real-time grammar correction", "Vocabulary building in context", "Adaptive difficulty"],
  },
  {
    name: "Planner",
    role: "Your curriculum designer",
    desc: "Asks about your goals, timeline, and interests — then builds a personalized lesson plan. Learning for a trip to Tokyo? It'll prioritize travel phrases. Preparing for a job interview? It'll focus on formal language.",
    icon: Target,
    color: "#059669",
    bg: "rgba(5,150,105,0.06)",
    border: "rgba(5,150,105,0.12)",
    features: ["Goal-based curriculum", "Personalized lesson plans", "Adapts as you progress"],
  },
  {
    name: "Tester",
    role: "Your quiz master",
    desc: "After your tutor session, the Tester steps in with quizzes based on exactly what you just learned. It scores your performance, identifies weak spots, and tells you what to focus on next.",
    icon: Zap,
    color: "#be185d",
    bg: "rgba(190,24,93,0.06)",
    border: "rgba(190,24,93,0.12)",
    features: ["Context-aware quizzes", "Performance scoring", "Weakness identification"],
  },
  {
    name: "Revision Coach",
    role: "Your mistake fixer",
    desc: "Takes your test results and drills the specific words and concepts you got wrong. Re-explains grammar rules, creates targeted exercises, and doesn't move on until you've genuinely improved.",
    icon: BookOpen,
    color: "#b45309",
    bg: "rgba(180,67,9,0.06)",
    border: "rgba(180,67,9,0.12)",
    features: ["Targeted mistake drilling", "Concept re-teaching", "Confidence building"],
  },
];

function AgentCard({ agent, index }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  const [hovered, setHovered] = useState(false);

  return (
    <motion.div ref={ref}
      className="relative rounded-2xl p-6 md:p-7 overflow-hidden cursor-default"
      style={{
        background: hovered ? agent.bg : "rgba(255,255,255,0.6)",
        border: `1px solid ${hovered ? agent.border : "rgba(0,0,0,0.04)"}`,
        backdropFilter: "blur(12px)",
      }}
      initial={{ opacity: 0, y: 30 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ delay: index * 0.12, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      whileHover={{ y: -4, boxShadow: `0 12px 40px ${agent.bg}` }}
      data-testid={`agent-card-${agent.name.toLowerCase()}`}
    >
      {/* Active indicator line */}
      <motion.div className="absolute top-0 left-0 right-0 h-[3px] origin-left"
        style={{ background: agent.color }}
        initial={{ scaleX: 0 }}
        animate={hovered ? { scaleX: 1 } : { scaleX: 0 }}
        transition={{ duration: 0.35 }} />

      <div className="flex items-start gap-4 mb-4">
        <motion.div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: agent.bg, border: `1px solid ${agent.border}` }}
          animate={hovered ? { scale: 1.1, rotate: 6 } : { scale: 1, rotate: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}>
          <agent.icon className="w-5 h-5" style={{ color: agent.color }} />
        </motion.div>
        <div>
          <h3 className="text-lg font-bold tracking-tight" style={{ fontFamily: "Sora", color: agent.color }}>{agent.name}</h3>
          <p className="text-xs text-slate-500">{agent.role}</p>
        </div>
      </div>

      <p className="text-sm leading-relaxed text-slate-600 mb-5">{agent.desc}</p>

      <div className="space-y-2">
        {agent.features.map((f, i) => (
          <motion.div key={f} className="flex items-center gap-2"
            initial={{ opacity: 0, x: -8 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ delay: index * 0.12 + 0.3 + i * 0.06 }}>
            <Check className="w-3.5 h-3.5 flex-shrink-0" style={{ color: agent.color }} />
            <span className="text-xs text-slate-500">{f}</span>
          </motion.div>
        ))}
      </div>

      {/* Floating pulse on hover */}
      <AnimatePresence>
        {hovered && (
          <motion.div className="absolute -bottom-8 -right-8 w-24 h-24 rounded-full"
            style={{ background: agent.color, opacity: 0.04 }}
            initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}
            transition={{ duration: 0.3 }} />
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function AgentFlowArrow() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true });
  return (
    <motion.div ref={ref} className="hidden lg:flex items-center justify-center py-8"
      initial={{ opacity: 0 }} animate={inView ? { opacity: 1 } : {}} transition={{ delay: 0.6, duration: 0.5 }}>
      <div className="flex items-center gap-3">
        {AGENTS.map((agent, i) => (
          <div key={agent.name} className="flex items-center gap-3">
            <motion.div className="w-8 h-8 rounded-full flex items-center justify-center"
              style={{ background: agent.bg, border: `1.5px solid ${agent.border}` }}
              animate={{ scale: [1, 1.15, 1] }}
              transition={{ delay: i * 0.4, duration: 1.5, repeat: Infinity, repeatDelay: 4 }}>
              <agent.icon className="w-3.5 h-3.5" style={{ color: agent.color }} />
            </motion.div>
            {i < AGENTS.length - 1 && (
              <motion.div className="flex items-center gap-0.5"
                initial={{ opacity: 0 }} animate={inView ? { opacity: 1 } : {}} transition={{ delay: 0.8 + i * 0.2 }}>
                {[0, 1, 2].map(d => (
                  <motion.div key={d} className="w-1.5 h-1.5 rounded-full bg-slate-300"
                    animate={{ opacity: [0.3, 1, 0.3] }}
                    transition={{ delay: d * 0.15 + i * 0.3, duration: 1.2, repeat: Infinity }} />
                ))}
              </motion.div>
            )}
          </div>
        ))}
      </div>
      <span className="text-[10px] text-slate-400 ml-4 tracking-wider uppercase">Learning cycle</span>
    </motion.div>
  );
}

function AgentsSection() {
  return (
    <section className="relative py-24 md:py-32" style={{ background: "linear-gradient(180deg, #eef2ff 0%, #f5f3ff 50%, #faf5ff 100%)" }} data-testid="agents-section">
      <div className="max-w-5xl mx-auto px-6">
        <div className="text-center mb-6">
          <Reveal>
            <span className="text-[13px] font-semibold tracking-wider uppercase mb-3 block text-indigo-600">4 Specialized AI Agents</span>
          </Reveal>
          <WordReveal text="Meet your AI teaching team" as="h2"
            className="text-3xl md:text-5xl font-bold tracking-tight text-slate-900 mb-4" />
          <Reveal delay={0.1}>
            <p className="text-[15px] max-w-2xl mx-auto text-slate-500 leading-relaxed">
              Not one generic chatbot — <span className="font-semibold text-slate-700">four specialized agents</span> that work together.
              Each one handles a different part of your learning journey, seamlessly handing off to the next.
            </p>
          </Reveal>
        </div>

        <AgentFlowArrow />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {AGENTS.map((agent, i) => <AgentCard key={agent.name} agent={agent} index={i} />)}
        </div>

        {/* Bottom flow description */}
        <Reveal delay={0.3}>
          <div className="mt-10 text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/70 backdrop-blur-sm border border-indigo-100">
              <Globe className="w-3.5 h-3.5 text-indigo-500" />
              <span className="text-xs text-slate-600">
                <span className="font-semibold text-indigo-600">Learn</span> with the Tutor
                <span className="mx-1.5 text-slate-300">&#8594;</span>
                <span className="font-semibold text-emerald-600">Plan</span> your path
                <span className="mx-1.5 text-slate-300">&#8594;</span>
                <span className="font-semibold text-pink-600">Test</span> your knowledge
                <span className="mx-1.5 text-slate-300">&#8594;</span>
                <span className="font-semibold text-amber-600">Review</span> and improve
              </span>
              <Clock className="w-3.5 h-3.5 text-indigo-500" />
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════
   DEMO — violet bg, chat messages
   ═══════════════════════════════════════════ */
const DEMO_MSGS = [
  { role: "user", text: "How do I say 'I am happy' in Spanish?" },
  { role: "tool", text: "Checking grammar patterns..." },
  { role: "tool", text: "Looking up vocabulary..." },
  { role: "ai", text: '"Estoy feliz" — estar is used for emotions because they are temporary states.' },
];

function TypingIndicator() {
  return (
    <div className="flex items-center gap-1 px-3 py-1.5">
      {[0, 1, 2].map(i => (
        <motion.div key={i} className="w-1.5 h-1.5 rounded-full bg-violet-400"
          animate={{ y: [0, -4, 0], opacity: [0.4, 1, 0.4] }}
          transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15, ease: "easeInOut" }} />
      ))}
    </div>
  );
}

function DemoChat() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });
  const [count, setCount] = useState(0);
  const [showTyping, setShowTyping] = useState(false);
  useEffect(() => {
    if (!inView) return;
    let idx = 0;
    const show = () => {
      if (idx >= DEMO_MSGS.length) return;
      if (DEMO_MSGS[idx].role === "ai") {
        setShowTyping(true);
        setTimeout(() => {
          setShowTyping(false);
          idx++; setCount(idx);
        }, 800);
      } else {
        idx++; setCount(idx);
        setTimeout(show, 900);
      }
    };
    setTimeout(show, 600);
    const t = setInterval(show, 1200);
    return () => clearInterval(t);
  }, [inView]);

  return (
    <div ref={ref} className="w-full max-w-md space-y-3 mx-auto lg:mx-0">
      <div className="flex items-center gap-2 mb-4 pb-3 border-b border-violet-300/40">
        <WaveformLogo size={18} className="text-violet-700" />
        <span className="text-xs font-medium text-violet-500" style={{ fontFamily: "Sora" }}>mumble</span>
        <div className="ml-auto"><SoundWave barCount={8} color="#7c3aed" height={16} /></div>
      </div>
      {DEMO_MSGS.map((msg, i) => {
        if (i >= count) return null;
        if (msg.role === "user") return (
          <motion.div key={i} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="flex justify-end">
            <div className="text-[13px] px-4 py-2.5 rounded-2xl rounded-br-sm bg-violet-700 text-white max-w-[85%]">{msg.text}</div>
          </motion.div>
        );
        if (msg.role === "tool") return (
          <motion.div key={i} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-2 pl-1">
            <motion.div className="w-1.5 h-1.5 rounded-full bg-emerald-500" animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 1, repeat: 2 }} />
            <span className="text-[11px] italic text-violet-500/70">{msg.text}</span>
          </motion.div>
        );
        return (
          <motion.div key={i} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5 }} className="flex gap-2.5">
            <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 bg-violet-200">
              <WaveformLogo size={12} className="text-violet-700" />
            </div>
            <div className="text-[13px] px-4 py-2.5 rounded-2xl rounded-bl-sm bg-white border border-violet-200/50 max-w-[85%] shadow-sm">
              <span className="text-emerald-600 font-semibold">"Estoy feliz"</span>
              <span className="text-slate-600"> — </span>
              <span className="font-medium text-slate-800">estar</span>
              <span className="text-slate-600"> is used for emotions because they are temporary states.</span>
            </div>
          </motion.div>
        );
      })}
      {showTyping && <TypingIndicator />}
    </div>
  );
}

function DemoSection() {
  const navigate = useNavigate();
  return (
    <section className="relative py-24 md:py-32" style={{ background: BG.demo }} data-testid="demo-section">
      <div className="max-w-5xl mx-auto px-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-14 items-center">
          <div>
            <Reveal>
              <span className="text-[13px] font-semibold tracking-wider uppercase mb-3 block text-violet-700">See it in action</span>
            </Reveal>
            <WordReveal text="A conversation, not a classroom" as="h2"
              className="text-3xl md:text-5xl font-bold tracking-tight text-violet-950 mb-5" />
            <Reveal delay={0.15}>
              <p className="text-[15px] leading-relaxed mb-5 text-violet-800/60">
                Ask anything. mumble responds with context-aware corrections, vocabulary insights, and pronunciation guides — all streamed in real-time.
              </p>
            </Reveal>
            <Reveal delay={0.2}>
              <div className="flex flex-wrap gap-2 mb-8">
                {[
                  { label: "Tutor", desc: "teaches & corrects", color: "#6366f1" },
                  { label: "Planner", desc: "builds your path", color: "#059669" },
                  { label: "Tester", desc: "quizzes you", color: "#be185d" },
                  { label: "Revision", desc: "reviews mistakes", color: "#b45309" },
                ].map((agent, i) => (
                  <motion.div key={agent.label}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/60 backdrop-blur-sm border border-violet-200/50"
                    initial={{ opacity: 0, scale: 0.8 }} whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }} transition={{ delay: 0.3 + i * 0.08 }}
                    whileHover={{ scale: 1.06, borderColor: agent.color }}>
                    <span className="w-1.5 h-1.5 rounded-full" style={{ background: agent.color }} />
                    <span className="text-xs font-semibold" style={{ color: agent.color }}>{agent.label}</span>
                    <span className="text-[10px] text-violet-500/60">{agent.desc}</span>
                  </motion.div>
                ))}
              </div>
            </Reveal>
            <Reveal delay={0.25}>
              <motion.button onClick={() => navigate("/chat")}
                className="relative inline-flex items-center gap-2 text-sm font-semibold text-violet-700 px-6 py-3 rounded-full border-2 border-violet-300 bg-white/60 backdrop-blur-sm overflow-hidden group"
                whileHover={{ scale: 1.05, borderColor: "#7c3aed", boxShadow: "0 4px 20px rgba(139,92,246,0.2)" }}
                whileTap={{ scale: 0.97 }}
                transition={{ type: "spring", stiffness: 400, damping: 17 }}
                data-testid="demo-try-btn">
                <span className="absolute inset-0 bg-gradient-to-r from-transparent via-violet-100 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                <span className="relative flex items-center gap-2">
                  Try it yourself <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
                </span>
              </motion.button>
            </Reveal>
          </div>
          <Reveal delay={0.15}>
            <DemoChat />
          </Reveal>
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════
   SCENARIOS — orange bg, floating pills
   ═══════════════════════════════════════════ */
const SCENARIOS = [
  { icon: Briefcase, label: "Job Interview", color: "#b45309" },
  { icon: Plane, label: "Travel Abroad", color: "#059669" },
  { icon: UtensilsCrossed, label: "Ordering Food", color: "#be185d" },
  { icon: MessageSquare, label: "Small Talk", color: "#4338ca" },
  { icon: BookOpen, label: "Business Meeting", color: "#c2410c" },
  { icon: Users, label: "Making Friends", color: "#7c3aed" },
];

function ScenariosSection() {
  const containerRef = useRef(null);
  const { scrollYProgress } = useScroll({ target: containerRef, offset: ["start end", "end start"] });
  return (
    <section id="scenarios" ref={containerRef} className="relative py-24 md:py-32 overflow-hidden"
      style={{ background: BG.scenarios }} data-testid="scenarios-section">
      <div className="max-w-5xl mx-auto px-6 mb-14">
        <Reveal>
          <span className="text-[13px] font-semibold tracking-wider uppercase mb-3 block text-amber-700">Practice Scenarios</span>
        </Reveal>
        <WordReveal text="Real conversations for real life" as="h2"
          className="text-3xl md:text-5xl font-bold tracking-tight text-amber-950 mb-4" />
        <Reveal delay={0.1}>
          <p className="text-[15px] max-w-xl text-amber-800/60">Pick a scenario and mumble drops you into a realistic role-play. Practice ordering coffee in Paris or nailing a job interview in Tokyo.</p>
        </Reveal>
      </div>
      <div className="max-w-4xl mx-auto px-6">
        <div className="flex flex-wrap gap-3 md:gap-4 justify-center">
          {SCENARIOS.map((s, i) => (
            <ScenarioTag key={s.label} s={s} i={i} scrollProgress={scrollYProgress} />
          ))}
        </div>
      </div>
    </section>
  );
}

function ScenarioTag({ s, i, scrollProgress }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  const y = useTransform(scrollProgress, [0, 1], [16 + i * 6, -(8 + i * 5)]);
  return (
    <motion.div ref={ref} style={{ y }}
      initial={{ opacity: 0, scale: 0.85 }}
      animate={inView ? { opacity: 1, scale: 1 } : {}}
      transition={{ delay: i * 0.07, duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ scale: 1.08, y: -3 }} className="cursor-default">
      <div className="flex items-center gap-2.5 px-5 py-3 rounded-full bg-white border border-amber-200 shadow-sm hover:shadow transition-shadow duration-200 group">
        <s.icon className="w-4 h-4 transition-transform duration-200 group-hover:scale-110" style={{ color: s.color }} />
        <span className="text-sm font-medium text-amber-900">{s.label}</span>
      </div>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════
   PRICING — pink bg, 3 tier cards
   ═══════════════════════════════════════════ */
const PLAN_FEATURES = [
  "All 4 AI agents (Tutor, Planner, Testing, Revision)",
  "Voice & text conversations",
  "50+ languages",
  "Scenarios & role-play",
  "Vocabulary saving",
  "Grammar & pronunciation tools",
  "Web search in lessons",
  "Dashboard & progress tracking",
];

const PRICING_PLANS = [
  {
    id: "free",
    name: "Free",
    price: 0,
    credits: 100,
    accent: "#6366f1",
    accentLight: "rgba(99,102,241,0.1)",
    borderColor: "rgba(99,102,241,0.2)",
    icon: Sparkles,
    highlight: false,
    extras: ["Up to 3 active conversations", "~20 voice or ~50 text turns/month"],
  },
  {
    id: "plus",
    name: "Plus",
    price: 14.99,
    credits: 1000,
    accent: "#be185d",
    accentLight: "rgba(190,24,93,0.08)",
    borderColor: "rgba(190,24,93,0.25)",
    icon: Zap,
    highlight: true,
    extras: ["Up to 10 active conversations", "~200 voice or ~500 text turns/month"],
  },
  {
    id: "pro",
    name: "Pro",
    price: 29.99,
    credits: 5000,
    accent: "#7c3aed",
    accentLight: "rgba(124,58,237,0.08)",
    borderColor: "rgba(124,58,237,0.25)",
    icon: Crown,
    highlight: false,
    extras: ["Unlimited conversations", "~1,000 voice or ~2,500 text turns/month", "Priority response"],
  },
];

function PricingCard({ plan, i }) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });

  const handleClick = () => {
    if (plan.price === 0) {
      navigate(user ? "/chat" : "/auth");
    } else {
      navigate(user ? `/pricing?plan=${plan.id}` : `/auth?redirect=/pricing&plan=${plan.id}`);
    }
  };

  return (
    <motion.div
      ref={ref}
      className="relative flex flex-col rounded-2xl p-6 md:p-8"
      style={{
        background: plan.highlight ? "white" : "rgba(255,255,255,0.7)",
        border: `2px solid ${plan.highlight ? plan.accent : plan.borderColor}`,
        backdropFilter: "blur(12px)",
        boxShadow: plan.highlight
          ? `0 8px 40px rgba(190,24,93,0.15), 0 0 0 1px rgba(190,24,93,0.1)`
          : "0 2px 12px rgba(0,0,0,0.04)",
      }}
      initial={{ opacity: 0, y: 32, scale: 0.95 }}
      animate={inView ? { opacity: 1, y: 0, scale: 1 } : {}}
      transition={{ delay: i * 0.1, duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -4, boxShadow: `0 12px 48px ${plan.accentLight}, 0 0 0 2px ${plan.borderColor}` }}
      data-testid={`pricing-card-${plan.id}`}
    >
      {plan.highlight && (
        <motion.span
          className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-[10px] font-semibold tracking-wider uppercase text-white"
          style={{ background: plan.accent }}
          initial={{ opacity: 0, y: 8 }} animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.3 }}
          data-testid="pricing-popular-badge"
        >
          Most Popular
        </motion.span>
      )}

      <div className="flex items-center gap-2 mb-4">
        <plan.icon className="w-5 h-5" style={{ color: plan.accent }} />
        <h3 className="text-lg font-semibold tracking-tight text-slate-900" style={{ fontFamily: "Sora" }}>{plan.name}</h3>
      </div>

      <div className="mb-1">
        <span className="text-4xl font-bold tracking-tight text-slate-900" style={{ fontFamily: "Sora" }}>
          {plan.price === 0 ? "$0" : `$${plan.price}`}
        </span>
        <span className="text-sm text-slate-400 ml-1">/month</span>
      </div>
      <p className="text-sm text-slate-500 mb-6">{plan.credits.toLocaleString()} credits/month</p>

      <div className="flex-1 space-y-2.5 mb-6">
        {plan.extras.map((f, j) => (
          <div key={j} className="flex items-start gap-2">
            <Check className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: plan.accent }} />
            <span className="text-[13px] text-slate-600 leading-snug">{f}</span>
          </div>
        ))}
        <div className="pt-2 mt-2 border-t border-slate-100">
          {PLAN_FEATURES.map((f, j) => (
            <div key={j} className="flex items-start gap-2 py-0.5">
              <Check className="w-3.5 h-3.5 mt-0.5 flex-shrink-0 text-emerald-500" />
              <span className="text-[12px] text-slate-400 leading-snug">{f}</span>
            </div>
          ))}
        </div>
      </div>

      <motion.button
        onClick={handleClick}
        className="w-full rounded-full py-3 text-sm font-semibold transition-all duration-200 overflow-hidden relative group"
        style={{
          background: plan.highlight ? plan.accent : "transparent",
          color: plan.highlight ? "white" : plan.accent,
          border: plan.highlight ? "none" : `2px solid ${plan.borderColor}`,
          boxShadow: plan.highlight ? `0 4px 20px ${plan.accentLight}` : "none",
        }}
        whileHover={{
          scale: 1.02,
          boxShadow: plan.highlight
            ? `0 6px 28px rgba(190,24,93,0.3)`
            : `0 4px 20px ${plan.accentLight}`,
        }}
        whileTap={{ scale: 0.97 }}
        data-testid={`pricing-btn-${plan.id}`}
      >
        <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
        <span className="relative">
          {plan.price === 0 ? "Start for Free" : `Get ${plan.name}`}
        </span>
      </motion.button>
    </motion.div>
  );
}

function PricingSection() {
  return (
    <section id="pricing" className="relative py-24 md:py-32" style={{ background: BG.pricing }} data-testid="pricing-section">
      <div className="max-w-5xl mx-auto px-6">
        <div className="text-center mb-14">
          <Reveal>
            <span className="text-[13px] font-semibold tracking-wider uppercase mb-3 block text-rose-600">Pricing</span>
          </Reveal>
          <WordReveal text="Simple plans, full access" as="h2"
            className="text-3xl md:text-5xl font-bold tracking-tight text-rose-950 mb-4" />
          <Reveal delay={0.1}>
            <p className="text-[15px] max-w-lg mx-auto text-rose-800/60">
              Every plan includes all features. Pick the volume that fits your practice routine.
            </p>
          </Reveal>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-5 max-w-4xl mx-auto">
          {PRICING_PLANS.map((plan, i) => (
            <PricingCard key={plan.id} plan={plan} i={i} />
          ))}
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════
   CTA — clean with mesh
   ═══════════════════════════════════════════ */
function CTASection() {
  const navigate = useNavigate();
  return (
    <section className="relative py-32 md:py-44 overflow-hidden" style={{ background: BG.cta }} data-testid="cta-section">
      <MeshBackground />
      <div className="relative max-w-3xl mx-auto px-6 text-center z-10">
        <Reveal>
          <motion.div className="inline-block mb-7"
            animate={{ scale: [1, 1.06, 1] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}>
            <WaveformLogo size={44} className="text-indigo-600" />
          </motion.div>
        </Reveal>
        <WordReveal text="Stop studying. Start speaking." as="h2"
          className="text-4xl md:text-6xl font-bold tracking-tighter text-slate-900 mb-5" />
        <Reveal delay={0.15}>
          <p className="text-lg text-slate-600 leading-relaxed max-w-xl mx-auto mb-10">
            Language apps teach you to tap buttons. mumble teaches you to <span className="text-emerald-600 font-semibold">actually talk</span>.
            100 free credits. 4 AI agents. Start in 10 seconds.
          </p>
        </Reveal>
        <Reveal delay={0.25}>
          <motion.button onClick={() => navigate("/chat")}
            className="relative rounded-full px-11 py-5 text-[15px] font-semibold bg-indigo-600 text-white overflow-hidden group shadow-[0_6px_32px_rgba(99,102,241,0.35)]"
            whileHover={{ scale: 1.05, boxShadow: "0 8px 40px rgba(99,102,241,0.5)" }}
            whileTap={{ scale: 0.97 }}
            transition={{ type: "spring", stiffness: 400, damping: 17 }}
            data-testid="cta-start-btn">
            <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/25 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
            <span className="relative flex items-center gap-2">
              Begin your first lesson <ArrowRight className="w-5 h-5 transition-transform duration-300 group-hover:translate-x-1" />
            </span>
          </motion.button>
        </Reveal>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════
   FOOTER — dark contrast
   ═══════════════════════════════════════════ */
function Footer() {
  const navigate = useNavigate();
  return (
    <footer className="py-8" style={{ background: BG.footer }} data-testid="footer">
      <div className="max-w-5xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-1.5">
          <WaveformLogo size={18} className="text-indigo-300" />
          <span className="text-xs font-medium text-indigo-200" style={{ fontFamily: "Sora" }}>mumble</span>
        </div>
        <div className="flex items-center gap-6">
          {[{ label: "Practice", href: "/chat" }, { label: "Dashboard", href: "/dashboard" }, { label: "Vocabulary", href: "/vocabulary" }].map(l => (
            <button key={l.href} onClick={() => navigate(l.href)}
              className="text-xs text-indigo-300/60 hover:text-white transition-colors duration-200">{l.label}</button>
          ))}
        </div>
        <p className="text-xs text-indigo-300/40">AI-powered language learning</p>
      </div>
    </footer>
  );
}

/* ═══════════════════════════════════════════
   PAGE
   ═══════════════════════════════════════════ */
export default function LandingPage() {
  return (
    <div className="min-h-screen" style={{ fontFamily: "DM Sans, sans-serif" }}>
      <ScrollProgress />
      <Navbar />
      <HeroSection />
      <FeaturesSection />
      <HowItWorksSection />
      <AgentsSection />
      <DemoSection />
      <ScenariosSection />
      <PricingSection />
      <CTASection />
      <Footer />
    </div>
  );
}
