-- Bloomora · Tabatas en profiles (modo simple: identidad = cedula, sin auth.uid())
-- Ejecutar en SQL Editor de Supabase si no aplicas migraciones por CLI.

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS tabatas jsonb NOT NULL DEFAULT '[]'::jsonb;

ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_tabatas_is_array;
ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_tabatas_is_array CHECK (jsonb_typeof(tabatas) = 'array');

ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_tabatas_max_30;
ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_tabatas_max_30 CHECK (jsonb_array_length(tabatas) <= 30);

COMMENT ON COLUMN public.profiles.tabatas IS
  'Tabatas guardados: arreglo JSON {id, nombre, preparacion, trabajo, descanso, intervalos, series, descanso_series, enfriamiento, created_at, updated_at}. Máx. 30.';

CREATE OR REPLACE FUNCTION public.tabata_upsert(
  p_cedula text,
  p_tabata jsonb,
  p_permitir_duplicado boolean DEFAULT false
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  v_cedula text := btrim(coalesce(p_cedula, ''));
  v_lista jsonb;
  v_id text := p_tabata->>'id';
  v_nombre text := btrim(coalesce(p_tabata->>'nombre', ''));
  v_now text := to_char(now() AT TIME ZONE 'utc', 'YYYY-MM-DD"T"HH24:MI:SS"Z"');
  v_dup jsonb;
  v_item jsonb;
  v_prep int;
  v_trab int;
  v_desc int;
  v_ints int;
  v_ser int;
  v_dser int;
  v_enf int;
BEGIN
  IF v_cedula = '' OR v_id IS NULL OR v_nombre = '' THEN
    RAISE EXCEPTION 'TABATA_INVALIDO';
  END IF;

  BEGIN
    v_prep := (p_tabata->>'preparacion')::int;
    v_trab := (p_tabata->>'trabajo')::int;
    v_desc := (p_tabata->>'descanso')::int;
    v_ints := (p_tabata->>'intervalos')::int;
    v_ser  := (p_tabata->>'series')::int;
    v_dser := (p_tabata->>'descanso_series')::int;
    v_enf  := (p_tabata->>'enfriamiento')::int;
  EXCEPTION WHEN others THEN
    RAISE EXCEPTION 'TABATA_INVALIDO';
  END;

  IF v_prep IS NULL OR v_trab IS NULL OR v_desc IS NULL
     OR v_ints IS NULL OR v_ser IS NULL OR v_dser IS NULL OR v_enf IS NULL
     OR v_prep < 0 OR v_trab < 1 OR v_desc < 0
     OR v_ints < 1 OR v_ser < 1 OR v_dser < 0 OR v_enf < 0 THEN
    RAISE EXCEPTION 'TABATA_INVALIDO';
  END IF;

  SELECT tabatas INTO v_lista
  FROM public.profiles
  WHERE cedula = v_cedula
  FOR UPDATE;

  IF NOT FOUND OR v_lista IS NULL THEN
    RAISE EXCEPTION 'PERFIL_NO_ENCONTRADO';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM jsonb_array_elements(v_lista) e
    WHERE e->>'id' <> v_id
      AND lower(btrim(e->>'nombre')) = lower(v_nombre)
  ) THEN
    RAISE EXCEPTION 'NOMBRE_DUPLICADO';
  END IF;

  IF NOT p_permitir_duplicado THEN
    SELECT e INTO v_dup
    FROM jsonb_array_elements(v_lista) e
    WHERE e->>'id' <> v_id
      AND (e->>'preparacion')::int = v_prep
      AND (e->>'trabajo')::int = v_trab
      AND (e->>'descanso')::int = v_desc
      AND (e->>'intervalos')::int = v_ints
      AND (e->>'series')::int = v_ser
      AND (e->>'descanso_series')::int = v_dser
      AND (e->>'enfriamiento')::int = v_enf
    LIMIT 1;

    IF v_dup IS NOT NULL THEN
      RAISE EXCEPTION 'CONFIG_DUPLICADA:%', v_dup->>'nombre';
    END IF;
  END IF;

  SELECT e INTO v_item
  FROM jsonb_array_elements(v_lista) e
  WHERE e->>'id' = v_id;

  IF v_item IS NULL THEN
    IF jsonb_array_length(v_lista) >= 30 THEN
      RAISE EXCEPTION 'TABATA_INVALIDO';
    END IF;
    v_item := jsonb_build_object(
      'id', v_id,
      'nombre', v_nombre,
      'preparacion', v_prep,
      'trabajo', v_trab,
      'descanso', v_desc,
      'intervalos', v_ints,
      'series', v_ser,
      'descanso_series', v_dser,
      'enfriamiento', v_enf,
      'created_at', v_now,
      'updated_at', v_now
    );
    v_lista := v_lista || jsonb_build_array(v_item);
  ELSE
    v_item := jsonb_build_object(
      'id', v_id,
      'nombre', v_nombre,
      'preparacion', v_prep,
      'trabajo', v_trab,
      'descanso', v_desc,
      'intervalos', v_ints,
      'series', v_ser,
      'descanso_series', v_dser,
      'enfriamiento', v_enf,
      'created_at', coalesce(v_item->>'created_at', v_now),
      'updated_at', v_now
    );
    SELECT coalesce(
      jsonb_agg(CASE WHEN e->>'id' = v_id THEN v_item ELSE e END ORDER BY ord),
      '[]'::jsonb
    )
    INTO v_lista
    FROM jsonb_array_elements(v_lista) WITH ORDINALITY AS t(e, ord);
  END IF;

  UPDATE public.profiles
  SET tabatas = v_lista, updated_at = now()
  WHERE cedula = v_cedula;

  RETURN v_lista;
END;
$$;

CREATE OR REPLACE FUNCTION public.tabata_delete(
  p_cedula text,
  p_id text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  v_cedula text := btrim(coalesce(p_cedula, ''));
  v_lista jsonb;
BEGIN
  IF v_cedula = '' OR p_id IS NULL OR btrim(p_id) = '' THEN
    RAISE EXCEPTION 'TABATA_INVALIDO';
  END IF;

  UPDATE public.profiles p
  SET tabatas = coalesce(
        (
          SELECT jsonb_agg(e ORDER BY ord)
          FROM jsonb_array_elements(p.tabatas) WITH ORDINALITY AS t(e, ord)
          WHERE e->>'id' <> p_id
        ),
        '[]'::jsonb
      ),
      updated_at = now()
  WHERE p.cedula = v_cedula
  RETURNING p.tabatas INTO v_lista;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'PERFIL_NO_ENCONTRADO';
  END IF;

  RETURN v_lista;
END;
$$;

REVOKE ALL ON FUNCTION public.tabata_upsert(text, jsonb, boolean) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.tabata_delete(text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.tabata_upsert(text, jsonb, boolean) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.tabata_delete(text, text) TO anon, authenticated;
