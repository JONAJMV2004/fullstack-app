-- =============================================================================
-- Cielito Home — Esquema de referencia
-- Refleja la base de datos real en producción (Supabase / PostgreSQL)
-- Última actualización: 2026-04-14
-- Ejecutar en: Supabase Dashboard → SQL Editor
-- =============================================================================

-- -----------------------------------------------------------------------------
-- EXTENSIONES
-- -----------------------------------------------------------------------------
create extension if not exists "uuid-ossp";

-- -----------------------------------------------------------------------------
-- TABLA: usuarios
-- -----------------------------------------------------------------------------
create table if not exists public.usuarios (
  id               uuid primary key default uuid_generate_v4(),
  nombre           text not null,
  email            text not null unique,
  telefono         text,
  password_hash    text,                        -- null para cuentas OAuth
  tipo_usuario     text not null default 'cliente' check (tipo_usuario in ('cliente', 'admin')),
  provider         text not null default 'local' check (provider in ('local', 'google', 'facebook')),
  avatar_url       text,
  supabase_auth_id uuid,
  fecha_registro   timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create index if not exists idx_usuarios_email on public.usuarios (email);

-- -----------------------------------------------------------------------------
-- TABLA: estancias
-- -----------------------------------------------------------------------------
create table if not exists public.estancias (
  id              bigserial primary key,
  usuario_id      uuid not null references public.usuarios (id) on delete cascade,
  fecha_check_in  date not null,
  fecha_check_out date not null,
  puntos_ganados  integer not null default 0,
  estado          text not null default 'pendiente' check (estado in ('pendiente', 'confirmada', 'rechazada')),
  ubicacion       text,
  created_at      timestamptz not null default now(),
  constraint chk_estancia_fechas check (fecha_check_out > fecha_check_in)
);

create index if not exists idx_estancias_usuario on public.estancias (usuario_id);

-- -----------------------------------------------------------------------------
-- TABLA: puntos  (libro mayor — saldo actual = SUM(puntos) por usuario)
-- -----------------------------------------------------------------------------
create table if not exists public.puntos (
  id          bigserial primary key,
  usuario_id  uuid not null references public.usuarios (id) on delete cascade,
  descripcion text not null,
  puntos      integer not null,               -- positivo = ganados, negativo = canjeados
  fecha       timestamptz not null default now()
);

create index if not exists idx_puntos_usuario on public.puntos (usuario_id);

-- -----------------------------------------------------------------------------
-- TABLA: premios
-- -----------------------------------------------------------------------------
create table if not exists public.premios (
  id                bigserial primary key,
  nombre            text not null,
  puntos_necesarios integer not null check (puntos_necesarios > 0),
  disponibilidad    integer not null default 0 check (disponibilidad >= 0),
  categoria         text,
  imagen_url        text,
  created_at        timestamptz not null default now()
);

-- -----------------------------------------------------------------------------
-- TABLA: canjes
-- -----------------------------------------------------------------------------
create table if not exists public.canjes (
  id                bigserial primary key,
  usuario_id        uuid not null references public.usuarios (id) on delete cascade,
  premio_id         bigint not null references public.premios (id),
  puntos_utilizados integer not null,
  codigo_unico      text not null unique,
  estado            text not null default 'pendiente' check (estado in ('pendiente', 'redimido', 'cancelado')),
  fecha             timestamptz not null default now()
);

create index if not exists idx_canjes_usuario on public.canjes (usuario_id);
create index if not exists idx_canjes_codigo  on public.canjes (codigo_unico);

-- -----------------------------------------------------------------------------
-- TABLA: codigos  (códigos de estadía para canjear puntos)
-- -----------------------------------------------------------------------------
create table if not exists public.codigos (
  id            bigserial primary key,
  codigo        text not null unique,
  ubicacion     text not null,
  fecha_ingreso date not null,
  fecha_salida  date not null,
  noches        integer not null check (noches > 0),
  puntos        integer not null check (puntos >= 0),
  estatus       text not null default 'disponible' check (estatus in ('disponible', 'canjeado')),
  usuario_id    uuid references public.usuarios (id) on delete set null,
  created_at    timestamptz not null default now()
);

create index if not exists idx_codigos_codigo   on public.codigos (codigo);
create index if not exists idx_codigos_usuario  on public.codigos (usuario_id);

-- -----------------------------------------------------------------------------
-- TABLA: ubicaciones  (catálogo de propiedades disponibles)
-- -----------------------------------------------------------------------------
create table if not exists public.ubicaciones (
  id         bigserial primary key,
  nombre     text not null,
  activa     boolean not null default true,
  created_at timestamptz not null default now()
);

create unique index if not exists idx_ubicaciones_nombre_lower
  on public.ubicaciones (lower(nombre));

-- -----------------------------------------------------------------------------
-- TABLA: notificaciones
-- -----------------------------------------------------------------------------
create table if not exists public.notificaciones (
  id          bigserial primary key,
  usuario_id  bigint not null references public.usuarios (id) on delete cascade,
  tipo        text not null default 'general' check (tipo in ('puntos','canje','estancia','promo','sistema','general')),
  titulo      text not null,
  mensaje     text,
  leida       boolean not null default false,
  created_at  timestamptz not null default now()
);

create index if not exists idx_notificaciones_usuario
  on public.notificaciones (usuario_id, leida, created_at desc);

-- -----------------------------------------------------------------------------
-- TRIGGER: updated_at automático en usuarios
-- -----------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_usuarios_updated_at on public.usuarios;
create trigger trg_usuarios_updated_at
  before update on public.usuarios
  for each row execute procedure public.set_updated_at();

