-- Add lead_status column to track lead progress
ALTER TABLE public.buy_requests ADD COLUMN IF NOT EXISTS lead_status text NOT NULL DEFAULT 'new';
ALTER TABLE public.sell_requests ADD COLUMN IF NOT EXISTS lead_status text NOT NULL DEFAULT 'new';
ALTER TABLE public.work_with_me_requests ADD COLUMN IF NOT EXISTS lead_status text NOT NULL DEFAULT 'new';

-- Add phone_number to work_with_me_requests for complete lead info
ALTER TABLE public.work_with_me_requests ADD COLUMN IF NOT EXISTS phone_number text;