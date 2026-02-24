import { useState } from "react";
import { motion } from "framer-motion";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Loader2, Volume2, Square } from "lucide-react";
import { ToolActivitySummary } from "./ToolActivity";
import { WaveformLogoSmall } from "@/components/WaveformLogo";

const AiAvatar = () => (
  <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-1"
    style={{ background: "linear-gradient(135deg, rgba(99,102,241,0.15), rgba(129,140,248,0.1))", border: "1px solid rgba(99,102,241,0.2)" }}>
    <WaveformLogoSmall size={18} className="text-indigo-400" />
  </div>
);

const TypingIndicator = () => (
  <motion.div
    className="flex items-center gap-3 px-5 py-2"
    initial={{ opacity: 0, y: 8 }}
    animate={{ opacity: 1, y: 0 }}
  >
    <AiAvatar />
    <div className="px-4 py-3 rounded-2xl rounded-tl-sm" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}>
      <div className="flex gap-1.5">
        <div className="w-2 h-2 rounded-full bg-indigo-400/50 typing-dot" />
        <div className="w-2 h-2 rounded-full bg-indigo-400/50 typing-dot" />
        <div className="w-2 h-2 rounded-full bg-indigo-400/50 typing-dot" />
      </div>
    </div>
  </motion.div>
);

const AudioWaveform = () => (
  <div className="flex items-center gap-[2px] h-3.5" data-testid="audio-waveform">
    {[1, 2, 3, 4, 5].map(i => (
      <div key={i} className="w-[2.5px] bg-indigo-400 rounded-full waveform-bar" />
    ))}
  </div>
);

const MarkdownContent = ({ content }) => (
  <ReactMarkdown
    remarkPlugins={[remarkGfm]}
    components={{
      p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
      strong: ({ children }) => <strong className="font-semibold text-indigo-300">{children}</strong>,
      em: ({ children }) => <em className="italic text-slate-300">{children}</em>,
      ul: ({ children }) => <ul className="list-disc ml-4 mb-2 space-y-0.5">{children}</ul>,
      ol: ({ children }) => <ol className="list-decimal ml-4 mb-2 space-y-0.5">{children}</ol>,
      li: ({ children }) => <li>{children}</li>,
      code: ({ inline, children }) =>
        inline
          ? <code className="bg-indigo-500/10 text-indigo-300 px-1.5 py-0.5 rounded text-[13px] font-mono">{children}</code>
          : <pre className="bg-white/5 rounded-lg p-3 mb-2 overflow-x-auto border border-white/8"><code className="text-[13px] font-mono text-slate-300">{children}</code></pre>,
      blockquote: ({ children }) => <blockquote className="border-l-2 border-indigo-500/30 pl-3 italic text-slate-400 mb-2">{children}</blockquote>,
      h1: ({ children }) => <h4 className="font-semibold text-base mb-1 text-white">{children}</h4>,
      h2: ({ children }) => <h4 className="font-semibold text-base mb-1 text-white">{children}</h4>,
      h3: ({ children }) => <h4 className="font-semibold text-sm mb-1 text-slate-200">{children}</h4>,
      hr: () => <hr className="border-white/8 my-2" />,
      a: ({ href, children }) => <a href={href} className="text-indigo-400 hover:text-indigo-300 underline underline-offset-2" target="_blank" rel="noopener noreferrer">{children}</a>,
      table: ({ children }) => <table className="border-collapse text-xs mb-2 w-full">{children}</table>,
      th: ({ children }) => <th className="border border-white/10 bg-white/5 px-2 py-1 text-left font-semibold text-slate-300">{children}</th>,
      td: ({ children }) => <td className="border border-white/10 px-2 py-1 text-slate-400">{children}</td>,
    }}
  >
    {content}
  </ReactMarkdown>
);

const KaraokeText = ({ text, currentWordIndex }) => {
  const tokens = text.split(/(\s+)/);
  let wordIdx = 0;

  return (
    <span>
      {tokens.map((token, i) => {
        if (/^\s+$/.test(token)) return <span key={i}>{token}</span>;
        const idx = wordIdx++;
        let cls = "karaoke-word karaoke-word-upcoming";
        if (idx < currentWordIndex) cls = "karaoke-word karaoke-word-spoken";
        else if (idx === currentWordIndex) cls = "karaoke-word karaoke-word-current";
        return <span key={i} className={cls}>{token}</span>;
      })}
    </span>
  );
};

export const ChatBubble = ({ message, index, onPlayAudio, speakingState, onStopAudio }) => {
  const isUser = message.role === "user";
  const [fetchingAudio, setFetchingAudio] = useState(false);

  const isSpeaking = speakingState?.messageId === message.id;
  const currentWordIndex = isSpeaking ? (speakingState.wordIndex ?? -1) : -1;

  const handlePlay = async () => {
    if (fetchingAudio || isSpeaking) return;
    setFetchingAudio(true);
    try { await onPlayAudio(message.id, message.content); } catch (e) { console.error("Playback failed", e); }
    setFetchingAudio(false);
  };

  return (
    <motion.div
      className={`flex items-start gap-3 px-5 py-2 ${isUser ? "flex-row-reverse" : ""}`}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.03, 0.3), duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      data-testid={`chat-message-${message.id}`}
    >
      {!isUser && <AiAvatar />}
      <div
        className={`max-w-[75%] px-5 py-3 ${
          isUser
            ? "rounded-2xl rounded-tr-sm text-white"
            : "rounded-2xl rounded-tl-sm text-slate-200"
        }`}
        style={isUser
          ? { background: "linear-gradient(135deg, #4338ca, #6366f1)" }
          : { background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }
        }
      >
        <div className="text-sm leading-relaxed">
          {isUser
            ? <span className="whitespace-pre-wrap">{message.content}</span>
            : isSpeaking
              ? <KaraokeText text={message.content} currentWordIndex={currentWordIndex} />
              : <MarkdownContent content={message.content} />
          }
        </div>
        <div className="flex items-center gap-2 mt-2">
          {!isUser && (
            <>
              {isSpeaking ? (
                <button
                  onClick={onStopAudio}
                  className="flex items-center gap-2 p-1.5 rounded-full hover:bg-white/5 transition-colors duration-150"
                  data-testid={`stop-audio-${message.id}`} title="Stop"
                >
                  <Square className="w-3 h-3 text-indigo-400 fill-indigo-400" />
                  <AudioWaveform />
                </button>
              ) : (
                <button
                  onClick={handlePlay}
                  className="p-1.5 rounded-full hover:bg-white/5 transition-colors duration-150"
                  data-testid={`play-audio-${message.id}`} title="Listen"
                >
                  {fetchingAudio
                    ? <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-400" />
                    : <Volume2 className="w-3.5 h-3.5 text-slate-500 hover:text-indigo-400 transition-colors" />
                  }
                </button>
              )}
            </>
          )}
        </div>
        {!isUser && message.tool_activity && <ToolActivitySummary toolActivity={message.tool_activity} />}
      </div>
    </motion.div>
  );
};

export { TypingIndicator, MarkdownContent };
