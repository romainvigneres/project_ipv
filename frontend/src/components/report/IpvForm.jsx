/**
 * IpvForm
 * Single-page form for the "Information de Première Visite".
 * Pre-filled fields (dommage_declare, dates, coût) come from the visit object.
 * The expert fills in the assessment fields and saves the whole form at once.
 */
import { useForm, useWatch } from 'react-hook-form'
import { useEffect, useRef, useState, forwardRef } from 'react'
import Input, { Textarea } from '../ui/Input'
import Button from '../ui/Button'
import {
  ENJEU_ASSUREUR_OPTIONS,
  ACTIONS_EFFECTUEES_OPTIONS,
  ACTIONS_A_VENIR_OPTIONS,
  FRAUDE_QUESTIONS,
} from '../../config/ipvConfig'

// ── Small reusable primitives ────────────────────────────────────────────────

function SectionTitle({ number, title }) {
  return (
    <div className="flex items-center gap-3 mb-3">
      <span className="flex-shrink-0 w-6 h-6 rounded-full bg-stelliant-bleu-nuit text-white text-xs font-bold flex items-center justify-center">
        {number}
      </span>
      <h3 className="font-semibold text-stelliant-bleu-nuit text-sm uppercase tracking-wide">
        {title}
      </h3>
    </div>
  )
}

function FormCard({ children }) {
  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100">
      <div className="h-0.5 stelliant-gradient" />
      <div className="p-4">{children}</div>
    </div>
  )
}

const Select = forwardRef(function Select({ label, error, required, children, ...props }, ref) {
  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label className="text-sm font-medium text-gray-700">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <select
        ref={ref}
        className={[
          'w-full rounded-lg border px-3 py-2.5 text-base shadow-sm bg-white',
          'focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500',
          error ? 'border-red-400 bg-red-50' : 'border-gray-300',
        ].join(' ')}
        {...props}
      >
        {children}
      </select>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  )
})

function CheckboxGroup({ label, options, value = [], onChange }) {
  function toggle(optValue) {
    onChange(
      value.includes(optValue)
        ? value.filter((v) => v !== optValue)
        : [...value, optValue]
    )
  }
  return (
    <div className="flex flex-col gap-1">
      {label && <p className="text-sm font-medium text-gray-700">{label}</p>}
      <div className="flex flex-col gap-2 mt-1">
        {options.map((opt) => (
          <label key={opt.value} className="flex items-center gap-2.5 text-sm text-gray-700 cursor-pointer">
            <input
              type="checkbox"
              checked={value.includes(opt.value)}
              onChange={() => toggle(opt.value)}
              className="w-4 h-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500"
            />
            {opt.label}
          </label>
        ))}
      </div>
    </div>
  )
}

const MoneyInput = forwardRef(function MoneyInput({ label, hint, required, ...props }, ref) {
  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label className="text-sm font-medium text-gray-700">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <div className="relative">
        <input
          ref={ref}
          type="number"
          step="0.01"
          min="0"
          className="w-full rounded-lg border border-gray-300 px-3 py-2.5 pr-8 text-base shadow-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
          {...props}
        />
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm pointer-events-none">€</span>
      </div>
      {hint && <p className="text-xs text-gray-500">{hint}</p>}
    </div>
  )
})

// ── Main form ────────────────────────────────────────────────────────────────

