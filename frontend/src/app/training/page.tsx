"use client";

import { useState, useEffect } from "react";
import { AppShell } from "../../components/AppShell";
import { useI18n } from "../../lib/i18n";
import { ChevronRight, CheckCircle, PlayCircle, PauseCircle, X, ArrowLeft, ArrowRight, HelpCircle, User, Stethoscope, FileText, Check, AlertTriangle } from "lucide-react";

const TRAINING_STEPS = [
  {
    id: 1,
    titleKey: "training.step_1",
    descKey: "training.step_1_desc",
    icon: User,
    guidelineRef: "training.guideline_abdm_abha",
    content: {
      videoUrl: "/training/step1-patient-lookup.mp4",
      practicePatient: { name: "Ravi Kumar", age: 57, gender: "M", abhaId: "12345678901234", archetype: "uncontrolled_dm" }
    }
  },
  {
    id: 2,
    titleKey: "training.step_2",
    descKey: "training.step_2_desc",
    icon: FileText,
    guidelineRef: "training.guideline_abdm_consent",
    content: {
      videoUrl: "/training/step2-consent.mp4",
      practicePatient: { name: "Ravi Kumar", age: 57, gender: "M", abhaId: "12345678901234", archetype: "uncontrolled_dm" }
    }
  },
  {
    id: 3,
    titleKey: "training.step_3",
    descKey: "training.step_3_desc",
    icon: Stethoscope,
    guidelineRef: "training.guideline_icd11_imnci",
    content: {
      videoUrl: "/training/step3-symptom-intake.mp4",
      practicePatient: { name: "Ravi Kumar", age: 57, gender: "M", abhaId: "12345678901234", archetype: "uncontrolled_dm" },
      symptoms: [
        { icd11: "MG44", display: "Fever", duration: 3, severity: "moderate" },
        { icd11: "MD12", display: "Shortness of breath", duration: 2, severity: "moderate" }
      ],
      vitals: { bpSys: 150, bpDia: 95, temp: 38.2, spo2: 94, pulse: 102 }
    }
  },
  {
    id: 4,
    titleKey: "training.step_4",
    descKey: "training.step_4_desc",
    icon: HelpCircle,
    guidelineRef: "training.guideline_npcdcs_ntep",
    content: {
      videoUrl: "/training/step4-review.mp4"
    }
  },
  {
    id: 5,
    titleKey: "training.step_5",
    descKey: "training.step_5_desc",
    icon: AlertTriangle,
    guidelineRef: "training.guideline_api_fogsi_iap",
    content: {
      videoUrl: "/training/step5-differential.mp4"
    }
  },
  {
    id: 6,
    titleKey: "training.step_6",
    descKey: "training.step_6_desc",
    icon: CheckCircle,
    guidelineRef: "training.guideline_abdm_hip_fhir",
    content: {
      videoUrl: "/training/step6-finalize.mp4"
    }
  }
];

