import { fileURLToPath } from 'node:url'
import { $fetch, fetch, setup } from '@nuxt/test-utils/e2e'
import { describe, expect, it } from 'vitest'
import { now, signWebApp, signWidget } from './helpers'

const api = '/api/_auth/telegram'

async function cookieFrom(response: Response): Promise<string> {
  return (response.headers.get('set-cookie') ?? '').split(';')[0]!
}

describe('module e2e', async () => {
  await setup({ rootDir: fileURLToPath(new URL('./fixtures/basic', import.meta.url)) })

  it('protects API routes', async () => {
    const res = await fetch('/api/me')
    expect(res.status).toBe(401)
  })

  it('logs in with widget data and reads the session', async () => {
    const res = await fetch(`${api}/login`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(signWidget({ id: 42, first_name: 'Ada', auth_date: now() })),
    })
    expect(res.status).toBe(200)
    const cookie = await cookieFrom(res)
    expect(await $fetch('/api/me', { headers: { cookie } })).toEqual({ id: 42 })
    expect(await $fetch(`${api}/session`, { headers: { cookie } })).toMatchObject({ user: { id: 42, first_name: 'Ada' } })
  })

  it('rejects forged widget data', async () => {
    const forged = { ...signWidget({ id: 42, first_name: 'Ada', auth_date: now() }), id: 7 }
    const res = await fetch(`${api}/login`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(forged) })
    expect(res.status).toBe(401)
  })

  it('blocks users outside the allow-list', async () => {
    const res = await fetch(`${api}/login`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(signWidget({ id: 999, first_name: 'Mallory', username: 'mallory', auth_date: now() })),
    })
    expect(res.status).toBe(403)

    const byName = await fetch(`${api}/login`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(signWidget({ id: 1000, first_name: 'Ada', username: 'ADA', auth_date: now() })),
    })
    expect(byName.status).toBe(200)
  })
})
