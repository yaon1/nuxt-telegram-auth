import { expect, it } from 'vitest'
import { safeRedirect } from '../src/runtime/server/utils/redirect'

it.each([
  ['/dashboard?tab=1', '/dashboard?tab=1'],
  ['//evil.com', '/'],
  ['https://evil.com', '/'],
  ['/\\evil.com', '/'],
  [undefined, '/'],
])('safeRedirect(%s) → %s', (input, expected) => {
  expect(safeRedirect(input)).toBe(expected)
})
