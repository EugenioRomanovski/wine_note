-- Юзернейм: уникальный, латиница в нижнем регистре, цифры и «_», 3–20 символов.
alter table public.profiles add column username text
  constraint profiles_username_format check (username ~ '^[a-z0-9_]{3,20}$');
create unique index profiles_username_key on public.profiles (username);

-- Дружба: одна запись на пару пользователей; pending — запрос, accepted — друзья.
create table public.friendships (
  id uuid primary key default gen_random_uuid(),
  requester uuid not null references auth.users (id) on delete cascade,
  addressee uuid not null references auth.users (id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'accepted')),
  created_at timestamptz not null default now(),
  check (requester <> addressee)
);
create unique index friendships_pair_key on public.friendships (least(requester, addressee), greatest(requester, addressee));
create index friendships_addressee_idx on public.friendships (addressee);
create index friendships_requester_idx on public.friendships (requester);
alter table public.friendships enable row level security;
-- читать и удалять (отклонить, отменить, удалить из друзей) — только участникам;
-- создание и принятие — только через функции ниже
create policy "Дружба: видят участники" on public.friendships
  for select to authenticated using ((select auth.uid()) in (requester, addressee));
create policy "Дружба: удаляют участники" on public.friendships
  for delete to authenticated using ((select auth.uid()) in (requester, addressee));

create function public.are_friends(a uuid, b uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.friendships f
    where f.status = 'accepted'
      and least(f.requester, f.addressee) = least(a, b)
      and greatest(f.requester, f.addressee) = greatest(a, b)
  );
$$;

-- Рекомендации вин: отправить можно только другу.
create table public.recommendations (
  id uuid primary key default gen_random_uuid(),
  sender uuid not null references auth.users (id) on delete cascade,
  recipient uuid not null references auth.users (id) on delete cascade,
  wine jsonb not null check (jsonb_typeof(wine) = 'object' and pg_column_size(wine) < 8192),
  message text check (char_length(message) <= 500),
  created_at timestamptz not null default now()
);
create index recommendations_recipient_idx on public.recommendations (recipient, created_at desc);
create index recommendations_sender_idx on public.recommendations (sender);
alter table public.recommendations enable row level security;
create policy "Рекомендации: видят отправитель и получатель" on public.recommendations
  for select to authenticated using ((select auth.uid()) in (sender, recipient));
create policy "Рекомендации: отправить другу" on public.recommendations
  for insert to authenticated
  with check (sender = (select auth.uid()) and public.are_friends(sender, recipient));
create policy "Рекомендации: удаляют отправитель и получатель" on public.recommendations
  for delete to authenticated using ((select auth.uid()) in (sender, recipient));

-- Найти пользователя по точному юзернейму (без перебора по префиксу).
create function public.find_user(target_username text)
returns table (user_id uuid, username text, display_name text)
language sql stable security definer set search_path = '' as $$
  select p.id, p.username, p.display_name from public.profiles p
  where auth.uid() is not null and p.username = lower(trim(target_username)) and p.id <> auth.uid();
$$;

-- Отправить запрос в друзья. Если встречный запрос уже есть — сразу дружба.
-- Возвращает: sent | accepted | already | not_found | no_username
create function public.send_friend_request(target_username text) returns text
language plpgsql security definer set search_path = '' as $$
declare
  me uuid := auth.uid();
  target uuid;
  existing public.friendships;
begin
  if me is null then raise exception 'not authenticated'; end if;
  if not exists (select 1 from public.profiles where id = me and username is not null) then return 'no_username'; end if;
  select id into target from public.profiles where username = lower(trim(target_username)) and id <> me;
  if target is null then return 'not_found'; end if;
  select * into existing from public.friendships f
    where least(f.requester, f.addressee) = least(me, target) and greatest(f.requester, f.addressee) = greatest(me, target);
  if existing.id is null then
    insert into public.friendships (requester, addressee) values (me, target);
    return 'sent';
  end if;
  if existing.status = 'pending' and existing.addressee = me then
    update public.friendships set status = 'accepted' where id = existing.id;
    return 'accepted';
  end if;
  return 'already';
end;
$$;

-- Принять или отклонить входящий запрос.
create function public.respond_friend_request(request_id uuid, accept boolean) returns void
language plpgsql security definer set search_path = '' as $$
begin
  if accept then
    update public.friendships set status = 'accepted'
      where id = request_id and addressee = auth.uid() and status = 'pending';
  else
    delete from public.friendships
      where id = request_id and addressee = auth.uid() and status = 'pending';
  end if;
end;
$$;

-- Друзья и запросы текущего пользователя.
create function public.my_friends()
returns table (friendship_id uuid, status text, incoming boolean, user_id uuid, username text, display_name text, created_at timestamptz)
language sql stable security definer set search_path = '' as $$
  select f.id, f.status, f.addressee = auth.uid(), p.id, p.username, p.display_name, f.created_at
  from public.friendships f
  join public.profiles p on p.id = case when f.requester = auth.uid() then f.addressee else f.requester end
  where auth.uid() in (f.requester, f.addressee)
  order by f.created_at desc;
$$;

-- Рекомендации, полученные текущим пользователем, с данными отправителя.
create function public.my_recommendations()
returns table (id uuid, wine jsonb, message text, created_at timestamptz, sender_id uuid, sender_username text, sender_name text)
language sql stable security definer set search_path = '' as $$
  select r.id, r.wine, r.message, r.created_at, p.id, p.username, p.display_name
  from public.recommendations r
  left join public.profiles p on p.id = r.sender
  where r.recipient = auth.uid()
  order by r.created_at desc;
$$;

revoke execute on function public.are_friends(uuid, uuid), public.find_user(text), public.send_friend_request(text),
  public.respond_friend_request(uuid, boolean), public.my_friends(), public.my_recommendations() from public, anon;
grant execute on function public.are_friends(uuid, uuid), public.find_user(text), public.send_friend_request(text),
  public.respond_friend_request(uuid, boolean), public.my_friends(), public.my_recommendations() to authenticated;
