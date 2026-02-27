
-- Create enum type for categoria
CREATE TYPE public.categoria_type AS ENUM ('peliculas', 'series', 'conciertos');

-- Add categoria column with default so existing rows get a value, then make it required
ALTER TABLE public.peliculas ADD COLUMN categoria public.categoria_type NOT NULL DEFAULT 'peliculas';
