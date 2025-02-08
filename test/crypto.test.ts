import { createHmac } from 'node:crypto'
import { describe, expect, it } from 'vitest'
import { constantTimeEqual, dataCheckString, hmacSha256, toHex } from '../src/runtime/server/utils/crypto'

describe('crypto helpers', () => {
  it('builds the sorted data-check string and skips empty values', () => {
    expect(dataCheckString({ b: 2, a: 'x', c: undefined, d: null })).toBe('a=x\nb=2')
  })

  it('matches node:crypto HMAC', async () => {
    const expected = createHmac('sha256', 'key').update('data').digest('hex')
    expect(toHex(await hmacSha256('key', 'data'))).toBe(expected)
  })

  it('compares strings', () => {
    expect(constantTimeEqual('abc', 'abc')).toBe(true)
    expect(constantTimeEqual('abc', 'abd')).toBe(false)
    expect(constantTimeEqual('abc', 'ab')).toBe(false)
  })
})
