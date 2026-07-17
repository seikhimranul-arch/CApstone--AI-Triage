'use client'

import { useState, useEffect, useMemo } from 'react'

interface Patient {
  id: string
  filename: string
  archetype: string
  name: string
  age: number
  gender: string
  one_liner: string
  red_flags: Array<{type: string, message: string}>
  chronic_tags: string[]
  red_flag_count: {critical: number, warning: number}
  vitals_history: Array<{type: string, value: number, unit: string, date: string}>
  encounters: Array<{date: string, type: string, provider: string}>
  medications: Array<{name: string, dose: string, start: string}>
}

const FILTER_TYPES: Array<{key: FilterKey, label: string}> = [
  {key: 'all', label: 'All'},
  {key: 'encounter', label: '🏥 Encounters'},
  {key: 'vital', label: '📊 Vitals'},
  {key: 'medication', label: '💊 Meds'},
  {key: 'lab', label: '📄 Labs'},
  {key: 'diagnosis', label: '🩺 Dx'},
]

const TIMELINE_COLORS = {
  encounter: 'bg-blue-500',
  vital: 'bg-green-500',
  medication: 'bg-purple-500',
  lab: 'bg-orange-500',
  diagnosis: 'bg-red-500',
}

interface TimelineEvent {
  id: string
  date: string
  type: keyof typeof TIMELINE_COLORS
  title: string
  detail: string
  icon: string
}

type FilterKey = 'all' | 'encounter' | 'vital' | 'medication' | 'lab' | 'diagnosis';

interface VariantCProps {
  patients: Array<{filename: string, archetype: string}>
  onSelect: (patient: Patient) => void
  selectedId: string | undefined
}

