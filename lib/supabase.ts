import { createClient } from '@supabase/supabase-js';

// Helper to safely access environment variables in various environments (Vite, Next.js, CRA, Node)
const getEnvVar = (key: string, viteKey: string, craKey: string): string | undefined => {
  // Check import.meta.env (Vite standard)
  // @ts-ignore
  if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env[viteKey]) {
    // @ts-ignore
    return import.meta.env[viteKey];
  }
  
  // Check process.env (Node/Webpack/CRA)
  if (typeof process !== 'undefined' && process.env) {
     if (process.env[craKey]) return process.env[craKey]; // CRA priority
     if (process.env[key]) return process.env[key];       // Standard Node/Fallback
  }

  return undefined;
};

// Ensure these environment variables are set in your project configuration
// We check REACT_APP_ vars first for Vercel "Create React App" framework compatibility
const supabaseUrl = getEnvVar('SUPABASE_URL', 'VITE_SUPABASE_URL', 'REACT_APP_SUPABASE_URL') || 'https://kvmzcuzohdzzjbkfyrav.supabase.co';
const supabaseKey = getEnvVar('SUPABASE_ANON_KEY', 'VITE_SUPABASE_ANON_KEY', 'REACT_APP_SUPABASE_ANON_KEY') || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt2bXpjdXpvaGR6empia2Z5cmF2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU2ODM5OTAsImV4cCI6MjA4MTI1OTk5MH0.g2gAFUSFCjhsO7sgbeE56lXk9sIPZmiEnj7VnxREEPA';

export const supabase = createClient(supabaseUrl, supabaseKey);