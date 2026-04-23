import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Card, Descriptions, Tag, Table, Typography, Button, Spin, Statistic, Row, Col } from 'antd'
import { ArrowLeftOutlined, EditOutlined } from '@ant-design/icons'
import { getRecipe } from '../api/recipes'
import RecipeForm from '../components/recipes/RecipeForm'

export default function RecipeDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [recipe, setRecipe] = useState(null)
  const [loading, setLoading] = useState(true)
  const [editOpen, setEditOpen] = useState(false)

  const fetch = async () => {
    setLoading(true)
    try {
      const { data } = await getRecipe(id)
      setRecipe(data)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetch() }, [id])

  if (loading) return <Spin />
  if (!recipe) return null

  const n = recipe.nutrition_per_serving

  return (
    <div>
      <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/recipes')} style={{ marginBottom: 16 }}>
        Back to Recipes
      </Button>

      <Card
        title={<Typography.Title level={3} style={{ margin: 0 }}>{recipe.name}</Typography.Title>}
        extra={<Button icon={<EditOutlined />} onClick={() => setEditOpen(true)}>Edit</Button>}
      >
        {recipe.description && <Typography.Paragraph>{recipe.description}</Typography.Paragraph>}

        <Descriptions size="small" style={{ marginBottom: 16 }}>
          <Descriptions.Item label="Servings">{recipe.servings}</Descriptions.Item>
          {recipe.prep_time_minutes && <Descriptions.Item label="Prep">{recipe.prep_time_minutes} min</Descriptions.Item>}
          {recipe.cook_time_minutes && <Descriptions.Item label="Cook">{recipe.cook_time_minutes} min</Descriptions.Item>}
        </Descriptions>

        {recipe.tags?.length > 0 && (
          <div style={{ marginBottom: 16 }}>
            {recipe.tags.map(t => <Tag key={t} color="green">{t}</Tag>)}
          </div>
        )}

        {n && (
          <Row gutter={16} style={{ marginBottom: 16 }}>
            <Col><Statistic title="Calories" value={n.calories} suffix="kcal" /></Col>
            <Col><Statistic title="Protein" value={n.protein_g} suffix="g" /></Col>
            <Col><Statistic title="Carbs" value={n.carbs_g} suffix="g" /></Col>
            <Col><Statistic title="Fat" value={n.fat_g} suffix="g" /></Col>
          </Row>
        )}

        <Table
          size="small"
          dataSource={recipe.ingredients}
          rowKey="id"
          pagination={false}
          columns={[
            { title: 'Ingredient', dataIndex: 'ingredient_name' },
            { title: 'Amount', render: (_, r) => r.display_amount ? `${r.display_amount} ${r.display_unit || ''}` : `${r.quantity_g}g` },
            { title: 'Calories', dataIndex: 'calories', render: v => `${v} kcal` },
            { title: 'Protein', dataIndex: 'protein', render: v => `${v}g` },
            { title: 'Carbs', dataIndex: 'carbs', render: v => `${v}g` },
            { title: 'Fat', dataIndex: 'fat', render: v => `${v}g` },
          ]}
        />

        {recipe.instructions && (
          <div style={{ marginTop: 24 }}>
            <Typography.Title level={5}>Instructions</Typography.Title>
            <Typography.Paragraph style={{ whiteSpace: 'pre-line' }}>{recipe.instructions}</Typography.Paragraph>
          </div>
        )}
      </Card>

      <RecipeForm open={editOpen} recipe={recipe} onClose={() => setEditOpen(false)} onSaved={() => { setEditOpen(false); fetch() }} />
    </div>
  )
}
