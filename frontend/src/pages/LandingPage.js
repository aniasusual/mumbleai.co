import { useNavigate } from "react-router-dom";
import { useRef, useEffect, useState } from "react";
import {
  motion, useScroll, useTransform, useSpring, useInView,
} from "framer-motion";
import { Button } from "@/components/ui/button";
import { WaveformLogo } from "@/components/WaveformLogo";
import {
  Mic, ArrowRight, Brain, AudioLines, Target, BookOpen,
  Briefcase, Plane, UtensilsCrossed, MessageSquare, GraduationCap,
  Sparkles, Volume2, ChevronDown,
} from "lucide-react";

/* ═══════════════════════════════════════════
   SECTION PALETTES — lighter, airy tones
   ═══════════════════════════════════════════ */
const BG = {
  hero:      "#0f172a",
  features:  "#0c1a2e",
  tools:     "#111827",
  demo:      "#1a1033",
  scenarios: "#14181f",
  cta:       "#0f172a",
  footer:    "#080c14",
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
      style={{ scaleX, background: "linear-gradient(90deg, #818cf8, #34d399, #f472b6)" }}
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
      initial={{ opacity: 0, y: 36 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ delay, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
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
          initial={{ opacity: 0, y: 36, filter: "blur(6px)" }}
          animate={inView ? { opacity: 1, y: 0, filter: "blur(0px)" } : {}}
          transition={{ delay: i * 0.055, duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
        >{w}</motion.span>
      ))}
    </Tag>
  );
}

/* ═══════════════════════════════════════════
   NAVBAR — floating pill
   ═══════════════════════════════════════════ */
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
      className="fixed top-4 left-1/2 -translate-x-1/2 z-50"
      initial={{ y: -80, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 0.3, duration: 0.6 }}
      data-testid="navbar"
    >
      <div className="flex items-center gap-6 px-6 py-3 rounded-full transition-all duration-500"
        style={{
          backdropFilter: "blur(20px)",
          background: scrolled ? "rgba(15,23,42,0.85)" : "rgba(255,255,255,0.04)",
          border: "1px solid rgba(255,255,255,0.08)",
          boxShadow: scrolled ? "0 8px 32px rgba(0,0,0,0.3)" : "none",
        }}>
        <button onClick={() => navigate("/")} className="flex items-center gap-2 group" data-testid="logo-button">
          <WaveformLogo size={22} className="text-indigo-400" />
          <span className="text-sm font-semibold tracking-tight text-white" style={{ fontFamily: "Sora" }}>mumble</span>
        </button>
        <div className="hidden md:flex items-center gap-5">
          {["Features", "How it works", "Scenarios"].map(l => (
            <a key={l} href={`#${l.toLowerCase().replace(/ /g, "-")}`}
              className="text-xs text-slate-400 hover:text-white transition-colors duration-300">{l}</a>
          ))}
        </div>
        <button onClick={() => navigate("/chat")}
          className="text-xs font-semibold px-5 py-2 rounded-full bg-indigo-500 hover:bg-indigo-400 text-white transition-all duration-300 shadow-[0_0_16px_rgba(99,102,241,0.35)]"
          data-testid="nav-start-btn">Start Free</button>
      </div>
    </motion.nav>
  );
}

/* ═══════════════════════════════════════════
   HERO — centered, greeting ticker
   ═══════════════════════════════════════════ */
const GREETINGS = [
  "Bonjour", "Hola", "Ciao", "Hallo", "Olá", "こんにちは", "안녕하세요",
  "مرحبا", "Привет", "你好", "नमस्ते", "สวัสดี", "Merhaba", "Xin chào", "Γεια σου",
];

function GreetingTicker() {
  const doubled = [...GREETINGS, ...GREETINGS];
  return (
    <div className="overflow-hidden py-4">
      <motion.div className="flex gap-5 whitespace-nowrap"
        animate={{ x: ["0%", "-50%"] }}
        transition={{ duration: 22, repeat: Infinity, ease: "linear" }}>
        {doubled.map((g, i) => (
          <span key={i} className="text-sm px-4 py-1.5 rounded-full border border-white/8 text-slate-400 bg-white/[0.03]">{g}</span>
        ))}
      </motion.div>
    </div>
  );
}

