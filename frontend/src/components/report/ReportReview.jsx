/**
 * ReportReview
 * Read-only summary of a complete IPV report, used in the review page.
 */
import Badge from '../ui/Badge'
import { FRAUDE_QUESTIONS } from '../../config/ipvConfig'

function Field({ label, value }) {
  if (value === null || value === undefined || value === '') return null
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{label}</span>
      <span className="text-sm text-gray-800">{value}</span>
    </div>
  )
}

function SectionBlock({ title, children }) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="stelliant-gradient h-0.5" />
      <div className="p-4 flex flex-col gap-3">
        <h3 className="font-semibold text-stelliant-bleu-nuit text-sm uppercase tracking-wide">{title}</h3>
        {children}
      </div>
    </div>
  )
}

function fmt(value) {
  if (value === null || value === undefined) return null
  return Number(value).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })
}

export default function ReportReview({ report }) {
  const ipv = report.sections.find((s) => s.section_type === 'ipv')?.content ?? {}

  const total =
    (parseFloat(ipv.enjeu_assure_materiel) || 0) +
    (parseFloat(ipv.enjeu_assure_immateriel) || 0)

  const fraudeFlags = FRAUDE_QUESTIONS
    .map((q, i) => ipv[`fraude_q${i + 1}`] ? q : null)
    .filter(Boolean)

  return (
    <div className="flex flex-col gap-4">
      {/* Dossier header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-gray-500">Référence sinistre</p>
          <p className="font-bold text-lg text-stelliant-bleu-nuit">{report.claim_reference}</p>
        </div>
        <Badge status={report.status} />
      </div>

      <SectionBlock title="Identification du dossier">
        <Field label="Assuré" value={report.client_name} />
        <Field label="Adresse" value={report.address} />
        <Field label="Expert" value={report.expert_name} />
        <Field label="Date de visite" value={new Date(report.visit_date).toLocaleDateString('fr-FR')} />
      </SectionBlock>

      <SectionBlock title="Enjeux">
        <Field label="Enjeu assureur" value={ipv.enjeu_assureur} />
        <Field label="Enjeu assuré — Matériel" value={fmt(ipv.enjeu_assure_materiel)} />
        <Field label="Enjeu assuré — Immatériel" value={fmt(ipv.enjeu_assure_immateriel)} />
        {(ipv.enjeu_assure_materiel || ipv.enjeu_assure_immateriel) && (
          <Field
            label="Enjeu assuré — Total"
            value={total.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
          />
        )}
      </SectionBlock>

      <SectionBlock title="Dommages">
        <Field label="Dommage déclaré" value={ipv.dommage_declare} />
        <Field label="Dommage constaté" value={ipv.dommage_constate} />
      </SectionBlock>

      <SectionBlock title="Informations chantier">
        <Field label="Date ouverture chantier" value={ipv.date_ouverture_chantier} />
        <Field label="Date de réception" value={ipv.date_reception} />
        <Field label="Coût de l'opération" value={fmt(ipv.cout_operation)} />
      </SectionBlock>

      <SectionBlock title="Actions">
        {ipv.actions_effectuees?.length > 0 && (
          <div className="flex flex-col gap-0.5">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Actions effectuées</span>
            {ipv.actions_effectuees.map((a) => (
              <span key={a} className="text-sm text-gray-800">• {a}</span>
            ))}
          </div>
        )}
        {ipv.actions_a_venir?.length > 0 && (
          <div className="flex flex-col gap-0.5">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Actions à venir</span>
            {ipv.actions_a_venir.map((a) => (
              <span key={a} className="text-sm text-gray-800">• {a}</span>
            ))}
          </div>
        )}
        {!ipv.actions_effectuees?.length && !ipv.actions_a_venir?.length && (
          <p className="text-sm text-gray-400 italic">Aucune action renseignée</p>
        )}
      </SectionBlock>

      <SectionBlock title="Indicateurs de fraude">
        {fraudeFlags.length > 0 ? (
          <div className="flex flex-col gap-1">
            {fraudeFlags.map((q) => (
              <div key={q} className="flex items-center gap-2 text-sm text-red-700">
                <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                {q}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-500">Aucun indicateur de fraude signalé</p>
        )}
      </SectionBlock>
    </div>
  )
}
