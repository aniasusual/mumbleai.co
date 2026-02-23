import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  MessageCircle,
  BookOpen,
  BarChart3,
  Briefcase,
  Plane,
  UtensilsCrossed,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  ChevronRight
} from "lucide-react";

const NAV_LINKS = [
  { label: "Practice", href: "/chat", icon: MessageCircle },
  { label: "Dashboard", href: "/dashboard", icon: BarChart3 },
  { label: "Vocabulary", href: "/vocabulary", icon: BookOpen },
];

const FEATURES = [
  {
    title: "Grammar Correction",
    description: "Get instant feedback on grammar with clear explanations",
    icon: CheckCircle2,
  },
  {
    title: "Vocabulary Builder",
    description: "Learn new words in context with synonyms and examples",
    icon: BookOpen,
  },
  {
    title: "Role-play Scenarios",
    description: "Practice real-world situations like interviews and travel",
    icon: Sparkles,
  },
];

const SCENARIOS_PREVIEW = [
  {
    title: "Job Interview",
    description: "Nail your next interview",
    icon: Briefcase,
    image: "https://images.pexels.com/photos/5439143/pexels-photo-5439143.jpeg",
  },
  {
    title: "Travel & Directions",
    description: "Navigate with confidence",
    icon: Plane,
    image: "https://images.pexels.com/photos/7235606/pexels-photo-7235606.jpeg",
  },
  {
    title: "At a Restaurant",
    description: "Order like a local",
    icon: UtensilsCrossed,
    image: "https://images.pexels.com/photos/9789454/pexels-photo-9789454.jpeg",
  },
];

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-white noise-bg">
      {/* Navigation */}
      <nav className="glass-header sticky top-0 z-50" data-testid="navbar">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <button
              onClick={() => navigate("/")}
              className="flex items-center gap-2"
              data-testid="logo-button"
            >
              <div className="w-8 h-8 rounded-lg bg-[#2F5233] flex items-center justify-center">
                <span className="text-white font-bold text-sm" style={{ fontFamily: 'Playfair Display, serif' }}>L</span>
              </div>
              <span className="text-lg font-semibold tracking-tight" style={{ fontFamily: 'Playfair Display, serif' }}>
                LinguaFlow
              </span>
            </button>
            <div className="hidden md:flex items-center gap-8">
              {NAV_LINKS.map((link) => (
                <button
                  key={link.href}
                  onClick={() => navigate(link.href)}
                  className="text-sm font-medium text-gray-600 hover:text-[#2F5233] transition-colors duration-200"
                  data-testid={`nav-${link.label.toLowerCase()}`}
                >
                  {link.label}
                </button>
              ))}
            </div>
            <Button
              onClick={() => navigate("/chat")}
              className="bg-[#2F5233] hover:bg-[#1E3524] text-white rounded-full px-6 shadow-md transition-transform duration-200 hover:-translate-y-0.5"
              data-testid="nav-start-btn"
            >
              Start Practicing
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden" data-testid="hero-section">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24 lg:py-32">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            {/* Left - Text */}
            <div className="space-y-8 animate-fade-in">
              <Badge variant="outline" className="border-[#2F5233]/20 text-[#2F5233] bg-[#2F5233]/5 px-4 py-1.5 text-sm font-medium rounded-full">
                AI-Powered Language Tutor  &middot;  50+ Languages
              </Badge>
              <h1
                className="text-4xl sm:text-5xl lg:text-6xl tracking-tight leading-tight text-[#1A1A1A]"
                style={{ fontFamily: 'Playfair Display, serif' }}
              >
                Speak any language<br />
                <span className="text-[#2F5233]">with confidence</span>
              </h1>
              <p className="text-base md:text-lg leading-relaxed text-[#4A4A4A] max-w-lg">
                Your personal AI tutor that listens, corrects, and helps you practice
                real conversations in 50+ languages. Voice-in, voice-out. No judgment, just progress.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button
                  onClick={() => navigate("/chat")}
                  className="bg-[#2F5233] hover:bg-[#1E3524] text-white rounded-full px-8 py-6 text-base shadow-md transition-transform duration-200 hover:-translate-y-0.5"
                  data-testid="hero-start-btn"
                >
                  Start a conversation
                  <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
                <Button
                  variant="outline"
                  onClick={() => navigate("/dashboard")}
                  className="rounded-full px-8 py-6 text-base border-gray-200 hover:bg-gray-50 text-gray-700"
                  data-testid="hero-dashboard-btn"
                >
                  View Dashboard
                </Button>
              </div>
            </div>

            {/* Right - Image */}
            <div className="relative hidden lg:block animate-fade-in" style={{ animationDelay: '0.2s' }}>
              <div className="relative rounded-2xl overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.08)]">
                <img
                  src="https://images.pexels.com/photos/6593768/pexels-photo-6593768.jpeg"
                  alt="Woman learning language on phone"
                  className="w-full h-[500px] object-cover"
                  data-testid="hero-image"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
              </div>
              {/* Floating stat card */}
              <div className="absolute -bottom-4 -left-4 bg-white rounded-xl p-4 shadow-[0_8px_30px_rgb(0,0,0,0.08)] border border-gray-100 animate-slide-up" style={{ animationDelay: '0.5s' }}>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#2F5233]/10 flex items-center justify-center">
                    <Sparkles className="w-5 h-5 text-[#2F5233]" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-[#1A1A1A]">Smart Feedback</p>
                    <p className="text-xs text-[#71717A]">Grammar + Vocabulary + Pronunciation</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="bg-[#F0F4F8] py-20 md:py-28" data-testid="features-section">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <p className="text-sm uppercase tracking-wider text-[#71717A] mb-3" style={{ fontFamily: 'DM Sans, sans-serif' }}>
              How it works
            </p>
            <h2 className="text-3xl md:text-4xl tracking-tight text-[#1A1A1A]" style={{ fontFamily: 'Playfair Display, serif' }}>
              Your AI tutor has the tools
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {FEATURES.map((feature, idx) => (
              <div
                key={feature.title}
                className="bg-white border border-gray-100 rounded-xl p-8 animate-slide-up scenario-card"
                style={{ animationDelay: `${idx * 0.1}s` }}
                data-testid={`feature-card-${idx}`}
              >
                <div className="w-12 h-12 rounded-xl bg-[#2F5233]/10 flex items-center justify-center mb-6">
                  <feature.icon className="w-6 h-6 text-[#2F5233]" />
                </div>
                <h3 className="text-xl font-semibold mb-3 text-[#1A1A1A]" style={{ fontFamily: 'Playfair Display, serif' }}>
                  {feature.title}
                </h3>
                <p className="text-[#4A4A4A] leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Scenarios Preview */}
      <section className="py-20 md:py-28" data-testid="scenarios-section">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between mb-12">
            <div>
              <p className="text-sm uppercase tracking-wider text-[#71717A] mb-3">Practice Scenarios</p>
              <h2 className="text-3xl md:text-4xl tracking-tight text-[#1A1A1A]" style={{ fontFamily: 'Playfair Display, serif' }}>
                Real-world practice
              </h2>
            </div>
            <Button
              variant="ghost"
              onClick={() => navigate("/chat")}
              className="text-[#2F5233] hover:text-[#1E3524] hidden md:flex items-center gap-1"
              data-testid="view-all-scenarios-btn"
            >
              View all <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {SCENARIOS_PREVIEW.map((scenario, idx) => (
              <button
                key={scenario.title}
                onClick={() => navigate("/chat")}
                className="group text-left bg-white border border-gray-100 rounded-xl overflow-hidden scenario-card animate-slide-up"
                style={{ animationDelay: `${idx * 0.1}s` }}
                data-testid={`scenario-card-${idx}`}
              >
                <div className="relative h-48 overflow-hidden">
                  <img
                    src={scenario.image}
                    alt={scenario.title}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                  <div className="absolute bottom-4 left-4">
                    <div className="w-8 h-8 rounded-lg bg-white/20 backdrop-blur-sm flex items-center justify-center">
                      <scenario.icon className="w-4 h-4 text-white" />
                    </div>
                  </div>
                </div>
                <div className="p-5">
                  <h3 className="font-semibold text-[#1A1A1A] mb-1" style={{ fontFamily: 'Playfair Display, serif' }}>
                    {scenario.title}
                  </h3>
                  <p className="text-sm text-[#71717A]">{scenario.description}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-[#2F5233] py-20 md:py-24" data-testid="cta-section">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl tracking-tight text-white mb-6" style={{ fontFamily: 'Playfair Display, serif' }}>
            Ready to improve your English?
          </h2>
          <p className="text-white/70 text-base md:text-lg mb-8 max-w-xl mx-auto">
            Start a conversation with your AI tutor now. It's like having a patient friend who never gets tired of helping.
          </p>
          <Button
            onClick={() => navigate("/chat")}
            className="bg-white text-[#2F5233] hover:bg-gray-100 rounded-full px-8 py-6 text-base shadow-lg transition-transform duration-200 hover:-translate-y-0.5"
            data-testid="cta-start-btn"
          >
            Begin your first lesson
            <ArrowRight className="ml-2 w-4 h-4" />
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t border-gray-100" data-testid="footer">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-[#2F5233] flex items-center justify-center">
              <span className="text-white text-xs font-bold" style={{ fontFamily: 'Playfair Display, serif' }}>L</span>
            </div>
            <span className="text-sm text-[#71717A]">LinguaFlow</span>
          </div>
          <p className="text-sm text-[#71717A]">AI-powered language learning</p>
        </div>
      </footer>
    </div>
  );
}
