"use client";

import { useState } from "react";
import { AlertTriangle, CheckCircle, XCircle, ChevronDown, ChevronUp, FileText, Stethoscope, AlertCircle, Pill, FlaskConical, ArrowRight } from "lucide-react";

interface Conflict {
  conflict_id: string;
  type: string;
  severity: "flag" | "warn" | "block";
  message: string;
  intake_value?: any;
  history_value?: any;
  disclaimer?: string;
  requires_acknowledgment: boolean;
  created_at: string;
}

interface RedFlag {
  type: string;
  key: string;
  message: string;
  value?: number;
  unit?: string;
  threshold?: number;
}

interface DifferentialDiagnosis {
  rank: number;
  icd11_code: string;
  display: string;
  probability: "high" | "moderate" | "low";
  reasoning: string;
  supporting_evidence: string[];
  contradicting_evidence: string[];
  urgency: "emergent" | "urgent" | "routine";
}

interface SuggestedAction {
  type: "question" | "test" | "referral";
  priority: "high" | "medium" | "low";
  description: string;
  rationale: string;
  icd11_link: string[];
}

interface TriageDifferentialPanelProps {
  differential: DifferentialDiagnosis[];
  red_flags: RedFlag[];
  suggested_actions: SuggestedAction[];
  clinical_summary: string;
  block_reason: string | null;
  conflicts: Conflict[];
  onAcknowledge?: (conflictId: string) => void;
  onClose: () => void;
}

const PROBABILITY_COLORS = {
  high: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
  moderate: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  low: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
};

const URGENCY_COLORS = {
  emergent: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-800",
  urgent: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400 border-orange-200 dark:border-orange-800",
  routine: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200 dark:border-blue-800",
};

const SEVERITY_COLORS = {
  block: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-800",
  warn: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800",
  flag: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200 dark:border-blue-800",
};

const ACTION_TYPE_ICONS = {
  test: FlaskConical,
  question: Stethoscope,
  referral: ArrowRight,
};

const ACTION_TYPE_COLORS = {
  test: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
  question: "bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-400",
  referral: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
};

