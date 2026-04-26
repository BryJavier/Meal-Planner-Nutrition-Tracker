import { create } from 'zustand'

const useMealSuggestionStore = create((set) => ({
  isDrawerOpen: false,
  currentSuggestion: null,
  isLoadingSuggestion: false,
  error: null,

  setDrawerOpen: (isOpen) => set({ isDrawerOpen: isOpen }),
  
  setCurrentSuggestion: (suggestion) => set({ currentSuggestion: suggestion }),
  
  setLoadingSuggestion: (isLoading) => set({ isLoadingSuggestion: isLoading }),
  
  setError: (error) => set({ error }),
  
  resetSuggestion: () => set({ 
    currentSuggestion: null, 
    isLoadingSuggestion: false,
    error: null 
  }),
  
  resetDrawer: () => set({ 
    isDrawerOpen: false,
    currentSuggestion: null,
    isLoadingSuggestion: false,
    error: null
  })
}))

export default useMealSuggestionStore
