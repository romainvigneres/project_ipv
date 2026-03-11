export default function Card({ children, className = '', onClick }) {
  const base = 'bg-white rounded-xl shadow-sm border border-gray-100 p-4'
  const interactive = onClick ? 'cursor-pointer hover:shadow-md hover:border-stelliant-orange/40 active:bg-gray-50 transition-all' : ''
  return (
    <div className={[base, interactive, className].join(' ')} onClick={onClick}>
      {children}
    </div>
  )
}
