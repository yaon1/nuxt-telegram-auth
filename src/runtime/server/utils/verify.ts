import { constantTimeEqual, dataCheckString, hmacSha256, sha256, toHex } from './crypto'

export interface TelegramUser {
  id: number
  first_name: string
  last_name?: string
  username?: string
  photo_url?: string
  auth_date: number
}

export type VerifyResult = { ok: true; user: TelegramUser } | { ok: false; reason: 'malformed' | 'signature' | 'expired' }

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
  if (typeof hash !== 'string' || (typeof fields.id !== 'number' && typeof fields.id !== 'string')) {
    return { ok: false, reason: 'malformed' }
  }

  const signature = toHex(await hmacSha256(await sha256(botToken), dataCheckString(fields)))

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
