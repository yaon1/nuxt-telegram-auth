import { expect, it } from 'vitest'
import { isAllowed } from '../src/runtime/server/utils/allow'

const ada = { id: 42, username: 'Ada' }

it('allows everyone with an empty list', () => expect(isAllowed(ada, [])).toBe(true))
it('matches ids as numbers or strings', () => {
  expect(isAllowed(ada, [42])).toBe(true)
  expect(isAllowed(ada, ['42'])).toBe(true)
  expect(isAllowed(ada, [7])).toBe(false)
})
it('matches usernames case-insensitively with optional @', () => {
  expect(isAllowed(ada, ['@ada'])).toBe(true)
  expect(isAllowed({ id: 1 }, ['@ada'])).toBe(false)
})
