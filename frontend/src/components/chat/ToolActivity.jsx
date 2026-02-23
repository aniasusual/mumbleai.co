import { useState, useEffect } from "react";
import { Loader2, CheckCircle2, Wrench, Brain, ChevronDown, ChevronRight } from "lucide-react";

/**
 * Live tool activity indicator — shows during message processing.
 * Displays which tools/subagents are running and completed.
 */
export const ToolActivityLive = ({ events }) => {
  if (!events || events.length === 0) return null;

  // Build tool state from events
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
    <div className="flex items-start gap-3 px-5 py-2 animate-slide-up">
      <div className="w-8 h-8 rounded-full bg-[#F0F4F8] flex items-center justify-center flex-shrink-0 mt-0.5">
        <Wrench className="w-3.5 h-3.5 text-[#2F5233]" />
      </div>
      <div className="flex flex-col gap-1.5 min-w-[200px]" data-testid="tool-activity-live">
        {tools.map((tool) => (
          <ToolRow key={tool.id} tool={tool} />
        ))}
      </div>
    </div>
  );
};

const ToolRow = ({ tool }) => {
  const isRunning = tool.status === "running";
  const isDone = tool.status === "done";
  const [expanded, setExpanded] = useState(true);
  const hasSubsteps = tool.substeps.length > 0;

  return (
    <div className="text-xs">
      <div className="flex items-center gap-2 py-1">
        {isRunning ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin text-[#2F5233] flex-shrink-0" />
        ) : (
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
        )}
        <span className={`font-medium ${isRunning ? "text-[#2F5233]" : "text-gray-500"}`}>
          {tool.label}
        </span>
        {isRunning && <span className="text-[10px] text-[#2F5233]/60 animate-pulse">running</span>}
        {hasSubsteps && (
          <button onClick={() => setExpanded(!expanded)} className="p-0.5 rounded hover:bg-gray-100">
            {expanded ? <ChevronDown className="w-3 h-3 text-gray-400" /> : <ChevronRight className="w-3 h-3 text-gray-400" />}
          </button>
        )}
      </div>
      {hasSubsteps && expanded && (
        <div className="ml-6 border-l-2 border-gray-100 pl-3 space-y-0.5">
          {tool.substeps.map((sub, i) => (
            <div key={i} className="flex items-center gap-1.5 py-0.5 text-[11px] text-gray-400">
              <CheckCircle2 className="w-2.5 h-2.5 text-emerald-400 flex-shrink-0" />
              <span>{sub.label}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

/**
 * Tool activity summary — displayed on completed AI messages (collapsible).
 */
export const ToolActivitySummary = ({ toolActivity }) => {
  const [expanded, setExpanded] = useState(false);

  if (!toolActivity || toolActivity.length === 0) return null;

  return (
    <div className="mt-1.5" data-testid="tool-activity-summary">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-1.5 text-[10px] text-[#2F5233]/60 hover:text-[#2F5233] transition-colors duration-150"
      >
        <Wrench className="w-2.5 h-2.5" />
        <span>{toolActivity.length} tool{toolActivity.length > 1 ? "s" : ""} used</span>
        {expanded ? <ChevronDown className="w-2.5 h-2.5" /> : <ChevronRight className="w-2.5 h-2.5" />}
      </button>
      {expanded && (
        <div className="mt-1 ml-1 space-y-1 animate-fade-in">
          {toolActivity.map((tool, i) => (
            <div key={i} className="text-[11px]">
              <div className="flex items-center gap-1.5 text-gray-500">
                <CheckCircle2 className="w-2.5 h-2.5 text-emerald-400 flex-shrink-0" />
                <span className="font-medium">{tool.label}</span>
              </div>
              {tool.substeps?.length > 0 && (
                <div className="ml-4 space-y-0.5 mt-0.5">
                  {tool.substeps.map((sub, j) => (
                    <div key={j} className="flex items-center gap-1 text-[10px] text-gray-400">
                      <span className="w-1 h-1 rounded-full bg-gray-300 flex-shrink-0" />
                      <span>{sub.label}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
