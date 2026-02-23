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
  X
} from "lucide-react";
import {
  createConversation,
  listConversations,
  getMessages,
  sendMessage,
  deleteConversation,
  getScenarios
} from "@/lib/api";

const ICON_MAP = {
  Briefcase, Plane, UtensilsCrossed, MessageCircle, Phone, Users, ShoppingBag, Stethoscope
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

const ChatBubble = ({ message, index }) => {
  const isUser = message.role === "user";
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
        {message.tools_used && message.tools_used.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-2 pt-2 border-t border-gray-100/50">
            {message.tools_used.map((tool) => (
              <span key={tool} className="tool-badge">{tool.replace("_", " ")}</span>
            ))}
          </div>
        )}
      </div>
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
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

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

  const handleSend = async () => {
    if (!input.trim() || sending) return;

    let convId = conversationId;
    if (!convId) {
      try {
        const res = await createConversation({ title: null });
        setConversations(prev => [res.data, ...prev]);
        setCurrentConv(res.data);
        convId = res.data.id;
        navigate(`/chat/${convId}`, { replace: true });
      } catch (e) {
        toast.error("Failed to create conversation");
        return;
      }
    }

    const userText = input.trim();
    setInput("");
    setSending(true);

    // Optimistic user message
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
      // Replace optimistic message and add AI response
      setMessages(prev => {
        const filtered = prev.filter(m => m.id !== tempUserMsg.id);
        return [...filtered, ...res.data];
      });
      loadConversations();
    } catch (e) {
      toast.error("Failed to send message. Please try again.");
      setMessages(prev => prev.filter(m => m.id !== tempUserMsg.id));
      setInput(userText);
    } finally {
      setSending(false);
      inputRef.current?.focus();
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
      handleSend();
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
        {/* Sidebar Header */}
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

        {/* New Conversation */}
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

        {/* Conversation List */}
        <ScrollArea className="flex-1 px-3">
          <div className="space-y-1">
            {conversations.map((conv) => (
              <div
                key={conv.id}
                className={`group flex items-center gap-2 px-3 py-2.5 rounded-lg cursor-pointer transition-colors duration-150 ${
                  conv.id === conversationId
                    ? "bg-white shadow-sm"
                    : "hover:bg-white/60"
                }`}
                onClick={() => {
                  navigate(`/chat/${conv.id}`);
                  setSidebarOpen(false);
                }}
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

        {/* Sidebar Footer Nav */}
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

      {/* Overlay for mobile sidebar */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/20 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Chat Area */}
      <main className="flex-1 flex flex-col min-w-0" data-testid="chat-main">
        {/* Chat Header */}
        <div className="glass-header px-4 py-3 flex items-center gap-3 z-20">
          <button
            className="lg:hidden p-1"
            onClick={() => setSidebarOpen(true)}
            data-testid="open-sidebar-btn"
          >
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
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto">
          {messages.length === 0 && !loading ? (
            <div className="flex flex-col items-center justify-center h-full px-6 animate-fade-in" data-testid="empty-chat-state">
              <div className="w-16 h-16 rounded-2xl bg-[#2F5233]/10 flex items-center justify-center mb-6">
                <Sparkles className="w-8 h-8 text-[#2F5233]" />
              </div>
              <h3 className="text-xl font-semibold text-[#1A1A1A] mb-2" style={{ fontFamily: 'Playfair Display, serif' }}>
                Start practicing
              </h3>
              <p className="text-sm text-[#71717A] text-center max-w-md mb-8">
                Type anything in English and I'll help you improve. Try asking me to check your grammar, practice a scenario, or explain a word.
              </p>
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
            </div>
          ) : (
            <div className="max-w-3xl mx-auto py-4">
              {messages.map((msg, idx) => (
                <ChatBubble key={msg.id} message={msg} index={idx} />
              ))}
              {sending && <TypingIndicator />}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="glass-input px-4 py-3" data-testid="chat-input-area">
          <div className="max-w-3xl mx-auto">
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
                onClick={handleSend}
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
            <p className="text-[10px] text-[#71717A] mt-1.5 text-center">
              Press Enter to send, Shift+Enter for new line
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
