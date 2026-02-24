import { useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mic, Sparkles } from "lucide-react";
import { ChatBubble, TypingIndicator, MarkdownContent } from "./ChatBubble";
import { ToolActivityLive } from "./ToolActivity";
import { WaveformLogoSmall } from "@/components/WaveformLogo";

const StreamingBubble = ({ text }) => (
  <motion.div
    className="flex items-start gap-3 px-5 py-2"
    initial={{ opacity: 0, y: 8 }}
    animate={{ opacity: 1, y: 0 }}
    data-testid="streaming-bubble"
  >
    <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-1"
      style={{ background: "linear-gradient(135deg, rgba(99,102,241,0.15), rgba(129,140,248,0.1))", border: "1px solid rgba(99,102,241,0.2)" }}>
      <WaveformLogoSmall size={18} className="text-indigo-400" />
    </div>
    <div className="max-w-[75%] px-5 py-3 rounded-2xl rounded-tl-sm"
      style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}>
      <div className="text-sm leading-relaxed text-slate-200">
        <MarkdownContent content={text} />
        <span className="inline-block w-0.5 h-4 bg-indigo-400 animate-pulse ml-0.5 align-text-bottom" />
      </div>
    </div>
  </motion.div>
);

export const MessageList = ({ messages, loading, sending, toolEvents, streamingText, speakingState, onStopAudio, inputMode, onPlayAudio, onSetInput, inputRef }) => {
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamingText]);

  if (messages.length === 0 && !loading) {
    return (
      <div className="flex-1 overflow-y-auto">
        <motion.div
          className="flex flex-col items-center justify-center h-full px-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          data-testid="empty-chat-state"
        >
          <motion.div
            className="w-20 h-20 rounded-2xl flex items-center justify-center mb-6"
            style={{
              background: "linear-gradient(135deg, rgba(99,102,241,0.15), rgba(129,140,248,0.08))",
              border: "1px solid rgba(99,102,241,0.2)",
            }}
            animate={{ rotate: [0, 2, -2, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          >
            {inputMode === "voice"
              ? <Mic className="w-10 h-10 text-indigo-400" />
              : <Sparkles className="w-10 h-10 text-indigo-400" />
            }
          </motion.div>
          <h3 className="text-xl font-semibold text-white mb-2" style={{ fontFamily: 'Sora, sans-serif' }}>
            {inputMode === "voice" ? "Tap the mic to start talking" : "Start practicing"}
          </h3>
          <p className="text-sm text-slate-400 text-center max-w-md mb-8 leading-relaxed">
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
                  className="text-xs text-left px-4 py-2.5 rounded-full text-slate-400 transition-all duration-200"
                  style={{
                    background: "rgba(255,255,255,0.03)",
                    border: "1px solid rgba(255,255,255,0.08)",
                  }}
                  whileHover={{
                    background: "rgba(99,102,241,0.1)",
                    borderColor: "rgba(99,102,241,0.3)",
                    color: "#a5b4fc",
                  }}
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
        {sending && streamingText && <StreamingBubble text={streamingText} />}
        {sending && !streamingText && toolEvents.length === 0 && <TypingIndicator />}
        <div ref={messagesEndRef} />
      </div>
    </div>
  );
};
