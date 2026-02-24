import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mic, Square, Send, Loader2 } from "lucide-react";

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

export const ChatInput = ({
  inputMode, input, sending, isRecording, audioLevel, processingVoice,
  onSetInput, onSendText, onVoiceRecord, inputRef,
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
