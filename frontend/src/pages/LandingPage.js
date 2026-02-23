import { useNavigate } from "react-router-dom";
import { useRef, useEffect, useState } from "react";
import {
  motion, useScroll, useTransform, useInView, useSpring, useMotionValue,
} from "framer-motion";
import { Button } from "@/components/ui/button";
import { WaveformLogo } from "@/components/WaveformLogo";
import {
  Mic, ArrowRight, Brain, Languages, AudioLines, Target, BookOpen, Eye,
  Briefcase, Plane, UtensilsCrossed, MessageSquare, GraduationCap,
} from "lucide-react";

/* ═══════════════════════════════════════════════
   PALETTE — warm near-black + gold accent
   ═══════════════════════════════════════════════ */
const C = {
  bg: "#0a0a0a",
  surface: "#141414",
  border: "rgba(255,255,255,0.06)",
  text: "#ededed",
  muted: "#737373",
  dim: "#525252",
  accent: "#c8a97e",
  accentSoft: "rgba(200,169,126,0.12)",
  accentGlow: "rgba(200,169,126,0.06)",
};

/* ═══════════════════════════════════════════════
   ANIMATION PRIMITIVES
   ═══════════════════════════════════════════════ */
function WordReveal({ text, className, style, as: Tag = "h1" }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  const words = text.split(" ");
  return (
    <Tag ref={ref} className={className} style={style}>
      {words.map((word, i) => (
        <motion.span
          key={i}
          className="inline-block mr-[0.3em]"
          initial={{ opacity: 0, y: 30, filter: "blur(6px)" }}
          animate={inView ? { opacity: 1, y: 0, filter: "blur(0px)" } : {}}
          transition={{ delay: i * 0.05, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        >
          {word}
        </motion.span>
      ))}
    </Tag>
  );
}

function Reveal({ children, className, delay = 0 }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  return (
    <motion.div
      ref={ref} className={className}
      initial={{ opacity: 0, y: 40 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ delay, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════
   GREETING SCROLL — dual columns, opposite directions
   ═══════════════════════════════════════════════ */
const GREETINGS_A = [
  { word: "Bonjour", lang: "French" },
  { word: "Hola", lang: "Spanish" },
  { word: "Ciao", lang: "Italian" },
  { word: "Hej", lang: "Swedish" },
  { word: "Merhaba", lang: "Turkish" },
  { word: "Olá", lang: "Portuguese" },
  { word: "Szia", lang: "Hungarian" },
  { word: "Hallo", lang: "German" },
  { word: "Salut", lang: "Romanian" },
  { word: "Aloha", lang: "Hawaiian" },
];

const GREETINGS_B = [
  { word: "こんにちは", lang: "Japanese" },
  { word: "안녕하세요", lang: "Korean" },
  { word: "مرحبا", lang: "Arabic" },
  { word: "Привет", lang: "Russian" },
  { word: "你好", lang: "Mandarin" },
  { word: "नमस्ते", lang: "Hindi" },
  { word: "สวัสดี", lang: "Thai" },
  { word: "Xin chào", lang: "Vietnamese" },
  { word: "Γεια σου", lang: "Greek" },
  { word: "שלום", lang: "Hebrew" },
];

function ScrollColumn({ items, direction = "up", duration = 25 }) {
  const doubled = [...items, ...items];
  const h = items.length * 72;
  return (
    <div className="relative overflow-hidden h-[420px] w-[180px]">
      {/* Fade masks */}
      <div className="absolute inset-x-0 top-0 h-24 z-10 pointer-events-none"
        style={{ background: `linear-gradient(to bottom, ${C.bg}, transparent)` }} />
      <div className="absolute inset-x-0 bottom-0 h-24 z-10 pointer-events-none"
        style={{ background: `linear-gradient(to top, ${C.bg}, transparent)` }} />

      <motion.div
        className="flex flex-col"
        animate={{ y: direction === "up" ? [0, -h] : [-h, 0] }}
        transition={{ duration, repeat: Infinity, ease: "linear" }}
      >
        {doubled.map((g, i) => (
          <div key={i} className="h-[72px] flex flex-col justify-center px-3">
            <span
              className="text-xl font-medium tracking-tight"
              style={{ color: C.text, opacity: 0.85 }}
            >
              {g.word}
            </span>
            <span className="text-[10px] tracking-wider uppercase mt-0.5" style={{ color: C.dim }}>
              {g.lang}
            </span>
          </div>
        ))}
      </motion.div>
    </div>
  );
}

function GreetingScroll() {
  return (
    <div className="flex gap-3 items-center" data-testid="greeting-scroll">
      <ScrollColumn items={GREETINGS_A} direction="up" duration={22} />
      <ScrollColumn items={GREETINGS_B} direction="down" duration={26} />
    </div>
  );
}

/* ═══════════════════════════════════════════════
   CHAT DEMO
   ═══════════════════════════════════════════════ */
const DEMO_MSGS = [
  { role: "user", text: "How do I say 'I am happy' in Spanish?" },
  { role: "tool", text: "Checking grammar rules..." },
  { role: "tool", text: "Looking up vocabulary..." },
  { role: "ai", text: '"Estoy feliz" — We use estar because emotions are temporary states.' },
];

function ChatDemo() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!inView) return;
    let idx = 0;
    const t = setInterval(() => { idx++; setCount(idx); if (idx >= DEMO_MSGS.length) clearInterval(t); }, 900);
    return () => clearInterval(t);
  }, [inView]);

  return (
    <div
      ref={ref}
      className="w-full max-w-md mx-auto rounded-2xl overflow-hidden"
      style={{ border: `1px solid ${C.border}`, background: C.surface }}
    >
      {/* Title bar */}
      <div className="px-5 py-3 flex items-center gap-2" style={{ borderBottom: `1px solid ${C.border}` }}>
        <WaveformLogo size={18} className="text-[#c8a97e]" />
        <span className="text-xs" style={{ color: C.muted, fontFamily: "Sora, sans-serif" }}>mumble</span>
        <div className="ml-auto flex gap-1.5">
          <div className="w-2 h-2 rounded-full" style={{ background: "rgba(255,255,255,0.08)" }} />
          <div className="w-2 h-2 rounded-full" style={{ background: "rgba(255,255,255,0.08)" }} />
          <div className="w-2 h-2 rounded-full" style={{ background: "rgba(255,255,255,0.08)" }} />
        </div>
      </div>

      {/* Messages */}
      <div className="p-5 space-y-3 min-h-[200px]">
        {DEMO_MSGS.map((msg, i) => {
          if (i >= count) return null;
          if (msg.role === "user") return (
            <motion.div key={i} initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} className="flex justify-end">
              <div className="text-xs px-4 py-2.5 rounded-2xl rounded-br-sm max-w-[80%]"
                style={{ background: C.accentSoft, color: C.accent, border: `1px solid rgba(200,169,126,0.15)` }}>
                {msg.text}
              </div>
            </motion.div>
          );
          if (msg.role === "tool") return (
            <motion.div key={i} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="flex items-center gap-2 pl-2">
              <motion.div className="w-1.5 h-1.5 rounded-full" style={{ background: C.accent }}
                animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 1, repeat: 2 }} />
              <span className="text-[10px] italic" style={{ color: C.dim }}>{msg.text}</span>
            </motion.div>
          );
          return (
            <motion.div key={i} initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5 }} className="flex gap-2">
              <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-1"
                style={{ background: C.accentSoft }}>
                <WaveformLogo size={10} className="text-[#c8a97e]" />
              </div>
              <div className="text-xs px-4 py-2.5 rounded-2xl rounded-bl-sm max-w-[85%]"
                style={{ background: "rgba(255,255,255,0.03)", border: `1px solid ${C.border}` }}>
                <span style={{ color: C.accent, fontWeight: 500 }}>"Estoy feliz"</span>
                <span style={{ color: C.dim }}> — We use </span>
                <span style={{ color: C.text }}>estar</span>
                <span style={{ color: C.dim }}> because emotions are temporary.</span>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════
   FEATURES
   ═══════════════════════════════════════════════ */
const FEATURES = [
  { icon: Mic, title: "Voice-First Conversations", desc: "Speak naturally in any language. mumble listens, understands context, and responds with natural voice." },
  { icon: AudioLines, title: "Karaoke Word Tracking", desc: "Every word highlights as the AI speaks. Follow along, connecting sound to text in real-time." },
  { icon: Brain, title: "Live AI Tools", desc: "Watch grammar checkers, vocabulary lookups, and pronunciation guides activate as you learn." },
  { icon: GraduationCap, title: "Adaptive Curriculum", desc: "A personalized study plan built around your goals, timeline, and interests." },
];

function FeatureRow({ f, i }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  const isEven = i % 2 === 0;

  return (
    <motion.div
      ref={ref}
      className="py-10 md:py-16"
      initial={{ opacity: 0 }}
      animate={inView ? { opacity: 1 } : {}}
      transition={{ duration: 0.8 }}
    >
      <div className={`flex flex-col md:flex-row items-center gap-8 md:gap-16 ${isEven ? "" : "md:flex-row-reverse"}`}>
        <motion.div
          className="flex-shrink-0"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={inView ? { opacity: 1, scale: 1 } : {}}
          transition={{ delay: 0.2, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        >
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center"
            style={{ background: C.accentSoft, border: `1px solid rgba(200,169,126,0.1)` }}
          >
            <f.icon className="w-7 h-7" style={{ color: C.accent }} />
          </div>
        </motion.div>

        <div className={`max-w-lg ${isEven ? "" : "md:text-right"}`}>
          <motion.span
            className="text-[10px] uppercase tracking-[0.25em] font-medium mb-2 block"
            style={{ color: C.dim }}
            initial={{ opacity: 0, x: isEven ? -16 : 16 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ delay: 0.3, duration: 0.5 }}
          >
            0{i + 1}
          </motion.span>
          <motion.h3
            className="text-xl md:text-2xl font-medium mb-3 tracking-tight"
            style={{ fontFamily: "Sora, sans-serif", color: C.text }}
            initial={{ opacity: 0, x: isEven ? -20 : 20 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ delay: 0.35, duration: 0.6 }}
          >
            {f.title}
          </motion.h3>
          <motion.p
            className="text-sm leading-relaxed"
            style={{ color: C.muted }}
            initial={{ opacity: 0, x: isEven ? -16 : 16 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ delay: 0.45, duration: 0.6 }}
          >
            {f.desc}
          </motion.p>
        </div>
      </div>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════
   TOOLS SHOWCASE
   ═══════════════════════════════════════════════ */
const TOOLS = [
  { icon: Target, label: "Grammar" },
  { icon: BookOpen, label: "Vocabulary" },
  { icon: AudioLines, label: "Pronunciation" },
  { icon: Eye, label: "Evaluation" },
];

function ToolsShowcase() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  return (
    <div ref={ref} className="flex flex-wrap justify-center gap-10 md:gap-16">
      {TOOLS.map((t, i) => (
        <motion.div
          key={t.label}
          className="flex flex-col items-center gap-3"
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: i * 0.1, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        >
          <motion.div
            className="w-16 h-16 rounded-2xl flex items-center justify-center cursor-default"
            style={{ background: C.accentSoft, border: `1px solid rgba(200,169,126,0.08)` }}
            whileHover={{ scale: 1.08, background: "rgba(200,169,126,0.18)" }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
          >
            <t.icon className="w-6 h-6" style={{ color: C.accent }} />
          </motion.div>
          <span className="text-xs font-medium" style={{ color: C.muted }}>{t.label}</span>
        </motion.div>
      ))}
    </div>
  );
}

/* ═══════════════════════════════════════════════
   SCENARIOS — horizontal scroll
   ═══════════════════════════════════════════════ */
const SCENARIOS = [
  { icon: Briefcase, title: "Job Interview", desc: "Nail your next interview with confident answers." },
  { icon: Plane, title: "Travel", desc: "Navigate airports, hotels, and directions anywhere." },
  { icon: UtensilsCrossed, title: "Restaurant", desc: "Order like a local. Allergies, specials, and small talk." },
  { icon: MessageSquare, title: "Small Talk", desc: "Master the art of casual conversation with anyone." },
  { icon: Languages, title: "Business", desc: "Present and negotiate professionally in any language." },
];

function ScenariosScroll() {
  const containerRef = useRef(null);
  const { scrollYProgress } = useScroll({ target: containerRef, offset: ["start end", "end start"] });
  const x = useTransform(scrollYProgress, [0, 1], [60, -160]);
  return (
    <div ref={containerRef} className="overflow-hidden">
      <motion.div className="flex gap-4 py-4" style={{ x }}>
        {SCENARIOS.map((s) => (
          <div
            key={s.title}
            className="flex-shrink-0 w-64 rounded-2xl p-6 transition-all duration-500 cursor-default group"
            style={{
              background: C.surface,
              border: `1px solid ${C.border}`,
            }}
          >
            <s.icon className="w-5 h-5 mb-4 transition-colors duration-300 group-hover:text-[#c8a97e]" style={{ color: C.dim }} />
            <h4 className="text-sm font-medium mb-2 tracking-tight" style={{ fontFamily: "Sora, sans-serif", color: C.text }}>{s.title}</h4>
            <p className="text-xs leading-relaxed" style={{ color: C.dim }}>{s.desc}</p>
          </div>
        ))}
      </motion.div>
    </div>
  );
}

/* ═══════════════════════════════════════════════
   SCROLL PROGRESS
   ═══════════════════════════════════════════════ */
function ScrollProgress() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 100, damping: 30 });
  return (
    <motion.div
      className="fixed top-0 left-0 right-0 h-[2px] z-[60] origin-left"
      style={{ scaleX, background: C.accent }}
    />
  );
}

/* ═══════════════════════════════════════════════
   NAVBAR — minimal glass
   ═══════════════════════════════════════════════ */
function Navbar() {
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);

  return (
    <motion.nav
      className="fixed top-0 w-full z-50 transition-all duration-500"
      data-testid="navbar"
      style={{
        backdropFilter: scrolled ? "blur(20px)" : "none",
        background: scrolled ? "rgba(10,10,10,0.7)" : "transparent",
        borderBottom: scrolled ? `1px solid ${C.border}` : "1px solid transparent",
      }}
    >
      <div className="max-w-5xl mx-auto px-6 flex items-center justify-between h-16">
        <button
          onClick={() => navigate("/")}
          className="flex items-center gap-2.5 group"
          data-testid="logo-button"
        >
          <WaveformLogo size={26} className="text-[#c8a97e] transition-opacity duration-300 group-hover:opacity-80" />
          <span
            className="text-sm font-medium tracking-tight transition-opacity duration-300 group-hover:opacity-80"
            style={{ fontFamily: "Sora, sans-serif", color: C.text }}
          >
            mumble
          </span>
        </button>

        <div className="hidden md:flex items-center gap-8">
          {["Features", "How it works", "Scenarios"].map((l) => (
            <a
              key={l}
              href={`#${l.toLowerCase().replace(/ /g, "-")}`}
              className="text-xs tracking-wide transition-colors duration-300 hover:text-[#ededed]"
              style={{ color: C.dim }}
            >
              {l}
            </a>
          ))}
        </div>

        <button
          onClick={() => navigate("/chat")}
          className="text-xs font-medium tracking-wide px-5 py-2 rounded-full transition-all duration-300 hover:bg-[rgba(200,169,126,0.12)]"
          style={{ color: C.accent, border: `1px solid rgba(200,169,126,0.2)` }}
          data-testid="nav-start-btn"
        >
          Start Free
        </button>
      </div>
    </motion.nav>
  );
}

/* ═══════════════════════════════════════════════
   PAGE
   ═══════════════════════════════════════════════ */
export default function LandingPage() {
  const navigate = useNavigate();
  const heroRef = useRef(null);
  const { scrollYProgress: heroScroll } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
  const heroY = useTransform(heroScroll, [0, 1], [0, 120]);
  const heroOpacity = useTransform(heroScroll, [0, 0.7], [1, 0]);

  return (
    <div
      className="min-h-screen overflow-x-hidden"
      style={{ background: C.bg, color: C.text, fontFamily: "DM Sans, sans-serif" }}
    >
      <ScrollProgress />
      <Navbar />

      {/* ── HERO ── */}
      <section
        ref={heroRef}
        className="relative min-h-screen flex items-center justify-center"
        data-testid="hero-section"
      >
        {/* Subtle radial light */}
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] pointer-events-none"
          style={{ background: `radial-gradient(ellipse at center, ${C.accentGlow} 0%, transparent 70%)` }}
        />

        <motion.div
          className="relative max-w-5xl mx-auto px-6 pt-24 pb-12 flex flex-col lg:flex-row items-center gap-16 lg:gap-20"
          style={{ y: heroY, opacity: heroOpacity }}
        >
          <div className="flex-1 max-w-xl">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <span
                className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-medium tracking-wider uppercase mb-8"
                style={{ color: C.accent, border: `1px solid rgba(200,169,126,0.15)`, background: C.accentSoft }}
              >
                AI Language Tutor
              </span>
            </motion.div>

            <WordReveal
              text="Learn any language by actually speaking it"
              className="text-4xl sm:text-5xl lg:text-[3.5rem] tracking-tight leading-[1.1] mb-8"
              style={{ fontFamily: "Sora, sans-serif", fontWeight: 500, color: C.text }}
            />

            <motion.p
              className="text-base leading-relaxed max-w-md mb-10"
              style={{ color: C.muted }}
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8, duration: 0.6 }}
            >
              Your personal tutor that listens, corrects, and adapts.
              Voice-first. Real-time feedback. No textbooks.
            </motion.p>

            <motion.div
              className="flex flex-col sm:flex-row gap-3"
              initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1, duration: 0.5 }}
            >
              <Button
                onClick={() => navigate("/chat")}
                className="font-medium rounded-full px-7 py-5 text-sm transition-all duration-300 border-0"
                style={{
                  background: C.accent,
                  color: "#0a0a0a",
                }}
                data-testid="hero-start-btn"
              >
                Start a conversation <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                onClick={() => navigate("/dashboard")}
                className="rounded-full px-7 py-5 text-sm transition-all duration-300"
                style={{ border: `1px solid ${C.border}`, background: "transparent", color: C.muted }}
                data-testid="hero-dashboard-btn"
              >
                View Dashboard
              </Button>
            </motion.div>
          </div>

          <motion.div
            className="hidden lg:block flex-shrink-0"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4, duration: 1, ease: [0.22, 1, 0.36, 1] }}
          >
            <LanguageOrbit />
          </motion.div>
        </motion.div>

        {/* Scroll indicator */}
        <motion.div
          className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.5 }}
        >
          <span className="text-[10px] tracking-wider uppercase" style={{ color: C.dim }}>Scroll</span>
          <motion.div
            className="w-px h-8"
            style={{ background: `linear-gradient(to bottom, ${C.accent}40, transparent)` }}
            animate={{ y: [0, 6, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          />
        </motion.div>
      </section>

      {/* ── FEATURES ── */}
      <section id="features" className="relative py-16 md:py-24" data-testid="features-section">
        <div className="max-w-3xl mx-auto px-6">
          <Reveal>
            <span className="text-[10px] uppercase tracking-[0.25em] block mb-3" style={{ color: C.dim }}>Core Features</span>
          </Reveal>
          <WordReveal
            text="Built different from day one"
            as="h2"
            className="text-2xl md:text-3xl tracking-tight mb-3"
            style={{ fontFamily: "Sora, sans-serif", fontWeight: 500, color: C.text }}
          />
          <Reveal delay={0.15}>
            <div className="h-px w-16 mb-2" style={{ background: `linear-gradient(90deg, ${C.accent}60, transparent)` }} />
          </Reveal>
          {FEATURES.map((f, i) => <FeatureRow key={f.title} f={f} i={i} />)}
        </div>
      </section>

      {/* ── TOOLS ── */}
      <section id="how-it-works" className="relative py-24 md:py-32" data-testid="tools-section">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <Reveal>
            <span className="text-[10px] uppercase tracking-[0.25em] block mb-3" style={{ color: C.dim }}>Under the hood</span>
          </Reveal>
          <WordReveal
            text="Four specialized AI subagents"
            as="h2"
            className="text-2xl md:text-3xl tracking-tight mb-5"
            style={{ fontFamily: "Sora, sans-serif", fontWeight: 500, color: C.text }}
          />
          <Reveal delay={0.15}>
            <p className="max-w-md mx-auto mb-14 leading-relaxed text-sm" style={{ color: C.muted }}>
              Every message activates real-time AI tools that check grammar, look up vocabulary, and evaluate your responses.
            </p>
          </Reveal>
          <ToolsShowcase />
        </div>
      </section>

      {/* ── DEMO ── */}
      <section className="relative py-24 md:py-32" data-testid="demo-section">
        <div className="max-w-4xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-14 items-center">
            <div>
              <Reveal>
                <span className="text-[10px] uppercase tracking-[0.25em] block mb-3" style={{ color: C.dim }}>See it in action</span>
              </Reveal>
              <WordReveal
                text="A conversation, not a classroom"
                as="h2"
                className="text-2xl md:text-3xl tracking-tight mb-5"
                style={{ fontFamily: "Sora, sans-serif", fontWeight: 500, color: C.text }}
              />
              <Reveal delay={0.15}>
                <p className="leading-relaxed mb-8 text-sm" style={{ color: C.muted }}>
                  Ask anything. mumble responds with context-aware corrections,
                  vocabulary insights, and pronunciation guides — all in real-time.
                </p>
              </Reveal>
              <Reveal delay={0.25}>
                <button
                  onClick={() => navigate("/chat")}
                  className="text-xs font-medium tracking-wide px-6 py-2.5 rounded-full transition-all duration-300 hover:bg-[rgba(200,169,126,0.12)] flex items-center gap-1.5"
                  style={{ color: C.accent, border: `1px solid rgba(200,169,126,0.2)` }}
                  data-testid="demo-try-btn"
                >
                  Try it yourself <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </Reveal>
            </div>
            <Reveal delay={0.2}>
              <ChatDemo />
            </Reveal>
          </div>
        </div>
      </section>

      {/* ── SCENARIOS ── */}
      <section id="scenarios" className="relative py-24 md:py-32" data-testid="scenarios-section">
        <div className="max-w-4xl mx-auto px-6 mb-10">
          <Reveal>
            <span className="text-[10px] uppercase tracking-[0.25em] block mb-3" style={{ color: C.dim }}>Practice Scenarios</span>
          </Reveal>
          <WordReveal
            text="Real conversations, real confidence"
            as="h2"
            className="text-2xl md:text-3xl tracking-tight"
            style={{ fontFamily: "Sora, sans-serif", fontWeight: 500, color: C.text }}
          />
        </div>
        <div className="max-w-5xl mx-auto px-6"><ScenariosScroll /></div>
      </section>

      {/* ── CTA ── */}
      <section className="relative py-32 md:py-40" data-testid="cta-section">
        {/* Subtle glow */}
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] pointer-events-none"
          style={{ background: `radial-gradient(ellipse, ${C.accentGlow} 0%, transparent 70%)` }}
        />

        <div className="relative max-w-2xl mx-auto px-6 text-center">
          <WordReveal
            text="Stop studying. Start speaking."
            as="h2"
            className="text-3xl md:text-5xl tracking-tight mb-6"
            style={{ fontFamily: "Sora, sans-serif", fontWeight: 500, color: C.text }}
          />
          <Reveal delay={0.2}>
            <p className="text-sm md:text-base mb-10 max-w-md mx-auto leading-relaxed" style={{ color: C.muted }}>
              The best way to learn a language is to use it. mumble gives you a patient, always-available partner who adapts.
            </p>
          </Reveal>
          <Reveal delay={0.35}>
            <Button
              onClick={() => navigate("/chat")}
              className="font-medium rounded-full px-9 py-6 text-sm transition-all duration-300 border-0"
              style={{ background: C.accent, color: "#0a0a0a" }}
              data-testid="cta-start-btn"
            >
              Begin your first lesson <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
          </Reveal>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="py-8" style={{ borderTop: `1px solid ${C.border}` }} data-testid="footer">
        <div className="max-w-5xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <WaveformLogo size={20} className="text-[#c8a97e] opacity-50" />
            <span className="text-xs" style={{ color: C.dim, fontFamily: "Sora, sans-serif" }}>mumble</span>
          </div>
          <div className="flex items-center gap-6">
            {[{ label: "Practice", href: "/chat" }, { label: "Dashboard", href: "/dashboard" }, { label: "Vocabulary", href: "/vocabulary" }].map((l) => (
              <button
                key={l.href}
                onClick={() => navigate(l.href)}
                className="text-[10px] tracking-wide transition-colors duration-300 hover:text-[#ededed]"
                style={{ color: C.dim }}
              >
                {l.label}
              </button>
            ))}
          </div>
          <p className="text-[10px] tracking-wide" style={{ color: C.dim }}>AI-powered language learning</p>
        </div>
      </footer>
    </div>
  );
}
