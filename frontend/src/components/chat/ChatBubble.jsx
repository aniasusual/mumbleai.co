import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Loader2, Volume2, Square } from "lucide-react";
import { ToolActivitySummary } from "./ToolActivity";

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

/** Small animated waveform bars — shows when audio is playing */
const AudioWaveform = () => (
  <div className="flex items-center gap-[2px] h-3.5" data-testid="audio-waveform">
    {[1, 2, 3, 4, 5].map(i => (
      <div key={i} className="w-[2.5px] bg-[#2F5233] rounded-full waveform-bar" />
    ))}
  </div>
);

/** Shared markdown renderer for AI messages */
const MarkdownContent = ({ content }) => (
  <ReactMarkdown
    remarkPlugins={[remarkGfm]}
    components={{
      p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
      strong: ({ children }) => <strong className="font-semibold text-[#2F5233]">{children}</strong>,
      em: ({ children }) => <em className="italic">{children}</em>,
      ul: ({ children }) => <ul className="list-disc ml-4 mb-2 space-y-0.5">{children}</ul>,
      ol: ({ children }) => <ol className="list-decimal ml-4 mb-2 space-y-0.5">{children}</ol>,
      li: ({ children }) => <li>{children}</li>,
      code: ({ inline, children }) =>
        inline
          ? <code className="bg-[#2F5233]/8 text-[#2F5233] px-1.5 py-0.5 rounded text-[13px] font-mono">{children}</code>
          : <pre className="bg-[#F0F4F8] rounded-lg p-3 mb-2 overflow-x-auto"><code className="text-[13px] font-mono text-[#1A1A1A]">{children}</code></pre>,
      blockquote: ({ children }) => <blockquote className="border-l-2 border-[#2F5233]/30 pl-3 italic text-gray-600 mb-2">{children}</blockquote>,
      h1: ({ children }) => <h4 className="font-semibold text-base mb-1">{children}</h4>,
      h2: ({ children }) => <h4 className="font-semibold text-base mb-1">{children}</h4>,
      h3: ({ children }) => <h4 className="font-semibold text-sm mb-1">{children}</h4>,
      hr: () => <hr className="border-gray-200 my-2" />,
      a: ({ href, children }) => <a href={href} className="text-[#2F5233] underline" target="_blank" rel="noopener noreferrer">{children}</a>,
      table: ({ children }) => <table className="border-collapse text-xs mb-2 w-full">{children}</table>,
      th: ({ children }) => <th className="border border-gray-200 bg-[#F0F4F8] px-2 py-1 text-left font-semibold">{children}</th>,
      td: ({ children }) => <td className="border border-gray-200 px-2 py-1">{children}</td>,
    }}
  >
    {content}
  </ReactMarkdown>
);

/** Render message text with karaoke word-by-word highlighting */
const KaraokeText = ({ text, currentWordIndex }) => {
  const tokens = text.split(/(\s+)/);
  let wordIdx = 0;

  return (
    <span>
      {tokens.map((token, i) => {
        if (/^\s+$/.test(token)) {
          return <span key={i}>{token}</span>;
        }
        const idx = wordIdx++;
        let cls = "karaoke-word karaoke-word-upcoming";
        if (idx < currentWordIndex) {
          cls = "karaoke-word karaoke-word-spoken";
        } else if (idx === currentWordIndex) {
          cls = "karaoke-word karaoke-word-current";
        }
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
    try {
      await onPlayAudio(message.id, message.content);
    } catch (e) {
      console.error("Playback failed", e);
    }
    setFetchingAudio(false);
  };

  const handleStop = () => {
    if (onStopAudio) onStopAudio();
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
        <div className="chat-content text-sm leading-relaxed">
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
                  onClick={handleStop}
                  className="flex items-center gap-2 p-1.5 rounded-full hover:bg-gray-100 transition-colors duration-150"
                  data-testid={`stop-audio-${message.id}`}
                  title="Stop"
                >
                  <Square className="w-3 h-3 text-[#2F5233] fill-[#2F5233]" />
                  <AudioWaveform />
                </button>
              ) : (
                <button
                  onClick={handlePlay}
                  className="p-1.5 rounded-full hover:bg-gray-100 transition-colors duration-150"
                  data-testid={`play-audio-${message.id}`}
                  title="Listen"
                >
                  {fetchingAudio
                    ? <Loader2 className="w-3.5 h-3.5 animate-spin text-[#2F5233]" />
                    : <Volume2 className="w-3.5 h-3.5 text-[#71717A]" />
                  }
                </button>
              )}
            </>
          )}
        </div>
        {!isUser && message.tool_activity && <ToolActivitySummary toolActivity={message.tool_activity} />}
      </div>
    </div>
  );
};

export { TypingIndicator, MarkdownContent };
