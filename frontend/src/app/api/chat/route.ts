import { NextResponse } from 'next/server';

// Expanded clinical knowledge base for the chatbot
const CLINICAL_KB: Record<string, string> = {
  fever: "Fever (ICD-11: MG44) management:\n• Basic workup: CBC, Malaria smear, Blood culture if high-grade\n• For PHC: Paracetamol 500-1000mg QID, tepid sponging >39°C\n• Red flags: Fever >5 days, rash, neck stiffness, altered sensorium\n• TB suspect: If fever >2 weeks + night sweats + weight loss → sputum AFB",
  cough: "Cough (ICD-11: MD11) approach:\n• Acute (<3 weeks): Most viral, antibiotics not needed\n• Chronic (>8 weeks): TB, asthma, GERD differentials\n• Hemoptysis (MD15): Always rule out TB first in Indian PHC setting\n• IMNCI: If child <5yrs with cough + fast breathing = pneumonia",
  diabetes: "Diabetes management at PHC:\n• HbA1c target: <7% (individualize for elderly)\n• First line: Metformin 500mg BD → titrate to 1g BD\n• If HbA1c >9% after 3mo dual therapy → start insulin\n• Monitor: HbA1c every 3mo, creatinine annually, eye exam yearly\n• Drug interactions: Metformin + contrast → hold 48h",
  hypertension: "HTN management (NPCDCS guidelines):\n• Stage 1 (140-159/90-99): Lifestyle + single drug\n• Stage 2 (≥160/≥100): Two drug combination\n• First line: ACEi/ARB + CCB or Thiazide\n• Target: <140/90 (<130/80 if DM)\n• Avoid: ACEi in pregnancy, NSAIDs with ACEi+diuretic",
  tb: "TB treatment (RNTCP/NTEP):\n• Category I: 2HRZE/4HR (new cases)\n• Category II: 2HRZES/1HRZE/5HRE (retreatment)\n• DOT mandatory, video DOT preferred\n• Missed doses: >1 dose in month → classify as defaulter\n• MDR suspect: If sputum positive at month 5 → GeneXpert",
  child: "Pediatric assessment (IMNCI):\n• Check: Temperature, Respiratory rate, Weight, MUAC\n• Pneumonia: Fast breathing OR chest indrawing → Amoxicillin\n• Diarrhea: ORS + Zinc (20mg x 14 days)\n• Malnutrition: MUAC <115mm = SAM → referral\n• Danger signs: Not able to drink/breastfeed, convulsions, lethargy",
  pregnancy: "ANC care (FRU guidelines):\n• 4+ visits minimum (AIIMS protocol)\n• BP monitoring every visit → if ≥140/90 → label GH\n• Proteinuria: Dipstick at every visit\n• Anemia: Hb <7 → transfusion, Hb 7-10 → Iron sucrose\n• GDM: OGTT at 24-28 weeks, insulin if fasting >95",
  drugs: "Common drug interactions at PHC:\n• Triple whammy: NSAID + ACEi + Diuretic → AKI\n• Warfarin + NSAID → bleeding risk\n• Metformin + contrast → hold 48h\n• Methotrexate + Trimethoprim → pancytopenia\n• SSRI + Tramadol → serotonin syndrome",
  abdm: "ABDM/ABHA workflow:\n1. Patient provides 14-digit ABHA ID\n2. OTP sent to linked mobile\n3. Consent granted for specific HI types\n4. Records fetched from HIE (FHIR format)\n5. Encounter summary written back to ABHA\n• All consent artefacts logged with timestamps\n• Patient can revoke consent anytime",
  icd11: "ICD-11 coding reference:\n• A00-B99: Infectious diseases (TB = 1B10)\n• E00-E89: Endocrine (DM = 5A11)\n• I00-I99: Circulatory (HTN = BA00)\n• J00-J99: Respiratory\n• N00-N99: Genitourinary\n• O00-O9A: Pregnancy\n• P00-P96: Perinatal\n• Z00-Z99: Factors influencing health status",
  triage: "Triage severity levels:\n• EMERGENCY (Red): Chest pain, severe bleeding, seizures, shock\n• URGENT (Orange): High fever + dehydration, acute abdomen,MODS\n• SEMI-URGENT (Yellow): Persistent vomiting, moderate pain\n• NON-URGENT (Green): Chronic disease follow-up, minor complaints\n• In PHC: Use IMNCI for children, NPCDCS for NCDs",
};

export async function POST(request: Request) {
  try {
    const { message, patient_id } = await request.json();

    if (!message) {
      return NextResponse.json({ reply: "Please enter a message." }, { status: 400 });
    }

    // Try Python backend first
    const pythonApiUrl = process.env.PYTHON_API_URL || 'http://localhost:8000';
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000);
      const response = await fetch(`${pythonApiUrl}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, patient_id }),
        signal: controller.signal,
      });
      clearTimeout(timeout);
      if (response.ok) {
        const data = await response.json();
        return NextResponse.json({ reply: data.reply || data.response || data.message });
      }
    } catch {
      // Python backend unreachable — use local knowledge base
    }

    // Local clinical knowledge base matching
    const lower = message.toLowerCase();
    let reply = "";

    // Search the knowledge base for matching topics
    let bestMatch = "";
    let bestScore = 0;
    for (const [keyword, content] of Object.entries(CLINICAL_KB)) {
      const words = keyword.split(" ");
      let score = 0;
      for (const word of words) {
        if (lower.includes(word)) score++;
      }
      if (score > bestScore) {
        bestScore = score;
        bestMatch = content;
      }
    }

    if (bestScore > 0) {
      reply = bestMatch;
    } else if (lower.includes("hello") || lower.includes("namaste") || lower.includes("hi")) {
      reply = "Namaste! I'm SehatAI Clinical Assistant. I can help with:\n\n• Disease management protocols (DM, HTN, TB, ANC)\n• Drug interactions and prescriptions\n• ICD-11 coding assistance\n• IMNCI/NPCDCS guidelines\n• ABHA workflow guidance\n• Triage severity assessment\n\nWhat would you like to know?";
    } else if (lower.includes("patient") || lower.includes("summary") || lower.includes("history")) {
      reply = patient_id
        ? `Loading clinical context for patient ${patient_id}.\n\nThe AI summary includes:\n• One-liner overview\n• Active problems with ICD-11 codes\n• Red flags and alerts\n• Medication reconciliation\n• Missing data suggestions\n\nNavigate to the Dashboard tab to view the full clinical summary.`
        : "To get a patient summary, select a patient from the Dashboard. The summary pulls from ABHA-linked records and generates a structured clinical overview with red flags.";
    } else if (lower.includes("thank") || lower.includes("thanks")) {
      reply = "You're welcome! Feel free to ask if you have more clinical questions.";
    } else {
      reply = `I can help with clinical queries. Try asking about:\n\n• **Fever** — differential diagnosis and management\n• **Diabetes** — treatment protocols (DM)\n• **Hypertension** — BP management (HTN)\n• **TB** — DOTS regimen and follow-up\n• **Pediatric** — IMNCI assessment\n• **Pregnancy** — ANC care protocols\n• **Drugs** — interaction checks\n• **ABHA** — consent and record workflow\n• **ICD-11** — coding reference\n\nWhat clinical topic would you like to explore?`;
    }

    return NextResponse.json({ reply });
  } catch {
    return NextResponse.json(
      { reply: "I'm experiencing a temporary issue. Please try again." },
      { status: 500 }
    );
  }
}
