import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mic, Square, Send, Loader2, Info } from "lucide-react";

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
      <div className="relative">
        <button
          className="w-5 h-5 flex items-center justify-center rounded-full text-slate-400 hover:text-slate-600 transition-colors"
          onMouseEnter={() => setShowTooltip(true)}
          onMouseLeave={() => setShowTooltip(false)}
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
              className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-52 px-3 py-2 rounded-lg text-xs leading-relaxed z-50"
              style={{
                background: "rgba(15,23,42,0.92)",
                backdropFilter: "blur(8px)",
                color: "white",
                boxShadow: "0 4px 16px rgba(0,0,0,0.2)",
              }}
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
                className="absolute top-full left-1/2 -translate-x-1/2 w-2 h-2 rotate-45"
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
      className="px-4 py-4"
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
            </div>
            <p className="text-xs text-slate-400">{isRecording ? "Tap to stop & send" : "Tap to start speaking"}</p>
          </div>
        ) : (
          <div className="flex items-end gap-3">
            <motion.div
              className="flex-1 relative rounded-xl overflow-hidden"
              animate={{
                boxShadow: focused
                  ? "0 0 0 2px rgba(99,102,241,0.3), 0 4px 12px rgba(99,102,241,0.08)"
                  : "0 0 0 1px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.04)",
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
                className="w-full resize-none bg-white border-0 focus:ring-0 rounded-xl px-4 py-3 text-sm text-slate-800 placeholder:text-slate-300 outline-none"
                style={{ minHeight: '44px', maxHeight: '120px' }}
                data-testid="chat-input"
              />
            </motion.div>
            <motion.button
              onClick={onSendText}
              disabled={!input.trim() || sending}
              className="rounded-xl h-11 w-11 flex items-center justify-center text-white disabled:opacity-30 disabled:cursor-not-allowed"
              style={{
                background: input.trim() && !sending ? "linear-gradient(135deg, #4338ca, #6366f1)" : "#e2e8f0",
                boxShadow: input.trim() && !sending ? "0 2px 12px rgba(99,102,241,0.3)" : "none",
                color: input.trim() && !sending ? "white" : "#94a3b8",
              }}
              whileHover={input.trim() && !sending ? { scale: 1.05, boxShadow: "0 4px 20px rgba(99,102,241,0.4)" } : {}}
              whileTap={input.trim() && !sending ? { scale: 0.92 } : {}}
              data-testid="send-message-btn"
            >
              {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </motion.button>
          </div>
        )}
      </div>
    </div>
  );
};
