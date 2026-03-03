
-- Table for music tracks with metadata
CREATE TABLE public.musica (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  titulo TEXT NOT NULL,
  artista TEXT,
  album TEXT,
  anio INTEGER,
  duracion TEXT,
  genero TEXT NOT NULL DEFAULT 'Sin género',
  audio_url TEXT NOT NULL,
  portada_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.musica ENABLE ROW LEVEL SECURITY;

-- Public access policies (same pattern as peliculas)
CREATE POLICY "Public read musica" ON public.musica FOR SELECT USING (true);
CREATE POLICY "Public insert musica" ON public.musica FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update musica" ON public.musica FOR UPDATE USING (true);
CREATE POLICY "Public delete musica" ON public.musica FOR DELETE USING (true);