export default function IpvForm({ initialData = {}, visit, onSave, saving, saveSuccess }) {
  const [showSaved, setShowSaved] = useState(false)
  const prevSuccess = useRef(false)

  useEffect(() => {
    if (saveSuccess && !prevSuccess.current) {
      setShowSaved(true)
      const t = setTimeout(() => setShowSaved(false), 2500)
      prevSuccess.current = true
      return () => clearTimeout(t)
    }
    if (!saveSuccess) prevSuccess.current = false
  }, [saveSuccess])
  const { register, handleSubmit, control, setValue, reset, formState: { errors } } = useForm({
    defaultValues: {
      enjeu_assureur: '',
      enjeu_assure_materiel: '',
      enjeu_assure_immateriel: '',
      dommage_declare: visit?.declared_damage ?? '',
      dommage_constate: '',
      date_ouverture_chantier: visit?.construction_start_date ?? '',
      date_reception: visit?.reception_date ?? '',
      cout_operation: visit?.operation_cost ?? '',
      actions_effectuees: [],
      actions_a_venir: [],
      fraude_q1: false,
      fraude_q2: false,
      fraude_q3: false,
      fraude_q4: false,
      fraude_q5: false,
      ...initialData,
    },
  })

  // Sync when navigating back to a previously saved form
  useEffect(() => {
    if (Object.keys(initialData).length > 0) {
      reset({
        enjeu_assureur: '',
        enjeu_assure_materiel: '',
        enjeu_assure_immateriel: '',
        dommage_declare: visit?.declared_damage ?? '',
        dommage_constate: '',
        date_ouverture_chantier: visit?.construction_start_date ?? '',
        date_reception: visit?.reception_date ?? '',
        cout_operation: visit?.operation_cost ?? '',
        actions_effectuees: [],
        actions_a_venir: [],
        fraude_q1: false,
        fraude_q2: false,
        fraude_q3: false,
        fraude_q4: false,
        fraude_q5: false,
        ...initialData,
      })
    }
  }, [])

  // Watched values for derived total
  const materiel = useWatch({ control, name: 'enjeu_assure_materiel' })
  const immateriel = useWatch({ control, name: 'enjeu_assure_immateriel' })
  const actionsEffectuees = useWatch({ control, name: 'actions_effectuees' })
  const actionsAVenir = useWatch({ control, name: 'actions_a_venir' })

  const total =
    (parseFloat(materiel) || 0) + (parseFloat(immateriel) || 0)

  const onSubmit = (data) => {
    // Coerce numeric strings to numbers
    const cleaned = {
      ...data,
      enjeu_assure_materiel: data.enjeu_assure_materiel !== '' ? parseFloat(data.enjeu_assure_materiel) : null,
      enjeu_assure_immateriel: data.enjeu_assure_immateriel !== '' ? parseFloat(data.enjeu_assure_immateriel) : null,
      cout_operation: data.cout_operation !== '' ? parseFloat(data.cout_operation) : null,
      enjeu_assureur: data.enjeu_assureur || null,
    }
    onSave('ipv', cleaned)
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">

      {/* 1 — Enjeu assureur */}
      <FormCard>
        <SectionTitle number="1" title="Enjeu assureur" />
        <Select
          label="Enjeu assureur"
          error={errors.enjeu_assureur?.message}
          {...register('enjeu_assureur')}
        >
          <option value="">— Sélectionner —</option>
          {ENJEU_ASSUREUR_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </Select>
      </FormCard>

      {/* 2 — Enjeu assuré */}
      <FormCard>
        <SectionTitle number="2" title="Enjeu assuré" />
        <div className="flex flex-col gap-3">
          <div className="grid grid-cols-2 gap-3">
            <MoneyInput
              label="Matériel"
              placeholder="0"
              {...register('enjeu_assure_materiel')}
            />
            <MoneyInput
              label="Immatériel"
              placeholder="0"
              {...register('enjeu_assure_immateriel')}
            />
          </div>
          <div className="flex flex-col gap-1">
            <p className="text-sm font-medium text-gray-700">Total</p>
            <div className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 text-base font-semibold text-stelliant-bleu-nuit">
              {total.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
            </div>
          </div>
        </div>
      </FormCard>

      {/* 3 — Dommages */}
      <FormCard>
        <SectionTitle number="3" title="Dommages" />
        <div className="flex flex-col gap-3">
          <Textarea
            label="Dommage déclaré"
            rows={3}
            hint="Pré-rempli depuis Avensys — modifiable si nécessaire"
            {...register('dommage_declare')}
          />
          <Textarea
            label="Dommage constaté"
            rows={3}
            placeholder="Décrivez les dommages constatés lors de la visite…"
            {...register('dommage_constate')}
          />
        </div>
      </FormCard>

      {/* 4 — Chantier */}
      <FormCard>
        <SectionTitle number="4" title="Informations chantier" />
        <div className="flex flex-col gap-3">
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Date ouverture chantier"
              type="date"
              hint="Pré-rempli"
              {...register('date_ouverture_chantier')}
            />
            <Input
              label="Date de réception"
              type="date"
              hint="Pré-rempli"
              {...register('date_reception')}
            />
          </div>
          <MoneyInput
            label="Coût de l'opération"
            hint="Pré-rempli depuis Avensys"
            placeholder="0"
            {...register('cout_operation')}
          />
        </div>
      </FormCard>

      {/* 5 — Actions */}
      <FormCard>
        <SectionTitle number="5" title="Actions" />
        <div className="flex flex-col gap-4">
          <CheckboxGroup
            label="Actions effectuées"
            options={ACTIONS_EFFECTUEES_OPTIONS}
            value={actionsEffectuees}
            onChange={(v) => setValue('actions_effectuees', v)}
          />
          <CheckboxGroup
            label="Actions à venir"
            options={ACTIONS_A_VENIR_OPTIONS}
            value={actionsAVenir}
            onChange={(v) => setValue('actions_a_venir', v)}
          />
        </div>
      </FormCard>

      {/* 6 — Fraude */}
      <FormCard>
        <SectionTitle number="6" title="Indicateurs de fraude" />
        <div className="flex flex-col gap-3">
          {FRAUDE_QUESTIONS.map((question, i) => (
            <label key={i} className="flex items-start gap-3 text-sm text-gray-700 cursor-pointer">
              <input
                type="checkbox"
                className="mt-0.5 w-4 h-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500"
                {...register(`fraude_q${i + 1}`)}
              />
              <span>{question}</span>
            </label>
          ))}
        </div>
      </FormCard>

      <button
        type="submit"
        disabled={saving}
        className={[
          'w-full py-3 px-4 rounded-xl font-semibold text-base transition-all duration-300',
          'flex items-center justify-center gap-2',
          saving
            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
            : showSaved
            ? 'bg-stelliant-vert text-white'
            : 'bg-stelliant-bleu-nuit text-white active:scale-95',
        ].join(' ')}
      >
        {saving ? (
          <>
            <span className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            Enregistrement…
          </>
        ) : showSaved ? (
          <>
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
            Enregistré !
          </>
        ) : (
          'Enregistrer la fiche IPV'
        )}
      </button>
    </form>
  )
}
