import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

export const SUPABASE_URL = 'https://ygiqikcchwlyeabvkybb.supabase.co';
export const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlnaXFpa2NjaHdseWVhYnZreWJiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTM0NzUwNjIsImV4cCI6MjEwOTA1MTA2Mn0.t-XS-OjOyp1aRG96otVOo1LdaFCMFDCH49CfsUmrOXw';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
