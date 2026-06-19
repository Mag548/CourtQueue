-- Deactivate courts not present in the latest Oakville ArcGIS sync (SECURITY DEFINER).
CREATE OR REPLACE FUNCTION public.deactivate_courts_except(p_keep_ids uuid[])
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count integer;
BEGIN
  UPDATE public.courts
  SET is_active = false
  WHERE is_active = true
    AND NOT (id = ANY(COALESCE(p_keep_ids, ARRAY[]::uuid[])));

  GET DIAGNOSTICS v_count = ROW_COUNT;

  UPDATE public.queues q
  SET is_active = false
  FROM public.courts c
  WHERE q.court_id = c.id
    AND c.is_active = false
    AND q.is_active = true;

  RETURN v_count;
END;
$$;

REVOKE ALL ON FUNCTION public.deactivate_courts_except(uuid[]) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.deactivate_courts_except(uuid[]) TO anon, authenticated, service_role;
