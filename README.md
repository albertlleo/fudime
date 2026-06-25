# FUDIME

**Red social de recetas en vídeo.** Los creadores publican recetas cortas en formato vertical (al estilo TikTok); los usuarios las descubren en un feed, las guardan, las comparten y siguen a sus creadores favoritos.

---

## ¿Qué es FUDIME?

FUDIME es una aplicación móvil-first (pensada para usarse desde el teléfono) donde:

- Los **creadores** de contenido gastronómico suben vídeos cortos de recetas con título, descripción y etiquetas.
- Los **usuarios** consumen ese contenido en un feed vertical con scroll, como TikTok o Reels.
- Hay un sistema de **likes, guardados, compartir y comentarios** para interactuar con las recetas.
- Los usuarios pueden **seguir a creadores** y ver sus perfiles públicos.
- La app tiene **búsqueda** por nombre o por categoría (`#pasta`, `#vegano`, etc.).
- Los creadores pasan por un proceso de **validación** antes de publicar, para garantizar la calidad del contenido.

---

## Estado actual del desarrollo

### ✅ Funcionalidades completadas

#### Autenticación
- Registro con email y contraseña, con elección de rol: **consumidor** o **creador**
- Login / logout
- Protección de rutas: si no estás logueado, la app redirige al login automáticamente

#### Feed principal
- Scroll vertical con vídeos en pantalla completa (estilo TikTok)
- **Autoplay** al entrar en cada vídeo, pausa al salir
- Control de **sonido** (botón de silenciar/activar)
- Dos modos de feed:
  - **Para ti** — recetas ordenadas por fecha de publicación, con scroll infinito (carga de 10 en 10)
  - **🔥 Tendencias** — recetas ordenadas por número de likes, carga las 50 más populares
- Cambio entre modos con animación de transición

#### Interacción con recetas
- **Like** (corazón) con contador en tiempo real
- **Guardar** (marcador) para coleccionar recetas en tu perfil
- **Compartir** — abre el panel nativo del móvil o copia el enlace
- **Comentarios** — hilo de comentarios por receta, con posibilidad de borrar los tuyos

#### Subida de recetas (solo creadores)
- Drag & drop o selector de archivo de vídeo
- Subida directa a Cloudinary con **barra de progreso** en tiempo real
- Campos: título, descripción, etiquetas (tags separados por comas)
- El vídeo se guarda como **borrador** hasta que el creador decide publicarlo

#### Perfil propio
- Avatar (imagen o iniciales generadas automáticamente)
- Estadísticas: recetas publicadas, likes dados, guardados
- Listado de **mis recetas** (publicadas y borradores)
- Borradores con botón "Publicar" para hacerlos visibles
- Edición de perfil: nombre, bio, avatar, Instagram, TikTok
- Acceso a notificaciones
- Acceso al **panel de administración** (solo para el admin)

#### Perfiles públicos de creadores
- Página `/creador/[id]` con avatar, bio, redes sociales y estadísticas
- Número de recetas publicadas y seguidores
- Botón **Seguir / Dejar de seguir** con actualización optimista
- Distintivo de **creador verificado** (checkmark dorado)

#### Página de detalle de receta
- Vídeo con controles nativos
- Etiquetas clicables que llevan a la categoría
- Enlace al perfil del creador
- Acciones (like, guardar)
- Sección de comentarios

#### Búsqueda y categorías
- Búsqueda por título de receta
- Búsqueda por `#etiqueta`
- Página de **categorías** (`/buscar`) con pills de los tags más usados
- Página de **categoría individual** (`/categoria/pasta`) con todas las recetas de ese tag, ordenadas por popularidad

#### Notificaciones
- Sistema de notificaciones para: likes, comentarios y nuevos seguidores
- Badge rojo en el perfil cuando hay notificaciones sin leer
- Página `/notificaciones` con historial
- Las notificaciones se marcan como leídas al entrar

#### Panel de administración
- Acceso restringido al email configurado como admin
- Vista de estadísticas generales (usuarios, recetas publicadas, creadores pendientes)
- Lista de creadores pendientes de validación con sus redes sociales
- Botones para **validar** o **rechazar** cada creador
- Lista de creadores ya validados

---

## Stack tecnológico

| Capa | Tecnología | Por qué |
|------|-----------|---------|
| Frontend + Backend | **Next.js 16** (App Router) | Todo en un solo proyecto: páginas, lógica de servidor y API |
| Base de datos + Auth | **Supabase** (PostgreSQL) | Autenticación lista, base de datos en tiempo real, hosting gratuito |
| Almacenamiento de vídeo | **Cloudinary** | Streaming de vídeo optimizado, transformaciones automáticas |
| Estilos | **Tailwind CSS v4** | Rápido de prototipar, paleta cálida (stone/amber) |
| Hosting | **Vercel** (recomendado) | Deploy automático desde GitHub, integración nativa con Next.js |

---

