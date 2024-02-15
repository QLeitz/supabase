import { useQuery, UseQueryOptions } from '@tanstack/react-query'
import { get } from 'data/fetchers'
import { ResponseError } from 'types'
import { databaseKeys } from './keys'
import { components } from 'data/api'

export type PoolingConfigurationVariables = {
  projectRef?: string
}

export type PoolingConfiguration = components['schemas']['SupavisorConfigResponse']

export async function getPoolingConfiguration(
  { projectRef }: PoolingConfigurationVariables,
  signal?: AbortSignal
) {
  if (!projectRef) throw new Error('Project ref is required')

  const { data, error } = await get(`/platform/projects/{ref}/config/supavisor`, {
    params: { path: { ref: projectRef } },
    signal,
  })
  if (error) throw error

  // [Joshen] For now, ignore read replicas - we'll need to update eventually
  const primaryConfig = data.find((x) => x.database_type === 'PRIMARY')
  if (primaryConfig === undefined)
    throw new Error('Unable to find Supavisor config for primary database')

  return primaryConfig
}

export type PoolingConfigurationData = Awaited<ReturnType<typeof getPoolingConfiguration>>
export type PoolingConfigurationError = ResponseError

export const usePoolingConfigurationQuery = <TData = PoolingConfigurationData>(
  { projectRef }: PoolingConfigurationVariables,
  {
    enabled = true,
    ...options
  }: UseQueryOptions<PoolingConfigurationData, PoolingConfigurationError, TData> = {}
) =>
  useQuery<PoolingConfigurationData, PoolingConfigurationError, TData>(
    databaseKeys.poolingConfiguration(projectRef),
    ({ signal }) => getPoolingConfiguration({ projectRef }, signal),
    {
      enabled: enabled && typeof projectRef !== 'undefined',
      ...options,
    }
  )
