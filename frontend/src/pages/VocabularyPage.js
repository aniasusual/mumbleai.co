import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
  DialogTrigger, DialogFooter, DialogClose
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  BookOpen, ArrowLeft, MessageCircle, BarChart3,
  Plus, Trash2, Search, X
} from "lucide-react";
import { listVocabulary, saveVocabulary, deleteVocabulary } from "@/lib/api";
import { WaveformLogo } from "@/components/WaveformLogo";

/** Floating mesh blobs */
function MeshGradient() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <motion.div className="absolute w-[450px] h-[450px] rounded-full"
        style={{ top: "10%", left: "-5%", background: "radial-gradient(circle, rgba(236,72,153,0.12) 0%, transparent 65%)" }}
        animate={{ x: [0, 25, 0], y: [0, -20, 0] }}
        transition={{ duration: 16, repeat: Infinity, ease: "easeInOut" }} />
      <motion.div className="absolute w-[400px] h-[400px] rounded-full"
        style={{ bottom: "-5%", right: "10%", background: "radial-gradient(circle, rgba(16,185,129,0.1) 0%, transparent 65%)" }}
        animate={{ x: [0, -30, 0], y: [0, 20, 0] }}
        transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }} />
    </div>
  );
}

const CHARS = ["ñ", "ü", "ш", "한", "你", "ê"];

function FloatingChars() {
  const items = useMemo(() => CHARS.map((c, i) => ({
    char: c, x: 10 + (i * 15) % 75, y: 8 + ((i * 16) % 80),
    size: 16 + (i % 3) * 5, dur: 11 + (i % 4) * 3,
  })), []);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {items.map((item, i) => (
        <motion.span key={i} className="absolute font-bold select-none"
          style={{ left: `${item.x}%`, top: `${item.y}%`, fontSize: item.size, color: "rgba(139,92,246,0.05)" }}
          animate={{ y: [-6, 6, -6], x: [-3, 3, -3] }}
          transition={{ duration: item.dur, repeat: Infinity, ease: "easeInOut", delay: i * 0.4 }}
        >{item.char}</motion.span>
      ))}
    </div>
  );
}

/** Colorful vocabulary card backgrounds */
const CARD_COLORS = ["#d1fae5", "#bfdbfe", "#e9d5ff", "#fed7aa", "#fecdd3", "#ccfbf1"];

