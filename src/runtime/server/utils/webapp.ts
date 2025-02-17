import { constantTimeEqual, dataCheckString, hmacSha256, toHex } from './crypto'
import type { TelegramUser } from './verify'

export interface WebAppUser extends Omit<TelegramUser, 'auth_date'> {
  language_code?: string
  is_premium?: boolean
  allows_write_to_pm?: boolean
}

export interface WebAppInitData {
  user?: WebAppUser
  query_id?: string
  chat_type?: string
  chat_instance?: string
  start_param?: string
  auth_date: number
}

export type WebAppVerifyResult = { ok: true; data: WebAppInitData } | { ok: false; reason: 'malformed' | 'signature' | 'expired' }

/**
 * Verifies `Telegram.WebApp.initData` from a Mini App, see
 * https://core.telegram.org/bots/webapps#validating-data-received-via-the-mini-app
 */
export async function verifyWebAppInitData(
  initData: string,
  botToken: string,
  maxAgeSeconds = 86_400,
  now = Math.floor(Date.now() / 1000),
): Promise<WebAppVerifyResult> {
  const params = new URLSearchParams(initData)
  const hash = params.get('hash')
  if (!hash) return { ok: false, reason: 'malformed' }

  const fields: Record<string, string> = {}
  for (const [key, value] of params) {
    // `signature` is for third-party Ed25519 validation and is not part of the HMAC.
    if (key !== 'hash') fields[key] = value
  }

  const secret = await hmacSha256('WebAppData', botToken)
  const signature = toHex(await hmacSha256(secret, dataCheckString(fields)))
  if (!constantTimeEqual(signature, hash.toLowerCase())) return { ok: false, reason: 'signature' }

  const authDate = Number(fields.auth_date)
  if (!Number.isFinite(authDate) || now - authDate > maxAgeSeconds) return { ok: false, reason: 'expired' }

  let user: WebAppUser | undefined
  try {
    user = fields.user ? (JSON.parse(fields.user) as WebAppUser) : undefined
  } catch {
    return { ok: false, reason: 'malformed' }
  }

  return {
    ok: true,
    data: {
      user,
      query_id: fields.query_id,
      chat_type: fields.chat_type,
      chat_instance: fields.chat_instance,
      start_param: fields.start_param,
      auth_date: authDate,
    },
  }
}
