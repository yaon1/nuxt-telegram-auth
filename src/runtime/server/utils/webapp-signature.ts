import { dataCheckString } from './crypto'
import type { WebAppVerifyResult } from './webapp'
import { parseInitDataFields } from './webapp'

/** Telegram's production Ed25519 key for third-party Mini App validation. */
export const TELEGRAM_PUBLIC_KEY = 'e7bf03a2fa4602af4580703d88dda5bb59f32ed8b02a56c187fe7d34caed242d'

function fromHex(hex: string): Uint8Array {
  return new Uint8Array(hex.match(/../g)!.map((b) => Number.parseInt(b, 16)))
}

function fromBase64Url(value: string): Uint8Array {
  const base64 = value.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(value.length / 4) * 4, '=')
  return Uint8Array.from(atob(base64), (c) => c.charCodeAt(0))
}

/**
 * Validates init data **without the bot token**, using the Ed25519 `signature` field.
 * Lets a separate service (or a bot you don't own) trust Mini App users by bot id alone.
 * https://core.telegram.org/bots/webapps#validating-data-for-third-party-use
 */
export async function verifyWebAppSignature(
  initData: string,
  botId: number,
  options: { publicKeyHex?: string; maxAgeSeconds?: number; now?: number } = {},
): Promise<WebAppVerifyResult> {
  const params = new URLSearchParams(initData)
  const signature = params.get('signature')
  if (!signature) return { ok: false, reason: 'malformed' }

  const fields: Record<string, string> = {}
  for (const [key, value] of params) if (key !== 'hash' && key !== 'signature') fields[key] = value
  const message = `${botId}:WebAppData\n${dataCheckString(fields)}`

  let valid: boolean
  try {
    const key = await crypto.subtle.importKey('raw', fromHex(options.publicKeyHex ?? TELEGRAM_PUBLIC_KEY), { name: 'Ed25519' }, false, ['verify'])
    valid = await crypto.subtle.verify('Ed25519', key, fromBase64Url(signature), new TextEncoder().encode(message))
  } catch {
    return { ok: false, reason: 'malformed' }
  }
  if (!valid) return { ok: false, reason: 'signature' }

  return parseInitDataFields(fields, options.maxAgeSeconds ?? 86_400, options.now ?? Math.floor(Date.now() / 1000))
}
