import { useState, useEffect, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Zap, Crown, Sparkles, ArrowLeft, Loader2, CreditCard } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { getSubscription, createOrder } from "@/lib/api";
import { WaveformLogo } from "@/components/WaveformLogo";

const RAZORPAY_KEY = process.env.REACT_APP_RAZORPAY_KEY_ID;

const PLAN_FEATURES = [
  "All 4 AI agents (Tutor, Planner, Testing, Revision)",
  "Voice & text conversations",
  "50+ languages",
  "Scenarios & role-play",
  "Vocabulary saving & grammar tools",
  "Dashboard & progress tracking",
];

const PLANS = [
  {
    id: "free", name: "Free", price: 0, credits: 50,
    accent: "#6366f1", accentLight: "rgba(99,102,241,0.1)", borderColor: "rgba(99,102,241,0.2)",
    icon: Sparkles, highlight: false,
    extras: ["Up to 3 active conversations", "~10 voice or ~25 text turns/month"],
  },
  {
    id: "plus", name: "Plus", price: 14.99, credits: 1000,
    accent: "#be185d", accentLight: "rgba(190,24,93,0.08)", borderColor: "rgba(190,24,93,0.25)",
    icon: Zap, highlight: true,
    extras: ["Up to 10 active conversations", "~200 voice or ~500 text turns/month"],
  },
  {
    id: "pro", name: "Pro", price: 29.99, credits: 5000,
    accent: "#7c3aed", accentLight: "rgba(124,58,237,0.08)", borderColor: "rgba(124,58,237,0.25)",
    icon: Crown, highlight: false,
    extras: ["Unlimited conversations", "~1,000 voice or ~2,500 text turns/month", "Priority response"],
  },
];

function PricingCard({ plan, currentPlan, onSelect, loading }) {
  const isCurrent = currentPlan === plan.id;
  const isDowngrade = (currentPlan === "pro" && plan.id !== "pro") || (currentPlan === "plus" && plan.id === "free");

  return (
    <motion.div
      className="relative flex flex-col rounded-2xl p-6 md:p-8"
      style={{
        background: plan.highlight ? "white" : "rgba(255,255,255,0.7)",
        border: isCurrent ? `2px solid ${plan.accent}` : `2px solid ${plan.highlight ? plan.accent : plan.borderColor}`,
        backdropFilter: "blur(12px)",
        boxShadow: plan.highlight
          ? "0 8px 40px rgba(190,24,93,0.12), 0 0 0 1px rgba(190,24,93,0.08)"
          : "0 2px 12px rgba(0,0,0,0.04)",
      }}
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: PLANS.indexOf(plan) * 0.1, duration: 0.5 }}
      whileHover={{ y: -4 }}
      data-testid={`pricing-card-${plan.id}`}
    >
      {plan.highlight && !isCurrent && (
        <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-[10px] font-semibold tracking-wider uppercase text-white"
          style={{ background: plan.accent }} data-testid="pricing-popular-badge">
          Most Popular
        </span>
      )}
      {isCurrent && (
        <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-[10px] font-semibold tracking-wider uppercase text-white bg-emerald-500"
          data-testid="pricing-current-badge">
          Current Plan
        </span>
      )}

      <div className="flex items-center gap-2 mb-4">
        <plan.icon className="w-5 h-5" style={{ color: plan.accent }} />
        <h3 className="text-lg font-semibold tracking-tight text-slate-900" style={{ fontFamily: "Sora" }}>{plan.name}</h3>
      </div>

      <div className="mb-1">
        <span className="text-4xl font-bold tracking-tight text-slate-900" style={{ fontFamily: "Sora" }}>
          {plan.price === 0 ? "$0" : `$${plan.price}`}
        </span>
        <span className="text-sm text-slate-400 ml-1">/month</span>
      </div>
      <p className="text-sm text-slate-500 mb-6">{plan.credits.toLocaleString()} credits/month</p>

      <div className="flex-1 space-y-2.5 mb-6">
        {plan.extras.map((f, j) => (
          <div key={j} className="flex items-start gap-2">
            <Check className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: plan.accent }} />
            <span className="text-[13px] text-slate-600 leading-snug">{f}</span>
          </div>
        ))}
        <div className="pt-2 mt-2 border-t border-slate-100">
          {PLAN_FEATURES.map((f, j) => (
            <div key={j} className="flex items-start gap-2 py-0.5">
              <Check className="w-3.5 h-3.5 mt-0.5 flex-shrink-0 text-emerald-500" />
              <span className="text-[12px] text-slate-400 leading-snug">{f}</span>
            </div>
          ))}
        </div>
      </div>

      <motion.button
        onClick={() => !isCurrent && !isDowngrade && onSelect(plan.id)}
        disabled={isCurrent || isDowngrade || loading}
        className="w-full rounded-full py-3 text-sm font-semibold transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
        style={{
          background: isCurrent ? "#e2e8f0" : plan.highlight ? plan.accent : "transparent",
          color: isCurrent ? "#64748b" : plan.highlight ? "white" : plan.accent,
          border: isCurrent || plan.highlight ? "none" : `2px solid ${plan.borderColor}`,
        }}
        whileHover={!isCurrent && !isDowngrade ? { scale: 1.02 } : {}}
        whileTap={!isCurrent && !isDowngrade ? { scale: 0.97 } : {}}
        data-testid={`pricing-btn-${plan.id}`}
      >
        {loading === plan.id ? (
          <Loader2 className="w-4 h-4 animate-spin mx-auto" />
        ) : isCurrent ? (
          "Current Plan"
        ) : isDowngrade ? (
          "—"
        ) : plan.price === 0 ? (
          "Start for Free"
        ) : (
          `Upgrade to ${plan.name}`
        )}
      </motion.button>
    </motion.div>
  );
}

