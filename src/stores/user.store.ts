import { create } from 'zustand';
import type { Profile } from '@/types/database.types';

interface UserState {
  profile: Profile | null;
  isLoading: boolean;
  isOnboarding: boolean;

  // Actions
  setProfile: (profile: Profile | null) => void;
  setLoading: (loading: boolean) => void;
  updateProfile: (partial: Partial<Profile>) => void;
  clearProfile: () => void;
}

export const useUserStore = create<UserState>((set) => ({
  profile: null,
  isLoading: true,
  isOnboarding: false,

  setProfile: (profile) =>
    set({
      profile,
      isLoading: false,
      isOnboarding: profile ? !profile.onboarding_completed : false,
    }),

  setLoading: (isLoading) => set({ isLoading }),

  updateProfile: (partial) =>
    set((state) => ({
      profile: state.profile ? { ...state.profile, ...partial } : null,
    })),

  clearProfile: () =>
    set({ profile: null, isLoading: false, isOnboarding: false }),
}));
