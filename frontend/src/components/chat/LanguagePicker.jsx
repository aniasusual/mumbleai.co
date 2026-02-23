import { Search, Check, ChevronDown } from "lucide-react";
import { useState } from "react";

/**
 * Reusable language picker dropdown — used for both "I speak" and "Learn" pickers.
 * DRY: replaces two duplicated 40-line blocks.
 */
export const LanguagePicker = ({ label, labelClass, btnClass, value, languages, onSelect, testIdPrefix }) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const allLangs = [...(languages.popular || []), ...(languages.others || [])];
  const selected = allLangs.find(l => l.code === value);

  const filtered = allLangs.filter(l =>
    !search || l.name.toLowerCase().includes(search.toLowerCase()) || l.native.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors duration-150 ${btnClass}`}
        data-testid={`${testIdPrefix}-lang-picker-btn`}
      >
        <span className={`text-[10px] uppercase tracking-wider w-12 flex-shrink-0 ${labelClass}`}>{label}</span>
        <span className="flex-1 text-left truncate font-medium">{selected?.name || "English"}</span>
        <ChevronDown className={`w-3 h-3 opacity-50 transition-transform duration-150 ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-xl border border-gray-200 shadow-lg z-50 max-h-64 overflow-hidden" data-testid={`${testIdPrefix}-lang-dropdown`}>
          <div className="p-2 border-b border-gray-100">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
              <input
                type="text" value={search} onChange={(e) => setSearch(e.target.value)}
                placeholder="Search..." autoFocus
                className="w-full pl-8 pr-3 py-1.5 text-sm rounded-lg border border-gray-100 bg-gray-50 focus:outline-none focus:border-[#2F5233]"
                data-testid={`${testIdPrefix}-lang-search`}
              />
            </div>
          </div>
          <div className="overflow-y-auto max-h-48">
            {filtered.map((lang) => (
              <button
                key={lang.code}
                onClick={() => { onSelect(lang.code); setOpen(false); setSearch(""); }}
                className={`w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-[#2F5233]/5 transition-colors duration-100 ${value === lang.code ? "bg-[#2F5233]/10 text-[#2F5233] font-medium" : "text-gray-700"}`}
                data-testid={`${testIdPrefix}-lang-${lang.code}`}
              >
                <span className="flex-1 text-left">{lang.name}</span>
                <span className="text-xs text-gray-400">{lang.native}</span>
                {value === lang.code && <Check className="w-3.5 h-3.5 text-[#2F5233]" />}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
