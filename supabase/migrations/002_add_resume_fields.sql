-- Ardent: Migration 002
-- Add basic details to resumes and subscription tier to profiles

-- 1. Add subscription_tier to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS subscription_tier TEXT DEFAULT 'free' CHECK (subscription_tier IN ('free', 'pro', 'max'));

-- 2. Add parsed_basic_details to resumes
ALTER TABLE public.resumes 
ADD COLUMN IF NOT EXISTS parsed_basic_details JSONB DEFAULT '{}'::jsonb;
