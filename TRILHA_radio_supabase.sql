-- TRILHA — Rádio contínua simples
-- Execute uma vez no SQL Editor do Supabase.
-- Depois envie seus arquivos de áudio para o bucket "radio-trilha".
-- Para controlar a ordem, use nomes como:
-- 01 - Taverna.mp3
-- 02 - Estrada.mp3
-- 03 - Combate.mp3

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'radio-trilha',
  'radio-trilha',
  true,
  52428800,
  array['audio/mpeg','audio/ogg','audio/wav','audio/mp4','audio/aac']
)
on conflict (id) do update
set public = true,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "TRILHA radio public read" on storage.objects;
create policy "TRILHA radio public read"
on storage.objects
for select
to public
using (bucket_id = 'radio-trilha');
