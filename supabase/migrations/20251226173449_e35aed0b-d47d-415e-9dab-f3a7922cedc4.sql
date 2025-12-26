-- Create lead_notes table for internal admin notes on leads
CREATE TABLE public.lead_notes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lead_id UUID NOT NULL,
  lead_type TEXT NOT NULL CHECK (lead_type IN ('buy', 'sell', 'work')),
  note TEXT NOT NULL,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.lead_notes ENABLE ROW LEVEL SECURITY;

-- Only admins can view notes
CREATE POLICY "Admins can view all lead notes"
ON public.lead_notes
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Only admins can create notes
CREATE POLICY "Admins can create lead notes"
ON public.lead_notes
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Only admins can update notes
CREATE POLICY "Admins can update lead notes"
ON public.lead_notes
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Only admins can delete notes
CREATE POLICY "Admins can delete lead notes"
ON public.lead_notes
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create index for faster lookups
CREATE INDEX idx_lead_notes_lead ON public.lead_notes (lead_id, lead_type);

-- Add trigger for updated_at
CREATE TRIGGER update_lead_notes_updated_at
BEFORE UPDATE ON public.lead_notes
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();