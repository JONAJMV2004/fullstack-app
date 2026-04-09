-- Create a public Storage bucket for premio images and ensure the premios table stores the URL.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'premios',
  'premios',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif']::text[]
)
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

alter table if exists public.premios
  add column if not exists imagen_url text;

alter table if exists public.premios
  add column if not exists categoria text;
