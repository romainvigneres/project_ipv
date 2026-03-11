import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../store/auth'

export default function Navbar() {
  const user = useAuthStore((s) => s.user)
  const logout = useAuthStore((s) => s.logout)
  const navigate = useNavigate()

  function handleLogout() {
    logout()
    navigate('/login')
  }

  return (
    <header className="bg-brand-700 text-white shadow-md">
      <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
        <button
          onClick={() => navigate('/dashboard')}
          className="font-bold text-lg tracking-tight"
        >
          IPV
        </button>
        <div className="flex items-center gap-3">
          {user && (
            <span className="text-sm text-brand-100 hidden sm:block">
              {user.full_name}
            </span>
          )}
          <button
            onClick={handleLogout}
            className="text-sm bg-brand-600 hover:bg-stelliant-bleu-ciel/20 border border-white/20 px-3 py-1.5 rounded-md tap-target transition-colors"
          >
            Déconnexion
          </button>
        </div>
      </div>
      {/* Stelliant gradient divider */}
      <div className="stelliant-gradient h-0.5" />
    </header>
  )
}
