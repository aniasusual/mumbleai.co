import { useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Mic, Keyboard, ArrowRight, MessageCircle, Sparkles,
  Briefcase, Plane, UtensilsCrossed, Phone, Users, ShoppingBag, Stethoscope, Menu
} from "lucide-react";
import { WaveformLogo } from "@/components/WaveformLogo";

const ICON_MAP = { Briefcase, Plane, UtensilsCrossed, MessageCircle, Phone, Users, ShoppingBag, Stethoscope };
const CHARS = ["あ", "ñ", "ü", "한", "ç", "你", "θ", "ê", "ш", "ø"];

function MeshBlobs() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <motion.div className="absolute w-[500px] h-[500px] rounded-full"
        style={{ top: "-5%", right: "5%", background: "radial-gradient(circle, rgba(99,102,241,0.14) 0%, transparent 65%)" }}
        animate={{ x: [0, 35, 0], y: [0, 25, 0] }}
        transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }} />
      <motion.div className="absolute w-[400px] h-[400px] rounded-full"
        style={{ bottom: "5%", left: "10%", background: "radial-gradient(circle, rgba(236,72,153,0.09) 0%, transparent 65%)" }}
        animate={{ x: [0, -25, 0], y: [0, -20, 0] }}
        transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }} />
      <motion.div className="absolute w-[350px] h-[350px] rounded-full"
        style={{ top: "40%", left: "50%", background: "radial-gradient(circle, rgba(16,185,129,0.08) 0%, transparent 65%)" }}
        animate={{ x: [0, 20, 0], y: [0, -15, 0] }}
        transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }} />
    </div>
  );
}

function FloatingChars() {
  const items = useMemo(() => CHARS.map((c, i) => ({
    char: c, x: 5 + (i * 10) % 88, y: 8 + ((i * 12) % 82),
    size: 16 + (i % 3) * 6, dur: 10 + (i % 4) * 4,
  })), []);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {items.map((item, i) => (
        <motion.span key={i} className="absolute font-bold select-none"
          style={{ left: `${item.x}%`, top: `${item.y}%`, fontSize: item.size, color: "rgba(99,102,241,0.06)" }}
          animate={{ y: [-8, 8, -8], x: [-4, 4, -4], rotate: [-5, 5, -5] }}
          transition={{ duration: item.dur, repeat: Infinity, ease: "easeInOut", delay: i * 0.5 }}
        >{item.char}</motion.span>
      ))}
    </div>
  );
}

function SoundWave() {
  return (
    <div className="flex items-end gap-[3px]" style={{ height: 32 }}>
      {Array.from({ length: 20 }).map((_, i) => (
        <motion.div key={i} className="rounded-full"
          style={{ width: 3, background: "#6366f1", opacity: 0.5 + (i % 3) * 0.15 }}
          animate={{ height: [3, 32 * (0.25 + Math.sin(i * 0.5) * 0.35 + 0.35), 3] }}
          transition={{ duration: 0.8 + (i % 5) * 0.12, repeat: Infinity, ease: "easeInOut", delay: i * 0.04 }} />
      ))}
    </div>
  );
}

const SCENARIO_COLORS = [
  { bg: "#d1fae5", text: "#065f46", icon: "#059669" },
  { bg: "#bfdbfe", text: "#1e40af", icon: "#2563eb" },
  { bg: "#e9d5ff", text: "#5b21b6", icon: "#7c3aed" },
  { bg: "#fed7aa", text: "#92400e", icon: "#d97706" },
  { bg: "#fecdd3", text: "#9f1239", icon: "#e11d48" },
  { bg: "#ccfbf1", text: "#115e59", icon: "#0d9488" },
];

export const WelcomeScreen = ({ userName, scenarios, onNewConversation, onOpenSidebar }) => {
  const firstName = userName?.split(" ")[0] || "there";

  return (
    <div className="flex-1 flex flex-col relative overflow-hidden">
      <MeshBlobs />
      <FloatingChars />

      {/* Minimal top bar for mobile sidebar toggle */}
      <div className="px-4 py-3 flex items-center lg:hidden relative z-20">
        <button onClick={onOpenSidebar} className="p-1.5 rounded-lg hover:bg-indigo-50 transition-colors" data-testid="welcome-open-sidebar-btn">
          <Menu className="w-5 h-5 text-slate-500" />
        </button>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-6 relative z-10 -mt-8">
        {/* Logo + Greeting */}
        <motion.div
          className="text-center mb-10"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        >
          <motion.div className="inline-flex mb-5"
            animate={{ scale: [1, 1.04, 1] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}>
            <WaveformLogo size={44} className="text-indigo-600" />
          </motion.div>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-slate-900 mb-2" style={{ fontFamily: 'Sora, sans-serif' }}>
            Hey {firstName}!
          </h1>
          <p className="text-base md:text-lg text-slate-500 max-w-md mx-auto leading-relaxed">
            Ready to practice? Start a free conversation or pick a scenario below.
          </p>
        </motion.div>

        {/* Sound Wave */}
        <motion.div className="mb-10"
          initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3, duration: 0.5 }}>
          <SoundWave />
        </motion.div>

        {/* Primary CTA — Free Conversation */}
        <motion.div className="flex flex-col sm:flex-row gap-3 mb-10"
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
          <motion.button
            onClick={() => onNewConversation()}
            className="relative rounded-full px-8 py-4 text-sm font-semibold bg-indigo-600 text-white overflow-hidden group shadow-[0_4px_24px_rgba(99,102,241,0.3)]"
            whileHover={{ scale: 1.04, boxShadow: "0 6px 32px rgba(99,102,241,0.45)" }}
            whileTap={{ scale: 0.97 }}
            transition={{ type: "spring", stiffness: 400, damping: 17 }}
            data-testid="welcome-free-conversation-btn"
          >
            <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
            <span className="relative flex items-center gap-2">
              <Mic className="w-4 h-4" /> Start a Free Conversation <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
            </span>
          </motion.button>
        </motion.div>

        {/* Scenario Cards */}
        <motion.div
          className="w-full max-w-2xl"
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.55 }}
        >
          <p className="text-xs font-semibold tracking-wider uppercase text-slate-400 text-center mb-4">Or pick a scenario</p>
          <div className="flex flex-wrap gap-2.5 justify-center">
            {scenarios.map((s, i) => {
              const color = SCENARIO_COLORS[i % SCENARIO_COLORS.length];
              const Icon = ICON_MAP[s.icon] || MessageCircle;
              return (
                <motion.button
                  key={s.id}
                  onClick={() => onNewConversation(s.id)}
                  className="flex items-center gap-2.5 px-5 py-3 rounded-full border shadow-sm group overflow-hidden relative"
                  style={{ background: color.bg, borderColor: `${color.icon}22` }}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.6 + i * 0.06, duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                  whileHover={{ scale: 1.06, y: -2, boxShadow: "0 6px 20px rgba(0,0,0,0.06)" }}
                  whileTap={{ scale: 0.97 }}
                  data-testid={`welcome-scenario-${s.id}`}
                >
                  <Icon className="w-4 h-4 transition-transform duration-200 group-hover:scale-110" style={{ color: color.icon }} />
                  <span className="text-sm font-medium" style={{ color: color.text }}>{s.title}</span>
                </motion.button>
              );
            })}
          </div>
        </motion.div>
      </div>
    </div>
  );
};
