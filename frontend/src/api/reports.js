import { api } from './client'

export const reportsApi = {
  create: (visitId, requiresValidation = false) =>
    api.post('/reports/', { body: { visit_id: visitId, requires_validation: requiresValidation } }),

  get: (reportId) => api.get(`/reports/${reportId}`),

  list: () => api.get('/reports/'),

  upsertSection: (reportId, sectionType, content) =>
    api.put(`/reports/${reportId}/sections`, {
      body: { section_type: sectionType, content },
    }),

  submit: (reportId) => api.post(`/reports/${reportId}/submit`),

  send: (reportId, recipientEmail) =>
    api.post(`/reports/${reportId}/send`, { body: { recipient_email: recipientEmail } }),

  // Returns a temporary blob URL for authenticated PDF preview/download
  fetchPdfBlobUrl: async (reportId) => {
    const { useAuthStore } = await import('../store/auth')
    const token = useAuthStore.getState().token
    const res = await fetch(`/api/v1/reports/${reportId}/pdf`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    if (!res.ok) throw new Error('Impossible de générer le PDF.')
    const blob = await res.blob()
    return URL.createObjectURL(blob)
  },
}
