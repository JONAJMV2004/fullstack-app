-- Tabla de notificaciones en tiempo real
create table if not exists public.notificaciones (
  id          bigserial primary key,
  usuario_id  bigint not null references public.usuarios(id) on delete cascade,
  tipo        text not null default 'general'
              check (tipo in ('puntos','canje','estancia','promo','sistema','general')),
  titulo      text not null,
  mensaje     text,
  leida       boolean not null default false,
  created_at  timestamptz not null default now()
);

-- Índice para consultas por usuario (no leídas primero, más recientes primero)
create index if not exists idx_notificaciones_usuario
  on public.notificaciones (usuario_id, leida, created_at desc);
