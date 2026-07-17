'use client'

import { useState } from 'react'

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
}

interface VariantAProps {
  patients: Array<{filename: string, archetype: string}>
  onSelect: (patient: Patient) => void
  selectedId: string | undefined
}

const ARCHETYPE_LABELS: Record<string, string> = {
  'uncontrolled_dm': '🔴 Uncontrolled DM',
  'missed_tb_fu': '🟠 Missed TB FU',
  'polypharmacy_elderly': '🟣 Polypharmacy',
  'high_risk_anc': '🔵 High-Risk ANC',
  'faltering_growth': '🟢 Faltering Growth',
}

const FLAG_COLORS = {
  critical: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  warning: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  info: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
}

const CHRONIC_COLORS: Record<string, string> = {
  DM: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  HTN: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  TB: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
  PED: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
}

export function VariantA({ patients: initialPatients, onSelect, selectedId }: VariantAProps) {
  const [patients, setPatients] = useState<Patient[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  // Load patient data
  const archetypeData: Record<string, Partial<Patient>> = {
    'uncontrolled_dm': { name: 'Rajesh Sharma', age: 52, gender: 'M', one_liner: '52M, uncontrolled T2DM (HbA1c 9.2%↑), HTN on 3 meds, missed FU 105d', chronic_tags: ['DM', 'HTN'], red_flags: [{type: 'critical', message: 'HbA1c 9.2%'}, {type: 'warning', message: 'BP 148/94'}, {type: 'warning', message: 'No visit 105d'}], red_flag_count: {critical: 1, warning: 2} },
    'missed_tb_fu': { name: 'Amit Patel', age: 35, gender: 'M', one_liner: '35M, pulmonary TB on DOTS, missed 2 doses, weight loss 8%, LFTs elevated', chronic_tags: ['TB'], red_flags: [{type: 'critical', message: 'Missed >2 DOTS doses'}, {type: 'critical', message: 'Weight loss >5%'}, {type: 'warning', message: 'ALT 2x ULN'}], red_flag_count: {critical: 2, warning: 1} },
    'polypharmacy_elderly': { name: 'Sunita Devi', age: 72, gender: 'F', one_liner: '72F, HTN+DM+CKD3+OA, 7 meds incl NSAID+ACEi+diuretic, fall risk', chronic_tags: ['HTN', 'DM'], red_flags: [{type: 'critical', message: 'Triple whammy: NSAID+ACEi+Diuretic'}, {type: 'critical', message: 'eGFR 38 on Metformin'}, {type: 'warning', message: 'Fall risk: 7+ meds'}], red_flag_count: {critical: 2, warning: 1} },
    'high_risk_anc': { name: 'Priya Singh', age: 28, gender: 'F', one_liner: '28F G2P1 28wks, GHTN (152/98↑), GDM (HbA1c 6.8%), anemia Hb 9.2↓', chronic_tags: ['DM', 'HTN'], red_flags: [{type: 'critical', message: 'BP 152/98 rising'}, {type: 'critical', message: 'Hb 9.2 g/dL'}, {type: 'warning', message: 'Proteinuria 150mg'}], red_flag_count: {critical: 2, warning: 1} },
    'faltering_growth': { name: 'Rohan Kumar', age: 2, gender: 'M', one_liner: '2M, severe wasting (WFA -3.2 SD), MUAC 112mm, recurrent LRI, no weight gain 3mo', chronic_tags: ['PED'], red_flags: [{type: 'critical', message: 'WFA < -3 SD'}, {type: 'critical', message: 'MUAC 112mm'}, {type: 'warning', message: 'No weight gain 3mo'}], red_flag_count: {critical: 2, warning: 1} },
  }

  // Initialize patients
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
    }
  })
  setPatients(mapped)
  setLoading(false)

  const filtered = patients.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.archetype.toLowerCase().includes(search.toLowerCase()) ||
    p.one_liner.toLowerCase().includes(search.toLowerCase())
  )

  const isSelected = (id: string) => selectedId === id

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"/></div>
  }

  return (
    <div className="h-full flex flex-col bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-xl font-semibold text-gray-900 dark:text-white">Patient Cards</h1>
          </div>
          <input
            type="text"
            placeholder="Search patients..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full px-4 py-2.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </header>

      {/* Grid */}
      <main className="flex-1 overflow-y-auto p-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filtered.map(patient => (
              <div
                key={patient.id}
                onClick={() => onSelect(patient)}
                className={`relative bg-white dark:bg-gray-800 rounded-2xl border shadow-sm hover:shadow-lg transition-all duration-200 cursor-pointer ${
                  isSelected(patient.id)
                    ? 'ring-2 ring-blue-500 border-blue-500 dark:border-blue-500'
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                }`}
              >
                {/* Critical flag indicator */}
                {patient.red_flag_count.critical > 0 && (
                  <div className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center ring-2 ring-white dark:ring-gray-800">
                    {patient.red_flag_count.critical}
                  </div>
                )}
                
                <div className="p-5">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold text-lg">
                        {patient.name.charAt(0)}
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900 dark:text-white truncate">
                          {patient.name}
                        </h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {patient.age}{patient.gender} • #{patient.id.slice(-4)}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Archetype badge */}
                  <div className="mb-3">
                    <span className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
                      {ARCHETYPE_LABELS[patient.archetype] || patient.archetype}
                    </span>
                  </div>

                  {/* One-liner */}
                  <p className="text-sm text-gray-700 dark:text-gray-300 mb-3 line-clamp-2 min-h-[3rem]">
                    {patient.one_liner}
                  </p>

                  {/* Red flags */}
                  <div className="mb-3 flex flex-wrap gap-1.5">
                    {patient.red_flags.slice(0, 3).map((flag, i) => (
                      <span
                        key={i}
                        className={`px-2 py-1 text-xs font-medium rounded-full ${FLAG_COLORS[flag.type as keyof typeof FLAG_COLORS] || FLAG_COLORS.info}`}
                      >
                        {flag.message}
                      </span>
                    ))}
                    {patient.red_flags.length > 3 && (
                      <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400">
                        +{patient.red_flags.length - 3} more
                      </span>
                    )}
                  </div>

                  {/* Chronic tags */}
                  <div className="flex flex-wrap gap-1">
                    {patient.chronic_tags.map(tag => (
                      <span
                        key={tag}
                        className={`px-2 py-0.5 text-xs font-medium rounded-full ${CHRONIC_COLORS[tag] || 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'}`}
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {filtered.length === 0 && (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
              <div className="text-4xl mb-2">🔍</div>
              <p>No patients match your search</p>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}