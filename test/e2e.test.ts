import { fileURLToPath } from 'node:url'
import { $fetch, fetch, setup } from '@nuxt/test-utils/e2e'
import { describe, expect, it } from 'vitest'
import { now, signWebApp, signWidget } from './helpers'

const api = '/api/_auth/telegram'

async function cookieFrom(response: Response): Promise<string> {
  return (response.headers.get('set-cookie') ?? '').split(';')[0]!
}

async function signIn(fields: Record<string, string | number>): Promise<Response> {
  return fetch(`${api}/login`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(signWidget(fields)),
  })
}

describe('module e2e', async () => {
  await setup({ rootDir: fileURLToPath(new URL('./fixtures/basic', import.meta.url)) })

  it('protects API routes', async () => {
    const res = await fetch('/api/me')
    expect(res.status).toBe(401)
  })

  it('logs in with widget data and reads the session', async () => {
    const res = await signIn({ id: 42, first_name: 'Ada', auth_date: now() })
    expect(res.status).toBe(200)
    const cookie = await cookieFrom(res)
    expect(await $fetch('/api/me', { headers: { cookie } })).toEqual({ id: 42 })
    expect(await $fetch(`${api}/session`, { headers: { cookie } })).toMatchObject({ user: { id: 42, first_name: 'Ada' } })
  })

  it('rejects forged widget data', async () => {
    const forged = { ...signWidget({ id: 42, first_name: 'Ada', auth_date: now() }), id: 7 }
    const res = await fetch(`${api}/login`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(forged),
    })
    expect(res.status).toBe(401)
  })

  it('blocks users outside the allow-list', async () => {
    const res = await signIn({ id: 999, first_name: 'Mallory', username: 'mallory', auth_date: now() })
    expect(res.status).toBe(403)

    const byName = await signIn({ id: 1000, first_name: 'Ada', username: 'ADA', auth_date: now() })
    expect(byName.status).toBe(200)
  })

  it('signs in from Mini App init data', async () => {
    const initData = signWebApp({ user: JSON.stringify({ id: 7, first_name: 'Mini', language_code: 'ru' }), auth_date: String(now()) })
    const res = await fetch(`${api}/webapp`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ initData }),
    })
    expect(res.status).toBe(200)
    expect(await $fetch('/api/me', { headers: { cookie: await cookieFrom(res) } })).toEqual({ id: 7 })
  })

  it('handles redirect-mode callbacks safely', async () => {
    const query = new URLSearchParams(
      Object.entries(signWidget({ id: 42, first_name: 'Ada', auth_date: now() })).map(([k, v]) => [k, String(v)]),
    )
    query.set('redirect', '/private')
    const res = await fetch(`${api}/callback?${query}`, { redirect: 'manual' })
    expect(res.status).toBe(302)
    expect(res.headers.get('location')).toBe('/private')

    query.set('redirect', '//evil.example')
    const evil = await fetch(`${api}/callback?${query}`, { redirect: 'manual' })
    expect(evil.headers.get('location')).toBe('/')
  })

  it('redirects anonymous visitors from protected pages', async () => {
    const res = await fetch('/private', { redirect: 'manual' })
    expect(res.status).toBe(302)
    expect(res.headers.get('location')).toBe('/login?redirect=/private')
  })

  it('renders protected pages for signed-in users', async () => {
    const login = await signIn({ id: 42, first_name: 'Ada', auth_date: now() })
    const html = await $fetch<string>('/private', { headers: { cookie: await cookieFrom(login) } })
    expect(html).toContain('private Ada')
  })

  it('logs out', async () => {
    const login = await signIn({ id: 42, first_name: 'Ada', auth_date: now() })
    const cookie = await cookieFrom(login)
    const out = await fetch(`${api}/logout`, { method: 'POST', headers: { cookie } })
    const cleared = await cookieFrom(out)
    expect((await fetch('/api/me', { headers: { cookie: cleared } })).status).toBe(401)
  })

  it('lets a login hook veto the sign-in', async () => {
    const res = await signIn({ id: 13, first_name: 'Bob', username: 'banned', auth_date: now() })
    expect(res.status).toBe(403)
    expect(res.headers.get('set-cookie')).toBeNull()
  })

  it('rejects cross-origin login posts', async () => {
    const res = await fetch(`${api}/login`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', origin: 'https://evil.example' },
      body: JSON.stringify(signWidget({ id: 42, first_name: 'Ada', auth_date: now() })),
    })
    expect(res.status).toBe(403)
  })

  it('passes start_param to the login hook', async () => {
    const initData = signWebApp({ user: JSON.stringify({ id: 7, first_name: 'Mini' }), auth_date: String(now()), start_param: 'ref_42' })
    await fetch(`${api}/webapp`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ initData }) })
    expect(await $fetch('/api/last-start')).toEqual({ startParam: 'ref_42' })
  })

  it('sends signed-in users away from the login page', async () => {
    const login = await signIn({ id: 42, first_name: 'Ada', auth_date: now() })
    const res = await fetch('/login?redirect=/private', { redirect: 'manual', headers: { cookie: await cookieFrom(login) } })
    expect(res.status).toBe(302)
    expect(res.headers.get('location')).toBe('/private')
  })

  it('runs defineTelegramAuthHandler only for signed-in users', async () => {
    expect((await fetch('/api/orders')).status).toBe(401)
    const login = await signIn({ id: 42, first_name: 'Ada', auth_date: now() })
    expect(await $fetch('/api/orders', { headers: { cookie: await cookieFrom(login) } })).toEqual({ owner: 42, orders: [] })
  })

  it('rejects Mini App data without a user or past its max age', async () => {
    const noUser = signWebApp({ auth_date: String(now()), query_id: 'Q' })
    const res = await fetch(`${api}/webapp`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ initData: noUser }),
    })
    expect(res.status).toBe(400)

    const stale = signWebApp({ user: JSON.stringify({ id: 7, first_name: 'Mini' }), auth_date: String(now() - 7200) })
    const old = await fetch(`${api}/webapp`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ initData: stale }),
    })
    expect(old.status).toBe(401)
  })

  it('does not expose dev-login in production builds', async () => {
    const res = await fetch(`${api}/dev-login`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: '{}' })
    expect(res.status).toBe(404)
  })
})
