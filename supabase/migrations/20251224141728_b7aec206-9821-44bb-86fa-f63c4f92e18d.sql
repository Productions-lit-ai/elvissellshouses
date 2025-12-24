-- Fix 1: Restrict admin_emails to authenticated users only
DROP POLICY IF EXISTS "Anyone can view admin emails" ON public.admin_emails;

CREATE POLICY "Authenticated users can view admin emails"
ON public.admin_emails
FOR SELECT
USING (auth.uid() IS NOT NULL);

-- Fix 2: Add missing UPDATE and DELETE policies for admins on work_with_me_requests
CREATE POLICY "Admins can update work with me requests"
ON public.work_with_me_requests
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete work with me requests"
ON public.work_with_me_requests
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));