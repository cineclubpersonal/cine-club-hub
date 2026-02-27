-- Restore admin-only insert policy for peliculas
-- The previous migration opened insert to all authenticated users, which contradicts
-- the design: only admins can add/edit/delete movies via the protected /admin panel.

DROP POLICY IF EXISTS "Authenticated users can insert peliculas" ON public.peliculas;

CREATE POLICY "Admins can insert peliculas"
ON public.peliculas
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Also restrict storage uploads to admins only (no direct file uploads by non-admins)
DROP POLICY IF EXISTS "Authenticated users can upload media" ON storage.objects;

CREATE POLICY "Admins can upload media"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'media' AND public.has_role(auth.uid(), 'admin'));
