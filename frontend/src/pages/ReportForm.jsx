/**
 * ReportForm
 * Wrapper page for the IPV form. Fetches both the report (existing sections)
 * and the visit (pre-fill data) before rendering IpvForm.
 */
import { useNavigate, useParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { reportsApi } from '../api/reports'
import { visitsApi } from '../api/visits'
import IpvForm from '../components/report/IpvForm'
import Badge from '../components/ui/Badge'
import Button from '../components/ui/Button'

export default function ReportForm() {
  const { visitId } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const { data: visit, isLoading: visitLoading } = useQuery({
    queryKey: ['visit', visitId],
    queryFn: () => visitsApi.get(visitId),
  })

  const { data: report, isLoading: reportLoading } = useQuery({
    queryKey: ['report', 'visit', visitId],
    queryFn: async () => {
      const reports = await reportsApi.list()
      return reports.find((r) => r.visit_id === parseInt(visitId)) ?? null
    },
  })

  const saveSection = useMutation({
    mutationFn: ({ sectionType, content }) =>
      reportsApi.upsertSection(report.id, sectionType, content),
    onSuccess: (updated) => {
      queryClient.setQueryData(['report', 'visit', visitId], updated)
    },
  })

  if (visitLoading || reportLoading || !report) {
    return (
      <div className="flex justify-center py-16">
        <div className="h-8 w-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  const ipvSection = report.sections.find((s) => s.section_type === 'ipv')
  // Show review button once the section has been saved at least once
  const canReview = ipvSection != null || saveSection.isSuccess

  function handleSave(sectionType, content) {
    saveSection.mutate({ sectionType, content })
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
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

      <div>
        <h1 className="text-lg font-bold text-stelliant-bleu-nuit">
          Information de Première Visite
        </h1>
        <p className="text-xs text-gray-500 font-mono mt-0.5">{report.claim_reference}</p>
      </div>

      <IpvForm
        initialData={ipvSection?.content ?? {}}
        visit={visit}
        onSave={handleSave}
        saving={saveSection.isPending}
        saveSuccess={saveSection.isSuccess}
      />

      {saveSection.isError && (
        <p className="text-red-600 text-sm">{saveSection.error?.message}</p>
      )}

      {canReview && (
        <Button
          fullWidth
          variant="secondary"
          disabled={saveSection.isPending}
          onClick={() => navigate(`/visits/${visitId}/report/review`)}
        >
          Relire et envoyer →
        </Button>
      )}
    </div>
  )
}
