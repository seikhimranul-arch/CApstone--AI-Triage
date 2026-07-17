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

interface VariantBProps {
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

const CHRONIC_COLORS: Record<string, string> = {
  DM: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  HTN: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  TB: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
  PED: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
}

export function VariantB({ patients: initialPatients, onSelect, selectedId }: VariantBProps) {
  const [patients] = useState<Patient[]>(() => {
    const archetypeData: Record<string, Partial<Patient>> = {
      'uncontrolled_dm': { name: 'Rajesh Sharma', age: 52, gender: 'M', one_liner: '52M, uncontrolled T2DM (HbA1c 9.2%↑), HTN on 3 meds, missed FU 105d', chronic_tags: ['DM', 'HTN'], red_flags: [{type: 'critical', message: 'HbA1c 9.2%'}, {type: 'warning', message: 'BP 148/94'}, {type: 'warning', message: 'No visit 105d'}], red_flag_count: {critical: 1, warning: 2} },
      'missed_tb_fu': { name: 'Amit Patel', age: 35, gender: 'M', one_liner: '35M, pulmonary TB on DOTS, missed 2 doses, weight loss 8%, LFTs elevated', chronic_tags: ['TB'], red_flags: [{type: 'critical', message: 'Missed >2 DOTS doses'}, {type: 'critical', message: 'Weight loss >5%'}, {type: 'warning', message: 'ALT 2x ULN'}], red_flag_count: {critical: 2, warning: 1} },
      'polypharmacy_elderly': { name: 'Sunita Devi', age: 72, gender: 'F', one_liner: '72F, HTN+DM+CKD3+OA, 7 meds incl NSAID+ACEi+diuretic, fall risk', chronic_tags: ['HTN', 'DM'], red_flags: [{type: 'critical', message: 'Triple whammy: NSAID+ACEi+Diuretic'}, {type: 'critical', message: 'eGFR 38 on Metformin'}, {type: 'warning', message: 'Fall risk: 7+ meds'}], red_flag_count: {critical: 2, warning: 1} },
      'high_risk_anc': { name: 'Priya Singh', age: 28, gender: 'F', one_liner: '28F G2P1 28wks, GHTN (152/98↑), GDM (HbA1c 6.8%), anemia Hb 9.2↓', chronic_tags: ['DM', 'HTN'], red_flags: [{type: 'critical', message: 'BP 152/98 rising'}, {type: 'critical', message: 'Hb 9.2 g/dL'}, {type: 'warning', message: 'Proteinuria 150mg'}], red_flag_count: {critical: 2, warning: 1} },
      'faltering_growth': { name: 'Rohan Kumar', age: 2, gender: 'M', one_liner: '2M, severe wasting (WFA -3.2 SD), MUAC 112mm, recurrent LRI, no weight gain 3mo', chronic_tags: ['PED'], red_flags: [{type: 'critical', message: 'WFA < -3 SD'}, {type: 'critical', message: 'MUAC 112mm'}, {type: 'warning', message: 'No weight gain 3mo'}], red_flag_count: {critical: 2, warning: 1} },
    }
    return initialPatients.map((p, i) => {
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
  })

  const [search, setSearch] = useState('')
  const [sortCol, setSortCol] = useState<string>('')
  const [sortAsc, setSortAsc] = useState(true)
  const [hoveredId, setHoveredId] = useState<string | null>(null)

  const filtered = patients.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.archetype.toLowerCase().includes(search.toLowerCase()) ||
    p.one_liner.toLowerCase().includes(search.toLowerCase())
  )

  const sorted = [...filtered].sort((a, b) => {
    if (!sortCol) return 0
    const aVal = String(a[sortCol as keyof Patient] ?? '')
    const bVal = String(b[sortCol as keyof Patient] ?? '')
    return sortAsc ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal)
  })

  const toggleSort = (col: string) => {
    if (sortCol === col) {
      setSortAsc(!sortAsc)
    } else {
      setSortCol(col)
      setSortAsc(true)
    }
  }

  const getRowClass = (patient: Patient) => {
    if (selectedId === patient.id) return 'bg-blue-50 dark:bg-blue-900/20'
    if (patient.red_flag_count.critical > 0) return 'bg-red-50/30 dark:bg-red-900/10'
    if (patient.red_flag_count.warning > 0) return 'bg-yellow-50/30 dark:bg-yellow-900/10'
    return 'bg-white dark:bg-gray-800'
  }

  return (
    <div className="h-full flex flex-col bg-gray-50 dark:bg-gray-900">
      {/* Toolbar */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            placeholder="Search patients... (name, condition, summary)"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="flex-1 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <div className="flex gap-2 text-xs">
            {[
              {key: 'name', label: 'Name', w: 'w-36'},
              {key: 'archetype', label: 'Type', w: 'w-20'},
              {key: 'age', label: 'Age', w: 'w-16'},
              {key: '', label: 'Flags', w: 'w-20'},
            ].map(col => (
              <button
                key={col.label}
                onClick={() => col.key && toggleSort(col.key)}
                className={`px-3 py-2 rounded-lg border transition-colors ${
                  sortCol === col.key
                    ? 'bg-blue-50 dark:bg-blue-900/30 border-blue-300 dark:border-blue-700 text-blue-700 dark:text-blue-400'
                    : 'border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                } ${col.w}`}
              >
                {col.label} {sortCol === col.key ? (sortAsc ? '↑' : '↓') : ''}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Table */}
      <main className="flex-1 overflow-auto">
        <div className="max-w-7xl mx-auto">
          <table className="w-full text-sm bg-white dark:bg-gray-800">
            <thead className="sticky top-0 z-10 bg-gray-50 dark:bg-gray-800">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider text-[10px] w-10">#</th>
                <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider text-[10px] cursor-pointer hover:text-gray-700 dark:hover:text-gray-200" onClick={() => toggleSort('name')}>
                  Patient {sortCol === 'name' ? (sortAsc ? '↕' : '↕') : ''}
                </th>
                <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider text-[10px] cursor-pointer hover:text-gray-700 dark:hover:text-gray-200" onClick={() => toggleSort('archetype')}>
                  Archetype {sortCol === 'archetype' ? (sortAsc ? '↕' : '↕') : ''}
                </th>
                <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider text-[10px]">
                  One-Liner
                </th>
                <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider text-[10px]">
                  Flags
                </th>
                <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider text-[10px]">
                  Chronic
                </th>
                <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider text-[10px]">
                  ID
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {sorted.map((patient, index) => (
                <tr
                  key={patient.id}
                  onClick={() => onSelect(patient)}
                  onMouseEnter={() => setHoveredId(patient.id)}
                  onMouseLeave={() => setHoveredId(null)}
                  className={`${getRowClass(patient)} transition-colors cursor-pointer ${
                    hoveredId === patient.id ? 'ring-2 ring-inset ring-blue-400 dark:ring-blue-600' : ''
                  }`}
                >
                  <td className="px-4 py-3 text-gray-500 dark:text-gray-400 font-mono text-xs">
                    {index + 1}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold text-xs flex-shrink-0">
                        {patient.name.charAt(0)}
                      </div>
                      <div className="min-w-0">
                        <div className="font-medium text-gray-900 dark:text-white truncate">
                          {patient.name}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {patient.age}{patient.gender}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-1 text-[10px] font-medium rounded-full bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 whitespace-nowrap">
                      {ARCHETYPE_LABELS[patient.archetype] || patient.archetype}
                    </span>
                  </td>
                  <td className="px-4 py-3 max-w-xs">
                    <div className="flex items-center gap-2">
                      <div className="flex-shrink-0 flex gap-0.5">
                        {patient.red_flags.slice(0, 2).map((flag, i) => (
                          <span
                            key={i}
                            className={`w-2 h-2 rounded-full ${
                              flag.type === 'critical' ? 'bg-red-500' :
                              flag.type === 'warning' ? 'bg-yellow-500' :
                              'bg-blue-500'
                            }`}
                            title={flag.message}
                          />
                        ))}
                      </div>
                      <span className="text-sm text-gray-700 dark:text-gray-300 truncate" title={patient.one_liner}>
                        {patient.one_liner}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      {patient.red_flag_count.critical > 0 && (
                        <span className="px-1.5 py-0.5 text-[10px] font-medium rounded bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400">
                          🔴{patient.red_flag_count.critical}
                        </span>
                      )}
                      {patient.red_flag_count.warning > 0 && (
                        <span className="px-1.5 py-0.5 text-[10px] font-medium rounded bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400">
                          🟡{patient.red_flag_count.warning}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {patient.chronic_tags.map(tag => (
                        <span
                          key={tag}
                          className={`px-1.5 py-0.5 text-[10px] font-medium rounded-full ${CHRONIC_COLORS[tag] || 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'}`}
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-500 dark:text-gray-400 font-mono">
                    #{patient.id.slice(-4)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {sorted.length === 0 && (
            <div className="text-center py-16 text-gray-500 dark:text-gray-400">
              <div className="text-4xl mb-2">🔍</div>
              <p className="text-lg">No patients match your search</p>
              <p className="text-sm mt-1">Try adjusting your search terms</p>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 px-4 py-2 text-xs text-gray-500 dark:text-gray-400 flex items-center justify-between">
        <span>Showing {sorted.length} of {patients.length} patients</span>
        <span className="flex gap-4">
          <span>🔴 Critical = Immediate action</span>
          <span>🟡 Warning = Monitor</span>
        </span>
      </footer>
    </div>
  )
}