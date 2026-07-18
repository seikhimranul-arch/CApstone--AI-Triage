"use client";

import { useState, useEffect } from "react";
import { DifferentialReviewPanel } from "@/components/DifferentialReviewPanel";
import { PatientFile } from "@/app/page";

interface TriageDifferentialResponse {
  success: boolean;
  differential: Array<{
    rank: number;
    icd11_code: string;
    display: string;
    probability: "high" | "moderate" | "low";
    reasoning: string;
    supporting_evidence: string[];
    contradicting_evidence: string[];
    urgency: "emergent" | "urgent" | "routine";
  }>;
  red_flags: Array<{
    type: string;
    key: string;
    message: string;
    value?: number;
    unit?: string;
    threshold?: number;
  }>;
  suggested_actions: Array<{
    type: "question" | "test" | "referral";
    priority: "high" | "medium" | "low";
    description: string;
    rationale: string;
    icd11_link: string[];
  }>;
  clinical_summary: string;
  block_reason: string | null;
  model_used: string;
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
  override_id: string;
  differential_id: string;
  original_rank: number;
  icd11_code: string;
  action: "accept" | "reject" | "reorder" | "add";
  doctor_reason: string;
  timestamp: string;
}

export default function ReviewPage() {
  const [patients, setPatients] = useState<PatientFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPatient, setSelectedPatient] = useState<PatientFile | null>(null);
  const [showReview, setShowReview] = useState(false);
  const [triageResult, setTriageResult] = useState<TriageDifferentialResponse | null>(null);
  const [triageConflicts, setTriageConflicts] = useState<Conflict[]>([]);
  const [reviewLoading, setReviewLoading] = useState(false);

  // Fetch patients on mount
  useEffect(() => {
    fetch("/api/patients")
      .then((res) => res.json())
      .then((data) => setPatients(data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handlePatientSelect = async (patient: PatientFile) => {
    setSelectedPatient(patient);
    setShowReview(true);
    
    // First, we need to run the full triage flow to get differential
    // This is a simplified version - in production, this would come from stored intake
    // For demo, we'll trigger a mock intake and get differential
    try {
      setReviewLoading(true);
      
      // Create mock intake based on archetype
      let intake: any = {
        abha_id: "",
        age: patient.age,
        gender: patient.gender,
        symptoms: [],
        vitals: {},
        free_text: "Demo triage for review"
      };
      
      if (patient.archetype === "uncontrolled_dm") {
        intake = { ...intake, abha_id: "", symptoms: [
          { icd11_code: "MG44", display: "Fever", duration_days: 3, severity: "moderate" },
          { icd11_code: "MD12", display: "Shortness of breath", duration_days: 2, severity: "moderate" }
        ], vitals: { bp_systolic: 150, bp_diastolic: 95, temperature: 38.2, spo2: 94, pulse: 102 }};
      } else if (patient.archetype === "missed_tb_fu") {
        intake = { ...intake, abha_id: "", symptoms: [
          { icd11_code: "MD11", display: "Cough", duration_days: 60, severity: "moderate" },
          { icd11_code: "MG44", display: "Fever", duration_days: 14, severity: "mild" },
          { icd11_code: "MB23", display: "Weight loss", duration_days: 60, severity: "moderate" },
          { icd11_code: "MD15", display: "Hemoptysis", duration_days: 7, severity: "severe" }
        ], vitals: { temperature: 37.5, spo2: 94, pulse: 98, weight: 48.0 }};
      } else if (patient.archetype === "faltering_growth") {
        intake = { ...intake, abha_id: "", symptoms: [
          { icd11_code: "KB00", display: "Poor feeding", duration_days: 7, severity: "severe" },
          { icd11_code: "KB01", display: "Irritability", duration_days: 7, severity: "moderate" },
          { icd11_code: "MB23", display: "Weight loss", duration_days: 30, severity: "severe" },
          { icd11_code: "MD11", display: "Cough", duration_days: 14, severity: "moderate" }
        ], vitals: { temperature: 37.8, spo2: 92, pulse: 130, weight: 5.2, height: 62.0 }};
      } else if (patient.archetype === "high_risk_anc") {
        intake = { ...intake, abha_id: "", symptoms: [
          { icd11_code: "MB01", display: "Edema/Swelling", duration_days: 14, severity: "moderate" },
          { icd11_code: "MG44", display: "Fever", duration_days: 3, severity: "mild" },
          { icd11_code: "MG40", display: "Fatigue/Weakness", duration_days: 30, severity: "moderate" },
          { icd11_code: "GA01", display: "Vaginal bleeding", duration_days: 1, severity: "severe" }
        ], vitals: { bp_systolic: 155, bp_diastolic: 102, temperature: 37.0, spo2: 98, pulse: 88 }};
      } else if (patient.archetype === "polypharmacy_elderly") {
        intake = { ...intake, abha_id: "", symptoms: [
          { icd11_code: "MB40", display: "Headache", duration_days: 7, severity: "moderate" },
          { icd11_code: "MB41", display: "Dizziness", duration_days: 30, severity: "moderate" },
          { icd11_code: "MB01", display: "Edema/Swelling", duration_days: 60, severity: "mild" },
          { icd11_code: "ME00", display: "Abdominal pain", duration_days: 14, severity: "mild" }
        ], vitals: { bp_systolic: 145, bp_diastolic: 88, temperature: 36.8, spo2: 96, pulse: 72 }};
      }

      // Get consent and run triage
      from engine.abha_mock import get_mock_abdm_service;
      const abdm = get_mock_abdm_service();
      const patients_list = abdm.get_patient_list();
      const p = patients_list.find((p: any) => p.archetype === patient.archetype && p.age === patient.age);
      if (p) {
        intake.abha_id = p.abha_id;
        const consent_req = { abha_id: p.abha_id, purpose: "TRIAGE", hi_types: ["Condition","MedicationRequest","Observation"], expiry_hours: 24 };
        const consent = await abdm.initiate_consent(consent_req);
        await abdm.handle_consent_callback({ consent_id: consent.consent_id, status: "GRANTED", artefact: { signed: true } });
        
        // Get triage differential
        const triageRes = await fetch("/api/triage/differential", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ intake, abha_id: p.abha_id, consent_id: consent.consent_id })
        });
        
        if (triageRes.ok) {
          const data = await triageRes.json();
          setTriageResult(data);
        }
        
        // Get conflicts
        const contextRes = await fetch("/api/triage/context", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ intake, abha_id: p.abha_id, consent_id: consent.consent_id })
        });
        
        if (contextRes.ok) {
          const contextData = await contextRes.json();
          if (contextData.context?.conflicts) {
            setTriageConflicts(contextData.context.conflicts);
          }
        }
      }
    } catch (error) {
      console.error("Failed to run triage:", error);
    } finally {
      setReviewLoading(false);
    }
  };

  const handleFinalize = async (overrides: OverrideLog[], finalDifferential: any[]) => {
    if (!selectedPatient || !triageResult) return;
    
    try {
      // Get the patient's ABHA ID and consent
      from engine.abha_mock import get_mock_abdm_service;
      const abdm = get_mock_abdm_service();
      const patients_list = abdm.get_patient_list();
      const p = patients_list.find((pt: any) => pt.archetype === selectedPatient.archetype && pt.age === selectedPatient.age);
      
      if (!p) throw new Error("Patient not found");
      
      // Re-run consent flow to get consent_id
      const consent_req = { abha_id: p.abha_id, purpose: "TRIAGE", hi_types: ["Condition","MedicationRequest","Observation"], expiry_hours: 24 };
      const consent = await abdm.initiate_consent(consent_req);
      await abdm.handle_consent_callback({ consent_id: consent.consent_id, status: "GRANTED", artefact: { signed: true } });
      
      // Finalize
      const finalizeRes = await fetch("/api/triage/finalize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          intake_id: `INTAKE-${Date.now()}`,
          patient_id: selectedPatient.id,
          abha_id: p.abha_id,
          consent_id: consent.consent_id,
          final_differential: finalDifferential,
          overrides,
          doctor_id: "MO-001",
          doctor_notes: "Clinical review completed"
        })
      });
      
      if (finalizeRes.ok) {
        const data = await finalizeRes.json();
        
        // Now write back to ABHA
        const writebackRes = await fetch("/api/abha/writeback", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            abha_id: p.abha_id,
            consent_id: consent.consent_id,
            composition: data.composition,
            record_type: "TriageSummary"
          })
        });
        
        if (writebackRes.ok) {
          const wbData = await writebackRes.json();
          alert(`Successfully written to ABHA! Record ID: ${wbData.record_id}`);
        } else {
          alert("Finalized but ABHA write-back failed");
        }
      } else {
        alert("Finalization failed");
      }
    } catch (error) {
      console.error("Finalize failed:", error);
      alert("Error during finalization: " + error);
    }
  };

  const handleCloseReview = () => {
    setShowReview(false);
    setTriageResult(null);
    setTriageConflicts([]);
    setSelectedPatient(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading patients...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <header className="sticky top-0 z-50 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold">✍️</div>
              <div>
                <h1 className="text-xl font-semibold text-gray-900 dark:text-white">SehatAI Clinical Review</h1>
                <p className="text-xs text-gray-500 dark:text-gray-400">Doctor Override → ABHA Write-Back</p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded">Phase 4</span>
              <span>•</span>
              <span>{patients.length} Patients</span>
              <span>•</span>
              <span>Review & Finalize</span>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">
        {!showReview ? (
          <div className="grid lg:grid-cols-12 gap-6">
            <aside className="lg:col-span-4 xl:col-span-3">
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                <PatientList
                  patients={patients}
                  onSelect={handlePatientSelect}
                  selectedId={selectedPatient?.id}
                  loading={loading}
                />
              </div>
            </aside>

            <div className="lg:col-span-8 xl:col-span-9">
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 h-[600px] flex items-center justify-center">
                <div className="text-center p-8">
                  <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                    <span className="text-3xl">✍️</span>
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Select a Patient for Clinical Review</h3>
                  <p className="text-gray-500 dark:text-gray-400">Choose a patient to run triage, review differential diagnosis, and finalize for ABHA write-back.</p>
                </div>
              </div>
            </div>
          </div>
        ) : reviewLoading ? (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 h-[600px] flex items-center justify-center">
            <div className="text-center p-8">
              <div className="animate-spin rounded-full h-10 w-10 border-2 border-blue-600 border-t-transparent mx-auto mb-4"></div>
              <p className="text-gray-500 dark:text-gray-400">Running triage and preparing review...</p>
            </div>
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button onClick={handleCloseReview} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">←</button>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Clinical Review: {selectedPatient?.name || "Patient"}</h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{selectedPatient?.archetype} • {selectedPatient?.age}{selectedPatient?.gender}</p>
                </div>
              </div>
            </div>
            
            {triageResult && (
              <DifferentialReviewPanel
                differential={triageResult.differential}
                red_flags={triageResult.red_flags}
                suggested_actions={triageResult.suggested_actions}
                clinical_summary={triageResult.clinical_summary}
                block_reason={triageResult.block_reason}
                conflicts={triageConflicts}
                patient_id={selectedPatient?.id || "unknown"}
                intake_id={`INTAKE-${Date.now()}`}
                onFinalize={handleFinalize}
                onClose={handleCloseReview}
              />
            )}
          </div>
        )}
      </main>

      <footer className="border-t border-gray-200 dark:border-gray-700 mt-8 py-4">
        <div className="max-w-7xl mx-auto px-4 text-center text-sm text-gray-500 dark:text-gray-400">
          <p>SehatAI Clinical Review • Phase 4: Doctor Override & ABHA Write-Back</p>
        </div>
      </footer>
    </div>
  );
}