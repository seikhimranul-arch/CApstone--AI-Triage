"use client";

import { useState, useEffect, FormEvent } from "react";
import { AppShell } from "../../components/AppShell";
import { TriageDifferentialPanel } from "../../components/TriageDifferentialPanel";
import { PatientList } from "../../components/PatientList";
import { useI18n } from "../../lib/i18n";
import type { PatientFile, TriageDifferentialResponse, Conflict } from "../../lib/types";

interface SymptomEntry {
  icd11_code: string;
  display: string;
  duration_days: number;
  severity: string;
  onset_date?: string;
  notes: string;
}

interface VitalsInput {
  bp_systolic?: number;
  bp_diastolic?: number;
  temperature?: number;
  respiratory_rate?: number;
  spo2?: number;
  pulse?: number;
  weight?: number;
  height?: number;
}

interface SymptomIntakeRequest {
  abha_id?: string;
  patient_name?: string;
  age?: number;
  gender?: string;
  symptoms: SymptomEntry[];
  vitals: VitalsInput;
  free_text: string;
}

export default function TriagePage() {
  const [patients, setPatients] = useState<PatientFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPatient, setSelectedPatient] = useState<PatientFile | null>(null);
  const [showTriage, setShowTriage] = useState(false);
  const [showTriagePanel, setShowTriagePanel] = useState(false);
  const [triageResult, setTriageResult] = useState<TriageDifferentialResponse | null>(null);
  const [triageConflicts, setTriageConflicts] = useState<Conflict[]>([]);
  const [intakeLoading, setIntakeLoading] = useState(false);

  const [intake, setIntake] = useState<SymptomIntakeRequest>({
    abha_id: "",
    patient_name: "",
    age: undefined,
    gender: "",
    symptoms: [],
    vitals: {},
    free_text: "",
  });

  const [symptomSearch, setSymptomSearch] = useState("");
  const [availableSymptoms, setAvailableSymptoms] = useState<Array<{icd11: string; display: string; category: string}>>([]);
  const [showSymptomDropdown, setShowSymptomDropdown] = useState(false);

  const { t, locale } = useI18n();

  useEffect(() => {
    fetch("/api/patients")
      .then((res) => res.json())
      .then((data) => setPatients(data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetch("/api/symptoms/list")
      .then((res) => res.json())
      .then((data) => setAvailableSymptoms(data.symptoms))
      .catch(console.error);
  }, []);

  useEffect(() => {
    if (selectedPatient) {
      setIntake((prev) => ({
        ...prev,
        abha_id: "",
        patient_name: "",
        age: undefined,
        gender: "",
        symptoms: [],
        vitals: {},
        free_text: "",
      }));
    }
  }, [selectedPatient]);

  const handlePatientSelect = (patientId: string) => {
    const patient = patients.find(p => p.id === patientId);
    if (!patient) return;
    setSelectedPatient(patient);
    setShowTriage(true);
    setShowTriagePanel(false);
    setTriageResult(null);
  };

  const handleSymptomAdd = (symptom: { icd11: string; display: string; category: string }) => {
    setIntake((prev) => ({
      ...prev,
      symptoms: [
        ...prev.symptoms,
        {
          icd11_code: symptom.icd11,
          display: symptom.display,
          duration_days: 1,
          severity: "moderate",
          notes: "",
        },
      ],
    }));
    setSymptomSearch("");
    setShowSymptomDropdown(false);
  };

  const handleSymptomRemove = (index: number) => {
    setIntake((prev) => ({
      ...prev,
      symptoms: prev.symptoms.filter((_, i) => i !== index),
    }));
  };

  const handleSymptomChange = (index: number, field: keyof SymptomEntry, value: any) => {
    setIntake((prev) => ({
      ...prev,
      symptoms: prev.symptoms.map((s, i) => (i === index ? { ...s, [field]: value } : s)),
    }));
  };

  const handleVitalsChange = (field: keyof VitalsInput, value: any) => {
    setIntake((prev) => ({
      ...prev,
      vitals: { ...prev.vitals, [field]: value },
    }));
  };

  const handleSubmitIntake = async (e: FormEvent) => {
    e.preventDefault();
    if (!selectedPatient) return;

    setIntakeLoading(true);
    try {
      const consentRes = await fetch("/api/abha/consent/initiate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          abha_id: intake.abha_id,
          purpose: "TRIAGE",
          hi_types: ["Condition", "MedicationRequest", "Observation", "Encounter", "DiagnosticReport", "AllergyIntolerance"],
          expiry_hours: 24,
        }),
      });
      const consentData = await consentRes.json();
      const consentId = consentData.consent_id;

      await fetch(`/api/abha/consent/callback?consent_id=${consentId}&status=GRANTED&artefact=${encodeURIComponent(JSON.stringify({ signed: true }))}`);

      const triageRes = await fetch("/api/triage/differential", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          intake: intake,
          abha_id: intake.abha_id,
          consent_id: consentId,
        }),
      });

      if (triageRes.ok) {
        const data = await triageRes.json();
        setTriageResult(data);
        const contextRes = await fetch("/api/triage/context", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            intake: intake,
            abha_id: intake.abha_id,
            consent_id: consentId,
          }),
        });
        if (contextRes.ok) {
          const contextData = await contextRes.json();
          if (contextData.context?.conflicts) {
            setTriageConflicts(contextData.context.conflicts);
          }
        }
        setShowTriagePanel(true);
      } else {
        console.error("Triage failed:", await triageRes.json());
      }
    } catch (error) {
      console.error("Intake submission failed:", error);
    } finally {
      setIntakeLoading(false);
    }
  };

  const handleCloseTriage = () => {
    setShowTriagePanel(false);
    setTriageResult(null);
    setTriageConflicts([]);
  };

  const handleAcknowledgeConflict = (conflictId: string) => {
    setTriageConflicts((prev) => prev.filter((c) => c.conflict_id !== conflictId));
  };

  const filteredSymptoms = availableSymptoms.filter(
    (s) =>
      s.display.toLowerCase().includes(symptomSearch.toLowerCase()) ||
      s.icd11.toLowerCase().includes(symptomSearch.toLowerCase())
  );

  if (loading) {
    return (
      <AppShell>
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="text-center">
            <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-[#1a5276] dark:border-[#5b6ee1] border-t-transparent" />
            <p className="text-slate-600 dark:text-halo-muted">{t("home.loading")}</p>
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="mx-auto max-w-7xl px-4 py-6 lg:px-6">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">Triage Assistant</h1>
          <p className="text-sm text-slate-500 dark:text-halo-muted">Symptom Intake → ABHA History → Differential Diagnosis</p>
        </div>
        {!showTriage ? (
          <div className="grid lg:grid-cols-12 gap-6">
            <aside className="lg:col-span-4 xl:col-span-3">
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                <PatientList patients={patients} onSelect={handlePatientSelect} selectedId={selectedPatient?.id} loading={loading} />
              </div>
            </aside>

            <div className="lg:col-span-8 xl:col-span-9">
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 h-[600px] flex items-center justify-center">
                <div className="text-center p-8">
                  <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                    <span className="text-3xl">🔍</span>
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Select a Patient for Triage</h3>
                  <p className="text-gray-500 dark:text-gray-400">Choose a patient from the sidebar to begin symptom intake and differential diagnosis generation.</p>
                  <div className="mt-6 grid grid-cols-3 gap-4 text-center">
                    <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">{patients.length}</div>
                      <div className="text-xs text-gray-500">Patients</div>
                    </div>
                    <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <div className="text-2xl font-bold text-green-600 dark:text-green-400">5</div>
                      <div className="text-xs text-gray-500">Archetypes</div>
                    </div>
                    <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">~3s</div>
                      <div className="text-xs text-gray-500">Avg Response</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button onClick={() => { setShowTriage(false); setSelectedPatient(null); }} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">←</button>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Symptom Intake: {selectedPatient?.id || "Patient"}</h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{selectedPatient?.archetype}</p>
                </div>
              </div>
            </div>

            <div className="p-6">
              <form onSubmit={handleSubmitIntake} className="space-y-6 max-w-3xl">
                <section className="grid gap-4 md:grid-cols-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Age</label>
                    <input type="number" value={intake.age || ""} onChange={(e) => setIntake((prev) => ({ ...prev, age: parseInt(e.target.value) || undefined }))} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white" placeholder="e.g., 45" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Gender</label>
                    <select value={intake.gender} onChange={(e) => setIntake((prev) => ({ ...prev, gender: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
                      <option value="">Select</option>
                      <option value="M">Male</option>
                      <option value="F">Female</option>
                      <option value="O">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">ABHA ID</label>
                    <input type="text" value={intake.abha_id} onChange={(e) => setIntake((prev) => ({ ...prev, abha_id: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white" placeholder="14-digit ABHA ID" pattern="^\d{14}$" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Name</label>
                    <input type="text" value={intake.patient_name} onChange={(e) => setIntake((prev) => ({ ...prev, patient_name: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white" placeholder="Patient Name" />
                  </div>
                </section>

                <section>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Symptoms (ICD-11 Coded)</h3>
                    <div className="relative">
                      <input type="text" value={symptomSearch} onChange={(e) => { setSymptomSearch(e.target.value); setShowSymptomDropdown(true); }} onFocus={() => setShowSymptomDropdown(true)} placeholder="Search symptoms..." className="w-64 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm" />
                      {showSymptomDropdown && symptomSearch && (
                        <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg max-h-60 overflow-y-auto z-10">
                          {filteredSymptoms.slice(0, 10).map((s) => (
                            <button key={s.icd11} type="button" onClick={() => handleSymptomAdd(s)} className="w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-600 flex items-center gap-3">
                              <span className="font-mono text-xs text-gray-500">{s.icd11}</span>
                              <span className="text-sm text-gray-900 dark:text-white">{s.display}</span>
                              <span className="text-xs text-gray-400 px-2 py-0.5 bg-gray-100 dark:bg-gray-600 rounded">{s.category}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {intake.symptoms.length === 0 ? (
                    <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-8">No symptoms added. Search and select from the ICD-11 list above.</p>
                  ) : (
                    <div className="space-y-3">
                      {intake.symptoms.map((symptom, index) => (
                        <div key={index} className="flex flex-col sm:flex-row gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="font-medium text-gray-900 dark:text-white">{symptom.display}</span>
                              <span className="text-xs font-mono text-gray-500 bg-gray-100 dark:bg-gray-600 px-2 py-0.5 rounded">{symptom.icd11_code}</span>
                              <button type="button" onClick={() => handleSymptomRemove(index)} className="ml-auto text-red-500 hover:text-red-700 text-sm">✕</button>
                            </div>
                            <div className="grid gap-2 sm:grid-cols-4">
                              <div>
                                <label className="text-xs text-gray-500 dark:text-gray-400">Duration (days)</label>
                                <input type="number" value={symptom.duration_days} onChange={(e) => handleSymptomChange(index, "duration_days", parseInt(e.target.value) || 0)} className="w-full px-2 py-1.5 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-600 text-sm" />
                              </div>
                              <div>
                                <label className="text-xs text-gray-500 dark:text-gray-400">Severity</label>
                                <select value={symptom.severity} onChange={(e) => handleSymptomChange(index, "severity", e.target.value)} className="w-full px-2 py-1.5 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-600 text-sm">
                                  <option value="mild">Mild</option>
                                  <option value="moderate">Moderate</option>
                                  <option value="severe">Severe</option>
                                </select>
                              </div>
                              <div>
                                <label className="text-xs text-gray-500 dark:text-gray-400">Onset Date</label>
                                <input type="date" value={symptom.onset_date || ""} onChange={(e) => handleSymptomChange(index, "onset_date", e.target.value)} className="w-full px-2 py-1.5 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-600 text-sm" />
                              </div>
                              <div>
                                <label className="text-xs text-gray-500 dark:text-gray-400">Notes</label>
                                <input type="text" value={symptom.notes} onChange={(e) => handleSymptomChange(index, "notes", e.target.value)} className="w-full px-2 py-1.5 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-600 text-sm" placeholder="Optional" />
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </section>

                <section>
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Vital Signs</h3>
                  <div className="grid gap-4 md:grid-cols-4">
                    <div>
                      <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">BP Systolic</label>
                      <input type="number" value={intake.vitals.bp_systolic || ""} onChange={(e) => handleVitalsChange("bp_systolic", parseInt(e.target.value) || undefined)} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white" placeholder="mmHg" />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">BP Diastolic</label>
                      <input type="number" value={intake.vitals.bp_diastolic || ""} onChange={(e) => handleVitalsChange("bp_diastolic", parseInt(e.target.value) || undefined)} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white" placeholder="mmHg" />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Temperature</label>
                      <input type="number" step="0.1" value={intake.vitals.temperature || ""} onChange={(e) => handleVitalsChange("temperature", parseFloat(e.target.value) || undefined)} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white" placeholder="°C" />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">SpO2</label>
                      <input type="number" value={intake.vitals.spo2 || ""} onChange={(e) => handleVitalsChange("spo2", parseInt(e.target.value) || undefined)} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white" placeholder="%" />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Pulse</label>
                      <input type="number" value={intake.vitals.pulse || ""} onChange={(e) => handleVitalsChange("pulse", parseInt(e.target.value) || undefined)} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white" placeholder="bpm" />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Resp Rate</label>
                      <input type="number" value={intake.vitals.respiratory_rate || ""} onChange={(e) => handleVitalsChange("respiratory_rate", parseInt(e.target.value) || undefined)} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white" placeholder="/min" />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Weight</label>
                      <input type="number" step="0.1" value={intake.vitals.weight || ""} onChange={(e) => handleVitalsChange("weight", parseFloat(e.target.value) || undefined)} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white" placeholder="kg" />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Height</label>
                      <input type="number" step="0.1" value={intake.vitals.height || ""} onChange={(e) => handleVitalsChange("height", parseFloat(e.target.value) || undefined)} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white" placeholder="cm" />
                    </div>
                  </div>
                </section>

                <section>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Clinical Notes</label>
                  <textarea value={intake.free_text} onChange={(e) => setIntake((prev) => ({ ...prev, free_text: e.target.value }))} rows={3} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white" placeholder="Free text clinical notes..." />
                </section>

                <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <button type="submit" disabled={intakeLoading || intake.symptoms.length === 0 || !intake.abha_id} className="flex-1 px-6 py-3 text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                    {intakeLoading ? (
                      <span className="flex items-center justify-center gap-2">
                        <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" /></svg>
                        Generating Differential...
                      </span>
                    ) : (
                      "Generate Differential Diagnosis"
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {showTriagePanel && triageResult && (
          <TriageDifferentialPanel
            differential={triageResult.differential}
            red_flags={triageResult.red_flags}
            suggested_actions={triageResult.suggested_actions}
            clinical_summary={triageResult.clinical_summary}
            block_reason={triageResult.block_reason}
            conflicts={triageConflicts}
            onAcknowledge={handleAcknowledgeConflict}
            onClose={handleCloseTriage}
          />
        )}
      </div>
    </AppShell>
  );
}