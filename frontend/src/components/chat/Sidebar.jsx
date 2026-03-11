import { useState, useEffect } from "react";
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
  PanelLeftClose, PanelLeftOpen, Loader2, CreditCard, Coins, History
} from "lucide-react";
import { LanguagePicker } from "./LanguagePicker";
import { WaveformLogo } from "@/components/WaveformLogo";
import { getSubscription } from "@/lib/api";

const ICON_MAP = { Briefcase, Plane, UtensilsCrossed, MessageCircle, Phone, Users, ShoppingBag, Stethoscope };

/* ─── Decorative mesh blobs ─── */
const SidebarMesh = () => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none">
    <motion.div className="absolute rounded-full"
      style={{ width: 200, height: 200, top: "8%", right: "-15%", background: "radial-gradient(circle, rgba(129,140,248,0.25) 0%, transparent 70%)" }}
      animate={{ y: [0, 12, 0], x: [0, 5, 0] }}
      transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }} />
    <motion.div className="absolute rounded-full"
      style={{ width: 180, height: 180, bottom: "15%", left: "5%", background: "radial-gradient(circle, rgba(236,72,153,0.12) 0%, transparent 70%)" }}
      animate={{ y: [0, -10, 0], x: [0, -6, 0] }}
      transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }} />
    <motion.div className="absolute rounded-full"
      style={{ width: 140, height: 140, top: "50%", left: "40%", background: "radial-gradient(circle, rgba(16,185,129,0.1) 0%, transparent 70%)" }}
      animate={{ y: [0, 8, 0], x: [0, 4, 0] }}
      transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }} />
  </div>
);

