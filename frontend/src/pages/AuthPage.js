import { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate, Navigate, useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { WaveformLogo } from "@/components/WaveformLogo";
import { Mail, Lock, User, ArrowRight, Loader2 } from "lucide-react";
import { useGoogleLogin } from "@react-oauth/google";

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
   MOBILE MESH BACKGROUND
   ═══════════════════════════════════════════ */
function MobileMeshBg() {
  return (
    <div className="absolute inset-0 pointer-events-none lg:hidden" aria-hidden
      style={{
        background: `
          radial-gradient(ellipse 80% 70% at 15% 20%, rgba(99,102,241,0.28) 0%, transparent 60%),
          radial-gradient(ellipse 70% 60% at 85% 15%, rgba(190,24,93,0.2) 0%, transparent 55%),
          radial-gradient(ellipse 75% 65% at 30% 85%, rgba(124,58,237,0.24) 0%, transparent 55%),
          radial-gradient(ellipse 60% 50% at 75% 75%, rgba(16,185,129,0.18) 0%, transparent 55%),
          radial-gradient(ellipse 50% 40% at 50% 50%, rgba(245,158,11,0.1) 0%, transparent 50%)
        `,
      }}
    />
  );
}

/* ═══════════════════════════════════════════
   MOBILE FLOATING LANGUAGE CHARACTERS
   ═══════════════════════════════════════════ */
const MOBILE_CHARS = ["あ", "ñ", "한", "ç", "你", "ê", "ш", "ø", "ü", "б"];

function MobileFloatingChars() {
  const items = useMemo(() => MOBILE_CHARS.map((c, i) => ({
    char: c,
    x: 5 + (i * 11) % 85,
    y: 6 + (i * 14) % 82,
    size: 20 + (i % 3) * 12,
    dur: 8 + (i % 5) * 4,
    color: [
      "rgba(99,102,241,0.18)",
      "rgba(124,58,237,0.15)",
      "rgba(190,24,93,0.12)",
      "rgba(16,185,129,0.14)",
      "rgba(245,158,11,0.13)",
    ][i % 5],
  })), []);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none lg:hidden" aria-hidden>
      {items.map((item, i) => (
        <motion.span key={i} className="absolute font-bold select-none"
          style={{ left: `${item.x}%`, top: `${item.y}%`, fontSize: item.size, color: item.color }}
          animate={{ y: [-8, 8, -8], x: [-4, 4, -4], rotate: [-5, 5, -5] }}
          transition={{ duration: item.dur, repeat: Infinity, ease: "easeInOut", delay: i * 0.6 }}
        >{item.char}</motion.span>
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
  const [searchParams, setSearchParams] = useSearchParams();
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
  const [googleLoading, setGoogleLoading] = useState(false);

  // Detect PWA standalone mode
  const isStandalone = window.matchMedia("(display-mode: standalone)").matches
    || window.navigator.standalone === true;

  // Popup flow — for regular browser
  const initiatePopupLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setError("");
      setGoogleLoading(true);
      try {
        await googleLogin(tokenResponse);
        navigate(afterAuthPath);
      } catch (err) {
        const msg = err.response?.data?.detail || "Google sign-in failed";
        setError(typeof msg === "string" ? msg : JSON.stringify(msg));
      }
      setGoogleLoading(false);
    },
    onError: () => {
      setError("Google sign-in failed. Please try again.");
      setGoogleLoading(false);
    },
  });

  // Redirect flow — for PWA standalone mode
  const initiateRedirectLogin = useGoogleLogin({
    flow: "auth-code",
    ux_mode: "redirect",
    redirect_uri: window.location.origin + "/auth",
  });

  // Handle redirect callback: Google sends ?code=... back to /auth
  useEffect(() => {
    const code = searchParams.get("code");
    if (!code) return;
    // Clean the code from URL immediately to avoid re-processing
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.delete("code");
      next.delete("scope");
      next.delete("authuser");
      next.delete("prompt");
      return next;
    }, { replace: true });

    (async () => {
      setGoogleLoading(true);
      setError("");
      try {
        await googleLogin({ code, redirect_uri: window.location.origin + "/auth" });
        navigate(afterAuthPath);
      } catch (err) {
        const msg = err.response?.data?.detail || "Google sign-in failed";
        setError(typeof msg === "string" ? msg : JSON.stringify(msg));
      }
      setGoogleLoading(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleGoogleClick = useCallback(() => {
    if (isStandalone) {
      initiateRedirectLogin();
    } else {
      initiatePopupLogin();
    }
  }, [isStandalone, initiateRedirectLogin, initiatePopupLogin]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f0eeea]">
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
    <div className="min-h-screen flex overflow-x-hidden" style={{ fontFamily: "DM Sans, sans-serif" }}>

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
      <div className="flex-1 flex items-center justify-center px-5 sm:px-8 py-10 bg-[#f0eeea] relative overflow-hidden"
        style={{ paddingTop: "calc(2.5rem + env(safe-area-inset-top, 0px))", paddingBottom: "calc(2.5rem + env(safe-area-inset-bottom, 0px))" }}>
        {/* Mobile background mesh + floating chars */}
        <MobileMeshBg />
        <MobileFloatingChars />

        {/* Mesh accent (desktop) */}
        <motion.div className="absolute top-0 right-0 w-[300px] sm:w-[400px] h-[300px] sm:h-[400px] pointer-events-none rounded-full hidden lg:block"
          style={{ background: "radial-gradient(circle, rgba(99,102,241,0.06) 0%, transparent 65%)" }}
          animate={{ x: [0, 20, 0], y: [0, 15, 0] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }} />

        <motion.div className="relative w-full max-w-[400px] z-10 mx-auto"
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
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight text-slate-900 mb-1 text-center" style={{ fontFamily: "Sora" }}>
                {mode === "login" ? "Welcome back" : "Create account"}
              </h1>
              <p className="text-sm text-slate-400 mb-8 text-center">
                {mode === "login" ? "Log in to continue your lessons" : "Start your language learning journey"}
              </p>
            </motion.div>
          </AnimatePresence>

          {/* Google button — custom button using useGoogleLogin (PWA-safe, no iframe) */}
          <div className="flex justify-center mb-4" data-testid="auth-google-btn">
            <button
              type="button"
              onClick={handleGoogleClick}
              disabled={googleLoading || submitting}
              className="flex items-center justify-center gap-3 w-full py-3 px-5 rounded-full border border-slate-200 bg-white hover:bg-slate-50 active:bg-slate-100 transition-all duration-200 shadow-sm hover:shadow disabled:opacity-60 disabled:cursor-not-allowed"
              data-testid="google-signin-btn"
            >
              {googleLoading ? (
                <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
              ) : (
                <svg className="w-5 h-5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
              )}
              <span className="text-sm font-medium text-slate-700">
                {mode === "login" ? "Sign in with Google" : "Sign up with Google"}
              </span>
            </button>
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
              className="relative w-full py-3 sm:py-3.5 rounded-xl text-sm font-semibold text-white overflow-hidden group mt-2 disabled:opacity-60"
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
