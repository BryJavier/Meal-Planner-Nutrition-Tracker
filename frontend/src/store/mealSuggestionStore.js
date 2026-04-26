import { create } from 'zustand'

const useMealSuggestionStore = create((set) => ({
  isDrawerOpen: false,
  currentSuggestion: null,
  isLoadingSuggestion: false,
  error: null,
  mealType: 'lunch',
  preferences: '',

  setDrawerOpen: (isOpen) => set({ isDrawerOpen: isOpen }),
  
  setCurrentSuggestion: (suggestion) => set({ currentSuggestion: suggestion }),
  
  setLoadingSuggestion: (isLoading) => set({ isLoadingSuggestion: isLoading }),
  
  setError: (error) => set({ error }),

  setMealType: (mealType) => set({ mealType }),

  setPreferences: (preferences) => set({ preferences }),
  
  resetSuggestion: () => set({ 
    currentSuggestion: null, 
    isLoadingSuggestion: false,
    error: null 
  }),
  
  resetDrawer: () => set({ 
    isDrawerOpen: false,
    currentSuggestion: null,
    isLoadingSuggestion: false,
    error: null,
    mealType: 'lunch',
    preferences: ''
  })
}))

export default useMealSuggestionStore
