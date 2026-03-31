import { createHash, timingSafeEqual } from 'node:crypto'
import { NextRequest } from 'next/server'
import { createAdminClient } from '@/utils/supabase/admin'

export type IntegrationScope = 'transactions:read'

type ApiClientRow = {
  id: string
  name: string
  key_prefix: string
  key_hash: string
  scopes: string[] | null
  is_active: boolean
}

export type IntegrationAuthResult = {
  clientId: string
  clientName: string
  scopes: IntegrationScope[]
}

export function hashApiKey(rawKey: string) {
  return createHash('sha256').update(rawKey).digest('hex')
}

function parseApiKey(request: NextRequest) {
  const xApiKey = request.headers.get('x-api-key')?.trim()
  if (xApiKey) return xApiKey

  const authorization = request.headers.get('authorization')?.trim()
  if (!authorization) return null

  const [scheme, token] = authorization.split(/\s+/, 2)
  if (scheme?.toLowerCase() !== 'bearer' || !token) return null

  return token.trim()
}

function hasScope(scopes: string[] | null, requiredScope: IntegrationScope) {
  return Array.isArray(scopes) && scopes.includes(requiredScope)
}

export async function authenticateIntegrationRequest(
  request: NextRequest,
  requiredScope: IntegrationScope,
): Promise<IntegrationAuthResult | null> {
  const rawKey = parseApiKey(request)
  if (!rawKey || rawKey.length < 12) {
    return null
  }

  const keyPrefix = rawKey.slice(0, 12)
  const keyHash = hashApiKey(rawKey)
  const admin = createAdminClient()

  const { data: client } = await admin
    .from('integration_api_clients')
    .select('id,name,key_prefix,key_hash,scopes,is_active')
    .eq('key_prefix', keyPrefix)
    .maybeSingle<ApiClientRow>()

  if (!client || !client.is_active || !hasScope(client.scopes, requiredScope)) {
    return null
  }

  const expected = Buffer.from(client.key_hash, 'hex')
  const actual = Buffer.from(keyHash, 'hex')

  if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) {
    return null
  }

  await admin
    .from('integration_api_clients')
    .update({ last_used_at: new Date().toISOString() })
    .eq('id', client.id)

  return {
    clientId: client.id,
    clientName: client.name,
    scopes: (client.scopes ?? []) as IntegrationScope[],
  }
}
