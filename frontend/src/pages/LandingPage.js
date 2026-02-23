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

function RevealOnScroll({ children, className, delay = 0 }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  return (
    <motion.div
      ref={ref} className={className}
      initial={{ opacity: 0, y: 50 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ delay, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}

function TiltElement({ children, className }) {
  const ref = useRef(null);
  const rotateX = useMotionValue(0);
  const rotateY = useMotionValue(0);
  const smoothX = useSpring(rotateX, { stiffness: 200, damping: 20 });
  const smoothY = useSpring(rotateY, { stiffness: 200, damping: 20 });
  const handleMouse = (e) => {
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return;
    rotateX.set(((e.clientY - rect.top) / rect.height - 0.5) * -14);
    rotateY.set(((e.clientX - rect.left) / rect.width - 0.5) * 14);
  };
  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMouse}
      onMouseLeave={() => { rotateX.set(0); rotateY.set(0); }}
      style={{ rotateX: smoothX, rotateY: smoothY, transformPerspective: 800 }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════
   AURORA / MESH GRADIENT BACKGROUND
   ═══════════════════════════════════════════════ */
function AuroraBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <motion.div
        className="absolute w-[700px] h-[700px] rounded-full blur-[180px] opacity-25"
        style={{ background: "radial-gradient(circle, #6366f1, transparent 70%)", top: "5%", left: "-10%" }}
        animate={{ x: [0, 50, 0], y: [0, 30, 0] }}
        transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute w-[600px] h-[600px] rounded-full blur-[160px] opacity-20"
        style={{ background: "radial-gradient(circle, #06b6d4, transparent 70%)", top: "20%", right: "-5%" }}
        animate={{ x: [0, -40, 0], y: [0, 50, 0] }}
        transition={{ duration: 22, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute w-[500px] h-[500px] rounded-full blur-[140px] opacity-20"
        style={{ background: "radial-gradient(circle, #f472b6, transparent 70%)", bottom: "10%", left: "30%" }}
        animate={{ x: [0, 60, 0], y: [0, -40, 0] }}
        transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute w-[400px] h-[400px] rounded-full blur-[120px] opacity-15"
        style={{ background: "radial-gradient(circle, #fbbf24, transparent 70%)", top: "50%", right: "20%" }}
        animate={{ x: [0, -30, 0], y: [0, -60, 0] }}
        transition={{ duration: 25, repeat: Infinity, ease: "easeInOut" }}
      />
    </div>
  );
}

function SectionGlow({ colors, position = "center" }) {
  const posMap = {
    center: "top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2",
    left: "top-1/2 left-0 -translate-y-1/2 -translate-x-1/3",
    right: "top-1/2 right-0 -translate-y-1/2 translate-x-1/3",
  };
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {colors.map((c, i) => (
        <motion.div
          key={i}
          className={`absolute w-[500px] h-[500px] rounded-full blur-[150px] opacity-15 ${posMap[position]}`}
          style={{ background: `radial-gradient(circle, ${c}, transparent 70%)`, transform: `translate(${i * 30}px, ${i * -20}px)` }}
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ duration: 8 + i * 2, repeat: Infinity, ease: "easeInOut" }}
        />
      ))}
    </div>
  );
}

/* ═══════════════════════════════════════════════
   LANGUAGE ORBIT (colorful version)
   ═══════════════════════════════════════════════ */
const LANG_DATA = [
  { name: "Spanish", color: "#f472b6" }, { name: "French", color: "#818cf8" },
  { name: "Japanese", color: "#fb923c" }, { name: "Mandarin", color: "#f87171" },
  { name: "German", color: "#34d399" }, { name: "Portuguese", color: "#60a5fa" },
  { name: "Korean", color: "#c084fc" }, { name: "Italian", color: "#fbbf24" },
  { name: "Arabic", color: "#2dd4bf" }, { name: "Hindi", color: "#fb7185" },
  { name: "Turkish", color: "#a78bfa" }, { name: "Dutch", color: "#38bdf8" },
  { name: "Russian", color: "#4ade80" }, { name: "Swedish", color: "#e879f9" },
  { name: "Thai", color: "#facc15" }, { name: "Vietnamese", color: "#22d3ee" },
  { name: "Greek", color: "#f97316" }, { name: "Polish", color: "#a3e635" },
];

function LanguageOrbit() {
  return (
    <div className="relative w-[420px] h-[420px]">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
        <motion.div animate={{ scale: [1, 1.08, 1] }} transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}>
          <WaveformLogo size={56} className="text-white" />
        </motion.div>
      </div>
      {LANG_DATA.map((lang, i) => {
        const angle = (i / LANG_DATA.length) * 360;
        const radius = 130 + (i % 3) * 35;
        const dur = 28 + (i % 5) * 7;
        return (
          <motion.div
            key={lang.name}
            className="absolute top-1/2 left-1/2"
            animate={{ rotate: [angle, angle + 360] }}
            transition={{ duration: dur, repeat: Infinity, ease: "linear" }}
            style={{ width: 0, height: 0 }}
          >
            <span
              className="absolute text-[11px] font-semibold whitespace-nowrap"
              style={{ transform: `translateX(${radius}px) rotate(-${angle}deg)`, color: lang.color, textShadow: `0 0 20px ${lang.color}40` }}
            >
              {lang.name}
            </span>
          </motion.div>
        );
      })}
      {[130, 165, 200].map((r) => (
        <div key={r} className="absolute top-1/2 left-1/2 rounded-full border border-white/[0.04]" style={{ width: r * 2, height: r * 2, transform: "translate(-50%, -50%)" }} />
      ))}
    </div>
  );
}

