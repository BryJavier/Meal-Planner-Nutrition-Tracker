import { useState } from 'react'
import { Drawer, Select, Input, Button, Typography, Divider, Space, Spin, message, Card } from 'antd'
import { SendOutlined, RobotOutlined } from '@ant-design/icons'
import { streamMealSuggestions, suggestRecipe, saveSuggestedRecipe } from '../../api/ai'

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
      width={480}
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
        <Card size="small" style={{ background: '#f6ffed', marginBottom: 16, whiteSpace: 'pre-wrap', fontFamily: 'monospace', fontSize: 13 }}>
          {streamText}
          {streaming && <Spin size="small" style={{ marginLeft: 4 }} />}
        </Card>
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
          title={suggestedRecipe.name}
          extra={<Button type="primary" size="small" onClick={handleSaveRecipe} loading={saving}>Save to Library</Button>}
        >
          <p style={{ fontSize: 13, color: '#555' }}>{suggestedRecipe.description}</p>
          <div style={{ fontSize: 12, color: '#888' }}>
            Servings: {suggestedRecipe.servings} · Ingredients: {suggestedRecipe.ingredients?.length}
          </div>
          <div style={{ fontSize: 12, marginTop: 4, color: '#888' }}>
            Tags: {suggestedRecipe.tags?.join(', ')}
          </div>
        </Card>
      )}
    </Drawer>
  )
}
