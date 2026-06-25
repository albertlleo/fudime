# FUDIME

Red social de recetas en vídeo al estilo TikTok. Los creadores publican recetas cortas en vídeo; los usuarios las descubren en un feed vertical, las guardan y siguen a sus creadores favoritos.

## Stack

- **Next.js 16** (App Router, Server Actions, proxy.ts)
- **Supabase** — autenticación y base de datos PostgreSQL
- **Cloudinary** — almacenamiento y streaming de vídeo
- **Tailwind CSS v4** — estilos con paleta cálida (stone/amber)

## Funcionalidades

- Feed vertical con autoplay y control de sonido
- Subida de vídeos con drag & drop y barra de progreso
- Etiquetas en recetas, buscador por título o `#tag`
- Like, guardar y compartir recetas
- Perfil de usuario con mis recetas, borradores y edición de perfil
- Perfiles públicos de creadores con sistema de follows
- Página de detalle de receta con vídeo y acciones

## Requisitos previos

- Node.js 18+
- Cuenta en [Supabase](https://supabase.com)
- Cuenta en [Cloudinary](https://cloudinary.com)

## Variables de entorno

Crea un fichero `.env.local` en la raíz del proyecto con:

```env
NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon-key>
SUPABASE_SERVICE_KEY=<service-role-key>

CLOUDINARY_CLOUD_NAME=<cloud-name>
CLOUDINARY_API_KEY=<api-key>
CLOUDINARY_API_SECRET=<api-secret>

NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Migraciones de base de datos

Ejecuta estos dos bloques en el **SQL Editor** de Supabase antes de arrancar:

```sql
-- Tags en recetas
alter table recipes add column if not exists tags text[] not null default '{}';

-- Tabla de follows
create table if not exists follows (
  id uuid default gen_random_uuid() primary key,
  follower_id uuid not null references public.users(id) on delete cascade,
  following_id uuid not null references public.users(id) on delete cascade,
  created_at timestamptz default now(),
  unique(follower_id, following_id)
);
alter table follows enable row level security;
create policy "Follows visibles por todos" on follows for select using (true);
create policy "Usuarios pueden seguir" on follows for insert with check (auth.uid() = follower_id);
create policy "Usuarios pueden dejar de seguir" on follows for delete using (auth.uid() = follower_id);
```

## Arrancar en local

```bash
npm install
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000). La app redirige a `/login` si no hay sesión activa.

## Scripts de mantenimiento

```bash
# Evita que el proyecto de Supabase entre en pausa por inactividad (ejecutar cada 5 días)
bash scripts/keep-alive.sh
```

O configura el cron automático que hay en `scripts/keep-alive.sh`.

## Estructura del proyecto

```
src/
├── app/
│   ├── (auth)/          # Login y registro
│   ├── (main)/          # App principal (requiere auth)
│   │   ├── page.tsx     # Feed
│   │   ├── buscar/      # Búsqueda por título o #tag
│   │   ├── guardados/   # Recetas guardadas
│   │   ├── subir/       # Subir receta en vídeo
│   │   ├── perfil/      # Perfil propio + editar
│   │   ├── receta/[id]/ # Detalle de receta
│   │   └── creador/[id]/ # Perfil público de creador
│   └── globals.css
├── components/          # Feed, grids, uploader, nav...
├── lib/
│   ├── supabase/        # Clientes browser y server
│   └── types.ts
└── proxy.ts             # Middleware de auth (Next.js 16)
```
