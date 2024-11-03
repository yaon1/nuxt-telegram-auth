import { createHash, createHmac } from 'node:crypto'
import { describe, expect, it } from 'vitest'
import { verifyTelegramLogin } from '../src/runtime/server/utils/verify'

const TOKEN = '123456:ABC-test-token'
const NOW = 1_760_000_000

// Reference signer written independently with node:crypto to cross-check the Web Crypto implementation.
function sign(fields: Record<string, string | number>): Record<string, string | number> {
  const check = Object.keys(fields).sort().map((k) => `${k}=${fields[k]}`).join('\n')
  const secret = createHash('sha256').update(TOKEN).digest()
  return { ...fields, hash: createHmac('sha256', secret).update(check).digest('hex') }
}

const base = { id: 42, first_name: 'Ada', username: 'ada', auth_date: NOW - 60 }

describe('verifyTelegramLogin', () => {
  it('accepts a valid payload', async () => {
    const result = await verifyTelegramLogin(sign(base), TOKEN, 86_400, NOW)
    expect(result).toEqual({ ok: true, user: { ...base, last_name: undefined, photo_url: undefined } })
  })

  it('rejects tampered fields', async () => {
    const payload = { ...sign(base), id: 1 }
    expect(await verifyTelegramLogin(payload, TOKEN, 86_400, NOW)).toEqual({ ok: false, reason: 'signature' })
  })

  it('rejects a payload signed for another bot', async () => {
    expect((await verifyTelegramLogin(sign(base), '999:other', 86_400, NOW)).ok).toBe(false)
  })

  it('rejects stale logins', async () => {
    const old = sign({ ...base, auth_date: NOW - 90_000 })
    expect(await verifyTelegramLogin(old, TOKEN, 86_400, NOW)).toEqual({ ok: false, reason: 'expired' })
  })

  it('rejects missing hash', async () => {
    expect(await verifyTelegramLogin(base, TOKEN)).toEqual({ ok: false, reason: 'malformed' })
  })
})
