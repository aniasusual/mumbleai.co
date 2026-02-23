import { useState } from "react";
import { Loader2, Volume2 } from "lucide-react";

const TypingIndicator = () => (
  <div className="flex items-center gap-3 px-5 py-4 animate-slide-up">
    <div className="w-8 h-8 rounded-full bg-[#F0F4F8] flex items-center justify-center flex-shrink-0">
      <span className="text-xs font-bold text-[#2F5233]" style={{ fontFamily: 'Playfair Display, serif' }}>L</span>
    </div>
    <div className="chat-bubble-ai px-4 py-3">
      <div className="flex gap-1.5">
        <div className="w-2 h-2 rounded-full bg-[#2F5233]/40 typing-dot" />
        <div className="w-2 h-2 rounded-full bg-[#2F5233]/40 typing-dot" />
        <div className="w-2 h-2 rounded-full bg-[#2F5233]/40 typing-dot" />
      </div>
    </div>
  </div>
);

export const ChatBubble = ({ message, index, onPlayAudio }) => {
  const isUser = message.role === "user";
  const [playing, setPlaying] = useState(false);

  const handlePlay = async () => {
    if (playing) return;
    setPlaying(true);
    try { await onPlayAudio(message.content); } catch (e) { console.error("Playback failed", e); }
    setPlaying(false);
  };

  return (
    <div
      className={`flex items-start gap-3 px-5 py-2 animate-slide-up ${isUser ? "flex-row-reverse" : ""}`}
      style={{ animationDelay: `${index * 0.05}s` }}
      data-testid={`chat-message-${message.id}`}
    >
      {!isUser && (
        <div className="w-8 h-8 rounded-full bg-[#F0F4F8] flex items-center justify-center flex-shrink-0 mt-1">
          <span className="text-xs font-bold text-[#2F5233]" style={{ fontFamily: 'Playfair Display, serif' }}>L</span>
        </div>
      )}
      <div className={`max-w-[75%] ${isUser ? "chat-bubble-user px-5 py-3" : "chat-bubble-ai px-5 py-3"}`}>
        <div className="chat-content text-sm leading-relaxed whitespace-pre-wrap">{message.content}</div>
        <div className="flex items-center gap-2 mt-2">
          {message.tools_used?.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {message.tools_used.map((tool) => (
                <span key={tool} className={`tool-badge ${tool === "set_proficiency_level" ? "!bg-emerald-100 !text-emerald-700 font-semibold" : ""}`}>
                  {tool === "set_proficiency_level" ? "level detected" : tool.replace(/_/g, " ")}
                </span>
              ))}
            </div>
          )}
          {!isUser && (
            <button onClick={handlePlay} className="ml-auto p-1.5 rounded-full hover:bg-gray-100 transition-colors duration-150" data-testid={`play-audio-${message.id}`} title="Listen">
              {playing ? <Loader2 className="w-3.5 h-3.5 animate-spin text-[#2F5233]" /> : <Volume2 className="w-3.5 h-3.5 text-[#71717A]" />}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export { TypingIndicator };
