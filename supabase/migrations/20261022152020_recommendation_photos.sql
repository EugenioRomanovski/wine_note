-- Фото в рекомендациях: путь к файлу в бакете rec-photos ('<sender id>/<recommendation id>.jpg').
alter table public.recommendations add column photo_path text;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('rec-photos', 'rec-photos', false, 5242880, array['image/jpeg', 'image/png', 'image/webp']);

-- Загружать — только в свою папку.
create policy "Фото рекомендаций: загрузить своё" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'rec-photos' and (storage.foldername(name))[1] = (select auth.uid())::text);
-- Видят — отправитель (своя папка) и получатель рекомендации с этим фото.
create policy "Фото рекомендаций: видят отправитель и получатель" on storage.objects
  for select to authenticated
  using (
    bucket_id = 'rec-photos' and (
      (storage.foldername(name))[1] = (select auth.uid())::text
      or exists (
        select 1 from public.recommendations r
        where r.photo_path = storage.objects.name and r.recipient = (select auth.uid())
      )
    )
  );
create policy "Фото рекомендаций: удалить своё" on storage.objects
  for delete to authenticated
  using (bucket_id = 'rec-photos' and (storage.foldername(name))[1] = (select auth.uid())::text);

-- Как my_recommendations, плюс путь к фото (старую функцию не трогаем — замена требует удаления).
create function public.my_recommendations_v2()
returns table (id uuid, wine jsonb, message text, photo_path text, created_at timestamptz, sender_id uuid, sender_username text, sender_name text)
language sql stable security definer set search_path = '' as $$
  select r.id, r.wine, r.message, r.photo_path, r.created_at, p.id, p.username, p.display_name
  from public.recommendations r
  left join public.profiles p on p.id = r.sender
  where r.recipient = auth.uid()
  order by r.created_at desc;
$$;
revoke execute on function public.my_recommendations_v2() from public, anon;
grant execute on function public.my_recommendations_v2() to authenticated;
