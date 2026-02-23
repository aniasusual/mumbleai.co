import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  BookOpen,
  ArrowLeft,
  MessageCircle,
  BarChart3,
  Plus,
  Trash2,
  Search,
  X
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

  useEffect(() => {
    loadVocabulary();
  }, []);

  const loadVocabulary = async () => {
    try {
      const res = await listVocabulary();
      setVocabulary(res.data);
    } catch (e) {
      console.error("Failed to load vocabulary", e);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!newWord.word.trim() || !newWord.definition.trim()) {
      toast.error("Word and definition are required");
      return;
    }
    try {
      const res = await saveVocabulary(newWord);
      setVocabulary(prev => [res.data, ...prev]);
      setNewWord({ word: "", definition: "", example: "" });
      setAddOpen(false);
      toast.success("Word saved to vocabulary!");
    } catch (e) {
      toast.error("Failed to save word");
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteVocabulary(id);
      setVocabulary(prev => prev.filter(v => v.id !== id));
      toast.success("Word removed");
    } catch (e) {
      toast.error("Failed to delete");
    }
  };

  const filtered = vocabulary.filter(v =>
    v.word.toLowerCase().includes(search.toLowerCase()) ||
    v.definition.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#F0F4F8] noise-bg" data-testid="vocabulary-page">
      {/* Header */}
      <nav className="glass-header sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <button onClick={() => navigate("/")} className="p-1 hover:bg-gray-100 rounded-lg transition-colors duration-150" data-testid="back-home-btn">
                <ArrowLeft className="w-5 h-5 text-gray-500" />
              </button>
              <div className="flex items-center gap-2">
                <WaveformLogo size={28} className="text-[#2F5233]" />
                <span className="font-medium" style={{ fontFamily: 'Sora, sans-serif' }}>Vocabulary</span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                onClick={() => navigate("/dashboard")}
                className="rounded-full border-gray-200 text-gray-700 text-sm"
                data-testid="nav-dashboard-btn"
              >
                <BarChart3 className="w-4 h-4 mr-1.5" /> Dashboard
              </Button>
              <Button
                onClick={() => navigate("/chat")}
                className="bg-[#2F5233] hover:bg-[#1E3524] text-white rounded-full text-sm shadow-md transition-transform duration-200 hover:-translate-y-0.5"
                data-testid="nav-practice-btn"
              >
                <MessageCircle className="w-4 h-4 mr-1.5" /> Practice
              </Button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        {/* Title + Actions */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl md:text-4xl tracking-tight text-[#1A1A1A] mb-2" style={{ fontFamily: 'Sora, sans-serif' }}>
              Your Vocabulary
            </h1>
            <p className="text-base text-[#71717A]">
              {vocabulary.length} {vocabulary.length === 1 ? "word" : "words"} saved
            </p>
          </div>
          <div className="flex items-center gap-3">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search words..."
                className="pl-9 pr-8 py-2 text-sm rounded-full border border-gray-200 bg-white focus:border-[#2F5233] focus:outline-none w-56 transition-colors duration-200"
                data-testid="vocab-search-input"
              />
              {search && (
                <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2">
                  <X className="w-3.5 h-3.5 text-gray-400" />
                </button>
              )}
            </div>

            {/* Add Word Dialog */}
            <Dialog open={addOpen} onOpenChange={setAddOpen}>
              <DialogTrigger asChild>
                <Button
                  className="bg-[#2F5233] hover:bg-[#1E3524] text-white rounded-full text-sm shadow-md transition-transform duration-200 hover:-translate-y-0.5"
                  data-testid="add-word-btn"
                >
                  <Plus className="w-4 h-4 mr-1.5" /> Add Word
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md" data-testid="add-word-dialog">
                <DialogHeader>
                  <DialogTitle style={{ fontFamily: 'Sora, sans-serif' }}>Add New Word</DialogTitle>
                  <DialogDescription>Save a word to your vocabulary notebook</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div>
                    <Label htmlFor="word" className="text-sm font-medium">Word</Label>
                    <Input
                      id="word"
                      value={newWord.word}
                      onChange={(e) => setNewWord({ ...newWord, word: e.target.value })}
                      placeholder="e.g., Serendipity"
                      className="mt-1.5 rounded-lg"
                      data-testid="add-word-input"
                    />
                  </div>
                  <div>
                    <Label htmlFor="definition" className="text-sm font-medium">Definition</Label>
                    <Input
                      id="definition"
                      value={newWord.definition}
                      onChange={(e) => setNewWord({ ...newWord, definition: e.target.value })}
                      placeholder="The occurrence of events by chance in a happy way"
                      className="mt-1.5 rounded-lg"
                      data-testid="add-definition-input"
                    />
                  </div>
                  <div>
                    <Label htmlFor="example" className="text-sm font-medium">Example sentence (optional)</Label>
                    <Input
                      id="example"
                      value={newWord.example}
                      onChange={(e) => setNewWord({ ...newWord, example: e.target.value })}
                      placeholder="Finding that bookshop was pure serendipity."
                      className="mt-1.5 rounded-lg"
                      data-testid="add-example-input"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <DialogClose asChild>
                    <Button variant="outline" className="rounded-full" data-testid="cancel-add-word-btn">Cancel</Button>
                  </DialogClose>
                  <Button
                    onClick={handleSave}
                    className="bg-[#2F5233] hover:bg-[#1E3524] text-white rounded-full"
                    data-testid="save-word-btn"
                  >
                    Save Word
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Vocabulary Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-[#2F5233] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filtered.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((item, idx) => (
              <div
                key={item.id}
                className="group bg-white border border-gray-100 rounded-xl p-5 scenario-card animate-slide-up"
                style={{ animationDelay: `${idx * 0.05}s` }}
                data-testid={`vocab-card-${item.id}`}
              >
                <div className="flex items-start justify-between mb-3">
                  <h3 className="text-lg font-semibold text-[#1A1A1A] capitalize" style={{ fontFamily: 'Sora, sans-serif' }}>
                    {item.word}
                  </h3>
                  <button
                    onClick={() => handleDelete(item.id)}
                    className="p-1.5 hover:bg-red-50 rounded-lg opacity-40 hover:opacity-100 transition-opacity duration-150"
                    data-testid={`delete-vocab-${item.id}`}
                  >
                    <Trash2 className="w-4 h-4 text-red-400" />
                  </button>
                </div>
                <p className="text-sm text-[#4A4A4A] leading-relaxed mb-3">{item.definition}</p>
                {item.example && (
                  <p className="text-sm text-[#71717A] italic border-l-2 border-[#2F5233]/20 pl-3">
                    "{item.example}"
                  </p>
                )}
                <div className="mt-3 pt-3 border-t border-gray-50">
                  <span className="text-xs text-[#71717A]">
                    Saved {new Date(item.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : vocabulary.length > 0 ? (
          <div className="text-center py-20" data-testid="no-search-results">
            <Search className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-[#71717A]">No words match "{search}"</p>
          </div>
        ) : (
          <div className="text-center py-20" data-testid="empty-vocabulary">
            <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-[#1A1A1A] mb-2" style={{ fontFamily: 'Sora, sans-serif' }}>
              Your vocabulary is empty
            </h3>
            <p className="text-sm text-[#71717A] mb-6 max-w-sm mx-auto">
              Start adding words you learn during practice sessions or add them manually.
            </p>
            <div className="flex gap-3 justify-center">
              <Button
                onClick={() => setAddOpen(true)}
                className="bg-[#2F5233] hover:bg-[#1E3524] text-white rounded-full"
                data-testid="empty-add-word-btn"
              >
                <Plus className="w-4 h-4 mr-1.5" /> Add First Word
              </Button>
              <Button
                variant="outline"
                onClick={() => navigate("/chat")}
                className="rounded-full border-gray-200"
                data-testid="empty-practice-btn"
              >
                Practice Instead
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
