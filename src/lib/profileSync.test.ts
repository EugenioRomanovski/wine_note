import { describe, expect, it } from 'vitest'
import type { Profile } from '../types'
import { decideSync, type RemoteProfile } from './profileSync'

const U = 'user-1'
const local = (p: Partial<Profile> = {}): Profile => ({ id: 1, name: '', theme: 'light', ...p })
const remote = (p: Partial<RemoteProfile> = {}): RemoteProfile => ({
  display_name: '',
  avatar_path: null,
  updated_at: '2026-10-20T10:00:00Z',
  ...p,
})

describe('decideSync', () => {
  it('pushes local data when there is no cloud profile yet', () => {
    expect(decideSync(local({ name: 'Евгений' }), null, U)).toBe('push')
    expect(decideSync(local(), null, U)).toBe('none')
  })

  it('prefers the cloud on a new device where local edit time is unknown', () => {
    expect(decideSync(local({ name: 'Старое имя' }), remote({ display_name: 'Евгений' }), U)).toBe('pull')
    expect(decideSync(local({ name: 'Евгений' }), remote(), U)).toBe('push')
  })

  it('lets the latest change win', () => {
    const synced = { syncedUserId: U }
    expect(decideSync(local({ ...synced, name: 'A', updatedAt: '2026-10-21T10:00:00Z' }), remote({ display_name: 'B' }), U)).toBe('push')
    expect(decideSync(local({ ...synced, name: 'A', updatedAt: '2026-10-19T10:00:00Z' }), remote({ display_name: 'B' }), U)).toBe('pull')
    expect(decideSync(local({ ...synced, name: 'A', updatedAt: '2026-10-20T10:00:00Z' }), remote({ display_name: 'A' }), U)).toBe('none')
  })

  it('does not push another account’s profile over existing cloud data', () => {
    const other = local({ name: 'Чужое имя', updatedAt: '2026-10-25T10:00:00Z', syncedUserId: 'user-2' })
    expect(decideSync(other, remote({ display_name: 'Евгений' }), U)).toBe('pull')
  })
})
