import { useRef, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mic, Sparkles } from "lucide-react";
import { ChatBubble, TypingIndicator, MarkdownContent } from "./ChatBubble";
import { ToolActivityLive } from "./ToolActivity";
import { WaveformLogoSmall } from "@/components/WaveformLogo";

/** Floating mesh blobs for the empty state */
function MeshBlobs() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <motion.div className="absolute w-[400px] h-[400px] rounded-full"
        style={{ top: "5%", right: "10%", background: "radial-gradient(circle, rgba(99,102,241,0.12) 0%, transparent 65%)" }}
        animate={{ x: [0, 30, 0], y: [0, 20, 0] }}
        transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }} />
      <motion.div className="absolute w-[350px] h-[350px] rounded-full"
        style={{ bottom: "10%", left: "5%", background: "radial-gradient(circle, rgba(236,72,153,0.08) 0%, transparent 65%)" }}
        animate={{ x: [0, -20, 0], y: [0, -25, 0] }}
        transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }} />
      <motion.div className="absolute w-[300px] h-[300px] rounded-full"
        style={{ top: "40%", left: "40%", background: "radial-gradient(circle, rgba(16,185,129,0.08) 0%, transparent 65%)" }}
        animate={{ x: [0, 25, 0], y: [0, -15, 0] }}
        transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }} />
    </div>
  );
}

/** Floating script chars for empty state */
const CHARS = ["あ", "ñ", "ü", "한", "ç", "你", "θ", "ê"];

function FloatingCharsSmall() {
  const items = useMemo(() => CHARS.map((c, i) => ({
    char: c, x: 10 + (i * 11) % 80, y: 10 + ((i * 14) % 75),
    size: 14 + (i % 3) * 5, dur: 10 + (i % 4) * 4,
  })), []);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {items.map((item, i) => (
        <motion.span key={i}
          className="absolute font-bold select-none"
          style={{ left: `${item.x}%`, top: `${item.y}%`, fontSize: item.size, color: "rgba(99,102,241,0.06)" }}
          animate={{ y: [-8, 8, -8], x: [-4, 4, -4], rotate: [-5, 5, -5] }}
          transition={{ duration: item.dur, repeat: Infinity, ease: "easeInOut", delay: i * 0.6 }}
        >{item.char}</motion.span>
      ))}
    </div>
  );
}

export const MessageList = ({ messages, loading, sending, toolEvents, streamingText, speakingState, onStopAudio, inputMode, onPlayAudio, onSetInput, inputRef }) => {
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamingText]);

  if (messages.length === 0 && !loading) {
    return (
      <div className="flex-1 overflow-y-auto relative">
        <MeshBlobs />
        <FloatingCharsSmall />
        <motion.div
          className="flex flex-col items-center justify-center h-full px-6 relative z-10"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          data-testid="empty-chat-state"
        >
          <motion.div
            className="w-20 h-20 rounded-2xl flex items-center justify-center mb-6 bg-indigo-50 border border-indigo-100"
            animate={{ rotate: [0, 2, -2, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          >
            {inputMode === "voice"
              ? <Mic className="w-10 h-10 text-indigo-500" />
              : <Sparkles className="w-10 h-10 text-indigo-500" />
            }
          </motion.div>
          <h3 className="text-xl font-semibold text-slate-800 mb-2" style={{ fontFamily: 'Sora, sans-serif' }}>
            {inputMode === "voice" ? "Tap the mic to start talking" : "Start practicing"}
          </h3>
          <p className="text-sm text-slate-500 text-center max-w-md mb-8 leading-relaxed">
            {inputMode === "voice"
              ? "Speak naturally in English. I'll listen, respond with voice, and help you improve your pronunciation, grammar, and vocabulary."
              : "Type anything in English and I'll help you improve. Try asking me to check your grammar, practice a scenario, or explain a word."}
          </p>
          {inputMode === "text" && (
            <div className="flex flex-wrap gap-2 justify-center max-w-lg">
              {[
                "Check my grammar: I goed to the store yesterday",
                "How do you pronounce 'entrepreneur'?",
                "Let's practice a job interview",
                "What does 'serendipity' mean?"
              ].map((prompt, i) => (
                <motion.button
                  key={prompt}
                  onClick={() => { onSetInput(prompt); inputRef?.current?.focus(); }}
                  className="text-xs text-left px-4 py-2.5 rounded-full text-slate-500 bg-white border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-600 transition-all duration-200 shadow-sm"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 + i * 0.08, duration: 0.3 }}
                  data-testid={`quick-prompt-${prompt.slice(0, 20).replace(/\s/g, '-')}`}
                >
                  {prompt}
                </motion.button>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-3xl mx-auto py-4">
        {messages.map((msg, idx) => (
          <ChatBubble key={msg.id} message={msg} index={idx} onPlayAudio={onPlayAudio} speakingState={speakingState} onStopAudio={onStopAudio} />
        ))}
        {sending && toolEvents.length > 0 && <ToolActivityLive events={toolEvents} />}
        {sending && <TypingIndicator />}
        <div ref={messagesEndRef} />
      </div>
    </div>
  );
};
