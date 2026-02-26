-- Drop restrictive insert policy, allow any authenticated user to insert
DROP POLICY IF EXISTS "Admins can insert peliculas" ON public.peliculas;
CREATE POLICY "Authenticated users can insert peliculas"
ON public.peliculas
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Create storage bucket for video/media uploads
INSERT INTO storage.buckets (id, name, public) VALUES ('media', 'media', true);

-- Storage policies: any authenticated user can upload
CREATE POLICY "Authenticated users can upload media"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'media');

-- Public read access for media
CREATE POLICY "Public can read media"
ON storage.objects FOR SELECT
USING (bucket_id = 'media');