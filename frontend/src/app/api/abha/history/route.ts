export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';

const pythonApiUrl = process.env.PYTHON_API_URL || 'http://localhost:8000';

function getArchetypeFromAbha(abha_id: string): string {
  const code = abha_id.length >= 6 ? abha_id.slice(3, 6) : "001";
  const map: Record<string, string> = {
    "001": "uncontrolled_dm",
    "002": "missed_tb_fu",
    "003": "polypharmacy_elderly",
    "004": "high_risk_anc",
    "005": "faltering_growth"
  };
  return map[code] || "uncontrolled_dm";
}

const HISTORY_TEMPLATES: Record<string, any> = {
  uncontrolled_dm: {
    conditions: [
      { resourceType: "Condition", snomedCode: "44054006", display: "Type 2 diabetes mellitus", status: "active" },
      { resourceType: "Condition", snomedCode: "38341003", display: "Hypertensive disorder", status: "active" }
    ],
    medications: [
      { resourceType: "MedicationRequest", medicationCodeableConcept: { text: "Metformin 500mg" }, status: "active", dosageInstruction: [{ text: "500 mg BD" }] },
      { resourceType: "MedicationRequest", medicationCodeableConcept: { text: "Glimepiride 2mg" }, status: "active", dosageInstruction: [{ text: "2 mg OD" }] },
      { resourceType: "MedicationRequest", medicationCodeableConcept: { text: "Amlodipine 5mg" }, status: "active", dosageInstruction: [{ text: "5 mg OD" }] }
    ],
    observations: [
      { resourceType: "Observation", code: { text: "HbA1c" }, valueQuantity: { value: 9.2, unit: "%" } },
      { resourceType: "Observation", code: { text: "Blood pressure" }, valueQuantity: { value: 148, unit: "mmHg" } }
    ],
    encounters: [
      { resourceType: "Encounter", type: [{ text: "Outpatient consultation" }], period: { start: "2024-03-15T10:00:00Z" } }
    ]
  },
  missed_tb_fu: {
    conditions: [
      { resourceType: "Condition", snomedCode: "60963004", display: "Pulmonary tuberculosis", status: "active" }
    ],
    medications: [
      { resourceType: "MedicationRequest", medicationCodeableConcept: { text: "Isoniazid 300mg" }, status: "active", dosageInstruction: [{ text: "300 mg OD" }] },
      { resourceType: "MedicationRequest", medicationCodeableConcept: { text: "Rifampicin 450mg" }, status: "active", dosageInstruction: [{ text: "450 mg OD" }] }
    ],
    observations: [
      { resourceType: "Observation", code: { text: "Weight" }, valueQuantity: { value: 52, unit: "kg" } },
      { resourceType: "Observation", code: { text: "ALT" }, valueQuantity: { value: 120, unit: "U/L" } }
    ],
    encounters: [
      { resourceType: "Encounter", type: [{ text: "Outpatient consultation" }], period: { start: "2024-02-20T09:00:00Z" } }
    ]
  },
  polypharmacy_elderly: {
    conditions: [
      { resourceType: "Condition", snomedCode: "44054006", display: "Type 2 diabetes mellitus", status: "active" },
      { resourceType: "Condition", snomedCode: "38341003", display: "Hypertensive disorder", status: "active" },
      { resourceType: "Condition", snomedCode: "42343007", display: "Chronic kidney disease stage 3", status: "active" }
    ],
    medications: [
      { resourceType: "MedicationRequest", medicationCodeableConcept: { text: "Amlodipine 5mg" }, status: "active", dosageInstruction: [{ text: "5 mg OD" }] },
      { resourceType: "MedicationRequest", medicationCodeableConcept: { text: "Telmisartan 40mg" }, status: "active", dosageInstruction: [{ text: "40 mg OD" }] },
      { resourceType: "MedicationRequest", medicationCodeableConcept: { text: "Metformin 500mg" }, status: "active", dosageInstruction: [{ text: "500 mg BD" }] },
      { resourceType: "MedicationRequest", medicationCodeableConcept: { text: "Diclofenac 50mg" }, status: "active", dosageInstruction: [{ text: "50 mg SOS" }] }
    ],
    observations: [
      { resourceType: "Observation", code: { text: "eGFR" }, valueQuantity: { value: 38, unit: "mL/min" } },
      { resourceType: "Observation", code: { text: "Blood pressure" }, valueQuantity: { value: 142, unit: "mmHg" } }
    ],
    encounters: [
      { resourceType: "Encounter", type: [{ text: "Outpatient consultation" }], period: { start: "2024-04-01T11:00:00Z" } }
    ]
  },
  high_risk_anc: {
    conditions: [
      { resourceType: "Condition", snomedCode: "JA01", display: "Pre-eclampsia", status: "active" }
    ],
    medications: [
      { resourceType: "MedicationRequest", medicationCodeableConcept: { text: "Methyldopa 250mg" }, status: "active", dosageInstruction: [{ text: "250 mg TDS" }] },
      { resourceType: "MedicationRequest", medicationCodeableConcept: { text: "Calcium carbonate 500mg" }, status: "active", dosageInstruction: [{ text: "500 mg OD" }] }
    ],
    observations: [
      { resourceType: "Observation", code: { text: "Blood pressure" }, valueQuantity: { value: 162, unit: "mmHg" } },
      { resourceType: "Observation", code: { text: "Urine protein" }, valueQuantity: { value: 3, unit: "+" } }
    ],
    encounters: [
      { resourceType: "Encounter", type: [{ text: "Antenatal visit" }], period: { start: "2024-05-10T08:00:00Z" } }
    ]
  },
  faltering_growth: {
    conditions: [
      { resourceType: "Condition", snomedCode: "5B00", display: "Protein-energy malnutrition", status: "active" }
    ],
    medications: [
      { resourceType: "MedicationRequest", medicationCodeableConcept: { text: "Multivitamin drops" }, status: "active", dosageInstruction: [{ text: "1 mL OD" }] }
    ],
    observations: [
      { resourceType: "Observation", code: { text: "Weight" }, valueQuantity: { value: 6.8, unit: "kg" } },
      { resourceType: "Observation", code: { text: "Height" }, valueQuantity: { value: 76, unit: "cm" } }
    ],
    encounters: [
      { resourceType: "Encounter", type: [{ text: "Pediatric consultation" }], period: { start: "2024-06-01T09:00:00Z" } }
    ]
  }
};

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { abha_id, consent_id } = body;

    try {
      const response = await fetch(`${pythonApiUrl}/api/abha/history`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ abha_id, consent_id }),
      });
      
      if (response.ok) {
        const data = await response.json();
        return NextResponse.json(data);
      }
    } catch {}

    const archetype = getArchetypeFromAbha(abha_id);
    const tmpl = HISTORY_TEMPLATES[archetype] || HISTORY_TEMPLATES.uncontrolled_dm;

    const entries: any[] = [
      { fullUrl: "urn:uuid:p1", resource: { resourceType: "Patient", id: "p1", name: [{ given: ["Patient"], family: archetype }] } },
      { fullUrl: "urn:uuid:c1", resource: tmpl.conditions[0] },
      { fullUrl: "urn:uuid:m1", resource: tmpl.medications[0] },
      { fullUrl: "urn:uuid:o1", resource: tmpl.observations[0] },
      { fullUrl: "urn:uuid:e1", resource: tmpl.encounters[0] }
    ];

    if (tmpl.conditions[1]) entries.push({ fullUrl: "urn:uuid:c2", resource: tmpl.conditions[1] });
    if (tmpl.medications[1]) entries.push({ fullUrl: "urn:uuid:m2", resource: tmpl.medications[1] });
    if (tmpl.observations[1]) entries.push({ fullUrl: "urn:uuid:o2", resource: tmpl.observations[1] });

    return NextResponse.json({
      resourceType: "Bundle",
      type: "collection",
      total: entries.length,
      entry: entries
    });
  } catch {
    return NextResponse.json({ error: "Failed to fetch ABHA history" }, { status: 500 });
  }
}
