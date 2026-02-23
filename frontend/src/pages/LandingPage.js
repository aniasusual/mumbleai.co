import { useNavigate } from "react-router-dom";
import { useRef, useEffect, useState } from "react";
import {
  motion, useScroll, useTransform, useInView, useSpring, useMotionValue,
} from "framer-motion";
import { Button } from "@/components/ui/button";
import { WaveformLogo } from "@/components/WaveformLogo";
import {
  Mic, ArrowRight, Brain, Languages, AudioLines, Target, BookOpen, Eye,
  Briefcase, Plane, UtensilsCrossed, MessageSquare, Zap, GraduationCap,
} from "lucide-react";

/* ═══════════════════════════════════════════════
   ANIMATION PRIMITIVES
   ═══════════════════════════════════════════════ */

/** Reveal each word one by one on scroll */
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
          initial={{ opacity: 0, y: 40, filter: "blur(8px)" }}
          animate={inView ? { opacity: 1, y: 0, filter: "blur(0px)" } : {}}
          transition={{ delay: i * 0.06, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        >
          {word}
        </motion.span>
      ))}
    </Tag>
  );
}

/** Fade + slide up on scroll */
function RevealOnScroll({ children, className, delay = 0 }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  return (
    <motion.div
      ref={ref}
      className={className}
      initial={{ opacity: 0, y: 50 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ delay, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}

/** 3D tilt card on mouse move */
function TiltElement({ children, className }) {
  const ref = useRef(null);
  const rotateX = useMotionValue(0);
  const rotateY = useMotionValue(0);
  const smoothX = useSpring(rotateX, { stiffness: 200, damping: 20 });
  const smoothY = useSpring(rotateY, { stiffness: 200, damping: 20 });

  const handleMouse = (e) => {
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return;
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    rotateX.set(y * -12);
    rotateY.set(x * 12);
  };

  const handleLeave = () => { rotateX.set(0); rotateY.set(0); };

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMouse}
      onMouseLeave={handleLeave}
      style={{ rotateX: smoothX, rotateY: smoothY, transformPerspective: 800 }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════
   FLOATING LANGUAGES ORB
   ═══════════════════════════════════════════════ */
const LANGUAGES = [
  "Spanish", "French", "Japanese", "Mandarin", "German", "Portuguese",
  "Korean", "Italian", "Arabic", "Hindi", "Turkish", "Dutch",
  "Russian", "Swedish", "Thai", "Vietnamese", "Greek", "Polish",
];

function LanguageOrbit() {
  return (
    <div className="relative w-[400px] h-[400px]">
      {/* Center logo */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
        <motion.div
          animate={{ scale: [1, 1.05, 1] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        >
          <WaveformLogo size={56} className="text-emerald-400" />
        </motion.div>
      </div>
      {/* Orbiting languages */}
      {LANGUAGES.map((lang, i) => {
        const angle = (i / LANGUAGES.length) * 360;
        const radius = 140 + (i % 3) * 30;
        const duration = 30 + (i % 4) * 8;
        return (
          <motion.div
            key={lang}
            className="absolute top-1/2 left-1/2 origin-center"
            animate={{ rotate: [angle, angle + 360] }}
            transition={{ duration, repeat: Infinity, ease: "linear" }}
            style={{ width: 0, height: 0 }}
          >
            <span
              className="absolute text-[11px] font-medium whitespace-nowrap"
              style={{
                transform: `translateX(${radius}px) rotate(-${angle}deg)`,
                color: i % 3 === 0 ? "rgba(52,211,153,0.7)" : i % 3 === 1 ? "rgba(52,211,153,0.4)" : "rgba(255,255,255,0.15)",
              }}
            >
              {lang}
            </span>
          </motion.div>
        );
      })}
      {/* Orbit rings */}
      {[140, 170, 200].map((r, i) => (
        <div
          key={r}
          className="absolute top-1/2 left-1/2 rounded-full border border-white/[0.03]"
          style={{
            width: r * 2, height: r * 2,
            transform: "translate(-50%, -50%)",
          }}
        />
      ))}
    </div>
  );
}

/* ═══════════════════════════════════════════════
   ANIMATED CHAT DEMO
   ═══════════════════════════════════════════════ */
const DEMO_MESSAGES = [
  { role: "user", text: "How do I say 'I am happy' in Spanish?" },
  { role: "tool", text: "Checking grammar rules..." },
  { role: "tool", text: "Looking up vocabulary..." },
  { role: "ai", text: '"Estoy feliz" — We use estar here because emotions are temporary states.' },
];

function ChatDemo() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });
  const [visibleCount, setVisibleCount] = useState(0);

  useEffect(() => {
    if (!inView) return;
    let idx = 0;
    const timer = setInterval(() => {
      idx++;
      setVisibleCount(idx);
      if (idx >= DEMO_MESSAGES.length) clearInterval(timer);
    }, 800);
    return () => clearInterval(timer);
  }, [inView]);

  return (
    <div ref={ref} className="w-full max-w-md mx-auto">
      <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] backdrop-blur-sm overflow-hidden">
        {/* Header */}
        <div className="px-5 py-3 border-b border-white/[0.04] flex items-center gap-2">
          <WaveformLogo size={20} className="text-emerald-400" />
          <span className="text-xs text-gray-500" style={{ fontFamily: 'Sora, sans-serif' }}>mumble</span>
          <div className="ml-auto flex gap-1">
            <div className="w-2 h-2 rounded-full bg-emerald-500/40" />
            <div className="w-2 h-2 rounded-full bg-white/10" />
            <div className="w-2 h-2 rounded-full bg-white/10" />
          </div>
        </div>
        {/* Messages */}
        <div className="p-5 space-y-3 min-h-[220px]">
          {DEMO_MESSAGES.map((msg, i) => {
            if (i >= visibleCount) return null;
            if (msg.role === "user") {
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.4 }}
                  className="flex justify-end"
                >
                  <div className="bg-emerald-500/20 border border-emerald-500/20 text-emerald-300 text-xs px-4 py-2.5 rounded-2xl rounded-br-sm max-w-[80%]">
                    {msg.text}
                  </div>
                </motion.div>
              );
            }
            if (msg.role === "tool") {
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3 }}
                  className="flex items-center gap-2 pl-2"
                >
                  <motion.div
                    className="w-1.5 h-1.5 rounded-full bg-emerald-400"
                    animate={{ scale: [1, 1.5, 1] }}
                    transition={{ duration: 0.6, repeat: 2 }}
                  />
                  <span className="text-[10px] text-emerald-400/60 italic">{msg.text}</span>
                </motion.div>
              );
            }
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5 }}
                className="flex gap-2"
              >
                <div className="w-5 h-5 rounded-full bg-white/[0.04] flex items-center justify-center flex-shrink-0 mt-1">
                  <WaveformLogo size={12} className="text-emerald-400" />
                </div>
                <div className="bg-white/[0.04] border border-white/[0.06] text-gray-300 text-xs px-4 py-2.5 rounded-2xl rounded-bl-sm max-w-[85%]">
                  <span className="text-emerald-400 font-medium">&quot;Estoy feliz&quot;</span>
                  <span className="text-gray-500"> — We use </span>
                  <span className="text-white">estar</span>
                  <span className="text-gray-500"> here because emotions are temporary states.</span>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════
   FEATURE ROWS (no cards!)
   ═══════════════════════════════════════════════ */
