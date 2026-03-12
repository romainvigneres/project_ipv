import { useNavigate, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { reportsApi } from '../api/reports'
import Badge from '../components/ui/Badge'
import Button from '../components/ui/Button'

const STATUS_MESSAGE = {
  submitted: {
    icon: '⏳',
    title: 'Fiche IPV soumise',
    body: 'La fiche IPV a été soumise et est en attente de validation par votre superviseur.',
  },
  sent: {
    icon: '✅',
    title: 'Fiche IPV envoyée',
    body: 'La fiche IPV a été envoyée avec succès au gestionnaire par e-mail.',
  },
}

export default function ConfirmationPage() {
  const { visitId } = useParams()
  const navigate = useNavigate()

  const { data: report } = useQuery({
    queryKey: ['report', 'visit', visitId],
    queryFn: async () => {
      const reports = await reportsApi.list()
      return reports.find((r) => r.visit_id === parseInt(visitId)) ?? null
    },
  })

  const info = (report && STATUS_MESSAGE[report.status]) || STATUS_MESSAGE.submitted

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 text-center px-4">
      <div className="text-5xl">{info.icon}</div>
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">{info.title}</h1>
        <p className="text-gray-600 max-w-xs">{info.body}</p>
      </div>
      {report && (
        <div className="flex flex-col items-center gap-1">
          <p className="text-sm text-gray-500 font-mono">{report.claim_reference}</p>
          <Badge status={report.status} />
        </div>
      )}
      <Button fullWidth size="lg" onClick={() => navigate('/dashboard')}>
        Retour au tableau de bord
      </Button>
    </div>
  )
}