export default function VocabularyPage() {
  const navigate = useNavigate();
  const [vocabulary, setVocabulary] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [addOpen, setAddOpen] = useState(false);
  const [newWord, setNewWord] = useState({ word: "", definition: "", example: "" });

  useEffect(() => { loadVocabulary(); }, []);

  const loadVocabulary = async () => {
    try {
      const res = await listVocabulary();
      setVocabulary(res.data);
    } catch (e) { console.error("Failed to load vocabulary", e); }
    finally { setLoading(false); }
  };

  const handleSave = async () => {
    if (!newWord.word.trim() || !newWord.definition.trim()) { toast.error("Word and definition are required"); return; }
    try {
      const res = await saveVocabulary(newWord);
      setVocabulary(prev => [res.data, ...prev]);
      setNewWord({ word: "", definition: "", example: "" });
      setAddOpen(false);
      toast.success("Word saved to vocabulary!");
    } catch (e) { toast.error("Failed to save word"); }
  };

  const handleDelete = async (id) => {
    try {
      await deleteVocabulary(id);
      setVocabulary(prev => prev.filter(v => v.id !== id));
      toast.success("Word removed");
    } catch (e) { toast.error("Failed to delete"); }
  };

  const filtered = vocabulary.filter(v =>
    v.word.toLowerCase().includes(search.toLowerCase()) ||
    v.definition.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen relative overflow-x-hidden" style={{ background: "#f8f7f4" }} data-testid="vocabulary-page">
      <MeshGradient />
      <FloatingChars />

      <nav className="sticky top-0 z-50" style={{ background: "rgba(248,247,244,0.88)", backdropFilter: "blur(16px)", borderBottom: "1px solid rgba(0,0,0,0.06)", paddingTop: "env(safe-area-inset-top, 0px)" }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <button onClick={() => navigate("/chat")} className="p-1.5 hover:bg-indigo-50 rounded-lg transition-colors" data-testid="back-home-btn">
                <ArrowLeft className="w-5 h-5 text-slate-400" />
              </button>
              <div className="flex items-center gap-2">
                <WaveformLogo size={28} className="text-indigo-600" />
                <span className="font-semibold text-slate-800" style={{ fontFamily: 'Sora, sans-serif' }}>Vocabulary</span>
              </div>
            </div>
            <div className="flex items-center gap-2 sm:gap-3">
              <Button variant="outline" onClick={() => navigate("/dashboard")}
                className="rounded-full border-slate-200 text-slate-600 hover:border-indigo-300 hover:text-indigo-600 text-sm transition-all px-2.5 sm:px-4" data-testid="nav-dashboard-btn">
                <BarChart3 className="w-4 h-4 sm:mr-1.5" /> <span className="hidden sm:inline">Dashboard</span>
              </Button>
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Button onClick={() => navigate("/chat")}
                  className="text-white rounded-full text-sm shadow-[0_2px_12px_rgba(99,102,241,0.3)] hover:shadow-[0_4px_20px_rgba(99,102,241,0.4)] transition-shadow px-2.5 sm:px-4"
                  style={{ background: "linear-gradient(135deg, #4338ca, #6366f1)" }}
                  data-testid="nav-practice-btn">
                  <MessageCircle className="w-4 h-4 sm:mr-1.5" /> <span className="hidden sm:inline">Practice</span>
                </Button>
              </motion.div>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12 relative z-10">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <h1 className="text-3xl md:text-4xl tracking-tight text-slate-900 font-bold mb-2" style={{ fontFamily: 'Sora, sans-serif' }}>Your Vocabulary</h1>
            <p className="text-base text-slate-500">{vocabulary.length} {vocabulary.length === 1 ? "word" : "words"} saved</p>
          </motion.div>
          <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto">
            <div className="relative flex-1 sm:flex-none">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
                placeholder="Search words..."
                className="pl-9 pr-8 py-2 text-sm rounded-full border border-slate-200 bg-white text-slate-700 placeholder:text-slate-400 focus:border-indigo-300 focus:outline-none w-full sm:w-56 transition-colors shadow-sm"
                data-testid="vocab-search-input" />
              {search && (
                <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2">
                  <X className="w-3.5 h-3.5 text-slate-400" />
                </button>
              )}
            </div>
            <Dialog open={addOpen} onOpenChange={setAddOpen}>
              <DialogTrigger asChild>
                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <Button className="text-white rounded-full text-sm shadow-[0_2px_12px_rgba(99,102,241,0.3)]"
                    style={{ background: "linear-gradient(135deg, #4338ca, #6366f1)" }} data-testid="add-word-btn">
                    <Plus className="w-4 h-4 mr-1.5" /> Add Word
                  </Button>
                </motion.div>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md" data-testid="add-word-dialog">
                <DialogHeader>
                  <DialogTitle style={{ fontFamily: 'Sora, sans-serif' }}>Add New Word</DialogTitle>
                  <DialogDescription>Save a word to your vocabulary notebook</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div>
                    <Label htmlFor="word" className="text-sm font-medium">Word</Label>
                    <Input id="word" value={newWord.word} onChange={(e) => setNewWord({ ...newWord, word: e.target.value })}
                      placeholder="e.g., Serendipity" className="mt-1.5 rounded-lg" data-testid="add-word-input" />
                  </div>
                  <div>
                    <Label htmlFor="definition" className="text-sm font-medium">Definition</Label>
                    <Input id="definition" value={newWord.definition} onChange={(e) => setNewWord({ ...newWord, definition: e.target.value })}
                      placeholder="The occurrence of events by chance in a happy way" className="mt-1.5 rounded-lg" data-testid="add-definition-input" />
                  </div>
                  <div>
                    <Label htmlFor="example" className="text-sm font-medium">Example sentence (optional)</Label>
                    <Input id="example" value={newWord.example} onChange={(e) => setNewWord({ ...newWord, example: e.target.value })}
                      placeholder="Finding that bookshop was pure serendipity." className="mt-1.5 rounded-lg" data-testid="add-example-input" />
                  </div>
                </div>
                <DialogFooter>
                  <DialogClose asChild>
                    <Button variant="outline" className="rounded-full" data-testid="cancel-add-word-btn">Cancel</Button>
                  </DialogClose>
                  <Button onClick={handleSave} className="text-white rounded-full"
                    style={{ background: "linear-gradient(135deg, #4338ca, #6366f1)" }} data-testid="save-word-btn">Save Word</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filtered.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((item, idx) => (
              <motion.div key={item.id}
                className="group rounded-2xl p-5 relative overflow-hidden"
                style={{ background: CARD_COLORS[idx % CARD_COLORS.length] }}
                initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.04, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                whileHover={{ y: -3, boxShadow: "0 8px 30px rgba(0,0,0,0.08)" }}
                data-testid={`vocab-card-${item.id}`}
              >
                <div className="flex items-start justify-between mb-3">
                  <h3 className="text-lg font-semibold text-slate-800 capitalize" style={{ fontFamily: 'Sora, sans-serif' }}>{item.word}</h3>
                  <button onClick={() => handleDelete(item.id)}
                    className="p-1.5 hover:bg-white/50 rounded-lg opacity-40 hover:opacity-100 transition-all"
                    data-testid={`delete-vocab-${item.id}`}>
                    <Trash2 className="w-4 h-4 text-red-400" />
                  </button>
                </div>
                <p className="text-sm text-slate-700/80 leading-relaxed mb-3">{item.definition}</p>
                {item.example && (
                  <p className="text-sm text-slate-600/60 italic border-l-2 border-slate-400/20 pl-3">"{item.example}"</p>
                )}
                <div className="mt-3 pt-3" style={{ borderTop: "1px solid rgba(0,0,0,0.06)" }}>
                  <span className="text-xs text-slate-500/60">Saved {new Date(item.created_at).toLocaleDateString()}</span>
                </div>
              </motion.div>
            ))}
          </div>
        ) : vocabulary.length > 0 ? (
          <div className="text-center py-20" data-testid="no-search-results">
            <Search className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-400">No words match "{search}"</p>
          </div>
        ) : (
          <div className="text-center py-20" data-testid="empty-vocabulary">
            <BookOpen className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-slate-800 mb-2" style={{ fontFamily: 'Sora, sans-serif' }}>Your vocabulary is empty</h3>
            <p className="text-sm text-slate-400 mb-6 max-w-sm mx-auto">Start adding words you learn during practice sessions or add them manually.</p>
            <div className="flex gap-3 justify-center">
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Button onClick={() => setAddOpen(true)} className="text-white rounded-full"
                  style={{ background: "linear-gradient(135deg, #4338ca, #6366f1)" }} data-testid="empty-add-word-btn">
                  <Plus className="w-4 h-4 mr-1.5" /> Add First Word
                </Button>
              </motion.div>
              <Button variant="outline" onClick={() => navigate("/chat")}
                className="rounded-full border-slate-200" data-testid="empty-practice-btn">Practice Instead</Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
