-- FUDIME: Creator Ranking Function (v2)
-- Run via scripts/migrations_v2.sql (includes columns + this function)
-- Kept here as standalone reference

DROP FUNCTION IF EXISTS get_creator_ranking(int);

CREATE FUNCTION get_creator_ranking(p_limit int DEFAULT 30)
RETURNS TABLE (
  creator_id uuid,
  display_name text,
  avatar_url text,
  validated_at timestamptz,
  recipe_count bigint,
  total_likes bigint,
  total_saves bigint,
  total_views bigint,
  score numeric
)
LANGUAGE sql STABLE SECURITY DEFINER AS $$
  WITH cs AS (
    SELECT
      u.id,
      u.display_name,
      u.avatar_url,
      u.validated_at,
      count(DISTINCT r.id)::bigint AS recipe_count,
      coalesce(sum(r.likes_count), 0)::bigint AS total_likes,
      coalesce(sum(r.views_count), 0)::bigint AS total_views
    FROM users u
    LEFT JOIN recipes r ON r.creator_id = u.id AND r.status = 'published'
    WHERE u.role = 'creator'
    GROUP BY u.id, u.display_name, u.avatar_url, u.validated_at
  ),
  sv AS (
    SELECT r.creator_id, count(*)::bigint AS total_saves
    FROM saves s
    JOIN recipes r ON s.recipe_id = r.id AND r.status = 'published'
    GROUP BY r.creator_id
  )
  SELECT
    cs.id AS creator_id,
    cs.display_name,
    cs.avatar_url,
    cs.validated_at,
    cs.recipe_count,
    cs.total_likes,
    coalesce(sv.total_saves, 0)::bigint AS total_saves,
    cs.total_views,
    CASE
      WHEN cs.total_views = 0 THEN 0
      ELSE round(
        (cs.total_likes + 2 * coalesce(sv.total_saves, 0))::numeric / cs.total_views * 1000,
        1
      )
    END AS score
  FROM cs
  LEFT JOIN sv ON sv.creator_id = cs.id
  ORDER BY score DESC, recipe_count DESC
  LIMIT p_limit;
$$;

GRANT EXECUTE ON FUNCTION get_creator_ranking(int) TO anon, authenticated;
