export const BASE_URL = 'https://luciernaga-free-p4o4.vercel.app';

export const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
export const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '';

export const COLORS = {
  background: '#1a1a1a',
  card: '#2a2a2a',
  accent: '#facc15',
  textPrimary: '#ffffff',
  textSecondary: '#9ca3af',
  error: '#ef4444',
  success: '#22c55e',
  border: '#374151',
} as const;
