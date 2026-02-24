import { Search, Check, ChevronDown } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

export const LanguagePicker = ({ label, labelClass, btnClass, value, languages, onSelect, testIdPrefix }) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const ref = useRef(null);
  const allLangs = [...(languages.popular || []), ...(languages.others || [])];
  const selected = allLangs.find(l => l.code === value);

  const filtered = allLangs.filter(l =>
    !search || l.name.toLowerCase().includes(search.toLowerCase()) || l.native.toLowerCase().includes(search.toLowerCase())
  );

  useEffect(() => {
    const handleClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all duration-200 ${btnClass}`}
        data-testid={`${testIdPrefix}-lang-picker-btn`}
      >
        <span className={`text-[10px] uppercase tracking-wider w-12 flex-shrink-0 ${labelClass}`}>{label}</span>
        <span className="flex-1 text-left truncate font-medium">{selected?.name || "English"}</span>
        <ChevronDown className={`w-3 h-3 opacity-50 transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.98 }}
            transition={{ duration: 0.15 }}
            className="absolute top-full left-0 right-0 mt-1 rounded-xl border border-slate-200 shadow-xl z-[100] max-h-64 overflow-hidden"
            style={{ backgroundColor: '#ffffff' }}
            data-testid={`${testIdPrefix}-lang-dropdown`}
          >
            <div className="p-2 border-b border-slate-100">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                <input
                  type="text" value={search} onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search..." autoFocus
                  className="w-full pl-8 pr-3 py-1.5 text-sm rounded-lg bg-slate-50 text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-300 border border-slate-100"
                  data-testid={`${testIdPrefix}-lang-search`}
                />
              </div>
            </div>
            <div className="overflow-y-auto max-h-48">
              {filtered.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => { onSelect(lang.code); setOpen(false); setSearch(""); }}
                  className={`w-full flex items-center gap-2 px-3 py-2 text-sm transition-colors duration-100 ${
                    value === lang.code
                      ? "bg-indigo-50 text-indigo-700 font-medium"
                      : "text-slate-600 hover:bg-indigo-50/50"
                  }`}
                  data-testid={`${testIdPrefix}-lang-${lang.code}`}
                >
                  <span className="flex-1 text-left">{lang.name}</span>
                  <span className="text-xs text-slate-400">{lang.native}</span>
                  {value === lang.code && <Check className="w-3.5 h-3.5 text-indigo-500" />}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
