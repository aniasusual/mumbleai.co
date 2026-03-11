import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, Coins, Zap, ShoppingCart, MessageCircle, Mic, Volume2,
  ChevronLeft, ChevronRight, Filter, Loader2, CreditCard, Brain,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { WaveformLogo } from "@/components/WaveformLogo";
import { getCreditHistory, getSubscription } from "@/lib/api";

const TYPE_CONFIG = {
  usage: {
    icon: Zap,
    label: "Usage",
    color: "#ef4444",
    bg: "rgba(239,68,68,0.08)",
    border: "rgba(239,68,68,0.15)",
  },
  purchase: {
    icon: ShoppingCart,
    label: "Purchase",
    color: "#10b981",
    bg: "rgba(16,185,129,0.08)",
    border: "rgba(16,185,129,0.15)",
  },
};

const BREAKDOWN_ICONS = {
  llm: Brain,
  stt: Mic,
  tts: Volume2,
};

function TransactionRow({ tx, index }) {
  const [expanded, setExpanded] = useState(false);
  const config = TYPE_CONFIG[tx.type] || TYPE_CONFIG.usage;
  const Icon = config.icon;
  const isUsage = tx.type === "usage";
  const date = new Date(tx.created_at);

  const breakdownItems = [];
  if (isUsage && tx.breakdown) {
    const b = tx.breakdown;
    if (b.llm_credits > 0) {
      breakdownItems.push({
        key: "llm",
        icon: BREAKDOWN_ICONS.llm,
        label: "LLM Tokens",
        detail: `${(b.llm_input_tokens || 0).toLocaleString()} in / ${(b.llm_output_tokens || 0).toLocaleString()} out`,
        credits: b.llm_credits,
      });
    }
    if (b.stt_credits > 0) {
      breakdownItems.push({
        key: "stt",
        icon: BREAKDOWN_ICONS.stt,
        label: "Speech-to-Text",
        detail: `${b.stt_seconds || 0}s audio`,
        credits: b.stt_credits,
      });
    }
    if (b.tts_credits > 0) {
      breakdownItems.push({
        key: "tts",
        icon: BREAKDOWN_ICONS.tts,
        label: "Text-to-Speech",
        detail: `${(b.tts_characters || 0).toLocaleString()} chars`,
        credits: b.tts_credits,
      });
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.03, duration: 0.3 }}
      className="group"
      data-testid={`credit-tx-${index}`}
    >
      <button
        onClick={() => isUsage && breakdownItems.length > 0 && setExpanded(!expanded)}
        className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all duration-200 hover:bg-white/80 text-left"
        style={{
          cursor: isUsage && breakdownItems.length > 0 ? "pointer" : "default",
          background: expanded ? "white" : "transparent",
          boxShadow: expanded ? "0 2px 12px rgba(0,0,0,0.04)" : "none",
        }}
        data-testid={`credit-tx-row-${index}`}
      >
        {/* Icon */}
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: config.bg, border: `1px solid ${config.border}` }}
        >
          <Icon className="w-4 h-4" style={{ color: config.color }} />
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-slate-800">
              {isUsage ? "Conversation usage" : `${(tx.plan || "").charAt(0).toUpperCase() + (tx.plan || "").slice(1)} Plan Purchase`}
            </span>
            <span
              className="text-[10px] font-semibold tracking-wider uppercase px-1.5 py-0.5 rounded-full"
              style={{ background: config.bg, color: config.color }}
            >
              {config.label}
            </span>
          </div>
          <span className="text-xs text-slate-400">
            {date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
            {" at "}
            {date.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
          </span>
        </div>

        {/* Amount */}
        <div className="text-right flex-shrink-0">
          <span
            className="text-sm font-bold tabular-nums"
            style={{ color: isUsage ? config.color : config.color }}
          >
            {isUsage ? `${tx.amount}` : `+${tx.credits_added}`}
          </span>
          <span className="text-[10px] text-slate-400 block">credits</span>
        </div>

        {/* Expand indicator */}
        {isUsage && breakdownItems.length > 0 && (
          <ChevronRight
            className="w-3.5 h-3.5 text-slate-300 transition-transform duration-200 flex-shrink-0"
            style={{ transform: expanded ? "rotate(90deg)" : "rotate(0deg)" }}
          />
        )}
      </button>

      {/* Expanded breakdown */}
      <AnimatePresence>
        {expanded && breakdownItems.length > 0 && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="ml-[52px] pl-4 pb-3 pt-1 space-y-2 border-l-2 border-slate-100" data-testid={`credit-tx-breakdown-${index}`}>
              {breakdownItems.map((item) => {
                const BIcon = item.icon;
                return (
                  <div key={item.key} className="flex items-center gap-2.5">
                    <BIcon className="w-3.5 h-3.5 text-slate-400" />
                    <span className="text-xs text-slate-600 flex-1">
                      {item.label}
                      <span className="text-slate-400 ml-1">({item.detail})</span>
                    </span>
                    <span className="text-xs font-semibold text-red-500 tabular-nums">-{item.credits}</span>
                  </div>
                );
              })}
              {typeof tx.balance_after === "number" && (
                <div className="flex items-center gap-2.5 pt-1.5 mt-1.5 border-t border-slate-100/60">
                  <Coins className="w-3.5 h-3.5 text-indigo-400" />
                  <span className="text-xs text-slate-500 flex-1">Balance after</span>
                  <span className="text-xs font-semibold text-indigo-600 tabular-nums">{tx.balance_after}</span>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function FilterPill({ label, active, onClick, testId }) {
  return (
    <motion.button
      onClick={onClick}
      className="px-3.5 py-1.5 rounded-full text-xs font-medium transition-all duration-200"
      style={{
        background: active ? "#6366f1" : "white",
        color: active ? "white" : "#64748b",
        border: active ? "1px solid #6366f1" : "1px solid #e2e8f0",
        boxShadow: active ? "0 2px 8px rgba(99,102,241,0.25)" : "none",
      }}
      whileHover={{ scale: 1.04 }}
      whileTap={{ scale: 0.96 }}
      data-testid={testId}
    >
      {label}
    </motion.button>
  );
}

export default function CreditHistoryPage() {
  const navigate = useNavigate();
  const [transactions, setTransactions] = useState([]);
  const [subscription, setSubscription] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [filter, setFilter] = useState(null); // null = all, "usage", "purchase"
  const [loading, setLoading] = useState(true);

  const fetchHistory = useCallback(async (p, f) => {
    setLoading(true);
    try {
      const res = await getCreditHistory(p, 15, f);
      setTransactions(res.data.transactions || []);
      setTotalPages(res.data.pages || 1);
      setTotal(res.data.total || 0);
    } catch {
      setTransactions([]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchHistory(page, filter);
  }, [page, filter, fetchHistory]);

  useEffect(() => {
    getSubscription().then((r) => setSubscription(r.data)).catch(() => {});
  }, []);

  const handleFilterChange = (f) => {
    setFilter(f);
    setPage(1);
  };

  return (
    <div className="min-h-screen overflow-x-hidden" style={{ background: "#f8f7f4" }} data-testid="credit-history-page">
      {/* Header */}
      <header className="px-6 py-4 flex items-center justify-between max-w-3xl mx-auto" style={{ paddingTop: "calc(1rem + env(safe-area-inset-top, 0px))" }}>
        <button
          onClick={() => navigate("/chat")}
          className="flex items-center gap-2 group"
          data-testid="credit-history-back-btn"
        >
          <ArrowLeft className="w-4 h-4 text-slate-400 group-hover:text-indigo-600 transition-colors" />
          <WaveformLogo size={24} className="text-indigo-600" />
          <span className="font-semibold text-sm text-slate-800" style={{ fontFamily: "Sora" }}>
            mumble
          </span>
        </button>
        {subscription && (
          <button
            onClick={() => navigate("/pricing")}
            className="flex items-center gap-2 hover:bg-white/60 px-3 py-1.5 rounded-full transition-colors"
            data-testid="credit-history-balance"
          >
            <CreditCard className="w-4 h-4 text-indigo-500" />
            <span className="text-sm text-slate-500">
              <span className="font-semibold text-slate-700">{subscription.credits}</span> credits
            </span>
          </button>
        )}
      </header>

      {/* Content */}
      <main className="max-w-3xl mx-auto px-6 py-8">
        {/* Title + Stats */}
        <div className="mb-8">
          <motion.h1
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900 mb-2"
            style={{ fontFamily: "Sora" }}
          >
            Credit History
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="text-sm text-slate-500"
          >
            Track how your credits are earned and spent across conversations.
          </motion.p>
        </div>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex items-center gap-2 mb-6"
        >
          <Filter className="w-3.5 h-3.5 text-slate-400 mr-1" />
          <FilterPill label="All" active={filter === null} onClick={() => handleFilterChange(null)} testId="filter-all" />
          <FilterPill label="Usage" active={filter === "usage"} onClick={() => handleFilterChange("usage")} testId="filter-usage" />
          <FilterPill label="Purchases" active={filter === "purchase"} onClick={() => handleFilterChange("purchase")} testId="filter-purchase" />
          <span className="text-xs text-slate-400 ml-auto tabular-nums">{total} transactions</span>
        </motion.div>

        {/* Transaction List */}
        <div
          className="rounded-2xl overflow-hidden"
          style={{
            background: "rgba(255,255,255,0.5)",
            border: "1px solid rgba(99,102,241,0.08)",
            backdropFilter: "blur(12px)",
          }}
        >
          {loading ? (
            <div className="flex items-center justify-center py-16" data-testid="credit-history-loading">
              <Loader2 className="w-5 h-5 animate-spin text-indigo-400" />
            </div>
          ) : transactions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center" data-testid="credit-history-empty">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center mb-3">
                <Coins className="w-6 h-6 text-indigo-300" />
              </div>
              <p className="text-sm text-slate-500 mb-1">No transactions yet</p>
              <p className="text-xs text-slate-400">
                Start a conversation to see your credit usage here.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100/60" data-testid="credit-history-list">
              {transactions.map((tx, i) => (
                <TransactionRow key={`${tx.created_at}-${i}`} tx={tx} index={i} />
              ))}
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="flex items-center justify-center gap-3 mt-6"
            data-testid="credit-history-pagination"
          >
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="rounded-full px-3 h-8 text-xs border-slate-200"
              data-testid="pagination-prev"
            >
              <ChevronLeft className="w-3.5 h-3.5 mr-1" /> Prev
            </Button>
            <span className="text-xs text-slate-500 tabular-nums" data-testid="pagination-info">
              Page {page} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="rounded-full px-3 h-8 text-xs border-slate-200"
              data-testid="pagination-next"
            >
              Next <ChevronRight className="w-3.5 h-3.5 ml-1" />
            </Button>
          </motion.div>
        )}

        {/* Credit Rates Info */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="mt-10 rounded-2xl p-5"
          style={{
            background: "rgba(255,255,255,0.5)",
            border: "1px solid rgba(99,102,241,0.08)",
          }}
          data-testid="credit-rates-info"
        >
          <h3 className="text-xs font-semibold tracking-wider uppercase text-slate-500 mb-3">
            Credit Rates
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="flex items-start gap-2.5">
              <Brain className="w-4 h-4 text-indigo-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-xs font-medium text-slate-700">LLM Processing</p>
                <p className="text-[11px] text-slate-400 leading-relaxed">1 credit/1K input tokens, 3 credits/1K output tokens</p>
              </div>
            </div>
            <div className="flex items-start gap-2.5">
              <Mic className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-xs font-medium text-slate-700">Speech-to-Text</p>
                <p className="text-[11px] text-slate-400 leading-relaxed">0.3 credits per second of audio</p>
              </div>
            </div>
            <div className="flex items-start gap-2.5">
              <Volume2 className="w-4 h-4 text-pink-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-xs font-medium text-slate-700">Text-to-Speech</p>
                <p className="text-[11px] text-slate-400 leading-relaxed">1 credit per 500 characters</p>
              </div>
            </div>
          </div>
        </motion.div>
      </main>
    </div>
  );
}
