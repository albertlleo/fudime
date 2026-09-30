-- FUDIME: Creator Ranking Function
-- Run in Supabase Dashboard → SQL Editor

create or replace function get_creator_ranking(p_limit int default 30)
returns table (
  creator_id uuid,
  display_name text,
  avatar_url text,
  validated_at timestamptz,
  recipe_count bigint,
  total_likes bigint,
  total_saves bigint,
  score bigint
)
language sql stable security definer as $$
  select
    u.id as creator_id,
    u.display_name,
    u.avatar_url,
    u.validated_at,
    count(distinct r.id)::bigint as recipe_count,
    coalesce(sum(r.likes_count), 0)::bigint as total_likes,
    coalesce((
      select count(*)::bigint
      from saves s
      join recipes r2 on s.recipe_id = r2.id
      where r2.creator_id = u.id and r2.status = 'published'
    ), 0)::bigint as total_saves,
    (
      coalesce(sum(r.likes_count), 0) +
      coalesce((
        select count(*)::bigint
        from saves s
        join recipes r2 on s.recipe_id = r2.id
        where r2.creator_id = u.id and r2.status = 'published'
      ), 0)
    )::bigint as score
  from users u
  left join recipes r on r.creator_id = u.id and r.status = 'published'
  where u.role = 'creator'
  group by u.id, u.display_name, u.avatar_url, u.validated_at
  order by score desc, recipe_count desc
  limit p_limit;
$$;

grant execute on function get_creator_ranking(int) to anon, authenticated;
