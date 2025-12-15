import { createClient } from '@supabase/supabase-js';

// Ensure these environment variables are set in your project configuration
const supabaseUrl = process.env.SUPABASE_URL || 'https://kvmzcuzohdzzjbkfyrav.supabase.co';
const supabaseKey = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt2bXpjdXpvaGR6empia2Z5cmF2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU2ODM5OTAsImV4cCI6MjA4MTI1OTk5MH0.g2gAFUSFCjhsO7sgbeE56lXk9sIPZmiEnj7VnxREEPA';

export const supabase = createClient(supabaseUrl, supabaseKey);
