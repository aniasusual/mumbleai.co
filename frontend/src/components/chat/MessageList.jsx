import { useRef, useEffect } from "react";
import { Mic, Sparkles } from "lucide-react";
import { ChatBubble, TypingIndicator } from "./ChatBubble";
import { ToolActivityLive } from "./ToolActivity";

const StreamingBubble = ({ text }) => (
  <div className="flex items-start gap-3 px-5 py-2 animate-slide-up" data-testid="streaming-bubble">
    <div className="w-8 h-8 rounded-full bg-[#F0F4F8] flex items-center justify-center flex-shrink-0 mt-1">
      <span className="text-xs font-bold text-[#2F5233]" style={{ fontFamily: 'Playfair Display, serif' }}>L</span>
    </div>
    <div className="chat-bubble-ai px-5 py-3 max-w-[75%]">
      <div className="chat-content text-sm leading-relaxed whitespace-pre-wrap">
        {text}
        <span className="inline-block w-0.5 h-4 bg-[#2F5233] animate-pulse ml-0.5 align-text-bottom" />
      </div>
    </div>
  </div>
);

export const MessageList = ({ messages, loading, sending, toolEvents, streamingText, inputMode, onPlayAudio, onSetInput, inputRef }) => {
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamingText]);

  if (messages.length === 0 && !loading) {
    return (
      <div className="flex-1 overflow-y-auto">
        <div className="flex flex-col items-center justify-center h-full px-6 animate-fade-in" data-testid="empty-chat-state">
          <div className="w-20 h-20 rounded-full bg-[#2F5233]/10 flex items-center justify-center mb-6">
            {inputMode === "voice" ? <Mic className="w-10 h-10 text-[#2F5233]" /> : <Sparkles className="w-10 h-10 text-[#2F5233]" />}
          </div>
          <h3 className="text-xl font-semibold text-[#1A1A1A] mb-2" style={{ fontFamily: 'Playfair Display, serif' }}>
            {inputMode === "voice" ? "Tap the mic to start talking" : "Start practicing"}
          </h3>
          <p className="text-sm text-[#71717A] text-center max-w-md mb-8">
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
              ].map((prompt) => (
                <button
                  key={prompt}
                  onClick={() => { onSetInput(prompt); inputRef?.current?.focus(); }}
                  className="text-xs text-left px-4 py-2.5 rounded-full border border-gray-200 hover:border-[#2F5233]/30 hover:bg-[#2F5233]/5 text-gray-600 transition-colors duration-200"
                  data-testid={`quick-prompt-${prompt.slice(0, 20).replace(/\s/g, '-')}`}
                >
                  {prompt}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-3xl mx-auto py-4">
        {messages.map((msg, idx) => (
          <ChatBubble key={msg.id} message={msg} index={idx} onPlayAudio={onPlayAudio} />
        ))}
        {sending && toolEvents.length > 0 && <ToolActivityLive events={toolEvents} />}
        {sending && streamingText && <StreamingBubble text={streamingText} />}
        {sending && !streamingText && toolEvents.length === 0 && <TypingIndicator />}
        <div ref={messagesEndRef} />
      </div>
    </div>
  );
};
