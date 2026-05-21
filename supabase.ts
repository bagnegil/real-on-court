import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://yfotlfwpswclyphvuhvw.supabase.co';
// Public "anon" key — safe to ship in the app. Data is protected by Row Level Security.
const supabaseAnonKey =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inlmb3RsZndwc3djbHlwaHZ1aHZ3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkzNTg3MjksImV4cCI6MjA5NDkzNDcyOX0.0ONohCN6MAwQY3G02fGDKwQoMmg5q6m7wACLbBfMmPU';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