export default function PricingPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const [subscription, setSubscription] = useState(null);
  const [loadingPlan, setLoadingPlan] = useState(null);
  const [pageLoading, setPageLoading] = useState(true);

  const selectedPlan = searchParams.get("plan");

  const fetchSubscription = useCallback(async () => {
    try {
      const res = await getSubscription();
      setSubscription(res.data);
    } catch {
      // Default to free
      setSubscription({ plan: "free", credits: 50 });
    }
    setPageLoading(false);
  }, []);

  useEffect(() => {
    fetchSubscription();
  }, [fetchSubscription]);

  // Auto-trigger checkout if plan param is present
  useEffect(() => {
    if (selectedPlan && subscription && selectedPlan !== subscription.plan && !pageLoading) {
      handleSelectPlan(selectedPlan);
    }
  }, [selectedPlan, subscription, pageLoading]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSelectPlan = async (planId) => {
    if (planId === "free") {
      navigate("/chat");
      return;
    }

    setLoadingPlan(planId);
    try {
      const res = await createOrder(planId);
      const { order_id, amount, currency, key_id } = res.data;

      const options = {
        key: key_id || RAZORPAY_KEY,
        amount,
        currency,
        name: "mumble",
        description: `${planId.charAt(0).toUpperCase() + planId.slice(1)} Plan — Monthly`,
        order_id,
        handler: async (response) => {
          // Verify payment on backend
          try {
            const { default: api } = await import("@/lib/api");
            await api.post("/payments/verify-payment", {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              plan: planId,
            });
            toast.success(`Upgraded to ${planId.charAt(0).toUpperCase() + planId.slice(1)}! Credits added.`);
            fetchSubscription();
          } catch {
            toast.error("Payment verification failed. Please contact support.");
          }
        },
        prefill: {
          email: user?.email || "",
          name: user?.name || "",
        },
        theme: {
          color: "#4338ca",
        },
        modal: {
          ondismiss: () => setLoadingPlan(null),
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
      setLoadingPlan(null);
    } catch (err) {
      toast.error("Failed to initiate payment. Please try again.");
      setLoadingPlan(null);
    }
  };

  if (pageLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#f8f7f4" }}>
        <Loader2 className="w-6 h-6 animate-spin text-indigo-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: "#f8f7f4" }} data-testid="pricing-page">
      {/* Header */}
      <header className="px-6 py-4 flex items-center justify-between max-w-6xl mx-auto">
        <button onClick={() => navigate("/chat")} className="flex items-center gap-2 group" data-testid="pricing-back-btn">
          <ArrowLeft className="w-4 h-4 text-slate-400 group-hover:text-indigo-600 transition-colors" />
          <WaveformLogo size={24} className="text-indigo-600" />
          <span className="font-semibold text-sm text-slate-800" style={{ fontFamily: "Sora" }}>mumble</span>
        </button>
        {subscription && (
          <div className="flex items-center gap-2" data-testid="pricing-current-info">
            <CreditCard className="w-4 h-4 text-indigo-500" />
            <span className="text-sm text-slate-500">
              <span className="font-semibold text-slate-700">{subscription.credits}</span> credits remaining
            </span>
          </div>
        )}
      </header>

      {/* Content */}
      <main className="max-w-5xl mx-auto px-6 py-12">
        <div className="text-center mb-14">
          <motion.span initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            className="text-[13px] font-semibold tracking-wider uppercase mb-3 block text-indigo-500">
            Pricing
          </motion.span>
          <motion.h1 initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
            className="text-3xl md:text-5xl font-bold tracking-tight text-slate-900 mb-4" style={{ fontFamily: "Sora" }}>
            Choose your plan
          </motion.h1>
          <motion.p initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="text-[15px] max-w-lg mx-auto text-slate-500">
            Every plan includes all features. Pick the volume that fits your practice routine.
          </motion.p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-5 max-w-4xl mx-auto">
          {PLANS.map((plan) => (
            <PricingCard
              key={plan.id}
              plan={plan}
              currentPlan={subscription?.plan || "free"}
              onSelect={handleSelectPlan}
              loading={loadingPlan}
            />
          ))}
        </div>
      </main>
    </div>
  );
}
