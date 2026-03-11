/**
 * ReportForm
 * Multi-step form with tab navigation between the 5 sections.
 * Each section is saved independently (autosave on submit).
 */
import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { reportsApi } from '../api/reports'
import ReportSection from '../components/report/ReportSection'
import Button from '../components/ui/Button'
import Badge from '../components/ui/Badge'

const SECTIONS = [
  'general_info',
  'circumstances',
  'damage_description',
  'emergency_measures',
  'additional_observations',
]

const SECTION_SHORT = {
  general_info:            'Général',
  circumstances:           'Circ.',
  damage_description:      'Dommages',
  emergency_measures:      'Urgence',
  additional_observations: 'Obs.',
}

function normaliseContent(sectionType, raw) {
  // Convert free-text list fields to proper arrays before saving
  const data = { ...raw }
  if (sectionType === 'damage_description' && data.affected_rooms_raw !== undefined) {
    data.affected_rooms = data.affected_rooms_raw
      ? data.affected_rooms_raw.split(',').map((s) => s.trim()).filter(Boolean)
      : []
    delete data.affected_rooms_raw
  }
  if (sectionType === 'emergency_measures' && data.measures_taken_raw !== undefined) {
    data.measures_taken = data.measures_taken_raw
      ? data.measures_taken_raw.split('\n').map((s) => s.trim()).filter(Boolean)
      : []
    delete data.measures_taken_raw
  }
  return data
}

export default function ReportForm() {
  const { visitId } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [activeSection, setActiveSection] = useState(0)

  const { data: report, isLoading } = useQuery({
    queryKey: ['report', 'visit', visitId],
    queryFn: async () => {
      // The report was created in VisitPage; we need its id
      const reports = await reportsApi.list()
      return reports.find((r) => r.visit_id === parseInt(visitId)) ?? null
    },
  })

  const saveSection = useMutation({
    mutationFn: ({ sectionType, content }) =>
      reportsApi.upsertSection(report.id, sectionType, normaliseContent(sectionType, content)),
    onSuccess: (updated) => {
      queryClient.setQueryData(['report', 'visit', visitId], updated)
    },
  })

  if (isLoading || !report) {
    return (
      <div className="flex justify-center py-16">
        <div className="h-8 w-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  const sectionData = Object.fromEntries(
    report.sections.map((s) => [s.section_type, s.content])
  )

  const currentSection = SECTIONS[activeSection]
  const isLast = activeSection === SECTIONS.length - 1

  function handleSave(sectionType, content) {
    saveSection.mutate(
      { sectionType, content },
      {
        onSuccess: () => {
          if (!isLast) setActiveSection((i) => i + 1)
        },
      }
    )
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Back + status */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate(`/visits/${visitId}`)}
          className="flex items-center gap-1 text-brand-600 text-sm font-medium"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Visite
        </button>
        <Badge status={report.status} />
      </div>

      <p className="text-xs text-gray-500 font-mono">{report.claim_reference}</p>

      {/* Section tabs */}
      <div className="flex overflow-x-auto gap-1 pb-1 -mx-1 px-1">
        {SECTIONS.map((s, i) => {
          const filled = sectionData[s] !== undefined
          return (
            <button
              key={s}
              onClick={() => setActiveSection(i)}
              className={[
                'shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors',
                activeSection === i
                  ? 'bg-brand-600 text-white'
                  : filled
                  ? 'bg-green-100 text-green-700'
                  : 'bg-gray-100 text-gray-600',
              ].join(' ')}
            >
              {SECTION_SHORT[s]}
            </button>
          )
        })}
      </div>

      {/* Active section form */}
      <ReportSection
        key={currentSection}
        sectionType={currentSection}
        initialData={sectionData[currentSection] ?? {}}
        onSave={handleSave}
        saving={saveSection.isPending}
      />

      {saveSection.isError && (
        <p className="text-red-600 text-sm">{saveSection.error?.message}</p>
      )}

      {/* Review button — available once all sections have data */}
      {report.status === 'completed' && (
        <Button
          fullWidth
          variant="secondary"
          onClick={() => navigate(`/visits/${visitId}/report/review`)}
        >
          Relire et soumettre →
        </Button>
      )}
    </div>
  )
}
