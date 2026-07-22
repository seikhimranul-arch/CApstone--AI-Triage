import { NextResponse } from 'next/server';

const CLINICAL_KB: Record<string, string> = {
  fever: `**Suggested Evaluation (Fever — MG44):**
• Consider CBC, malaria smear, blood culture if high-grade
• Paracetamol 500-1000mg QID; tepid sponging if >39°C
• **Flag if:** Fever >5 days, rash, neck stiffness, altered sensorium → refer

⚠ *This is a clinical suggestion. Please verify based on patient presentation.*`,

  cough: `**Suggested Approach (Cough — MD11):**
• Acute (<3 weeks): Likely viral, antibiotics usually not needed
• Chronic (>8 weeks): Consider TB, asthma, GERD
• Hemoptysis → Always rule out TB first in PHC setting
• IMNCI: Child <5yr + fast breathing = pneumonia → Amoxicillin

⚠ *Please correlate with examination findings before initiating treatment.*`,

  diabetes: `**Suggested DM Management (PHC Protocol):**
• HbA1c target: <7% (individualize for elderly/frail)
• First line: Metformin 500mg BD → titrate to 1g BD
• If HbA1c >9% after 3mo dual therapy → consider insulin
• Monitor: HbA1c every 3mo, creatinine annually

⚠ *Please review current medications and adjust per patient-specific factors.*`,

  hypertension: `**Suggested HTN Protocol (NPCDCS):**
• Stage 1 (140-159/90-99): Lifestyle + single drug
• Stage 2 (≥160/≥100): Two-drug combination
• Target: <140/90 (<130/80 if DM)
• Avoid: ACEi in pregnancy, NSAIDs with ACEi+diuretic

⚠ *Please confirm BP readings and patient-specific contraindications.*`,

  tb: `**Suggested TB Protocol (NTEP):**
• New case: 2HRZE/4HR (Category I)
• Missed doses >1 in month → classify as defaulter
• Month 5 sputum positive → GeneXpert for MDR suspect
• DOT mandatory, video DOT preferred

⚠ *Please verify adherence history and current regimen compliance.*`,

  anc: `**Suggested ANC Protocol (FRU Guidelines):**
• Minimum 4 antenatal visits
• BP every visit → if ≥140/90 → label Gestational HTN
• Hb <7: consider transfusion; 7-10: Iron sucrose
• GDM: OGTT at 24-28 weeks

⚠ *Please assess individual risk profile before treatment decisions.*`,

  child: `**Suggested Pediatric Assessment (IMNCI):**
• Check: Temp, RR, Weight, MUAC
• Pneumonia: Fast breathing OR chest indrawing → Amoxicillin
• Diarrhea: ORS + Zinc (20mg × 14 days)
• MUAC <115mm = SAM → refer

⚠ *Please complete full IMNCI assessment before classifying.*`,

  drugs: `**Potential Drug Interactions (Review Required):**
• Triple whammy: NSAID + ACEi + Diuretic → AKI risk
• Metformin + contrast dye → hold 48h
• Warfarin + NSAID → bleeding risk
• Methotrexate + Trimethoprim → pancytopenia

⚠ *Please cross-check with patient's current medication list.*`,

  triage: `**Triage Severity Guide (Reference Only):**
• EMERGENCY (Red): Chest pain, severe bleeding, seizures, shock
• URGENT (Orange): High fever + dehydration, acute abdomen
• SEMI-URGENT (Yellow): Persistent vomiting, moderate pain
• NON-URGENT (Green): Chronic follow-up, minor complaints

⚠ *Final triage decision rests with the attending physician.*`,

  abdm: `**ABHA Workflow Summary:**
1. Patient provides 14-digit ABHA ID
2. OTP sent to linked mobile → verify
3. Consent granted for specific HI types
4. Records fetched (FHIR format)
5. Encounter summary written back

⚠ *Always obtain explicit patient consent before accessing records.*`,

  icd11: `**ICD-11 Quick Reference:**
• A00-B99: Infectious (TB = 1B10)
• E00-E89: Endocrine (DM = 5A11)
• I00-I99: Circulatory (HTN = BA00)
• O00-O9A: Pregnancy-related
• Z00-Z99: Health status factors

⚠ *Please confirm coding with clinical findings.*`,
};

function findBestMatch(message: string): string | null {
  const lower = message.toLowerCase();
  let bestMatch: string | null = null;
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

  return bestScore > 0 ? bestMatch : null;
}

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
        const reply = data.reply || data.response || data.message;
        // Ensure backend replies also include disclaimer
        if (!reply.includes("⚠")) {
          return NextResponse.json({ reply: reply + "\n\n⚠ *SehatAI provides clinical decision support. Final decisions rest with the physician.*" });
        }
        return NextResponse.json({ reply });
      }
    } catch {
      // Python backend unreachable — use local knowledge base
    }

    const lower = message.toLowerCase();
    let reply = "";

    // Greeting
    if (lower.includes("hello") || lower.includes("namaste") || lower.includes("hi")) {
      reply = `**Namaste! I'm SehatAI Clinical Assistant.** 🩺

I can help with clinical decision **support** — here's what I can suggest:
• Disease protocols (DM, HTN, TB, ANC, Pediatric)
• Drug interaction checks
• ICD-11 coding reference
• Triage severity guidance
• ABHA workflow help

**What clinical question can I help with?**

⚠ *All outputs are suggestions. Please verify with your clinical judgment.*`;
    }
    // Patient context
    else if (lower.includes("patient") || lower.includes("summary") || lower.includes("history")) {
      reply = patient_id
        ? `**Loading clinical context for patient ${patient_id}.**

The AI summary includes:
• One-liner overview
• Active problems with ICD-11 codes
• Red flags and alerts
• Medication reconciliation

👉 Navigate to the Dashboard tab to view the full clinical summary.

⚠ *Please review the summary against your own examination findings.*`
        : `**To get a patient summary, select a patient from the Dashboard.**

The summary pulls from ABHA-linked records and generates a structured overview with red flags.

⚠ *AI summaries are decision-support aids, not replacements for clinical assessment.*`;
    }
    // Thank you
    else if (lower.includes("thank") || lower.includes("thanks")) {
      reply = "You're welcome! Feel free to ask more clinical questions.\n\n⚠ *Always verify suggestions with patient-specific clinical findings.*";
    }
    // Clinical knowledge base matching
    else {
      const match = findBestMatch(message);
      if (match) {
        reply = match;
      } else {
        reply = `**I can suggest on these clinical topics:**
• **Fever** — differential & management
• **Cough** — acute vs chronic approach
• **Diabetes** — PHC treatment protocol
• **Hypertension** — NPCDCS guidelines
• **TB** — DOTS regimen & follow-up
• **ANC** — antenatal care protocol
• **Pediatric** — IMNCI assessment
• **Drugs** — interaction checks
• **ABHA** — consent & record workflow
• **ICD-11** — coding reference

⚠ *SehatAI provides decision support only. All clinical decisions must be made by the attending physician based on individual patient assessment.*`;
      }
    }

    return NextResponse.json({ reply });
  } catch {
    return NextResponse.json(
      { reply: "I'm experiencing a temporary issue. Please try again.\n\n⚠ *SehatAI is a clinical decision support tool. It does not replace professional medical judgment.*" },
      { status: 500 }
    );
  }
}
