import { useNavigate } from "react-router-dom";
import { useRef, useEffect, useState, useMemo } from "react";
import {
  motion, useScroll, useTransform, useSpring, useInView,
  useMotionValue, useMotionTemplate, AnimatePresence,
} from "framer-motion";
import { Button } from "@/components/ui/button";
import { WaveformLogo } from "@/components/WaveformLogo";
import {
  Mic, ArrowRight, Brain, AudioLines, Target, BookOpen, Eye,
  Briefcase, Plane, UtensilsCrossed, MessageSquare, GraduationCap,
  Sparkles, Play, Volume2, ChevronDown,
} from "lucide-react";

/* ═══════════════════════════════════════════════════
   SECTION COLORS — each section has its own world
   ═══════════════════════════════════════════════════ */
const SECTIONS = {
  hero:      "#020617",   // Slate 950
  features:  "#022c22",   // Emerald 950
  tools:     "#172554",   // Blue 950
  demo:      "#2e1065",   // Violet 950
  scenarios: "#1c1917",   // Stone 900
  cta:       "#020617",   // Slate 950
};

/* ═══════════════════════════════════════════════════
   SCROLL PROGRESS BAR
   ═══════════════════════════════════════════════════ */
function ScrollProgress() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 100, damping: 30 });
  return (
    <motion.div
      className="fixed top-0 left-0 right-0 h-[2px] z-[60] origin-left"
      style={{ scaleX, background: "linear-gradient(90deg, #6366f1, #34d399, #f472b6)" }}
    />
  );
}

/* ═══════════════════════════════════════════════════
   ANIMATION PRIMITIVES
   ═══════════════════════════════════════════════════ */
const fadeUp = {
  hidden: { opacity: 0, y: 50 },
  visible: (i = 0) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.1, duration: 0.7, ease: [0.22, 1, 0.36, 1] }
  }),
};

function Reveal({ children, className, delay = 0 }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  return (
    <motion.div
      ref={ref} className={className}
      initial="hidden" animate={inView ? "visible" : "hidden"}
      variants={fadeUp} custom={delay}
    >
      {children}
    </motion.div>
  );
}

