/**
 * IPV Form configuration
 * ─────────────────────
 * Single source of truth for all dropdown options and question labels.
 * To add/remove/rename values: edit ONLY this file.
 * Values must match the backend enums in backend/app/schemas/report.py.
 */

export const ENJEU_ASSUREUR_OPTIONS = [
  { value: '< TM',          label: '< TM' },
  { value: 'TM < x < 5k',   label: 'TM < x < 5k' },
  { value: '5k < x < 20k',  label: '5k < x < 20k' },
  { value: '20k < x < 50k', label: '20k < x < 50k' },
  { value: '50k < x < AV1', label: '50k < x < AV1' },
  { value: '>AV1',           label: '>AV1' },
]

export const ACTIONS_EFFECTUEES_OPTIONS = [
  { value: 'Option 1', label: 'Option 1' },
  { value: 'Option 2', label: 'Option 2' },
  { value: 'Option 3', label: 'Option 3' },
]

export const ACTIONS_A_VENIR_OPTIONS = [
  { value: 'Option 1', label: 'Option 1' },
  { value: 'Option 2', label: 'Option 2' },
  { value: 'Option 3', label: 'Option 3' },
]

export const FRAUDE_QUESTIONS = [
  'Question fraude 1',
  'Question fraude 2',
  'Question fraude 3',
  'Question fraude 4',
  'Question fraude 5',
]
