import { useState } from 'react'
import { Drawer, Select, Input, Button, Typography, Divider, Space, message, Card } from 'antd'
import { SendOutlined, RobotOutlined } from '@ant-design/icons'
import { streamMealSuggestions, suggestRecipe, saveSuggestedRecipe } from '../../api/ai'
import MealSuggestionOutput from './MealSuggestionOutput'

const SLOTS = ['breakfast', 'lunch', 'dinner', 'snack']

export default function AISuggestionPanel({ open, onClose }) {
  const [slot, setSlot] = useState('lunch')
  const [context, setContext] = useState('')
  const [streaming, setStreaming] = useState(false)
  const [streamText, setStreamText] = useState('')

  const [recipeName, setRecipeName] = useState('')
  const [recipeCalories, setRecipeCalories] = useState('')
  const [generatingRecipe, setGeneratingRecipe] = useState(false)
  const [suggestedRecipe, setSuggestedRecipe] = useState(null)
  const [saving, setSaving] = useState(false)

  const handleSuggestMeals = async () => {
    setStreamText('')
    setStreaming(true)
    try {
      await streamMealSuggestions(
        { meal_slot: slot, additional_context: context || null },
        (chunk) => setStreamText(prev => prev + chunk),
        () => setStreaming(false),
      )
    } catch {
      message.error('Failed to get suggestions')
      setStreaming(false)
    }
  }

  const handleGenerateRecipe = async () => {
    if (!recipeName) return
    setGeneratingRecipe(true)
    setSuggestedRecipe(null)
    try {
      const { data } = await suggestRecipe({
        name: recipeName,
        target_calories: recipeCalories ? Number(recipeCalories) : null,
      })
      setSuggestedRecipe(data)
    } catch {
      message.error('Failed to generate recipe')
    } finally {
      setGeneratingRecipe(false)
    }
  }

  const handleSaveRecipe = async () => {
    setSaving(true)
    try {
      await saveSuggestedRecipe(suggestedRecipe)
      message.success('Recipe saved to your library!')
      setSuggestedRecipe(null)
      setRecipeName('')
    } catch {
      message.error('Failed to save recipe')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Drawer
      title={<Space><RobotOutlined style={{ color: '#52c41a' }} /> AI Meal Assistant</Space>}
      open={open}
      onClose={onClose}
      width={Math.min(480, window.innerWidth)}
    >
      <Typography.Title level={5}>Meal Suggestions</Typography.Title>
      <Space.Compact style={{ width: '100%', marginBottom: 8 }}>
        <Select
          value={slot}
          onChange={setSlot}
          options={SLOTS.map(s => ({ value: s, label: s.charAt(0).toUpperCase() + s.slice(1) }))}
          style={{ width: 140 }}
        />
        <Input
          placeholder="Optional: 'I have chicken and spinach...'"
          value={context}
          onChange={e => setContext(e.target.value)}
        />
      </Space.Compact>
      <Button
        type="primary"
        icon={<SendOutlined />}
        onClick={handleSuggestMeals}
        loading={streaming}
        block
        style={{ marginBottom: 16 }}
      >
        {streaming ? 'Generating...' : 'Get Meal Ideas'}
      </Button>

      {(streamText || streaming) && (
        <MealSuggestionOutput text={streamText} streaming={streaming} />
      )}

      <Divider />

      <Typography.Title level={5}>Generate a Recipe</Typography.Title>
      <Input
        placeholder="Recipe name (e.g. 'High-protein chicken bowl')"
        value={recipeName}
        onChange={e => setRecipeName(e.target.value)}
        style={{ marginBottom: 8 }}
      />
      <Input
        placeholder="Target calories per serving (optional)"
        value={recipeCalories}
        onChange={e => setRecipeCalories(e.target.value)}
        type="number"
        style={{ marginBottom: 8 }}
      />
      <Button
        onClick={handleGenerateRecipe}
        loading={generatingRecipe}
        disabled={!recipeName}
        block
        style={{ marginBottom: 16 }}
      >
        Generate Recipe
      </Button>

      {suggestedRecipe && (
        <Card
          size="small"
          title={<span style={{ color: '#F1F5F9', fontWeight: 600 }}>{suggestedRecipe.name}</span>}
          extra={<Button type="primary" size="small" onClick={handleSaveRecipe} loading={saving}>Save to Library</Button>}
          style={{ border: '1px solid #334155' }}
        >
          <p style={{ fontSize: 13, color: '#94A3B8', marginBottom: 8 }}>{suggestedRecipe.description}</p>
          <div style={{ fontSize: 12, color: '#64748B' }}>
            Servings: {suggestedRecipe.servings} · Ingredients: {suggestedRecipe.ingredients?.length}
          </div>
          {suggestedRecipe.tags?.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 8 }}>
              {suggestedRecipe.tags.map(tag => (
                <span key={tag} style={{
                  background: 'rgba(52, 211, 153, 0.08)',
                  border: '1px solid rgba(52, 211, 153, 0.2)',
                  borderRadius: 20,
                  padding: '1px 8px',
                  fontSize: 11,
                  color: '#34D399',
                }}>
                  {tag}
                </span>
              ))}
            </div>
          )}
        </Card>
      )}
    </Drawer>
  )
}
