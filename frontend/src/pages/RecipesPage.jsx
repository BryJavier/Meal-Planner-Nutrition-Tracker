import { useEffect, useState } from 'react'
import {
  Row, Col, Input, Button, Card, Tag, Typography,
  Popconfirm, message, Empty, Spin, InputNumber, Space,
} from 'antd'
import {
  PlusOutlined, SearchOutlined, DeleteOutlined, EditOutlined,
  RobotOutlined, LoadingOutlined, CheckCircleOutlined,
} from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { listRecipes, deleteRecipe } from '../api/recipes'
import { suggestRecipe, saveSuggestedRecipe } from '../api/ai'
import RecipeForm from '../components/recipes/RecipeForm'
import useIsMobile from '../hooks/useIsMobile'

// Scale ingredient quantities proportionally to the chosen servings
function scaleIngredients(ingredients, originalServings, newServings) {
  if (!ingredients || originalServings === newServings) return ingredients
  const ratio = newServings / originalServings
  return ingredients.map((ing) => ({
    ...ing,
    quantity_g: +(ing.quantity_g * ratio).toFixed(2),
    display_amount: ing.display_amount != null ? +(ing.display_amount * ratio).toFixed(2) : null,
  }))
}

// Sum up macros from scaled ingredient list (returns per-serving values)
function computeMacros(ingredients, servings) {
  let calories = 0, protein = 0, carbs = 0, fat = 0
  for (const ing of ingredients ?? []) {
    const f = (ing.quantity_g ?? 0) / 100
    calories += (ing.calories_per_100g ?? 0) * f
    protein  += (ing.protein_per_100g  ?? 0) * f
    carbs    += (ing.carbs_per_100g    ?? 0) * f
    fat      += (ing.fat_per_100g      ?? 0) * f
  }
  const s = servings || 1
  return {
    calories: +(calories / s).toFixed(1),
    protein:  +(protein  / s).toFixed(1),
    carbs:    +(carbs    / s).toFixed(1),
    fat:      +(fat      / s).toFixed(1),
  }
}