function WordReveal({ text, className, as: Tag = "h1" }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  return (
    <Tag ref={ref} className={className}>
      {text.split(" ").map((w, i) => (
        <motion.span
          key={i} className="inline-block mr-[0.32em]"
          initial={{ opacity: 0, y: 40, filter: "blur(8px)" }}
          animate={inView ? { opacity: 1, y: 0, filter: "blur(0px)" } : {}}
          transition={{ delay: i * 0.06, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        >{w}</motion.span>
      ))}
    </Tag>
  );
}

/* ═══════════════════════════════════════════════════
   GLOW CARD — glassmorphism with hover glow
   ═══════════════════════════════════════════════════ */
function GlowCard({ children, className, glowColor = "99,102,241" }) {
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const ref = useRef(null);

  const handleMouseMove = (e) => {
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return;
    mouseX.set(e.clientX - rect.left);
    mouseY.set(e.clientY - rect.top);
  };

  const bg = useMotionTemplate`radial-gradient(300px circle at ${mouseX}px ${mouseY}px, rgba(${glowColor},0.12), transparent 80%)`;

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMouseMove}
      className={`relative rounded-3xl border border-white/10 overflow-hidden ${className}`}
      style={{ background: "rgba(255,255,255,0.04)" }}
      whileHover={{ borderColor: "rgba(255,255,255,0.2)" }}
      transition={{ duration: 0.3 }}
    >
      <motion.div className="absolute inset-0 pointer-events-none" style={{ background: bg }} />
      <div className="relative z-10">{children}</div>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════
   FLOATING PARTICLES
   ═══════════════════════════════════════════════════ */
function Particles({ count = 30, color = "#6366f1" }) {
  const items = useMemo(() =>
    Array.from({ length: count }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: 1 + Math.random() * 2,
      dur: 15 + Math.random() * 25,
      delay: Math.random() * 10,
    })), [count]
  );

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {items.map((p) => (
        <motion.div
          key={p.id}
          className="absolute rounded-full"
          style={{
            width: p.size, height: p.size,
            left: `${p.x}%`, top: `${p.y}%`,
            background: color, opacity: 0.3,
          }}
          animate={{ y: [-20, 20, -20], x: [-10, 10, -10], opacity: [0.15, 0.5, 0.15] }}
          transition={{ duration: p.dur, repeat: Infinity, delay: p.delay, ease: "easeInOut" }}
        />
      ))}
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   FLOATING NAVBAR — glass pill
   ═══════════════════════════════════════════════════ */
function Navbar() {
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", h, { passive: true });
    return () => window.removeEventListener("scroll", h);
  }, []);

  return (
    <motion.nav
      className="fixed top-4 left-1/2 -translate-x-1/2 z-50 transition-all duration-500"
      initial={{ y: -80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 0.3, duration: 0.6 }}
      data-testid="navbar"
    >
      <div
        className="flex items-center gap-6 px-6 py-3 rounded-full transition-all duration-500"
        style={{
          backdropFilter: "blur(20px)",
          background: scrolled ? "rgba(2,6,23,0.8)" : "rgba(255,255,255,0.06)",
          border: "1px solid rgba(255,255,255,0.1)",
          boxShadow: scrolled ? "0 8px 32px rgba(0,0,0,0.4)" : "none",
        }}
      >
        <button onClick={() => navigate("/")} className="flex items-center gap-2 group" data-testid="logo-button">
          <WaveformLogo size={22} className="text-indigo-400 transition-all duration-300 group-hover:text-indigo-300" />
          <span className="text-sm font-semibold tracking-tight text-white" style={{ fontFamily: "Sora, sans-serif" }}>mumble</span>
        </button>

        <div className="hidden md:flex items-center gap-5">
          {["Features", "How it works", "Scenarios"].map((l) => (
            <a key={l} href={`#${l.toLowerCase().replace(/ /g, "-")}`}
              className="text-xs text-slate-400 hover:text-white transition-colors duration-300">{l}</a>
          ))}
        </div>

        <button
          onClick={() => navigate("/chat")}
          className="text-xs font-semibold px-5 py-2 rounded-full transition-all duration-300 bg-indigo-500 hover:bg-indigo-400 text-white shadow-[0_0_16px_rgba(99,102,241,0.4)] hover:shadow-[0_0_24px_rgba(99,102,241,0.6)]"
          data-testid="nav-start-btn"
        >
          Start Free
        </button>
      </div>
    </motion.nav>
  );
}

/* ═══════════════════════════════════════════════════
   HERO — split layout with animated language ticker
   ═══════════════════════════════════════════════════ */
const GREETINGS = [
  "Bonjour", "Hola", "Ciao", "Hallo", "Olá",
  "こんにちは", "안녕하세요", "مرحبا", "Привет", "你好",
  "नमस्ते", "สวัสดี", "Merhaba", "Xin chào", "Γεια σου",
];

function GreetingTicker() {
  const doubled = [...GREETINGS, ...GREETINGS];
  return (
    <div className="overflow-hidden py-4">
      <motion.div
        className="flex gap-6 whitespace-nowrap"
        animate={{ x: ["0%", "-50%"] }}
        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
      >
        {doubled.map((g, i) => (
          <span key={i} className="text-sm font-medium px-4 py-1.5 rounded-full border border-white/10 text-slate-300 bg-white/5">
            {g}
          </span>
        ))}
      </motion.div>
    </div>
  );
}