export function VariantC({ patients: initialPatients, onSelect, selectedId }: VariantCProps) {
  const [patients, setPatients] = useState<Patient[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null)
  const [activeFilter, setActiveFilter] = useState<FilterKey>('all')
  const [search, setSearch] = useState('')

  // Load patient data
  useEffect(() => {
    const archetypeData: Record<string, Partial<Patient>> = {
      'uncontrolled_dm': { 
        name: 'Rajesh Sharma', age: 52, gender: 'M', 
        one_liner: '52M, uncontrolled T2DM (HbA1c 9.2%↑), HTN on 3 meds, missed FU 105d',
        chronic_tags: ['DM', 'HTN'],
        red_flags: [{type: 'critical', message: 'HbA1c 9.2%'}, {type: 'warning', message: 'BP 148/94'}, {type: 'warning', message: 'No visit 105d'}],
        red_flag_count: {critical: 1, warning: 2},
        vitals_history: [
          {type: 'vital', value: 9.2, unit: '%', date: '2026-01-15'},
          {type: 'vital', value: 8.9, unit: '%', date: '2025-10-20'},
          {type: 'vital', value: 8.5, unit: '%', date: '2025-06-10'},
          {type: 'vital', value: 148, unit: 'mmHg', date: '2026-01-15'},
          {type: 'vital', value: 94, unit: 'mmHg', date: '2026-01-15'},
        ],
        encounters: [
          {date: '2025-10-20', type: 'Follow-up', provider: 'Dr. Patel'},
          {date: '2025-06-10', type: 'Initial', provider: 'Dr. Shah'},
        ],
        medications: [
          {name: 'Metformin 500mg', dose: '500 mg BD', start: '2025-06-10'},
          {name: 'Glimepiride 2mg', dose: '2 mg OD', start: '2025-06-10'},
          {name: 'Amlodipine 5mg', dose: '5 mg OD', start: '2025-10-20'},
        ],
      },
      'missed_tb_fu': { 
        name: 'Amit Patel', age: 35, gender: 'M',
        one_liner: '35M, pulmonary TB on DOTS, missed 2 doses, weight loss 8%, LFTs elevated',
        chronic_tags: ['TB'],
        red_flags: [{type: 'critical', message: 'Missed >2 DOTS doses'}, {type: 'critical', message: 'Weight loss >5%'}, {type: 'warning', message: 'ALT 2x ULN'}],
        red_flag_count: {critical: 2, warning: 1},
        vitals_history: [
          {type: 'vital', value: 52, unit: 'kg', date: '2026-01-10'},
          {type: 'vital', value: 56, unit: 'kg', date: '2025-12-01'},
          {type: 'vital', value: 61, unit: 'kg', date: '2025-11-01'},
          {type: 'vital', value: 120, unit: 'U/L', date: '2026-01-10'},
        ],
        encounters: [
          {date: '2025-12-15', type: 'DOTS', provider: 'CHW Meena'},
          {date: '2025-11-20', type: 'DOTS', provider: 'CHW Meena'},
        ],
        medications: [
          {name: 'Isoniazid 300mg', dose: '300 mg OD', start: '2025-10-01'},
          {name: 'Rifampicin 450mg', dose: '450 mg OD', start: '2025-10-01'},
          {name: 'Pyrazinamide 1.5g', dose: '1500 mg OD', start: '2025-10-01'},
          {name: 'Ethambutol 800mg', dose: '800 mg OD', start: '2025-10-01'},
        ],
      },
      'polypharmacy_elderly': { 
        name: 'Sunita Devi', age: 72, gender: 'F',
        one_liner: '72F, HTN+DM+CKD3+OA, 7 meds incl NSAID+ACEi+diuretic, fall risk',
        chronic_tags: ['HTN', 'DM'],
        red_flags: [{type: 'critical', message: 'Triple whammy: NSAID+ACEi+Diuretic'}, {type: 'critical', message: 'eGFR 38 on Metformin'}, {type: 'warning', message: 'Fall risk: 7+ meds'}],
        red_flag_count: {critical: 2, warning: 1},
        vitals_history: [
          {type: 'vital', value: 142, unit: 'mmHg', date: '2026-01-12'},
          {type: 'vital', value: 88, unit: 'mmHg', date: '2026-01-12'},
          {type: 'vital', value: 7.8, unit: '%', date: '2026-01-12'},
          {type: 'vital', value: 1.8, unit: 'mg/dL', date: '2026-01-12'},
        ],
        encounters: [
          {date: '2026-01-12', type: 'Follow-up', provider: 'Dr. Reddy'},
          {date: '2025-12-15', type: 'Follow-up', provider: 'Dr. Reddy'},
        ],
        medications: [
          {name: 'Amlodipine 5mg', dose: '5 mg OD', start: '2024-01-15'},
          {name: 'Telmisartan 40mg', dose: '40 mg OD', start: '2024-06-20'},
          {name: 'Metformin 500mg', dose: '500 mg BD', start: '2023-11-10'},
          {name: 'Glimepiride 1mg', dose: '1 mg OD', start: '2024-03-05'},
          {name: 'Atorvastatin 20mg', dose: '20 mg ON', start: '2024-06-20'},
          {name: 'Pantoprazole 40mg', dose: '40 mg OD', start: '2024-08-10'},
          {name: 'Diclofenac 50mg', dose: '50 mg SOS', start: '2024-10-01'},
        ],
      },
      'high_risk_anc': { 
        name: 'Priya Singh', age: 28, gender: 'F',
        one_liner: '28F G2P1 28wks, GHTN (152/98↑), GDM (HbA1c 6.8%), anemia Hb 9.2↓',
        chronic_tags: ['DM', 'HTN'],
        red_flags: [{type: 'critical', message: 'BP 152/98 rising'}, {type: 'critical', message: 'Hb 9.2 g/dL'}, {type: 'warning', message: 'Proteinuria 150mg'}],
        red_flag_count: {critical: 2, warning: 1},
        vitals_history: [
          {type: 'vital', value: 152, unit: 'mmHg', date: '2026-01-18'},
          {type: 'vital', value: 98, unit: 'mmHg', date: '2026-01-18'},
          {type: 'vital', value: 6.8, unit: '%', date: '2026-01-18'},
          {type: 'vital', value: 9.2, unit: 'g/dL', date: '2026-01-18'},
          {type: 'vital', value: 150, unit: 'mg/dL', date: '2026-01-18'},
        ],
        encounters: [
          {date: '2026-01-18', type: 'ANC', provider: 'Dr. Mehta'},
          {date: '2026-01-04', type: 'ANC', provider: 'Dr. Mehta'},
        ],
        medications: [
          {name: 'Methyldopa 250mg', dose: '250 mg TDS', start: '2025-12-01'},
          {name: 'Metformin 500mg', dose: '500 mg BD', start: '2025-12-15'},
          {name: 'Iron sucrose 100mg', dose: '100 mg weekly IV', start: '2026-01-18'},
        ],
      },
      'faltering_growth': { 
        name: 'Rohan Kumar', age: 2, gender: 'M',
        one_liner: '2M, severe wasting (WFA -3.2 SD), MUAC 112mm, recurrent LRI, no weight gain 3mo',
        chronic_tags: ['PED'],
        red_flags: [{type: 'critical', message: 'WFA < -3 SD'}, {type: 'critical', message: 'MUAC 112mm'}, {type: 'warning', message: 'No weight gain 3mo'}],
        red_flag_count: {critical: 2, warning: 1},
        vitals_history: [
          {type: 'vital', value: 6.2, unit: 'kg', date: '2026-01-15'},
          {type: 'vital', value: 6.2, unit: 'kg', date: '2025-12-10'},
          {type: 'vital', value: 6.3, unit: 'kg', date: '2025-11-05'},
          {type: 'vital', value: 112, unit: 'mm', date: '2026-01-15'},
          {type: 'vital', value: 8.5, unit: 'g/dL', date: '2026-01-15'},
        ],
        encounters: [
          {date: '2026-01-15', type: 'Growth', provider: 'Dr. Kumar'},
          {date: '2025-12-10', type: 'Sick visit', provider: 'Dr. Kumar'},
        ],
        medications: [
          {name: 'RUTF', dose: '1 sachet TDS', start: '2026-01-15'},
          {name: 'Zinc 20mg', dose: '20 mg OD x14d', start: '2026-01-15'},
          {name: 'Amoxicillin 250mg', dose: '250 mg TDS x5d', start: '2026-01-10'},
        ],
      },
    }

    const mapped = initialPatients.map((p, i) => {
      const base = archetypeData[p.archetype] || {}
      return {
        id: p.filename,
        filename: p.filename,
        archetype: p.archetype,
        name: base.name || `Patient ${i + 1}`,
        age: base.age || 30,
        gender: base.gender || 'M',
        one_liner: base.one_liner || 'Clinical summary pending',
        red_flags: base.red_flags || [],
        chronic_tags: base.chronic_tags || [],
        red_flag_count: base.red_flag_count || {critical: 0, warning: 0},
        vitals_history: base.vitals_history || [],
        encounters: base.encounters || [],
        medications: base.medications || [],
      }
    })
    setPatients(mapped)
    setLoading(false)
  }, [initialPatients])

  // Filter patients
  const filtered = useMemo(() => patients.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.archetype.toLowerCase().includes(search.toLowerCase()) ||
    p.one_liner.toLowerCase().includes(search.toLowerCase())
  ), [patients, search])

  // Build timeline for selected patient
  const timeline = useMemo(() => {
    if (!selectedPatient) return []
    const events: TimelineEvent[] = []
    
    selectedPatient.encounters.forEach((e, i) => {
      events.push({
        id: `enc-${i}`,
        date: e.date,
        type: 'encounter',
        title: e.type,
        detail: `Provider: ${e.provider}`,
        icon: '🏥',
      })
    })
    
    selectedPatient.vitals_history.forEach((v, i) => {
      events.push({
        id: `vital-${i}`,
        date: v.date,
        type: 'vital',
        title: `${v.type.toUpperCase()}: ${v.value} ${v.unit}`,
        detail: `Recorded on ${v.date}`,
        icon: '📊',
      })
    })
    
    selectedPatient.medications.forEach((m, i) => {
      events.push({
        id: `med-${i}`,
        date: m.start,
        type: 'medication',
        title: `Started: ${m.name}`,
        detail: `Dose: ${m.dose}`,
        icon: '💊',
      })
    })
    
    return events
      .filter(e => activeFilter === 'all' || e.type === activeFilter)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  }, [selectedPatient, activeFilter])

  // Select patient
  const handleSelect = (patient: Patient) => {
    setSelectedPatient(patient)
    onSelect(patient)
  }

  const isSelected = (id: string) => selectedId === id

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
              Clinical Timeline View
            </h1>
          </div>
          <div className="flex flex-wrap gap-2">
            <input
              type="text"
              placeholder="Search patients..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="flex-1 min-w-[200px] px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <div className="flex gap-1 bg-gray-100 dark:bg-gray-700 p-1 rounded-lg">
              {FILTER_TYPES.map(f => (
                <button
                  key={f.key}
                  onClick={() => setActiveFilter(f.key)}
                  className={`px-3 py-1.5 text-xs rounded transition-colors ${
                    activeFilter === f.key
                      ? 'bg-white dark:bg-gray-800 shadow text-gray-900 dark:text-white'
                      : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex overflow-hidden">
        {/* Patient Sidebar */}
        <aside className="w-80 flex-shrink-0 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 overflow-y-auto">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Patients ({filtered.length})
            </h2>
          </div>
          <div className="p-2">
            {filtered.map(patient => {
              const criticalCount = patient.red_flag_count.critical
              const warningCount = patient.red_flag_count.warning
              return (
                <button
                  key={patient.id}
                  onClick={() => handleSelect(patient)}
                  className={`w-full text-left p-3 rounded-xl transition-all ${
                    isSelected(patient.id)
                      ? 'bg-blue-50 dark:bg-blue-900/20 ring-2 ring-blue-500'
                      : 'hover:bg-gray-100 dark:hover:bg-gray-700/50'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="font-medium text-gray-900 dark:text-white truncate">
                        {patient.name}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                        {patient.age}{patient.gender} • #{patient.id.slice(-4)}
                      </div>
                    </div>
                    <div className="flex gap-1 flex-shrink-0">
                      {criticalCount > 0 && (
                        <span className="px-1.5 py-0.5 text-[10px] font-medium rounded bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
                          {criticalCount}🔴
                        </span>
                      )}
                      {warningCount > 0 && (
                        <span className="px-1.5 py-0.5 text-[10px] font-medium rounded bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400">
                          {warningCount}🟡
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="mt-2 text-xs text-gray-600 dark:text-gray-400 line-clamp-2">
                    {patient.one_liner}
                  </div>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {patient.chronic_tags.map(tag => (
                      <span
                        key={tag}
                        className="px-1.5 py-0.5 text-[10px] font-medium rounded bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </button>
              )
            })}
            {filtered.length === 0 && (
              <div className="py-8 text-center text-gray-500 dark:text-gray-400 text-sm">
                No patients match your search
              </div>
            )}
          </div>
        </aside>

        {/* Timeline Panel */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Patient Header */}
          {selectedPatient && (
            <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4 sticky top-16 z-10">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                    {selectedPatient.name}
                  </h2>
                  <div className="flex items-center gap-4 mt-1 text-sm text-gray-500 dark:text-gray-400">
                    <span>{selectedPatient.age}{selectedPatient.gender}</span>
                    <span>#{selectedPatient.id.slice(-4)}</span>
                    <span className="px-2 py-0.5 text-xs bg-gray-100 dark:bg-gray-700 rounded">
                      {selectedPatient.chronic_tags.join(', ')}
                    </span>
                  </div>
                  <p className="mt-2 text-gray-700 dark:text-gray-300 text-sm">
                    {selectedPatient.one_liner}
                  </p>
                </div>
                <div className="flex gap-2">
                  {selectedPatient.red_flags.map((flag, i) => (
                    <span
                      key={i}
                      className={`px-2 py-1 text-xs font-medium rounded-full ${
                        flag.type === 'critical' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                        flag.type === 'warning' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' :
                        'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                      }`}
                    >
                      {flag.message}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Timeline */}
          <div className="flex-1 overflow-y-auto p-4">
            {selectedPatient ? (
              timeline.length === 0 ? (
                <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400">
                  No events for selected filter
                </div>
              ) : (
                <div className="max-w-3xl mx-auto">
                  <div className="relative">
                    {/* Center line */}
                    <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gray-200 dark:bg-gray-700" />
                    
                    {timeline.map((event, index) => (
                      <div
                        key={event.id}
                        className="relative pl-20 pb-8 last:pb-0"
                      >
                        {/* Timeline dot */}
                        <div className="absolute left-4 top-1 w-8 h-8 rounded-full flex items-center justify-center border-4 border-white dark:border-gray-800 shadow-sm">
                          <div className={`w-3 h-3 rounded-full ${TIMELINE_COLORS[event.type]}`} />
                        </div>
                        
                        {/* Date marker (show for first event of each date) */}
                        {index === 0 || timeline[index - 1].date !== event.date ? (
                          <div className="absolute left-20 -top-2 text-xs text-gray-500 dark:text-gray-400 font-medium whitespace-nowrap">
                            {new Date(event.date).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })}
                          </div>
                        ) : null}
                        
                        {/* Event card */}
                        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 shadow-sm hover:shadow-md transition-shadow">
                          <div className="flex items-start gap-3">
                            <span className="text-lg mt-0.5">{event.icon}</span>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <h3 className="font-medium text-gray-900 dark:text-white">
                                  {event.title}
                                </h3>
                                <span className="px-2 py-0.5 text-[10px] font-medium rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 uppercase">
                                  {event.type}
                                </span>
                              </div>
                              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                {event.detail}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400">
                <div className="text-center">
                  <div className="text-6xl mb-4">📅</div>
                  <p className="text-lg">Select a patient to view timeline</p>
                  <p className="text-sm mt-1">Events: encounters, vitals, medications, labs</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}