import React, { useEffect, useState } from 'react'
import { Drawer, Spin, Empty, message } from 'antd'
import { useLocation } from 'react-router-dom'
import useMealSuggestionStore from '../../store/mealSuggestionStore'
import { mealSuggestionsAPI } from '../../api/mealSuggestions'
import MealSuggestionInputForm from './MealSuggestionInputForm'
import MealSuggestionCard from './MealSuggestionCard'
import ConvertToRecipeModal from './ConvertToRecipeModal'

const MealSuggestionDrawer = () => {
  const location = useLocation()
  const {
    isDrawerOpen,
    currentSuggestion,
    isLoadingSuggestion,
    mealType,
    preferences,
    setDrawerOpen,
    setCurrentSuggestion,
    setLoadingSuggestion,
    setMealType,
    setPreferences,
    resetDrawer,
  } = useMealSuggestionStore()

  const [isConvertModalOpen, setIsConvertModalOpen] = useState(false)
  const [isConvertLoading, setIsConvertLoading] = useState(false)

  useEffect(() => {
    resetDrawer()
  }, [location, resetDrawer])

  const fetchSuggestion = async (mealTypeValue, preferencesValue) => {
    setLoadingSuggestion(true)
    try {
      const suggestion = await mealSuggestionsAPI.fetchSuggestion(mealTypeValue, preferencesValue)
      setCurrentSuggestion(suggestion)
    } catch (error) {
      message.error('Failed to fetch meal suggestion')
      console.error('Error fetching suggestion:', error)
    } finally {
      setLoadingSuggestion(false)
    }
  }

  const handleSubmit = (mealTypeValue, preferencesValue) => {
    setMealType(mealTypeValue)
    setPreferences(preferencesValue)
    fetchSuggestion(mealTypeValue, preferencesValue)
  }

  const handleConvertClick = () => {
    setIsConvertModalOpen(true)
  }

  const handleConvertSave = async (servings) => {
    setIsConvertLoading(true)
    try {
      const newRecipe = await mealSuggestionsAPI.convertToRecipe(
        currentSuggestion,
        servings
      )
      message.success('Recipe saved successfully!')
      setIsConvertModalOpen(false)
      setCurrentSuggestion(null)
      setDrawerOpen(false)
    } catch (error) {
      message.error('Failed to save recipe')
      console.error('Error saving recipe:', error)
    } finally {
      setIsConvertLoading(false)
    }
  }

  const handleConvertCancel = () => {
    setIsConvertModalOpen(false)
  }

  return (
    <>
      <Drawer
        title="💡 Meal Suggestion"
        placement="right"
        onClose={() => setDrawerOpen(false)}
        open={isDrawerOpen}
        width={350}
        bodyStyle={{ padding: '12px' }}
      >
        {currentSuggestion ? (
          <>
            <MealSuggestionCard
              meal={currentSuggestion}
              onConvert={handleConvertClick}
              isLoading={isConvertLoading}
            />
          </>
        ) : (
          <Spin spinning={isLoadingSuggestion} tip="Generating suggestion...">
            <MealSuggestionInputForm
              mealType={mealType}
              onMealTypeChange={setMealType}
              preferences={preferences}
              onPreferencesChange={setPreferences}
              onSubmit={handleSubmit}
              loading={isLoadingSuggestion}
            />
          </Spin>
        )}
      </Drawer>

      <ConvertToRecipeModal
        visible={isConvertModalOpen}
        meal={currentSuggestion}
        onSave={handleConvertSave}
        onCancel={handleConvertCancel}
        isLoading={isConvertLoading}
      />
    </>
  )
}

export default MealSuggestionDrawer
