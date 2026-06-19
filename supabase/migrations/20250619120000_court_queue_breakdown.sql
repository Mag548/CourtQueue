-- Court breakdown from ArcGIS + single/dual queue per park.

DROP FUNCTION IF EXISTS public.upsert_court_location(
  uuid, text, text, double precision, double precision, text, integer, text[]
);

ALTER TABLE public.courts
  ADD COLUMN IF NOT EXISTS queue_mode text NOT NULL DEFAULT 'single',
  ADD COLUMN IF NOT EXISTS court_breakdown jsonb NOT NULL DEFAULT '{"tennis":0,"pickleball_dedicated":0,"pickleball_lined":0}'::jsonb;

ALTER TABLE public.queues
  ADD COLUMN IF NOT EXISTS sport_scope text NOT NULL DEFAULT 'shared',
  ADD COLUMN IF NOT EXISTS capacity integer;

ALTER TABLE public.court_sessions
  ADD COLUMN IF NOT EXISTS queue_id uuid REFERENCES public.queues(id) ON DELETE SET NULL;

ALTER TABLE public.queues DROP CONSTRAINT IF EXISTS queues_court_id_key;
ALTER TABLE public.queues
  ADD CONSTRAINT queues_court_id_sport_scope_key UNIQUE (court_id, sport_scope);

UPDATE public.queues q
SET
  sport_scope = 'shared',
  capacity = COALESCE(q.capacity, c.num_courts)
FROM public.courts c
WHERE c.id = q.court_id
  AND q.capacity IS NULL;

UPDATE public.court_sessions cs
SET queue_id = q.id
FROM public.queue_entries qe
JOIN public.queues q ON q.id = qe.queue_id
WHERE cs.queue_entry_id = qe.id
  AND cs.queue_id IS NULL;

DROP FUNCTION IF EXISTS public.sync_court_timers(uuid);
DROP FUNCTION IF EXISTS public.promote_waiting_player(uuid);

