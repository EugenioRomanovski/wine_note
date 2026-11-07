-- Закрытая схема (не видна через API). Функция пока не используется: правило доступа
-- к рекомендациям осталось на public.are_friends (см. следующую миграцию) — замена правила
-- требует удаления старого, а коннектор такие команды без подтверждения не выполняет.
create schema if not exists private;
grant usage on schema private to authenticated;
create function private.are_friends(a uuid, b uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select auth.uid() in (a, b) and exists (
    select 1 from public.friendships f
    where f.status = 'accepted'
      and least(f.requester, f.addressee) = least(a, b)
      and greatest(f.requester, f.addressee) = greatest(a, b)
  );
$$;
revoke execute on function private.are_friends(uuid, uuid) from public, anon;
grant execute on function private.are_friends(uuid, uuid) to authenticated;
