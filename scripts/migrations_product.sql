-- FUDIME Product Improvements: SQL Migrations
-- Run in Supabase Dashboard → SQL Editor

-- ============================================================
-- 1. likes_count column on recipes (for Trending feed)
-- ============================================================

alter table recipes
  add column if not exists likes_count integer not null default 0;

-- Back-fill existing counts
update recipes r
set likes_count = (
  select count(*) from likes l where l.recipe_id = r.id
);

-- Trigger function to keep likes_count in sync
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

-- Drop if exists then re-create
drop trigger if exists trg_recipe_likes_count on likes;

create trigger trg_recipe_likes_count
after insert or delete on likes
for each row execute function sync_recipe_likes_count();


-- ============================================================
-- 2. get_popular_tags() function (for category pills in Buscar)
-- ============================================================

create or replace function get_popular_tags(p_limit int default 10)
returns table (tag text, cnt bigint)
language sql stable security definer as $$
  select
    lower(unnest(tags)) as tag,
    count(*) as cnt
  from recipes
  where status = 'published'
    and tags is not null
    and array_length(tags, 1) > 0
  group by tag
  order by cnt desc
  limit p_limit;
$$;

-- Grant execute to authenticated and anon roles
grant execute on function get_popular_tags(int) to anon, authenticated;