const CreditBadge = ({ collapsed }) => {
  const [sub, setSub] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    getSubscription().then(r => setSub(r.data)).catch(() => {});
    const iv = setInterval(() => {
      getSubscription().then(r => setSub(r.data)).catch(() => {});
    }, 30000);
    return () => clearInterval(iv);
  }, []);

  if (!sub) return null;

  const pct = sub.plan === "free" ? sub.credits / 100 : sub.plan === "plus" ? sub.credits / 1000 : sub.credits / 5000;
  const isLow = pct <= 0.1;
  const barColor = isLow ? "#ef4444" : pct <= 0.3 ? "#f59e0b" : "#6366f1";

  if (collapsed) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <div>
            <motion.button onClick={() => navigate("/pricing")} className="p-2 rounded-xl hover:bg-white/40 transition-colors relative"
              whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} data-testid="sidebar-credits-collapsed">
              <Coins className="w-4 h-4" style={{ color: barColor }} />
              {isLow && <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-red-500" />}
            </motion.button>
          </div>
        </TooltipTrigger>
        <TooltipContent side="right">{sub.credits} credits</TooltipContent>
      </Tooltip>
    );
  }

  return (
    <button onClick={() => navigate("/pricing")} className="w-full px-3 py-2 rounded-xl hover:bg-white/40 transition-all text-left group" data-testid="sidebar-credits-badge">
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-1.5">
          <Coins className="w-3.5 h-3.5" style={{ color: barColor }} />
          <span className="text-xs font-medium text-slate-600">{sub.credits} credits</span>
        </div>
        <span className="text-[10px] uppercase tracking-wider font-semibold px-1.5 py-0.5 rounded-full"
          style={{
            background: sub.plan === "free" ? "rgba(99,102,241,0.1)" : sub.plan === "plus" ? "rgba(190,24,93,0.1)" : "rgba(124,58,237,0.1)",
            color: sub.plan === "free" ? "#6366f1" : sub.plan === "plus" ? "#be185d" : "#7c3aed",
          }}>
          {sub.plan}
        </span>
      </div>
      <div className="w-full h-1 rounded-full bg-slate-200/60 overflow-hidden">
        <motion.div className="h-full rounded-full" style={{ background: barColor }}
          initial={{ width: 0 }} animate={{ width: `${Math.max(2, Math.min(100, pct * 100))}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }} />
      </div>
      {isLow && <p className="text-[10px] text-red-500 mt-1">Low credits — upgrade for more</p>}
    </button>
  );
};

/* ─── Single Desktop Sidebar (animated width) ─── */
const DesktopSidebar = ({
  collapsed, conversations, conversationId, scenarios, languages,
  nativeLang, targetLang, userEmail, creatingChat,
  onSetNativeLang, onSetTargetLang, onNewConversation,
  onDeleteConv, onClearAll, onToggle, onLogout, navigate,
}) => {
  const [hovered, setHovered] = useState(false);
  const isExpanded = !collapsed || hovered;

  return (
  <TooltipProvider delayDuration={200}>
    <motion.aside
      className="hidden lg:flex flex-col flex-shrink-0 relative overflow-hidden"
      style={{
        background: "linear-gradient(165deg, #f0f0ff 0%, #e8ecff 40%, #e0d8f8 100%)",
        boxShadow: "2px 0 16px rgba(99,102,241,0.06)",
      }}
      animate={{ width: isExpanded ? 288 : 56 }}
      transition={{ type: "spring", stiffness: 280, damping: 26, mass: 0.8 }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      data-testid={isExpanded ? "chat-sidebar" : "chat-sidebar-collapsed"}
    >
      <SidebarMesh />

      {/* ─ COLLAPSED CONTENT ─ */}
      <motion.div
        className="absolute inset-0 flex flex-col items-center py-3 gap-1 z-10"
        animate={{ opacity: isExpanded ? 0 : 1, pointerEvents: isExpanded ? "none" : "auto" }}
        transition={{ duration: 0.2, delay: isExpanded ? 0 : 0.15 }}
      >
        {/* Logo */}
        <Tooltip>
          <TooltipTrigger asChild>
            <div>
              <motion.button onClick={() => navigate("/")} className="p-2 mb-1 rounded-xl hover:bg-white/40 transition-colors text-indigo-600"
                whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} data-testid="sidebar-logo-collapsed">
                <WaveformLogo size={22} className="text-indigo-600" />
              </motion.button>
            </div>
          </TooltipTrigger>
          <TooltipContent side="right">mumble</TooltipContent>
        </Tooltip>

        {/* Expand */}
        <Tooltip>
          <TooltipTrigger asChild>
            <div>
              <motion.button onClick={onToggle} className="p-2 rounded-xl text-slate-400 hover:text-indigo-600 hover:bg-white/40 transition-colors"
                whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} data-testid="expand-sidebar-btn">
                <PanelLeftOpen className="w-4 h-4" />
              </motion.button>
            </div>
          </TooltipTrigger>
          <TooltipContent side="right">Expand sidebar</TooltipContent>
        </Tooltip>

        {/* New Chat */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <motion.button className="p-2 my-1 rounded-xl text-white"
              style={{ background: creatingChat ? "#9ca3af" : "linear-gradient(135deg, #4338ca, #6366f1)", boxShadow: creatingChat ? "none" : "0 2px 10px rgba(99,102,241,0.35)" }}
              whileHover={creatingChat ? {} : { scale: 1.12, boxShadow: "0 4px 18px rgba(99,102,241,0.45)" }}
              whileTap={creatingChat ? {} : { scale: 0.9 }}
              disabled={creatingChat}
              data-testid="new-chat-btn-collapsed" title="New chat">
              {creatingChat ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            </motion.button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" side="right" className="w-56 border-indigo-100 shadow-lg rounded-xl" style={{ backgroundColor: '#ffffff' }} data-testid="new-chat-dropdown-collapsed">
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

        <div className="h-px w-6 bg-indigo-200/40 my-1" />

        {/* Conversation icons */}
        <ScrollArea className="flex-1 w-full px-1.5">
          <div className="flex flex-col items-center gap-0.5">
            {conversations.map((conv) => (
              <Tooltip key={conv.id}>
                <TooltipTrigger asChild>
                  <div>
                    <motion.button
                      onClick={() => navigate(`/chat/${conv.id}`)}
                      className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors duration-200 ${
                        conv.id === conversationId ? "bg-white/70 shadow-sm text-indigo-500" : "text-indigo-300 hover:bg-white/40 hover:text-indigo-500"
                      }`}
                      whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
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

        {/* Footer icons */}
        <div className="flex flex-col items-center gap-0.5 pt-1" style={{ borderTop: "1px solid rgba(99,102,241,0.08)" }}>
          <Tooltip>
            <TooltipTrigger asChild>
              <div>
                <motion.button onClick={() => navigate("/dashboard")} className="p-2 rounded-xl text-slate-400 hover:text-indigo-600 hover:bg-white/40 transition-colors"
                  whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} data-testid="sidebar-dashboard-collapsed">
                  <BarChart3 className="w-4 h-4" />
                </motion.button>
              </div>
            </TooltipTrigger>
            <TooltipContent side="right">Dashboard</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <div>
                <motion.button onClick={() => navigate("/vocabulary")} className="p-2 rounded-xl text-slate-400 hover:text-indigo-600 hover:bg-white/40 transition-colors"
                  whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} data-testid="sidebar-vocabulary-collapsed">
                  <BookOpen className="w-4 h-4" />
                </motion.button>
              </div>
            </TooltipTrigger>
            <TooltipContent side="right">Vocabulary</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <div>
                <motion.button onClick={() => navigate("/pricing")} className="p-2 rounded-xl text-slate-400 hover:text-indigo-600 hover:bg-white/40 transition-colors"
                  whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} data-testid="sidebar-pricing-collapsed">
                  <CreditCard className="w-4 h-4" />
                </motion.button>
              </div>
            </TooltipTrigger>
            <TooltipContent side="right">Pricing</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <div>
                <motion.button onClick={() => navigate("/credit-history")} className="p-2 rounded-xl text-slate-400 hover:text-indigo-600 hover:bg-white/40 transition-colors"
                  whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} data-testid="sidebar-credit-history-collapsed">
                  <History className="w-4 h-4" />
                </motion.button>
              </div>
            </TooltipTrigger>
            <TooltipContent side="right">Credit History</TooltipContent>
          </Tooltip>
          <CreditBadge collapsed={true} />
          <Tooltip>
            <TooltipTrigger asChild>
              <div>
                <motion.button onClick={onLogout} className="p-2 rounded-xl text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                  whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} data-testid="sidebar-logout-collapsed">
                  <LogOut className="w-4 h-4" />
                </motion.button>
              </div>
            </TooltipTrigger>
            <TooltipContent side="right">Logout</TooltipContent>
          </Tooltip>
        </div>
      </motion.div>

      {/* ─ EXPANDED CONTENT ─ */}
      <motion.div
        className="absolute inset-0 flex flex-col z-10"
        style={{ width: 288 }}
        animate={{ opacity: isExpanded ? 1 : 0, pointerEvents: isExpanded ? "auto" : "none" }}
        transition={{ duration: 0.2, delay: isExpanded ? 0.12 : 0 }}
      >
        {/* Header */}
        <div className="p-4 flex items-center justify-between">
          <motion.button onClick={() => navigate("/")} className="flex items-center gap-2 group"
            whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} data-testid="sidebar-logo">
            <WaveformLogo size={28} className="text-indigo-600 transition-transform duration-300 group-hover:scale-110" />
            <span className="font-semibold text-sm text-slate-800 tracking-tight" style={{ fontFamily: 'Sora, sans-serif' }}>mumble</span>
          </motion.button>
          <motion.button onClick={onToggle} className="p-1.5 rounded-xl hover:bg-white/50 text-slate-400 hover:text-indigo-600 transition-colors"
            whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} data-testid="collapse-sidebar-btn">
            <PanelLeftClose className="w-4 h-4" />
          </motion.button>
        </div>

        {/* Language Pickers + New Chat */}
        <div className="px-3 pb-3">
          <div className="space-y-1.5 mb-3">
            <LanguagePicker label="I speak" labelClass="text-slate-500"
              btnClass="bg-white hover:bg-slate-50 border border-indigo-100 text-slate-700 rounded-xl"
              value={nativeLang} languages={languages} onSelect={onSetNativeLang} testIdPrefix="native" />
            <LanguagePicker label="Learn" labelClass="text-indigo-600"
              btnClass="bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-700 rounded-xl"
              value={targetLang} languages={languages} onSelect={onSetTargetLang} testIdPrefix="target" />
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <motion.div whileHover={creatingChat ? {} : { scale: 1.01 }} whileTap={creatingChat ? {} : { scale: 0.98 }}>
                <Button className="w-full rounded-full text-sm font-semibold text-white border-0 h-10 shadow-[0_2px_12px_rgba(99,102,241,0.3)] hover:shadow-[0_4px_20px_rgba(99,102,241,0.4)] transition-shadow disabled:opacity-70"
                  style={{ background: "linear-gradient(135deg, #4338ca, #6366f1)" }}
                  disabled={creatingChat}
                  data-testid="new-chat-btn">
                  {creatingChat ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Plus className="w-4 h-4 mr-2" />}
                  {creatingChat ? "Creating..." : "New Chat"} <ChevronDown className="w-3 h-3 ml-auto opacity-60" />
                </Button>
              </motion.div>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-64 border-indigo-100 shadow-lg rounded-xl" style={{ backgroundColor: '#ffffff' }} data-testid="new-chat-dropdown">
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
        <ScrollArea className="flex-1 px-3">
          {conversations.length > 0 && (
            <div className="flex items-center justify-between px-1 mb-2 pt-1">
              <span className="text-[10px] uppercase tracking-wider text-indigo-400 font-medium">Conversations</span>
              <button onClick={onClearAll} className="text-[10px] text-red-400 hover:text-red-500 transition-colors" data-testid="clear-all-chats-btn">Clear all</button>
            </div>
          )}
          <div className="space-y-0.5">
            {conversations.map((conv) => (
              <motion.div key={conv.id}
                className={`group flex items-center gap-2 px-3 py-2.5 rounded-xl cursor-pointer transition-all duration-200 ${
                  conv.id === conversationId ? "bg-white/70 shadow-sm border border-indigo-100/50" : "hover:bg-white/40 border border-transparent"
                }`}
                onClick={() => navigate(`/chat/${conv.id}`)}
                whileHover={{ x: 3 }}
                data-testid={`conv-item-${conv.id}`}
              >
                <MessageCircle className={`w-4 h-4 flex-shrink-0 ${conv.id === conversationId ? "text-indigo-500" : "text-indigo-300"}`} />
                <div className="flex-1 min-w-0">
                  <span className={`text-sm truncate block ${conv.id === conversationId ? "text-slate-800 font-medium" : "text-slate-600"}`}>{conv.title}</span>
                  {conv.native_language !== conv.target_language && (
                    <span className="text-[10px] text-indigo-400">
                      {[...languages.popular, ...languages.others].find(l => l.code === conv.native_language)?.name || conv.native_language}
                      {" -> "}
                      {[...languages.popular, ...languages.others].find(l => l.code === conv.target_language)?.name || conv.target_language}
                    </span>
                  )}
                </div>
                <button onClick={(e) => onDeleteConv(conv.id, e)}
                  className="p-1.5 rounded-lg text-slate-300 hover:text-red-400 hover:bg-red-50 transition-all opacity-0 group-hover:opacity-100 flex-shrink-0"
                  data-testid={`delete-conv-${conv.id}`}>
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </motion.div>
            ))}
          </div>
        </ScrollArea>

        {/* Footer */}
        <div className="p-3 space-y-0.5" style={{ borderTop: "1px solid rgba(99,102,241,0.08)" }}>
          <motion.button onClick={() => navigate("/dashboard")}
            className="flex items-center gap-2 w-full px-3 py-2 text-sm text-slate-500 hover:text-indigo-600 hover:bg-white/40 rounded-xl transition-all"
            whileHover={{ x: 3 }} data-testid="sidebar-dashboard-link">
            <BarChart3 className="w-4 h-4" /> Dashboard
          </motion.button>
          <motion.button onClick={() => navigate("/vocabulary")}
            className="flex items-center gap-2 w-full px-3 py-2 text-sm text-slate-500 hover:text-indigo-600 hover:bg-white/40 rounded-xl transition-all"
            whileHover={{ x: 3 }} data-testid="sidebar-vocabulary-link">
            <BookOpen className="w-4 h-4" /> Vocabulary
          </motion.button>
          <motion.button onClick={() => navigate("/pricing")}
            className="flex items-center gap-2 w-full px-3 py-2 text-sm text-slate-500 hover:text-indigo-600 hover:bg-white/40 rounded-xl transition-all"
            whileHover={{ x: 3 }} data-testid="sidebar-pricing-link">
            <CreditCard className="w-4 h-4" /> Pricing
          </motion.button>
          <motion.button onClick={() => navigate("/credit-history")}
            className="flex items-center gap-2 w-full px-3 py-2 text-sm text-slate-500 hover:text-indigo-600 hover:bg-white/40 rounded-xl transition-all"
            whileHover={{ x: 3 }} data-testid="sidebar-credit-history-link">
            <History className="w-4 h-4" /> Credit History
          </motion.button>
          <div className="h-px bg-indigo-100/50 my-1.5" />
          <CreditBadge collapsed={false} />
          <div className="h-px bg-indigo-100/50 my-1.5" />
          <div className="flex items-center justify-between px-3 py-1.5">
            <span className="text-xs text-slate-400 truncate max-w-[140px]" data-testid="sidebar-user-email">{userEmail}</span>
            <button onClick={onLogout} className="flex items-center gap-1 text-xs text-slate-400 hover:text-red-500 transition-colors" data-testid="sidebar-logout-btn">
              <LogOut className="w-3.5 h-3.5" /> Logout
            </button>
          </div>
        </div>
      </motion.div>
    </motion.aside>
  </TooltipProvider>
  );
};

