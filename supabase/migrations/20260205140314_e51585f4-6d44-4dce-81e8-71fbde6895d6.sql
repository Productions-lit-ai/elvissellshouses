-- Fix profiles table RLS - ensure no public access
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can create their own profile" ON public.profiles;

-- Recreate policies with explicit authenticated role requirement
CREATE POLICY "Users can view their own profile" 
ON public.profiles FOR SELECT 
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile" 
ON public.profiles FOR UPDATE 
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all profiles" 
ON public.profiles FOR SELECT 
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can create their own profile" 
ON public.profiles FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Fix buy_requests table RLS - ensure no public access
DROP POLICY IF EXISTS "Users can create their own buy requests" ON public.buy_requests;
DROP POLICY IF EXISTS "Users can view their own buy requests" ON public.buy_requests;
DROP POLICY IF EXISTS "Admins can view all buy requests" ON public.buy_requests;
DROP POLICY IF EXISTS "Users can update their own buy requests" ON public.buy_requests;
DROP POLICY IF EXISTS "Users can delete their own buy requests" ON public.buy_requests;

-- Recreate policies with explicit authenticated role requirement
CREATE POLICY "Users can view their own buy requests" 
ON public.buy_requests FOR SELECT 
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all buy requests" 
ON public.buy_requests FOR SELECT 
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can create their own buy requests" 
ON public.buy_requests FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own buy requests" 
ON public.buy_requests FOR UPDATE 
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own buy requests" 
ON public.buy_requests FOR DELETE 
TO authenticated
USING (auth.uid() = user_id);

-- Add admin update/delete policies for buy_requests (matching sell_requests pattern)
CREATE POLICY "Admins can update buy requests" 
ON public.buy_requests FOR UPDATE 
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete buy requests" 
ON public.buy_requests FOR DELETE 
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));