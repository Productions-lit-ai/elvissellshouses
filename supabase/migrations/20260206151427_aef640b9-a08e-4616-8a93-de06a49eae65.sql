
-- Add explicit deny for unauthenticated access to profiles
CREATE POLICY "Deny public access to profiles"
ON public.profiles
FOR SELECT
TO anon
USING (false);

-- Add explicit deny for unauthenticated access to admin_emails
CREATE POLICY "Deny public access to admin_emails"
ON public.admin_emails
FOR SELECT
TO anon
USING (false);
