import type { Impression, WineColor, WineNote } from '../types'
import { supabase } from './supabase'

export const USERNAME_RE = /^[a-z0-9_]{3,20}$/

/** «@Anya_K » → «anya_k» */
export function normalizeUsername(raw: string): string {
  return raw.trim().replace(/^@+/, '').toLowerCase()
}

/** Текст ошибки для юзернейма или null, если он подходит. */
export function usernameError(raw: string): string | null {
  const u = normalizeUsername(raw)
  if (u.length < 3) return 'Минимум 3 символа'
  if (u.length > 20) return 'Максимум 20 символов'
  if (!USERNAME_RE.test(u)) return 'Только латинские буквы, цифры и «_»'
  return null
}

/** Вино в рекомендации — копия основных полей заметки. */
export interface SharedWine {
  name: string
  impression: Impression
  color?: WineColor
  grapes: string[]
  regions: string[]
  tags: string[]
  place?: string
  comment?: string
  tastedAt?: string
}

export function wineFromNote(note: WineNote, opts: { place: boolean; comment: boolean }): SharedWine {
  const wine: SharedWine = {
    name: note.name,
    impression: note.impression,
    grapes: note.grapes ?? [],
    regions: note.regions ?? [],
    tags: note.tags ?? [],
    tastedAt: note.tastedAt,
  }
  if (note.color) wine.color = note.color
  if (opts.place && note.place) wine.place = note.place
  if (opts.comment && note.comment) wine.comment = note.comment
  return wine
}

export interface Friend {
  friendshipId: string
  status: 'pending' | 'accepted'
  incoming: boolean
  userId: string
  username: string | null
  displayName: string
}

export interface FoundUser {
  userId: string
  username: string
  displayName: string
}

export interface Recommendation {
  id: string
  wine: SharedWine
  message: string | null
  createdAt: string
  senderUsername: string | null
  senderName: string | null
}

export type FriendRequestResult = 'sent' | 'accepted' | 'already' | 'not_found' | 'no_username'

function client() {
  if (!supabase) throw new Error('Supabase не настроен')
  return supabase
}

async function currentUserId(): Promise<string> {
  const { data } = await client().auth.getSession()
  const id = data.session?.user.id
  if (!id) throw new Error('Нужно войти')
  return id
}

export async function getMyUsername(): Promise<string | null> {
  const id = await currentUserId()
  const { data, error } = await client().from('profiles').select('username').eq('id', id).maybeSingle()
  if (error) throw error
  return data?.username ?? null
}

/** Сохраняет юзернейм. Возвращает 'taken', если он уже занят. */
export async function setMyUsername(raw: string): Promise<'ok' | 'taken'> {
  const id = await currentUserId()
  const { error } = await client().from('profiles').upsert({ id, username: normalizeUsername(raw) })
  if (error?.code === '23505') return 'taken'
  if (error) throw error
  return 'ok'
}

export async function listFriends(): Promise<Friend[]> {
  const { data, error } = await client().rpc('my_friends')
  if (error) throw error
  return (data ?? []).map((r: Record<string, unknown>) => ({
    friendshipId: r.friendship_id as string,
    status: r.status as Friend['status'],
    incoming: r.incoming as boolean,
    userId: r.user_id as string,
    username: (r.username as string | null) ?? null,
    displayName: (r.display_name as string) ?? '',
  }))
}

export async function findUser(raw: string): Promise<FoundUser | null> {
  const { data, error } = await client().rpc('find_user', { target_username: normalizeUsername(raw) })
  if (error) throw error
  const r = (data ?? [])[0]
  return r ? { userId: r.user_id, username: r.username, displayName: r.display_name ?? '' } : null
}

export async function sendFriendRequest(username: string): Promise<FriendRequestResult> {
  const { data, error } = await client().rpc('send_friend_request', { target_username: normalizeUsername(username) })
  if (error) throw error
  return data as FriendRequestResult
}

export async function respondFriendRequest(friendshipId: string, accept: boolean) {
  const { error } = await client().rpc('respond_friend_request', { request_id: friendshipId, accept })
  if (error) throw error
}

/** Отменить свой запрос, отклонить чужой или удалить из друзей. */
export async function removeFriendship(friendshipId: string) {
  const { error } = await client().from('friendships').delete().eq('id', friendshipId)
  if (error) throw error
}

export async function listRecommendations(): Promise<Recommendation[]> {
  const { data, error } = await client().rpc('my_recommendations')
  if (error) throw error
  return (data ?? []).map((r: Record<string, unknown>) => ({
    id: r.id as string,
    wine: r.wine as SharedWine,
    message: (r.message as string | null) ?? null,
    createdAt: r.created_at as string,
    senderUsername: (r.sender_username as string | null) ?? null,
    senderName: (r.sender_name as string | null) ?? null,
  }))
}

export async function deleteRecommendation(id: string) {
  const { error } = await client().from('recommendations').delete().eq('id', id)
  if (error) throw error
}

export async function sendRecommendation(recipientId: string, wine: SharedWine, message: string) {
  const sender = await currentUserId()
  const text = message.trim()
  const { error } = await client()
    .from('recommendations')
    .insert({ sender, recipient: recipientId, wine, message: text || null })
  if (error) throw error
}

/** Сколько рекомендаций пришло позже seenAt (все, если seenAt не задан). */
export async function countNewRecommendations(seenAt: string | undefined): Promise<number> {
  const me = await currentUserId()
  // фильтр по получателю обязателен: правила доступа показывают и отправленные мной
  let query = client().from('recommendations').select('id', { count: 'exact', head: true }).eq('recipient', me)
  if (seenAt) query = query.gt('created_at', seenAt)
  const { count, error } = await query
  if (error) throw error
  return count ?? 0
}

/** Самая поздняя дата из списка ISO-строк (или undefined для пустого списка). */
export function latestDate(dates: string[]): string | undefined {
  return dates.reduce<string | undefined>((max, d) => (!max || Date.parse(d) > Date.parse(max) ? d : max), undefined)
}
