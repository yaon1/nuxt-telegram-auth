import { createHash, createHmac } from 'node:crypto'

export const BOT_TOKEN = '123:test-token'

export function signWidget(fields: Record<string, string | number>): Record<string, string | number> {
  const check = Object.keys(fields)
    .sort()
    .map((k) => `${k}=${fields[k]}`)
    .join('\n')
  const secret = createHash('sha256').update(BOT_TOKEN).digest()
  return { ...fields, hash: createHmac('sha256', secret).update(check).digest('hex') }
}

export function signWebApp(fields: Record<string, string>): string {
  const check = Object.keys(fields)
    .sort()
    .map((k) => `${k}=${fields[k]}`)
    .join('\n')
  const secret = createHmac('sha256', 'WebAppData').update(BOT_TOKEN).digest()
  return new URLSearchParams({ ...fields, hash: createHmac('sha256', secret).update(check).digest('hex') }).toString()
}

export const now = () => Math.floor(Date.now() / 1000)
