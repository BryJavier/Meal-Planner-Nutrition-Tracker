import { useEffect, useState } from 'react'
import { Row, Col, Input, Button, Card, Tag, Typography, Popconfirm, message, Empty, Spin } from 'antd'
import { PlusOutlined, SearchOutlined, DeleteOutlined, EditOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { listRecipes, deleteRecipe } from '../api/recipes'
import RecipeForm from '../components/recipes/RecipeForm'

export default function RecipesPage() {
  const [recipes, setRecipes] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editingRecipe, setEditingRecipe] = useState(null)
  const navigate = useNavigate()

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
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <Typography.Title level={3} style={{ margin: 0 }}>My Recipes</Typography.Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => { setEditingRecipe(null); setShowForm(true) }}>
          New Recipe
        </Button>
      </div>

      <Input
        prefix={<SearchOutlined />}
        placeholder="Search recipes..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        style={{ marginBottom: 16, maxWidth: 360 }}
        allowClear
      />

      {loading ? <Spin /> : recipes.length === 0 ? (
        <Empty description="No recipes yet. Create your first one!" />
      ) : (
        <Row gutter={[16, 16]}>
          {recipes.map((recipe) => (
            <Col xs={24} sm={12} lg={8} key={recipe.id}>
              <Card
                hoverable
                onClick={() => navigate(`/recipes/${recipe.id}`)}
                actions={[
                  <EditOutlined key="edit" onClick={(e) => { e.stopPropagation(); setEditingRecipe(recipe); setShowForm(true) }} />,
                  <Popconfirm key="delete" title="Delete this recipe?" onConfirm={(e) => { e?.stopPropagation(); handleDelete(recipe.id) }} onClick={(e) => e.stopPropagation()}>
                    <DeleteOutlined style={{ color: '#ff4d4f' }} />
                  </Popconfirm>,
                ]}
              >
                <Card.Meta
                  title={recipe.name}
                  description={recipe.description || 'No description'}
                />
                <div style={{ marginTop: 12 }}>
                  {recipe.tags?.map((t) => <Tag key={t} color="green">{t}</Tag>)}
                </div>
                {recipe.nutrition_per_serving && (
                  <div style={{ marginTop: 8, fontSize: 12, color: '#888' }}>
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
