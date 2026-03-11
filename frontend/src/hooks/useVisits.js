import { useQuery } from '@tanstack/react-query'
import { visitsApi } from '../api/visits'

export function useVisits() {
  return useQuery({
    queryKey: ['visits'],
    queryFn: visitsApi.list,
  })
}

export function useVisit(visitId) {
  return useQuery({
    queryKey: ['visit', visitId],
    queryFn: () => visitsApi.get(visitId),
    enabled: !!visitId,
  })
}