/* ─── Mobile Expanded Sidebar ─── */
const MobileSidebar = ({
  conversations, conversationId, scenarios, languages,
  nativeLang, targetLang, userEmail, creatingChat,
  onSetNativeLang, onSetTargetLang, onNewConversation,
  onDeleteConv, onClearAll, onLogout, onClose, navigate,
}) => (
  <aside className="fixed inset-y-0 left-0 z-40 w-72 flex flex-col"
    style={{
      background: "linear-gradient(165deg, #f0f0ff 0%, #e8ecff 40%, #e0d8f8 100%)",
      boxShadow: "4px 0 24px rgba(0,0,0,0.08)",
      paddingTop: "env(safe-area-inset-top, 0px)",
      paddingBottom: "env(safe-area-inset-bottom, 0px)",
    }}
    data-testid="chat-sidebar">
    <SidebarMesh />
    <motion.div className="p-4 flex items-center justify-between relative z-10"
      initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.05, duration: 0.3 }}>
      <button onClick={() => navigate("/")} className="flex items-center gap-2" data-testid="sidebar-logo">
        <WaveformLogo size={28} className="text-indigo-600" />
        <span className="font-semibold text-sm text-slate-800 tracking-tight" style={{ fontFamily: 'Sora, sans-serif' }}>mumble</span>
      </button>
      <button onClick={onClose} className="p-1.5 rounded-xl hover:bg-white/50 transition-colors" data-testid="close-sidebar-btn">
        <X className="w-5 h-5 text-slate-500" />
      </button>
    </motion.div>
    <motion.div className="px-3 pb-3 relative z-10"
      initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1, duration: 0.3 }}>
      <div className="space-y-1.5 mb-3">
        <LanguagePicker label="I speak" labelClass="text-slate-500" btnClass="bg-white hover:bg-slate-50 border border-indigo-100 text-slate-700 rounded-xl"
          value={nativeLang} languages={languages} onSelect={onSetNativeLang} testIdPrefix="native" />
        <LanguagePicker label="Learn" labelClass="text-indigo-600" btnClass="bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-700 rounded-xl"
          value={targetLang} languages={languages} onSelect={onSetTargetLang} testIdPrefix="target" />
      </div>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button className="w-full rounded-full text-sm font-semibold text-white border-0 h-10 shadow-[0_2px_12px_rgba(99,102,241,0.3)] disabled:opacity-70"
            style={{ background: "linear-gradient(135deg, #4338ca, #6366f1)" }}
            disabled={creatingChat}
            data-testid="new-chat-btn">
            {creatingChat ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Plus className="w-4 h-4 mr-2" />}
            {creatingChat ? "Creating..." : "New Chat"} <ChevronDown className="w-3 h-3 ml-auto opacity-60" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-64 border-indigo-100 shadow-lg rounded-xl" style={{ backgroundColor: '#ffffff' }} data-testid="new-chat-dropdown">
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
    </motion.div>
    <motion.div className="flex-1 min-h-0" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15, duration: 0.3 }}>
    <ScrollArea className="h-full px-3 relative z-10">
      {conversations.length > 0 && (
        <div className="flex items-center justify-between px-1 mb-2 pt-1">
          <span className="text-[10px] uppercase tracking-wider text-indigo-400 font-medium">Conversations</span>
          <button onClick={onClearAll} className="text-[10px] text-red-400 hover:text-red-500" data-testid="clear-all-chats-btn">Clear all</button>
        </div>
      )}
      <div className="space-y-0.5">
        {conversations.map((conv) => (
          <div key={conv.id}
            className={`group flex items-center gap-2 px-3 py-2.5 rounded-xl cursor-pointer transition-all duration-200 ${
              conv.id === conversationId ? "bg-white/70 shadow-sm border border-indigo-100/50" : "hover:bg-white/40 border border-transparent"
            }`}
            onClick={() => { navigate(`/chat/${conv.id}`); onClose(); }}
            data-testid={`conv-item-${conv.id}`}>
            <MessageCircle className={`w-4 h-4 flex-shrink-0 ${conv.id === conversationId ? "text-indigo-500" : "text-indigo-300"}`} />
            <div className="flex-1 min-w-0">
              <span className={`text-sm truncate block ${conv.id === conversationId ? "text-slate-800 font-medium" : "text-slate-600"}`}>{conv.title}</span>
            </div>
            <button onClick={(e) => onDeleteConv(conv.id, e)}
              className="p-1.5 rounded-lg text-slate-300 hover:text-red-400 hover:bg-red-50 transition-all opacity-0 group-hover:opacity-100 flex-shrink-0"
              data-testid={`delete-conv-${conv.id}`}>
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>
    </ScrollArea>
    </motion.div>
    <motion.div className="p-3 space-y-0.5 relative z-10" style={{ borderTop: "1px solid rgba(99,102,241,0.08)" }}
      initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2, duration: 0.3 }}>
      <button onClick={() => navigate("/dashboard")} className="flex items-center gap-2 w-full px-3 py-2 text-sm text-slate-500 hover:text-indigo-600 hover:bg-white/40 rounded-xl transition-all" data-testid="sidebar-dashboard-link">
        <BarChart3 className="w-4 h-4" /> Dashboard
      </button>
      <button onClick={() => navigate("/vocabulary")} className="flex items-center gap-2 w-full px-3 py-2 text-sm text-slate-500 hover:text-indigo-600 hover:bg-white/40 rounded-xl transition-all" data-testid="sidebar-vocabulary-link">
        <BookOpen className="w-4 h-4" /> Vocabulary
      </button>
      <button onClick={() => navigate("/pricing")} className="flex items-center gap-2 w-full px-3 py-2 text-sm text-slate-500 hover:text-indigo-600 hover:bg-white/40 rounded-xl transition-all" data-testid="sidebar-pricing-link">
        <CreditCard className="w-4 h-4" /> Pricing
      </button>
      <button onClick={() => navigate("/credit-history")} className="flex items-center gap-2 w-full px-3 py-2 text-sm text-slate-500 hover:text-indigo-600 hover:bg-white/40 rounded-xl transition-all" data-testid="sidebar-credit-history-link">
        <History className="w-4 h-4" /> Credit History
      </button>
      <div className="h-px bg-indigo-100/50 my-1.5" />
      <CreditBadge collapsed={false} />
      <div className="flex items-center justify-between px-3 py-1.5">
        <span className="text-xs text-slate-400 truncate max-w-[140px]" data-testid="sidebar-user-email">{userEmail}</span>
        <button onClick={onLogout} className="flex items-center gap-1 text-xs text-slate-400 hover:text-red-500 transition-colors" data-testid="sidebar-logout-btn">
          <LogOut className="w-3.5 h-3.5" /> Logout
        </button>
      </div>
    </motion.div>
  </aside>
);

