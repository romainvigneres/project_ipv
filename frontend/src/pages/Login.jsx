import { useState } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuthStore } from '../store/auth'
import { useAuth } from '../hooks/useAuth'
import Input from '../components/ui/Input'
import Button from '../components/ui/Button'

export default function Login() {
  const token = useAuthStore((s) => s.token)
  const { login } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  if (token) return <Navigate to="/dashboard" replace />

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      await login(email, password)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-stelliant-bleu-nuit flex flex-col items-center justify-center px-4">

      {/* Gradient accent bar — top of page */}
      <div className="fixed top-0 left-0 right-0 h-1 stelliant-gradient" />

      <div className="w-full max-w-sm flex flex-col items-center gap-8">

        {/* Brand block */}
        <div className="flex flex-col items-center gap-3">
          {/* Logo — drop your SVG at frontend/public/logo-stelliant.svg */}
          <img
            src="/logo-stelliant.svg"
            alt="Stelliant"
            className="h-10 w-auto"
            onError={(e) => { e.currentTarget.style.display = 'none' }}
          />
          {/* Fallback text shown while/if logo is missing */}
          <p className="text-white text-2xl font-bold tracking-tight select-none">
            Stelliant
          </p>
          <p className="text-stelliant-bleu-ciel/80 text-sm text-center">
            Expertise Construction — Fiche IPV
          </p>
          <div className="stelliant-gradient h-px rounded-full w-20 mt-1" />
        </div>

        {/* Card */}
        <form
          onSubmit={handleSubmit}
          className="w-full bg-white rounded-2xl shadow-2xl overflow-hidden"
        >
          <div className="stelliant-gradient h-1" />

          <div className="p-6 flex flex-col gap-5">
            <h1 className="text-lg font-semibold text-stelliant-bleu-nuit text-center tracking-tight">
              Connexion
            </h1>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-3 py-2.5">
                {error}
              </div>
            )}

            <Input
              label="Adresse e-mail"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              autoFocus
            />
            <Input
              label="Mot de passe"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />

            <Button type="submit" fullWidth size="lg" loading={loading}>
              Se connecter
            </Button>
          </div>
        </form>

        <p className="text-white/30 text-xs text-center">
          © Stelliant — Choisir l'agilité des services à l'assurance
        </p>
      </div>
    </div>
  )
}
