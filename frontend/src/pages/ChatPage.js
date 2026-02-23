import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import {
  MessageCircle,
  Plus,
  Send,
  Trash2,
  BookOpen,
  BarChart3,
  Loader2,
  Briefcase,
  Plane,
  UtensilsCrossed,
  Phone,
  Users,
  ShoppingBag,
  Stethoscope,
  ChevronDown,
  ArrowLeft,
  Sparkles,
  Menu,
  X,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Square,
  Keyboard
} from "lucide-react";
import {
  createConversation,
  listConversations,
  getMessages,
  sendMessage,
  sendVoiceMessage,
  deleteConversation,
  getScenarios,
  textToSpeech
} from "@/lib/api";

const ICON_MAP = {
  Briefcase, Plane, UtensilsCrossed, MessageCircle, Phone, Users, ShoppingBag, Stethoscope
};

// Audio playback helper
const playAudioBase64 = (base64Audio) => {
  return new Promise((resolve, reject) => {
    try {
      const byteChars = atob(base64Audio);
      const byteNumbers = new Array(byteChars.length);
      for (let i = 0; i < byteChars.length; i++) {
        byteNumbers[i] = byteChars.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: "audio/mp3" });
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      audio.onended = () => {
        URL.revokeObjectURL(url);
        resolve();
      };
      audio.onerror = (e) => {
        URL.revokeObjectURL(url);
        reject(e);
      };
      audio.play();
    } catch (e) {
      reject(e);
    }
  });
};

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

