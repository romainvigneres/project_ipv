import { useNavigate, useParams } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { useVisit } from '../hooks/useVisits'
import { reportsApi } from '../api/reports'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import Badge from '../components/ui/Badge'

// Button label and destination vary by current fiche status
function IpvActionButton({ visit, visitId, navigate }) {
  const s = visit.report_status
  if (s === 'completed' || s === 'validated') {
    return (
      <Button fullWidth size="lg" onClick={() => navigate(`/visits/${visitId}/report/review`)}>
        Relire et envoyer la fiche →
      </Button>
    )
  }
  if (s === 'submitted') {
    return (
      <Button fullWidth size="lg" variant="secondary" onClick={() => navigate(`/visits/${visitId}/report/review`)}>
        Voir la fiche (en attente de validation)
      </Button>
    )
  }
  if (s === 'sent') {
    return (
      <Button fullWidth size="lg" variant="secondary" onClick={() => navigate(`/visits/${visitId}/report/confirmation`)}>
        Fiche envoyée ✓
      </Button>
    )
  }
  // draft or unknown
  return (
    <Button fullWidth size="lg" onClick={() => navigate(`/visits/${visitId}/report`)}>
      Compléter la fiche IPV
    </Button>
  )
}

export default function VisitPage() {
  const { visitId } = useParams()
  const navigate = useNavigate()
  const { data: visit, isLoading, isError } = useVisit(visitId)

  const createReport = useMutation({
    mutationFn: () => reportsApi.create(parseInt(visitId)),
    onSuccess: () => navigate(`/visits/${visitId}/report`),
  })

  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <div className="h-8 w-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (isError || !visit) {
    return <p className="text-red-600 py-8 text-center">Visite introuvable.</p>
  }

  const visitDate = new Date(visit.visit_time)

  return (
    <div className="flex flex-col gap-5">
      <button
        onClick={() => navigate('/dashboard')}
        className="flex items-center gap-1 text-brand-600 text-sm font-medium"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Tableau de bord
      </button>

      <Card>
        <div className="flex flex-col gap-3">
          <div className="flex items-start justify-between">
            <h1 className="text-xl font-bold text-gray-900">{visit.client_name}</h1>
            <Badge status={visit.status} />
          </div>

          <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
            <div>
              <dt className="text-xs text-gray-500 font-medium uppercase tracking-wide">Référence</dt>
              <dd className="text-gray-800 font-mono">{visit.claim_reference}</dd>
            </div>
            <div>
              <dt className="text-xs text-gray-500 font-medium uppercase tracking-wide">Heure</dt>
              <dd className="text-gray-800">
                {visitDate.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
              </dd>
            </div>
            {visit.claim_avensys && (
              <div>
                <dt className="text-xs text-gray-500 font-medium uppercase tracking-wide">N° Avensys</dt>
                <dd className="text-gray-800 font-mono">{visit.claim_avensys}</dd>
              </div>
            )}
            {visit.claim_label && (
              <div className={visit.claim_avensys ? '' : 'col-span-2'}>
                <dt className="text-xs text-gray-500 font-medium uppercase tracking-wide">Libellé sinistre</dt>
                <dd className="text-gray-800">{visit.claim_label}</dd>
              </div>
            )}
            <div className="col-span-2">
              <dt className="text-xs text-gray-500 font-medium uppercase tracking-wide">Adresse</dt>
              <dd className="text-gray-800">{visit.address}</dd>
            </div>
            {visit.client_email && (
              <div className="col-span-2">
                <dt className="text-xs text-gray-500 font-medium uppercase tracking-wide">E-mail client</dt>
                <dd className="text-gray-800">{visit.client_email}</dd>
              </div>
            )}
          </dl>
        </div>
      </Card>

      {visit.has_report ? (
        <IpvActionButton visit={visit} visitId={visitId} navigate={navigate} />
      ) : (
        <Button
          fullWidth
          size="lg"
          loading={createReport.isPending}
          onClick={() => createReport.mutate()}
        >
          Créer la fiche IPV
        </Button>
      )}

      {createReport.isError && (
        <p className="text-red-600 text-sm text-center">
          {createReport.error?.message ?? 'Une erreur est survenue.'}
        </p>
      )}
    </div>
  )
}
