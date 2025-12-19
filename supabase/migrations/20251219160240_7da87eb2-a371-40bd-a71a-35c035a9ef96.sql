-- Create work_with_me_requests table for the new page
CREATE TABLE public.work_with_me_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  location TEXT NOT NULL,
  age TEXT NOT NULL,
  skill TEXT NOT NULL,
  skill_level TEXT NOT NULL CHECK (skill_level IN ('Beginner', 'Intermediate', 'Advanced')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.work_with_me_requests ENABLE ROW LEVEL SECURITY;

-- Users can create their own submissions
CREATE POLICY "Users can create work with me requests"
ON public.work_with_me_requests
FOR INSERT
WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

-- Users can view their own submissions
CREATE POLICY "Users can view their own work with me requests"
ON public.work_with_me_requests
FOR SELECT
USING (auth.uid() = user_id);

-- Admins can view all submissions
CREATE POLICY "Admins can view all work with me requests"
ON public.work_with_me_requests
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Add recipient_id to messages table for private messaging
ALTER TABLE public.messages ADD COLUMN recipient_id UUID;

-- Update messages policies to enforce private messaging
DROP POLICY IF EXISTS "Users can view their own messages" ON public.messages;
DROP POLICY IF EXISTS "Users can send messages" ON public.messages;

-- Users can only view messages they sent OR received
CREATE POLICY "Users can view their messages"
ON public.messages
FOR SELECT
USING (auth.uid() = sender_id OR auth.uid() = recipient_id);

-- Users can send messages (with recipient)
CREATE POLICY "Users can send messages"
ON public.messages
FOR INSERT
WITH CHECK (auth.uid() = sender_id);

-- Create admin_emails table to store approved admin emails
CREATE TABLE public.admin_emails (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Disable RLS on admin_emails (public read, no write from API)
ALTER TABLE public.admin_emails ENABLE ROW LEVEL SECURITY;

-- Anyone can read admin emails (for display purposes)
CREATE POLICY "Anyone can view admin emails"
ON public.admin_emails
FOR SELECT
USING (true);

-- Insert the two approved admin emails
INSERT INTO public.admin_emails (email) VALUES 
  ('elvissellshouses@gmail.com'),
  ('roz3fjr@gmail.com');

-- Create function to check if email is admin
CREATE OR REPLACE FUNCTION public.is_admin_email(_email TEXT)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.admin_emails WHERE email = _email
  )
$$;

-- Update handle_new_user to assign admin role based on email
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Create profile
  INSERT INTO public.profiles (user_id, email, full_name)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data ->> 'full_name');
  
  -- Assign role based on email
  IF is_admin_email(NEW.email) THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'admin');
  ELSE
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'guest');
  END IF;
  
  RETURN NEW;
END;
$$;