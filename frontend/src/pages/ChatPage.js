/**
 * ChatPage — orchestrator component.
 * Manages state and delegates rendering to focused child components.
 */
import { useState, useEffect, useRef, useCallback } from "react";
import { flushSync } from "react-dom";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";

import { Sidebar } from "@/components/chat/Sidebar";
import { ChatHeader } from "@/components/chat/ChatHeader";
import { MessageList } from "@/components/chat/MessageList";
import { ChatInput } from "@/components/chat/ChatInput";
import { WelcomeScreen } from "@/components/chat/WelcomeScreen";
import { useVoiceRecorder } from "@/hooks/useVoiceRecorder";
import { useAuth } from "@/hooks/useAuth";
import { playAudioBase64, playAudioWithKaraoke } from "@/lib/audio";
import {
  createConversation, listConversations, getMessages, sendMessage,
  sendMessageStream, sendVoiceMessageStream, deleteConversation, clearAllConversations,
  getScenarios, getLanguages, textToSpeech, getCurriculum
} from "@/lib/api";

export default function ChatPage() {
  const navigate = useNavigate();
  const { conversationId } = useParams();
  const { user, logout } = useAuth();

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
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);
  const [creatingChat, setCreatingChat] = useState(false);
  const [curriculum, setCurriculum] = useState(null);
  const [toolEvents, setToolEvents] = useState([]);
  const [streamingText, setStreamingText] = useState("");
  const [speakingState, setSpeakingState] = useState(null); // { messageId, wordIndex }

  // Reference data
  const [scenarios, setScenarios] = useState([]);
  const [languages, setLanguages] = useState({ popular: [], others: [] });
  const [nativeLang, setNativeLang] = useState("en");
  const [targetLang, setTargetLang] = useState("en");
  const [sttLanguage, setSttLanguage] = useState("en");

  const inputRef = useRef(null);
  const pendingTtsRef = useRef(false);
  const audioControllerRef = useRef(null);
  const creatingConvRef = useRef(null);
  const skipNextLoadRef = useRef(false);
  const { isRecording, audioLevel, startRecording, stopRecording } = useVoiceRecorder();

  // --- Data Loading ---
  useEffect(() => {
    listConversations().then(r => setConversations(r.data)).catch(console.error);
    getScenarios().then(r => setScenarios(r.data)).catch(console.error);
    getLanguages().then(r => setLanguages(r.data)).catch(console.error);
  }, []);

  useEffect(() => {
    if (!conversationId) return;
    // Skip if we just created this conversation via ensureConversation during a send
    if (skipNextLoadRef.current) {
      skipNextLoadRef.current = false;
      // Still update currentConv metadata
      const conv = conversations.find(c => c.id === conversationId);
      if (conv) {
        setCurrentConv(conv);
        if (conv.native_language) setNativeLang(conv.native_language);
        if (conv.target_language) setTargetLang(conv.target_language);
        if (conv.expected_response_language) setSttLanguage(conv.expected_response_language);
      }
      return;
    }
    loadMessages(conversationId);
    const conv = conversations.find(c => c.id === conversationId);
    if (conv) {
      setCurrentConv(conv);
      if (conv.native_language) setNativeLang(conv.native_language);
      if (conv.target_language) setTargetLang(conv.target_language);
      if (conv.expected_response_language) setSttLanguage(conv.expected_response_language);
      else if (conv.native_language) setSttLanguage(conv.native_language);
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
      const isWelcome = pendingTtsRef.current && res.data.length === 1 && res.data[0].role === "assistant";
      if (isWelcome) {
        pendingTtsRef.current = false;
        const welcomeMsg = res.data[0];
        // Keep loading visible while fetching TTS — don't reveal text yet
        try {
          const ttsRes = await textToSpeech(welcomeMsg.content);
          if (ttsRes.data.audio_base64) {
            // Wait for audio to be decoded before showing message — they appear together
            playWithKaraoke(ttsRes.data.audio_base64, welcomeMsg.id, welcomeMsg.content, () => {
              setMessages(res.data);
              setLoading(false);
            });
          } else {
            setMessages(res.data);
            setLoading(false);
          }
        } catch (e) {
          console.error("Welcome TTS failed", e);
          setMessages(res.data);
          setLoading(false);
        }
      } else {
        setMessages(res.data);
        setLoading(false);
      }
    } catch (e) {
      console.error("Failed to load messages", e);
      setLoading(false);
    }
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

    // Prevent duplicate creation — if already creating, wait for that result
    if (creatingConvRef.current) return creatingConvRef.current;

    creatingConvRef.current = (async () => {
      try {
        const res = await createConversation({ title: null, native_language: nativeLang, target_language: targetLang });
        setConversations(prev => [res.data, ...prev]);
        setCurrentConv(res.data);
        // Skip the loadMessages triggered by the navigate — we're sending a message right after
        skipNextLoadRef.current = true;
        navigate(`/chat/${res.data.id}`, { replace: true });
        return res.data.id;
      } catch (e) {
        const msg = e.response?.data?.detail || "Failed to create conversation";
        const isCredits = e.response?.status === 402;
        toast.error(msg, isCredits ? { action: { label: "Upgrade", onClick: () => navigate("/pricing") } } : {});
        return null;
      } finally {
        creatingConvRef.current = null;
      }
    })();

    return creatingConvRef.current;
  };

  const handleNewConversation = async (scenario = null) => {
    if (creatingChat) return;
    setCreatingChat(true);
    // Immediately leave the current chat and show the loader
    setMessages([]);
    setLoading(true);
    setCurrentConv(null);
    setSidebarOpen(false);
    navigate("/chat", { replace: true });
    try {
      const res = await createConversation({ title: scenario ? `${scenario} Practice` : null, scenario, native_language: nativeLang, target_language: targetLang });
      setConversations(prev => [res.data, ...prev]);
      setCurrentConv(res.data);
      pendingTtsRef.current = true;
      navigate(`/chat/${res.data.id}`, { replace: true });
    } catch (e) {
      setLoading(false);
      const msg = e.response?.data?.detail || "Failed to create conversation";
      const isCredits = e.response?.status === 402;
      toast.error(msg, isCredits ? { action: { label: "Upgrade", onClick: () => navigate("/pricing") } } : {});
    }
    finally { setCreatingChat(false); }
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
    setInput(""); setSending(true); setToolEvents([]); setStreamingText("");
    const tempId = `temp-${Date.now()}`;
    setMessages(prev => [...prev, { id: tempId, role: "user", content: userText, tools_used: [], created_at: new Date().toISOString() }]);

    try {
      const result = await sendMessageStream(
        convId,
        { content: userText, scenario_context: currentConv?.scenario },
        (event) => {
          if (event.type === "text_delta") {
            // Always suppress streaming text — reveal synced with audio via onReady
          } else {
            flushSync(() => {
              setToolEvents(prev => [...prev, event]);
            });
          }
        }
      );
      // When audio is present: delay showing the AI message until audio is decoded and ready to play
      // This ensures text and audio appear simultaneously — no flash of text before audio
      if (result.ai_audio_base64 && result.ai_message) {
        // Audio present: hold everything until audio is actually playing
        setStreamingText("");
        setToolEvents([]);
        if (result.expected_response_language) setSttLanguage(result.expected_response_language);
        playWithKaraoke(result.ai_audio_base64, result.ai_message.id, result.ai_message.content, () => {
          setMessages(prev => [...prev.filter(m => m.id !== tempId), result.user_message, result.ai_message]);
          setSending(false);
          skipNextLoadRef.current = true;
          refreshConversations();
        });
      } else {
        // No audio — show text immediately (all state in one batch, no rAF)
        setStreamingText("");
        setToolEvents([]);
        setMessages(prev => [...prev.filter(m => m.id !== tempId), result.user_message, result.ai_message]);
        if (result.expected_response_language) setSttLanguage(result.expected_response_language);
        setSending(false);
        skipNextLoadRef.current = true;
        refreshConversations();
      }
    } catch (e) {
      const isCreditsError = e?.response?.status === 402 || e?.message?.includes("402") || e?.message?.toLowerCase()?.includes("insufficient credits");
      if (isCreditsError) {
        toast.error("You've run out of credits. Upgrade your plan to continue.", { action: { label: "Upgrade", onClick: () => navigate("/pricing") } });
      } else {
        toast.error("Failed to send message.");
      }
      setMessages(prev => prev.filter(m => m.id !== tempId));
      setInput(userText);
      setToolEvents([]); setStreamingText("");
      setSending(false);
    } finally { inputRef.current?.focus(); }
  };

  const handleSendVoice = async (audioBlob) => {
    const convId = await ensureConversation();
    if (!convId) return;
    setProcessingVoice(true); setSending(true); setToolEvents([]); setStreamingText("");
    const tempId = `temp-voice-${Date.now()}`;
    setMessages(prev => [...prev, { id: tempId, role: "user", content: "Listening...", tools_used: [], created_at: new Date().toISOString() }]);

    try {
      const result = await sendVoiceMessageStream(
        convId,
        audioBlob,
        currentConv?.scenario,
        (event) => {
          if (event.type === "transcription") {
            // Update the temp message with the transcribed text
            setMessages(prev => prev.map(m =>
              m.id === tempId ? { ...m, content: event.text } : m
            ));
          } else if (event.type === "text_delta") {
            // Voice mode: suppress streaming text — reveal synced with audio
          } else {
            // Tool events — force immediate render
            flushSync(() => {
              setToolEvents(prev => [...prev, event]);
            });
          }
        },
        sttLanguage
      );
      if (result.ai_audio_base64 && result.ai_message) {
        setStreamingText("");
        setToolEvents([]);
        if (result.expected_response_language) setSttLanguage(result.expected_response_language);
        playWithKaraoke(result.ai_audio_base64, result.ai_message.id, result.ai_message.content, () => {
          setMessages(prev => [...prev.filter(m => m.id !== tempId), result.user_message, result.ai_message]);
          setSending(false);
          setProcessingVoice(false);
          skipNextLoadRef.current = true;
          refreshConversations();
        });
      } else {
        setStreamingText("");
        setToolEvents([]);
        setMessages(prev => [...prev.filter(m => m.id !== tempId), result.user_message, result.ai_message]);
        if (result.expected_response_language) setSttLanguage(result.expected_response_language);
        setSending(false);
        setProcessingVoice(false);
        skipNextLoadRef.current = true;
        refreshConversations();
      }
    } catch (e) {
      const isCreditsError = e?.status === 402 || e?.response?.status === 402 || e?.message?.includes("402") || e?.message?.toLowerCase()?.includes("insufficient credits");
      if (isCreditsError) {
        toast.error("You've run out of credits. Upgrade your plan to continue.", { action: { label: "Upgrade", onClick: () => navigate("/pricing") } });
      } else {
        toast.error(e.message || "Voice message failed. Try again.");
      }
      setMessages(prev => prev.filter(m => m.id !== tempId));
      setToolEvents([]); setStreamingText("");
      setSending(false);
      setProcessingVoice(false);
    }
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

  // --- Audio Playback with Karaoke ---
  const stopAudio = useCallback(() => {
    if (audioControllerRef.current) {
      audioControllerRef.current.stop();
      audioControllerRef.current = null;
    }
    setSpeakingState(null);
  }, []);

  const playWithKaraoke = useCallback((audioBase64, messageId, text, onReady) => {
    // Stop any currently playing audio
    stopAudio();

    const words = text.split(/\s+/).filter(w => w.length > 0);
    setSpeakingState({ messageId, wordIndex: 0 });

    const controller = playAudioWithKaraoke(
      audioBase64,
      words,
      (wordIndex) => setSpeakingState(prev => prev ? { ...prev, wordIndex } : null),
      () => { setSpeakingState(null); audioControllerRef.current = null; },
      onReady
    );
    audioControllerRef.current = controller;
  }, [stopAudio]);

  const handlePlayMessage = async (messageId, text) => {
    // If already speaking this message, stop
    if (speakingState?.messageId === messageId) {
      stopAudio();
      return;
    }
    try {
      const res = await textToSpeech(text);
      if (res.data.audio_base64) {
        playWithKaraoke(res.data.audio_base64, messageId, text);
      }
    } catch (e) { toast.error("Could not play audio"); }
  };

  // --- Render ---
  return (
    <div className="h-screen flex" style={{ background: "#f8f7f4" }} data-testid="chat-page">
      <Sidebar
        conversations={conversations} conversationId={conversationId}
        scenarios={scenarios} languages={languages}
        nativeLang={nativeLang} targetLang={targetLang}
        sidebarOpen={sidebarOpen} collapsed={sidebarCollapsed}
        userEmail={user?.email} onLogout={logout}
        onSetNativeLang={setNativeLang} onSetTargetLang={setTargetLang}
        onNewConversation={handleNewConversation} onDeleteConv={handleDeleteConv}
        onClearAll={handleClearAll} onCloseSidebar={() => setSidebarOpen(false)}
        onToggleCollapse={() => setSidebarCollapsed(c => !c)}
        creatingChat={creatingChat}
      />

      <main className="flex-1 flex flex-col min-w-0" data-testid="chat-main">
        {!conversationId ? (
          <WelcomeScreen
            userName={user?.name}
            scenarios={scenarios}
            languages={languages}
            nativeLang={nativeLang}
            targetLang={targetLang}
            onSetNativeLang={setNativeLang}
            onSetTargetLang={setTargetLang}
            onNewConversation={handleNewConversation}
            onOpenSidebar={() => setSidebarOpen(true)}
            creatingChat={creatingChat}
          />
        ) : (
          <>
            <ChatHeader
              currentConv={currentConv} curriculum={curriculum} languages={languages}
              inputMode={inputMode} onSetInputMode={setInputMode}
              onOpenSidebar={() => setSidebarOpen(true)}
            />

            <MessageList
              messages={messages} loading={loading} sending={sending}
              toolEvents={toolEvents} streamingText={streamingText}
              speakingState={speakingState} onStopAudio={stopAudio}
              inputMode={inputMode} onPlayAudio={handlePlayMessage}
              onSetInput={setInput} inputRef={inputRef}
            />

            <ChatInput
              inputMode={inputMode} input={input} sending={sending}
              isRecording={isRecording} audioLevel={audioLevel} processingVoice={processingVoice}
              onSetInput={setInput} onSendText={handleSendText}
              onVoiceRecord={handleVoiceRecord} inputRef={inputRef}
              sttLanguage={sttLanguage} onSetSttLanguage={setSttLanguage}
              nativeLang={nativeLang} targetLang={targetLang} languages={languages}
            />
          </>
        )}
      </main>
    </div>
  );
}
