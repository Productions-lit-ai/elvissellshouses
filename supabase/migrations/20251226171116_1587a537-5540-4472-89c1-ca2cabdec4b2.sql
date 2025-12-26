-- Add INSERT policy for profiles table to allow users to create their own profile
-- This provides resilience if the handle_new_user() trigger fails

CREATE POLICY "Users can create their own profile"
ON public.profiles
FOR INSERT
WITH CHECK (auth.uid() = user_id);