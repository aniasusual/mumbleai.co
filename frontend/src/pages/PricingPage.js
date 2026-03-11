import { useState, useEffect, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { Check, Zap, Crown, Sparkles, ArrowLeft, Loader2, CreditCard, XCircle, ArrowDown } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { getSubscription, createSubscription, verifySubscription, cancelSubscription, changePlan } from "@/lib/api";
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
    id: "free", name: "Free", price: 0, priceDisplay: "Free", credits: 500,
    accent: "#6366f1", accentLight: "rgba(99,102,241,0.1)", borderColor: "rgba(99,102,241,0.2)",
    icon: Sparkles, highlight: false,
    extras: ["Up to 3 active conversations", "~5 full learning sessions"],
  },
  {
    id: "plus", name: "Plus", price: 1199, priceDisplay: "1,199", credits: 3000,
    accent: "#be185d", accentLight: "rgba(190,24,93,0.08)", borderColor: "rgba(190,24,93,0.25)",
    icon: Zap, highlight: true,
    extras: ["Up to 10 active conversations", "~500 text or ~200 voice turns/month"],
  },
  {
    id: "pro", name: "Pro", price: 2499, priceDisplay: "2,499", credits: 7000,
    accent: "#7c3aed", accentLight: "rgba(124,58,237,0.08)", borderColor: "rgba(124,58,237,0.25)",
    icon: Crown, highlight: false,
    extras: ["Unlimited conversations", "~1,200 text or ~500 voice turns/month", "Priority response"],
  },
];

const PLAN_ORDER = { free: 0, plus: 1, pro: 2 };

