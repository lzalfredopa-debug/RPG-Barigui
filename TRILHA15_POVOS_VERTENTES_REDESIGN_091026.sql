-- TRILHA 1.5 — REDESIGN DE POVOS E VERTENTES — 09/10/2026
-- Remove do banco as referências às imagens antigas de Povos e Vertentes.
-- O bucket ancestry-images já é utilizado pelo projeto para os novos uploads.
--
-- IMPORTANTE:
-- Este SQL NÃO apaga fisicamente arquivos antigos do Supabase Storage.
-- Ele apenas deixa de referenciá-los no site. Se houver arquivos antigos
-- no bucket ancestry-images, eles podem ser apagados manualmente depois.

BEGIN;

UPDATE public.races
SET image_url = ''
WHERE COALESCE(image_url, '') <> '';

UPDATE public.lineages
SET image_url = ''
WHERE COALESCE(image_url, '') <> '';

COMMIT;
