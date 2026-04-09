-- Catalogo de ubicaciones para estancias
-- Ejecutar en Supabase SQL Editor

create table if not exists public.ubicaciones (
  id bigserial primary key,
  nombre text not null,
  activa boolean not null default true,
  created_at timestamptz not null default now()
);

-- Evita duplicados por mayusculas/minusculas
create unique index if not exists idx_ubicaciones_nombre_lower
  on public.ubicaciones (lower(nombre));

-- Migra datos historicos desde estancias.ubicacion
-- Soporta valores concatenados por coma en una sola celda
insert into public.ubicaciones (nombre)
select distinct trim(value) as nombre
from public.estancias e,
     regexp_split_to_table(coalesce(e.ubicacion, ''), ',') as value
where trim(value) <> ''
on conflict ((lower(nombre))) do nothing;
