"use client";

import { useState } from "react";
import { CheckCircle, XCircle, Edit, AlertTriangle, FileText, Stethoscope, FlaskConical, ArrowRight, ChevronDown, ChevronUp, Save, Download } from "lucide-react";

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

interface RedFlag {
  type: string;
  key: string;
  message: string;
  value?: number;
  unit?: string;
  threshold?: number;
}

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

interface OverrideLog {
  differential_id: string;
  original_rank: number;
  icd11_code: string;
  action: "accept" | "reject" | "reorder" | "add";
  doctor_reason: string;
  timestamp: string;
}

interface DifferentialReviewPanelProps {
  differential: DifferentialDiagnosis[];
  red_flags: RedFlag[];
  suggested_actions: SuggestedAction[];
  clinical_summary: string;
  block_reason: string | null;
  conflicts: Conflict[];
  patient_id: string;
  intake_id: string;
  onFinalize: (overrides: OverrideLog[], finalDifferential: DifferentialDiagnosis[]) => void;
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

export function DifferentialReviewPanel({
  differential,
  red_flags,
  suggested_actions,
  clinical_summary,
  block_reason,
  conflicts,
  patient_id,
  intake_id,
  onFinalize,
  onClose,
}: DifferentialReviewPanelProps) {
  const [expandedDdx, setExpandedDdx] = useState<number[]>([0]);
  const [expandedActions, setExpandedActions] = useState<string[]>([]);
  const [overrides, setOverrides] = useState<OverrideLog[]>([]);
  const [editedDdx, setEditedDdx] = useState<DifferentialDiagnosis[]>(differential);
  const [newDdx, setNewDdx] = useState<Partial<DifferentialDiagnosis>>({});
  const [showAddDdx, setShowAddDdx] = useState(false);
  const [criticalAcknowledged, setCriticalAcknowledged] = useState(false);

  const criticalFlags = red_flags?.filter((f) => f.type === "critical") || [];
  const blockConflicts = conflicts?.filter((c) => c.severity === "block") || [];
  const allBlockAcknowledged = blockConflicts.length === 0 || blockConflicts.every((c) => overrides.some(o => o.icd11_code === c.conflict_id && o.action === "accept"));

  const handleAccept = (dx: DifferentialDiagnosis) => {
    setOverrides((prev) => [
      ...prev,
      {
        differential_id: `${patient_id}-${dx.rank}`,
        original_rank: dx.rank,
        icd11_code: dx.icd11_code,
        action: "accept",
        doctor_reason: "",
        timestamp: new Date().toISOString(),
      },
    ]);
  };

  const handleReject = (dx: DifferentialDiagnosis) => {
    setOverrides((prev) => [
      ...prev,
      {
        differential_id: `${patient_id}-${dx.rank}`,
        original_rank: dx.rank,
        icd11_code: dx.icd11_code,
        action: "reject",
        doctor_reason: "",
        timestamp: new Date().toISOString(),
      },
    ]);
  };

  const handleReorder = (fromIndex: number, toIndex: number) => {
    const newDdx = [...editedDdx];
    const [removed] = newDdx.splice(fromIndex, 1);
    newDdx.splice(toIndex, 0, removed);
    newDdx.forEach((d, i) => { d.rank = i + 1; });
    setEditedDdx(newDdx);
    setOverrides((prev) => [
      ...prev,
      {
        differential_id: `${patient_id}-${removed.rank}`,
        original_rank: removed.rank,
        icd11_code: removed.icd11_code,
        action: "reorder",
        doctor_reason: `Moved from rank ${removed.rank} to ${toIndex + 1}`,
        timestamp: new Date().toISOString(),
      },
    ]);
  };

  const handleAddDdx = () => {
    if (!newDdx.display || !newDdx.icd11_code) return;
    const added: DifferentialDiagnosis = {
      rank: editedDdx.length + 1,
      icd11_code: newDdx.icd11_code,
      display: newDdx.display,
      probability: newDdx.probability || "moderate",
      reasoning: newDdx.reasoning || "Added by clinician",
      supporting_evidence: newDdx.supporting_evidence || [],
      contradicting_evidence: newDdx.contradicting_evidence || [],
      urgency: newDdx.urgency || "routine",
    };
    setEditedDdx([...editedDdx, added]);
    setOverrides((prev) => [
      ...prev,
      {
        differential_id: `${patient_id}-new-${Date.now()}`,
        original_rank: 0,
        icd11_code: added.icd11_code,
        action: "add",
        doctor_reason: "Clinician added diagnosis",
        timestamp: new Date().toISOString(),
      },
    ]);
    setNewDdx({});
    setShowAddDdx(false);
  };

  const handleAcknowledgeCritical = () => {
    setCriticalAcknowledged(true);
    setOverrides((prev) => [
      ...prev,
      {
        differential_id: `${patient_id}-critical-ack`,
        original_rank: 0,
        icd11_code: "CRITICAL_ACK",
        action: "accept",
        doctor_reason: "Acknowledged critical red flags",
        timestamp: new Date().toISOString(),
      },
    ]);
  };

  const handleFinalize = () => {
    if (criticalFlags.length > 0 && !criticalAcknowledged) {
      alert("Please acknowledge all critical red flags before finalizing");
      return;
    }
    onFinalize(overrides, editedDdx);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-6xl max-h-[95vh] bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4 flex items-center justify-between z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold">✍️</div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Doctor Review & Override</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">Patient: {patient_id} | Intake: {intake_id}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg px-3 py-1.5 flex items-center gap-1.5">
              <svg className="h-3.5 w-3.5 flex-shrink-0 text-amber-600 dark:text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" /></svg>
              <p className="text-[11px] font-medium text-amber-700 dark:text-amber-300">AI suggestion</p>
            </div>
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${overrides.filter(o => o.action !== "reorder").length > 0 ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400" : "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300"}`}>
              {overrides.filter(o => o.action !== "reorder").length} Override{overrides.filter(o => o.action !== "reorder").length !== 1 ? "s" : ""}
            </span>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
              <XCircle className="w-5 h-5 text-gray-500" />
            </button>
          </div>
        </div>

        {/* Critical Red Flags Acknowledgment */}
        {criticalFlags.length > 0 && !criticalAcknowledged && (
          <div className="bg-red-50 dark:bg-red-900/20 border-b border-red-200 dark:border-red-800 p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <h3 className="font-semibold text-red-800 dark:text-red-300">Critical Red Flags Require Acknowledgment</h3>
                <p className="text-sm text-red-700 dark:text-red-400 mt-1">
                  {criticalFlags.length} critical red flag{criticalFlags.length > 1 ? "s" : ""} detected. You must acknowledge before finalizing.
                </p>
                <ul className="mt-2 space-y-1">
                  {criticalFlags.map((flag, i) => (
                    <li key={i} className="text-sm text-red-700 dark:text-red-400 flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-red-500 flex-shrink-0 mt-1.5" />
                      {flag.message}
                    </li>
                  ))}
                </ul>
                <button
                  onClick={handleAcknowledgeCritical}
                  className="mt-3 px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm rounded-lg transition-colors"
                >
                  Acknowledge Critical Red Flags
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Block Conflicts */}
        {blockConflicts.length > 0 && (
          <div className="bg-orange-50 dark:bg-orange-900/20 border-b border-orange-200 dark:border-orange-800 p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-6 h-6 text-orange-600 dark:text-orange-400 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <h3 className="font-semibold text-orange-800 dark:text-orange-300">Block Conflicts Detected</h3>
                <p className="text-sm text-orange-700 dark:text-orange-400 mt-1">
                  {blockConflicts.length} conflict{blockConflicts.length > 1 ? "s" : ""} require review.
                </p>
                <div className="mt-2 space-y-2">
                  {blockConflicts.map((conflict) => (
                    <div key={conflict.conflict_id} className="bg-white dark:bg-gray-700 rounded-lg p-3 border border-orange-200 dark:border-orange-800">
                      <p className="font-medium text-orange-800 dark:text-orange-300">{conflict.message}</p>
                      {conflict.disclaimer && <p className="text-sm text-orange-700 dark:text-orange-400 mt-1">{conflict.disclaimer}</p>}
                      <div className="mt-2 flex gap-2">
                        <button
                          onClick={() => handleAccept({ ...conflict, rank: 0, icd11_code: conflict.conflict_id, display: conflict.message, probability: "high", reasoning: "", supporting_evidence: [], contradicting_evidence: [], urgency: "emergent" as const })}
                          className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-sm rounded-lg transition-colors"
                        >
                          Accept Conflict
                        </button>
                      </div>
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
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 border-l-4 border-blue-500">
            <div className="flex items-start gap-3">
              <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <h3 className="font-semibold text-blue-800 dark:text-blue-300 mb-1">Clinical Summary</h3>
                <p className="text-blue-700 dark:text-blue-400">{clinical_summary}</p>
              </div>
            </div>
          </div>

          {/* Differential Diagnosis - Editable */}
          <section>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Ranked Differential Diagnosis ({editedDdx.length})</h3>
              <button
                onClick={() => setShowAddDdx(true)}
                className="px-3 py-1.5 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-lg transition-colors flex items-center gap-1"
              >
                <FileText className="w-4 h-4" /> Add Diagnosis
              </button>
            </div>

            {showAddDdx && (
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-4 mb-4">
                <h4 className="font-medium text-green-800 dark:text-green-300 mb-3">Add New Diagnosis</h4>
                <div className="grid gap-3 md:grid-cols-3">
                  <input
                    type="text"
                    placeholder="ICD-11 Code (e.g., 5A11)"
                    value={newDdx.icd11_code || ""}
                    onChange={(e) => setNewDdx({ ...newDdx, icd11_code: e.target.value })}
                    className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                  <input
                    type="text"
                    placeholder="Display Name"
                    value={newDdx.display || ""}
                    onChange={(e) => setNewDdx({ ...newDdx, display: e.target.value })}
                    className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                  <select
                    value={newDdx.probability || "moderate"}
                    onChange={(e) => setNewDdx({ ...newDdx, probability: e.target.value as "high" | "moderate" | "low" })}
                    className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="high">High</option>
                    <option value="moderate">Moderate</option>
                    <option value="low">Low</option>
                  </select>
                </div>
                <div className="mt-3">
                  <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">Reasoning</label>
                  <textarea
                    value={newDdx.reasoning || ""}
                    onChange={(e) => setNewDdx({ ...newDdx, reasoning: e.target.value })}
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
                <div className="mt-3 flex gap-2">
                  <button onClick={handleAddDdx} className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm rounded-lg">Add</button>
                  <button onClick={() => setShowAddDdx(false)} className="px-4 py-2 bg-gray-300 hover:bg-gray-400 text-gray-700 dark:bg-gray-600 dark:hover:bg-gray-500 dark:text-gray-200 text-sm rounded-lg">Cancel</button>
                </div>
              </div>
            )}

            <div className="space-y-3">
              {editedDdx.map((dx, index) => (
                <div
                  key={`${dx.icd11_code}-${dx.rank}`}
                  className={`rounded-xl border overflow-hidden ${URGENCY_COLORS[dx.urgency]}`}
                >
                  {/* Header Row */}
                  <div className="p-4 bg-gray-50 dark:bg-gray-700/50 flex items-center gap-4" 
                       onClick={() => setExpandedDdx((prev) => prev.includes(dx.rank) ? prev.filter(r => r !== dx.rank) : [...prev, dx.rank])}
                       style={{ cursor: 'pointer' }}>
                    <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center font-bold text-blue-700 dark:text-blue-300">
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
                        {overrides.some(o => o.icd11_code === dx.icd11_code && o.action === "accept") && (
                          <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
                        )}
                        {overrides.some(o => o.icd11_code === dx.icd11_code && o.action === "reject") && (
                          <XCircle className="w-4 h-4 text-red-600 dark:text-red-400" />
                        )}
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

                      {/* Override Actions */}
                      <div className="pt-4 border-t border-gray-200 dark:border-gray-700 flex flex-wrap gap-3">
                        <button
                          onClick={() => handleAccept(dx)}
                          disabled={overrides.some(o => o.icd11_code === dx.icd11_code && o.action === "accept")}
                          className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
                        >
                          <CheckCircle className="w-4 h-4" /> Accept
                        </button>
                        <button
                          onClick={() => handleReject(dx)}
                          disabled={overrides.some(o => o.icd11_code === dx.icd11_code && o.action === "reject")}
                          className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
                        >
                          <XCircle className="w-4 h-4" /> Reject
                        </button>
                        {index > 0 && (
                          <button
                            onClick={() => handleReorder(index, index - 1)}
                            className="px-4 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-600 dark:hover:bg-gray-500 text-gray-700 dark:text-gray-300 text-sm rounded-lg transition-colors flex items-center gap-2"
                          >
                            <ChevronUp className="w-4 h-4" /> Move Up
                          </button>
                        )}
                        {index < editedDdx.length - 1 && (
                          <button
                            onClick={() => handleReorder(index, index + 1)}
                            className="px-4 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-600 dark:hover:bg-gray-500 text-gray-700 dark:text-gray-300 text-sm rounded-lg transition-colors flex items-center gap-2"
                          >
                            <ChevronDown className="w-4 h-4" /> Move Down
                          </button>
                        )}
                      </div>
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

          {/* Override Log */}
          {overrides.length > 0 && (
            <section>
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                <FileText className="w-4 h-4 text-blue-500" />
                Override Log ({overrides.length})
              </h3>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {overrides.map((ov, i) => (
                  <div key={i} className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
                    <div className="flex items-center gap-2 text-sm">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${ov.action === "accept" ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400" : ov.action === "reject" ? "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400" : ov.action === "add" ? "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400" : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400"}`}>
                        {ov.action}
                      </span>
                      <span className="font-mono text-gray-600 dark:text-gray-400">{ov.icd11_code}</span>
                      <span className="text-gray-500 dark:text-gray-400">|</span>
                      <span className="text-gray-700 dark:text-gray-300">{ov.doctor_reason || "No reason provided"}</span>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50 flex flex-wrap gap-2">
          <button onClick={handleFinalize} className="flex-1 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors flex items-center justify-center gap-2">
            <Save className="w-4 h-4" />
            Finalize & Prepare ABHA Write-Back
          </button>
          <button className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors">
            <Download className="w-4 h-4 inline mr-1" /> Export Triage Note
          </button>
          <button onClick={onClose} className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors">
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}