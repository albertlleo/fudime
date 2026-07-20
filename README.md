# FUDIME

**Red social de recetas en vídeo.** Los creadores publican recetas cortas en formato vertical (9:16); los usuarios las descubren en un feed, las guardan y siguen a sus creadores favoritos.

---

## ¿Qué es FUDIME?

Una app mobile-first donde:

- Los **creadores** verificados suben vídeos de recetas con título, descripción, categoría, dieta y tiempo de cocinado.
- Los **usuarios** consumen ese contenido en un feed vertical con scroll (estilo TikTok/Reels).
- Hay un sistema completo de **likes, guardados, comentarios, compartir y follows**.
- Los creadores pasan por un proceso de **validación** antes de poder publicar.
- En escritorio la app muestra una barra lateral fija al estilo Instagram.

---

## Funcionalidades

### Autenticación
- Registro con email y contraseña, eligiendo rol: **consumidor** o **creador**
- Login / logout
- Rutas protegidas — redirige a `/login` si no hay sesión

### Feed principal
- Scroll vertical full-screen con autoplay/pausa por intersección
- Fondo con thumbnail desenfocado para evitar bordes negros durante la carga
- Doble tap para dar like con animación de corazón
- Control de sonido (botón silenciar/activar)
- Dos modos:
  - **Para ti** — paginación infinita (carga 10 en 10 al llegar al final)
  - **🔥 Tendencias** — ordenado por número de likes
- Panel de ingredientes y paso a paso deslizable desde abajo

### Subida de recetas (solo creadores)
- Selección de vídeo desde la **galería** con **preview local** antes de subir
- Confirmación antes de iniciar la subida (para verificar que es el vídeo correcto)
- Barra de progreso en tiempo real durante la subida a Cloudinary
- **Herramienta de recorte de portada**: ajuste de posición (arriba/abajo) y zoom con drag táctil o botones, exporta el recorte exacto en 3:4 (1080×1440px) antes de subir
- Portada generada automáticamente del vídeo si no se sube ninguna
- Campos obligatorios: título, ingredientes/paso a paso, categoría, dieta, tiempo de cocinado
- Categorías, dietas y tiempos en **cuadrícula 2 columnas con emojis**, estilo outline/ámbar al seleccionar
- El vídeo se guarda como **borrador** hasta que el creador lo publica

### Página de receta
- Vídeo 9:16 con `object-cover` y fondo desenfocado (sin barras negras)
- Tags clicables → página de categoría
- Card del creador con badge verificado
- Like, guardar, comentarios

### Búsqueda y categorías (`/chefs`)
- Búsqueda por título de receta o nombre de creador
- Filtros de **dieta** (vegana, sin gluten…) en grid 2 columnas con emojis
- Filtros de **tiempo de cocinado** en grid 2 columnas con emojis
- Listado de **categorías** con emojis, en grid 2 columnas
- Pestaña de **Chefs** con creadores en seguimiento y descubrimiento
- Resultados de búsqueda en grid 3 columnas 3:4

### Página de categoría (`/categoria/[tag]`)
- Header con emoji y nombre de la categoría
- Grid 3 columnas de recetas ordenadas por popularidad

### Perfiles de creadores (`/creador/[id]`)
- Avatar, bio, redes sociales, estadísticas
- Badge de **verificado** (sello ámbar estilo Twitter/X con check blanco)
- Botón Seguir / Dejar de seguir
- Feed completo del creador con scroll vertical (mismo estilo que el feed principal)

### Perfil propio (`/perfil`)
- Avatar, bio, estadísticas
- Grid 3 columnas de mis recetas — tap para abrir la receta publicada
- Borradores con botón "Publicar"
- Botón eliminar con confirmación
- Edición de perfil: nombre, bio, avatar, Instagram, TikTok

### Guardados (`/guardados`)
- **Pestaña Todas**: grid 3 columnas de todas las recetas guardadas
- **Pestaña Categoría**: cuadrícula de tarjetas por categoría con portada (thumbnail de la última receta guardada) → abre `/guardados/categoria/[tag]`
- **Pestaña Creador**: lista de chefs con avatar circular y badge verificado → abre `/guardados/creador/[id]`
- Buscador para filtrar por título o nombre de creador

