import { useState } from "react";
import { useNavigate, Navigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { WaveformLogo } from "@/components/WaveformLogo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Mail, Lock, User, ArrowRight, Loader2 } from "lucide-react";

const C = {
  bg: "#fafafa",
  surface: "#ffffff",
  border: "rgba(0,0,0,0.08)",
  text: "#0f172a",
  muted: "#64748b",
  dim: "#94a3b8",
  accent: "#4f46e5",
  accentSoft: "rgba(79,70,229,0.08)",
};

export default function AuthPage() {
  const { user, loading, login, signup } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: C.bg }}>
        <div className="w-6 h-6 border-2 border-[#c8a97e] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (user) return <Navigate to="/chat" replace />;

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
      navigate("/chat");
    } catch (err) {
      const msg = err.response?.data?.detail || "Something went wrong";
      setError(typeof msg === "string" ? msg : JSON.stringify(msg));
    }
    setSubmitting(false);
  };

  const toggleMode = () => {
    setMode(mode === "login" ? "signup" : "login");
    setError("");
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{ background: C.bg, fontFamily: "DM Sans, sans-serif" }}
    >
      {/* Subtle radial glow */}
      <div
        className="fixed top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] pointer-events-none"
        style={{ background: `radial-gradient(ellipse, rgba(79,70,229,0.04) 0%, transparent 70%)` }}
      />

      <motion.div
        className="relative w-full max-w-sm"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <button onClick={() => navigate("/")} className="flex items-center gap-2 mb-2 group" data-testid="auth-logo">
            <WaveformLogo size={32} className="text-[#c8a97e]" />
            <span className="text-lg font-medium tracking-tight" style={{ fontFamily: "Sora, sans-serif", color: C.text }}>
              mumble
            </span>
          </button>
          <p className="text-xs" style={{ color: C.dim }}>
            {mode === "login" ? "Welcome back" : "Create your account"}
          </p>
        </div>

        {/* Card */}
        <div
          className="rounded-2xl p-6"
          style={{ background: C.surface, border: `1px solid ${C.border}` }}
        >
          {/* Tabs */}
          <div className="flex mb-6 rounded-lg overflow-hidden" style={{ background: C.bg }}>
            {["login", "signup"].map((m) => (
              <button
                key={m}
                onClick={() => { setMode(m); setError(""); }}
                className="flex-1 py-2 text-xs font-medium tracking-wide transition-all duration-300 relative"
                style={{
                  color: mode === m ? C.text : C.dim,
                  background: mode === m ? C.surface : "transparent",
                }}
                data-testid={`auth-tab-${m}`}
              >
                {m === "login" ? "Log In" : "Sign Up"}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <AnimatePresence mode="wait">
              {mode === "signup" && (
                <motion.div
                  key="name-field"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <Label className="text-xs mb-1.5 block" style={{ color: C.muted }}>Name</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: C.dim }} />
                    <Input
                      type="text"
                      placeholder="Your name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required={mode === "signup"}
                      className="pl-10 h-10 text-sm rounded-lg border-0"
                      style={{ background: C.bg, color: C.text }}
                      data-testid="auth-name-input"
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div>
              <Label className="text-xs mb-1.5 block" style={{ color: C.muted }}>Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: C.dim }} />
                <Input
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="pl-10 h-10 text-sm rounded-lg border-0"
                  style={{ background: C.bg, color: C.text }}
                  data-testid="auth-email-input"
                />
              </div>
            </div>

            <div>
              <Label className="text-xs mb-1.5 block" style={{ color: C.muted }}>Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: C.dim }} />
                <Input
                  type="password"
                  placeholder="Min 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  className="pl-10 h-10 text-sm rounded-lg border-0"
                  style={{ background: C.bg, color: C.text }}
                  data-testid="auth-password-input"
                />
              </div>
            </div>

            {error && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-xs text-red-400 px-1"
                data-testid="auth-error"
              >
                {error}
              </motion.p>
            )}

            <Button
              type="submit"
              disabled={submitting}
              className="w-full h-10 rounded-lg font-medium text-sm transition-all duration-300 border-0"
              style={{ background: C.accent, color: "#0a0a0a" }}
              data-testid="auth-submit-btn"
            >
              {submitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  {mode === "login" ? "Log In" : "Create Account"}
                  <ArrowRight className="w-4 h-4 ml-2" />
                </>
              )}
            </Button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-3 my-5">
            <div className="flex-1 h-px" style={{ background: C.border }} />
            <span className="text-[10px] uppercase tracking-wider" style={{ color: C.dim }}>or</span>
            <div className="flex-1 h-px" style={{ background: C.border }} />
          </div>

          {/* Google placeholder */}
          <button
            disabled
            className="w-full h-10 rounded-lg text-xs font-medium flex items-center justify-center gap-2 transition-all duration-300 opacity-40 cursor-not-allowed"
            style={{ background: C.bg, color: C.muted, border: `1px solid ${C.border}` }}
            data-testid="auth-google-btn"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continue with Google — coming soon
          </button>
        </div>

        {/* Toggle mode */}
        <p className="text-center mt-5 text-xs" style={{ color: C.dim }}>
          {mode === "login" ? "Don't have an account?" : "Already have an account?"}{" "}
          <button
            onClick={toggleMode}
            className="font-medium transition-colors duration-200 hover:underline"
            style={{ color: C.accent }}
            data-testid="auth-toggle-mode"
          >
            {mode === "login" ? "Sign Up" : "Log In"}
          </button>
        </p>
      </motion.div>
    </div>
  );
}
