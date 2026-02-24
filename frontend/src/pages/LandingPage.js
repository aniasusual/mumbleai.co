import { useNavigate } from "react-router-dom";
import { useRef, useEffect, useState, useMemo } from "react";
import {
  motion, useScroll, useTransform, useSpring, useInView,
  AnimatePresence,
} from "framer-motion";
import { Button } from "@/components/ui/button";
import { WaveformLogo } from "@/components/WaveformLogo";
import {
  Mic, ArrowRight, Brain, AudioLines, Target, Volume2,
  Briefcase, Plane, UtensilsCrossed, MessageSquare, GraduationCap,
  Sparkles, BookOpen, ChevronDown,
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
const HELLOS = ["Hello", "Bonjour", "Hola", "Ciao", "こんにちは", "Hallo", "Olá", "안녕", "مرحبا", "Привет"];

function MorphingHello() {
  const [idx, setIdx] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setIdx(p => (p + 1) % HELLOS.length), 2200);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="inline-block relative h-[1.15em] overflow-hidden align-bottom min-w-[200px]">
      <AnimatePresence mode="wait">
        <motion.span key={idx}
          className="absolute left-0 bg-gradient-to-r from-indigo-600 via-pink-500 to-emerald-500 bg-clip-text text-transparent"
          initial={{ y: 40, opacity: 0, filter: "blur(4px)" }}
          animate={{ y: 0, opacity: 1, filter: "blur(0px)" }}
          exit={{ y: -40, opacity: 0, filter: "blur(4px)" }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        >{HELLOS[idx]}</motion.span>
      </AnimatePresence>
    </div>
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
          {["Features", "How it works", "Scenarios"].map(l => (
            <a key={l} href={`#${l.toLowerCase().replace(/ /g, "-")}`}
              className="text-[13px] font-medium text-slate-500 transition-colors duration-200 hover:text-indigo-600">{l}</a>
          ))}
        </div>
        <button onClick={() => navigate("/chat")}
          className="text-[13px] font-semibold px-5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white transition-all duration-200 hover:-translate-y-px shadow-sm"
          data-testid="nav-start-btn">Get Started</button>
      </div>
    </motion.nav>
  );
}

/* ═══════════════════════════════════════════
   HERO — mesh gradient + morphing text
   ═══════════════════════════════════════════ */
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
          <Sparkles className="w-3 h-3" /> AI Language Tutor
        </motion.span>

        <h1 className="text-5xl md:text-7xl font-bold tracking-tighter leading-[1.08] text-slate-900 mb-6" style={{ fontFamily: "Sora" }}>
          <WordReveal text="Say " as="span" className="inline" />
          <MorphingHello />{" "}
          <WordReveal text="in every language" as="span" className="inline" />
        </h1>

        <motion.p className="text-lg md:text-xl text-slate-600 leading-relaxed max-w-2xl mx-auto mb-10"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7 }}>
          Voice-first conversations with an AI that listens, corrects, and adapts.{" "}
          <span className="text-emerald-600 font-semibold">50+ languages</span>. Real-time feedback.
        </motion.p>

        {/* Sound wave */}
        <motion.div className="flex justify-center mb-10"
          initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.9, duration: 0.6 }}>
          <SoundWave barCount={32} color="#6366f1" height={40} />
        </motion.div>

        <motion.div className="flex flex-col sm:flex-row gap-3 justify-center"
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.1 }}>
          <Button onClick={() => navigate("/chat")}
            className="rounded-full px-8 py-6 text-sm font-semibold bg-indigo-600 hover:bg-indigo-700 text-white transition-all duration-200 border-0 shadow-lg shadow-indigo-200 hover:-translate-y-0.5"
            data-testid="hero-start-btn">
            Start a conversation <ArrowRight className="ml-2 w-4 h-4" />
          </Button>
          <Button variant="outline" onClick={() => navigate("/dashboard")}
            className="rounded-full px-8 py-6 text-sm font-medium text-slate-600 border-slate-200 hover:bg-white transition-all duration-200"
            data-testid="hero-dashboard-btn">View Dashboard</Button>
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
  { icon: Mic, label: "Voice-First", desc: "Speak naturally in any language. mumble listens, understands, and responds with natural voice.", accent: "#059669" },
  { icon: AudioLines, label: "Karaoke Tracking", desc: "Every word highlights as the AI speaks — connecting sound to text in real-time.", accent: "#be185d" },
  { icon: Brain, label: "Live AI Tools", desc: "Grammar, vocabulary, and pronunciation tools activate live as you talk.", accent: "#4338ca" },
  { icon: GraduationCap, label: "Adaptive Curriculum", desc: "A study plan built around your goals that evolves as you improve.", accent: "#b45309" },
];