function HeroSection() {
  const navigate = useNavigate();
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], [0, 140]);
  const opacity = useTransform(scrollYProgress, [0, 0.65], [1, 0]);

  return (
    <section ref={ref} className="relative min-h-screen flex flex-col justify-center pt-24 pb-8" style={{ background: BG.hero }} data-testid="hero-section">
      {/* Soft glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/4 w-[700px] h-[700px] pointer-events-none rounded-full"
        style={{ background: "radial-gradient(circle, rgba(129,140,248,0.08) 0%, transparent 65%)" }} />
      <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] pointer-events-none rounded-full"
        style={{ background: "radial-gradient(circle, rgba(52,211,153,0.05) 0%, transparent 60%)" }} />

      <motion.div className="relative max-w-5xl mx-auto px-6 w-full text-center" style={{ y, opacity }}>
        <motion.span
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-medium tracking-wider uppercase border border-indigo-400/20 text-indigo-300 bg-indigo-500/8 mb-8"
          initial={{ opacity: 0, scale: 0.85 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5 }}>
          <Sparkles className="w-3.5 h-3.5" /> AI Language Tutor
        </motion.span>

        <WordReveal
          text="Learn any language by speaking it"
          className="text-5xl md:text-7xl font-bold tracking-tighter leading-[1.05] text-white mb-6"
        />

        <motion.p className="text-lg md:text-xl text-slate-400 leading-relaxed max-w-2xl mx-auto mb-10"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8, duration: 0.6 }}>
          Voice-first conversations with an AI that listens, corrects, and adapts.{" "}
          <span className="text-emerald-400">50+ languages</span>. Real-time feedback.
        </motion.p>

        <motion.div className="flex flex-col sm:flex-row gap-4 justify-center"
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1, duration: 0.5 }}>
          <Button onClick={() => navigate("/chat")}
            className="rounded-full px-8 py-6 text-sm font-semibold bg-indigo-500 hover:bg-indigo-400 text-white shadow-[0_0_24px_rgba(99,102,241,0.4)] hover:shadow-[0_0_36px_rgba(99,102,241,0.6)] transition-all duration-300 border-0 hover:-translate-y-0.5"
            data-testid="hero-start-btn">
            Start a conversation <ArrowRight className="ml-2 w-4 h-4" />
          </Button>
          <Button variant="outline" onClick={() => navigate("/dashboard")}
            className="rounded-full px-8 py-6 text-sm font-medium bg-white/5 hover:bg-white/10 text-slate-300 border-white/10 transition-all duration-300"
            data-testid="hero-dashboard-btn">View Dashboard</Button>
        </motion.div>

        <div className="mt-20"><GreetingTicker /></div>
      </motion.div>

      <motion.div className="absolute bottom-6 left-1/2 -translate-x-1/2"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.5 }}>
        <motion.div animate={{ y: [0, 8, 0] }} transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}>
          <ChevronDown className="w-5 h-5 text-slate-600" />
        </motion.div>
      </motion.div>
    </section>
  );
}

/* ═══════════════════════════════════════════
   FEATURES — large inline text + icon strips
   No cards. Each feature is a full-width row
   with large text, icon, and a subtle divider.
   ═══════════════════════════════════════════ */
const FEATURES = [
  { icon: Mic, label: "Voice-First", desc: "Speak naturally in any language. mumble listens, understands, and responds with natural voice.", accent: "#818cf8" },
  { icon: AudioLines, label: "Karaoke Tracking", desc: "Every word highlights as the AI speaks — connecting sound to text in real-time.", accent: "#f472b6" },
  { icon: Brain, label: "Live AI Tools", desc: "Grammar, vocabulary, and pronunciation tools activate live as you talk.", accent: "#34d399" },
  { icon: GraduationCap, label: "Adaptive Curriculum", desc: "A study plan built around your goals that evolves as you improve.", accent: "#fbbf24" },
];

function FeaturesSection() {
  return (
    <section id="features" className="relative py-28 md:py-36" style={{ background: BG.features }} data-testid="features-section">
      <div className="max-w-5xl mx-auto px-6">
        <Reveal>
          <span className="text-sm font-medium tracking-wider uppercase text-emerald-400 mb-3 block">Core Features</span>
        </Reveal>
        <WordReveal text="Built different from day one" as="h2"
          className="text-4xl md:text-5xl font-bold tracking-tight text-white mb-16" />

        <div className="space-y-0">
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
      className={`group py-8 md:py-10 ${!isLast ? "border-b border-white/[0.06]" : ""}`}
      initial={{ opacity: 0, x: i % 2 === 0 ? -40 : 40 }}
      animate={inView ? { opacity: 1, x: 0 } : {}}
      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="flex flex-col md:flex-row md:items-center gap-4 md:gap-8">
        {/* Number + Icon */}
        <div className="flex items-center gap-4 md:w-64 flex-shrink-0">
          <span className="text-xs font-mono text-slate-600">0{i + 1}</span>
          <motion.div
            whileHover={{ scale: 1.15, rotate: 5 }}
            transition={{ type: "spring", stiffness: 300, damping: 15 }}
          >
            <f.icon className="w-6 h-6 transition-colors duration-300"
              style={{ color: f.accent }} />
          </motion.div>
          <h3 className="text-xl md:text-2xl font-semibold text-white tracking-tight transition-colors duration-300 group-hover:text-slate-100"
            style={{ fontFamily: "Sora" }}>{f.label}</h3>
        </div>

        {/* Description */}
        <p className="text-sm md:text-base text-slate-400 leading-relaxed md:flex-1 max-w-xl">{f.desc}</p>

        {/* Hover accent line */}
        <motion.div className="hidden md:block w-12 h-[2px] rounded-full flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
          style={{ background: f.accent }} />
      </div>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════
   HOW IT WORKS — vertical timeline with
   connecting line, no cards
   ═══════════════════════════════════════════ */
const STEPS = [
  { icon: Target, title: "Speak naturally", desc: "Talk in your target language. mumble transcribes and understands your intent instantly." },
  { icon: Brain, title: "AI analyzes in real-time", desc: "Grammar checkers, vocabulary lookups, and pronunciation tools activate behind the scenes." },
  { icon: Volume2, title: "Get spoken feedback", desc: "Hear corrections with karaoke-style word highlights. Connect sound to meaning." },
  { icon: GraduationCap, title: "Level up automatically", desc: "Your curriculum adapts. Lessons get harder as you improve. No manual adjustments." },
];

function HowItWorksSection() {
  return (
    <section id="how-it-works" className="relative py-28 md:py-36" style={{ background: BG.tools }} data-testid="tools-section">
      <div className="max-w-4xl mx-auto px-6">
        <div className="text-center mb-20">
          <Reveal>
            <span className="text-sm font-medium tracking-wider uppercase text-blue-400 mb-3 block">How it works</span>
          </Reveal>
          <WordReveal text="Four steps to fluency" as="h2"
            className="text-4xl md:text-5xl font-bold tracking-tight text-white" />
        </div>

        {/* Timeline */}
        <div className="relative">
          {/* Connecting line */}
          <div className="absolute left-6 md:left-8 top-0 bottom-0 w-px bg-gradient-to-b from-blue-500/30 via-indigo-500/20 to-transparent" />

          <div className="space-y-12 md:space-y-16">
            {STEPS.map((s, i) => (
              <TimelineStep key={s.title} s={s} i={i} />
            ))}
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
    <motion.div ref={ref} className="relative flex gap-6 md:gap-10"
      initial={{ opacity: 0, y: 30 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ delay: i * 0.12, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}>

      {/* Dot on line */}
      <div className="relative z-10 flex-shrink-0 w-12 md:w-16 flex items-start justify-center pt-1">
        <motion.div
          className="w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center border border-white/10 bg-slate-800/80 backdrop-blur-sm"
          whileHover={{ scale: 1.12, borderColor: "rgba(129,140,248,0.4)" }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}>
          <s.icon className="w-5 h-5 text-blue-400" />
        </motion.div>
      </div>

      {/* Content */}
      <div className="pb-2 pt-1">
        <span className="text-[10px] font-mono text-blue-400/60 tracking-wider">STEP 0{i + 1}</span>
        <h3 className="text-lg md:text-xl font-semibold text-white tracking-tight mt-1 mb-2" style={{ fontFamily: "Sora" }}>{s.title}</h3>
        <p className="text-sm text-slate-400 leading-relaxed max-w-lg">{s.desc}</p>
      </div>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════
   DEMO — animated chat, no card wrapper
   just floating messages on the section bg
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
      {/* Header */}
      <div className="flex items-center gap-2 mb-5 pb-3 border-b border-white/[0.06]">
        <WaveformLogo size={16} className="text-violet-400" />
        <span className="text-xs text-slate-500" style={{ fontFamily: "Sora" }}>mumble</span>
      </div>

      {DEMO_MSGS.map((msg, i) => {
        if (i >= count) return null;
        if (msg.role === "user") return (
          <motion.div key={i} initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} className="flex justify-end">
            <div className="text-xs px-4 py-2.5 rounded-2xl rounded-br-sm bg-indigo-500/15 text-indigo-200 border border-indigo-500/15 max-w-[85%]">{msg.text}</div>
          </motion.div>
        );
        if (msg.role === "tool") return (
          <motion.div key={i} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-2 pl-1">
            <motion.div className="w-1.5 h-1.5 rounded-full bg-emerald-400" animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 1, repeat: 2 }} />
            <span className="text-[10px] italic text-slate-500">{msg.text}</span>
          </motion.div>
        );
        return (
          <motion.div key={i} initial={{ opacity: 0, x: -24 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5 }} className="flex gap-2.5">
            <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 bg-violet-500/15">
              <WaveformLogo size={10} className="text-violet-400" />
            </div>
            <div className="text-xs px-4 py-2.5 rounded-2xl rounded-bl-sm border border-white/[0.06] max-w-[85%]">
              <span className="text-emerald-400 font-semibold">"Estoy feliz"</span>
              <span className="text-slate-400"> — </span>
              <span className="text-white font-medium">estar</span>
              <span className="text-slate-400"> is used for emotions because they are temporary states.</span>
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
    <section className="relative py-28 md:py-36" style={{ background: BG.demo }} data-testid="demo-section">
      {/* Soft violet glow */}
      <div className="absolute top-1/3 left-1/3 w-[500px] h-[500px] pointer-events-none rounded-full"
        style={{ background: "radial-gradient(circle, rgba(139,92,246,0.06) 0%, transparent 60%)" }} />

      <div className="max-w-5xl mx-auto px-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div>
            <Reveal>
              <span className="text-sm font-medium tracking-wider uppercase text-violet-400 mb-3 block">See it in action</span>
            </Reveal>
            <WordReveal text="A conversation, not a classroom" as="h2"
              className="text-3xl md:text-5xl font-bold tracking-tight text-white mb-6" />
            <Reveal delay={0.15}>
              <p className="text-base text-slate-400 leading-relaxed mb-8">
                Ask anything. mumble responds with context-aware corrections, vocabulary insights, and pronunciation guides — streamed in real-time.
              </p>
            </Reveal>
            <Reveal delay={0.25}>
              <button onClick={() => navigate("/chat")}
                className="inline-flex items-center gap-2 text-sm font-semibold text-violet-300 hover:text-violet-200 transition-colors duration-300 group"
                data-testid="demo-try-btn">
                Try it yourself <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
              </button>
            </Reveal>
          </div>
          <Reveal delay={0.2}>
            <DemoChat />
          </Reveal>
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════
   SCENARIOS — scattered floating tags that
   drift on scroll instead of scrolling cards
   ═══════════════════════════════════════════ */
const SCENARIOS = [
  { icon: Briefcase, label: "Job Interview", color: "#fbbf24" },
  { icon: Plane, label: "Travel", color: "#34d399" },
  { icon: UtensilsCrossed, label: "Restaurant", color: "#f472b6" },
  { icon: MessageSquare, label: "Small Talk", color: "#818cf8" },
  { icon: BookOpen, label: "Business", color: "#fb923c" },
];

function ScenariosSection() {
  const containerRef = useRef(null);
  const { scrollYProgress } = useScroll({ target: containerRef, offset: ["start end", "end start"] });

  return (
    <section id="scenarios" ref={containerRef} className="relative py-28 md:py-36 overflow-hidden" style={{ background: BG.scenarios }} data-testid="scenarios-section">
      <div className="max-w-5xl mx-auto px-6 mb-16">
        <Reveal>
          <span className="text-sm font-medium tracking-wider uppercase text-amber-400 mb-3 block">Practice Scenarios</span>
        </Reveal>
        <WordReveal text="Real conversations for real life" as="h2"
          className="text-4xl md:text-5xl font-bold tracking-tight text-white mb-4" />
        <Reveal delay={0.1}>
          <p className="text-base text-slate-400 max-w-xl">Pick a scenario and mumble drops you into a realistic conversation. Practice ordering food, acing interviews, or chatting with locals.</p>
        </Reveal>
      </div>

      {/* Floating scenario tags */}
      <div className="max-w-5xl mx-auto px-6">
        <div className="flex flex-wrap gap-4 md:gap-5 justify-center">
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
  const y = useTransform(scrollProgress, [0, 1], [20 + i * 8, -(10 + i * 6)]);

  return (
    <motion.div ref={ref} style={{ y }}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={inView ? { opacity: 1, scale: 1 } : {}}
      transition={{ delay: i * 0.08, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ scale: 1.08, y: -4 }}
      className="cursor-default"
    >
      <div className="flex items-center gap-3 px-6 py-4 rounded-full border border-white/[0.06] bg-white/[0.03] backdrop-blur-sm hover:bg-white/[0.06] transition-all duration-300 group">
        <s.icon className="w-5 h-5 transition-transform duration-300 group-hover:scale-110" style={{ color: s.color }} />
        <span className="text-sm font-medium text-slate-300 group-hover:text-white transition-colors duration-300">{s.label}</span>
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
    <section className="relative py-36 md:py-48 overflow-hidden" style={{ background: BG.cta }} data-testid="cta-section">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] pointer-events-none rounded-full"
        style={{ background: "radial-gradient(circle, rgba(129,140,248,0.07) 0%, transparent 60%)" }} />

      <div className="relative max-w-3xl mx-auto px-6 text-center">
        <Reveal>
          <motion.div className="inline-block mb-8"
            animate={{ scale: [1, 1.06, 1] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}>
            <WaveformLogo size={44} className="text-indigo-400" />
          </motion.div>
        </Reveal>

        <WordReveal text="Stop studying. Start speaking." as="h2"
          className="text-4xl md:text-6xl font-bold tracking-tighter text-white mb-6" />

        <Reveal delay={0.15}>
          <p className="text-lg text-slate-400 leading-relaxed max-w-xl mx-auto mb-12">
            The best way to learn a language is to use it. mumble gives you a patient,
            always-available partner who adapts to <span className="text-emerald-400">your</span> level.
          </p>
        </Reveal>

        <Reveal delay={0.3}>
          <Button onClick={() => navigate("/chat")}
            className="rounded-full px-10 py-7 text-base font-semibold bg-indigo-500 hover:bg-indigo-400 text-white shadow-[0_0_32px_rgba(99,102,241,0.4)] hover:shadow-[0_0_48px_rgba(99,102,241,0.6)] transition-all duration-300 border-0 hover:-translate-y-1"
            data-testid="cta-start-btn">
            Begin your first lesson <ArrowRight className="ml-2 w-5 h-5" />
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
    <footer className="py-8 border-t border-white/5" style={{ background: BG.footer }} data-testid="footer">
      <div className="max-w-5xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <WaveformLogo size={18} className="text-indigo-400 opacity-50" />
          <span className="text-xs text-slate-500" style={{ fontFamily: "Sora" }}>mumble</span>
        </div>
        <div className="flex items-center gap-6">
          {[{ label: "Practice", href: "/chat" }, { label: "Dashboard", href: "/dashboard" }, { label: "Vocabulary", href: "/vocabulary" }].map(l => (
            <button key={l.href} onClick={() => navigate(l.href)}
              className="text-xs text-slate-500 hover:text-white transition-colors duration-300">{l.label}</button>
          ))}
        </div>
        <p className="text-xs text-slate-600">AI-powered language learning</p>
      </div>
    </footer>
  );
}

/* ═══════════════════════════════════════════
   PAGE
   ═══════════════════════════════════════════ */
export default function LandingPage() {
  return (
    <div className="min-h-screen text-white" style={{ fontFamily: "DM Sans, sans-serif", background: BG.hero }}>
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
