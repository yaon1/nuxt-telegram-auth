import { generateKeyPairSync, sign } from 'node:crypto'
import { describe, expect, it } from 'vitest'
import { verifyWebAppSignature } from '../src/runtime/server/utils/webapp-signature'

const BOT_ID = 7342037359
const NOW = 1_760_000_000
const { publicKey, privateKey } = generateKeyPairSync('ed25519')
// Raw 32-byte public key is the tail of the SPKI DER encoding.
const publicKeyHex = publicKey.export({ format: 'der', type: 'spki' }).subarray(-32).toString('hex')

function signed(fields: Record<string, string>, botId = BOT_ID): string {
  const check = Object.keys(fields).sort().map((k) => `${k}=${fields[k]}`).join('\n')
  const signature = sign(null, Buffer.from(`${botId}:WebAppData\n${check}`), privateKey).toString('base64url')
  return new URLSearchParams({ ...fields, hash: 'ignored-by-third-party-check', signature }).toString()
}

const fields = { user: JSON.stringify({ id: 1, first_name: 'Third' }), auth_date: String(NOW) }

describe('verifyWebAppSignature', () => {
  it('accepts data signed for this bot id', async () => {
    const result = await verifyWebAppSignature(signed(fields), BOT_ID, { publicKeyHex, now: NOW })
    expect(result.ok && result.data.user?.first_name).toBe('Third')
  })

  it('rejects data signed for another bot', async () => {
    expect(await verifyWebAppSignature(signed(fields, 1), BOT_ID, { publicKeyHex, now: NOW })).toEqual({ ok: false, reason: 'signature' })
  })

  it('rejects tampering and missing signatures', async () => {
    const tampered = signed(fields).replace('Third', 'Fourth')
    expect((await verifyWebAppSignature(tampered, BOT_ID, { publicKeyHex, now: NOW })).ok).toBe(false)
    expect(await verifyWebAppSignature('auth_date=1', BOT_ID)).toEqual({ ok: false, reason: 'malformed' })
  })
})
