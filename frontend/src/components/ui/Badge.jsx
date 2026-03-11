const COLORS = {
  draft:      'bg-gray-100 text-gray-700',
  completed:  'bg-brand-100 text-brand-600',
  submitted:  'bg-yellow-100 text-yellow-700',
  validated:  'bg-green-100 text-green-700',
  sent:       'bg-emerald-100 text-emerald-700',
  scheduled:  'bg-sky-100 text-sky-700',
  in_progress:'bg-orange-100 text-orange-700',
}

const LABELS = {
  draft:       'Brouillon',
  completed:   'Complété',
  submitted:   'Soumis',
  validated:   'Validé',
  sent:        'Envoyé',
  scheduled:   'Planifiée',
  in_progress: 'En cours',
}

export default function Badge({ status }) {
  const color = COLORS[status] ?? 'bg-gray-100 text-gray-600'
  const label = LABELS[status] ?? status
  return (
    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${color}`}>
      {label}
    </span>
  )
}
