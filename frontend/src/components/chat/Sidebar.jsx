import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip, TooltipContent, TooltipProvider, TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  MessageCircle, Plus, Trash2, BookOpen, BarChart3, ChevronDown, X, LogOut,
  Briefcase, Plane, UtensilsCrossed, Phone, Users, ShoppingBag, Stethoscope,
  PanelLeftClose, PanelLeftOpen
} from "lucide-react";
import { LanguagePicker } from "./LanguagePicker";
import { WaveformLogo } from "@/components/WaveformLogo";

const ICON_MAP = { Briefcase, Plane, UtensilsCrossed, MessageCircle, Phone, Users, ShoppingBag, Stethoscope };

/* ─── Decorative mesh blobs ─── */
const SidebarMesh = ({ compact }) => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none rounded-r-2xl">
    <motion.div
      className="absolute rounded-full"
      style={{
        width: compact ? 120 : 200, height: compact ? 120 : 200,
        top: "8%", right: compact ? "-30%" : "-15%",
        background: "radial-gradient(circle, rgba(129,140,248,0.25) 0%, transparent 70%)",
      }}
      animate={{ y: [0, 12, 0], x: [0, 5, 0] }}
      transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
    />
    <motion.div
      className="absolute rounded-full"
      style={{
        width: compact ? 100 : 180, height: compact ? 100 : 180,
        bottom: "15%", left: compact ? "-20%" : "5%",
        background: "radial-gradient(circle, rgba(236,72,153,0.12) 0%, transparent 70%)",
      }}
      animate={{ y: [0, -10, 0], x: [0, -6, 0] }}
      transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
    />
    <motion.div
      className="absolute rounded-full"
      style={{
        width: compact ? 80 : 140, height: compact ? 80 : 140,
        top: "50%", left: compact ? "10%" : "40%",
        background: "radial-gradient(circle, rgba(16,185,129,0.1) 0%, transparent 70%)",
      }}
      animate={{ y: [0, 8, 0], x: [0, 4, 0] }}
      transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
    />
  </div>
);

/* ─── Animated icon wrapper ─── */
const AnimIcon = ({ children, testId, onClick, active, className = "" }) => (
  <motion.button
    onClick={onClick}
    className={`p-2 rounded-xl transition-colors duration-200 ${active ? "bg-white/70 shadow-sm text-indigo-600" : "text-slate-400 hover:text-indigo-600 hover:bg-white/40"} ${className}`}
    whileHover={{ scale: 1.1 }}
    whileTap={{ scale: 0.9 }}
    data-testid={testId}
  >
    {children}
  </motion.button>
);

