/**
 * ChatPage — orchestrator component.
 * Manages state and delegates rendering to focused child components.
 */
import { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";

import { Sidebar } from "@/components/chat/Sidebar";
import { ChatHeader } from "@/components/chat/ChatHeader";
import { MessageList } from "@/components/chat/MessageList";
import { ChatInput } from "@/components/chat/ChatInput";
import { useVoiceRecorder } from "@/hooks/useVoiceRecorder";
import { playAudioBase64 } from "@/lib/audio";
import {
  createConversation, listConversations, getMessages, sendMessage,
  sendMessageStream, sendVoiceMessage, deleteConversation, clearAllConversations,
  getScenarios, getLanguages, textToSpeech, getCurriculum
} from "@/lib/api";

export default function ChatPage() {
  const navigate = useNavigate();
  const { conversationId } = useParams();

  // Core state
  const [conversations, setConversations] = useState([]);
  const [currentConv, setCurrentConv] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [processingVoice, setProcessingVoice] = useState(false);
  const [inputMode, setInputMode] = useState("voice");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [curriculum, setCurriculum] = useState(null);
  const [toolEvents, setToolEvents] = useState([]);

  // Reference data
  const [scenarios, setScenarios] = useState([]);
  const [languages, setLanguages] = useState({ popular: [], others: [] });
  const [nativeLang, setNativeLang] = useState("en");
  const [targetLang, setTargetLang] = useState("en");

  const inputRef = useRef(null);
  const pendingTtsRef = useRef(false);
  const { isRecording, audioLevel, startRecording, stopRecording } = useVoiceRecorder();

  // --- Data Loading ---
  useEffect(() => {
    listConversations().then(r => setConversations(r.data)).catch(console.error);
    getScenarios().then(r => setScenarios(r.data)).catch(console.error);
    getLanguages().then(r => setLanguages(r.data)).catch(console.error);
  }, []);

  useEffect(() => {
    if (!conversationId) return;
    loadMessages(conversationId);
    const conv = conversations.find(c => c.id === conversationId);
    if (conv) {
      setCurrentConv(conv);
      if (conv.native_language) setNativeLang(conv.native_language);
      if (conv.target_language) setTargetLang(conv.target_language);
      if (conv.phase === "learning") {
        getCurriculum(conv.id).then(r => setCurriculum(r.data)).catch(() => setCurriculum(null));
      } else {
        setCurriculum(null);
      }
    }
  }, [conversationId, conversations]);

  const loadMessages = async (convId) => {
    setLoading(true);
    try {
      const res = await getMessages(convId);
      setMessages(res.data);
      if (pendingTtsRef.current && res.data.length === 1 && res.data[0].role === "assistant") {
        pendingTtsRef.current = false;
        try {
          const ttsRes = await textToSpeech(res.data[0].content);
          if (ttsRes.data.audio_base64) await playAudioBase64(ttsRes.data.audio_base64);
        } catch (e) { console.error("Welcome TTS failed", e); }
      }
    } catch (e) { console.error("Failed to load messages", e); }
    finally { setLoading(false); }
  };

  const refreshConversations = async () => {
    try {
      const res = await listConversations();
      setConversations(res.data);
      if (conversationId) {
        const updated = res.data.find(c => c.id === conversationId);
        if (updated) setCurrentConv(updated);
      }
    } catch (e) { console.error("Failed to refresh", e); }
  };

  // --- Conversation Management ---
  const ensureConversation = async () => {
    if (conversationId) return conversationId;
    try {
      const res = await createConversation({ title: null, native_language: nativeLang, target_language: targetLang });
      setConversations(prev => [res.data, ...prev]);
      setCurrentConv(res.data);
      pendingTtsRef.current = true;
      navigate(`/chat/${res.data.id}`, { replace: true });
      return res.data.id;
    } catch (e) { toast.error("Failed to create conversation"); return null; }
  };

  const handleNewConversation = async (scenario = null) => {
    try {
      const res = await createConversation({ title: scenario ? `${scenario} Practice` : null, scenario, native_language: nativeLang, target_language: targetLang });
      setConversations(prev => [res.data, ...prev]);
      setCurrentConv(res.data);
      setMessages([]);
      pendingTtsRef.current = true;
      navigate(`/chat/${res.data.id}`);
      setSidebarOpen(false);
    } catch (e) { toast.error("Failed to create conversation"); }
  };

  const handleDeleteConv = async (convId, e) => {
    e.stopPropagation();
    try {
      await deleteConversation(convId);
      setConversations(prev => prev.filter(c => c.id !== convId));
      if (conversationId === convId) { setCurrentConv(null); setMessages([]); navigate("/chat"); }
      toast.success("Conversation deleted");
    } catch (e) { toast.error("Failed to delete"); }
  };

  const handleClearAll = async () => {
    if (!window.confirm("Delete all conversations? This cannot be undone.")) return;
    try {
      await clearAllConversations();
      setConversations([]); setCurrentConv(null); setMessages([]); navigate("/chat");
      toast.success("All conversations deleted");
    } catch (e) { toast.error("Failed to clear conversations"); }
  };

  // --- Message Sending ---
  const handleSendText = async () => {
    if (!input.trim() || sending) return;
    const convId = await ensureConversation();
    if (!convId) return;

    const userText = input.trim();
    setInput(""); setSending(true);
    const tempId = `temp-${Date.now()}`;
    setMessages(prev => [...prev, { id: tempId, role: "user", content: userText, tools_used: [], created_at: new Date().toISOString() }]);

    try {
      const res = await sendMessage(convId, { content: userText, scenario_context: currentConv?.scenario });
      setMessages(prev => [...prev.filter(m => m.id !== tempId), ...res.data]);
      refreshConversations();
      const aiMsg = res.data.find(m => m.role === "assistant");
      if (aiMsg) {
        try {
          const ttsRes = await textToSpeech(aiMsg.content);
          if (ttsRes.data.audio_base64) await playAudioBase64(ttsRes.data.audio_base64);
        } catch (e) { console.error("TTS failed", e); }
      }
    } catch (e) {
      toast.error("Failed to send message.");
      setMessages(prev => prev.filter(m => m.id !== tempId));
      setInput(userText);
    } finally { setSending(false); inputRef.current?.focus(); }
  };

  const handleSendVoice = async (audioBlob) => {
    const convId = await ensureConversation();
    if (!convId) return;
    setProcessingVoice(true); setSending(true);
    const tempId = `temp-voice-${Date.now()}`;
    setMessages(prev => [...prev, { id: tempId, role: "user", content: "Listening...", tools_used: [], created_at: new Date().toISOString() }]);

    try {
      const res = await sendVoiceMessage(convId, audioBlob, currentConv?.scenario);
      const { user_message, ai_message, ai_audio_base64 } = res.data;
      setMessages(prev => [...prev.filter(m => m.id !== tempId), user_message, ai_message]);
      refreshConversations();
      if (ai_audio_base64) { try { await playAudioBase64(ai_audio_base64); } catch (e) { console.error("Audio playback failed:", e); } }
    } catch (e) {
      toast.error(e.response?.data?.detail || "Voice message failed. Try again.");
      setMessages(prev => prev.filter(m => m.id !== tempId));
    } finally { setProcessingVoice(false); setSending(false); }
  };

  const handleVoiceRecord = async () => {
    if (isRecording) {
      const audioBlob = await stopRecording();
      if (!audioBlob || audioBlob.size < 1000) { toast.error("Recording too short."); return; }
      await handleSendVoice(audioBlob);
    } else {
      try { await startRecording(); } catch (e) { toast.error("Microphone access denied."); }
    }
  };

  const handlePlayMessage = async (text) => {
    try {
      const res = await textToSpeech(text);
      if (res.data.audio_base64) await playAudioBase64(res.data.audio_base64);
    } catch (e) { toast.error("Could not play audio"); }
  };

  // --- Render ---
  return (
    <div className="h-screen flex bg-white" data-testid="chat-page">
      <Sidebar
        conversations={conversations} conversationId={conversationId}
        scenarios={scenarios} languages={languages}
        nativeLang={nativeLang} targetLang={targetLang} sidebarOpen={sidebarOpen}
        onSetNativeLang={setNativeLang} onSetTargetLang={setTargetLang}
        onNewConversation={handleNewConversation} onDeleteConv={handleDeleteConv}
        onClearAll={handleClearAll} onCloseSidebar={() => setSidebarOpen(false)}
      />

      <main className="flex-1 flex flex-col min-w-0" data-testid="chat-main">
        <ChatHeader
          currentConv={currentConv} curriculum={curriculum} languages={languages}
          inputMode={inputMode} onSetInputMode={setInputMode}
          onOpenSidebar={() => setSidebarOpen(true)}
        />

        <MessageList
          messages={messages} loading={loading} sending={sending}
          inputMode={inputMode} onPlayAudio={handlePlayMessage}
          onSetInput={setInput} inputRef={inputRef}
        />

        <ChatInput
          inputMode={inputMode} input={input} sending={sending}
          isRecording={isRecording} audioLevel={audioLevel} processingVoice={processingVoice}
          onSetInput={setInput} onSendText={handleSendText}
          onVoiceRecord={handleVoiceRecord} inputRef={inputRef}
        />
      </main>
    </div>
  );
}
