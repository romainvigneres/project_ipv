const BASE_URL = '/api/v1'

export async function login(email, password) {
  const form = new URLSearchParams()
  form.set('username', email)
  form.set('password', password)

  const res = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: form.toString(),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.detail || 'Identifiants invalides')
  }
  return res.json()
}

export async function fetchMe(token) {
  const res = await fetch(`${BASE_URL}/users/me`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) throw new Error('Session expirée')
  return res.json()
}
