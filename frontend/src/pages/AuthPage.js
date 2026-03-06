import { useState, useEffect, useMemo } from "react";
import { useNavigate, Navigate, useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { WaveformLogo } from "@/components/WaveformLogo";
import { Mail, Lock, User, ArrowRight, Loader2 } from "lucide-react";
import { GoogleLogin } from "@react-oauth/google";

/* ═══════════════════════════════════════════
   FLOATING SCRIPT CHARS on left panel
   ═══════════════════════════════════════════ */
const CHARS = ["あ", "ñ", "ü", "ش", "한", "ç", "你", "ж", "θ", "ê", "ß", "ø", "ñ", "語", "م", "б"];

function FloatingChars() {
  const items = useMemo(() => CHARS.map((c, i) => ({
    char: c, x: 8 + (i * 6) % 85, y: 5 + ((i * 13) % 85),
    size: 16 + (i % 4) * 8, dur: 8 + (i % 5) * 4,
  })), []);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {items.map((item, i) => (
        <motion.span key={i} className="absolute font-bold select-none"
          style={{ left: `${item.x}%`, top: `${item.y}%`, fontSize: item.size, color: "rgba(255,255,255,0.08)" }}
          animate={{ y: [-8, 8, -8], x: [-4, 4, -4], rotate: [-4, 4, -4] }}
          transition={{ duration: item.dur, repeat: Infinity, ease: "easeInOut", delay: i * 0.5 }}
        >{item.char}</motion.span>
      ))}
    </div>
  );
}

/* ═══════════════════════════════════════════
   MORPHING WORD on left panel
   ═══════════════════════════════════════════ */
const WORDS = ["Bonjour", "Hola", "Ciao", "こんにちは", "Hallo", "Olá", "안녕", "مرحبا", "Привет", "你好"];

function MorphingWord() {
  const [idx, setIdx] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setIdx(p => (p + 1) % WORDS.length), 2400);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="relative h-[1.2em] overflow-hidden inline-block min-w-[180px]">
      <AnimatePresence mode="wait">
        <motion.span key={idx}
          className="absolute left-0 text-white font-bold"
          initial={{ y: 40, opacity: 0, filter: "blur(4px)" }}
          animate={{ y: 0, opacity: 1, filter: "blur(0px)" }}
          exit={{ y: -40, opacity: 0, filter: "blur(4px)" }}
          transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
        >{WORDS[idx]}</motion.span>
      </AnimatePresence>
    </div>
  );
}

/* ═══════════════════════════════════════════
   SOUND WAVE
   ═══════════════════════════════════════════ */
function SoundWave({ barCount = 20, height = 32 }) {
  return (
    <div className="flex items-end gap-[2.5px]" style={{ height }}>
      {Array.from({ length: barCount }).map((_, i) => (
        <motion.div key={i} className="rounded-full bg-white/30"
          style={{ width: 2.5 }}
          animate={{ height: [3, height * (0.25 + Math.sin(i * 0.5) * 0.35 + 0.35), 3] }}
          transition={{ duration: 0.7 + (i % 5) * 0.12, repeat: Infinity, ease: "easeInOut", delay: i * 0.035 }}
        />
      ))}
    </div>
  );
}

/* ═══════════════════════════════════════════
   CUSTOM INPUT with animated focus ring
   ═══════════════════════════════════════════ */
function AuthInput({ icon: Icon, type, placeholder, value, onChange, required, testId, minLength }) {
  const [focused, setFocused] = useState(false);
  return (
    <motion.div
      className="relative rounded-xl overflow-hidden"
      animate={{
        boxShadow: focused
          ? "0 0 0 2px rgba(99,102,241,0.4), 0 4px 12px rgba(99,102,241,0.08)"
          : "0 0 0 1px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.04)",
      }}
      transition={{ duration: 0.2 }}
    >
      <Icon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 z-10 transition-colors duration-200"
        style={{ color: focused ? "#6366f1" : "#94a3b8" }} />
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        required={required}
        minLength={minLength}
        className="w-full pl-10 pr-4 py-3 text-sm bg-white text-slate-900 placeholder:text-slate-300 outline-none"
        data-testid={testId}
      />
    </motion.div>
  );
}

/* ═══════════════════════════════════════════
   AUTH PAGE
   ═══════════════════════════════════════════ */
