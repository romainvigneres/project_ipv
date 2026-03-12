import { useAuthStore } from '../store/auth'

const BASE_URL = '/api/v1'

class ApiError extends Error {
  constructor(status, message, body) {
    super(message)
    this.status = status
    this.body = body
  }
}

async function request(method, path, { body, params } = {}) {
  const token = useAuthStore.getState().token
  const url = new URL(BASE_URL + path, window.location.origin)

  if (params) {
    Object.entries(params).forEach(([k, v]) => v != null && url.searchParams.set(k, v))
  }

  const headers = { 'Content-Type': 'application/json' }
  if (token) headers['Authorization'] = `Bearer ${token}`

  const res = await fetch(url.toString(), {
    method,
    headers,
    body: body != null ? JSON.stringify(body) : undefined,
  })

  if (res.status === 401) {
    useAuthStore.getState().logout()
    window.location.href = '/login'
    return
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }))
    throw new ApiError(res.status, err.detail || 'Une erreur est survenue.', err)
  }

  if (res.status === 204) return null
  return res.json()
}

export const api = {
  get:    (path, opts) => request('GET',    path, opts),
  post:   (path, opts) => request('POST',   path, opts),
  put:    (path, opts) => request('PUT',    path, opts),
  patch:  (path, opts) => request('PATCH',  path, opts),
  delete: (path, opts) => request('DELETE', path, opts),
}
