-- Фото рекомендации — только из папки отправителя: нельзя «поделиться» чужим файлом.
alter table public.recommendations add constraint recommendations_photo_in_sender_folder
  check (photo_path is null or photo_path like sender::text || '/%');
