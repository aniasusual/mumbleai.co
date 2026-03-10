import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Mic, Square, Send, Loader2, Info, Coins } from "lucide-react";
import { getSubscription } from "@/lib/api";

const CreditPill = () => {
  const [sub, setSub] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetch = () => getSubscription().then(r => setSub(r.data)).catch(() => {});
    fetch();
    const iv = setInterval(fetch, 20000);
    return () => clearInterval(iv);
  }, []);

  if (!sub) return null;

  const maxCredits = sub.plan === "free" ? 100 : sub.plan === "plus" ? 1000 : 5000;
  const pct = sub.credits / maxCredits;
  const isLow = pct <= 0.1;
  const color = isLow ? "#ef4444" : pct <= 0.3 ? "#f59e0b" : "#6366f1";

  return (
    <motion.button
      onClick={() => navigate("/pricing")}
      className="flex items-center gap-1.5 px-2.5 py-1 rounded-full transition-all hover:opacity-80"
      style={{
        background: isLow ? "rgba(239,68,68,0.08)" : "rgba(99,102,241,0.06)",
        border: `1px solid ${isLow ? "rgba(239,68,68,0.15)" : "rgba(99,102,241,0.1)"}`,
      }}
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.97 }}
      data-testid="chat-credit-pill"
    >
      <Coins className="w-3 h-3 flex-shrink-0" style={{ color }} />
      <span className="text-[11px] font-semibold tabular-nums" style={{ color }}>{sub.credits}</span>
    </motion.button>
  );
};

const VoiceVisualizer = ({ isRecording, audioLevel }) => (
  <div className="flex items-center justify-center gap-1 h-16" data-testid="voice-visualizer">
    {Array.from({ length: 16 }).map((_, i) => {
      const baseHeight = isRecording ? 8 + Math.random() * audioLevel * 40 : 4;
      return (
        <motion.div
          key={i}
          className="w-1 rounded-full"
          style={{
            height: `${baseHeight}px`,
            background: `linear-gradient(to top, #6366f1, #818cf8)`,
            opacity: isRecording ? 0.6 + Math.random() * 0.4 : 0.2,
          }}
          animate={{ height: isRecording ? [baseHeight * 0.5, baseHeight, baseHeight * 0.7] : 4 }}
          transition={{ duration: 0.3, repeat: Infinity, repeatType: "reverse" }}
        />
      );
    })}
  </div>
);