function HeroSection() {
  const navigate = useNavigate();
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], [0, 150]);
  const opacity = useTransform(scrollYProgress, [0, 0.7], [1, 0]);

  return (
    <section ref={ref} className="relative min-h-screen flex flex-col justify-center overflow-hidden pt-24 pb-8" style={{ background: SECTIONS.hero }} data-testid="hero-section">
      <Particles count={40} color="#6366f1" />

      {/* Hero glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/4 w-[800px] h-[800px] pointer-events-none"
        style={{ background: "radial-gradient(circle, rgba(99,102,241,0.12) 0%, transparent 60%)" }} />
      <div className="absolute bottom-0 right-0 w-[500px] h-[500px] pointer-events-none"
        style={{ background: "radial-gradient(circle, rgba(52,211,153,0.08) 0%, transparent 60%)" }} />

      <motion.div className="relative max-w-7xl mx-auto px-6 w-full" style={{ y, opacity }}>
        <div className="flex flex-col items-center text-center max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
          >
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-medium tracking-wider uppercase border border-indigo-500/30 text-indigo-300 bg-indigo-500/10 mb-8">
              <Sparkles className="w-3.5 h-3.5" /> AI Language Tutor
            </span>
          </motion.div>

          <WordReveal
            text="Learn any language by speaking it"
            className="text-5xl md:text-7xl font-bold tracking-tighter leading-[1.05] text-white mb-6"
          />

          <motion.p
            className="text-lg md:text-xl text-slate-400 leading-relaxed max-w-2xl mb-10"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            transition={{ delay: 0.8, duration: 0.6 }}
          >
            Voice-first conversations with an AI that listens, corrects, and adapts to
            your level. <span className="text-emerald-400">50+ languages</span>. Real-time feedback. No textbooks.
          </motion.p>

          <motion.div
            className="flex flex-col sm:flex-row gap-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1, duration: 0.5 }}
          >
            <Button
              onClick={() => navigate("/chat")}
              className="rounded-full px-8 py-6 text-sm font-semibold bg-indigo-500 hover:bg-indigo-400 text-white shadow-[0_0_24px_rgba(99,102,241,0.5)] hover:shadow-[0_0_40px_rgba(99,102,241,0.7)] transition-all duration-300 border-0 hover:-translate-y-0.5"
              data-testid="hero-start-btn"
            >
              Start a conversation <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              onClick={() => navigate("/dashboard")}
              className="rounded-full px-8 py-6 text-sm font-medium bg-white/5 hover:bg-white/10 text-slate-300 border-white/10 backdrop-blur-sm transition-all duration-300"
              data-testid="hero-dashboard-btn"
            >
              <Play className="mr-2 w-4 h-4" /> See how it works
            </Button>
          </motion.div>
        </div>

        {/* Language ticker */}
        <div className="mt-20">
          <GreetingTicker />
        </div>
      </motion.div>

      {/* Scroll hint */}
      <motion.div
        className="absolute bottom-6 left-1/2 -translate-x-1/2"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.5 }}
      >
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        >
          <ChevronDown className="w-5 h-5 text-slate-600" />
        </motion.div>
      </motion.div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════
   FEATURES — bento grid with glassmorphism
   ═══════════════════════════════════════════════════ */
const FEATURES = [
  {
    icon: Mic, title: "Voice-First", desc: "Speak naturally. mumble listens, understands context, and responds with natural voice in any language.",
    color: "52,211,153", span: "md:col-span-2",
  },
  {
    icon: AudioLines, title: "Karaoke Tracking", desc: "Words highlight as the AI speaks. Follow along, connecting sound to text in real-time.",
    color: "244,114,182", span: "",
  },
  {
    icon: Brain, title: "Live AI Tools", desc: "Watch grammar checkers, vocabulary lookups, and pronunciation guides activate as you learn.",
    color: "99,102,241", span: "",
  },
  {
    icon: GraduationCap, title: "Adaptive Curriculum", desc: "A personalized study plan built around your goals, timeline, and interests. It evolves with you.",
    color: "251,191,36", span: "md:col-span-2",
  },
];

