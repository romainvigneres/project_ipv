/**
 * ReportSection
 * Renders the appropriate form fields for a given section type.
 * Each section auto-saves on blur via the onSave callback.
 */
import { useForm } from 'react-hook-form'
import { useEffect } from 'react'
import Input, { Textarea } from '../ui/Input'
import Button from '../ui/Button'

const SECTION_LABELS = {
  general_info:             '1. Informations générales',
  circumstances:            '2. Circonstances',
  damage_description:       '3. Description des dommages',
  emergency_measures:       '4. Mesures d\'urgence',
  additional_observations:  '5. Observations complémentaires',
}

export default function ReportSection({ sectionType, initialData = {}, onSave, saving }) {
  const { register, handleSubmit, reset, formState: { errors, isDirty } } = useForm({
    defaultValues: initialData,
  })

  // Reset when navigating between sections
  useEffect(() => { reset(initialData) }, [sectionType])

  const onSubmit = (data) => onSave(sectionType, data)

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
      <h2 className="text-lg font-semibold text-gray-800">
        {SECTION_LABELS[sectionType]}
      </h2>

      {sectionType === 'general_info' && <GeneralInfoFields register={register} />}
      {sectionType === 'circumstances' && <CircumstancesFields register={register} />}
      {sectionType === 'damage_description' && <DamageFields register={register} />}
      {sectionType === 'emergency_measures' && <EmergencyFields register={register} />}
      {sectionType === 'additional_observations' && <ObservationsFields register={register} />}

      <Button type="submit" fullWidth loading={saving} disabled={!isDirty && !saving}>
        Enregistrer cette section
      </Button>
    </form>
  )
}

function GeneralInfoFields({ register }) {
  return (
    <>
      <Input label="Assureur" {...register('insurer_name')} />
      <Input label="N° de police" {...register('policy_number')} />
      <Input label="Date du sinistre" type="date" {...register('loss_date')} />
      <Input label="Nature du sinistre" {...register('loss_type')} placeholder="Ex: Dégât des eaux" />
      <Textarea label="Commentaires de l'expert" {...register('expert_comments')} />
    </>
  )
}

function CircumstancesFields({ register }) {
  return (
    <>
      <Textarea
        label="Description des circonstances"
        rows={5}
        required
        {...register('description', { required: 'Ce champ est requis' })}
      />
      <label className="flex items-center gap-2 text-sm text-gray-700">
        <input type="checkbox" {...register('witness_present')} className="rounded" />
        Présence d'un témoin
      </label>
      <Textarea label="Détails du témoin" rows={2} {...register('witness_details')} />
      <label className="flex items-center gap-2 text-sm text-gray-700">
        <input type="checkbox" {...register('police_report')} className="rounded" />
        Dépôt de plainte effectué
      </label>
      <Input label="N° de plainte" {...register('police_report_number')} />
    </>
  )
}

function DamageFields({ register }) {
  return (
    <>
      <Input
        label="Pièces concernées (séparées par des virgules)"
        {...register('affected_rooms_raw')}
        placeholder="Salon, Cuisine, Chambre…"
      />
      <label className="flex items-center gap-2 text-sm text-gray-700">
        <input type="checkbox" {...register('structural_damage')} className="rounded" />
        Dommages structurels
      </label>
      <Textarea label="Détails des dommages structurels" rows={3} {...register('structural_details')} />
      <label className="flex items-center gap-2 text-sm text-gray-700">
        <input type="checkbox" {...register('personal_property_damage')} className="rounded" />
        Dommages aux biens mobiliers
      </label>
      <Textarea label="Détails des biens endommagés" rows={3} {...register('personal_property_details')} />
      <Input
        label="Montant estimé (€)"
        type="number"
        step="0.01"
        {...register('estimated_amount', { valueAsNumber: true })}
      />
    </>
  )
}

function EmergencyFields({ register }) {
  return (
    <>
      <Textarea
        label="Mesures prises (une par ligne)"
        rows={4}
        {...register('measures_taken_raw')}
        placeholder="Pompage de l'eau&#10;Bâchage de la toiture"
      />
      <Input label="Prestataire d'urgence" {...register('service_provider')} />
      <Input label="Date d'intervention" type="date" {...register('intervention_date')} />
      <Input
        label="Coût estimé (€)"
        type="number"
        step="0.01"
        {...register('cost_estimate', { valueAsNumber: true })}
      />
      <Textarea label="Notes complémentaires" rows={3} {...register('notes')} />
    </>
  )
}

function ObservationsFields({ register }) {
  return (
    <>
      <Textarea
        label="Observations"
        rows={5}
        {...register('observations')}
        placeholder="Observations générales de l'expert…"
      />
      <Textarea label="Recommandations" rows={3} {...register('recommendations')} />
      <label className="flex items-center gap-2 text-sm text-gray-700">
        <input type="checkbox" {...register('follow_up_required')} className="rounded" />
        Suivi nécessaire
      </label>
      <Textarea label="Détails du suivi" rows={2} {...register('follow_up_details')} />
    </>
  )
}