function FeaturesSection() {
  return (
    <section id="features" className="relative py-24 md:py-32" style={{ background: BG.features }} data-testid="features-section">
      <div className="max-w-5xl mx-auto px-6">
        <Reveal>
          <span className="text-[13px] font-semibold tracking-wider uppercase mb-3 block text-emerald-700">Core Features</span>
        </Reveal>
        <WordReveal text="Built different from day one" as="h2"
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
  return (
    <motion.div ref={ref}
      className={`group py-7 md:py-9 ${!isLast ? "border-b border-emerald-300/40" : ""}`}
      initial={{ opacity: 0, x: i % 2 === 0 ? -30 : 30 }}
      animate={inView ? { opacity: 1, x: 0 } : {}}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}>
      <div className="flex flex-col md:flex-row md:items-center gap-3 md:gap-8">
        <div className="flex items-center gap-4 md:w-64 flex-shrink-0">
          <span className="text-[11px] font-mono text-emerald-600/50">0{i + 1}</span>
          <motion.div whileHover={{ scale: 1.2, rotate: 8 }}
            transition={{ type: "spring", stiffness: 300, damping: 15 }}>
            <f.icon className="w-5 h-5" style={{ color: f.accent }} />
          </motion.div>
          <h3 className="text-lg md:text-xl font-semibold tracking-tight text-emerald-950" style={{ fontFamily: "Sora" }}>{f.label}</h3>
        </div>
        <p className="text-sm md:text-[15px] leading-relaxed md:flex-1 max-w-xl text-emerald-800/70">{f.desc}</p>
        <motion.div className="hidden md:block w-10 h-[2px] rounded-full flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity duration-400"
          style={{ background: f.accent }} />
      </div>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════
   HOW IT WORKS — blue bg, timeline
   ═══════════════════════════════════════════ */
const STEPS = [
  { icon: Target, title: "Speak naturally", desc: "Talk in your target language. mumble transcribes and understands your intent." },
  { icon: Brain, title: "AI analyzes in real-time", desc: "Grammar, vocabulary, and pronunciation tools activate behind the scenes." },
  { icon: Volume2, title: "Get spoken feedback", desc: "Hear corrections with karaoke-style word highlights." },
  { icon: GraduationCap, title: "Level up automatically", desc: "Your curriculum adapts and lessons get harder as you improve." },
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
      transition={{ delay: i * 0.1, duration: 0.55, ease: [0.22, 1, 0.36, 1] }}>
      <div className="relative z-10 flex-shrink-0 w-12 md:w-14 flex items-start justify-center pt-0.5">
        <motion.div className="w-11 h-11 rounded-full flex items-center justify-center bg-white border-2 border-blue-200 shadow-sm"
          whileHover={{ scale: 1.1, boxShadow: "0 4px 16px rgba(59,130,246,0.2)" }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}>
          <s.icon className="w-5 h-5 text-blue-600" />
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
   DEMO — violet bg, chat messages
   ═══════════════════════════════════════════ */
const DEMO_MSGS = [
  { role: "user", text: "How do I say 'I am happy' in Spanish?" },
  { role: "tool", text: "Analyzing grammar..." },
  { role: "tool", text: "Looking up vocabulary..." },
  { role: "ai", text: '"Estoy feliz" — estar is used for emotions because they are temporary states.' },
];

function DemoChat() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!inView) return;
    let idx = 0;
    const t = setInterval(() => { idx++; setCount(idx); if (idx >= DEMO_MSGS.length) clearInterval(t); }, 1000);
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
              <p className="text-[15px] leading-relaxed mb-8 text-violet-800/60">
                Ask anything. mumble responds with context-aware corrections, vocabulary insights, and pronunciation guides — streamed in real-time.
              </p>
            </Reveal>
            <Reveal delay={0.25}>
              <button onClick={() => navigate("/chat")}
                className="inline-flex items-center gap-2 text-sm font-semibold text-violet-700 hover:text-violet-900 transition-colors duration-200 group"
                data-testid="demo-try-btn">
                Try it yourself <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1" />
              </button>
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
  { icon: Plane, label: "Travel", color: "#059669" },
  { icon: UtensilsCrossed, label: "Restaurant", color: "#be185d" },
  { icon: MessageSquare, label: "Small Talk", color: "#4338ca" },
  { icon: BookOpen, label: "Business", color: "#c2410c" },
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
          <p className="text-[15px] max-w-xl text-amber-800/60">Pick a scenario and mumble drops you into a realistic conversation.</p>
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
            The best way to learn a language is to use it. mumble gives you a patient,
            always-available partner who adapts to <span className="text-emerald-600 font-semibold">your</span> level.
          </p>
        </Reveal>
        <Reveal delay={0.25}>
          <Button onClick={() => navigate("/chat")}
            className="rounded-full px-10 py-7 text-[15px] font-semibold bg-indigo-600 hover:bg-indigo-700 text-white transition-all duration-200 border-0 shadow-lg shadow-indigo-200 hover:-translate-y-0.5"
            data-testid="cta-start-btn">
            Begin your first lesson <ArrowRight className="ml-2 w-4 h-4" />
          </Button>
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
      <DemoSection />
      <ScenariosSection />
      <CTASection />
      <Footer />
    </div>
  );
}
