-- Add missing admin UPDATE and DELETE policies for sell_requests table
-- This allows admins to update lead_status and delete spam entries in the CRM

CREATE POLICY "Admins can update sell requests"
ON public.sell_requests
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete sell requests"
ON public.sell_requests
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));