const FEATURE_ROWS = [
  {
    icon: Mic,
    title: "Voice-First Conversations",
    desc: "Speak naturally in any language. mumble listens with Whisper, understands context, and responds with natural voice — like talking to a real tutor.",
    accent: "from-emerald-400/20 to-transparent",
  },
  {
    icon: AudioLines,
    title: "Karaoke Word Tracking",
    desc: "As mumble speaks, every word highlights in real-time. Follow along, connecting sound to text. Your reading and listening skills improve simultaneously.",
    accent: "from-cyan-400/20 to-transparent",
  },
  {
    icon: Brain,
    title: "AI Tools Working Live",
    desc: "Watch grammar checkers, vocabulary lookups, and pronunciation guides activate in real-time. Transparency into how your tutor thinks.",
    accent: "from-violet-400/20 to-transparent",
  },
  {
    icon: GraduationCap,
    title: "Adaptive Curriculum",
    desc: "After assessing your level, mumble builds a personalized study plan around your goals, timeline, and interests. Every lesson adapts as you improve.",
    accent: "from-amber-400/20 to-transparent",
  },
];

function FeatureRow({ feature, index }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });
  const isEven = index % 2 === 0;

  return (
    <motion.div
      ref={ref}
      className="relative py-16 md:py-24"
      initial={{ opacity: 0 }}
      animate={inView ? { opacity: 1 } : {}}
      transition={{ duration: 0.8 }}
    >
      {/* Accent gradient line */}
      <motion.div
        className={`absolute top-0 ${isEven ? "left-0" : "right-0"} h-full w-px bg-gradient-to-b ${feature.accent}`}
        initial={{ scaleY: 0 }}
        animate={inView ? { scaleY: 1 } : {}}
        transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
        style={{ transformOrigin: "top" }}
      />

      <div className={`flex flex-col md:flex-row items-start gap-8 md:gap-16 ${isEven ? "" : "md:flex-row-reverse"}`}>
        {/* Icon */}
        <motion.div
          className="flex-shrink-0"
          initial={{ opacity: 0, scale: 0.5, rotate: -20 }}
          animate={inView ? { opacity: 1, scale: 1, rotate: 0 } : {}}
          transition={{ delay: 0.2, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="w-16 h-16 rounded-2xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center">
            <feature.icon className="w-7 h-7 text-emerald-400" />
          </div>
        </motion.div>

        {/* Text */}
        <div className={`max-w-lg ${isEven ? "" : "md:text-right"}`}>
          <motion.div
            initial={{ opacity: 0, x: isEven ? -30 : 30 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ delay: 0.3, duration: 0.6 }}
          >
            <span className="text-[10px] uppercase tracking-[0.2em] text-emerald-500/50 mb-2 block">
              0{index + 1}
            </span>
            <h3
              className="text-2xl md:text-3xl font-semibold text-white mb-4 tracking-tight"
              style={{ fontFamily: 'Sora, sans-serif' }}
            >
              {feature.title}
            </h3>
          </motion.div>
          <motion.p
            className="text-gray-500 leading-relaxed text-base"
            initial={{ opacity: 0, x: isEven ? -20 : 20 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ delay: 0.45, duration: 0.6 }}
          >
            {feature.desc}
          </motion.p>
        </div>
      </div>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════
   TOOLS ORBIT
   ═══════════════════════════════════════════════ */
const TOOL_DATA = [
  { icon: Target, label: "Grammar", color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/20" },
  { icon: BookOpen, label: "Vocabulary", color: "text-cyan-400", bg: "bg-cyan-500/10 border-cyan-500/20" },
  { icon: AudioLines, label: "Pronunciation", color: "text-violet-400", bg: "bg-violet-500/10 border-violet-500/20" },
  { icon: Eye, label: "Evaluation", color: "text-amber-400", bg: "bg-amber-500/10 border-amber-500/20" },
];

function ToolsShowcase() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <div ref={ref} className="flex flex-wrap justify-center gap-6 md:gap-10">
      {TOOL_DATA.map((tool, i) => (
        <motion.div
          key={tool.label}
          className="flex flex-col items-center gap-3"
          initial={{ opacity: 0, y: 40, scale: 0.8 }}
          animate={inView ? { opacity: 1, y: 0, scale: 1 } : {}}
          transition={{ delay: i * 0.15, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        >
          <TiltElement className={`w-20 h-20 rounded-2xl ${tool.bg} border flex items-center justify-center cursor-default`}>
            <tool.icon className={`w-8 h-8 ${tool.color}`} />
          </TiltElement>
          <span className="text-xs font-medium text-gray-400">{tool.label}</span>
        </motion.div>
      ))}
    </div>
  );
}

/* ═══════════════════════════════════════════════
   SCENARIOS — horizontal scroll with parallax
   ═══════════════════════════════════════════════ */
const SCENARIO_DATA = [
  { icon: Briefcase, title: "Job Interview", desc: "Nail your next interview with confident answers in any language." },
  { icon: Plane, title: "Travel", desc: "Navigate airports, hotels, and directions anywhere in the world." },
  { icon: UtensilsCrossed, title: "Restaurant", desc: "Order like a local — allergies, specials, and small talk." },
  { icon: MessageSquare, title: "Small Talk", desc: "Master the art of casual conversation with anyone, anywhere." },
  { icon: Languages, title: "Business", desc: "Present, negotiate, and email professionally in your target language." },
];

function ScenariosScroll() {
  const containerRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"],
  });
  const x = useTransform(scrollYProgress, [0, 1], [100, -200]);

  return (
    <div ref={containerRef} className="overflow-hidden">
      <motion.div className="flex gap-5 py-4" style={{ x }}>
        {SCENARIO_DATA.map((s, i) => (
          <TiltElement
            key={s.title}
            className="flex-shrink-0 w-72 rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6 hover:bg-white/[0.04] hover:border-emerald-500/15 transition-colors duration-500 cursor-default"
          >
            <s.icon className="w-6 h-6 text-emerald-400 mb-4" />
            <h4 className="text-sm font-semibold text-white mb-2" style={{ fontFamily: 'Sora, sans-serif' }}>{s.title}</h4>
            <p className="text-xs text-gray-600 leading-relaxed">{s.desc}</p>
          </TiltElement>
        ))}
      </motion.div>
    </div>
  );
}

/* ═══════════════════════════════════════════════
   SCROLL PROGRESS BAR
   ═══════════════════════════════════════════════ */
function ScrollProgress() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 100, damping: 30 });
  return (
    <motion.div
      className="fixed top-0 left-0 right-0 h-[2px] bg-emerald-500 z-[60] origin-left"
      style={{ scaleX }}
    />
  );
}