CREATE OR REPLACE FUNCTION public.sync_court_queues(
  p_court_id uuid,
  p_queue_mode text,
  p_breakdown jsonb,
  p_shared_capacity integer,
  p_tennis_capacity integer,
  p_pickleball_capacity integer
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF p_queue_mode = 'dual' THEN
    INSERT INTO public.queues (court_id, is_active, sport_scope, capacity)
    VALUES (p_court_id, true, 'tennis', GREATEST(1, COALESCE(p_tennis_capacity, 1)))
    ON CONFLICT (court_id, sport_scope)
    DO UPDATE SET is_active = true, capacity = GREATEST(1, COALESCE(p_tennis_capacity, 1));

    INSERT INTO public.queues (court_id, is_active, sport_scope, capacity)
    VALUES (p_court_id, true, 'pickleball', GREATEST(1, COALESCE(p_pickleball_capacity, 1)))
    ON CONFLICT (court_id, sport_scope)
    DO UPDATE SET is_active = true, capacity = GREATEST(1, COALESCE(p_pickleball_capacity, 1));

    UPDATE public.queues
    SET is_active = false
    WHERE court_id = p_court_id
      AND sport_scope = 'shared';
  ELSE
    INSERT INTO public.queues (court_id, is_active, sport_scope, capacity)
    VALUES (
      p_court_id,
      true,
      'shared',
      GREATEST(1, COALESCE(p_shared_capacity, 1))
    )
    ON CONFLICT (court_id, sport_scope)
    DO UPDATE SET is_active = true, capacity = GREATEST(1, COALESCE(p_shared_capacity, 1));

    UPDATE public.queues
    SET is_active = false
    WHERE court_id = p_court_id
      AND sport_scope IN ('tennis', 'pickleball');
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.upsert_court_location(
  p_id uuid DEFAULT NULL,
  p_name text DEFAULT NULL,
  p_address text DEFAULT NULL,
  p_latitude double precision DEFAULT NULL,
  p_longitude double precision DEFAULT NULL,
  p_court_type text DEFAULT 'tennis',
  p_num_courts integer DEFAULT 2,
  p_amenities text[] DEFAULT ARRAY['Tennis', 'Outdoor', 'Free'],
  p_queue_mode text DEFAULT 'single',
  p_court_breakdown jsonb DEFAULT '{"tennis":0,"pickleball_dedicated":0,"pickleball_lined":0}'::jsonb,
  p_shared_capacity integer DEFAULT NULL,
  p_tennis_capacity integer DEFAULT NULL,
  p_pickleball_capacity integer DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_court_id uuid;
  v_breakdown jsonb;
BEGIN
  IF p_name IS NULL OR btrim(p_name) = '' THEN
    RAISE EXCEPTION 'Court name is required';
  END IF;

  v_breakdown := COALESCE(
    p_court_breakdown,
    '{"tennis":0,"pickleball_dedicated":0,"pickleball_lined":0}'::jsonb
  );

  v_court_id := p_id;

  IF v_court_id IS NULL THEN
    SELECT c.id INTO v_court_id
    FROM public.courts c
    WHERE lower(btrim(c.name)) = lower(btrim(p_name))
    LIMIT 1;
  END IF;

  IF v_court_id IS NULL THEN
    INSERT INTO public.courts (
      name, address, latitude, longitude, court_type, num_courts, amenities,
      is_active, queue_mode, court_breakdown
    )
    VALUES (
      btrim(p_name),
      p_address,
      p_latitude,
      p_longitude,
      p_court_type,
      GREATEST(1, COALESCE(p_num_courts, 2)),
      COALESCE(p_amenities, ARRAY['Tennis', 'Outdoor', 'Free']),
      true,
      COALESCE(NULLIF(p_queue_mode, ''), 'single'),
      v_breakdown
    )
    RETURNING id INTO v_court_id;
  ELSE
    UPDATE public.courts
    SET
      name = btrim(p_name),
      address = COALESCE(p_address, address),
      latitude = COALESCE(p_latitude, latitude),
      longitude = COALESCE(p_longitude, longitude),
      court_type = COALESCE(p_court_type, court_type),
      num_courts = GREATEST(1, COALESCE(p_num_courts, num_courts)),
      amenities = COALESCE(p_amenities, amenities),
      is_active = true,
      queue_mode = COALESCE(NULLIF(p_queue_mode, ''), queue_mode, 'single'),
      court_breakdown = v_breakdown
    WHERE id = v_court_id;
  END IF;

  PERFORM public.sync_court_queues(
    v_court_id,
    COALESCE(NULLIF(p_queue_mode, ''), 'single'),
    v_breakdown,
    p_shared_capacity,
    p_tennis_capacity,
    p_pickleball_capacity
  );

  RETURN v_court_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.sync_court_timers(p_queue_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_waiting int;
BEGIN
  SELECT COUNT(*) INTO v_waiting
  FROM public.queue_entries
  WHERE queue_id = p_queue_id
    AND status = 'waiting';

  IF v_waiting = 0 THEN
    UPDATE public.court_sessions
    SET expires_at = NULL
    WHERE queue_id = p_queue_id
      AND status = 'active'
      AND expires_at IS NOT NULL;
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.process_after_queue_join(p_entry_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_entry public.queue_entries%ROWTYPE;
  v_court_id uuid;
  v_queue_id uuid;
  v_num_courts int;
  v_next_court int;
  v_oldest_open uuid;
  v_active_count int;
  v_position int;
BEGIN
  SELECT * INTO v_entry FROM public.queue_entries WHERE id = p_entry_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Queue entry not found';
  END IF;

  SELECT q.court_id, q.id, COALESCE(q.capacity, c.num_courts)
  INTO v_court_id, v_queue_id, v_num_courts
  FROM public.queues q
  JOIN public.courts c ON c.id = q.court_id
  WHERE q.id = v_entry.queue_id;

  SELECT COUNT(*) INTO v_active_count
  FROM public.court_sessions
  WHERE queue_id = v_queue_id
    AND status = 'active'
    AND (expires_at IS NULL OR expires_at > now());

  IF v_active_count < v_num_courts THEN
    SELECT n INTO v_next_court
    FROM generate_series(1, v_num_courts) AS n
    WHERE NOT EXISTS (
      SELECT 1 FROM public.court_sessions cs
      WHERE cs.queue_id = v_queue_id
        AND cs.court_number = n
        AND cs.status = 'active'
        AND (cs.expires_at IS NULL OR cs.expires_at > now())
    )
    ORDER BY n
    LIMIT 1;

    IF v_next_court IS NOT NULL THEN
      INSERT INTO public.court_sessions (
        court_id, queue_id, queue_entry_id, user_id, court_number, expires_at, status, started_at
      ) VALUES (
        v_court_id, v_queue_id, p_entry_id, v_entry.user_id, v_next_court, NULL, 'active', now()
      );

      UPDATE public.queue_entries
      SET status = 'playing',
          assigned_court_number = v_next_court,
          started_playing_at = now(),
          position = 0
      WHERE id = p_entry_id;

      PERFORM public.sync_court_timers(v_queue_id);

      RETURN jsonb_build_object(
        'assigned', true,
        'court_number', v_next_court,
        'waiting', false
      );
    END IF;
  END IF;

  SELECT id INTO v_oldest_open
  FROM public.court_sessions
  WHERE queue_id = v_queue_id
    AND status = 'active'
    AND expires_at IS NULL
  ORDER BY COALESCE(started_at, created_at) ASC
  LIMIT 1
  FOR UPDATE;

  IF v_oldest_open IS NOT NULL THEN
    UPDATE public.court_sessions
    SET expires_at = now() + interval '30 minutes',
        started_at = COALESCE(started_at, now())
    WHERE id = v_oldest_open;
  END IF;

  SELECT COUNT(*) INTO v_position
  FROM public.queue_entries
  WHERE queue_id = v_entry.queue_id
    AND status = 'waiting';

  UPDATE public.queue_entries
  SET position = v_position,
      status = 'waiting'
  WHERE id = p_entry_id;

  PERFORM public.sync_court_timers(v_queue_id);

  RETURN jsonb_build_object(
    'assigned', false,
    'court_number', null,
    'waiting', true,
    'position', v_position
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.promote_waiting_player(p_queue_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_court_id uuid;
  v_num_courts int;
  v_entry_id uuid;
  v_user_id uuid;
  v_next_court int;
  v_active_count int;
BEGIN
  SELECT q.court_id, COALESCE(q.capacity, c.num_courts)
  INTO v_court_id, v_num_courts
  FROM public.queues q
  JOIN public.courts c ON c.id = q.court_id
  WHERE q.id = p_queue_id
    AND q.is_active = true;

  IF v_court_id IS NULL THEN
    RETURN jsonb_build_object('promoted', false);
  END IF;

  SELECT COUNT(*) INTO v_active_count
  FROM public.court_sessions
  WHERE queue_id = p_queue_id
    AND status = 'active'
    AND (expires_at IS NULL OR expires_at > now());

  IF v_active_count >= v_num_courts THEN
    RETURN jsonb_build_object('promoted', false);
  END IF;

  SELECT id, user_id INTO v_entry_id, v_user_id
  FROM public.queue_entries
  WHERE queue_id = p_queue_id
    AND status = 'waiting'
  ORDER BY position ASC, joined_at ASC
  LIMIT 1
  FOR UPDATE SKIP LOCKED;

  IF v_entry_id IS NULL THEN
    PERFORM public.sync_court_timers(p_queue_id);
    RETURN jsonb_build_object('promoted', false);
  END IF;

  SELECT n INTO v_next_court
  FROM generate_series(1, v_num_courts) AS n
  WHERE NOT EXISTS (
    SELECT 1 FROM public.court_sessions cs
    WHERE cs.queue_id = p_queue_id
      AND cs.court_number = n
      AND cs.status = 'active'
      AND (cs.expires_at IS NULL OR cs.expires_at > now())
  )
  ORDER BY n
  LIMIT 1;

  IF v_next_court IS NULL THEN
    RETURN jsonb_build_object('promoted', false);
  END IF;

  INSERT INTO public.court_sessions (
    court_id, queue_id, queue_entry_id, user_id, court_number, expires_at, status, started_at
  ) VALUES (
    v_court_id, p_queue_id, v_entry_id, v_user_id, v_next_court, NULL, 'active', now()
  );

  UPDATE public.queue_entries
  SET status = 'playing',
      assigned_court_number = v_next_court,
      started_playing_at = now()
  WHERE id = v_entry_id;

  PERFORM public.reorder_queue(p_queue_id);
  PERFORM public.sync_court_timers(p_queue_id);

  RETURN jsonb_build_object('promoted', true, 'court_number', v_next_court);
END;
$$;

REVOKE ALL ON FUNCTION public.sync_court_queues(uuid, text, jsonb, integer, integer, integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.sync_court_queues(uuid, text, jsonb, integer, integer, integer) TO service_role;

REVOKE ALL ON FUNCTION public.upsert_court_location(uuid, text, text, double precision, double precision, text, integer, text[], text, jsonb, integer, integer, integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.upsert_court_location(uuid, text, text, double precision, double precision, text, integer, text[], text, jsonb, integer, integer, integer) TO anon, authenticated, service_role;

GRANT EXECUTE ON FUNCTION public.sync_court_timers(uuid) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.process_after_queue_join(uuid) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.promote_waiting_player(uuid) TO anon, authenticated, service_role;