/* ─── Collapsed Icon Rail (desktop only) ─── */
const CollapsedRail = ({
  conversations, conversationId, scenarios, onNewConversation,
  onToggle, onLogout, navigate,
}) => (
  <TooltipProvider delayDuration={200}>
    <motion.aside
      className="hidden lg:flex flex-col items-center w-14 flex-shrink-0 py-3 gap-1 relative rounded-r-2xl"
      style={{
        background: "linear-gradient(165deg, #f0f0ff 0%, #e8ecff 40%, #e0d8f8 100%)",
        borderRight: "none",
        boxShadow: "2px 0 16px rgba(99,102,241,0.06)",
      }}
      initial={{ x: -56, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ type: "spring", stiffness: 300, damping: 28 }}
      data-testid="chat-sidebar-collapsed"
    >
      <SidebarMesh compact />

      {/* Logo */}
      <Tooltip>
        <TooltipTrigger asChild>
          <div>
            <AnimIcon testId="sidebar-logo-collapsed" onClick={() => navigate("/")}>
              <WaveformLogo size={22} className="text-indigo-600" />
            </AnimIcon>
          </div>
        </TooltipTrigger>
        <TooltipContent side="right">mumble</TooltipContent>
      </Tooltip>

      {/* Expand */}
      <Tooltip>
        <TooltipTrigger asChild>
          <div>
            <AnimIcon testId="expand-sidebar-btn" onClick={onToggle}>
              <PanelLeftOpen className="w-4 h-4" />
            </AnimIcon>
          </div>
        </TooltipTrigger>
        <TooltipContent side="right">Expand sidebar</TooltipContent>
      </Tooltip>

      {/* New Chat */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <motion.button
            className="p-2 my-1 rounded-xl text-white relative z-10"
            style={{ background: "linear-gradient(135deg, #4338ca, #6366f1)", boxShadow: "0 2px 10px rgba(99,102,241,0.35)" }}
            whileHover={{ scale: 1.12, boxShadow: "0 4px 18px rgba(99,102,241,0.45)" }}
            whileTap={{ scale: 0.9 }}
            data-testid="new-chat-btn-collapsed"
            title="New chat"
          >
            <Plus className="w-4 h-4" />
          </motion.button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" side="right" className="w-56 bg-white border-indigo-100 shadow-lg rounded-xl" data-testid="new-chat-dropdown-collapsed">
          <DropdownMenuItem onClick={() => onNewConversation()} className="text-slate-700 focus:bg-indigo-50 focus:text-indigo-700 rounded-lg" data-testid="new-freeform-chat-collapsed">
            <MessageCircle className="w-4 h-4 mr-2 text-indigo-500" /> Free Conversation
          </DropdownMenuItem>
          <div className="h-px bg-indigo-50 my-1" />
          {scenarios.map((s) => {
            const Icon = ICON_MAP[s.icon] || MessageCircle;
            return (
              <DropdownMenuItem key={s.id} onClick={() => onNewConversation(s.id)} className="text-slate-700 focus:bg-indigo-50 focus:text-indigo-700 rounded-lg">
                <Icon className="w-4 h-4 mr-2 text-slate-400" /> {s.title}
              </DropdownMenuItem>
            );
          })}
        </DropdownMenuContent>
      </DropdownMenu>

      <div className="h-px w-6 bg-indigo-200/40 my-1 relative z-10" />

      {/* Conversations */}
      <ScrollArea className="flex-1 w-full px-1.5 relative z-10">
        <div className="flex flex-col items-center gap-0.5">
          {conversations.map((conv, i) => (
            <Tooltip key={conv.id}>
              <TooltipTrigger asChild>
                <div>
                  <motion.button
                    onClick={() => navigate(`/chat/${conv.id}`)}
                    className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors duration-200 ${
                      conv.id === conversationId
                        ? "bg-white/70 shadow-sm text-indigo-500"
                        : "text-indigo-300 hover:bg-white/40 hover:text-indigo-500"
                    }`}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.03, type: "spring", stiffness: 400, damping: 20 }}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    data-testid={`conv-icon-${conv.id}`}
                  >
                    <MessageCircle className="w-4 h-4" />
                  </motion.button>
                </div>
              </TooltipTrigger>
              <TooltipContent side="right"><span className="max-w-[160px] truncate block">{conv.title}</span></TooltipContent>
            </Tooltip>
          ))}
        </div>
      </ScrollArea>

      {/* Footer */}
      <div className="flex flex-col items-center gap-0.5 pt-1 relative z-10" style={{ borderTop: "1px solid rgba(99,102,241,0.08)" }}>
        <Tooltip>
          <TooltipTrigger asChild>
            <div>
              <AnimIcon testId="sidebar-dashboard-collapsed" onClick={() => navigate("/dashboard")}>
                <BarChart3 className="w-4 h-4" />
              </AnimIcon>
            </div>
          </TooltipTrigger>
          <TooltipContent side="right">Dashboard</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <div>
              <AnimIcon testId="sidebar-vocabulary-collapsed" onClick={() => navigate("/vocabulary")}>
                <BookOpen className="w-4 h-4" />
              </AnimIcon>
            </div>
          </TooltipTrigger>
          <TooltipContent side="right">Vocabulary</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <div>
              <AnimIcon testId="sidebar-logout-collapsed" onClick={onLogout} className="hover:text-red-500 hover:bg-red-50">
                <LogOut className="w-4 h-4" />
              </AnimIcon>
            </div>
          </TooltipTrigger>
          <TooltipContent side="right">Logout</TooltipContent>
        </Tooltip>
      </div>
    </motion.aside>
  </TooltipProvider>
);

/* ─── Expanded Full Sidebar ─── */
const ExpandedSidebar = ({
  conversations, conversationId, scenarios, languages,
  nativeLang, targetLang, userEmail,
  onSetNativeLang, onSetTargetLang, onNewConversation,
  onDeleteConv, onClearAll, onToggle, onLogout, onCloseMobile, isMobile, navigate,
}) => (
  <aside
    className={`${isMobile ? "fixed inset-y-0 left-0 z-40" : "relative"} w-72 flex flex-col flex-shrink-0 ${!isMobile ? "rounded-r-2xl" : ""}`}
    style={{
      background: "linear-gradient(165deg, #f0f0ff 0%, #e8ecff 40%, #e0d8f8 100%)",
      borderRight: "none",
      boxShadow: isMobile ? "4px 0 24px rgba(0,0,0,0.08)" : "2px 0 16px rgba(99,102,241,0.06)",
    }}
    data-testid="chat-sidebar"
  >
    <SidebarMesh />

    {/* Header */}
    <div className="p-4 flex items-center justify-between relative z-10">
      <motion.button
        onClick={() => navigate("/")}
        className="flex items-center gap-2 group"
        whileHover={{ scale: 1.03 }}
        whileTap={{ scale: 0.97 }}
        data-testid="sidebar-logo"
      >
        <WaveformLogo size={28} className="text-indigo-600 transition-transform duration-300 group-hover:scale-110" />
        <span className="font-semibold text-sm text-slate-800 tracking-tight" style={{ fontFamily: 'Sora, sans-serif' }}>mumble</span>
      </motion.button>
      <div className="flex items-center gap-1">
        {!isMobile && (
          <motion.button
            onClick={onToggle}
            className="p-1.5 rounded-xl hover:bg-white/50 transition-colors text-slate-400 hover:text-indigo-600"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            data-testid="collapse-sidebar-btn"
          >
            <PanelLeftClose className="w-4 h-4" />
          </motion.button>
        )}
        {isMobile && (
          <button onClick={onCloseMobile} className="p-1.5 rounded-xl hover:bg-white/50 transition-colors" data-testid="close-sidebar-btn">
            <X className="w-5 h-5 text-slate-500" />
          </button>
        )}
      </div>
    </div>

    {/* Language Pickers + New Chat */}
    <div className="px-3 pb-3 relative z-10">
      <div className="space-y-1.5 mb-3">
        <LanguagePicker
          label="I speak" labelClass="text-slate-500"
          btnClass="bg-white/60 hover:bg-white/80 border border-indigo-100/60 text-slate-700 rounded-xl"
          value={nativeLang} languages={languages} onSelect={onSetNativeLang} testIdPrefix="native"
        />
        <LanguagePicker
          label="Learn" labelClass="text-indigo-600"
          btnClass="bg-indigo-50/60 hover:bg-indigo-50/80 border border-indigo-200/60 text-indigo-700 rounded-xl"
          value={targetLang} languages={languages} onSelect={onSetTargetLang} testIdPrefix="target"
        />
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}>
            <Button
              className="w-full rounded-full text-sm font-semibold text-white border-0 h-10 shadow-[0_2px_12px_rgba(99,102,241,0.3)] hover:shadow-[0_4px_20px_rgba(99,102,241,0.4)] transition-shadow"
              style={{ background: "linear-gradient(135deg, #4338ca, #6366f1)" }}
              data-testid="new-chat-btn"
            >
              <Plus className="w-4 h-4 mr-2" /> New Chat <ChevronDown className="w-3 h-3 ml-auto opacity-60" />
            </Button>
          </motion.div>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-64 bg-white border-indigo-100 shadow-lg rounded-xl" data-testid="new-chat-dropdown">
          <DropdownMenuItem onClick={() => onNewConversation()} className="text-slate-700 focus:bg-indigo-50 focus:text-indigo-700 rounded-lg" data-testid="new-freeform-chat">
            <MessageCircle className="w-4 h-4 mr-2 text-indigo-500" /> Free Conversation
          </DropdownMenuItem>
          <div className="h-px bg-indigo-50 my-1" />
          {scenarios.map((s) => {
            const Icon = ICON_MAP[s.icon] || MessageCircle;
            return (
              <DropdownMenuItem key={s.id} onClick={() => onNewConversation(s.id)} className="text-slate-700 focus:bg-indigo-50 focus:text-indigo-700 rounded-lg" data-testid={`scenario-${s.id}`}>
                <Icon className="w-4 h-4 mr-2 text-slate-400" /> {s.title}
              </DropdownMenuItem>
            );
          })}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>

    {/* Conversation List */}
    <ScrollArea className="flex-1 px-3 relative z-10">
      {conversations.length > 0 && (
        <div className="flex items-center justify-between px-1 mb-2 pt-1">
          <span className="text-[10px] uppercase tracking-wider text-indigo-400 font-medium">Conversations</span>
          <button onClick={onClearAll} className="text-[10px] text-red-400 hover:text-red-500 transition-colors duration-150" data-testid="clear-all-chats-btn">
            Clear all
          </button>
        </div>
      )}
      <div className="space-y-0.5">
        <AnimatePresence>
          {conversations.map((conv, i) => (
            <motion.div
              key={conv.id}
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -16 }}
              transition={{ delay: i * 0.03, type: "spring", stiffness: 400, damping: 25 }}
              className={`group flex items-center gap-2 px-3 py-2.5 rounded-xl cursor-pointer transition-all duration-200 ${
                conv.id === conversationId
                  ? "bg-white/70 shadow-sm border border-indigo-100/50"
                  : "hover:bg-white/40 border border-transparent"
              }`}
              onClick={() => { navigate(`/chat/${conv.id}`); if (isMobile) onCloseMobile(); }}
              whileHover={{ x: 3 }}
              data-testid={`conv-item-${conv.id}`}
            >
              <MessageCircle className={`w-4 h-4 flex-shrink-0 ${conv.id === conversationId ? "text-indigo-500" : "text-indigo-300"}`} />
              <div className="flex-1 min-w-0">
                <span className={`text-sm truncate block ${conv.id === conversationId ? "text-slate-800 font-medium" : "text-slate-600"}`}>
                  {conv.title}
                </span>
                {conv.native_language !== conv.target_language && (
                  <span className="text-[10px] text-indigo-400">
                    {[...languages.popular, ...languages.others].find(l => l.code === conv.native_language)?.name || conv.native_language}
                    {" -> "}
                    {[...languages.popular, ...languages.others].find(l => l.code === conv.target_language)?.name || conv.target_language}
                  </span>
                )}
              </div>
              <button
                onClick={(e) => onDeleteConv(conv.id, e)}
                className="p-1.5 rounded-lg text-slate-300 hover:text-red-400 hover:bg-red-50 transition-all duration-150 opacity-0 group-hover:opacity-100 flex-shrink-0"
                data-testid={`delete-conv-${conv.id}`}
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ScrollArea>

    {/* Footer */}
    <div className="p-3 space-y-0.5 relative z-10" style={{ borderTop: "1px solid rgba(99,102,241,0.08)" }}>
      <motion.button
        onClick={() => navigate("/dashboard")}
        className="flex items-center gap-2 w-full px-3 py-2 text-sm text-slate-500 hover:text-indigo-600 hover:bg-white/40 rounded-xl transition-all duration-200"
        whileHover={{ x: 3 }}
        data-testid="sidebar-dashboard-link"
      >
        <BarChart3 className="w-4 h-4" /> Dashboard
      </motion.button>
      <motion.button
        onClick={() => navigate("/vocabulary")}
        className="flex items-center gap-2 w-full px-3 py-2 text-sm text-slate-500 hover:text-indigo-600 hover:bg-white/40 rounded-xl transition-all duration-200"
        whileHover={{ x: 3 }}
        data-testid="sidebar-vocabulary-link"
      >
        <BookOpen className="w-4 h-4" /> Vocabulary
      </motion.button>
      <div className="h-px bg-indigo-100/50 my-1.5" />
      <div className="flex items-center justify-between px-3 py-1.5">
        <span className="text-xs text-slate-400 truncate max-w-[140px]" data-testid="sidebar-user-email">{userEmail}</span>
        <button onClick={onLogout} className="flex items-center gap-1 text-xs text-slate-400 hover:text-red-500 transition-colors duration-200" data-testid="sidebar-logout-btn">
          <LogOut className="w-3.5 h-3.5" /> Logout
        </button>
      </div>
    </div>
  </aside>
);

/* ─── Main Sidebar Controller ─── */
export const Sidebar = ({
  conversations, conversationId, scenarios, languages,
  nativeLang, targetLang, sidebarOpen, collapsed, userEmail, onLogout,
  onSetNativeLang, onSetTargetLang, onNewConversation,
  onDeleteConv, onClearAll, onCloseSidebar, onToggleCollapse,
}) => {
  const navigate = useNavigate();

  const handleLogout = () => {
    onLogout();
    navigate("/");
  };

  return (
    <>
      {/* Desktop: collapsed icon rail OR expanded sidebar */}
      <AnimatePresence mode="wait">
        {collapsed ? (
          <CollapsedRail
            key="collapsed"
            conversations={conversations} conversationId={conversationId}
            scenarios={scenarios} onNewConversation={onNewConversation}
            onToggle={onToggleCollapse} onLogout={handleLogout} navigate={navigate}
          />
        ) : (
          <motion.div
            key="expanded"
            className="hidden lg:flex"
            initial={{ width: 56, opacity: 0.8 }}
            animate={{ width: 288, opacity: 1 }}
            exit={{ width: 56, opacity: 0.8 }}
            transition={{ type: "spring", stiffness: 300, damping: 28 }}
          >
            <ExpandedSidebar
              conversations={conversations} conversationId={conversationId}
              scenarios={scenarios} languages={languages}
              nativeLang={nativeLang} targetLang={targetLang} userEmail={userEmail}
              onSetNativeLang={onSetNativeLang} onSetTargetLang={onSetTargetLang}
              onNewConversation={onNewConversation} onDeleteConv={onDeleteConv}
              onClearAll={onClearAll} onToggle={onToggleCollapse}
              onLogout={handleLogout} isMobile={false} navigate={navigate}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mobile: overlay sidebar */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/20 backdrop-blur-sm z-30 lg:hidden"
              onClick={onCloseSidebar}
            />
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="fixed inset-y-0 left-0 z-40 lg:hidden"
            >
              <ExpandedSidebar
                conversations={conversations} conversationId={conversationId}
                scenarios={scenarios} languages={languages}
                nativeLang={nativeLang} targetLang={targetLang} userEmail={userEmail}
                onSetNativeLang={onSetNativeLang} onSetTargetLang={onSetTargetLang}
                onNewConversation={onNewConversation} onDeleteConv={onDeleteConv}
                onClearAll={onClearAll} onCloseMobile={onCloseSidebar}
                onLogout={handleLogout} isMobile={true} navigate={navigate}
              />
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};