function FeaturesSection() {
  return (
    <section id="features" className="relative py-28 md:py-36" style={{ background: SECTIONS.features }} data-testid="features-section">
      <Particles count={20} color="#34d399" />
      <div className="absolute top-0 left-0 w-[600px] h-[600px] pointer-events-none"
        style={{ background: "radial-gradient(circle, rgba(52,211,153,0.08) 0%, transparent 60%)" }} />

      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <Reveal>
            <span className="text-sm font-medium tracking-wider uppercase text-emerald-400 mb-3 block">Why mumble</span>
          </Reveal>
          <WordReveal
            text="Built different from day one"
            as="h2"
            className="text-4xl md:text-5xl font-bold tracking-tight text-white"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {FEATURES.map((f, i) => (
            <Reveal key={f.title} delay={i * 0.8} className={f.span}>
              <GlowCard className="p-8 h-full" glowColor={f.color}>
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0"
                    style={{ background: `rgba(${f.color},0.12)` }}>
                    <f.icon className="w-6 h-6" style={{ color: `rgb(${f.color})` }} />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white tracking-tight mb-2" style={{ fontFamily: "Sora, sans-serif" }}>
                      {f.title}
                    </h3>
                    <p className="text-sm text-slate-400 leading-relaxed">{f.desc}</p>
                  </div>
                </div>
              </GlowCard>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════
   HOW IT WORKS — numbered steps with connecting lines
   ═══════════════════════════════════════════════════ */
const STEPS = [
  { icon: Target, num: "01", title: "Speak naturally", desc: "Talk in your target language. mumble transcribes and understands intent." },
  { icon: Brain, num: "02", title: "AI analyzes", desc: "Grammar, vocabulary, and pronunciation tools activate in real-time." },
  { icon: Volume2, num: "03", title: "Get feedback", desc: "Receive contextual corrections with audio playback and word highlights." },
  { icon: GraduationCap, num: "04", title: "Level up", desc: "Your curriculum adapts. Lessons get harder as you improve." },
];

function HowItWorksSection() {
  return (
    <section id="how-it-works" className="relative py-28 md:py-36" style={{ background: SECTIONS.tools }} data-testid="tools-section">
      <Particles count={15} color="#3b82f6" />
      <div className="absolute top-1/3 right-0 w-[500px] h-[500px] pointer-events-none"
        style={{ background: "radial-gradient(circle, rgba(59,130,246,0.1) 0%, transparent 60%)" }} />

      <div className="max-w-5xl mx-auto px-6">
        <div className="text-center mb-20">
          <Reveal>
            <span className="text-sm font-medium tracking-wider uppercase text-blue-400 mb-3 block">How it works</span>
          </Reveal>
          <WordReveal
            text="Four steps to fluency"
            as="h2"
            className="text-4xl md:text-5xl font-bold tracking-tight text-white"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {STEPS.map((s, i) => (
            <Reveal key={s.num} delay={i * 0.8}>
              <div className="flex items-start gap-5 group">
                <div className="relative">
                  <motion.div
                    className="w-14 h-14 rounded-2xl flex items-center justify-center border border-white/10 bg-white/5"
                    whileHover={{ scale: 1.08, borderColor: "rgba(99,102,241,0.5)" }}
                    transition={{ type: "spring", stiffness: 300, damping: 20 }}
                  >
                    <s.icon className="w-6 h-6 text-blue-400 transition-colors duration-300 group-hover:text-indigo-300" />
                  </motion.div>
                  <span className="absolute -top-2 -right-2 text-[10px] font-bold text-indigo-400 bg-indigo-500/20 px-1.5 py-0.5 rounded-full">{s.num}</span>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white tracking-tight mb-1.5" style={{ fontFamily: "Sora, sans-serif" }}>{s.title}</h3>
                  <p className="text-sm text-slate-400 leading-relaxed">{s.desc}</p>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════
   INTERACTIVE DEMO — animated chat simulation
   ═══════════════════════════════════════════════════ */
const DEMO_MSGS = [
  { role: "user", text: "How do I say 'I am happy' in Spanish?" },
  { role: "tool", text: "Checking grammar rules..." },
  { role: "tool", text: "Looking up vocabulary..." },
  { role: "ai", parts: [
    { type: "highlight", text: '"Estoy feliz"' },
    { type: "normal", text: " — We use " },
    { type: "bold", text: "estar" },
    { type: "normal", text: " because emotions are temporary states. Try saying it!" },
  ]},
];

function ChatDemo() {
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
    <GlowCard className="w-full max-w-md mx-auto" glowColor="167,139,250" ref={ref}>
      <div ref={ref}>
        {/* Title bar */}
        <div className="px-5 py-3.5 flex items-center gap-2 border-b border-white/5">
          <WaveformLogo size={16} className="text-violet-400" />
          <span className="text-xs font-medium text-slate-400" style={{ fontFamily: "Sora, sans-serif" }}>mumble</span>
          <div className="ml-auto flex gap-1.5">
            {[1,2,3].map(i => <div key={i} className="w-2 h-2 rounded-full bg-white/10" />)}
          </div>
        </div>

        {/* Messages */}
        <div className="p-5 space-y-3 min-h-[220px]">
          {DEMO_MSGS.map((msg, i) => {
            if (i >= count) return null;

            if (msg.role === "user") return (
              <motion.div key={i} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="flex justify-end">
                <div className="text-xs px-4 py-2.5 rounded-2xl rounded-br-sm bg-indigo-500/20 text-indigo-200 border border-indigo-500/20 max-w-[80%]">
                  {msg.text}
                </div>
              </motion.div>
            );

            if (msg.role === "tool") return (
              <motion.div key={i} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="flex items-center gap-2 pl-2">
                <motion.div className="w-1.5 h-1.5 rounded-full bg-emerald-400"
                  animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 1, repeat: 2 }} />
                <span className="text-[10px] italic text-slate-500">{msg.text}</span>
              </motion.div>
            );

            return (
              <motion.div key={i} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5 }} className="flex gap-2.5">
                <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 bg-violet-500/20">
                  <WaveformLogo size={10} className="text-violet-400" />
                </div>
                <div className="text-xs px-4 py-2.5 rounded-2xl rounded-bl-sm bg-white/5 border border-white/10 max-w-[85%]">
                  {msg.parts.map((p, j) =>
                    p.type === "highlight" ? <span key={j} className="text-emerald-400 font-semibold">{p.text}</span> :
                    p.type === "bold" ? <span key={j} className="text-white font-medium">{p.text}</span> :
                    <span key={j} className="text-slate-400">{p.text}</span>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </GlowCard>
  );
}

function DemoSection() {
  const navigate = useNavigate();
  return (
    <section className="relative py-28 md:py-36" style={{ background: SECTIONS.demo }} data-testid="demo-section">
      <Particles count={15} color="#a78bfa" />
      <div className="absolute top-1/3 left-1/4 w-[600px] h-[600px] pointer-events-none"
        style={{ background: "radial-gradient(circle, rgba(139,92,246,0.1) 0%, transparent 60%)" }} />

      <div className="max-w-6xl mx-auto px-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div>
            <Reveal>
              <span className="text-sm font-medium tracking-wider uppercase text-violet-400 mb-3 block">See it in action</span>
            </Reveal>
            <WordReveal
              text="A conversation, not a classroom"
              as="h2"
              className="text-4xl md:text-5xl font-bold tracking-tight text-white mb-6"
            />
            <Reveal delay={1}>
              <p className="text-lg text-slate-400 leading-relaxed mb-8">
                Ask anything. mumble responds with context-aware corrections,
                vocabulary insights, and pronunciation guides — all streamed in real-time.
              </p>
            </Reveal>
            <Reveal delay={2}>
              <button
                onClick={() => navigate("/chat")}
                className="inline-flex items-center gap-2 text-sm font-semibold text-violet-300 hover:text-violet-200 transition-colors duration-300 group"
                data-testid="demo-try-btn"
              >
                Try it yourself
                <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
              </button>
            </Reveal>
          </div>
          <Reveal delay={1.5}>
            <ChatDemo />
          </Reveal>
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════
   SCENARIOS — horizontal parallax scroll
   ═══════════════════════════════════════════════════ */
const SCENARIOS = [
  { icon: Briefcase, title: "Job Interview", desc: "Nail answers with confidence in any language.", color: "251,191,36" },
  { icon: Plane, title: "Travel", desc: "Navigate airports, hotels, and local spots.", color: "52,211,153" },
  { icon: UtensilsCrossed, title: "Restaurant", desc: "Order like a local. Handle allergies and specials.", color: "244,114,182" },
  { icon: MessageSquare, title: "Small Talk", desc: "Master casual conversation naturally.", color: "99,102,241" },
  { icon: BookOpen, title: "Business", desc: "Present and negotiate professionally.", color: "251,146,60" },
];

function ScenariosSection() {
  const containerRef = useRef(null);
  const { scrollYProgress } = useScroll({ target: containerRef, offset: ["start end", "end start"] });
  const x = useTransform(scrollYProgress, [0, 1], [80, -200]);

  return (
    <section id="scenarios" className="relative py-28 md:py-36 overflow-hidden" ref={containerRef} style={{ background: SECTIONS.scenarios }} data-testid="scenarios-section">
      <div className="max-w-6xl mx-auto px-6 mb-12">
        <Reveal>
          <span className="text-sm font-medium tracking-wider uppercase text-amber-400 mb-3 block">Practice Scenarios</span>
        </Reveal>
        <WordReveal
          text="Real conversations, real confidence"
          as="h2"
          className="text-4xl md:text-5xl font-bold tracking-tight text-white"
        />
      </div>

      <motion.div className="flex gap-5 px-6" style={{ x }}>
        {SCENARIOS.map((s) => (
          <GlowCard key={s.title} className="flex-shrink-0 w-72 p-6" glowColor={s.color}>
            <s.icon className="w-6 h-6 mb-4" style={{ color: `rgb(${s.color})` }} />
            <h4 className="text-base font-semibold text-white tracking-tight mb-2" style={{ fontFamily: "Sora, sans-serif" }}>{s.title}</h4>
            <p className="text-xs text-slate-400 leading-relaxed">{s.desc}</p>
          </GlowCard>
        ))}
      </motion.div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════
   CTA — dramatic final section
   ═══════════════════════════════════════════════════ */
function CTASection() {
  const navigate = useNavigate();
  return (
    <section className="relative py-36 md:py-48 overflow-hidden" data-testid="cta-section">
      {/* Multi-color glow */}
      <div className="absolute top-1/2 left-1/4 -translate-y-1/2 w-[400px] h-[400px] pointer-events-none"
        style={{ background: "radial-gradient(circle, rgba(99,102,241,0.15) 0%, transparent 60%)" }} />
      <div className="absolute top-1/2 right-1/4 -translate-y-1/2 w-[400px] h-[400px] pointer-events-none"
        style={{ background: "radial-gradient(circle, rgba(244,114,182,0.1) 0%, transparent 60%)" }} />

      <div className="relative max-w-3xl mx-auto px-6 text-center">
        <Reveal>
          <motion.div
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            className="inline-block mb-8"
          >
            <WaveformLogo size={48} className="text-indigo-400" />
          </motion.div>
        </Reveal>

        <WordReveal
          text="Stop studying. Start speaking."
          as="h2"
          className="text-4xl md:text-6xl font-bold tracking-tighter text-white mb-6"
        />

        <Reveal delay={1}>
          <p className="text-lg md:text-xl text-slate-400 leading-relaxed max-w-xl mx-auto mb-12">
            The best way to learn a language is to use it. mumble gives you a patient,
            always-available partner who adapts to <span className="text-emerald-400">your</span> level.
          </p>
        </Reveal>

        <Reveal delay={2}>
          <Button
            onClick={() => navigate("/chat")}
            className="rounded-full px-10 py-7 text-base font-semibold bg-indigo-500 hover:bg-indigo-400 text-white shadow-[0_0_32px_rgba(99,102,241,0.5)] hover:shadow-[0_0_48px_rgba(99,102,241,0.7)] transition-all duration-300 border-0 hover:-translate-y-1"
            data-testid="cta-start-btn"
          >
            Begin your first lesson <ArrowRight className="ml-2 w-5 h-5" />
          </Button>
        </Reveal>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════
   FOOTER
   ═══════════════════════════════════════════════════ */
function Footer() {
  const navigate = useNavigate();
  return (
    <footer className="py-8 border-t border-white/5" data-testid="footer">
      <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <WaveformLogo size={18} className="text-indigo-400 opacity-50" />
          <span className="text-xs text-slate-500" style={{ fontFamily: "Sora, sans-serif" }}>mumble</span>
        </div>
        <div className="flex items-center gap-6">
          {[{ label: "Practice", href: "/chat" }, { label: "Dashboard", href: "/dashboard" }, { label: "Vocabulary", href: "/vocabulary" }].map((l) => (
            <button key={l.href} onClick={() => navigate(l.href)}
              className="text-xs text-slate-500 hover:text-white transition-colors duration-300">{l.label}</button>
          ))}
        </div>
        <p className="text-xs text-slate-600">AI-powered language learning</p>
      </div>
    </footer>
  );
}

/* ═══════════════════════════════════════════════════
   PAGE
   ═══════════════════════════════════════════════════ */
export default function LandingPage() {
  return (
    <div className="min-h-screen text-white" style={{ fontFamily: "DM Sans, sans-serif" }}>
      <ScrollBackground />
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