/* ═══════════════════════════════════════════════
   CHAT DEMO (colorful)
   ═══════════════════════════════════════════════ */
const DEMO_MSGS = [
  { role: "user", text: "How do I say 'I am happy' in Spanish?" },
  { role: "tool", text: "Checking grammar rules...", color: "#34d399" },
  { role: "tool", text: "Looking up vocabulary...", color: "#818cf8" },
  { role: "ai", text: '"Estoy feliz" — We use estar here because emotions are temporary states.' },
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
    <TiltElement className="w-full max-w-md mx-auto">
      <div ref={ref} className="rounded-2xl border border-white/[0.08] bg-white/[0.03] backdrop-blur-md overflow-hidden shadow-[0_8px_60px_rgba(99,102,241,0.08)]">
        <div className="px-5 py-3 border-b border-white/[0.06] flex items-center gap-2 bg-white/[0.02]">
          <WaveformLogo size={20} className="text-violet-400" />
          <span className="text-xs text-gray-400" style={{ fontFamily: 'Sora, sans-serif' }}>mumble</span>
          <div className="ml-auto flex gap-1.5">
            <div className="w-2 h-2 rounded-full bg-rose-400/50" />
            <div className="w-2 h-2 rounded-full bg-amber-400/50" />
            <div className="w-2 h-2 rounded-full bg-emerald-400/50" />
          </div>
        </div>
        <div className="p-5 space-y-3 min-h-[220px]">
          {DEMO_MSGS.map((msg, i) => {
            if (i >= count) return null;
            if (msg.role === "user") return (
              <motion.div key={i} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="flex justify-end">
                <div className="bg-gradient-to-r from-violet-500/20 to-fuchsia-500/20 border border-violet-500/20 text-violet-200 text-xs px-4 py-2.5 rounded-2xl rounded-br-sm max-w-[80%]">{msg.text}</div>
              </motion.div>
            );
            if (msg.role === "tool") return (
              <motion.div key={i} initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} className="flex items-center gap-2 pl-2">
                <motion.div className="w-1.5 h-1.5 rounded-full" style={{ background: msg.color }} animate={{ scale: [1, 1.5, 1] }} transition={{ duration: 0.6, repeat: 2 }} />
                <span className="text-[10px] italic" style={{ color: msg.color + "99" }}>{msg.text}</span>
              </motion.div>
            );
            return (
              <motion.div key={i} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5 }} className="flex gap-2">
                <div className="w-5 h-5 rounded-full bg-gradient-to-br from-violet-500/20 to-cyan-500/20 flex items-center justify-center flex-shrink-0 mt-1">
                  <WaveformLogo size={10} className="text-cyan-400" />
                </div>
                <div className="bg-white/[0.04] border border-white/[0.06] text-xs px-4 py-2.5 rounded-2xl rounded-bl-sm max-w-[85%]">
                  <span className="text-cyan-300 font-medium">&quot;Estoy feliz&quot;</span>
                  <span className="text-gray-500"> — We use </span>
                  <span className="text-white">estar</span>
                  <span className="text-gray-500"> because emotions are temporary.</span>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </TiltElement>
  );
}

