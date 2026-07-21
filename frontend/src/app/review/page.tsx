"use client";

import { useState, useEffect } from "react";
import { AppShell } from "../../components/AppShell";
import { DifferentialReviewPanel } from "../../components/DifferentialReviewPanel";
import { PatientList } from "../../components/PatientList";
import { useI18n } from "../../lib/i18n";
import type { PatientFile, TriageDifferentialResponse, Conflict, OverrideLog } from "../../lib/types";

export default function ReviewPage() {
  const { t } = useI18n();
  const [patients, setPatients] = useState<PatientFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPatient, setSelectedPatient] = useState<PatientFile | null>(null);
  const [showReview, setShowReview] = useState(false);
  const [triageResult, setTriageResult] = useState<TriageDifferentialResponse | null>(null);
  const [triageConflicts, setTriageConflicts] = useState<Conflict[]>([]);
  const [reviewLoading, setReviewLoading] = useState(false);

  useEffect(() => {
    fetch("/api/patients")
      .then((res) => res.json())
      .then((data) => setPatients(data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handlePatientSelect = async (patientId: string) => {
    const patient = patients.find(p => p.id === patientId);
    if (!patient) return;
    setSelectedPatient(patient);
    setShowReview(true);
    
    try {
      setReviewLoading(true);
      
      let intake: any = {
        abha_id: "",
        age: 45,
        gender: "M",
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

      // Use fetch to call backend mock service
      const consentRes = await fetch("/api/abha/consent/initiate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          abha_id: "",
          purpose: "TRIAGE",
          hi_types: ["Condition", "MedicationRequest", "Observation", "Encounter", "DiagnosticReport", "AllergyIntolerance"],
          expiry_hours: 24
        })
      });
      
      // We need to find the patient's ABHA ID from the mock service
      // For demo, we'll use a placeholder approach
      const mockAbdmRes = await fetch("/api/patients");
      const allPatients = await mockAbdmRes.json();
      const p = allPatients.find((pt: any) => pt.archetype === patient.archetype);
      
      if (p) {
        intake.abha_id = p.abha_id || "";
        
        const consentReq = { 
          abha_id: p.abha_id, 
          purpose: "TRIAGE", 
          hi_types: ["Condition","MedicationRequest","Observation"], 
          expiry_hours: 24 
        };
        
        const consentRes2 = await fetch("/api/abha/consent/initiate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(consentReq)
        });
        const consent = await consentRes2.json();
        
        await fetch(`/api/abha/consent/callback?consent_id=${consent.consent_id}&status=GRANTED&artefact=${encodeURIComponent(JSON.stringify({ signed: true }))}`);
        
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
      const mockAbdmRes = await fetch("/api/patients");
      const allPatients = await mockAbdmRes.json();
      const p = allPatients.find((pt: any) => pt.archetype === selectedPatient?.archetype);
      
      if (!p) throw new Error("Patient not found");
      
      const consentReq = { abha_id: p.abha_id, purpose: "TRIAGE", hi_types: ["Condition","MedicationRequest","Observation"], expiry_hours: 24 };
      const consentRes = await fetch("/api/abha/consent/initiate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(consentReq)
      });
      const consent = await consentRes.json();
      
      await fetch(`/api/abha/consent/callback?consent_id=${consent.consent_id}&status=GRANTED&artefact=${encodeURIComponent(JSON.stringify({ signed: true }))}`);
      
      const finalizeRes = await fetch("/api/triage/finalize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          intake_id: `INTAKE-${Date.now()}`,
          patient_id: selectedPatient?.id,
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
          alert(`${t("abha.writeback_success")} ${wbData.record_id}`);
        } else {
          alert(t("abha.writeback_failed"));
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
      <AppShell>
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="text-center">
            <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-[#2563EB] border-t-transparent" />
            <p className="text-slate-600">{t("home.loading")}</p>
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="mx-auto max-w-7xl px-4 py-6 lg:px-6">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-slate-900">{t("review.title")}</h1>
          <p className="text-sm text-slate-500">{t("review.subtitle")}</p>
        </div>
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
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                    {t("review.patient_selection")}
                  </h3>
                  <p className="text-gray-500 dark:text-gray-400">{t("review.patient_selection_desc")}</p>
                  <div className="mt-6 grid grid-cols-3 gap-4 text-center">
                    <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{patients.length}</div>
                      <div className="text-xs text-gray-500">{t("review.stats.patients")}</div>
                    </div>
                    <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <div className="text-2xl font-bold text-green-600 dark:text-green-400">5</div>
                      <div className="text-xs text-gray-500">{t("review.stats.archetypes")}</div>
                    </div>
                    <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">~3s</div>
                      <div className="text-xs text-gray-500">{t("review.stats.avg_response")}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : reviewLoading ? (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 h-[600px] flex items-center justify-center">
            <div className="text-center p-8">
              <div className="animate-spin rounded-full h-10 w-10 border-2 border-blue-600 border-t-transparent mx-auto mb-4"></div>
              <p className="text-gray-500 dark:text-gray-400">{t("review.preparing_review")}</p>
            </div>
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button onClick={handleCloseReview} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">←</button>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{t("review.override_panel_title")}: {selectedPatient?.id || "Patient"}</h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{selectedPatient?.archetype}</p>
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
      </div>
    </AppShell>
  );
}