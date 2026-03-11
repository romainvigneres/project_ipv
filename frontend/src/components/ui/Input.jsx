import { forwardRef } from 'react'

const Input = forwardRef(function Input(
  { label, error, hint, type = 'text', className = '', ...props },
  ref
) {
  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label className="text-sm font-medium text-gray-700">
          {label}
          {props.required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <input
        ref={ref}
        type={type}
        className={[
          'w-full rounded-lg border px-3 py-2.5 text-base shadow-sm',
          'focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500',
          error
            ? 'border-red-400 bg-red-50'
            : 'border-gray-300 bg-white',
          className,
        ].join(' ')}
        {...props}
      />
      {hint && !error && <p className="text-xs text-gray-500">{hint}</p>}
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  )
})

export default Input


export const Textarea = forwardRef(function Textarea(
  { label, error, rows = 4, className = '', ...props },
  ref
) {
  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label className="text-sm font-medium text-gray-700">
          {label}
          {props.required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <textarea
        ref={ref}
        rows={rows}
        className={[
          'w-full rounded-lg border px-3 py-2.5 text-base shadow-sm resize-none',
          'focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500',
          error ? 'border-red-400 bg-red-50' : 'border-gray-300 bg-white',
          className,
        ].join(' ')}
        {...props}
      />
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  )
})