/* ═══════════════════════════════════════════════
   FEATURES — big colorful rows
   ═══════════════════════════════════════════════ */
const FEATURES = [
  { icon: Mic, title: "Voice-First Conversations", desc: "Speak naturally in any language. mumble listens, understands context, and responds with natural voice.", gradient: "from-rose-500 to-orange-400", glow: "#f472b6" },
  { icon: AudioLines, title: "Karaoke Word Tracking", desc: "Every word highlights as the AI speaks. Follow along, connecting sound to text in real-time.", gradient: "from-cyan-400 to-blue-500", glow: "#22d3ee" },
  { icon: Brain, title: "Live AI Tools", desc: "Watch grammar checkers, vocabulary lookups, and pronunciation guides activate as you learn.", gradient: "from-violet-500 to-purple-600", glow: "#8b5cf6" },
  { icon: GraduationCap, title: "Adaptive Curriculum", desc: "A personalized study plan built around your goals, timeline, and interests. Adapts as you improve.", gradient: "from-amber-400 to-yellow-500", glow: "#fbbf24" },
];

function FeatureRow({ f, i }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });
  const isEven = i % 2 === 0;

  return (
    <motion.div
      ref={ref}
      className="relative py-12 md:py-20"
      initial={{ opacity: 0 }}
      animate={inView ? { opacity: 1 } : {}}
      transition={{ duration: 0.8 }}
    >
      <div className={`flex flex-col md:flex-row items-center gap-10 md:gap-20 ${isEven ? "" : "md:flex-row-reverse"}`}>
        {/* Colorful icon */}
        <motion.div
          className="flex-shrink-0"
          initial={{ opacity: 0, scale: 0.5, rotate: -30 }}
          animate={inView ? { opacity: 1, scale: 1, rotate: 0 } : {}}
          transition={{ delay: 0.2, duration: 0.7, type: "spring" }}
        >
          <TiltElement className="relative">
            <div
              className={`w-24 h-24 rounded-3xl bg-gradient-to-br ${f.gradient} flex items-center justify-center shadow-lg`}
              style={{ boxShadow: `0 10px 40px ${f.glow}30` }}
            >
              <f.icon className="w-10 h-10 text-white" />
            </div>
          </TiltElement>
        </motion.div>
        {/* Text */}
        <div className={`max-w-lg ${isEven ? "" : "md:text-right"}`}>
          <motion.span
            className="text-[10px] uppercase tracking-[0.25em] font-semibold mb-2 block"
            style={{ color: f.glow }}
            initial={{ opacity: 0, x: isEven ? -20 : 20 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ delay: 0.3, duration: 0.5 }}
          >
            0{i + 1}
          </motion.span>
          <motion.h3
            className="text-2xl md:text-3xl font-semibold text-white mb-4 tracking-tight"
            style={{ fontFamily: 'Sora, sans-serif' }}
            initial={{ opacity: 0, x: isEven ? -30 : 30 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ delay: 0.35, duration: 0.6 }}
          >
            {f.title}
          </motion.h3>
          <motion.p
            className="text-gray-400 leading-relaxed text-base"
            initial={{ opacity: 0, x: isEven ? -20 : 20 }}
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
   TOOLS — colorful floating icons
   ═══════════════════════════════════════════════ */
const TOOLS = [
  { icon: Target, label: "Grammar", gradient: "from-emerald-400 to-teal-500", glow: "#34d399" },
  { icon: BookOpen, label: "Vocabulary", gradient: "from-blue-400 to-indigo-500", glow: "#60a5fa" },
  { icon: AudioLines, label: "Pronunciation", gradient: "from-purple-400 to-violet-500", glow: "#c084fc" },
  { icon: Eye, label: "Evaluation", gradient: "from-orange-400 to-rose-500", glow: "#fb923c" },
];

function ToolsShowcase() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  return (
    <div ref={ref} className="flex flex-wrap justify-center gap-8 md:gap-14">
      {TOOLS.map((t, i) => (
        <motion.div
          key={t.label}
          className="flex flex-col items-center gap-3"
          initial={{ opacity: 0, y: 50, scale: 0.7 }}
          animate={inView ? { opacity: 1, y: 0, scale: 1 } : {}}
          transition={{ delay: i * 0.12, duration: 0.6, type: "spring", stiffness: 150 }}
        >
          <TiltElement>
            <motion.div
              className={`w-20 h-20 rounded-2xl bg-gradient-to-br ${t.gradient} flex items-center justify-center cursor-default`}
              style={{ boxShadow: `0 8px 30px ${t.glow}25` }}
              whileHover={{ scale: 1.1, boxShadow: `0 12px 40px ${t.glow}40` }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <t.icon className="w-8 h-8 text-white" />
            </motion.div>
          </TiltElement>
          <span className="text-xs font-medium text-gray-300">{t.label}</span>
        </motion.div>
      ))}
    </div>
  );
}

/* ═══════════════════════════════════════════════
   SCENARIOS — parallax with color
   ═══════════════════════════════════════════════ */
const SCENARIOS = [
  { icon: Briefcase, title: "Job Interview", desc: "Nail your next interview with confident answers.", border: "hover:border-rose-500/30", glow: "hover:shadow-[0_0_30px_rgba(244,114,182,0.1)]" },
  { icon: Plane, title: "Travel", desc: "Navigate airports, hotels, and directions anywhere.", border: "hover:border-cyan-500/30", glow: "hover:shadow-[0_0_30px_rgba(34,211,238,0.1)]" },
  { icon: UtensilsCrossed, title: "Restaurant", desc: "Order like a local. Allergies, specials, and small talk.", border: "hover:border-amber-500/30", glow: "hover:shadow-[0_0_30px_rgba(251,191,36,0.1)]" },
  { icon: MessageSquare, title: "Small Talk", desc: "Master the art of casual conversation with anyone.", border: "hover:border-violet-500/30", glow: "hover:shadow-[0_0_30px_rgba(139,92,246,0.1)]" },
  { icon: Languages, title: "Business", desc: "Present and negotiate professionally in any language.", border: "hover:border-emerald-500/30", glow: "hover:shadow-[0_0_30px_rgba(52,211,153,0.1)]" },
];

function ScenariosScroll() {
  const containerRef = useRef(null);
  const { scrollYProgress } = useScroll({ target: containerRef, offset: ["start end", "end start"] });
  const x = useTransform(scrollYProgress, [0, 1], [80, -180]);
  return (
    <div ref={containerRef} className="overflow-hidden">
      <motion.div className="flex gap-5 py-4" style={{ x }}>
        {SCENARIOS.map((s) => (
          <TiltElement key={s.title} className={`flex-shrink-0 w-72 rounded-2xl border border-white/[0.06] bg-white/[0.02] backdrop-blur-sm p-6 transition-all duration-500 cursor-default ${s.border} ${s.glow}`}>
            <s.icon className="w-6 h-6 text-gray-400 mb-4" />
            <h4 className="text-sm font-semibold text-white mb-2" style={{ fontFamily: 'Sora, sans-serif' }}>{s.title}</h4>
            <p className="text-xs text-gray-500 leading-relaxed">{s.desc}</p>
          </TiltElement>
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
      style={{ scaleX, background: "linear-gradient(90deg, #f472b6, #8b5cf6, #06b6d4, #34d399)" }}
    />
  );
}

/* ═══════════════════════════════════════════════
   PAGE
   ═══════════════════════════════════════════════ */
export default function LandingPage() {
  const navigate = useNavigate();
  const heroRef = useRef(null);
  const { scrollYProgress: heroScroll } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
  const heroY = useTransform(heroScroll, [0, 1], [0, 150]);
  const heroOpacity = useTransform(heroScroll, [0, 0.6], [1, 0]);
  const heroScale = useTransform(heroScroll, [0, 0.6], [1, 0.95]);

  return (
    <div className="min-h-screen bg-[#080B12] text-gray-100 overflow-x-hidden" style={{ fontFamily: 'DM Sans, sans-serif' }}>
      <ScrollProgress />

      {/* ── NAV ── */}
      <nav className="fixed top-0 w-full z-50 backdrop-blur-xl bg-[#080B12]/60 border-b border-white/[0.04]" data-testid="navbar">
        <div className="max-w-6xl mx-auto px-6 flex items-center justify-between h-14">
          <button onClick={() => navigate("/")} className="flex items-center gap-2 group" data-testid="logo-button">
            <WaveformLogo size={28} className="text-violet-400 group-hover:text-violet-300 transition-colors duration-300" />
            <span className="text-sm font-medium text-white/90 tracking-tight" style={{ fontFamily: 'Sora, sans-serif' }}>mumble</span>
          </button>
          <div className="hidden md:flex items-center gap-8">
            {["Features", "How it works", "Scenarios"].map(l => (
              <a key={l} href={`#${l.toLowerCase().replace(/ /g, "-")}`} className="text-xs text-gray-500 hover:text-gray-200 transition-colors duration-200 tracking-wide">{l}</a>
            ))}
          </div>
          <Button
            onClick={() => navigate("/chat")}
            className="bg-gradient-to-r from-violet-500 to-fuchsia-500 hover:from-violet-400 hover:to-fuchsia-400 text-white font-semibold rounded-full px-5 h-8 text-xs shadow-[0_4px_20px_rgba(139,92,246,0.25)] hover:shadow-[0_4px_25px_rgba(139,92,246,0.4)] transition-all duration-300 border-0"
            data-testid="nav-start-btn"
          >
            Start Free
          </Button>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section ref={heroRef} className="relative min-h-screen flex items-center justify-center overflow-hidden" data-testid="hero-section">
        <AuroraBackground />
        {/* Noise texture */}
        <div className="absolute inset-0 opacity-[0.02] pointer-events-none" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='1'/%3E%3C/svg%3E")`,
        }} />

        <motion.div
          className="relative max-w-6xl mx-auto px-6 pt-24 pb-12 flex flex-col lg:flex-row items-center gap-16 lg:gap-24"
          style={{ y: heroY, opacity: heroOpacity, scale: heroScale }}
        >
          <div className="flex-1 max-w-xl">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
              <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-violet-500/20 bg-violet-500/10 text-violet-300 text-[10px] font-medium tracking-wider uppercase mb-8">
                <Zap className="w-3 h-3" />
                AI Language Tutor
              </span>
            </motion.div>

            <WordReveal
              text="Learn any language by actually speaking it"
              className="text-4xl sm:text-5xl lg:text-6xl tracking-tight leading-[1.1] mb-8"
              style={{ fontFamily: 'Sora, sans-serif', fontWeight: 600, background: 'linear-gradient(135deg, #ffffff 0%, #c4b5fd 50%, #67e8f9 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}
            />

            <motion.p
              className="text-base text-gray-400 leading-relaxed max-w-md mb-10"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8, duration: 0.6 }}
            >
              Your personal tutor that listens, corrects, and adapts.
              Voice-first. Real-time feedback. No textbooks.
            </motion.p>

            <motion.div
              className="flex flex-col sm:flex-row gap-3"
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1, duration: 0.5 }}
            >
              <Button
                onClick={() => navigate("/chat")}
                className="bg-gradient-to-r from-violet-500 to-fuchsia-500 hover:from-violet-400 hover:to-fuchsia-400 text-white font-semibold rounded-full px-7 py-5 text-sm shadow-[0_8px_30px_rgba(139,92,246,0.3)] hover:shadow-[0_8px_40px_rgba(139,92,246,0.45)] transition-all duration-300 border-0"
                data-testid="hero-start-btn"
              >
                Start a conversation <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                onClick={() => navigate("/dashboard")}
                className="rounded-full px-7 py-5 text-sm border-white/[0.1] bg-white/[0.03] hover:bg-white/[0.06] text-gray-300"
                data-testid="hero-dashboard-btn"
              >
                View Dashboard
              </Button>
            </motion.div>
          </div>

          <motion.div
            className="hidden lg:block flex-shrink-0"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5, duration: 1, ease: [0.22, 1, 0.36, 1] }}
          >
            <LanguageOrbit />
          </motion.div>
        </motion.div>

        <motion.div
          className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.5 }}
        >
          <span className="text-[10px] text-gray-600 tracking-wider uppercase">Scroll</span>
          <motion.div className="w-px h-8 bg-gradient-to-b from-violet-500/40 to-transparent" animate={{ y: [0, 8, 0] }} transition={{ duration: 1.5, repeat: Infinity }} />
        </motion.div>
      </section>

      {/* ── FEATURES ── */}
      <section id="features" className="relative py-16 md:py-24" data-testid="features-section">
        <SectionGlow colors={["#f472b6", "#8b5cf6"]} position="left" />
        <div className="relative max-w-4xl mx-auto px-6">
          <RevealOnScroll>
            <span className="text-[10px] uppercase tracking-[0.25em] text-violet-400/70 block mb-3">Core Features</span>
          </RevealOnScroll>
          <WordReveal
            text="Built different from day one"
            as="h2"
            className="text-3xl md:text-4xl tracking-tight text-white mb-4"
            style={{ fontFamily: 'Sora, sans-serif', fontWeight: 600 }}
          />
          <RevealOnScroll delay={0.2}>
            <div className="h-px w-20 mb-4" style={{ background: "linear-gradient(90deg, #f472b6, #8b5cf6, transparent)" }} />
          </RevealOnScroll>
          {FEATURES.map((f, i) => <FeatureRow key={f.title} f={f} i={i} />)}
        </div>
      </section>

      {/* ── TOOLS ── */}
      <section id="how-it-works" className="relative py-24 md:py-32" data-testid="tools-section">
        <SectionGlow colors={["#06b6d4", "#8b5cf6", "#34d399"]} position="center" />
        <div className="relative max-w-4xl mx-auto px-6 text-center">
          <RevealOnScroll>
            <span className="text-[10px] uppercase tracking-[0.25em] text-cyan-400/70 block mb-3">Under the hood</span>
          </RevealOnScroll>
          <WordReveal
            text="Four specialized AI subagents"
            as="h2"
            className="text-3xl md:text-4xl tracking-tight text-white mb-6"
            style={{ fontFamily: 'Sora, sans-serif', fontWeight: 600 }}
          />
          <RevealOnScroll delay={0.2}>
            <p className="text-gray-400 max-w-md mx-auto mb-16 leading-relaxed">
              Every message activates real-time AI tools. Watch them work as they check grammar, look up vocabulary, and evaluate your responses.
            </p>
          </RevealOnScroll>
          <ToolsShowcase />
        </div>
      </section>

      {/* ── DEMO ── */}
      <section className="relative py-24 md:py-32" data-testid="demo-section">
        <SectionGlow colors={["#8b5cf6", "#06b6d4"]} position="right" />
        <div className="relative max-w-4xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <RevealOnScroll>
                <span className="text-[10px] uppercase tracking-[0.25em] text-fuchsia-400/70 block mb-3">See it in action</span>
              </RevealOnScroll>
              <WordReveal text="A conversation, not a classroom" as="h2" className="text-3xl md:text-4xl tracking-tight text-white mb-6" style={{ fontFamily: 'Sora, sans-serif', fontWeight: 600 }} />
              <RevealOnScroll delay={0.2}>
                <p className="text-gray-400 leading-relaxed mb-8">
                  Ask anything. mumble responds with context-aware corrections, vocabulary insights, and pronunciation guides — all in real-time.
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

      {/* ── SCENARIOS ── */}
      <section id="scenarios" className="relative py-24 md:py-32" data-testid="scenarios-section">
        <div className="max-w-4xl mx-auto px-6 mb-12">
          <RevealOnScroll>
            <span className="text-[10px] uppercase tracking-[0.25em] text-amber-400/70 block mb-3">Practice Scenarios</span>
          </RevealOnScroll>
          <WordReveal text="Real conversations, real confidence" as="h2" className="text-3xl md:text-4xl tracking-tight text-white" style={{ fontFamily: 'Sora, sans-serif', fontWeight: 600 }} />
        </div>
        <div className="max-w-6xl mx-auto px-6"><ScenariosScroll /></div>
      </section>

      {/* ── CTA ── */}
      <section className="relative py-32 md:py-44" data-testid="cta-section">
        <AuroraBackground />
        <div className="relative max-w-2xl mx-auto px-6 text-center">
          <WordReveal
            text="Stop studying. Start speaking."
            as="h2"
            className="text-3xl md:text-5xl tracking-tight mb-6"
            style={{ fontFamily: 'Sora, sans-serif', fontWeight: 600, background: 'linear-gradient(135deg, #ffffff 0%, #f472b6 40%, #8b5cf6 70%, #06b6d4 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}
          />
          <RevealOnScroll delay={0.3}>
            <p className="text-gray-400 text-base md:text-lg mb-12 max-w-md mx-auto">
              The best way to learn a language is to use it. mumble gives you a patient, always-available partner who adapts.
            </p>
          </RevealOnScroll>
          <RevealOnScroll delay={0.5}>
            <Button
              onClick={() => navigate("/chat")}
              className="bg-gradient-to-r from-violet-500 via-fuchsia-500 to-cyan-500 hover:from-violet-400 hover:via-fuchsia-400 hover:to-cyan-400 text-white font-semibold rounded-full px-10 py-6 text-base shadow-[0_8px_40px_rgba(139,92,246,0.3)] hover:shadow-[0_8px_50px_rgba(139,92,246,0.45)] transition-all duration-300 border-0"
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
            <WaveformLogo size={22} className="text-violet-400/60" />
            <span className="text-xs text-gray-600" style={{ fontFamily: 'Sora, sans-serif' }}>mumble</span>
          </div>
          <div className="flex items-center gap-6">
            {[{ label: "Practice", href: "/chat" }, { label: "Dashboard", href: "/dashboard" }, { label: "Vocabulary", href: "/vocabulary" }].map(l => (
              <button key={l.href} onClick={() => navigate(l.href)} className="text-[10px] text-gray-600 hover:text-gray-400 transition-colors duration-200 tracking-wide">{l.label}</button>
            ))}
          </div>
          <p className="text-[10px] text-gray-700 tracking-wide">AI-powered language learning</p>
        </div>
      </footer>
    </div>
  );
}
