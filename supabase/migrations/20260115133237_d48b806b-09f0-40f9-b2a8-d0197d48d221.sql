-- Create social_links table for configurable social media
CREATE TABLE public.social_links (
  id TEXT PRIMARY KEY,
  url TEXT NOT NULL DEFAULT '',
  enabled BOOLEAN NOT NULL DEFAULT true,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.social_links ENABLE ROW LEVEL SECURITY;

-- Everyone can read social links
CREATE POLICY "Anyone can read social links"
ON public.social_links
FOR SELECT
USING (true);

-- Only admins can update social links
CREATE POLICY "Admins can update social links"
ON public.social_links
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.admin_emails
    WHERE email = (SELECT email FROM auth.users WHERE id = auth.uid())
  )
);

-- Insert default social link entries
INSERT INTO public.social_links (id, url, enabled) VALUES
  ('instagram', '', true),
  ('facebook', '', true),
  ('twitter', '', true),
  ('linkedin', '', true),
  ('youtube', '', true);