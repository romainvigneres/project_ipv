/**
 * ReportReview
 * Read-only summary of a complete report, used in the review page.
 */
import Badge from '../ui/Badge'

function Field({ label, value }) {
  if (!value && value !== 0) return null
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
        <h3 className="font-semibold text-brand-700 text-sm uppercase tracking-wide">{title}</h3>
        {children}
      </div>
    </div>
  )
}

export default function ReportReview({ report }) {
  const s = Object.fromEntries(report.sections.map((sec) => [sec.section_type, sec.content]))

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-gray-500">Référence sinistre</p>
          <p className="font-bold text-lg">{report.claim_reference}</p>
        </div>
        <Badge status={report.status} />
      </div>

      <SectionBlock title="Informations générales">
        <Field label="Assuré" value={report.client_name} />
        <Field label="Adresse" value={report.address} />
        <Field label="Expert" value={report.expert_name} />
        <Field label="Date de visite" value={new Date(report.visit_date).toLocaleDateString('fr-FR')} />
        <Field label="Assureur" value={s.general_info?.insurer_name} />
        <Field label="N° de police" value={s.general_info?.policy_number} />
        <Field label="Nature du sinistre" value={s.general_info?.loss_type} />
        <Field label="Commentaires" value={s.general_info?.expert_comments} />
      </SectionBlock>

      <SectionBlock title="Circonstances">
        <Field label="Description" value={s.circumstances?.description} />
        {s.circumstances?.witness_present && (
          <Field label="Témoin" value={s.circumstances.witness_details || 'Oui'} />
        )}
        {s.circumstances?.police_report && (
          <Field label="N° plainte" value={s.circumstances.police_report_number} />
        )}
      </SectionBlock>

      <SectionBlock title="Dommages">
        {s.damage_description?.affected_rooms?.length > 0 && (
          <Field label="Pièces" value={s.damage_description.affected_rooms.join(', ')} />
        )}
        {s.damage_description?.structural_damage && (
          <Field label="Dommages structurels" value={s.damage_description.structural_details} />
        )}
        {s.damage_description?.personal_property_damage && (
          <Field label="Biens mobiliers" value={s.damage_description.personal_property_details} />
        )}
        {s.damage_description?.estimated_amount != null && (
          <Field
            label="Montant estimé"
            value={`${s.damage_description.estimated_amount.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}`}
          />
        )}
      </SectionBlock>

      <SectionBlock title="Mesures d'urgence">
        {s.emergency_measures?.measures_taken?.map((m, i) => (
          <p key={i} className="text-sm text-gray-800">• {m}</p>
        ))}
        <Field label="Prestataire" value={s.emergency_measures?.service_provider} />
        <Field label="Coût estimé" value={s.emergency_measures?.cost_estimate != null
          ? `${s.emergency_measures.cost_estimate} €` : null} />
      </SectionBlock>

      <SectionBlock title="Observations">
        <Field label="Observations" value={s.additional_observations?.observations} />
        <Field label="Recommandations" value={s.additional_observations?.recommendations} />
        {s.additional_observations?.follow_up_required && (
          <Field label="Suivi" value={s.additional_observations.follow_up_details} />
        )}
      </SectionBlock>
    </div>
  )
}
