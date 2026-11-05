-- Fix: likes_count double-counting
-- The trigger trg_recipe_likes_count already handles likes_count.
-- If toggle_like also updates it manually, we get duplicates.
-- This replaces toggle_like so it only inserts/deletes from the likes table
-- and lets the trigger handle the counter.

DROP FUNCTION IF EXISTS toggle_like(uuid, uuid);

CREATE FUNCTION toggle_like(p_recipe_id uuid, p_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER AS $$
DECLARE
  v_liked boolean;
BEGIN
  IF EXISTS (
    SELECT 1 FROM likes WHERE recipe_id = p_recipe_id AND user_id = p_user_id
  ) THEN
    DELETE FROM likes WHERE recipe_id = p_recipe_id AND user_id = p_user_id;
    v_liked := false;
  ELSE
    INSERT INTO likes (recipe_id, user_id) VALUES (p_recipe_id, p_user_id);
    v_liked := true;
  END IF;
  RETURN jsonb_build_object('liked', v_liked);
END;
$$;

GRANT EXECUTE ON FUNCTION toggle_like(uuid, uuid) TO authenticated;

-- Backfill: reset all likes_count to match actual rows in likes table
UPDATE recipes r
SET likes_count = (SELECT COUNT(*) FROM likes l WHERE l.recipe_id = r.id);
