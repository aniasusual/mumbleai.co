import { useNavigate } from "react-router-dom";
import { useRef, useEffect, useState } from "react";
import {
  motion, useScroll, useTransform, useSpring, useInView,
} from "framer-motion";
import { Button } from "@/components/ui/button";
import { WaveformLogo } from "@/components/WaveformLogo";
import {
  Mic, ArrowRight, Brain, AudioLines, Target, Volume2,
  Briefcase, Plane, UtensilsCrossed, MessageSquare, GraduationCap,
  Sparkles, BookOpen, ChevronDown,
} from "lucide-react";

/* ═══════════════════════════════════════════
   LIGHT SECTION PALETTES
   ═══════════════════════════════════════════ */
const BG = {
  hero:      "#fafafa",
  features:  "#f0fdf4",    // soft green tint
  tools:     "#eff6ff",    // soft blue tint
  demo:      "#faf5ff",    // soft violet tint
  scenarios: "#fffbeb",    // soft amber tint
  cta:       "#f8fafc",
  footer:    "#f1f5f9",
};

const TXT = {
  heading: "#0f172a",
  body:    "#475569",
  muted:   "#94a3b8",
  accent:  "#4f46e5",
};

/* ═══════════════════════════════════════════
   SCROLL PROGRESS
   ═══════════════════════════════════════════ */
function ScrollProgress() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 100, damping: 30 });
  return (
    <motion.div
      className="fixed top-0 left-0 right-0 h-[2px] z-[60] origin-left"
      style={{ scaleX, background: "linear-gradient(90deg, #6366f1, #10b981, #f472b6)" }}
    />
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
   NAVBAR — clean, flat, no pill
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
    <motion.nav
      className="fixed top-0 left-0 right-0 z-50 transition-all duration-300"
      style={{
        background: scrolled ? "rgba(250,250,250,0.85)" : "transparent",
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
          <span className="text-[15px] font-semibold tracking-tight" style={{ fontFamily: "Sora", color: TXT.heading }}>mumble</span>
        </button>

        <div className="hidden md:flex items-center gap-7">
          {["Features", "How it works", "Scenarios"].map(l => (
            <a key={l} href={`#${l.toLowerCase().replace(/ /g, "-")}`}
              className="text-[13px] font-medium transition-colors duration-200 hover:text-indigo-600" style={{ color: TXT.body }}>{l}</a>
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
   HERO
   ═══════════════════════════════════════════ */
const GREETINGS = [
  "Bonjour", "Hola", "Ciao", "Hallo", "Olá", "こんにちは", "안녕하세요",
  "مرحبا", "Привет", "你好", "नमस्ते", "สวัสดี", "Merhaba", "Xin chào", "Γεια σου",
];

function GreetingTicker() {
  const doubled = [...GREETINGS, ...GREETINGS];
  return (
    <div className="overflow-hidden py-3 opacity-60">
      <motion.div className="flex gap-4 whitespace-nowrap"
        animate={{ x: ["0%", "-50%"] }}
        transition={{ duration: 24, repeat: Infinity, ease: "linear" }}>
        {doubled.map((g, i) => (
          <span key={i} className="text-[13px] px-3.5 py-1 rounded-full border text-slate-500" style={{ borderColor: "rgba(0,0,0,0.08)" }}>{g}</span>
        ))}
      </motion.div>
    </div>
  );
}

function HeroSection() {
  const navigate = useNavigate();
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], [0, 120]);
  const opacity = useTransform(scrollYProgress, [0, 0.6], [1, 0]);

  return (
    <section ref={ref} className="relative min-h-screen flex flex-col justify-center pt-16 pb-8" style={{ background: BG.hero }} data-testid="hero-section">
      {/* Soft gradient orbs */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] pointer-events-none rounded-full"
        style={{ background: "radial-gradient(circle, rgba(99,102,241,0.06) 0%, transparent 60%)" }} />
      <div className="absolute bottom-1/3 right-1/4 w-[400px] h-[400px] pointer-events-none rounded-full"
        style={{ background: "radial-gradient(circle, rgba(16,185,129,0.04) 0%, transparent 60%)" }} />

      <motion.div className="relative max-w-4xl mx-auto px-6 w-full text-center" style={{ y, opacity }}>
        <motion.span
          className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-[11px] font-medium tracking-wider uppercase mb-8"
          style={{ color: TXT.accent, background: "rgba(99,102,241,0.08)", border: "1px solid rgba(99,102,241,0.12)" }}
          initial={{ opacity: 0, scale: 0.85 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5 }}>
          <Sparkles className="w-3 h-3" /> AI Language Tutor
        </motion.span>

        <WordReveal
          text="Learn any language by speaking it"
          className="text-5xl md:text-7xl font-bold tracking-tighter leading-[1.08] mb-6"
          style={{ color: TXT.heading }}
        />

        <motion.p className="text-lg md:text-xl leading-relaxed max-w-2xl mx-auto mb-10"
          style={{ color: TXT.body }}
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7, duration: 0.5 }}>
          Voice-first conversations with an AI that listens, corrects, and adapts.{" "}
          <span className="text-emerald-600 font-medium">50+ languages</span>. Real-time feedback.
        </motion.p>

        <motion.div className="flex flex-col sm:flex-row gap-3 justify-center"
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.9, duration: 0.5 }}>
          <Button onClick={() => navigate("/chat")}
            className="rounded-lg px-7 py-5 text-sm font-semibold bg-indigo-600 hover:bg-indigo-700 text-white transition-all duration-200 border-0 shadow-md hover:-translate-y-px"
            data-testid="hero-start-btn">
            Start a conversation <ArrowRight className="ml-2 w-4 h-4" />
          </Button>
          <Button variant="outline" onClick={() => navigate("/dashboard")}
            className="rounded-lg px-7 py-5 text-sm font-medium text-slate-600 border-slate-200 hover:bg-slate-50 transition-all duration-200"
            data-testid="hero-dashboard-btn">View Dashboard</Button>
        </motion.div>

        <div className="mt-20"><GreetingTicker /></div>
      </motion.div>

      <motion.div className="absolute bottom-6 left-1/2 -translate-x-1/2"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.3 }}>
        <motion.div animate={{ y: [0, 6, 0] }} transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}>
          <ChevronDown className="w-5 h-5 text-slate-300" />
        </motion.div>
      </motion.div>
    </section>
  );
}

