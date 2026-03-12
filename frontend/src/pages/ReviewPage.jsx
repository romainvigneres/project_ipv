import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useQuery, useMutation } from '@tanstack/react-query'
import { reportsApi } from '../api/reports'
import { visitsApi } from '../api/visits'
import ReportReview from '../components/report/ReportReview'
import Input from '../components/ui/Input'
import Button from '../components/ui/Button'

export default function ReviewPage() {
  const { visitId } = useParams()
  const navigate = useNavigate()
  const [emailError, setEmailError] = useState('')
  const [pdfLoading, setPdfLoading] = useState(false)
  const [pdfError, setPdfError] = useState('')

  const { data: report, isLoading: reportLoading } = useQuery({
    queryKey: ['report', 'visit', visitId],
    queryFn: async () => {
      const reports = await reportsApi.list()
      return reports.find((r) => r.visit_id === parseInt(visitId)) ?? null
    },
  })

  const { data: visit } = useQuery({
    queryKey: ['visit', visitId],
    queryFn: () => visitsApi.get(visitId),
    enabled: !!visitId,
  })

  const [recipientEmail, setRecipientEmail] = useState('')
  // Pre-fill recipient from visit once loaded
  useState(() => {
    if (visit?.manager_email && !recipientEmail) {
      setRecipientEmail(visit.manager_email)
    }
  })

  // Sync pre-fill when visit data arrives
  const prefilled = visit?.manager_email ?? ''

  async function handlePdfPreview() {
    if (!report) return
    setPdfLoading(true)
    setPdfError('')
    try {
      const url = await reportsApi.fetchPdfBlobUrl(report.id)
      window.open(url, '_blank')
    } catch {
      setPdfError("Impossible de générer l'aperçu PDF.")
    } finally {
      setPdfLoading(false)
    }
  }

  const submitMutation = useMutation({
    mutationFn: () => reportsApi.submit(report.id),
    onSuccess: () => navigate(`/visits/${visitId}/report/confirmation`),
  })

  const sendMutation = useMutation({
    mutationFn: () => reportsApi.send(report.id, recipientEmail || prefilled),
    onSuccess: () => navigate(`/visits/${visitId}/report/confirmation`),
  })

  if (reportLoading || !report) {
    return (
      <div className="flex justify-center py-16">
        <div className="h-8 w-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  function handleSend() {
    const email = recipientEmail || prefilled
    if (!email.includes('@')) {
      setEmailError('Adresse e-mail invalide')
      return
    }
    setEmailError('')
    sendMutation.mutate()
  }

  const canEdit = report.status === 'draft' || report.status === 'completed'

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        {canEdit ? (
          <button
            onClick={() => navigate(`/visits/${visitId}/report`)}
            className="flex items-center gap-1 text-brand-600 text-sm font-medium"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Modifier
          </button>
        ) : (
          <button
            onClick={() => navigate(`/visits/${visitId}`)}
            className="flex items-center gap-1 text-brand-600 text-sm font-medium"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Retour à la visite
          </button>
        )}
        <button
          onClick={handlePdfPreview}
          disabled={pdfLoading}
          className="text-sm text-brand-600 font-medium flex items-center gap-1 disabled:opacity-50"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M12 10v6m0 0l-3-3m3 3l3-3M3 17V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
          </svg>
          {pdfLoading ? 'Génération…' : 'Aperçu PDF'}
        </button>
      </div>
      {pdfError && <p className="text-red-600 text-sm">{pdfError}</p>}

      <h1 className="text-xl font-bold text-gray-900">Vérification de la fiche</h1>

      <ReportReview report={report} />

      {/* Send actions — only when fiche is editable (draft or completed) */}
      {canEdit && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex flex-col gap-3">
          <h2 className="font-semibold text-gray-800">Envoi de la fiche</h2>
          <Input
            label="E-mail du destinataire"
            type="email"
            value={recipientEmail || prefilled}
            onChange={(e) => setRecipientEmail(e.target.value)}
            error={emailError}
            placeholder="gestionnaire@stelliant.fr"
          />
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button
              fullWidth
              variant="secondary"
              onClick={() => submitMutation.mutate()}
              loading={submitMutation.isPending}
            >
              Soumettre pour validation
            </Button>
            <Button
              fullWidth
              onClick={handleSend}
              loading={sendMutation.isPending}
            >
              Envoyer directement
            </Button>
          </div>
          {(submitMutation.isError || sendMutation.isError) && (
            <p className="text-red-600 text-sm">
              {submitMutation.error?.message ?? sendMutation.error?.message}
            </p>
          )}
        </div>
      )}
    </div>
  )
}