const LanguageToggle = ({ sttLanguage, onSetSttLanguage, nativeLang, targetLang, languages, disabled }) => {
  const [showTooltip, setShowTooltip] = useState(false);
  const tooltipRef = useRef(null);

  // Close tooltip on outside click
  useEffect(() => {
    if (!showTooltip) return;
    const handleClick = (e) => {
      if (tooltipRef.current && !tooltipRef.current.contains(e.target)) {
        setShowTooltip(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    document.addEventListener("touchstart", handleClick);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("touchstart", handleClick);
    };
  }, [showTooltip]);

  if (nativeLang === targetLang) return null;

  const allLangs = [...(languages?.popular || []), ...(languages?.others || [])];
  const nativeName = allLangs.find(l => l.code === nativeLang)?.name || nativeLang;
  const targetName = allLangs.find(l => l.code === targetLang)?.name || targetLang;
  const nativeCode = nativeLang?.toUpperCase().slice(0, 2) || "??";
  const targetCode = targetLang?.toUpperCase().slice(0, 2) || "??";
  const isTarget = sttLanguage === targetLang;

  return (
    <div className="relative flex items-center gap-2" data-testid="language-toggle-container">
      <div
        className="relative flex items-center rounded-full p-0.5 cursor-pointer select-none"
        style={{
          background: "rgba(0,0,0,0.06)",
          width: "120px",
          height: "32px",
        }}
        onClick={() => {
          if (!disabled) onSetSttLanguage(isTarget ? nativeLang : targetLang);
        }}
        data-testid="language-toggle"
      >
        {/* Sliding indicator */}
        <motion.div
          className="absolute top-0.5 rounded-full"
          style={{
            width: "58px",
            height: "28px",
            background: isTarget
              ? "linear-gradient(135deg, #059669, #10b981)"
              : "linear-gradient(135deg, #4338ca, #6366f1)",
            boxShadow: "0 1px 4px rgba(0,0,0,0.15)",
          }}
          animate={{ left: isTarget ? "61px" : "2px" }}
          transition={{ type: "spring", stiffness: 500, damping: 35 }}
        />
        {/* Native side */}
        <div
          className="relative z-10 flex-1 flex items-center justify-center text-xs font-semibold transition-colors duration-200"
          style={{ color: !isTarget ? "white" : "rgba(0,0,0,0.45)" }}
        >
          {nativeCode}
        </div>
        {/* Target side */}
        <div
          className="relative z-10 flex-1 flex items-center justify-center text-xs font-semibold transition-colors duration-200"
          style={{ color: isTarget ? "white" : "rgba(0,0,0,0.45)" }}
        >
          {targetCode}
        </div>
      </div>

      {/* Info icon with tooltip */}
      <div className="relative" ref={tooltipRef}>
        <button
          className="w-5 h-5 flex items-center justify-center rounded-full text-slate-400 hover:text-slate-600 transition-colors"
          onClick={(e) => { e.stopPropagation(); setShowTooltip(v => !v); }}
          data-testid="language-toggle-info"
        >
          <Info className="w-3.5 h-3.5" />
        </button>
        <AnimatePresence>
          {showTooltip && (
            <motion.div
              initial={{ opacity: 0, y: 4, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 4, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className="absolute bottom-full mb-2 px-3 py-2 rounded-lg text-xs leading-relaxed"
              style={{
                background: "rgba(15,23,42,0.92)",
                backdropFilter: "blur(8px)",
                color: "white",
                boxShadow: "0 4px 16px rgba(0,0,0,0.2)",
                zIndex: 9999,
                width: "min(208px, calc(100vw - 32px))",
                right: "0",
              }}
              data-testid="language-toggle-tooltip"
            >
              <p className="font-medium mb-1">Voice language switch</p>
              <p className="text-slate-300">
                Choose which language the mic listens for.
                It auto-switches based on what the tutor expects, but you can override it anytime.
              </p>
              <div className="mt-1.5 flex flex-col gap-0.5 text-slate-400">
                <span><span className="text-indigo-400 font-medium">{nativeCode}</span> = {nativeName}</span>
                <span><span className="text-emerald-400 font-medium">{targetCode}</span> = {targetName}</span>
              </div>
              {/* Arrow */}
              <div
                className="absolute top-full right-2 w-2 h-2 rotate-45"
                style={{ background: "rgba(15,23,42,0.92)", marginTop: "-4px" }}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export const ChatInput = ({
  inputMode, input, sending, isRecording, audioLevel, processingVoice,
  onSetInput, onSendText, onVoiceRecord, inputRef,
  sttLanguage, onSetSttLanguage, nativeLang, targetLang, languages,
}) => {
  const [focused, setFocused] = useState(false);

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); onSendText(); }
  };

  return (
    <div
      className="px-4 py-4 overflow-visible"
      style={{
        background: "rgba(248,247,244,0.88)",
        backdropFilter: "blur(16px)",
        borderTop: "1px solid rgba(0,0,0,0.06)",
      }}
      data-testid="chat-input-area"
    >
      <div className="max-w-3xl mx-auto">
        {inputMode === "voice" ? (
          <div className="flex flex-col items-center gap-3">
            <AnimatePresence>
              {isRecording && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                >
                  <VoiceVisualizer isRecording={isRecording} audioLevel={audioLevel} />
                </motion.div>
              )}
            </AnimatePresence>
            {processingVoice && !isRecording && (
              <div className="flex items-center gap-2 text-sm text-slate-400 py-2">
                <Loader2 className="w-4 h-4 animate-spin text-indigo-500" />
                <span>Processing your voice...</span>
              </div>
            )}
            <div className="flex items-center gap-4">
              <LanguageToggle
                sttLanguage={sttLanguage}
                onSetSttLanguage={onSetSttLanguage}
                nativeLang={nativeLang}
                targetLang={targetLang}
                languages={languages}
                disabled={isRecording || processingVoice}
              />
              <motion.button
                onClick={onVoiceRecord}
                disabled={processingVoice && !isRecording}
                className={`relative w-16 h-16 rounded-full flex items-center justify-center transition-all duration-200 ${
                  processingVoice && !isRecording ? "opacity-50 cursor-not-allowed" : ""
                }`}
                style={{
                  background: isRecording
                    ? "linear-gradient(135deg, #dc2626, #ef4444)"
                    : "linear-gradient(135deg, #4338ca, #6366f1)",
                  boxShadow: isRecording
                    ? "0 4px 24px rgba(239,68,68,0.35)"
                    : "0 4px 24px rgba(99,102,241,0.35)",
                }}
                whileHover={{ scale: 1.05, boxShadow: isRecording ? "0 6px 32px rgba(239,68,68,0.45)" : "0 6px 32px rgba(99,102,241,0.45)" }}
                whileTap={{ scale: 0.92 }}
                data-testid="voice-record-btn"
              >
                {isRecording ? (
                  <Square className="w-6 h-6 text-white" fill="white" />
                ) : (
                  <Mic className="w-7 h-7 text-white" />
                )}
                {isRecording && (
                  <motion.span
                    className="absolute inset-0 rounded-full border-2 border-red-300"
                    animate={{ scale: [1, 1.3], opacity: [0.6, 0] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  />
                )}
              </motion.button>
              <CreditPill />
            </div>
            <p className="text-xs text-slate-400">{isRecording ? "Tap to stop & send" : "Tap to start speaking"}</p>
          </div>
        ) : (
          <motion.div
            className="flex items-end rounded-2xl bg-white overflow-hidden"
            animate={{
              boxShadow: focused
                ? "0 0 0 2px rgba(99,102,241,0.25), 0 4px 16px rgba(99,102,241,0.1)"
                : "0 0 0 1px rgba(0,0,0,0.08), 0 2px 8px rgba(0,0,0,0.04)",
            }}
            transition={{ duration: 0.2 }}
          >
            <textarea
              ref={inputRef} value={input}
              onChange={(e) => onSetInput(e.target.value)}
              onKeyDown={handleKeyDown}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              placeholder="Type your message..."
              rows={1}
              className="flex-1 resize-none bg-transparent border-0 focus:ring-0 px-4 py-3.5 text-sm text-slate-800 placeholder:text-slate-400 outline-none"
              style={{ minHeight: '48px', maxHeight: '120px' }}
              data-testid="chat-input"
            />
            <div className="flex items-center gap-1.5 pr-2 pb-2 flex-shrink-0">
              <CreditPill />
              <motion.button
                onClick={onSendText}
                disabled={!input.trim() || sending}
                className="rounded-xl h-9 w-9 flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed"
                style={{
                  background: input.trim() && !sending ? "linear-gradient(135deg, #4338ca, #6366f1)" : "rgba(0,0,0,0.06)",
                  boxShadow: input.trim() && !sending ? "0 2px 8px rgba(99,102,241,0.3)" : "none",
                  color: input.trim() && !sending ? "white" : "#94a3b8",
                }}
                whileHover={input.trim() && !sending ? { scale: 1.08 } : {}}
                whileTap={input.trim() && !sending ? { scale: 0.92 } : {}}
                data-testid="send-message-btn"
              >
                {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              </motion.button>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};
