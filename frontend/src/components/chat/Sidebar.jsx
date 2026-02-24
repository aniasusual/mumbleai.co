import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  MessageCircle, Plus, Trash2, BookOpen, BarChart3, ChevronDown, X, LogOut,
  Briefcase, Plane, UtensilsCrossed, Phone, Users, ShoppingBag, Stethoscope
} from "lucide-react";
import { LanguagePicker } from "./LanguagePicker";
import { WaveformLogo } from "@/components/WaveformLogo";

const ICON_MAP = { Briefcase, Plane, UtensilsCrossed, MessageCircle, Phone, Users, ShoppingBag, Stethoscope };

export const Sidebar = ({
  conversations, conversationId, scenarios, languages,
  nativeLang, targetLang, sidebarOpen, userEmail, onLogout,
  onSetNativeLang, onSetTargetLang, onNewConversation,
  onDeleteConv, onClearAll, onCloseSidebar,
}) => {
  const navigate = useNavigate();

  const handleLogout = () => {
    onLogout();
    navigate("/");
  };

  return (
    <>
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-72 flex flex-col transition-transform duration-300 lg:relative lg:translate-x-0 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}
        style={{
          background: "linear-gradient(180deg, #0c1222 0%, #0f172a 100%)",
          borderRight: "1px solid rgba(255,255,255,0.06)",
        }}
        data-testid="chat-sidebar"
      >
        {/* Logo */}
        <div className="p-4 flex items-center justify-between">
          <button onClick={() => navigate("/")} className="flex items-center gap-2 group" data-testid="sidebar-logo">
            <WaveformLogo size={28} className="text-indigo-400 transition-transform duration-300 group-hover:scale-110" />
            <span className="font-semibold text-sm text-white tracking-tight" style={{ fontFamily: 'Sora, sans-serif' }}>mumble</span>
          </button>
          <button onClick={onCloseSidebar} className="lg:hidden p-1.5 rounded-lg hover:bg-white/5 transition-colors" data-testid="close-sidebar-btn">
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        {/* Language Pickers + New Chat */}
        <div className="px-3 pb-3">
          <div className="space-y-1.5 mb-3">
            <LanguagePicker
              label="I speak" labelClass="text-slate-500"
              btnClass="bg-white/5 hover:bg-white/8 border border-white/8 text-slate-300"
              value={nativeLang} languages={languages} onSelect={onSetNativeLang} testIdPrefix="native"
            />
            <LanguagePicker
              label="Learn" labelClass="text-indigo-400"
              btnClass="bg-indigo-500/10 hover:bg-indigo-500/15 border border-indigo-500/20 text-indigo-300"
              value={targetLang} languages={languages} onSelect={onSetTargetLang} testIdPrefix="target"
            />
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                className="w-full rounded-xl text-sm font-medium text-white border-0 h-10"
                style={{ background: "linear-gradient(135deg, #4338ca, #6366f1)" }}
                data-testid="new-chat-btn"
              >
                <Plus className="w-4 h-4 mr-2" /> New Chat <ChevronDown className="w-3 h-3 ml-auto opacity-60" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="start" className="w-64 border-white/10 bg-[#1e293b] text-slate-200"
              data-testid="new-chat-dropdown"
            >
              <DropdownMenuItem onClick={() => onNewConversation()} className="hover:bg-white/5 focus:bg-white/5 text-slate-200" data-testid="new-freeform-chat">
                <MessageCircle className="w-4 h-4 mr-2 text-indigo-400" /> Free Conversation
              </DropdownMenuItem>
              <div className="h-px bg-white/8 my-1" />
              {scenarios.map((s) => {
                const Icon = ICON_MAP[s.icon] || MessageCircle;
                return (
                  <DropdownMenuItem key={s.id} onClick={() => onNewConversation(s.id)} className="hover:bg-white/5 focus:bg-white/5 text-slate-200" data-testid={`scenario-${s.id}`}>
                    <Icon className="w-4 h-4 mr-2 text-slate-400" /> {s.title}
                  </DropdownMenuItem>
                );
              })}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Conversation List */}
        <ScrollArea className="flex-1 px-3">
          {conversations.length > 0 && (
            <div className="flex items-center justify-between px-1 mb-2 pt-1">
              <span className="text-[10px] uppercase tracking-wider text-slate-500">Conversations</span>
              <button onClick={onClearAll} className="text-[10px] text-red-400/70 hover:text-red-400 transition-colors duration-150" data-testid="clear-all-chats-btn">
                Clear all
              </button>
            </div>
          )}
          <div className="space-y-0.5">
            <AnimatePresence>
              {conversations.map((conv) => (
                <motion.div
                  key={conv.id}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -12 }}
                  className={`group flex items-center gap-2 px-3 py-2.5 rounded-xl cursor-pointer transition-all duration-200 ${
                    conv.id === conversationId
                      ? "bg-indigo-500/15 border border-indigo-500/20"
                      : "hover:bg-white/5 border border-transparent"
                  }`}
                  onClick={() => { navigate(`/chat/${conv.id}`); onCloseSidebar(); }}
                  data-testid={`conv-item-${conv.id}`}
                >
                  <MessageCircle className={`w-4 h-4 flex-shrink-0 ${conv.id === conversationId ? "text-indigo-400" : "text-slate-500"}`} />
                  <div className="flex-1 min-w-0">
                    <span className={`text-sm truncate block ${conv.id === conversationId ? "text-white font-medium" : "text-slate-300"}`}>
                      {conv.title}
                    </span>
                    {conv.native_language !== conv.target_language && (
                      <span className="text-[10px] text-slate-500">
                        {[...languages.popular, ...languages.others].find(l => l.code === conv.native_language)?.name || conv.native_language}
                        {" -> "}
                        {[...languages.popular, ...languages.others].find(l => l.code === conv.target_language)?.name || conv.target_language}
                      </span>
                    )}
                  </div>
                  <button
                    onClick={(e) => onDeleteConv(conv.id, e)}
                    className="p-1.5 rounded-lg text-slate-600 hover:text-red-400 hover:bg-red-500/10 transition-all duration-150 opacity-0 group-hover:opacity-100 flex-shrink-0"
                    data-testid={`delete-conv-${conv.id}`}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </ScrollArea>

        {/* Footer Nav */}
        <div className="p-3 space-y-0.5" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
          <button onClick={() => navigate("/dashboard")} className="flex items-center gap-2 w-full px-3 py-2 text-sm text-slate-400 hover:text-indigo-300 hover:bg-white/5 rounded-lg transition-all duration-200" data-testid="sidebar-dashboard-link">
            <BarChart3 className="w-4 h-4" /> Dashboard
          </button>
          <button onClick={() => navigate("/vocabulary")} className="flex items-center gap-2 w-full px-3 py-2 text-sm text-slate-400 hover:text-indigo-300 hover:bg-white/5 rounded-lg transition-all duration-200" data-testid="sidebar-vocabulary-link">
            <BookOpen className="w-4 h-4" /> Vocabulary
          </button>
          <div className="h-px bg-white/6 my-1.5" />
          <div className="flex items-center justify-between px-3 py-1.5">
            <span className="text-xs text-slate-500 truncate max-w-[140px]" data-testid="sidebar-user-email">{userEmail}</span>
            <button onClick={handleLogout} className="flex items-center gap-1 text-xs text-slate-500 hover:text-red-400 transition-colors duration-200" data-testid="sidebar-logout-btn">
              <LogOut className="w-3.5 h-3.5" /> Logout
            </button>
          </div>
        </div>
      </aside>

      {/* Overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-30 lg:hidden"
            onClick={onCloseSidebar}
          />
        )}
      </AnimatePresence>
    </>
  );
};
