import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, CheckCircle2, Wrench, ChevronDown, ChevronRight } from "lucide-react";

export const ToolActivityLive = ({ events }) => {
  if (!events || events.length === 0) return null;

  const tools = [];
  const toolMap = {};

  for (const evt of events) {
    if (evt.type === "thinking" && tools.length === 0) {
      if (!toolMap["__thinking"]) {
        toolMap["__thinking"] = { id: "__thinking", label: "Thinking", status: "running", substeps: [] };
        tools.push(toolMap["__thinking"]);
      }
    }
    if (evt.type === "tool_start") {
      if (toolMap["__thinking"]) toolMap["__thinking"].status = "done";
      if (!toolMap[evt.tool]) {
        toolMap[evt.tool] = { id: evt.tool, label: evt.label, status: "running", substeps: [] };
        tools.push(toolMap[evt.tool]);
      } else {
        toolMap[evt.tool].status = "running";
      }
    }
    if (evt.type === "tool_end" && toolMap[evt.tool]) {
      toolMap[evt.tool].status = "done";
    }
    if (evt.type === "substep" && toolMap[evt.parent]) {
      toolMap[evt.parent].substeps.push({ name: evt.substep, label: evt.label });
    }
  }

  return (
    <motion.div
      className="flex items-start gap-3 px-5 py-2"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 bg-indigo-50 border border-indigo-100">
        <Wrench className="w-3.5 h-3.5 text-indigo-500" />
      </div>
      <div className="flex flex-col gap-1.5 min-w-[200px]" data-testid="tool-activity-live">
        {tools.map((tool) => (
          <ToolRow key={tool.id} tool={tool} />
        ))}
      </div>
    </motion.div>
  );
};

const ToolRow = ({ tool }) => {
  const isRunning = tool.status === "running";
  const [expanded, setExpanded] = useState(true);
  const hasSubsteps = tool.substeps.length > 0;

  return (
    <div className="text-xs">
      <div className="flex items-center gap-2 py-1">
        {isRunning ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-500 flex-shrink-0" />
        ) : (
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
        )}
        <span className={`font-medium ${isRunning ? "text-indigo-600" : "text-slate-400"}`}>
          {tool.label}
        </span>
        {isRunning && <span className="text-[10px] text-indigo-400 animate-pulse">running</span>}
        {hasSubsteps && (
          <button onClick={() => setExpanded(!expanded)} className="p-0.5 rounded hover:bg-indigo-50">
            {expanded ? <ChevronDown className="w-3 h-3 text-slate-400" /> : <ChevronRight className="w-3 h-3 text-slate-400" />}
          </button>
        )}
      </div>
      {hasSubsteps && expanded && (
        <div className="ml-6 border-l-2 border-indigo-100 pl-3 space-y-0.5">
          {tool.substeps.map((sub, i) => (
            <motion.div
              key={i}
              className="flex items-center gap-1.5 py-0.5 text-[11px] text-slate-400"
              initial={{ opacity: 0, x: -4 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <CheckCircle2 className="w-2.5 h-2.5 text-emerald-400 flex-shrink-0" />
              <span>{sub.label}</span>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export const ToolActivitySummary = ({ toolActivity }) => {
  const [expanded, setExpanded] = useState(false);

  if (!toolActivity || toolActivity.length === 0) return null;

  return (
    <div className="mt-1.5" data-testid="tool-activity-summary">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-1.5 text-[10px] text-indigo-400 hover:text-indigo-600 transition-colors duration-150"
      >
        <Wrench className="w-2.5 h-2.5" />
        <span>{toolActivity.length} tool{toolActivity.length > 1 ? "s" : ""} used</span>
        {expanded ? <ChevronDown className="w-2.5 h-2.5" /> : <ChevronRight className="w-2.5 h-2.5" />}
      </button>
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-1 ml-1 space-y-1 overflow-hidden"
          >
            {toolActivity.map((tool, i) => (
              <div key={i} className="text-[11px]">
                <div className="flex items-center gap-1.5 text-slate-500">
                  <CheckCircle2 className="w-2.5 h-2.5 text-emerald-500 flex-shrink-0" />
                  <span className="font-medium">{tool.label}</span>
                </div>
                {tool.substeps?.length > 0 && (
                  <div className="ml-4 space-y-0.5 mt-0.5">
                    {tool.substeps.map((sub, j) => (
                      <div key={j} className="flex items-center gap-1 text-[10px] text-slate-400">
                        <span className="w-1 h-1 rounded-full bg-slate-300 flex-shrink-0" />
                        <span>{sub.label}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
