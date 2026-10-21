-- Профиль пользователя: имя и аватар, синхронизируются между устройствами.
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null default '' check (char_length(display_name) <= 100),
  -- путь к файлу в бакете avatars: '<user id>/avatar.jpg'
  avatar_path text,
  -- время последнего изменения на устройстве (для «побеждает последнее изменение»)
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "Профиль: читать свой" on public.profiles
  for select to authenticated using ((select auth.uid()) = id);
create policy "Профиль: создать свой" on public.profiles
  for insert to authenticated with check ((select auth.uid()) = id);
create policy "Профиль: менять свой" on public.profiles
  for update to authenticated using ((select auth.uid()) = id) with check ((select auth.uid()) = id);

-- Аватары: приватный бакет, только картинки до 2 МБ.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('avatars', 'avatars', false, 2097152, array['image/jpeg', 'image/png', 'image/webp']);

-- Файлы лежат в папке с id пользователя: доступ только к своей папке.
create policy "Аватар: читать свой" on storage.objects
  for select to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "Аватар: загрузить свой" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "Аватар: заменить свой" on storage.objects
  for update to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text)
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "Аватар: удалить свой" on storage.objects
  for delete to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text);