### Notificaciones
- Se generan al recibir: **like**, **comentario** y nuevo **seguidor**
- No se generan si la acción es sobre tu propia receta/perfil
- Badge rojo en el icono de perfil cuando hay notificaciones sin leer
- Página `/notificaciones` con avatar del actor, texto descriptivo, thumbnail y tiempo relativo
- Se marcan como leídas automáticamente al entrar

### Diseño responsive
- **Móvil**: navegación inferior con 5 pestañas
- **Escritorio** (`lg:`): barra lateral fija de 72px (estilo Instagram) + columna de contenido centrada de 500px

### Panel de administración (`/admin`)
- Acceso restringido por email (`ADMIN_EMAIL`)
- Estadísticas generales: usuarios, recetas publicadas, creadores pendientes
- Validar o rechazar creadores pendientes
- Lista de creadores ya verificados

---

## Stack

| Capa | Tecnología |
|------|-----------|
| Frontend + Backend | **Next.js 16** App Router (Server + Client Components, Server Actions) |
| Base de datos + Auth | **Supabase** (PostgreSQL + RLS) |
| Almacenamiento de vídeo e imágenes | **Cloudinary** (streaming, transformaciones automáticas) |
| Estilos | **Tailwind CSS v4** — paleta cálida (cream/amber/brown) |
| Hosting | **Vercel** — deploy automático desde GitHub |

---

## Requisitos previos

