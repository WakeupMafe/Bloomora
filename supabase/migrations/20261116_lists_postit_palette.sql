ALTER TABLE public.lists
  ADD COLUMN IF NOT EXISTS postit_palette text;

ALTER TABLE public.lists DROP CONSTRAINT IF EXISTS lists_postit_palette_check;
ALTER TABLE public.lists
  ADD CONSTRAINT lists_postit_palette_check
  CHECK (
    postit_palette IS NULL
    OR postit_palette IN ('sky', 'lavender', 'blush', 'mint', 'amber')
  );