function TrainingMode() {
  const { t } = useI18n();
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
  const [showVideo, setShowVideo] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  const handleNext = () => {
    setCompletedSteps(prev => new Set(prev).add(currentStep));
    if (currentStep < TRAINING_STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = () => {
    setCompletedSteps(prev => new Set(prev).add(currentStep));
    alert(t("training.complete_training"));
  };

  const step = TRAINING_STEPS[currentStep];
  const isLastStep = currentStep === TRAINING_STEPS.length - 1;
  const isStepCompleted = completedSteps.has(currentStep);

  return (
    <AppShell>
      {/* Progress Bar */}
      <div className="mx-auto max-w-4xl px-4 py-6 lg:px-6">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">{t("training.title")}</h1>
          <p className="text-sm text-slate-500 dark:text-halo-muted">{t("training.description")}</p>
        </div>
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-slate-700 dark:text-halo-text">
              {t("training.step")} {currentStep + 1} / {TRAINING_STEPS.length}
            </span>
            <span className="text-sm text-slate-500 dark:text-halo-muted">
              {completedSteps.size} {t("training.of")} {TRAINING_STEPS.length} {t("training.completed")}
            </span>
          </div>
          <div className="h-2 rounded-full bg-slate-200 dark:bg-halo-border overflow-hidden">
            <div 
              className="h-full bg-[#1a5276] dark:bg-[#5b6ee1] transition-all duration-300" 
              style={{ width: `${((currentStep) / (TRAINING_STEPS.length - 1)) * 100}%` }}
            />
          </div>
        </div>
        {/* Step Navigator */}
        <div className="hidden md:flex items-center gap-1 mb-6 overflow-x-auto pb-2">
          {TRAINING_STEPS.map((s, i) => (
            <button
              key={s.id}
              onClick={() => {
                setCompletedSteps(prev => new Set(prev).add(i));
                setCurrentStep(i);
              }}
              className={`flex flex-col items-center gap-1 px-3 py-2 rounded-lg transition-all ${
                i === currentStep
                  ? "bg-purple-600 text-white"
                  : completedSteps.has(i)
                  ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400"
                  : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600"
              }`}
            >
              <span className="text-lg font-bold">{i + 1}</span>
              <span className="text-xs truncate max-w-[100px]">{t(s.titleKey)}</span>
              {(i === currentStep || completedSteps.has(i)) && (
                <CheckCircle className="w-4 h-4" />
              )}
            </button>
          ))}
        </div>

        {/* Mobile Step Selector */}
        <div className="md:hidden mb-4">
          <select
            value={currentStep}
            onChange={(e) => setCurrentStep(Number(e.target.value))}
            className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white"
          >
            {TRAINING_STEPS.map((s, i) => (
              <option key={s.id} value={i}>
                {i + 1}. {t(s.titleKey)}
              </option>
            ))}
          </select>
        </div>

        {/* Step Content */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          {/* Step Header */}
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 rounded-xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                <step.icon className="w-7 h-7 text-purple-600 dark:text-purple-400" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="px-2 py-0.5 text-xs font-medium bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 rounded">
                    {t("training.step")} {currentStep + 1}
                  </span>
                  {isStepCompleted && (
                    <CheckCircle className="w-4 h-4 text-green-500" />
                  )}
                </div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">{t(step.titleKey)}</h2>
                <p className="text-gray-600 dark:text-gray-400 mt-1">{t(step.descKey)}</p>
                {step.guidelineRef && (
                  <p className="text-xs text-purple-600 dark:text-purple-400 mt-2 flex items-center gap-1">
                    <span className="font-medium">{t("training.guideline_ref")}:</span>
                    <span>{t(step.guidelineRef)}</span>
                  </p>
                )}
              </div>
              {isStepCompleted && (
                <button
                  onClick={() => setCompletedSteps(prev => {
                    const next = new Set(prev);
                    next.delete(currentStep);
                    return next;
                  })}
                  className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>
          </div>

          {/* Step Content */}
          <div className="p-6 space-y-6">
            {/* Video Section */}
            <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-4">
              <h3 className="font-medium text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                <PlayCircle className="w-5 h-5 text-purple-600" />
                {t("training.video_guide")}
              </h3>
              <div className="aspect-video bg-gray-900 rounded-lg relative flex items-center justify-center">
                {showVideo ? (
                  <>
                    <div className="absolute inset-0 bg-gray-900 flex items-center justify-center">
                      <div className="text-center text-white">
                        <div className={`w-12 h-12 mx-auto mb-3 ${isPlaying ? "animate-spin" : ""} border-4 border-purple-600 border-t-transparent rounded-full`} />
                        <p>{isPlaying ? t("training.playing") : t("training.paused")}</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => setIsPlaying(!isPlaying)}
                      className="absolute bottom-4 right-4 p-2 bg-white/20 rounded-lg backdrop-blur-sm"
                    >
                      {isPlaying ? <PauseCircle className="w-6 h-6" /> : <PlayCircle className="w-6 h-6" />}
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => { setShowVideo(true); setIsPlaying(true); }}
                    className="w-full h-full flex flex-col items-center justify-center gap-3 text-gray-400 hover:text-white transition-colors"
                  >
                    <PlayCircle className="w-16 h-16 text-purple-500" />
                    <span className="text-lg font-medium">{t("training.watch_video")}</span>
                    <span className="text-sm">{step.content.videoUrl}</span>
                  </button>
                )}
              </div>
            </div>

            {/* Practice Content based on step */}
            {currentStep === 0 && (
              <PracticePatientLookup step={step} t={t} />
            )}
            {currentStep === 2 && (
              <PracticeSymptomIntake step={step} t={t} />
            )}
            {currentStep === 3 && (
              <PracticeReviewMerge t={t} />
            )}
            {currentStep === 4 && (
              <PracticeDifferential t={t} />
            )}
            {currentStep === 5 && (
              <PracticeFinalize t={t} />
            )}

            {/* Step Completion */}
            {!isStepCompleted && (
              <button
                onClick={handleNext}
                className="w-full px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                <span>{isLastStep ? t("training.finish") : t("training.next")}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}

            {isStepCompleted && !isLastStep && (
              <button
                onClick={handleNext}
                className="w-full px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                <span>{t("training.continue")}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}

            {isLastStep && isStepCompleted && (
              <button
                onClick={handleComplete}
                className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                <CheckCircle className="w-4 h-4" />
                {t("training.complete_training")}
              </button>
            )}
          </div>
        </div>

        {/* Mobile Step Navigation */}
        <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-4 flex justify-between z-50">
          <button
            onClick={handlePrev}
            disabled={currentStep === 0}
            className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ArrowLeft className="w-4 h-4 inline mr-1" /> {t("common.previous")}
          </button>
          <button
            onClick={isLastStep ? handleComplete : handleNext}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg"
          >
            {isLastStep ? t("training.complete_training") : t("common.next")}
            <ArrowRight className="w-4 h-4 inline ml-1" />
          </button>
        </div>
      </div>
    </AppShell>
  );
}

function PracticePatientLookup({ step, t }: { step: typeof TRAINING_STEPS[0]; t: any }) {
  return (
    <div className="space-y-4">
      <h3 className="font-medium text-gray-900 dark:text-white">{t("training.practice")}</h3>
      <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-4">
        <h4 className="font-medium text-purple-800 dark:text-purple-300 mb-2">{t("training.patient_lookup_practice")}</h4>
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t("triage.abha_id")}</label>
            <input
              type="text"
              defaultValue={step.content.practicePatient.abhaId}
              className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg"
              placeholder={t("triage.abha_id_placeholder")}
            />
          </div>
          <button className="w-full px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors">
            {t("training.lookup_patient")}
          </button>
        </div>
      </div>
      <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
        <h4 className="font-medium text-gray-900 dark:text-white mb-2">{t("training.patient_found")}</h4>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div><span className="text-gray-500 dark:text-gray-400">{t("triage.patient_name")}</span> <span className="font-medium">{step.content.practicePatient.name}</span></div>
          <div><span className="text-gray-500 dark:text-gray-400">{t("triage.age")}</span> <span className="font-medium">{step.content.practicePatient.age}</span></div>
          <div><span className="text-gray-500 dark:text-gray-400">{t("triage.gender")}</span> <span className="font-medium">{step.content.practicePatient.gender === "M" ? t("common.male") : t("common.female")}</span></div>
          <div><span className="text-gray-500 dark:text-gray-400">{t("training.archetype")}</span> <span className="font-medium">{t(`archetypes.${step.content.practicePatient.archetype}`)}</span></div>
        </div>
      </div>
    </div>
  );
}

function PracticeSymptomIntake({ step, t }: { step: typeof TRAINING_STEPS[0]; t: any }) {
  return (
    <div className="space-y-4">
      <h3 className="font-medium text-gray-900 dark:text-white">{t("training.practice")}</h3>
      <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-4">
        <h4 className="font-medium text-purple-800 dark:text-purple-300 mb-3">{t("training.symptom_intake_practice")}</h4>
        <div className="space-y-3">
          {step.content.symptoms?.map((s: any, i: number) => (
            <div key={i} className="flex items-center gap-3 p-3 bg-white dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
              <span className="w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center text-sm font-mono text-purple-700 dark:text-purple-400">{s.icd11}</span>
              <div className="flex-1">
                <span className="font-medium text-gray-900 dark:text-white">{s.display}</span>
                <span className="text-sm text-gray-500 dark:text-gray-400 ml-2">({s.duration_days} {t("common.days")}, {t(`triage.severity_${s.severity}`)})</span>
              </div>
            </div>
          ))}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: t("triage.bp_systolic"), value: step.content.vitals.bpSys, unit: "mmHg" },
              { label: t("triage.bp_diastolic"), value: step.content.vitals.bpDia, unit: "mmHg" },
              { label: t("triage.temperature"), value: step.content.vitals.temp, unit: "°C" },
              { label: t("triage.spo2"), value: step.content.vitals.spo2, unit: "%" },
            ].map((v, i) => (
              <div key={i} className="bg-white dark:bg-gray-700 rounded-lg p-3 border border-gray-200 dark:border-gray-600">
                <span className="text-xs text-gray-500 dark:text-gray-400">{v.label}</span>
                <div className="font-semibold text-gray-900 dark:text-white">{v.value} <span className="text-sm font-normal text-gray-500">{v.unit}</span></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function PracticeReviewMerge({ t }: { t: any }) {
  return (
    <div className="space-y-4">
      <h3 className="font-medium text-gray-900 dark:text-white">{t("training.practice")}</h3>
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <h4 className="font-medium text-blue-800 dark:text-blue-300 mb-2">{t("training.review_merged_context")}</h4>
        <ul className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
          <li className="flex items-start gap-2"><CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" /> {t("training.merged_conditions")}</li>
          <li className="flex items-start gap-2"><CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" /> {t("training.merged_medications")}</li>
          <li className="flex items-start gap-2"><CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" /> {t("training.conflicts_detected")}</li>
          <li className="flex items-start gap-2"><CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" /> {t("training.red_flags_highlighted")}</li>
        </ul>
        <button className="mt-4 w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors">
          {t("training.view_merged_context")}
        </button>
      </div>
    </div>
  );
}

function PracticeDifferential({ t }: { t: any }) {
  return (
    <div className="space-y-4">
      <h3 className="font-medium text-gray-900 dark:text-white">{t("training.practice")}</h3>
      <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
        <h4 className="font-medium text-amber-800 dark:text-amber-300 mb-2">{t("training.review_differential")}</h4>
        <ul className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
          <li className="flex items-start gap-2"><span className="w-6 h-6 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center text-red-700 dark:text-red-400 font-bold">1</span> <span>DKA/HHS <span className="text-amber-700 dark:text-amber-400">(High/Emergent)</span></span></li>
          <li className="flex items-start gap-2"><span className="w-6 h-6 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center text-orange-700 dark:text-orange-400 font-bold">2</span> <span>Acute HF <span className="text-amber-700 dark:text-amber-400">(Moderate/Urgent)</span></span></li>
        </ul>
        <div className="mt-3 space-y-2">
          <button className="w-full px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg transition-colors">{t("training.accept_diagnosis")}</button>
          <button className="w-full px-4 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg transition-colors">{t("training.reject_diagnosis")}</button>
          <button className="w-full px-4 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg transition-colors">{t("training.add_diagnosis")}</button>
        </div>
      </div>
    </div>
  );
}

function PracticeFinalize({ t }: { t: any }) {
  return (
    <div className="space-y-4">
      <h3 className="font-medium text-gray-900 dark:text-white">{t("training.practice")}</h3>
      <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
        <h4 className="font-medium text-green-800 dark:text-green-300 mb-2">{t("training.finalize_writeback")}</h4>
        <ul className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
          <li className="flex items-start gap-2"><CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" /> {t("training.finalize_composition")}</li>
          <li className="flex items-start gap-2"><CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" /> {t("training.consent_verified")}</li>
          <li className="flex items-start gap-2"><CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" /> {t("training.writeback_abha")}</li>
          <li className="flex items-start gap-2"><CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" /> {t("training.audit_logged")}</li>
        </ul>
        <button className="mt-4 w-full px-4 py-3 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors">
          {t("training.finalize_writeback")}
        </button>
      </div>
    </div>
  );
}

export default TrainingMode;