import { createHmac } from 'node:crypto'
import { describe, expect, it } from 'vitest'
import { verifyWebAppInitData } from '../src/runtime/server/utils/webapp'

const TOKEN = '123456:ABC-test-token'
const NOW = 1_760_000_000

// Independent reference implementation of Telegram's algorithm.
function sign(fields: Record<string, string>): string {
  const check = Object.keys(fields).sort().map((k) => `${k}=${fields[k]}`).join('\n')
  const secret = createHmac('sha256', 'WebAppData').update(TOKEN).digest()
  const hash = createHmac('sha256', secret).update(check).digest('hex')
  return new URLSearchParams({ ...fields, hash }).toString()
}

const user = JSON.stringify({ id: 42, first_name: 'Ada', username: 'ada', language_code: 'ru', is_premium: true })
const fields = { user, query_id: 'AAH', auth_date: String(NOW - 10), start_param: 'ref_7' }

describe('verifyWebAppInitData', () => {
  it('accepts valid init data and parses the user', async () => {
    const result = await verifyWebAppInitData(sign(fields), TOKEN, 86_400, NOW)
    expect(result.ok && result.data.user).toMatchObject({ id: 42, username: 'ada', is_premium: true })
    expect(result.ok && result.data.start_param).toBe('ref_7')
  })

  it('rejects tampering', async () => {
    const tampered = sign(fields).replace('ref_7', 'ref_8')
    expect(await verifyWebAppInitData(tampered, TOKEN, 86_400, NOW)).toEqual({ ok: false, reason: 'signature' })
  })

  it('rejects login widget style signatures', async () => {
    expect((await verifyWebAppInitData(sign(fields), '999:other', 86_400, NOW)).ok).toBe(false)
  })

  it('rejects stale and malformed data', async () => {
    expect(await verifyWebAppInitData(sign({ ...fields, auth_date: String(NOW - 90_000) }), TOKEN, 86_400, NOW)).toEqual({ ok: false, reason: 'expired' })
    expect(await verifyWebAppInitData('user=x', TOKEN)).toEqual({ ok: false, reason: 'malformed' })
  })
})