## Requisitos previos

- Node.js 18 o superior
- Cuenta en [Supabase](https://supabase.com) (gratuita)
- Cuenta en [Cloudinary](https://cloudinary.com) (gratuita)

---

## Variables de entorno

Crea un fichero `.env.local` en la raíz del proyecto con los siguientes valores:

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

# Admin (email del usuario con acceso al panel de administración)
ADMIN_EMAIL=tu@email.com
```

Los valores de Supabase están en: **Dashboard → Settings → API**
Los valores de Cloudinary están en: **Dashboard → API Keys**

---

## Base de datos — Migraciones SQL

Ejecuta estos bloques en el **SQL Editor** de Supabase (**Dashboard → SQL Editor → New query**). Puedes ejecutarlos todos de una vez o por partes.

### Bloque 1 — Tablas principales

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

### Bloque 4 — Trending y categorías (mejoras de producto)

```sql
-- Contador de likes por receta (para el feed de tendencias)
alter table recipes add column if not exists likes_count integer not null default 0;

-- Rellena los contadores existentes
update recipes r set likes_count = (
  select count(*) from likes l where l.recipe_id = r.id
);

-- Trigger para mantener el contador actualizado automáticamente
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

-- Función para obtener los tags más populares (para las pills de categorías)
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

## Arrancar en local

```bash
npm install
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000). La app redirige a `/login` si no hay sesión activa.

---

## Estructura del proyecto

```
src/
├── app/
│   ├── (auth)/               # Login y registro
│   ├── (main)/               # App principal (requiere autenticación)
│   │   ├── page.tsx          # Feed principal (Para ti + Tendencias)
│   │   ├── actions.ts        # Server Actions: likes, saves, follows, paginación
│   │   ├── constants.ts      # PAGE_SIZE y otras constantes compartidas
│   │   ├── buscar/           # Búsqueda + pills de categorías
│   │   ├── categoria/[tag]/  # Página de categoría por etiqueta
│   │   ├── guardados/        # Recetas guardadas por el usuario
│   │   ├── subir/            # Subir nueva receta en vídeo
│   │   ├── perfil/           # Perfil propio + editar + notificaciones
│   │   ├── receta/[id]/      # Detalle de receta + comentarios
│   │   ├── creador/[id]/     # Perfil público de creador + follow
│   │   └── notificaciones/   # Centro de notificaciones
│   ├── admin/                # Panel de administración (acceso restringido)
│   └── globals.css
├── components/
│   ├── feed.tsx              # Feed TikTok con scroll infinito y modo trending
│   ├── recipe-grid.tsx       # Grid de recetas con autoplay al hacer scroll
│   ├── my-recipe-grid.tsx    # Grid del perfil propio con borradores
│   ├── video-uploader.tsx    # Uploader con Cloudinary + tags
│   ├── bottom-nav.tsx        # Navegación inferior con badge de notificaciones
│   └── search-input.tsx      # Input de búsqueda
├── lib/
│   ├── supabase/
│   │   ├── server.ts         # Cliente Supabase para Server Components
│   │   ├── clients.ts        # Cliente Supabase para Client Components
│   │   └── admin.ts          # Cliente con service role (para el admin panel)
│   └── types.ts              # Tipos TypeScript de toda la app
└── proxy.ts                  # Middleware de autenticación (Next.js 16)
```

---

## Scripts de mantenimiento

```bash
# Evita que el proyecto de Supabase entre en pausa por inactividad
# Ejecutar manualmente cada 5 días, o configurar como cron
bash scripts/keep-alive.sh
```

---

## Flujo de un creador (paso a paso)

1. **Registro** → elige rol "Creador" → el admin recibe solicitud de validación
2. **El admin valida** la cuenta desde `/admin` → el creador queda verificado (checkmark dorado)
3. **Sube una receta** desde `/subir` → selecciona vídeo, añade título, descripción y tags → queda como borrador
4. **Publica el borrador** desde su perfil → la receta aparece en el feed de todos los usuarios
5. Los usuarios pueden **dar like, guardar, comentar y compartir** la receta
6. El creador recibe **notificaciones** de cada interacción

## Flujo de un usuario (paso a paso)

1. **Registro** → elige rol "Consumidor"
2. **Descubre recetas** en el feed principal (Para ti) o en Tendencias
3. **Busca** por nombre o navega por categorías (`#pasta`, `#vegano`...)
4. **Interactúa**: like, comentario, guardar, compartir
5. **Sigue a creadores** desde su perfil público
6. Consulta sus **recetas guardadas** en el apartado Guardados de la navegación

---

## Próximos pasos sugeridos

- **Feed personalizado** — mostrar primero recetas de creadores que sigues
- **Onboarding** — tutorial de bienvenida la primera vez que entras
- **Versión nativa** — empaquetar con Capacitor para publicar en App Store / Google Play
- **Analíticas para creadores** — vistas, alcance y engagement por receta
