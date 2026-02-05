-- Fix: Restrict admin_emails table access to admins only
-- Drop the overly permissive policy that allows any authenticated user to view admin emails
DROP POLICY IF EXISTS "Authenticated users can view admin emails" ON public.admin_emails;

-- Create new policy that only allows admins to view admin emails
-- Note: The is_admin_email() SECURITY DEFINER function will still work (bypasses RLS)
CREATE POLICY "Admins can view admin emails"
ON public.admin_emails FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));