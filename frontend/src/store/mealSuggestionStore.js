import { create } from 'zustand'

const useMealSuggestionStore = create((set) => ({
  isDrawerOpen: false,
  suggestions: [],             // array of 3-5 suggestion objects
  isLoadingSuggestion: false,
  mealType: 'lunch',
  preferences: '',

  setDrawerOpen: (isOpen) => set({ isDrawerOpen: isOpen }),
  setSuggestions: (suggestions) => set({ suggestions }),
  setLoadingSuggestion: (isLoading) => set({ isLoadingSuggestion: isLoading }),
  setMealType: (mealType) => set({ mealType }),
  setPreferences: (preferences) => set({ preferences }),

  resetDrawer: () => set({
    isDrawerOpen: false,
    suggestions: [],
    isLoadingSuggestion: false,
    mealType: 'lunch',
    preferences: '',
  }),
}))

export default useMealSuggestionStore
