-- Add a label column to social_links for custom display text
ALTER TABLE public.social_links ADD COLUMN label text DEFAULT '';

-- Update the instagram entry with a default label
UPDATE public.social_links SET label = '@iamelvisregis' WHERE id = 'instagram';