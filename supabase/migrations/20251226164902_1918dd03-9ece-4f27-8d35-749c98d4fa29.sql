-- Add server-side input validation constraints for form submissions
-- This prevents malformed/oversized data from being inserted even if client validation is bypassed

-- buy_requests table constraints
ALTER TABLE public.buy_requests
  ADD CONSTRAINT buy_requests_email_format 
    CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
  ADD CONSTRAINT buy_requests_name_length 
    CHECK (char_length(full_name) BETWEEN 2 AND 100),
  ADD CONSTRAINT buy_requests_phone_length 
    CHECK (char_length(phone_number) BETWEEN 10 AND 20),
  ADD CONSTRAINT buy_requests_budget_length 
    CHECK (char_length(buying_budget) BETWEEN 1 AND 100),
  ADD CONSTRAINT buy_requests_area_length 
    CHECK (char_length(preferred_area) BETWEEN 2 AND 200);

-- sell_requests table constraints
ALTER TABLE public.sell_requests
  ADD CONSTRAINT sell_requests_email_format 
    CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
  ADD CONSTRAINT sell_requests_name_length 
    CHECK (char_length(full_name) BETWEEN 2 AND 100),
  ADD CONSTRAINT sell_requests_phone_length 
    CHECK (char_length(phone_number) BETWEEN 10 AND 20),
  ADD CONSTRAINT sell_requests_address_length
    CHECK (char_length(home_address) BETWEEN 5 AND 500);

-- work_with_me_requests table constraints
ALTER TABLE public.work_with_me_requests
  ADD CONSTRAINT work_requests_email_format 
    CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
  ADD CONSTRAINT work_requests_name_length 
    CHECK (char_length(full_name) BETWEEN 2 AND 100),
  ADD CONSTRAINT work_requests_location_length 
    CHECK (char_length(location) BETWEEN 2 AND 200),
  ADD CONSTRAINT work_requests_age_length 
    CHECK (char_length(age) BETWEEN 1 AND 20),
  ADD CONSTRAINT work_requests_skill_length 
    CHECK (char_length(skill) BETWEEN 2 AND 100);

-- messages table constraints
ALTER TABLE public.messages
  ADD CONSTRAINT messages_content_length
    CHECK (char_length(content) BETWEEN 1 AND 5000);