export default function AuthPage() {
  const { user, loading, login, signup, googleLogin } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirectPath = searchParams.get("redirect");
  const redirectPlan = searchParams.get("plan");
  const afterAuthPath = redirectPath
    ? `${redirectPath}${redirectPlan ? `?plan=${redirectPlan}` : ""}`
    : "/chat";
  const [mode, setMode] = useState("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f8f7f4]">
        <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (user) return <Navigate to={afterAuthPath} replace />;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      if (mode === "signup") {
        await signup(name, email, password);
      } else {
        await login(email, password);
      }
      navigate(afterAuthPath);
    } catch (err) {
      const msg = err.response?.data?.detail || "Something went wrong";
      setError(typeof msg === "string" ? msg : JSON.stringify(msg));
    }
    setSubmitting(false);
  };

  return (
    <div className="min-h-screen flex" style={{ fontFamily: "DM Sans, sans-serif" }}>

      {/* ── LEFT PANEL — branded, animated ── */}
      <div className="hidden lg:flex lg:w-[45%] relative overflow-hidden flex-col justify-between p-10"
        style={{ background: "linear-gradient(135deg, #4338ca 0%, #6366f1 40%, #818cf8 100%)" }}>
        <FloatingChars />

        {/* Logo */}
        <motion.div className="relative z-10 flex items-center gap-2"
          initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5 }}>
          <WaveformLogo size={28} className="text-white" />
          <span className="text-lg font-semibold tracking-tight text-white" style={{ fontFamily: "Sora" }}>mumble</span>
        </motion.div>

        {/* Center content */}
        <div className="relative z-10 flex-1 flex flex-col justify-center max-w-md">
          <motion.div
            initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}>
            <h2 className="text-4xl font-bold text-white leading-tight tracking-tight mb-3" style={{ fontFamily: "Sora" }}>
              Say <MorphingWord />
            </h2>
            <p className="text-indigo-200 text-base leading-relaxed mb-8">
              Your personal AI language tutor. Voice-first conversations in 50+ languages with real-time feedback.
            </p>
            <SoundWave barCount={28} height={36} />
          </motion.div>
        </div>

        {/* Bottom stats */}
        <motion.div className="relative z-10 flex gap-8"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}>
          {[
            { n: "50+", label: "Languages" },
            { n: "Real-time", label: "Feedback" },
            { n: "Voice", label: "First" },
          ].map((s) => (
            <div key={s.label}>
              <div className="text-white font-bold text-lg">{s.n}</div>
              <div className="text-indigo-200 text-xs">{s.label}</div>
            </div>
          ))}
        </motion.div>
      </div>

      {/* ── RIGHT PANEL — form ── */}
      <div className="flex-1 flex items-center justify-center px-6 py-12 bg-[#f8f7f4] relative">
        {/* Mesh accent */}
        <motion.div className="absolute top-0 right-0 w-[400px] h-[400px] pointer-events-none rounded-full"
          style={{ background: "radial-gradient(circle, rgba(99,102,241,0.06) 0%, transparent 65%)" }}
          animate={{ x: [0, 20, 0], y: [0, 15, 0] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }} />

        <motion.div className="relative w-full max-w-[400px] z-10"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}>

          {/* Mobile logo */}
          <div className="flex lg:hidden items-center gap-2 mb-8 justify-center">
            <button onClick={() => navigate("/")} className="flex items-center gap-2 group" data-testid="auth-logo">
              <WaveformLogo size={28} className="text-indigo-600" />
              <span className="text-lg font-semibold tracking-tight text-slate-900" style={{ fontFamily: "Sora" }}>mumble</span>
            </button>
          </div>

          {/* Desktop logo link */}
          <button onClick={() => navigate("/")} className="hidden lg:block mb-8" data-testid="auth-logo">
            <ArrowRight className="w-4 h-4 text-slate-400 rotate-180 hover:text-indigo-600 transition-colors" />
          </button>

          {/* Heading */}
          <AnimatePresence mode="wait">
            <motion.div key={mode}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.25 }}>
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900 mb-1" style={{ fontFamily: "Sora" }}>
                {mode === "login" ? "Welcome back" : "Create account"}
              </h1>
              <p className="text-sm text-slate-400 mb-8">
                {mode === "login" ? "Log in to continue your lessons" : "Start your language learning journey"}
              </p>
            </motion.div>
          </AnimatePresence>

          {/* Google button */}
          {/* REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS, THIS BREAKS THE AUTH */}
          <div className="flex justify-center mb-4" data-testid="auth-google-btn">
            <GoogleLogin
              onSuccess={async (credentialResponse) => {
                setError("");
                setSubmitting(true);
                try {
                  await googleLogin(credentialResponse.credential);
                  navigate(afterAuthPath);
                } catch (err) {
                  const msg = err.response?.data?.detail || "Google sign-in failed";
                  setError(typeof msg === "string" ? msg : JSON.stringify(msg));
                }
                setSubmitting(false);
              }}
              onError={() => setError("Google sign-in failed. Please try again.")}
              size="large"
              width="400"
              text={mode === "login" ? "signin_with" : "signup_with"}
              shape="pill"
              theme="outline"
            />
          </div>

          {/* Divider */}
          <div className="flex items-center gap-3 mb-6">
            <div className="flex-1 h-px bg-slate-200" />
            <span className="text-[10px] uppercase tracking-wider text-slate-300 font-medium">or continue with email</span>
            <div className="flex-1 h-px bg-slate-200" />
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-3.5">
            <AnimatePresence mode="wait">
              {mode === "signup" && (
                <motion.div key="name"
                  initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                  animate={{ opacity: 1, height: "auto", marginBottom: 0 }}
                  exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                  transition={{ duration: 0.25 }}>
                  <AuthInput icon={User} type="text" placeholder="Your name" value={name}
                    onChange={(e) => setName(e.target.value)} required={mode === "signup"} testId="auth-name-input" />
                </motion.div>
              )}
            </AnimatePresence>

            <AuthInput icon={Mail} type="email" placeholder="Email address" value={email}
              onChange={(e) => setEmail(e.target.value)} required testId="auth-email-input" />

            <AuthInput icon={Lock} type="password" placeholder="Password (min 6 chars)" value={password}
              onChange={(e) => setPassword(e.target.value)} required testId="auth-password-input" minLength={6} />

            {error && (
              <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
                className="text-xs text-red-500 bg-red-50 border border-red-100 rounded-lg px-3 py-2"
                data-testid="auth-error">{error}</motion.div>
            )}

            {/* Submit button */}
            <motion.button
              type="submit"
              disabled={submitting}
              className="relative w-full py-3.5 rounded-xl text-sm font-semibold text-white overflow-hidden group mt-2 disabled:opacity-60"
              style={{ background: "linear-gradient(135deg, #4338ca, #6366f1)" }}
              whileHover={{ scale: 1.01, boxShadow: "0 6px 24px rgba(99,102,241,0.35)" }}
              whileTap={{ scale: 0.98 }}
              transition={{ type: "spring", stiffness: 400, damping: 17 }}
              data-testid="auth-submit-btn"
            >
              <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
              <span className="relative flex items-center justify-center gap-2">
                {submitting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    {mode === "login" ? "Log In" : "Create Account"}
                    <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-0.5" />
                  </>
                )}
              </span>
            </motion.button>
          </form>

          {/* Toggle */}
          <p className="text-center mt-6 text-sm text-slate-400">
            {mode === "login" ? "Don't have an account?" : "Already have an account?"}{" "}
            <button onClick={() => { setMode(mode === "login" ? "signup" : "login"); setError(""); }}
              className="font-semibold text-indigo-600 hover:text-indigo-700 transition-colors duration-200"
              data-testid="auth-toggle-mode">
              {mode === "login" ? "Sign Up" : "Log In"}
            </button>
          </p>

          {/* Tabs — pill style */}
          <div className="flex justify-center mt-6 gap-1 bg-slate-100 rounded-full p-1">
            {["login", "signup"].map((m) => (
              <button key={m}
                onClick={() => { setMode(m); setError(""); }}
                className="relative px-5 py-1.5 rounded-full text-xs font-medium transition-all duration-300"
                style={{ color: mode === m ? "#fff" : "#64748b" }}
                data-testid={`auth-tab-${m}`}>
                {mode === m && (
                  <motion.div layoutId="authTab" className="absolute inset-0 rounded-full bg-indigo-600"
                    transition={{ type: "spring", stiffness: 400, damping: 30 }} />
                )}
                <span className="relative z-10">{m === "login" ? "Log In" : "Sign Up"}</span>
              </button>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