- Node.js 18+
- Cuenta en [Supabase](https://supabase.com) (gratuita)
- Cuenta en [Cloudinary](https://cloudinary.com) (gratuita)

---

## Variables de entorno

Crea `.env.local` en la raíz:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon-key>
SUPABASE_SERVICE_KEY=<service-role-key>

# Cloudinary
CLOUDINARY_CLOUD_NAME=<cloud-name>
CLOUDINARY_API_KEY=<api-key>
CLOUDINARY_API_SECRET=<api-secret>

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Admin
ADMIN_EMAIL=tu@email.com
```

- Valores de Supabase: **Dashboard → Settings → API**
- Valores de Cloudinary: **Dashboard → API Keys**

---

## Arrancar en local

```bash
npm install
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000).

---

## Base de datos — Migraciones SQL

Ejecuta en el **SQL Editor** de Supabase (**Dashboard → SQL Editor → New query**):

### Bloque 1 — Tablas principales

```sql
alter table recipes add column if not exists tags text[] not null default '{}';

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

### Bloque 2 — Comentarios

```sql
create table if not exists comments (
  id uuid default gen_random_uuid() primary key,
  recipe_id uuid not null references public.recipes(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  content text not null,
  created_at timestamptz default now()
);
alter table comments enable row level security;
create policy "Comentarios visibles por todos" on comments for select using (true);
create policy "Usuarios pueden comentar" on comments for insert with check (auth.uid() = user_id);
create policy "Usuarios pueden borrar sus comentarios" on comments for delete using (auth.uid() = user_id);
```

### Bloque 3 — Notificaciones

```sql
create table if not exists notifications (
  id uuid default gen_random_uuid() primary key,
  user_id uuid not null references public.users(id) on delete cascade,
  type text not null check (type in ('like', 'follow', 'comment')),
  actor_id uuid references public.users(id) on delete set null,
  recipe_id uuid references public.recipes(id) on delete set null,
  read boolean not null default false,
  created_at timestamptz default now()
);
alter table notifications enable row level security;
create policy "Usuarios ven sus notificaciones" on notifications for select using (auth.uid() = user_id);
create policy "Sistema puede crear notificaciones" on notifications for insert with check (true);
create policy "Usuarios marcan sus notificaciones" on notifications for update using (auth.uid() = user_id);
```

### Bloque 4 — Contador de likes y tags populares

```sql
alter table recipes add column if not exists likes_count integer not null default 0;

update recipes r set likes_count = (
  select count(*) from likes l where l.recipe_id = r.id
);

create or replace function sync_recipe_likes_count()
returns trigger language plpgsql as $$
begin
  if TG_OP = 'INSERT' then
    update recipes set likes_count = likes_count + 1 where id = NEW.recipe_id;
  elsif TG_OP = 'DELETE' then
    update recipes set likes_count = greatest(likes_count - 1, 0) where id = OLD.recipe_id;
  end if;
  return null;
end;
$$;

drop trigger if exists trg_recipe_likes_count on likes;
create trigger trg_recipe_likes_count
after insert or delete on likes
for each row execute function sync_recipe_likes_count();

create or replace function get_popular_tags(p_limit int default 10)
returns table (tag text, cnt bigint)
language sql stable security definer as $$
  select lower(unnest(tags)) as tag, count(*) as cnt
  from recipes
  where status = 'published' and tags is not null and array_length(tags, 1) > 0
  group by tag
  order by cnt desc
  limit p_limit;
$$;

grant execute on function get_popular_tags(int) to anon, authenticated;
```

---

## Estructura del proyecto

```
src/
├── app/
│   ├── (auth)/                    # Login y registro
│   ├── (main)/                    # App principal (requiere autenticación)
│   │   ├── layout.tsx             # Layout responsive: sidebar desktop + bottom nav móvil
│   │   ├── page.tsx               # Feed principal (Para ti + Tendencias)
│   │   ├── actions.ts             # Server Actions: likes, saves, follows, paginación
│   │   ├── chefs/                 # Búsqueda, filtros, categorías y descubrir chefs
│   │   ├── categoria/[tag]/       # Recetas por categoría con emoji
│   │   ├── creador/[id]/          # Perfil público + feed vertical del creador
│   │   ├── guardados/             # Recetas guardadas (todas / por categoría / por creador)
│   │   │   ├── categoria/[tag]/   # Detalle de categoría guardada
│   │   │   └── creador/[id]/      # Detalle de creador guardado
│   │   ├── subir/                 # Subir receta (solo creadores)
│   │   ├── perfil/                # Perfil propio + editar + seguidores/siguiendo
│   │   ├── receta/[id]/           # Detalle de receta + comentarios
│   │   └── notificaciones/        # Centro de notificaciones
│   ├── admin/                     # Panel de administración (acceso restringido)
│   └── globals.css                # Variables CSS (--cream, --amber, --brown-*)
├── components/
│   ├── feed.tsx                   # Feed TikTok con scroll infinito
│   ├── creator-feed.tsx           # Feed vertical del perfil de un creador
│   ├── recipe-grid.tsx            # Grid 3 col / 3:4 de recetas
│   ├── my-recipe-grid.tsx         # Grid del perfil propio con borradores
│   ├── video-uploader.tsx         # Uploader: preview, crop portada, selector con iconos
│   ├── verified-badge.tsx         # Sello ámbar verificado (SVG 12 puntas)
│   ├── bottom-nav.tsx             # Nav inferior móvil + sidebar desktop
│   ├── back-button.tsx            # Botón volver con fallback
│   ├── onboarding.tsx             # Pantalla de bienvenida (primera vez)
│   └── install-prompt.tsx         # Banner "Añadir a pantalla de inicio" (PWA)
├── lib/
│   ├── supabase/
│   │   ├── server.ts              # Cliente para Server Components
│   │   ├── clients.ts             # Cliente para Client Components
│   │   └── admin.ts               # Cliente con service role (admin)
│   └── types.ts                   # Tipos TypeScript de toda la app
└── proxy.ts                       # Middleware de autenticación
```

---

## Flujo de un creador

1. **Registro** → elige rol "Creador"
2. **El admin valida** la cuenta desde `/admin` → aparece el sello verificado ✓
3. **Sube una receta** desde `/subir`:
   - Selecciona vídeo → previsualiza → confirma subida
   - Sube o ajusta la portada (crop 3:4)
   - Rellena título, ingredientes, categoría, dieta y tiempo (todos obligatorios)
   - Guarda como borrador o publica directamente
4. **Publica borradores** desde su perfil
5. Recibe **notificaciones** de likes, comentarios y nuevos seguidores

## Flujo de un usuario

1. **Registro** → elige rol "Consumidor"
2. **Descubre recetas** en el feed (Para ti / Tendencias)
3. **Busca** por título, filtra por categoría, dieta o tiempo
4. **Interactúa**: like, comentario, guardar, compartir
5. **Sigue creadores** y ve sus recetas agrupadas
6. Consulta **Guardados** organizados por categoría o por creador

---

## Scripts de mantenimiento

```bash
# Evita que el proyecto Supabase entre en pausa por inactividad
bash scripts/keep-alive.sh

# Elimina todas las recetas y vídeos de Cloudinary (útil para limpiar datos de prueba)
node scripts/clean-recipes.mjs
```
