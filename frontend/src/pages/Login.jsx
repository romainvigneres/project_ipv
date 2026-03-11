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
    <div className="min-h-screen bg-brand-700 flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white tracking-tight">IPV</h1>
          <p className="text-brand-100 text-sm mt-1">Rapport d'expertise terrain</p>
          <div className="stelliant-gradient h-0.5 rounded-full mt-4 mx-auto w-16" />
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-2xl shadow-xl overflow-hidden flex flex-col"
        >
          <div className="stelliant-gradient h-1" />
          <div className="p-6 flex flex-col gap-4">
            <h2 className="text-xl font-semibold text-brand-700 text-center">Connexion</h2>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-3 py-2">
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

        <p className="text-center text-brand-100/60 text-xs mt-6">
          Choisir l'agilité des services à l'assurance
        </p>
      </div>
    </div>
  )
}
