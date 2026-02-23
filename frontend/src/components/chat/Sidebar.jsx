import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
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
  nativeLang, targetLang, sidebarOpen,
  onSetNativeLang, onSetTargetLang, onNewConversation,
  onDeleteConv, onClearAll, onCloseSidebar,
}) => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <>
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-72 bg-[#F0F4F8] border-r border-gray-200 flex flex-col transition-transform duration-300 lg:relative lg:translate-x-0 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}
        data-testid="chat-sidebar"
      >
        {/* Logo */}
        <div className="p-4 flex items-center justify-between">
          <button onClick={() => navigate("/")} className="flex items-center gap-2" data-testid="sidebar-logo">
            <WaveformLogo size={28} className="text-[#2F5233]" />
            <span className="font-medium text-sm text-gray-800" style={{ fontFamily: 'Sora, sans-serif' }}>mumble</span>
          </button>
          <button onClick={onCloseSidebar} className="lg:hidden p-1" data-testid="close-sidebar-btn">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Language Pickers + New Chat */}
        <div className="px-3 pb-2">
          <div className="space-y-1.5 mb-2">
            <LanguagePicker
              label="I speak" labelClass="text-[#71717A]"
              btnClass="bg-white/60 hover:bg-white border border-gray-200 text-gray-700"
              value={nativeLang} languages={languages} onSelect={onSetNativeLang} testIdPrefix="native"
            />
            <LanguagePicker
              label="Learn" labelClass="text-[#2F5233]"
              btnClass="bg-[#2F5233]/5 hover:bg-[#2F5233]/10 border border-[#2F5233]/20 text-[#2F5233]"
              value={targetLang} languages={languages} onSelect={onSetTargetLang} testIdPrefix="target"
            />
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button className="w-full bg-[#2F5233] hover:bg-[#1E3524] text-white rounded-full text-sm" data-testid="new-chat-btn">
                <Plus className="w-4 h-4 mr-2" /> New Chat <ChevronDown className="w-3 h-3 ml-auto" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-64" data-testid="new-chat-dropdown">
              <DropdownMenuItem onClick={() => onNewConversation()} data-testid="new-freeform-chat">
                <MessageCircle className="w-4 h-4 mr-2" /> Free Conversation
              </DropdownMenuItem>
              <Separator className="my-1" />
              {scenarios.map((s) => {
                const Icon = ICON_MAP[s.icon] || MessageCircle;
                return (
                  <DropdownMenuItem key={s.id} onClick={() => onNewConversation(s.id)} data-testid={`scenario-${s.id}`}>
                    <Icon className="w-4 h-4 mr-2" /> {s.title}
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
              <span className="text-[10px] uppercase tracking-wider text-[#71717A]">Conversations</span>
              <button onClick={onClearAll} className="text-[10px] text-red-400 hover:text-red-500 transition-colors duration-150" data-testid="clear-all-chats-btn">
                Clear all
              </button>
            </div>
          )}
          <div className="space-y-1">
            {conversations.map((conv) => (
              <div
                key={conv.id}
                className={`group flex items-center gap-2 px-3 py-2.5 rounded-lg cursor-pointer transition-colors duration-150 ${conv.id === conversationId ? "bg-white shadow-sm" : "hover:bg-white/60"}`}
                onClick={() => { navigate(`/chat/${conv.id}`); onCloseSidebar(); }}
                data-testid={`conv-item-${conv.id}`}
              >
                <MessageCircle className="w-4 h-4 text-gray-400 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <span className="text-sm text-gray-700 truncate block">{conv.title}</span>
                  {conv.native_language !== conv.target_language && (
                    <span className="text-[10px] text-[#2F5233]/70">
                      {[...languages.popular, ...languages.others].find(l => l.code === conv.native_language)?.name || conv.native_language}
                      {" -> "}
                      {[...languages.popular, ...languages.others].find(l => l.code === conv.target_language)?.name || conv.target_language}
                    </span>
                  )}
                </div>
                <button onClick={(e) => onDeleteConv(conv.id, e)} className="p-1.5 hover:bg-red-50 rounded-lg text-gray-300 hover:text-red-400 transition-colors duration-150 flex-shrink-0" data-testid={`delete-conv-${conv.id}`}>
                  <Trash2 className="w-3.5 h-3.5 text-red-400" />
                </button>
              </div>
            ))}
          </div>
        </ScrollArea>

        {/* Footer Nav */}
        <div className="p-3 border-t border-gray-200 space-y-1">
          <button onClick={() => navigate("/dashboard")} className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-600 hover:text-[#2F5233] hover:bg-white/60 rounded-lg transition-colors duration-150" data-testid="sidebar-dashboard-link">
            <BarChart3 className="w-4 h-4" /> Dashboard
          </button>
          <button onClick={() => navigate("/vocabulary")} className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-600 hover:text-[#2F5233] hover:bg-white/60 rounded-lg transition-colors duration-150" data-testid="sidebar-vocabulary-link">
            <BookOpen className="w-4 h-4" /> Vocabulary
          </button>
          <Separator className="my-1" />
          <div className="flex items-center justify-between px-3 py-1.5">
            <span className="text-xs text-gray-500 truncate max-w-[140px]" data-testid="sidebar-user-email">{user?.email}</span>
            <button onClick={handleLogout} className="flex items-center gap-1 text-xs text-gray-400 hover:text-red-500 transition-colors duration-150" data-testid="sidebar-logout-btn">
              <LogOut className="w-3.5 h-3.5" /> Logout
            </button>
          </div>
        </div>
      </aside>

      {/* Overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/20 z-30 lg:hidden" onClick={onCloseSidebar} />
      )}
    </>
  );
};