function PricingCard({ plan, subscription, onSelect, onCancel, onDowngrade, loading }) {
  const currentPlan = subscription?.plan || "free";
  const isCurrent = currentPlan === plan.id;
  const isUpgrade = PLAN_ORDER[plan.id] > PLAN_ORDER[currentPlan];
  const isDowngrade = PLAN_ORDER[plan.id] < PLAN_ORDER[currentPlan];
  const isPendingCancel = subscription?.subscription_status === "cancelling";
  const isPendingDowngrade = subscription?.pending_plan === plan.id;
  const isDowngrading = subscription?.subscription_status === "downgrading";
  const needsActivation = isCurrent && subscription?.subscription_status === "pending_activation";

  const getButtonContent = () => {
    if (loading === plan.id) return <Loader2 className="w-4 h-4 animate-spin mx-auto" />;
    if (needsActivation) return `Activate ${plan.name}`;
    if (isPendingDowngrade) return "Switching at cycle end";
    if (isCurrent && isPendingCancel) return "Cancelling at cycle end";
    if (isCurrent && isDowngrading) return "Downgrading at cycle end";
    if (isCurrent) return "Current Plan";
    if (isUpgrade) return `Subscribe to ${plan.name}`;
    if (isDowngrade && plan.id === "free") return "Cancel Subscription";
    if (isDowngrade) return `Downgrade to ${plan.name}`;
    return `Start for Free`;
  };

  const handleClick = () => {
    if (loading) return;
    if (needsActivation) { onSelect(plan.id); return; }
    if (isCurrent || isPendingDowngrade) return;
    if (isUpgrade) onSelect(plan.id);
    else if (isDowngrade && plan.id === "free") onCancel();
    else if (isDowngrade) onDowngrade(plan.id);
  };

  const isDisabled = (isCurrent && !needsActivation) || isPendingDowngrade || (isCurrent && isDowngrading) || !!loading;

  return (
    <motion.div
      className="relative flex flex-col rounded-2xl p-6 md:p-8"
      style={{
        background: plan.highlight ? "white" : "rgba(255,255,255,0.7)",
        border: isCurrent ? `2px solid ${plan.accent}` : `2px solid ${plan.highlight ? plan.accent : plan.borderColor}`,
        backdropFilter: "blur(12px)",
        boxShadow: plan.highlight ? "0 8px 40px rgba(190,24,93,0.12), 0 0 0 1px rgba(190,24,93,0.08)" : "0 2px 12px rgba(0,0,0,0.04)",
      }}
      initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}
      transition={{ delay: PLANS.indexOf(plan) * 0.1, duration: 0.5 }}
      whileHover={{ y: -4 }}
      data-testid={`pricing-card-${plan.id}`}
    >
      {plan.highlight && !isCurrent && (
        <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-[10px] font-semibold tracking-wider uppercase text-white"
          style={{ background: plan.accent }} data-testid="pricing-popular-badge">Most Popular</span>
      )}
      {isCurrent && (
        <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-[10px] font-semibold tracking-wider uppercase text-white bg-emerald-500"
          data-testid="pricing-current-badge">Current Plan</span>
      )}
      {isPendingDowngrade && (
        <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-[10px] font-semibold tracking-wider uppercase text-white bg-amber-500"
          data-testid="pricing-pending-badge">Switching soon</span>
      )}

      <div className="flex items-center gap-2 mb-4">
        <plan.icon className="w-5 h-5" style={{ color: plan.accent }} />
        <h3 className="text-lg font-semibold tracking-tight text-slate-900" style={{ fontFamily: "Sora" }}>{plan.name}</h3>
      </div>

      <div className="mb-1">
        {plan.price === 0 ? (
          <span className="text-4xl font-bold tracking-tight text-slate-900" style={{ fontFamily: "Sora" }}>Free</span>
        ) : (
          <>
            <span className="text-sm text-slate-400 mr-0.5">Rs</span>
            <span className="text-4xl font-bold tracking-tight text-slate-900" style={{ fontFamily: "Sora" }}>{plan.priceDisplay}</span>
            <span className="text-sm text-slate-400 ml-1">/month</span>
          </>
        )}
      </div>
      <p className="text-sm text-slate-500 mb-1">{plan.credits.toLocaleString()} credits/month</p>
      <p className="text-[11px] text-slate-400 mb-6">
        {plan.price === 0 ? "No credit card required" : "Monthly subscription · Credits roll over"}
      </p>

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
        onClick={handleClick}
        disabled={isDisabled}
        className="w-full rounded-full py-3 text-sm font-semibold transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        style={{
          background: needsActivation ? plan.accent : isCurrent || isPendingDowngrade || (isCurrent && isDowngrading) ? "#e2e8f0" : isDowngrade ? "transparent" : plan.highlight ? plan.accent : "transparent",
          color: needsActivation ? "white" : isCurrent || isPendingDowngrade || (isCurrent && isDowngrading) ? "#64748b" : isDowngrade ? "#ef4444" : plan.highlight ? "white" : plan.accent,
          border: needsActivation || isCurrent || isPendingDowngrade || (isCurrent && isDowngrading) || plan.highlight ? "none" : isDowngrade ? "2px solid rgba(239,68,68,0.3)" : `2px solid ${plan.borderColor}`,
        }}
        whileHover={!isDisabled ? { scale: 1.02 } : {}}
        whileTap={!isDisabled ? { scale: 0.97 } : {}}
        data-testid={`pricing-btn-${plan.id}`}
      >
        {isDowngrade && !loading && !isPendingDowngrade && plan.id === "free" && <XCircle className="w-3.5 h-3.5" />}
        {isDowngrade && !loading && !isPendingDowngrade && plan.id !== "free" && <ArrowDown className="w-3.5 h-3.5" />}
        {getButtonContent()}
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
      setSubscription({ plan: "free", credits: 500 });
    }
    setPageLoading(false);
  }, []);

  useEffect(() => { fetchSubscription(); }, [fetchSubscription]);

  useEffect(() => {
    if (selectedPlan && subscription && selectedPlan !== subscription.plan && !pageLoading) {
      handleSelectPlan(selectedPlan);
    }
  }, [selectedPlan, subscription, pageLoading]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSelectPlan = async (planId) => {
    if (planId === "free") { navigate("/chat"); return; }

    setLoadingPlan(planId);
    try {
      const res = await createSubscription(planId);
      const { subscription_id, key_id } = res.data;

      const options = {
        key: key_id || RAZORPAY_KEY,
        subscription_id,
        name: "mumble",
        description: `${planId.charAt(0).toUpperCase() + planId.slice(1)} Plan — Monthly Subscription`,
        handler: async (response) => {
          try {
            await verifySubscription({
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_subscription_id: response.razorpay_subscription_id,
              razorpay_signature: response.razorpay_signature,
              plan: planId,
            });
            toast.success(`Subscribed to ${planId.charAt(0).toUpperCase() + planId.slice(1)}! Credits added.`);
            fetchSubscription();
          } catch {
            toast.error("Payment verification failed. Please contact support.");
          }
        },
        prefill: { email: user?.email || "", name: user?.name || "" },
        theme: { color: "#4338ca" },
        modal: { ondismiss: () => setLoadingPlan(null) },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
      setLoadingPlan(null);
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed to create subscription. Please try again.");
      setLoadingPlan(null);
    }
  };

  const handleCancel = async () => {
    if (!window.confirm("Are you sure you want to cancel? You'll keep your current plan until the billing cycle ends, then revert to Free.")) return;
    setLoadingPlan("free");
    try {
      const res = await cancelSubscription();
      toast.success(res.data.message);
      fetchSubscription();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed to cancel subscription.");
    }
    setLoadingPlan(null);
  };

  const handleDowngrade = async (planId) => {
    if (!window.confirm(`Downgrade to ${planId.charAt(0).toUpperCase() + planId.slice(1)}? The change takes effect at the end of your billing cycle. Your credits will be kept.`)) return;
    setLoadingPlan(planId);
    try {
      const res = await changePlan(planId);
      toast.success(res.data.message);
      fetchSubscription();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed to change plan.");
    }
    setLoadingPlan(null);
  };

  if (pageLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#f8f7f4" }}>
        <Loader2 className="w-6 h-6 animate-spin text-indigo-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen relative overflow-x-hidden" data-testid="pricing-page">
      <div className="absolute inset-0 -z-10 overflow-hidden" style={{
        background: `
          radial-gradient(ellipse 80% 70% at 15% 20%, rgba(99,102,241,0.28) 0%, transparent 60%),
          radial-gradient(ellipse 70% 60% at 85% 15%, rgba(190,24,93,0.2) 0%, transparent 55%),
          radial-gradient(ellipse 75% 65% at 30% 85%, rgba(124,58,237,0.24) 0%, transparent 55%),
          radial-gradient(ellipse 60% 50% at 75% 75%, rgba(16,185,129,0.18) 0%, transparent 55%),
          radial-gradient(ellipse 50% 40% at 50% 50%, rgba(245,158,11,0.1) 0%, transparent 50%),
          #f0eeea
        `
      }} />
      <header className="px-6 py-4 flex items-center justify-between max-w-6xl mx-auto" style={{ paddingTop: "calc(1rem + env(safe-area-inset-top, 0px))" }}>
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

      <main className="max-w-5xl mx-auto px-6 py-12">
        {subscription?.subscription_status === "pending_activation" && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-4xl mx-auto mb-8 rounded-xl px-5 py-4 flex items-center gap-3"
            style={{ background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.25)" }}
            data-testid="pending-activation-banner"
          >
            <Zap className="w-5 h-5 text-amber-600 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-amber-800">Activate your {subscription.plan.charAt(0).toUpperCase() + subscription.plan.slice(1)} plan</p>
              <p className="text-xs text-amber-600 mt-0.5">Your previous subscription ended. Subscribe below to start your new plan and resume recurring billing.</p>
            </div>
          </motion.div>
        )}
        {subscription?.subscription_status === "downgrading" && subscription?.pending_plan && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-4xl mx-auto mb-8 rounded-xl px-5 py-4 flex items-center gap-3"
            style={{ background: "rgba(99,102,241,0.06)", border: "1px solid rgba(99,102,241,0.15)" }}
            data-testid="downgrading-banner"
          >
            <ArrowDown className="w-5 h-5 text-indigo-500 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-indigo-800">Plan change scheduled</p>
              <p className="text-xs text-indigo-500 mt-0.5">
                You'll switch to {subscription.pending_plan.charAt(0).toUpperCase() + subscription.pending_plan.slice(1)} at the end of your current billing cycle. Your current benefits remain active until then.
              </p>
            </div>
          </motion.div>
        )}
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
            Monthly subscriptions. Credits roll over. Cancel anytime.
          </motion.p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-5 max-w-4xl mx-auto">
          {PLANS.map((plan) => (
            <PricingCard
              key={plan.id}
              plan={plan}
              subscription={subscription}
              onSelect={handleSelectPlan}
              onCancel={handleCancel}
              onDowngrade={handleDowngrade}
              loading={loadingPlan}
            />
          ))}
        </div>
      </main>
    </div>
  );
}