/* ═══════════════════════════════════════════════
   MAIN PAGE
   ═══════════════════════════════════════════════ */
export default function LandingPage() {
  const navigate = useNavigate();
  const heroRef = useRef(null);
  const { scrollYProgress: heroScroll } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });
  const heroY = useTransform(heroScroll, [0, 1], [0, 150]);
  const heroOpacity = useTransform(heroScroll, [0, 0.6], [1, 0]);
  const heroScale = useTransform(heroScroll, [0, 0.6], [1, 0.95]);

  return (
    <div className="min-h-screen bg-[#050805] text-gray-100 overflow-x-hidden" style={{ fontFamily: 'DM Sans, sans-serif' }}>
      <ScrollProgress />

      {/* ── NAV ── */}
      <nav className="fixed top-0 w-full z-50 backdrop-blur-xl bg-[#050805]/60 border-b border-white/[0.03]" data-testid="navbar">
        <div className="max-w-6xl mx-auto px-6 flex items-center justify-between h-14">
          <button onClick={() => navigate("/")} className="flex items-center gap-2 group" data-testid="logo-button">
            <WaveformLogo size={28} className="text-emerald-400 group-hover:text-emerald-300 transition-colors duration-300" />
            <span className="text-sm font-medium text-white/90 tracking-tight" style={{ fontFamily: 'Sora, sans-serif' }}>mumble</span>
          </button>
          <div className="hidden md:flex items-center gap-8">
            {["Features", "How it works", "Scenarios"].map(l => (
              <a key={l} href={`#${l.toLowerCase().replace(/ /g, "-")}`} className="text-xs text-gray-600 hover:text-gray-300 transition-colors duration-200 tracking-wide">{l}</a>
            ))}
          </div>
          <Button
            onClick={() => navigate("/chat")}
            className="bg-emerald-500 hover:bg-emerald-400 text-black font-semibold rounded-full px-5 h-8 text-xs shadow-[0_0_20px_rgba(52,211,153,0.12)] hover:shadow-[0_0_25px_rgba(52,211,153,0.2)] transition-all duration-300"
            data-testid="nav-start-btn"
          >
            Start Free
          </Button>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section ref={heroRef} className="relative min-h-screen flex items-center justify-center overflow-hidden" data-testid="hero-section">
        {/* Background elements */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute w-[600px] h-[600px] bg-emerald-600/10 rounded-full blur-[160px] top-1/4 left-1/4 -translate-x-1/2" />
          <div className="absolute w-[400px] h-[400px] bg-emerald-500/5 rounded-full blur-[120px] bottom-1/4 right-1/4" />
          {/* Noise grain */}
          <div className="absolute inset-0 opacity-[0.015]" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='1'/%3E%3C/svg%3E")`,
          }} />
        </div>

        <motion.div
          className="relative max-w-6xl mx-auto px-6 pt-24 pb-12 flex flex-col lg:flex-row items-center gap-16 lg:gap-24"
          style={{ y: heroY, opacity: heroOpacity, scale: heroScale }}
        >
          {/* Left — Text */}
          <div className="flex-1 max-w-xl">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-emerald-500/15 bg-emerald-500/5 text-emerald-400 text-[10px] font-medium tracking-wider uppercase mb-8">
                <Zap className="w-3 h-3" />
                AI Language Tutor
              </span>
            </motion.div>

            <WordReveal
              text="Learn any language by actually speaking it"
              className="text-4xl sm:text-5xl lg:text-6xl tracking-tight leading-[1.1] text-white mb-8"
              style={{ fontFamily: 'Sora, sans-serif', fontWeight: 600 }}
            />

            <motion.p
              className="text-base text-gray-500 leading-relaxed max-w-md mb-10"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8, duration: 0.6 }}
            >
              Your personal tutor that listens, corrects, and adapts.
              Voice-first. Real-time feedback. No textbooks.
            </motion.p>

            <motion.div
              className="flex flex-col sm:flex-row gap-3"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1, duration: 0.5 }}
            >
              <Button
                onClick={() => navigate("/chat")}
                className="bg-emerald-500 hover:bg-emerald-400 text-black font-semibold rounded-full px-7 py-5 text-sm shadow-[0_0_30px_rgba(52,211,153,0.15)] hover:shadow-[0_0_40px_rgba(52,211,153,0.3)] transition-all duration-300"
                data-testid="hero-start-btn"
              >
                Start a conversation <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                onClick={() => navigate("/dashboard")}
                className="rounded-full px-7 py-5 text-sm border-white/[0.08] bg-white/[0.02] hover:bg-white/[0.05] text-gray-400"
                data-testid="hero-dashboard-btn"
              >
                View Dashboard
              </Button>
            </motion.div>
          </div>

          {/* Right — Language Orbit */}
          <motion.div
            className="hidden lg:block flex-shrink-0"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5, duration: 1, ease: [0.22, 1, 0.36, 1] }}
          >
            <LanguageOrbit />
          </motion.div>
        </motion.div>

        {/* Scroll indicator */}
        <motion.div
          className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5, duration: 0.5 }}
        >
          <span className="text-[10px] text-gray-700 tracking-wider uppercase">Scroll</span>
          <motion.div
            className="w-px h-8 bg-gradient-to-b from-emerald-500/40 to-transparent"
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          />
        </motion.div>
      </section>

      {/* ── FEATURES — alternating rows, not cards ── */}
      <section id="features" className="relative py-16 md:py-24" data-testid="features-section">
        <div className="max-w-4xl mx-auto px-6">
          <RevealOnScroll>
            <span className="text-[10px] uppercase tracking-[0.25em] text-emerald-500/50 block mb-3">Core Features</span>
          </RevealOnScroll>
          <WordReveal
            text="Built different from day one"
            as="h2"
            className="text-3xl md:text-4xl tracking-tight text-white mb-4"
            style={{ fontFamily: 'Sora, sans-serif', fontWeight: 600 }}
          />
          <RevealOnScroll delay={0.2}>
            <div className="h-px w-16 bg-gradient-to-r from-emerald-500/40 to-transparent mb-8" />
          </RevealOnScroll>
          {FEATURE_ROWS.map((f, i) => (
            <FeatureRow key={f.title} feature={f} index={i} />
          ))}
        </div>
      </section>

      {/* ── TOOLS SHOWCASE ── */}
      <section id="how-it-works" className="relative py-24 md:py-32" data-testid="tools-section">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <RevealOnScroll>
            <span className="text-[10px] uppercase tracking-[0.25em] text-emerald-500/50 block mb-3">Under the hood</span>
          </RevealOnScroll>
          <WordReveal
            text="Four specialized AI subagents"
            as="h2"
            className="text-3xl md:text-4xl tracking-tight text-white mb-6"
            style={{ fontFamily: 'Sora, sans-serif', fontWeight: 600 }}
          />
          <RevealOnScroll delay={0.2}>
            <p className="text-gray-500 max-w-md mx-auto mb-16 leading-relaxed">
              Every message activates real-time AI tools. Watch them work as they check grammar,
              look up vocabulary, and evaluate your responses.
            </p>
          </RevealOnScroll>
          <ToolsShowcase />
        </div>
      </section>

      {/* ── LIVE DEMO — animated chat ── */}
      <section className="relative py-24 md:py-32" data-testid="demo-section">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute w-[500px] h-[500px] bg-emerald-600/8 rounded-full blur-[140px] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
        </div>
        <div className="relative max-w-4xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <RevealOnScroll>
                <span className="text-[10px] uppercase tracking-[0.25em] text-emerald-500/50 block mb-3">See it in action</span>
              </RevealOnScroll>
              <WordReveal
                text="A conversation, not a classroom"
                as="h2"
                className="text-3xl md:text-4xl tracking-tight text-white mb-6"
                style={{ fontFamily: 'Sora, sans-serif', fontWeight: 600 }}
              />
              <RevealOnScroll delay={0.2}>
                <p className="text-gray-500 leading-relaxed mb-8">
                  Ask anything. mumble responds with context-aware corrections,
                  vocabulary insights, and pronunciation guides — all in real-time.
                </p>
              </RevealOnScroll>
              <RevealOnScroll delay={0.3}>
                <Button
                  onClick={() => navigate("/chat")}
                  className="bg-white/[0.05] hover:bg-white/[0.08] text-white border border-white/[0.08] rounded-full px-6 h-10 text-sm transition-all duration-300"
                  data-testid="demo-try-btn"
                >
                  Try it yourself <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </RevealOnScroll>
            </div>
            <ChatDemo />
          </div>
        </div>
      </section>

      {/* ── SCENARIOS — parallax horizontal scroll ── */}
      <section id="scenarios" className="relative py-24 md:py-32" data-testid="scenarios-section">
        <div className="max-w-4xl mx-auto px-6 mb-12">
          <RevealOnScroll>
            <span className="text-[10px] uppercase tracking-[0.25em] text-emerald-500/50 block mb-3">Practice Scenarios</span>
          </RevealOnScroll>
          <WordReveal
            text="Real conversations, real confidence"
            as="h2"
            className="text-3xl md:text-4xl tracking-tight text-white"
            style={{ fontFamily: 'Sora, sans-serif', fontWeight: 600 }}
          />
        </div>
        <div className="max-w-6xl mx-auto px-6">
          <ScenariosScroll />
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="relative py-32 md:py-44" data-testid="cta-section">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute w-[700px] h-[700px] bg-emerald-600/10 rounded-full blur-[180px] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
        </div>
        <div className="relative max-w-2xl mx-auto px-6 text-center">
          <WordReveal
            text="Stop studying. Start speaking."
            as="h2"
            className="text-3xl md:text-5xl tracking-tight text-white mb-6"
            style={{ fontFamily: 'Sora, sans-serif', fontWeight: 600 }}
          />
          <RevealOnScroll delay={0.3}>
            <p className="text-gray-500 text-base md:text-lg mb-12 max-w-md mx-auto">
              The best way to learn a language is to use it. mumble gives you a patient, always-available partner who adapts to your level.
            </p>
          </RevealOnScroll>
          <RevealOnScroll delay={0.5}>
            <Button
              onClick={() => navigate("/chat")}
              className="bg-emerald-500 hover:bg-emerald-400 text-black font-semibold rounded-full px-10 py-6 text-base shadow-[0_0_50px_rgba(52,211,153,0.2)] hover:shadow-[0_0_70px_rgba(52,211,153,0.35)] transition-all duration-300"
              data-testid="cta-start-btn"
            >
              Begin your first lesson <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
          </RevealOnScroll>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="border-t border-white/[0.04] py-8" data-testid="footer">
        <div className="max-w-6xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <WaveformLogo size={22} className="text-emerald-400/60" />
            <span className="text-xs text-gray-700" style={{ fontFamily: 'Sora, sans-serif' }}>mumble</span>
          </div>
          <div className="flex items-center gap-6">
            {[
              { label: "Practice", href: "/chat" },
              { label: "Dashboard", href: "/dashboard" },
              { label: "Vocabulary", href: "/vocabulary" },
            ].map(l => (
              <button key={l.href} onClick={() => navigate(l.href)} className="text-[10px] text-gray-700 hover:text-gray-400 transition-colors duration-200 tracking-wide">{l.label}</button>
            ))}
          </div>
          <p className="text-[10px] text-gray-800 tracking-wide">AI-powered language learning</p>
        </div>
      </footer>
    </div>
  );
}
