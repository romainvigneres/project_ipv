import { useNavigate } from 'react-router-dom'
import { useVisits } from '../hooks/useVisits'
import { useAuthStore } from '../store/auth'
import Card from '../components/ui/Card'
import Badge from '../components/ui/Badge'

function VisitCard({ visit, onClick }) {
  const time = new Date(visit.visit_time).toLocaleTimeString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
  })
  // Show report status badge, or "À compléter" if no report yet
  const badgeStatus = visit.report_status ?? (visit.has_report ? 'draft' : null)
  return (
    <Card onClick={onClick}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-gray-900 truncate">{visit.client_name}</p>
          <p className="text-sm text-gray-500 truncate">{visit.address}</p>
          <p className="text-xs text-gray-400 mt-1">
            Réf. {visit.claim_reference} · {time}
          </p>
        </div>
        <div className="flex flex-col items-end gap-1 shrink-0">
          {badgeStatus && <Badge status={badgeStatus} />}
          <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </div>
      </div>
    </Card>
  )
}

function Section({ title, children, empty }) {
  return (
    <section>
      <div className="flex items-center gap-2 mb-3">
        <div className="stelliant-gradient h-3.5 w-1 rounded-full" />
        <h2 className="text-sm font-semibold text-brand-700 uppercase tracking-wide">{title}</h2>
      </div>
      {children
        ? <div className="flex flex-col gap-2">{children}</div>
        : <p className="text-sm text-gray-400 italic">{empty}</p>
      }
    </section>
  )
}

export default function Dashboard() {
  const user = useAuthStore((s) => s.user)
  const { data, isLoading, isError, refetch } = useVisits()
  const navigate = useNavigate()

  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <div className="h-8 w-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (isError) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600 mb-4">Impossible de charger les visites.</p>
        <button onClick={refetch} className="text-brand-600 underline text-sm">Réessayer</button>
      </div>
    )
  }

  const today = data?.today ?? []
  const pending = data?.pending_report ?? []

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Bonjour, {user?.full_name?.split(' ')[0]}
        </h1>
        <p className="text-sm text-gray-500 mt-0.5">
          {new Date().toLocaleDateString('fr-FR', {
            weekday: 'long', day: 'numeric', month: 'long',
          })}
        </p>
      </div>

      <Section
        title="Visites du jour"
        empty="Aucune visite planifiée aujourd'hui."
      >
        {today.length > 0 && today.map((v) => (
          <VisitCard key={v.id} visit={v} onClick={() => navigate(`/visits/${v.id}`)} />
        ))}
      </Section>

      <Section
        title="Fiches IPV en attente"
        empty="Aucune fiche IPV en attente."
      >
        {pending.length > 0 && pending.map((v) => (
          <VisitCard key={v.id} visit={v} onClick={() => navigate(`/visits/${v.id}`)} />
        ))}
      </Section>
    </div>
  )
}
