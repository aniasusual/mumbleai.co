import { useState, useEffect } from "react";
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
    <div className="min-h-screen" style={{ background: "#0f172a" }} data-testid="vocabulary-page">
      <nav className="sticky top-0 z-50" style={{ background: "rgba(15,23,42,0.85)", backdropFilter: "blur(16px)", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <button onClick={() => navigate("/chat")} className="p-1.5 hover:bg-white/5 rounded-lg transition-colors" data-testid="back-home-btn">
                <ArrowLeft className="w-5 h-5 text-slate-400" />
              </button>
              <div className="flex items-center gap-2">
                <WaveformLogo size={28} className="text-indigo-400" />
                <span className="font-medium text-white" style={{ fontFamily: 'Sora, sans-serif' }}>Vocabulary</span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="outline" onClick={() => navigate("/dashboard")}
                className="rounded-full border-white/10 bg-white/5 text-slate-300 hover:bg-white/10 text-sm" data-testid="nav-dashboard-btn">
                <BarChart3 className="w-4 h-4 mr-1.5" /> Dashboard
              </Button>
              <Button onClick={() => navigate("/chat")}
                className="text-white rounded-full text-sm"
                style={{ background: "linear-gradient(135deg, #4338ca, #6366f1)", boxShadow: "0 0 16px rgba(99,102,241,0.3)" }}
                data-testid="nav-practice-btn">
                <MessageCircle className="w-4 h-4 mr-1.5" /> Practice
              </Button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
            <h1 className="text-3xl md:text-4xl tracking-tight text-white font-bold mb-2" style={{ fontFamily: 'Sora, sans-serif' }}>Your Vocabulary</h1>
            <p className="text-base text-slate-400">{vocabulary.length} {vocabulary.length === 1 ? "word" : "words"} saved</p>
          </motion.div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
                placeholder="Search words..."
                className="pl-9 pr-8 py-2 text-sm rounded-full border border-white/10 bg-white/5 text-slate-200 placeholder:text-slate-500 focus:border-indigo-500/40 focus:outline-none w-56 transition-colors"
                data-testid="vocab-search-input" />
              {search && (
                <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2">
                  <X className="w-3.5 h-3.5 text-slate-500" />
                </button>
              )}
            </div>
            <Dialog open={addOpen} onOpenChange={setAddOpen}>
              <DialogTrigger asChild>
                <Button className="text-white rounded-full text-sm"
                  style={{ background: "linear-gradient(135deg, #4338ca, #6366f1)" }} data-testid="add-word-btn">
                  <Plus className="w-4 h-4 mr-1.5" /> Add Word
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md bg-[#1e293b] border-white/10 text-white" data-testid="add-word-dialog">
                <DialogHeader>
                  <DialogTitle className="text-white" style={{ fontFamily: 'Sora, sans-serif' }}>Add New Word</DialogTitle>
                  <DialogDescription className="text-slate-400">Save a word to your vocabulary notebook</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div>
                    <Label htmlFor="word" className="text-sm font-medium text-slate-300">Word</Label>
                    <Input id="word" value={newWord.word} onChange={(e) => setNewWord({ ...newWord, word: e.target.value })}
                      placeholder="e.g., Serendipity" className="mt-1.5 rounded-lg bg-white/5 border-white/10 text-white placeholder:text-slate-500" data-testid="add-word-input" />
                  </div>
                  <div>
                    <Label htmlFor="definition" className="text-sm font-medium text-slate-300">Definition</Label>
                    <Input id="definition" value={newWord.definition} onChange={(e) => setNewWord({ ...newWord, definition: e.target.value })}
                      placeholder="The occurrence of events by chance in a happy way"
                      className="mt-1.5 rounded-lg bg-white/5 border-white/10 text-white placeholder:text-slate-500" data-testid="add-definition-input" />
                  </div>
                  <div>
                    <Label htmlFor="example" className="text-sm font-medium text-slate-300">Example sentence (optional)</Label>
                    <Input id="example" value={newWord.example} onChange={(e) => setNewWord({ ...newWord, example: e.target.value })}
                      placeholder="Finding that bookshop was pure serendipity."
                      className="mt-1.5 rounded-lg bg-white/5 border-white/10 text-white placeholder:text-slate-500" data-testid="add-example-input" />
                  </div>
                </div>
                <DialogFooter>
                  <DialogClose asChild>
                    <Button variant="outline" className="rounded-full border-white/10 text-slate-300 hover:bg-white/5" data-testid="cancel-add-word-btn">Cancel</Button>
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
                className="group rounded-xl p-5 border border-white/8 hover:border-indigo-500/20 transition-all duration-200"
                style={{ background: "rgba(255,255,255,0.03)" }}
                initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.04 }}
                whileHover={{ y: -2 }}
                data-testid={`vocab-card-${item.id}`}
              >
                <div className="flex items-start justify-between mb-3">
                  <h3 className="text-lg font-semibold text-white capitalize" style={{ fontFamily: 'Sora, sans-serif' }}>{item.word}</h3>
                  <button onClick={() => handleDelete(item.id)}
                    className="p-1.5 hover:bg-red-500/10 rounded-lg opacity-40 hover:opacity-100 transition-all"
                    data-testid={`delete-vocab-${item.id}`}>
                    <Trash2 className="w-4 h-4 text-red-400" />
                  </button>
                </div>
                <p className="text-sm text-slate-300 leading-relaxed mb-3">{item.definition}</p>
                {item.example && (
                  <p className="text-sm text-slate-500 italic border-l-2 border-indigo-500/30 pl-3">"{item.example}"</p>
                )}
                <div className="mt-3 pt-3" style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
                  <span className="text-xs text-slate-500">Saved {new Date(item.created_at).toLocaleDateString()}</span>
                </div>
              </motion.div>
            ))}
          </div>
        ) : vocabulary.length > 0 ? (
          <div className="text-center py-20" data-testid="no-search-results">
            <Search className="w-12 h-12 text-slate-600 mx-auto mb-4" />
            <p className="text-slate-400">No words match "{search}"</p>
          </div>
        ) : (
          <div className="text-center py-20" data-testid="empty-vocabulary">
            <BookOpen className="w-16 h-16 text-slate-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2" style={{ fontFamily: 'Sora, sans-serif' }}>Your vocabulary is empty</h3>
            <p className="text-sm text-slate-400 mb-6 max-w-sm mx-auto">Start adding words you learn during practice sessions or add them manually.</p>
            <div className="flex gap-3 justify-center">
              <Button onClick={() => setAddOpen(true)} className="text-white rounded-full"
                style={{ background: "linear-gradient(135deg, #4338ca, #6366f1)" }} data-testid="empty-add-word-btn">
                <Plus className="w-4 h-4 mr-1.5" /> Add First Word
              </Button>
              <Button variant="outline" onClick={() => navigate("/chat")}
                className="rounded-full border-white/10 text-slate-300 hover:bg-white/5" data-testid="empty-practice-btn">Practice Instead</Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