function AIRecipePanel({ onSaved, isMobile }) {
  const [recipeName, setRecipeName] = useState('')
  const [targetCalories, setTargetCalories] = useState(null)
  const [generating, setGenerating] = useState(false)
  const [saving, setSaving] = useState(false)
  const [result, setResult] = useState(null)
  const [selectedServings, setSelectedServings] = useState(1)

  const handleGenerate = async () => {
    if (!recipeName.trim()) return
    setGenerating(true)
    setResult(null)
    try {
      const { data } = await suggestRecipe({
        name: recipeName,
        target_calories: targetCalories || null,
      })
      setResult(data)
      setSelectedServings(data.servings || 1)
    } catch {
      message.error('Failed to generate recipe — check your Anthropic API key in Settings')
    } finally {
      setGenerating(false)
    }
  }

  // Build the scaled version of the result to save / preview
  const scaledResult = result ? {
    ...result,
    servings: selectedServings,
    ingredients: scaleIngredients(result.ingredients, result.servings, selectedServings),
  } : null

  const macros = scaledResult ? computeMacros(scaledResult.ingredients, selectedServings) : null

  const handleSave = async () => {
    setSaving(true)
    try {
      await saveSuggestedRecipe(scaledResult)
      message.success(`"${result.name}" saved to your recipe library!`)
      setResult(null)
      setRecipeName('')
      setTargetCalories(null)
      onSaved()
    } catch {
      message.error('Failed to save recipe')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div style={{
      background: 'rgba(5, 150, 105, 0.05)',
      border: '1px solid rgba(52, 211, 153, 0.2)',
      borderRadius: 12,
      padding: '20px 24px',
      marginBottom: 24,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
        <RobotOutlined style={{ color: '#34D399', fontSize: 16 }} />
        <Typography.Text strong style={{ color: '#34D399', fontSize: 15 }}>
          Generate a Recipe with AI
        </Typography.Text>
      </div>

      <Row gutter={[12, 12]} align="bottom">
        <Col xs={24} sm={24} md={10} lg={11}>
          <Typography.Text style={{ display: 'block', marginBottom: 4, fontSize: 12, color: '#64748B' }}>
            Recipe name or idea
          </Typography.Text>
          <Input
            placeholder='e.g. "High-protein chicken bowl" or "quick oat breakfast"'
            value={recipeName}
            onChange={(e) => setRecipeName(e.target.value)}
            onPressEnter={handleGenerate}
            disabled={generating}
          />
        </Col>
        <Col xs={24} sm={24} md={7} lg={7}>
          <Typography.Text style={{ display: 'block', marginBottom: 4, fontSize: 12, color: '#64748B' }}>
            Target kcal (optional)
          </Typography.Text>
          <InputNumber
            placeholder="e.g. 500"
            value={targetCalories}
            onChange={setTargetCalories}
            min={50}
            max={3000}
            style={{ width: '100%' }}
            disabled={generating}
          />
        </Col>
        <Col xs={24} sm={24} md={7} lg={6}>
          <Button
            type="primary"
            onClick={handleGenerate}
            disabled={!recipeName.trim() || generating}
            icon={generating ? <LoadingOutlined /> : <RobotOutlined />}
            block={isMobile}
            style={!isMobile ? { marginTop: 22 } : {}}
          >
            {generating ? 'Generating…' : 'Generate'}
          </Button>
        </Col>
      </Row>

      {result && (
        <div style={{
          marginTop: 16,
          background: '#1E293B',
          border: '1px solid #334155',
          borderRadius: 10,
          padding: '16px 18px',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
            <Typography.Text strong style={{ color: '#F1F5F9', fontSize: 15 }}>
              {result.name}
            </Typography.Text>
            <Button
              type="primary"
              size="small"
              icon={<CheckCircleOutlined />}
              onClick={handleSave}
              loading={saving}
            >
              Save to Library
            </Button>
          </div>

          {result.description && (
            <Typography.Text style={{ color: '#94A3B8', fontSize: 13, display: 'block', marginBottom: 10 }}>
              {result.description}
            </Typography.Text>
          )}

          {/* Servings picker */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
            <Typography.Text style={{ fontSize: 12, color: '#64748B' }}>Servings:</Typography.Text>
            <InputNumber
              min={1}
              max={20}
              value={selectedServings}
              onChange={(v) => v && setSelectedServings(v)}
              size="small"
              style={{ width: 64 }}
            />
            <Typography.Text style={{ fontSize: 12, color: '#64748B' }}>
              · {result.ingredients?.length} ingredients
              {result.prep_time_minutes ? ` · ${result.prep_time_minutes}m prep` : ''}
              {result.cook_time_minutes ? ` · ${result.cook_time_minutes}m cook` : ''}
            </Typography.Text>
          </div>

          {/* Live macro pills (per serving) */}
          {macros && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
              {[
                { label: 'kcal', value: macros.calories, bg: '#7c3aed' },
                { label: 'P', value: `${macros.protein}g`, bg: '#0369a1' },
                { label: 'C', value: `${macros.carbs}g`, bg: '#b45309' },
                { label: 'F', value: `${macros.fat}g`, bg: '#065f46' },
              ].map(({ label, value, bg }) => (
                <span key={label} style={{
                  display: 'inline-flex', alignItems: 'center', gap: 3,
                  padding: '2px 8px', borderRadius: 20, fontSize: 11,
                  fontWeight: 500, color: '#F1F5F9', background: bg,
                }}>
                  {label} <strong>{value}</strong>
                </span>
              ))}
              <span style={{ fontSize: 11, color: '#64748B', alignSelf: 'center' }}>per serving</span>
            </div>
          )}

          {result.tags?.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
              {result.tags.map((t) => (
                <Tag key={t} color="green" style={{ margin: 0 }}>{t}</Tag>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default function RecipesPage() {
  const [recipes, setRecipes] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editingRecipe, setEditingRecipe] = useState(null)
  const [showAI, setShowAI] = useState(false)
  const navigate = useNavigate()
  const isMobile = useIsMobile()

  const fetchRecipes = async () => {
    setLoading(true)
    try {
      const { data } = await listRecipes({ search: search || undefined })
      setRecipes(data)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchRecipes() }, [search])

  const handleDelete = async (id) => {
    await deleteRecipe(id)
    message.success('Recipe deleted')
    fetchRecipes()
  }

  return (
    <div>
      {/* Header */}
      <Typography.Title level={3} style={{ margin: '0 0 12px 0' }}>My Recipes</Typography.Title>
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        <Button
          icon={<RobotOutlined />}
          onClick={() => setShowAI(v => !v)}
          style={{ flex: 1, ...(showAI ? { borderColor: '#34D399', color: '#34D399' } : {}) }}
        >
          {showAI ? 'Hide AI' : 'AI Suggest'}
        </Button>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => { setEditingRecipe(null); setShowForm(true) }}
          style={{ flex: 1 }}
        >
          Add Manually
        </Button>
      </div>

      {/* Inline AI panel */}
      {showAI && (
        <AIRecipePanel onSaved={() => { fetchRecipes(); setShowAI(false) }} isMobile={isMobile} />
      )}

      {/* Search */}
      <Input
        prefix={<SearchOutlined />}
        placeholder="Search recipes..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        style={{ marginBottom: 16, width: '100%' }}
        allowClear
      />

      {/* Recipe grid */}
      {loading ? <Spin /> : recipes.length === 0 ? (
        <Empty description="No recipes yet — add one manually or generate with AI!" />
      ) : (
        <Row gutter={[16, 16]}>
          {recipes.map((recipe) => (
            <Col xs={24} sm={12} lg={8} key={recipe.id}>
              <Card
                hoverable
                onClick={() => navigate(`/recipes/${recipe.id}`)}
                actions={[
                  <EditOutlined
                    key="edit"
                    onClick={(e) => { e.stopPropagation(); setEditingRecipe(recipe); setShowForm(true) }}
                  />,
                  <Popconfirm
                    key="delete"
                    title="Delete this recipe?"
                    onConfirm={(e) => { e?.stopPropagation(); handleDelete(recipe.id) }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <DeleteOutlined style={{ color: '#ff4d4f' }} />
                  </Popconfirm>,
                ]}
              >
                <Card.Meta
                  title={
                    <span style={{ display: 'flex', alignItems: 'flex-start', gap: 6, whiteSpace: 'normal', wordBreak: 'break-word' }}>
                      <span>{recipe.name}</span>
                      {recipe.is_ai_generated && (
                        <RobotOutlined style={{ fontSize: 12, color: '#34D399', opacity: 0.7, flexShrink: 0, marginTop: 3 }} />
                      )}
                    </span>
                  }
                  description={recipe.description || 'No description'}
                />
                <div style={{ marginTop: 12 }}>
                  {recipe.tags?.map((t) => <Tag key={t} color="green">{t}</Tag>)}
                </div>
                {recipe.nutrition_per_serving && (
                  <div style={{ marginTop: 8, fontSize: 12, color: '#64748B' }}>
                    {recipe.nutrition_per_serving.calories} kcal · {recipe.nutrition_per_serving.protein_g}g protein
                  </div>
                )}
              </Card>
            </Col>
          ))}
        </Row>
      )}

      <RecipeForm
        open={showForm}
        recipe={editingRecipe}
        onClose={() => setShowForm(false)}
        onSaved={() => { setShowForm(false); fetchRecipes() }}
      />
    </div>
  )
}