/* ─── Main Sidebar Controller ─── */
export const Sidebar = ({
  conversations, conversationId, scenarios, languages,
  nativeLang, targetLang, sidebarOpen, collapsed, userEmail, onLogout,
  onSetNativeLang, onSetTargetLang, onNewConversation,
  onDeleteConv, onClearAll, onCloseSidebar, onToggleCollapse, creatingChat,
}) => {
  const navigate = useNavigate();
  const handleLogout = () => { onLogout(); navigate("/"); };

  return (
    <>
      {/* Desktop — single animated container */}
      <DesktopSidebar
        collapsed={collapsed} conversations={conversations} conversationId={conversationId}
        scenarios={scenarios} languages={languages}
        nativeLang={nativeLang} targetLang={targetLang} userEmail={userEmail}
        creatingChat={creatingChat}
        onSetNativeLang={onSetNativeLang} onSetTargetLang={onSetTargetLang}
        onNewConversation={onNewConversation} onDeleteConv={onDeleteConv}
        onClearAll={onClearAll} onToggle={onToggleCollapse}
        onLogout={handleLogout} navigate={navigate}
      />

      {/* Mobile — overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className="fixed inset-0 bg-black/25 backdrop-blur-sm z-30 lg:hidden"
              onClick={onCloseSidebar}
            />
            <motion.div
              initial={{ x: "-100%", opacity: 0.5 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: "-100%", opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 30, mass: 0.8 }}
              className="fixed inset-y-0 left-0 z-40 lg:hidden"
            >
              <MobileSidebar
                conversations={conversations} conversationId={conversationId}
                scenarios={scenarios} languages={languages}
                nativeLang={nativeLang} targetLang={targetLang} userEmail={userEmail}
                creatingChat={creatingChat}
                onSetNativeLang={onSetNativeLang} onSetTargetLang={onSetTargetLang}
                onNewConversation={onNewConversation} onDeleteConv={onDeleteConv}
                onClearAll={onClearAll} onClose={onCloseSidebar}
                onLogout={handleLogout} navigate={navigate}
              />
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};
