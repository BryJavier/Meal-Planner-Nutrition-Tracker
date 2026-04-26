import React, { useEffect, useState } from 'react'
import { Drawer, Spin, Button, message, Typography } from 'antd'
import { ReloadOutlined } from '@ant-design/icons'
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
    suggestions,
    isLoadingSuggestion,
    mealType,
    preferences,
    setDrawerOpen,
    setSuggestions,
    setLoadingSuggestion,
    setMealType,
    setPreferences,
    resetDrawer,
  } = useMealSuggestionStore()

  // Which suggestion is currently being converted (index), and loading state per card
  const [convertTarget, setConvertTarget] = useState(null)   // { index, suggestion }
  const [convertingIndex, setConvertingIndex] = useState(null)
  const [savedIndices, setSavedIndices] = useState(new Set())

  useEffect(() => {
    resetDrawer()
    setSavedIndices(new Set())
  }, [location, resetDrawer])

  const fetchSuggestions = async (mealTypeValue, preferencesValue) => {
    setLoadingSuggestion(true)
    setSuggestions([])
    setSavedIndices(new Set())
    try {
      const list = await mealSuggestionsAPI.fetchSuggestions(mealTypeValue, preferencesValue)
      setSuggestions(Array.isArray(list) ? list : [])
    } catch (error) {
      message.error('Failed to fetch meal suggestions — check your API key in Settings')
      console.error(error)
    } finally {
      setLoadingSuggestion(false)
    }
  }

  const handleSubmit = (mealTypeValue, preferencesValue) => {
    setMealType(mealTypeValue)
    setPreferences(preferencesValue)
    fetchSuggestions(mealTypeValue, preferencesValue)
  }

  const handleConvertClick = (suggestion, index) => {
    setConvertTarget({ index, suggestion })
  }

  const handleConvertSave = async (servings) => {
    if (!convertTarget) return
    const { index, suggestion } = convertTarget
    setConvertingIndex(index)
    try {
      await mealSuggestionsAPI.convertToRecipe(suggestion, servings)
      message.success(`"${suggestion.meal_name}" saved to your recipe library!`)
      setSavedIndices((prev) => new Set([...prev, index]))
      setConvertTarget(null)
    } catch (error) {
      message.error('Failed to save recipe')
      console.error(error)
    } finally {
      setConvertingIndex(null)
    }
  }

  const hasSuggestions = suggestions.length > 0

  return (
    <>
      <Drawer
        title="💡 Meal Suggestions"
        placement="right"
        onClose={() => setDrawerOpen(false)}
        open={isDrawerOpen}
        width={370}
        styles={{ body: { padding: '12px', display: 'flex', flexDirection: 'column', gap: 12 } }}
      >
        {/* Input form always visible at top */}
        <MealSuggestionInputForm
          mealType={mealType}
          onMealTypeChange={setMealType}
          preferences={preferences}
          onPreferencesChange={setPreferences}
          onSubmit={handleSubmit}
          loading={isLoadingSuggestion}
        />

        {/* Loading spinner while AI generates */}
        {isLoadingSuggestion && (
          <div style={{ textAlign: 'center', padding: '32px 0' }}>
            <Spin tip="Generating suggestions…" />
          </div>
        )}

        {/* Scrollable list of suggestion cards */}
        {!isLoadingSuggestion && hasSuggestions && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography.Text style={{ fontSize: 13, color: '#94A3B8' }}>
                {suggestions.length} suggestions
              </Typography.Text>
              <Button
                size="small"
                icon={<ReloadOutlined />}
                onClick={() => fetchSuggestions(mealType, preferences)}
              >
                Regenerate
              </Button>
            </div>

            {suggestions.map((suggestion, index) => (
              <MealSuggestionCard
                key={index}
                meal={suggestion}
                saved={savedIndices.has(index)}
                isConverting={convertingIndex === index}
                onConvert={() => handleConvertClick(suggestion, index)}
              />
            ))}
          </div>
        )}
      </Drawer>

      <ConvertToRecipeModal
        visible={!!convertTarget}
        meal={convertTarget?.suggestion}
        onSave={handleConvertSave}
        onCancel={() => setConvertTarget(null)}
        isLoading={convertingIndex !== null}
      />
    </>
  )
}

export default MealSuggestionDrawer