export function TriageDifferentialPanel({
  differential,
  red_flags,
  suggested_actions,
  clinical_summary,
  block_reason,
  conflicts,
  onAcknowledge,
  onClose,
}: TriageDifferentialPanelProps) {
  const [expandedDdx, setExpandedDdx] = useState<number[]>([0]);
  const [expandedActions, setExpandedActions] = useState<string[]>([]);
  const [acknowledgedConflicts, setAcknowledgedConflicts] = useState<string[]>([]);

  const criticalFlags = red_flags?.filter((f) => f.type === "critical") || [];
  const warningFlags = red_flags?.filter((f) => f.type === "warning") || [];
  const blockConflicts = conflicts?.filter((c) => c.severity === "block") || [];
  const warnConflicts = conflicts?.filter((c) => c.severity === "warn") || [];
  const flagConflicts = conflicts?.filter((c) => c.severity === "flag") || [];

  const allBlockAcknowledged = blockConflicts.length === 0 || blockConflicts.every((c) => acknowledgedConflicts.includes(c.conflict_id));
  const canProceed = allBlockAcknowledged || blockConflicts.length === 0;

  const handleAcknowledge = (conflictId: string) => {
    setAcknowledgedConflicts((prev) => [...prev, conflictId]);
    onAcknowledge?.(conflictId);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-5xl max-h-[95vh] bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4 flex items-center justify-between z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-purple-600 flex items-center justify-center text-white font-bold">
              🔍
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Differential Diagnosis</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">History-aware DDx with suggested actions</p>
            </div>
          </div>
          
          {/* Status Badge */}
          <div className="flex items-center gap-3">
            {blockConflicts.length > 0 && (
              <div className={`px-3 py-1 rounded-full text-sm font-medium ${allBlockAcknowledged ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400" : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"}`}>
                {allBlockAcknowledged ? "✓ All Blocks Acknowledged" : `⚠ ${blockConflicts.length} Block Conflict${blockConflicts.length > 1 ? "s" : ""}`}
              </div>
            )}
            <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
              <XCircle className="w-5 h-5 text-gray-500" />
            </button>
          </div>
        </div>

        {/* Block Conflict Banner */}
        {blockConflicts.length > 0 && !allBlockAcknowledged && (
          <div className="bg-red-50 dark:bg-red-900/20 border-b border-red-200 dark:border-red-800 p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <h3 className="font-semibold text-red-800 dark:text-red-300">Critical Conflicts Require Acknowledgment</h3>
                <p className="text-sm text-red-700 dark:text-red-400 mt-1">
                  {blockConflicts.length} BLOCK-level conflict{blockConflicts.length > 1 ? "s" : ""} detected. You must acknowledge each before proceeding.
                </p>
                <div className="mt-3 space-y-2">
                  {blockConflicts.map((conflict) => (
                    <div key={conflict.conflict_id} className="bg-white dark:bg-gray-700 rounded-lg p-3 border border-red-200 dark:border-red-800">
                      <p className="font-medium text-red-800 dark:text-red-300">{conflict.message}</p>
                      {conflict.disclaimer && (
                        <p className="text-sm text-red-700 dark:text-red-400 mt-1">{conflict.disclaimer}</p>
                      )}
                      <button
                        onClick={() => handleAcknowledge(conflict.conflict_id)}
                        className="mt-2 px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-sm rounded-lg transition-colors"
                      >
                        Acknowledge & Proceed
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Clinical Summary */}
          <div className="bg-purple-50 dark:bg-purple-900/20 rounded-xl p-4 border-l-4 border-purple-500">
            <div className="flex items-start gap-3">
              <FileText className="w-5 h-5 text-purple-600 dark:text-purple-400 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <h3 className="font-semibold text-purple-800 dark:text-purple-300 mb-1">Clinical Summary</h3>
                <p className="text-purple-700 dark:text-purple-400">{clinical_summary}</p>
              </div>
            </div>
          </div>

          {/* Red Flags */}
          {(criticalFlags.length > 0 || warningFlags.length > 0) && (
            <section>
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-500" />
                Red Flags ({criticalFlags.length + warningFlags.length})
              </h3>
              <div className="space-y-2">
                {criticalFlags.map((flag, i) => (
                  <div key={i} className="px-4 py-3 rounded-xl border bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800">
                    <div className="flex items-start gap-3">
                      <span className="text-red-600 dark:text-red-400 font-bold mt-0.5">🔴</span>
                      <div className="flex-1">
                        <p className="font-medium">{flag.message}</p>
                        {flag.value !== undefined && flag.value !== null && (
                          <p className="text-sm opacity-80 mt-0.5">
                            Value: {flag.value} {flag.unit || ""} • Threshold: {flag.threshold} {flag.unit || ""}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                {warningFlags.map((flag, i) => (
                  <div key={i} className="px-4 py-3 rounded-xl border bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800">
                    <div className="flex items-start gap-3">
                      <span className="text-yellow-600 dark:text-yellow-400 font-bold mt-0.5">🟡</span>
                      <div className="flex-1">
                        <p className="font-medium">{flag.message}</p>
                        {flag.value !== undefined && flag.value !== null && (
                          <p className="text-sm opacity-80 mt-0.5">
                            Value: {flag.value} {flag.unit || ""} • Threshold: {flag.threshold} {flag.unit || ""}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Warn/Flag Conflicts */}
          {(warnConflicts.length > 0 || flagConflicts.length > 0) && (
            <section>
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-yellow-500" />
                Data Conflicts ({warnConflicts.length + flagConflicts.length})
              </h3>
              <div className="space-y-2">
                {warnConflicts.map((conflict, i) => (
                  <div key={conflict.conflict_id || i} className={`px-4 py-3 rounded-xl border ${SEVERITY_COLORS.warn}`}>
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mt-0.5 flex-shrink-0" />
                      <div className="flex-1">
                        <p className="font-medium">{conflict.message}</p>
                        {conflict.disclaimer && <p className="text-sm opacity-80 mt-1">{conflict.disclaimer}</p>}
                      </div>
                    </div>
                  </div>
                ))}
                {flagConflicts.map((conflict, i) => (
                  <div key={conflict.conflict_id || i} className={`px-4 py-3 rounded-xl border ${SEVERITY_COLORS.flag}`}>
                    <div className="flex items-start gap-3">
                      <span className="text-blue-600 dark:text-blue-400 font-bold mt-0.5">ℹ️</span>
                      <div className="flex-1">
                        <p className="font-medium">{conflict.message}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Differential Diagnosis */}
          <section>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Ranked Differential Diagnosis ({differential.length})</h3>
              {differential.length > 0 && (
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  Sorted by clinical probability given history + current presentation
                </span>
              )}
            </div>
            
            <div className="space-y-3">
              {differential.map((dx, index) => (
                <div
                  key={`${dx.icd11_code}-${dx.rank}`}
                  className={`rounded-xl border overflow-hidden ${URGENCY_COLORS[dx.urgency]}`}
                >
                  {/* Header Row */}
                  <div className="p-4 bg-gray-50 dark:bg-gray-700/50 flex items-center gap-4" 
                       onClick={() => setExpandedDdx((prev) => prev.includes(dx.rank) ? prev.filter(r => r !== dx.rank) : [...prev, dx.rank])}
                       style={{ cursor: 'pointer' }}>
                    <div className="w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center font-bold text-purple-700 dark:text-purple-300">
                      {dx.rank}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-gray-900 dark:text-white">{dx.display}</span>
                        <span className="text-xs text-gray-500 dark:text-gray-400 font-mono">({dx.icd11_code})</span>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${PROBABILITY_COLORS[dx.probability]}`}>
                          {dx.probability}
                        </span>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${URGENCY_COLORS[dx.urgency]}`}>
                          {dx.urgency}
                        </span>
                      </div>
                    </div>
                    <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${expandedDdx.includes(dx.rank) ? "rotate-180" : ""}`} />
                  </div>

                  {/* Expanded Content */}
                  {expandedDdx.includes(dx.rank) && (
                    <div className="p-4 space-y-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                      <div>
                        <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">Clinical Reasoning</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">{dx.reasoning}</p>
                      </div>
                      
                      {dx.supporting_evidence.length > 0 && (
                        <div>
                          <h4 className="text-sm font-medium text-green-700 dark:text-green-400 mb-2 flex items-center gap-1">
                            <CheckCircle className="w-4 h-4" /> Supporting Evidence
                          </h4>
                          <ul className="space-y-1 ml-4">
                            {dx.supporting_evidence.map((ev, i) => (
                              <li key={i} className="text-sm text-gray-600 dark:text-gray-400 flex items-start gap-2">
                                <span className="text-green-500">•</span>
                                {ev}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      
                      {dx.contradicting_evidence.length > 0 && (
                        <div>
                          <h4 className="text-sm font-medium text-red-700 dark:text-red-400 mb-2 flex items-center gap-1">
                            <XCircle className="w-4 h-4" /> Contradicting Evidence
                          </h4>
                          <ul className="space-y-1 ml-4">
                            {dx.contradicting_evidence.map((ev, i) => (
                              <li key={i} className="text-sm text-gray-600 dark:text-gray-400 flex items-start gap-2">
                                <span className="text-red-500">•</span>
                                {ev}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>

          {/* Suggested Actions */}
          {suggested_actions.length > 0 && (
            <section>
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                <FlaskConical className="w-4 h-4 text-purple-500" />
                Suggested Actions ({suggested_actions.length})
              </h3>
              <div className="space-y-2">
                {suggested_actions.map((action, i) => {
                  const Icon = ACTION_TYPE_ICONS[action.type] || FlaskConical;
                  const isExpanded = expandedActions.includes(action.description);
                  return (
                    <div key={i} className={`rounded-xl border overflow-hidden ${ACTION_TYPE_COLORS[action.type]}`}>
                      <div className="p-4 bg-gray-50 dark:bg-gray-700/50 flex items-start gap-3" 
                           onClick={() => setExpandedActions((prev) => prev.includes(action.description) ? prev.filter(a => a !== action.description) : [...prev, action.description])}
                           style={{ cursor: 'pointer' }}>
                        <Icon className={`w-5 h-5 mt-0.5 flex-shrink-0 ${action.type === "referral" ? "text-red-600" : action.type === "test" ? "text-purple-600" : "text-cyan-600"}`} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-medium text-gray-900 dark:text-white">{action.description}</span>
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${action.priority === "high" ? "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400" : action.priority === "medium" ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400" : "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300"}`}>
                              {action.priority}
                            </span>
                            <span className="px-2 py-0.5 rounded-full text-xs text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-700">
                              {action.type}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{action.rationale}</p>
                        </div>
                        <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${isExpanded ? "rotate-180" : ""}`} />
                      </div>
                      {isExpanded && action.icd11_link.length > 0 && (
                        <div className="px-4 pb-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                          <p className="text-xs text-gray-500 dark:text-gray-400">Linked to DDx: {action.icd11_link.join(", ")}</p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* Acknowledged Conflicts Status */}
          {acknowledgedConflicts.length > 0 && blockConflicts.length > 0 && allBlockAcknowledged && (
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-4">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
                <div>
                  <h4 className="font-semibold text-green-800 dark:text-green-300">All Block Conflicts Acknowledged</h4>
                  <p className="text-sm text-green-700 dark:text-green-400">You may now proceed with clinical decision-making.</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50 flex flex-wrap gap-2">
          <button className="flex-1 px-4 py-2 text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors">
            📋 Export Triage Note
          </button>
          <button className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors">
            💊 Review Medications
          </button>
          <button className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors">
            📅 Schedule Follow-up
          </button>
          {canProceed && (
            <button className="flex-1 px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-lg transition-colors">
              ✅ Finalize & Write to ABHA
            </button>
          )}
        </div>
      </div>
    </div>
  );
}