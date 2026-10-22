import { useEffect, useState } from 'react'
import { db } from '../storage/db'
import { useAuth } from '../hooks/useAuth'
import { useSocial } from '../hooks/useSocial'
import {
  deleteRecommendation,
  findUser,
  removeFriendship,
  respondFriendRequest,
  sendFriendRequest,
  latestDate,
  setMyUsername,
  usernameError,
  type FoundUser,
  type Friend,
  type Recommendation,
} from '../lib/social'
import { WINE_COLORS } from '../lib/labels'
import { formatDay } from '../lib/dates'
import { ImpressionChip } from './ImpressionChip'

const who = (name: string | null | undefined, username: string | null | undefined) =>
  [name?.trim(), username ? `@${username}` : null].filter(Boolean).join(' · ') || 'Без имени'

/** Юзернейм, друзья и рекомендации — показывается в профиле, когда пользователь вошёл. */
export function SocialPanel() {
  const userId = useAuth()?.user.id
  const social = useSocial(userId)

  // рекомендации показаны в профиле — снимаем метку-сердечко с аватара в ленте
  const newest = latestDate(social.recommendations.map((r) => r.createdAt))
  useEffect(() => {
    if (!newest) return
    void db.profile
      .toCollection()
      .first()
      .then((p) => {
        if (p?.id != null && (!p.recsSeenAt || Date.parse(newest) > Date.parse(p.recsSeenAt))) {
          return db.profile.update(p.id, { recsSeenAt: newest })
        }
      })
  }, [newest])

  if (!userId) return null

  return (
    <>
      <UsernameCard username={social.username} loading={social.loading} onSaved={social.reload} />

      <div className="profile-section-title">Друзья</div>
      {social.error && <div className="social-error">{social.error}</div>}
      <FriendsCard
        hasUsername={!!social.username}
        friends={social.friends}
        loading={social.loading}
        reload={social.reload}
      />

      <div className="profile-section-title">Рекомендации от друзей</div>
      <RecommendationsList items={social.recommendations} loading={social.loading} reload={social.reload} />
    </>
  )
}

function UsernameCard(props: { username: string | null; loading: boolean; onSaved: () => Promise<void> }) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  if (props.loading) return null
  const startEdit = () => {
    setDraft(props.username ?? '')
    setError(null)
    setEditing(true)
  }

  const save = async () => {
    const problem = usernameError(draft)
    if (problem) return setError(problem)
    setBusy(true)
    try {
      const res = await setMyUsername(draft)
      if (res === 'taken') setError('Этот юзернейм уже занят')
      else {
        await props.onSaved()
        setEditing(false)
      }
    } catch {
      setError('Не удалось сохранить. Проверьте интернет.')
    } finally {
      setBusy(false)
    }
  }

  if (!editing) {
    return (
      <div className="account-card social-username">
        <div className="account-label">Юзернейм — по нему вас найдут друзья</div>
        <div className="row-between">
          <div className="account-email">{props.username ? `@${props.username}` : 'не задан'}</div>
          <button className="btn-text" onClick={startEdit}>
            {props.username ? 'Изменить' : 'Придумать'}
          </button>
        </div>
      </div>
    )
  }
  return (
    <div className="account-card social-username">
      <div className="account-label">Латинские буквы, цифры и «_», от 3 до 20 символов</div>
      <div className="social-at-input">
        <span>@</span>
        <input
          className="input"
          autoFocus
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          maxLength={21}
          value={draft}
          onChange={(e) => setDraft(e.target.value.replace(/^@/, '').toLowerCase())}
          onKeyDown={(e) => e.key === 'Enter' && void save()}
          placeholder="username"
        />
      </div>
      {error && <div className="account-error">{error}</div>}
      <div className="social-actions">
        <button className="btn-outline account-btn" disabled={busy} onClick={() => setEditing(false)}>
          Отмена
        </button>
        <button className="btn-accent account-btn" disabled={busy || !draft.trim()} onClick={() => void save()}>
          {busy ? 'Сохраняем…' : 'Сохранить'}
        </button>
      </div>
    </div>
  )
}

