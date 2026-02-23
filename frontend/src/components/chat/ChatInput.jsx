import { useRef } from "react";
import { Button } from "@/components/ui/button";
import { Mic, Square, Send, Loader2 } from "lucide-react";

const VoiceVisualizer = ({ isRecording, audioLevel }) => (
  <div className="flex items-center justify-center gap-1 h-16" data-testid="voice-visualizer">
    {Array.from({ length: 12 }).map((_, i) => {
      const baseHeight = isRecording ? 8 + Math.random() * audioLevel * 40 : 4;
      return (
        <div
          key={i} className="w-1 rounded-full bg-[#2F5233] transition-all"
          style={{ height: `${baseHeight}px`, opacity: isRecording ? 0.6 + Math.random() * 0.4 : 0.2, transitionDuration: '150ms' }}
        />
      );
    })}
  </div>
);

export const ChatInput = ({
  inputMode, input, sending, isRecording, audioLevel, processingVoice,
  onSetInput, onSendText, onVoiceRecord, inputRef,
}) => {
  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); onSendText(); }
  };

  return (
    <div className="glass-input px-4 py-4" data-testid="chat-input-area">
      <div className="max-w-3xl mx-auto">
        {inputMode === "voice" ? (
          <div className="flex flex-col items-center gap-3">
            {isRecording && <VoiceVisualizer isRecording={isRecording} audioLevel={audioLevel} />}
            {processingVoice && !isRecording && (
              <div className="flex items-center gap-2 text-sm text-[#71717A] py-2">
                <Loader2 className="w-4 h-4 animate-spin text-[#2F5233]" />
                <span>Processing your voice...</span>
              </div>
            )}
            <div className="flex items-center gap-4">
              <button
                onClick={onVoiceRecord}
                disabled={processingVoice && !isRecording}
                className={`relative w-16 h-16 rounded-full flex items-center justify-center shadow-lg transition-transform duration-200 hover:-translate-y-0.5 ${
                  isRecording ? "bg-red-500 hover:bg-red-600 animate-pulse" : "bg-[#2F5233] hover:bg-[#1E3524]"
                } ${processingVoice && !isRecording ? "opacity-50 cursor-not-allowed" : ""}`}
                data-testid="voice-record-btn"
              >
                {isRecording ? <Square className="w-6 h-6 text-white" fill="white" /> : <Mic className="w-7 h-7 text-white" />}
                {isRecording && <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-red-400 animate-ping" />}
              </button>
            </div>
            <p className="text-xs text-[#71717A]">{isRecording ? "Tap to stop & send" : "Tap to start speaking"}</p>
          </div>
        ) : (
          <div className="flex items-end gap-3">
            <div className="flex-1 relative">
              <textarea
                ref={inputRef} value={input} onChange={(e) => onSetInput(e.target.value)} onKeyDown={handleKeyDown}
                placeholder="Type your message..." rows={1}
                className="w-full resize-none bg-gray-50 border-transparent focus:border-[#2F5233] focus:ring-0 rounded-xl px-4 py-3 text-sm text-[#1A1A1A] placeholder:text-gray-400 outline-none transition-colors duration-200"
                style={{ minHeight: '44px', maxHeight: '120px' }}
                data-testid="chat-input"
              />
            </div>
            <Button
              onClick={onSendText} disabled={!input.trim() || sending}
              className="bg-[#2F5233] hover:bg-[#1E3524] text-white rounded-xl h-11 w-11 p-0 flex items-center justify-center shadow-md transition-transform duration-200 hover:-translate-y-0.5 disabled:opacity-50"
              data-testid="send-message-btn"
            >
              {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};
