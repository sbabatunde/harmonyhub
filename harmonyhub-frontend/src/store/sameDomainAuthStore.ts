import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User } from '@/types';
import api, { getCsrfCookie } from '@/config/api';
import { logger } from '@/utils/logger';

interface AuthState {
  user: User | null;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (data: any) => Promise<void>;
  logout: () => Promise<void>;
  fetchUser: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isLoading: false,
      error: null,

      login: async (email: string, password: string) => {
        set({ isLoading: true, error: null });
        logger.info('Login attempt started', { email });
        
        try {
          await getCsrfCookie();
          
          const response = await api.post('/auth/login', { email, password });
          
          const user = response.data.data?.user || response.data.user;
          logger.info('Login successful', { userId: user?.id });
          
          set({ user, isLoading: false });
        } catch (error: any) {
          logger.error('Login failed', error as Error);
          set({ 
            error: error.response?.data?.message || 'Login failed', 
            isLoading: false,
            user: null,
          });
          throw error;
        }
      },

      register: async (data: any) => {
        set({ isLoading: true, error: null });
        
        try {
          await getCsrfCookie();
          const response = await api.post('/auth/register', data);
          
          const user = response.data.data?.user || response.data.user;
          
          set({ user, isLoading: false });
        } catch (error: any) {
          set({ 
            error: error.response?.data?.message || 'Registration failed', 
            isLoading: false,
            user: null,
          });
          throw error;
        }
      },

      logout: async () => {
        try {
          await api.post('/auth/logout');
        } catch (error) {
          logger.warn('Logout API call failed');
        } finally {
          set({ user: null });
        }
      },

      fetchUser: async () => {
        try {
          const response = await api.get('/user');
          const user = response.data.data || response.data;
          set({ user });
        } catch (error: any) {
          if (error.response?.status === 401) {
            set({ user: null });
          }
          // Don't clear user on other errors (network, 500, etc.)
        }
      },
    }),
    {
      name: 'harmonyhub-auth', // This is the ONLY key persisted
      partialize: (state) => ({ user: state.user }),
    }
  )
);