function FriendsCard(props: { hasUsername: boolean; friends: Friend[]; loading: boolean; reload: () => Promise<void> }) {
  const [query, setQuery] = useState('')
  const [found, setFound] = useState<FoundUser | null | 'none'>(null)
  const [note, setNote] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const incoming = props.friends.filter((f) => f.status === 'pending' && f.incoming)
  const outgoing = props.friends.filter((f) => f.status === 'pending' && !f.incoming)
  const accepted = props.friends.filter((f) => f.status === 'accepted')

  const run = async (fn: () => Promise<unknown>) => {
    setBusy(true)
    try {
      await fn()
      await props.reload()
    } catch {
      setNote('Не получилось. Проверьте интернет и попробуйте ещё раз.')
    } finally {
      setBusy(false)
    }
  }

  const search = () =>
    run(async () => {
      setNote(null)
      if (usernameError(query)) {
        setFound('none')
        return
      }
      setFound((await findUser(query)) ?? 'none')
    })

  const add = (u: FoundUser) =>
    run(async () => {
      const res = await sendFriendRequest(u.username)
      const messages: Record<string, string> = {
        sent: `Запрос отправлен @${u.username}`,
        accepted: `Вы теперь друзья с @${u.username}`,
        already: `@${u.username} уже в друзьях или запрос уже отправлен`,
        not_found: 'Пользователь не найден',
        no_username: 'Сначала придумайте себе юзернейм',
      }
      setNote(messages[res] ?? 'Готово')
      setFound(null)
      setQuery('')
    })

  return (
    <div className="account-card social-friends">
      {!props.hasUsername && !props.loading && (
        <div className="account-hint">Чтобы добавлять друзей, придумайте себе юзернейм выше.</div>
      )}
      <div className="social-search">
        <div className="social-at-input">
          <span>@</span>
          <input
            className="input"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            placeholder="юзернейм друга"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value)
              setFound(null)
            }}
            onKeyDown={(e) => e.key === 'Enter' && query.trim() && void search()}
          />
        </div>
        <button className="btn-accent social-search-btn" disabled={busy || !query.trim()} onClick={() => void search()}>
          Найти
        </button>
      </div>
      {found === 'none' && <div className="account-hint">Никого не нашли. Проверьте юзернейм.</div>}
      {found && found !== 'none' && (
        <div className="social-row">
          <div className="social-who">{who(found.displayName, found.username)}</div>
          <button
            className="btn-text social-accent"
            disabled={busy || !props.hasUsername}
            onClick={() => void add(found)}
          >
            Добавить
          </button>
        </div>
      )}
      {note && <div className="social-note">{note}</div>}

      {incoming.length > 0 && <div className="social-subtitle">Запросы в друзья</div>}
      {incoming.map((f) => (
        <div className="social-row" key={f.friendshipId}>
          <div className="social-who">{who(f.displayName, f.username)}</div>
          <div className="social-row-actions">
            <button className="btn-text" disabled={busy} onClick={() => void run(() => respondFriendRequest(f.friendshipId, false))}>
              Отклонить
            </button>
            <button
              className="btn-text social-accent"
              disabled={busy}
              onClick={() => void run(() => respondFriendRequest(f.friendshipId, true))}
            >
              Принять
            </button>
          </div>
        </div>
      ))}

      <div className="social-subtitle">Мои друзья{accepted.length > 0 ? ` · ${accepted.length}` : ''}</div>
      {accepted.length === 0 && !props.loading && (
        <div className="account-hint">Пока никого. Найдите друга по юзернейму.</div>
      )}
      {accepted.map((f) => (
        <div className="social-row" key={f.friendshipId}>
          <div className="social-who">{who(f.displayName, f.username)}</div>
          <button
            className="btn-text"
            disabled={busy}
            onClick={() => {
              if (window.confirm(`Удалить ${who(f.displayName, f.username)} из друзей?`)) {
                void run(() => removeFriendship(f.friendshipId))
              }
            }}
          >
            Удалить
          </button>
        </div>
      ))}

      {outgoing.length > 0 && <div className="social-subtitle">Ждут ответа</div>}
      {outgoing.map((f) => (
        <div className="social-row" key={f.friendshipId}>
          <div className="social-who">{who(f.displayName, f.username)}</div>
          <button className="btn-text" disabled={busy} onClick={() => void run(() => removeFriendship(f.friendshipId))}>
            Отменить
          </button>
        </div>
      ))}
    </div>
  )
}

function RecommendationsList(props: { items: Recommendation[]; loading: boolean; reload: () => Promise<void> }) {
  const [busy, setBusy] = useState<string | null>(null)
  if (props.loading) return <div className="account-card account-muted">Загрузка…</div>
  if (props.items.length === 0) {
    return (
      <div className="account-card account-muted">
        Здесь появятся вина, которые вам посоветуют друзья.
      </div>
    )
  }
  const remove = async (id: string) => {
    if (!window.confirm('Удалить рекомендацию?')) return
    setBusy(id)
    try {
      await deleteRecommendation(id)
      await props.reload()
    } finally {
      setBusy(null)
    }
  }
  return (
    <div className="social-recs">
      {props.items.map((r) => {
        const w = r.wine
        const color = WINE_COLORS.find((c) => c.value === w.color)?.label
        const chips = [
          ...(w.grapes?.length ? [w.grapes.join('/')] : []),
          ...(color ? [color] : []),
          ...(w.regions ?? []),
          ...(w.tags ?? []),
        ]
        return (
          <div className="rec-card" key={r.id}>
            <div className="row-between">
              <ImpressionChip impression={w.impression} />
              <span className="note-date">{formatDay(r.createdAt)}</span>
            </div>
            <div className="rec-name">{w.name}</div>
            <div className="rec-from">Советует {who(r.senderName, r.senderUsername)}</div>
            {r.message && <div className="rec-message">«{r.message}»</div>}
            {w.comment && <div className="rec-comment">Заметка друга: {w.comment}</div>}
            {w.place && <div className="rec-comment">Где пили: {w.place}</div>}
            {chips.length > 0 && (
              <div className="detail-tags rec-tags">
                {chips.map((c) => (
                  <span key={c} className="tag-chip tag-neutral">
                    {c}
                  </span>
                ))}
              </div>
            )}
            <div className="rec-actions">
              <button className="btn-text" disabled={busy === r.id} onClick={() => void remove(r.id)}>
                Удалить
              </button>
            </div>
          </div>
        )
      })}
    </div>
  )
}
