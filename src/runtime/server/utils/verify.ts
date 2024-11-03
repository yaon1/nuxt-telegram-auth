export interface TelegramUser {
  id: number
  first_name: string
  last_name?: string
  username?: string
  photo_url?: string
  auth_date: number
}

export type VerifyResult = { ok: true; user: TelegramUser } | { ok: false; reason: 'malformed' | 'signature' | 'expired' }

const encoder = new TextEncoder()

function toHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer), (b) => b.toString(16).padStart(2, '0')).join('')
}

function constantTimeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  let diff = 0
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i)
  return diff === 0
}

/**
 * Verifies Login Widget data as described in https://core.telegram.org/widgets/login#checking-authorization.
 * Uses Web Crypto so it runs on Node, Bun, Deno and edge presets alike.
 */
export async function verifyTelegramLogin(
  data: Record<string, unknown>,
  botToken: string,
  maxAgeSeconds = 86_400,
  now = Math.floor(Date.now() / 1000),
): Promise<VerifyResult> {
  const { hash, ...fields } = data
  if (typeof hash !== 'string' || typeof fields.id !== 'number' && typeof fields.id !== 'string') {
    return { ok: false, reason: 'malformed' }
  }

  const checkString = Object.keys(fields)
    .filter((k) => fields[k] !== undefined && fields[k] !== null)
    .sort()
    .map((k) => `${k}=${fields[k]}`)
    .join('\n')

  const secret = await crypto.subtle.digest('SHA-256', encoder.encode(botToken))
  const key = await crypto.subtle.importKey('raw', secret, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
  const signature = toHex(await crypto.subtle.sign('HMAC', key, encoder.encode(checkString)))

  if (!constantTimeEqual(signature, hash.toLowerCase())) return { ok: false, reason: 'signature' }

  const authDate = Number(fields.auth_date)
  if (!Number.isFinite(authDate) || now - authDate > maxAgeSeconds) return { ok: false, reason: 'expired' }

  return {
    ok: true,
    user: {
      id: Number(fields.id),
      first_name: String(fields.first_name ?? ''),
      last_name: fields.last_name === undefined ? undefined : String(fields.last_name),
      username: fields.username === undefined ? undefined : String(fields.username),
      photo_url: fields.photo_url === undefined ? undefined : String(fields.photo_url),
      auth_date: authDate,
    },
  }
}
