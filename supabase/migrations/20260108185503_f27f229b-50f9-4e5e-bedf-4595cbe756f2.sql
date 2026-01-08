-- Create application_status enum for standardized statuses
CREATE TYPE public.application_status AS ENUM ('new', 'in_review', 'contacted', 'approved', 'rejected');

-- Create unified applications_crm table
CREATE TABLE public.applications_crm (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    application_type TEXT NOT NULL CHECK (application_type IN ('buy', 'sell', 'work')),
    full_name TEXT NOT NULL,
    phone_number TEXT,
    email_address TEXT NOT NULL,
    location TEXT,
    form_source TEXT DEFAULT 'website',
    status application_status NOT NULL DEFAULT 'new',
    additional_data JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create indexes for better query performance
CREATE INDEX idx_applications_crm_user_id ON public.applications_crm(user_id);
CREATE INDEX idx_applications_crm_application_type ON public.applications_crm(application_type);
CREATE INDEX idx_applications_crm_status ON public.applications_crm(status);
CREATE INDEX idx_applications_crm_created_at ON public.applications_crm(created_at DESC);
CREATE INDEX idx_applications_crm_email ON public.applications_crm(email_address);

-- Enable Row Level Security
ALTER TABLE public.applications_crm ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Admin-only access for viewing all applications
CREATE POLICY "Admins can view all applications" 
ON public.applications_crm 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'));

-- RLS: Users can view their own applications
CREATE POLICY "Users can view their own applications" 
ON public.applications_crm 
FOR SELECT 
USING (auth.uid() = user_id);

-- RLS: Users can insert their own applications
CREATE POLICY "Users can insert applications" 
ON public.applications_crm 
FOR INSERT 
WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

-- RLS: Only admins can update applications (status changes)
CREATE POLICY "Admins can update applications" 
ON public.applications_crm 
FOR UPDATE 
USING (has_role(auth.uid(), 'admin'));

-- RLS: Only admins can delete applications
CREATE POLICY "Admins can delete applications" 
ON public.applications_crm 
FOR DELETE 
USING (has_role(auth.uid(), 'admin'));

-- Trigger for automatic timestamp updates
CREATE TRIGGER update_applications_crm_updated_at
BEFORE UPDATE ON public.applications_crm
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Migrate existing data from old tables to new unified table
INSERT INTO public.applications_crm (user_id, application_type, full_name, phone_number, email_address, location, status, additional_data, created_at)
SELECT 
    user_id,
    'buy' as application_type,
    full_name,
    phone_number,
    email,
    preferred_area,
    CASE 
        WHEN lead_status = 'new' THEN 'new'::application_status
        WHEN lead_status = 'contacted' THEN 'contacted'::application_status
        WHEN lead_status = 'in progress' THEN 'in_review'::application_status
        WHEN lead_status = 'closed' THEN 'approved'::application_status
        ELSE 'new'::application_status
    END,
    jsonb_build_object('buying_budget', buying_budget, 'preferred_area', preferred_area),
    created_at
FROM public.buy_requests;

INSERT INTO public.applications_crm (user_id, application_type, full_name, phone_number, email_address, location, status, additional_data, created_at)
SELECT 
    user_id,
    'sell' as application_type,
    full_name,
    phone_number,
    email,
    home_address,
    CASE 
        WHEN lead_status = 'new' THEN 'new'::application_status
        WHEN lead_status = 'contacted' THEN 'contacted'::application_status
        WHEN lead_status = 'in progress' THEN 'in_review'::application_status
        WHEN lead_status = 'closed' THEN 'approved'::application_status
        ELSE 'new'::application_status
    END,
    jsonb_build_object('home_address', home_address),
    created_at
FROM public.sell_requests;

INSERT INTO public.applications_crm (user_id, application_type, full_name, phone_number, email_address, location, status, additional_data, created_at)
SELECT 
    user_id,
    'work' as application_type,
    full_name,
    phone_number,
    email,
    location,
    CASE 
        WHEN lead_status = 'new' THEN 'new'::application_status
        WHEN lead_status = 'contacted' THEN 'contacted'::application_status
        WHEN lead_status = 'in progress' THEN 'in_review'::application_status
        WHEN lead_status = 'closed' THEN 'approved'::application_status
        ELSE 'new'::application_status
    END,
    jsonb_build_object('age', age, 'skill', skill, 'skill_level', skill_level),
    created_at
FROM public.work_with_me_requests;