/* ═══════════════════════════════════════════
   FEATURES — inline strips, no cards
   ═══════════════════════════════════════════ */
const FEATURES = [
  { icon: Mic, label: "Voice-First", desc: "Speak naturally in any language. mumble listens, understands, and responds with natural voice.", accent: "#6366f1" },
  { icon: AudioLines, label: "Karaoke Tracking", desc: "Every word highlights as the AI speaks — connecting sound to text in real-time.", accent: "#ec4899" },
  { icon: Brain, label: "Live AI Tools", desc: "Grammar, vocabulary, and pronunciation tools activate live as you talk.", accent: "#10b981" },
  { icon: GraduationCap, label: "Adaptive Curriculum", desc: "A study plan built around your goals that evolves as you improve.", accent: "#f59e0b" },
];

function FeaturesSection() {
  return (
    <section id="features" className="relative py-24 md:py-32" style={{ background: BG.features }} data-testid="features-section">
      <div className="max-w-5xl mx-auto px-6">
        <Reveal>
          <span className="text-[13px] font-medium tracking-wider uppercase mb-3 block" style={{ color: "#10b981" }}>Core Features</span>
        </Reveal>
        <WordReveal text="Built different from day one" as="h2"
          className="text-3xl md:text-5xl font-bold tracking-tight mb-14" style={{ color: TXT.heading }} />

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
      className={`group py-7 md:py-9 ${!isLast ? "border-b" : ""}`}
      style={{ borderColor: "rgba(0,0,0,0.06)" }}
      initial={{ opacity: 0, x: i % 2 === 0 ? -30 : 30 }}
      animate={inView ? { opacity: 1, x: 0 } : {}}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}>
      <div className="flex flex-col md:flex-row md:items-center gap-3 md:gap-8">
        <div className="flex items-center gap-4 md:w-60 flex-shrink-0">
          <span className="text-[11px] font-mono" style={{ color: TXT.muted }}>0{i + 1}</span>
          <motion.div whileHover={{ scale: 1.15, rotate: 6 }}
            transition={{ type: "spring", stiffness: 300, damping: 15 }}>
            <f.icon className="w-5 h-5" style={{ color: f.accent }} />
          </motion.div>
          <h3 className="text-lg md:text-xl font-semibold tracking-tight" style={{ fontFamily: "Sora", color: TXT.heading }}>{f.label}</h3>
        </div>
        <p className="text-sm md:text-[15px] leading-relaxed md:flex-1 max-w-xl" style={{ color: TXT.body }}>{f.desc}</p>
        <motion.div className="hidden md:block w-10 h-[2px] rounded-full flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity duration-400"
          style={{ background: f.accent }} />
      </div>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════
   HOW IT WORKS — vertical timeline
   ═══════════════════════════════════════════ */
const STEPS = [
  { icon: Target, title: "Speak naturally", desc: "Talk in your target language. mumble transcribes and understands your intent instantly." },
  { icon: Brain, title: "AI analyzes in real-time", desc: "Grammar checkers, vocabulary lookups, and pronunciation tools activate behind the scenes." },
  { icon: Volume2, title: "Get spoken feedback", desc: "Hear corrections with karaoke-style word highlights. Connect sound to meaning." },
  { icon: GraduationCap, title: "Level up automatically", desc: "Your curriculum adapts. Lessons get harder as you improve." },
];

function HowItWorksSection() {
  return (
    <section id="how-it-works" className="relative py-24 md:py-32" style={{ background: BG.tools }} data-testid="tools-section">
      <div className="max-w-4xl mx-auto px-6">
        <div className="text-center mb-16">
          <Reveal>
            <span className="text-[13px] font-medium tracking-wider uppercase mb-3 block" style={{ color: "#3b82f6" }}>How it works</span>
          </Reveal>
          <WordReveal text="Four steps to fluency" as="h2"
            className="text-3xl md:text-5xl font-bold tracking-tight" style={{ color: TXT.heading }} />
        </div>

        <div className="relative">
          <div className="absolute left-6 md:left-7 top-0 bottom-0 w-px" style={{ background: "linear-gradient(to bottom, #93c5fd, #c4b5fd, transparent)" }} />
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
        <motion.div className="w-10 h-10 md:w-11 md:h-11 rounded-full flex items-center justify-center bg-white border shadow-sm"
          style={{ borderColor: "rgba(0,0,0,0.08)" }}
          whileHover={{ scale: 1.1, boxShadow: "0 4px 12px rgba(99,102,241,0.12)" }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}>
          <s.icon className="w-4.5 h-4.5 text-blue-500" />
        </motion.div>
      </div>
      <div className="pb-1">
        <span className="text-[10px] font-mono tracking-wider" style={{ color: "#93c5fd" }}>STEP 0{i + 1}</span>
        <h3 className="text-base md:text-lg font-semibold tracking-tight mt-0.5 mb-1.5" style={{ fontFamily: "Sora", color: TXT.heading }}>{s.title}</h3>
        <p className="text-sm leading-relaxed max-w-md" style={{ color: TXT.body }}>{s.desc}</p>
      </div>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════
   DEMO — floating messages, no wrapper
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
      <div className="flex items-center gap-2 mb-4 pb-3 border-b" style={{ borderColor: "rgba(0,0,0,0.06)" }}>
        <WaveformLogo size={18} className="text-violet-500" />
        <span className="text-xs font-medium" style={{ fontFamily: "Sora", color: TXT.muted }}>mumble</span>
      </div>
      {DEMO_MSGS.map((msg, i) => {
        if (i >= count) return null;
        if (msg.role === "user") return (
          <motion.div key={i} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="flex justify-end">
            <div className="text-[13px] px-4 py-2.5 rounded-2xl rounded-br-sm bg-indigo-50 text-indigo-700 max-w-[85%]">{msg.text}</div>
          </motion.div>
        );
        if (msg.role === "tool") return (
          <motion.div key={i} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-2 pl-1">
            <motion.div className="w-1.5 h-1.5 rounded-full bg-emerald-400" animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 1, repeat: 2 }} />
            <span className="text-[11px] italic" style={{ color: TXT.muted }}>{msg.text}</span>
          </motion.div>
        );
        return (
          <motion.div key={i} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5 }} className="flex gap-2.5">
            <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 bg-violet-50">
              <WaveformLogo size={12} className="text-violet-500" />
            </div>
            <div className="text-[13px] px-4 py-2.5 rounded-2xl rounded-bl-sm bg-white border max-w-[85%] shadow-sm" style={{ borderColor: "rgba(0,0,0,0.06)" }}>
              <span className="text-emerald-600 font-semibold">"Estoy feliz"</span>
              <span style={{ color: TXT.body }}> — </span>
              <span className="font-medium" style={{ color: TXT.heading }}>estar</span>
              <span style={{ color: TXT.body }}> is used for emotions because they are temporary states.</span>
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
              <span className="text-[13px] font-medium tracking-wider uppercase mb-3 block" style={{ color: "#8b5cf6" }}>See it in action</span>
            </Reveal>
            <WordReveal text="A conversation, not a classroom" as="h2"
              className="text-3xl md:text-5xl font-bold tracking-tight mb-5" style={{ color: TXT.heading }} />
            <Reveal delay={0.15}>
              <p className="text-[15px] leading-relaxed mb-8" style={{ color: TXT.body }}>
                Ask anything. mumble responds with context-aware corrections, vocabulary insights, and pronunciation guides — streamed in real-time.
              </p>
            </Reveal>
            <Reveal delay={0.25}>
              <button onClick={() => navigate("/chat")}
                className="inline-flex items-center gap-2 text-sm font-semibold text-violet-600 hover:text-violet-700 transition-colors duration-200 group"
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
   SCENARIOS — floating pill tags
   ═══════════════════════════════════════════ */
const SCENARIOS = [
  { icon: Briefcase, label: "Job Interview", color: "#f59e0b" },
  { icon: Plane, label: "Travel", color: "#10b981" },
  { icon: UtensilsCrossed, label: "Restaurant", color: "#ec4899" },
  { icon: MessageSquare, label: "Small Talk", color: "#6366f1" },
  { icon: BookOpen, label: "Business", color: "#f97316" },
];

function ScenariosSection() {
  const containerRef = useRef(null);
  const { scrollYProgress } = useScroll({ target: containerRef, offset: ["start end", "end start"] });

  return (
    <section id="scenarios" ref={containerRef} className="relative py-24 md:py-32 overflow-hidden" style={{ background: BG.scenarios }} data-testid="scenarios-section">
      <div className="max-w-5xl mx-auto px-6 mb-14">
        <Reveal>
          <span className="text-[13px] font-medium tracking-wider uppercase mb-3 block" style={{ color: "#f59e0b" }}>Practice Scenarios</span>
        </Reveal>
        <WordReveal text="Real conversations for real life" as="h2"
          className="text-3xl md:text-5xl font-bold tracking-tight mb-4" style={{ color: TXT.heading }} />
        <Reveal delay={0.1}>
          <p className="text-[15px] max-w-xl" style={{ color: TXT.body }}>Pick a scenario and mumble drops you into a realistic conversation.</p>
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
      whileHover={{ scale: 1.06, y: -3 }}
      className="cursor-default">
      <div className="flex items-center gap-2.5 px-5 py-3 rounded-full bg-white border shadow-sm hover:shadow transition-shadow duration-200 group"
        style={{ borderColor: "rgba(0,0,0,0.06)" }}>
        <s.icon className="w-4 h-4 transition-transform duration-200 group-hover:scale-110" style={{ color: s.color }} />
        <span className="text-sm font-medium" style={{ color: TXT.heading }}>{s.label}</span>
      </div>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════
   CTA
   ═══════════════════════════════════════════ */
function CTASection() {
  const navigate = useNavigate();
  return (
    <section className="relative py-32 md:py-44 overflow-hidden" style={{ background: BG.cta }} data-testid="cta-section">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] pointer-events-none rounded-full"
        style={{ background: "radial-gradient(circle, rgba(99,102,241,0.05) 0%, transparent 60%)" }} />
      <div className="relative max-w-3xl mx-auto px-6 text-center">
        <Reveal>
          <motion.div className="inline-block mb-7"
            animate={{ scale: [1, 1.06, 1] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}>
            <WaveformLogo size={44} className="text-indigo-500" />
          </motion.div>
        </Reveal>
        <WordReveal text="Stop studying. Start speaking." as="h2"
          className="text-4xl md:text-6xl font-bold tracking-tighter mb-5" style={{ color: TXT.heading }} />
        <Reveal delay={0.15}>
          <p className="text-lg leading-relaxed max-w-xl mx-auto mb-10" style={{ color: TXT.body }}>
            The best way to learn a language is to use it. mumble gives you a patient,
            always-available partner who adapts to <span className="text-emerald-600 font-medium">your</span> level.
          </p>
        </Reveal>
        <Reveal delay={0.25}>
          <Button onClick={() => navigate("/chat")}
            className="rounded-lg px-9 py-6 text-[15px] font-semibold bg-indigo-600 hover:bg-indigo-700 text-white transition-all duration-200 border-0 shadow-lg hover:-translate-y-0.5"
            data-testid="cta-start-btn">
            Begin your first lesson <ArrowRight className="ml-2 w-4 h-4" />
          </Button>
        </Reveal>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════
   FOOTER
   ═══════════════════════════════════════════ */
function Footer() {
  const navigate = useNavigate();
  return (
    <footer className="py-7 border-t" style={{ background: BG.footer, borderColor: "rgba(0,0,0,0.06)" }} data-testid="footer">
      <div className="max-w-5xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-1.5">
          <WaveformLogo size={18} className="text-indigo-400" />
          <span className="text-xs font-medium" style={{ fontFamily: "Sora", color: TXT.muted }}>mumble</span>
        </div>
        <div className="flex items-center gap-6">
          {[{ label: "Practice", href: "/chat" }, { label: "Dashboard", href: "/dashboard" }, { label: "Vocabulary", href: "/vocabulary" }].map(l => (
            <button key={l.href} onClick={() => navigate(l.href)}
              className="text-xs hover:text-indigo-600 transition-colors duration-200" style={{ color: TXT.muted }}>{l.label}</button>
          ))}
        </div>
        <p className="text-xs" style={{ color: TXT.muted }}>AI-powered language learning</p>
      </div>
    </footer>
  );
}

/* ═══════════════════════════════════════════
   PAGE
   ═══════════════════════════════════════════ */
export default function LandingPage() {
  return (
    <div className="min-h-screen" style={{ fontFamily: "DM Sans, sans-serif", color: TXT.heading }}>
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
