-- Enable realtime for applications_crm table so admins see new submissions instantly
ALTER PUBLICATION supabase_realtime ADD TABLE public.applications_crm;