import "@/App.css";
import { useEffect, useRef } from "react";
import { BrowserRouter, Routes, Route, useNavigate } from "react-router-dom";
import { Toaster } from "@/components/ui/sonner";
import { AuthProvider } from "@/hooks/useAuth";
import ProtectedRoute from "@/components/ProtectedRoute";
import LandingPage from "@/pages/LandingPage";
import AuthPage from "@/pages/AuthPage";
import ChatPage from "@/pages/ChatPage";
import DashboardPage from "@/pages/DashboardPage";
import VocabularyPage from "@/pages/VocabularyPage";
import PricingPage from "@/pages/PricingPage";
import CreditHistoryPage from "@/pages/CreditHistoryPage";
import { GoogleOAuthProvider } from "@react-oauth/google";

// REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS, THIS BREAKS THE AUTH
const GOOGLE_CLIENT_ID = process.env.REACT_APP_GOOGLE_CLIENT_ID;

const isNativeCapacitorApp = () => {
  if (typeof window === "undefined") return false;
  const capacitor = window.Capacitor;
  if (!capacitor) return false;
  if (typeof capacitor.isNativePlatform === "function") return capacitor.isNativePlatform();
  if (typeof capacitor.getPlatform === "function") return capacitor.getPlatform() !== "web";
  return false;
};

function MobileGoogleAuthBridge() {
  const navigate = useNavigate();
  const lastHandledUrlRef = useRef("");

  useEffect(() => {
    if (!isNativeCapacitorApp()) return undefined;

    const appPlugin = window.Capacitor?.Plugins?.App;
    if (!appPlugin?.addListener) return undefined;

    let cancelled = false;
    let listenerHandle;

    const forwardGoogleCallback = (incomingUrl) => {
      if (!incomingUrl || incomingUrl === lastHandledUrlRef.current) return;

      let parsedUrl;
      try {
        parsedUrl = new URL(incomingUrl);
      } catch (_) {
        return;
      }

      const googleCode = parsedUrl.searchParams.get("google_code");
      if (!googleCode) return;

      lastHandledUrlRef.current = incomingUrl;

      const params = new URLSearchParams({ google_code: googleCode });
      const googleState = parsedUrl.searchParams.get("google_state");
      if (googleState) params.set("google_state", googleState);
      navigate(`/auth?${params.toString()}`, { replace: true });
    };

    Promise.resolve(
      appPlugin.addListener("appUrlOpen", ({ url }) => {
        forwardGoogleCallback(url);
      }),
    ).then((handle) => {
      listenerHandle = handle;
      if (cancelled) listenerHandle?.remove?.();
    }).catch(() => {});

    appPlugin.getLaunchUrl?.()
      .then((launchUrl) => {
        if (!cancelled) forwardGoogleCallback(launchUrl?.url);
      })
      .catch(() => {});

    return () => {
      cancelled = true;
      listenerHandle?.remove?.();
    };
  }, [navigate]);

  return null;
}

function App() {
  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <div className="min-h-screen">
        <BrowserRouter>
          <MobileGoogleAuthBridge />
          <AuthProvider>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/auth" element={<AuthPage />} />
            <Route path="/chat" element={<ProtectedRoute><ChatPage /></ProtectedRoute>} />
            <Route path="/chat/:conversationId" element={<ProtectedRoute><ChatPage /></ProtectedRoute>} />
            <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
            <Route path="/vocabulary" element={<ProtectedRoute><VocabularyPage /></ProtectedRoute>} />
            <Route path="/pricing" element={<ProtectedRoute><PricingPage /></ProtectedRoute>} />
            <Route path="/credit-history" element={<ProtectedRoute><CreditHistoryPage /></ProtectedRoute>} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
      <Toaster position="top-right" />
    </div>
    </GoogleOAuthProvider>
  );
}

export default App;
