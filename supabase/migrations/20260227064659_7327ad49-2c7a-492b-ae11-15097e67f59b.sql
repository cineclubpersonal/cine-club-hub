
-- Drop restrictive policies
DROP POLICY IF EXISTS "Admins can delete peliculas" ON public.peliculas;
DROP POLICY IF EXISTS "Admins can update peliculas" ON public.peliculas;
DROP POLICY IF EXISTS "Authenticated users can insert peliculas" ON public.peliculas;
DROP POLICY IF EXISTS "Anyone can read peliculas" ON public.peliculas;

-- Create fully public policies
CREATE POLICY "Public read peliculas" ON public.peliculas FOR SELECT USING (true);
CREATE POLICY "Public insert peliculas" ON public.peliculas FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update peliculas" ON public.peliculas FOR UPDATE USING (true);
CREATE POLICY "Public delete peliculas" ON public.peliculas FOR DELETE USING (true);

-- Public storage access
DROP POLICY IF EXISTS "Authenticated users can upload media" ON storage.objects;
CREATE POLICY "Public upload media" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'media');