const ChatBubble = ({ message, index, onPlayAudio }) => {
  const isUser = message.role === "user";
  const [playing, setPlaying] = useState(false);

  const handlePlay = async () => {
    if (playing) return;
    setPlaying(true);
    try {
      await onPlayAudio(message.content);
    } catch (e) {
      console.error("Playback failed", e);
    }
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
        <div className="chat-content text-sm leading-relaxed whitespace-pre-wrap">
          {message.content}
        </div>
        <div className="flex items-center gap-2 mt-2">
          {message.tools_used && message.tools_used.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {message.tools_used.map((tool) => (
                <span key={tool} className="tool-badge">{tool.replace("_", " ")}</span>
              ))}
            </div>
          )}
          {!isUser && (
            <button
              onClick={handlePlay}
              className={`ml-auto p-1.5 rounded-full transition-colors duration-150 ${
                isUser ? "hover:bg-white/20" : "hover:bg-gray-100"
              }`}
              data-testid={`play-audio-${message.id}`}
              title="Listen to this message"
            >
              {playing ? (
                <Loader2 className={`w-3.5 h-3.5 animate-spin ${isUser ? "text-white/70" : "text-[#2F5233]"}`} />
              ) : (
                <Volume2 className={`w-3.5 h-3.5 ${isUser ? "text-white/70" : "text-[#71717A]"}`} />
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

// Voice recording visualizer
const VoiceVisualizer = ({ isRecording, audioLevel }) => {
  const bars = 12;
  return (
    <div className="flex items-center justify-center gap-1 h-16" data-testid="voice-visualizer">
      {Array.from({ length: bars }).map((_, i) => {
        const baseHeight = isRecording ? 8 + Math.random() * audioLevel * 40 : 4;
        return (
          <div
            key={i}
            className="w-1 rounded-full bg-[#2F5233] transition-all"
            style={{
              height: `${baseHeight}px`,
              opacity: isRecording ? 0.6 + Math.random() * 0.4 : 0.2,
              transitionDuration: '150ms'
            }}
          />
        );
      })}
    </div>
  );
};

export default function ChatPage() {
  const navigate = useNavigate();
  const { conversationId } = useParams();
  const [conversations, setConversations] = useState([]);
  const [currentConv, setCurrentConv] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [scenarios, setScenarios] = useState([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  const [processingVoice, setProcessingVoice] = useState(false);
  const [inputMode, setInputMode] = useState("voice"); // "voice" or "text"
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const analyserRef = useRef(null);
  const animFrameRef = useRef(null);
  const streamRef = useRef(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    loadConversations();
    loadScenarios();
  }, []);

  useEffect(() => {
    if (conversationId) {
      loadMessages(conversationId);
      const conv = conversations.find(c => c.id === conversationId);
      if (conv) setCurrentConv(conv);
    }
  }, [conversationId, conversations]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
      }
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, []);

  const loadConversations = async () => {
    try {
      const res = await listConversations();
      setConversations(res.data);
    } catch (e) {
      console.error("Failed to load conversations", e);
    }
  };

  const loadScenarios = async () => {
    try {
      const res = await getScenarios();
      setScenarios(res.data);
    } catch (e) {
      console.error("Failed to load scenarios", e);
    }
  };

  const loadMessages = async (convId) => {
    setLoading(true);
    try {
      const res = await getMessages(convId);
      setMessages(res.data);
    } catch (e) {
      console.error("Failed to load messages", e);
    } finally {
      setLoading(false);
    }
  };

  const handleNewConversation = async (scenario = null) => {
    try {
      const res = await createConversation({
        title: scenario ? `${scenario} Practice` : null,
        scenario
      });
      setConversations(prev => [res.data, ...prev]);
      setCurrentConv(res.data);
      setMessages([]);
      navigate(`/chat/${res.data.id}`);
      setSidebarOpen(false);
    } catch (e) {
      toast.error("Failed to create conversation");
    }
  };

  const ensureConversation = async () => {
    if (conversationId) return conversationId;
    try {
      const res = await createConversation({ title: null });
      setConversations(prev => [res.data, ...prev]);
      setCurrentConv(res.data);
      navigate(`/chat/${res.data.id}`, { replace: true });
      return res.data.id;
    } catch (e) {
      toast.error("Failed to create conversation");
      return null;
    }
  };

  // --- Voice Recording ---
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      // Audio level analyzer
      const audioCtx = new AudioContext();
      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      analyserRef.current = analyser;

      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      const updateLevel = () => {
        analyser.getByteFrequencyData(dataArray);
        const avg = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
        setAudioLevel(avg / 128);
        animFrameRef.current = requestAnimationFrame(updateLevel);
      };
      updateLevel();

      const mediaRecorder = new MediaRecorder(stream, { mimeType: "audio/webm" });
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (e) {
      console.error("Mic access failed:", e);
      toast.error("Microphone access denied. Please allow microphone access.");
    }
  };

  const stopRecording = async () => {
    if (!mediaRecorderRef.current || mediaRecorderRef.current.state === "inactive") return;

    return new Promise((resolve) => {
      mediaRecorderRef.current.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        // Stop tracks
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(t => t.stop());
          streamRef.current = null;
        }
        if (animFrameRef.current) {
          cancelAnimationFrame(animFrameRef.current);
        }
        setIsRecording(false);
        setAudioLevel(0);
        resolve(blob);
      };
      mediaRecorderRef.current.stop();
    });
  };

  const handleVoiceRecord = async () => {
    if (isRecording) {
      // Stop and send
      const audioBlob = await stopRecording();
      if (!audioBlob || audioBlob.size < 1000) {
        toast.error("Recording too short. Please try again.");
        return;
      }
      await handleSendVoice(audioBlob);
    } else {
      await startRecording();
    }
  };

  const handleSendVoice = async (audioBlob) => {
    const convId = await ensureConversation();
    if (!convId) return;

    setProcessingVoice(true);
    setSending(true);

    // Optimistic: show "processing" state
    const tempId = `temp-voice-${Date.now()}`;
    setMessages(prev => [...prev, {
      id: tempId,
      role: "user",
      content: "Listening...",
      tools_used: [],
      created_at: new Date().toISOString()
    }]);

    try {
      const res = await sendVoiceMessage(convId, audioBlob, currentConv?.scenario);
      const { user_message, ai_message, ai_audio_base64 } = res.data;

      setMessages(prev => {
        const filtered = prev.filter(m => m.id !== tempId);
        return [...filtered, user_message, ai_message];
      });

      loadConversations();

      // Auto-play AI response audio
      if (ai_audio_base64) {
        try {
          await playAudioBase64(ai_audio_base64);
        } catch (e) {
          console.error("Audio playback failed:", e);
        }
      }
    } catch (e) {
      console.error("Voice message failed:", e);
      const errMsg = e.response?.data?.detail || "Voice message failed. Try again.";
      toast.error(errMsg);
      setMessages(prev => prev.filter(m => m.id !== tempId));
    } finally {
      setProcessingVoice(false);
      setSending(false);
    }
  };

  // --- Text Send ---
  const handleSendText = async () => {
    if (!input.trim() || sending) return;

    const convId = await ensureConversation();
    if (!convId) return;

    const userText = input.trim();
    setInput("");
    setSending(true);

    const tempUserMsg = {
      id: `temp-${Date.now()}`,
      role: "user",
      content: userText,
      tools_used: [],
      created_at: new Date().toISOString()
    };
    setMessages(prev => [...prev, tempUserMsg]);

    try {
      const res = await sendMessage(convId, {
        content: userText,
        scenario_context: currentConv?.scenario
      });
      setMessages(prev => {
        const filtered = prev.filter(m => m.id !== tempUserMsg.id);
        return [...filtered, ...res.data];
      });
      loadConversations();

      // Auto-play TTS for AI response
      const aiMsg = res.data.find(m => m.role === "assistant");
      if (aiMsg) {
        try {
          const ttsRes = await textToSpeech(aiMsg.content);
          if (ttsRes.data.audio_base64) {
            await playAudioBase64(ttsRes.data.audio_base64);
          }
        } catch (e) {
          console.error("TTS failed", e);
        }
      }
    } catch (e) {
      toast.error("Failed to send message.");
      setMessages(prev => prev.filter(m => m.id !== tempUserMsg.id));
      setInput(userText);
    } finally {
      setSending(false);
      inputRef.current?.focus();
    }
  };

  const handlePlayMessage = async (text) => {
    try {
      const res = await textToSpeech(text);
      if (res.data.audio_base64) {
        await playAudioBase64(res.data.audio_base64);
      }
    } catch (e) {
      toast.error("Could not play audio");
    }
  };

  const handleDeleteConv = async (convId, e) => {
    e.stopPropagation();
    try {
      await deleteConversation(convId);
      setConversations(prev => prev.filter(c => c.id !== convId));
      if (conversationId === convId) {
        setCurrentConv(null);
        setMessages([]);
        navigate("/chat");
      }
      toast.success("Conversation deleted");
    } catch (e) {
      toast.error("Failed to delete");
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendText();
    }
  };

  return (
    <div className="h-screen flex bg-white" data-testid="chat-page">
      {/* Sidebar */}
      <aside
        className={`
          fixed inset-y-0 left-0 z-40 w-72 bg-[#F0F4F8] border-r border-gray-200 flex flex-col
          transition-transform duration-300
          lg:relative lg:translate-x-0
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
        `}
        data-testid="chat-sidebar"
      >
        <div className="p-4 flex items-center justify-between">
          <button onClick={() => navigate("/")} className="flex items-center gap-2" data-testid="sidebar-logo">
            <div className="w-7 h-7 rounded-lg bg-[#2F5233] flex items-center justify-center">
              <span className="text-white text-xs font-bold" style={{ fontFamily: 'Playfair Display, serif' }}>L</span>
            </div>
            <span className="font-semibold text-sm" style={{ fontFamily: 'Playfair Display, serif' }}>LinguaFlow</span>
          </button>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden p-1" data-testid="close-sidebar-btn">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="px-3 pb-3">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                className="w-full bg-[#2F5233] hover:bg-[#1E3524] text-white rounded-full text-sm"
                data-testid="new-chat-btn"
              >
                <Plus className="w-4 h-4 mr-2" /> New Chat
                <ChevronDown className="w-3 h-3 ml-auto" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-64" data-testid="new-chat-dropdown">
              <DropdownMenuItem onClick={() => handleNewConversation()} data-testid="new-freeform-chat">
                <MessageCircle className="w-4 h-4 mr-2" /> Free Conversation
              </DropdownMenuItem>
              <Separator className="my-1" />
              {scenarios.map((s) => {
                const Icon = ICON_MAP[s.icon] || MessageCircle;
                return (
                  <DropdownMenuItem
                    key={s.id}
                    onClick={() => handleNewConversation(s.id)}
                    data-testid={`scenario-${s.id}`}
                  >
                    <Icon className="w-4 h-4 mr-2" /> {s.title}
                  </DropdownMenuItem>
                );
              })}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <ScrollArea className="flex-1 px-3">
          <div className="space-y-1">
            {conversations.map((conv) => (
              <div
                key={conv.id}
                className={`group flex items-center gap-2 px-3 py-2.5 rounded-lg cursor-pointer transition-colors duration-150 ${
                  conv.id === conversationId ? "bg-white shadow-sm" : "hover:bg-white/60"
                }`}
                onClick={() => { navigate(`/chat/${conv.id}`); setSidebarOpen(false); }}
                data-testid={`conv-item-${conv.id}`}
              >
                <MessageCircle className="w-4 h-4 text-gray-400 flex-shrink-0" />
                <span className="text-sm text-gray-700 truncate flex-1">{conv.title}</span>
                <button
                  onClick={(e) => handleDeleteConv(conv.id, e)}
                  className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-50 rounded transition-opacity duration-150"
                  data-testid={`delete-conv-${conv.id}`}
                >
                  <Trash2 className="w-3.5 h-3.5 text-red-400" />
                </button>
              </div>
            ))}
          </div>
        </ScrollArea>

        <div className="p-3 border-t border-gray-200 space-y-1">
          <button
            onClick={() => navigate("/dashboard")}
            className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-600 hover:text-[#2F5233] hover:bg-white/60 rounded-lg transition-colors duration-150"
            data-testid="sidebar-dashboard-link"
          >
            <BarChart3 className="w-4 h-4" /> Dashboard
          </button>
          <button
            onClick={() => navigate("/vocabulary")}
            className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-600 hover:text-[#2F5233] hover:bg-white/60 rounded-lg transition-colors duration-150"
            data-testid="sidebar-vocabulary-link"
          >
            <BookOpen className="w-4 h-4" /> Vocabulary
          </button>
        </div>
      </aside>

      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/20 z-30 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Main Chat Area */}
      <main className="flex-1 flex flex-col min-w-0" data-testid="chat-main">
        {/* Chat Header */}
        <div className="glass-header px-4 py-3 flex items-center gap-3 z-20">
          <button className="lg:hidden p-1" onClick={() => setSidebarOpen(true)} data-testid="open-sidebar-btn">
            <Menu className="w-5 h-5 text-gray-600" />
          </button>
          <button onClick={() => navigate("/")} className="p-1 hover:bg-gray-100 rounded-lg transition-colors duration-150" data-testid="back-home-btn">
            <ArrowLeft className="w-4 h-4 text-gray-500" />
          </button>
          <div className="flex-1 min-w-0">
            <h2 className="text-sm font-semibold text-[#1A1A1A] truncate" style={{ fontFamily: 'Playfair Display, serif' }}>
              {currentConv?.title || "New Conversation"}
            </h2>
            {currentConv?.scenario && (
              <Badge variant="outline" className="text-[10px] mt-0.5 border-[#2F5233]/20 text-[#2F5233]">
                {currentConv.scenario.replace("_", " ")}
              </Badge>
            )}
          </div>
          {/* Input mode toggle */}
          <div className="flex items-center bg-gray-100 rounded-full p-0.5" data-testid="input-mode-toggle">
            <button
              onClick={() => setInputMode("voice")}
              className={`p-2 rounded-full transition-colors duration-150 ${inputMode === "voice" ? "bg-[#2F5233] text-white" : "text-gray-500 hover:text-gray-700"}`}
              data-testid="mode-voice-btn"
              title="Voice mode"
            >
              <Mic className="w-4 h-4" />
            </button>
            <button
              onClick={() => setInputMode("text")}
              className={`p-2 rounded-full transition-colors duration-150 ${inputMode === "text" ? "bg-[#2F5233] text-white" : "text-gray-500 hover:text-gray-700"}`}
              data-testid="mode-text-btn"
              title="Text mode"
            >
              <Keyboard className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto">
          {messages.length === 0 && !loading ? (
            <div className="flex flex-col items-center justify-center h-full px-6 animate-fade-in" data-testid="empty-chat-state">
              <div className="w-20 h-20 rounded-full bg-[#2F5233]/10 flex items-center justify-center mb-6">
                {inputMode === "voice" ? (
                  <Mic className="w-10 h-10 text-[#2F5233]" />
                ) : (
                  <Sparkles className="w-10 h-10 text-[#2F5233]" />
                )}
              </div>
              <h3 className="text-xl font-semibold text-[#1A1A1A] mb-2" style={{ fontFamily: 'Playfair Display, serif' }}>
                {inputMode === "voice" ? "Tap the mic to start talking" : "Start practicing"}
              </h3>
              <p className="text-sm text-[#71717A] text-center max-w-md mb-8">
                {inputMode === "voice"
                  ? "Speak naturally in English. I'll listen, respond with voice, and help you improve your pronunciation, grammar, and vocabulary."
                  : "Type anything in English and I'll help you improve. Try asking me to check your grammar, practice a scenario, or explain a word."
                }
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
                      onClick={() => { setInput(prompt); inputRef.current?.focus(); }}
                      className="text-xs text-left px-4 py-2.5 rounded-full border border-gray-200 hover:border-[#2F5233]/30 hover:bg-[#2F5233]/5 text-gray-600 transition-colors duration-200"
                      data-testid={`quick-prompt-${prompt.slice(0, 20).replace(/\s/g, '-')}`}
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="max-w-3xl mx-auto py-4">
              {messages.map((msg, idx) => (
                <ChatBubble key={msg.id} message={msg} index={idx} onPlayAudio={handlePlayMessage} />
              ))}
              {sending && <TypingIndicator />}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="glass-input px-4 py-4" data-testid="chat-input-area">
          <div className="max-w-3xl mx-auto">
            {inputMode === "voice" ? (
              /* Voice Input Mode */
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
                    onClick={handleVoiceRecord}
                    disabled={processingVoice && !isRecording}
                    className={`relative w-16 h-16 rounded-full flex items-center justify-center shadow-lg transition-transform duration-200 hover:-translate-y-0.5 ${
                      isRecording
                        ? "bg-red-500 hover:bg-red-600 animate-pulse"
                        : "bg-[#2F5233] hover:bg-[#1E3524]"
                    } ${processingVoice && !isRecording ? "opacity-50 cursor-not-allowed" : ""}`}
                    data-testid="voice-record-btn"
                  >
                    {isRecording ? (
                      <Square className="w-6 h-6 text-white" fill="white" />
                    ) : (
                      <Mic className="w-7 h-7 text-white" />
                    )}
                    {isRecording && (
                      <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-red-400 animate-ping" />
                    )}
                  </button>
                </div>

                <p className="text-xs text-[#71717A]">
                  {isRecording ? "Tap to stop & send" : "Tap to start speaking"}
                </p>
              </div>
            ) : (
              /* Text Input Mode */
              <div className="flex items-end gap-3">
                <div className="flex-1 relative">
                  <textarea
                    ref={inputRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Type your message..."
                    rows={1}
                    className="w-full resize-none bg-gray-50 border-transparent focus:border-[#2F5233] focus:ring-0 rounded-xl px-4 py-3 text-sm text-[#1A1A1A] placeholder:text-gray-400 outline-none transition-colors duration-200"
                    style={{ minHeight: '44px', maxHeight: '120px' }}
                    data-testid="chat-input"
                  />
                </div>
                <Button
                  onClick={handleSendText}
                  disabled={!input.trim() || sending}
                  className="bg-[#2F5233] hover:bg-[#1E3524] text-white rounded-xl h-11 w-11 p-0 flex items-center justify-center shadow-md transition-transform duration-200 hover:-translate-y-0.5 disabled:opacity-50"
                  data-testid="send-message-btn"
                >
                  {sending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                </Button>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
