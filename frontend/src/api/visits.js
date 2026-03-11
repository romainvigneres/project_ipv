import { api } from './client'

export const visitsApi = {
  list: () => api.get('/visits/'),
  get: (visitId) => api.get(`/visits/${visitId}`),
}
