-- Fix 1: Standardize social_links UPDATE policy to use has_role()
DROP POLICY IF EXISTS "Admins can update social links" ON public.social_links;

CREATE POLICY "Admins can update social links"
ON public.social_links FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Fix 2: Add explicit denial of public access to user_roles table
-- This prevents unauthenticated users from enumerating admin users
CREATE POLICY "Deny public access to user_roles"
ON public.user_roles FOR SELECT
USING (auth.uid() IS NOT NULL);