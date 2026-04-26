import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Card, Descriptions, Tag, Table, Typography, Button, Spin, Statistic, Row, Col } from 'antd'
import { ArrowLeftOutlined, EditOutlined } from '@ant-design/icons'
import { getRecipe } from '../api/recipes'
import RecipeForm from '../components/recipes/RecipeForm'
import useIsMobile from '../hooks/useIsMobile'

// ── Ingredient card for mobile ──────────────────────────────────────────────
function IngredientCard({ record }) {
  return (
    <div style={{
      background: '#1E293B',
      border: '1px solid #334155',
      borderRadius: 8,
      padding: '10px 12px',
      marginBottom: 8,
    }}>
      <Typography.Text strong style={{ color: '#F1F5F9', display: 'block', marginBottom: 6 }}>
        {record.ingredient_name}
      </Typography.Text>

      <div style={{ fontSize: 12, color: '#94A3B8', marginBottom: 6 }}>
        {record.display_amount
          ? `${record.display_amount} ${record.display_unit || ''}`.trim()
          : `${record.quantity_g}g`}
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
        {[
          { label: 'kcal', value: record.calories, bg: '#7c3aed' },
          { label: 'P', value: `${record.protein}g`, bg: '#0369a1' },
          { label: 'C', value: `${record.carbs}g`, bg: '#b45309' },
          { label: 'F', value: `${record.fat}g`, bg: '#065f46' },
        ].map(({ label, value, bg }) => (
          <span key={label} style={{
            display: 'inline-flex', alignItems: 'center', gap: 3,
            padding: '2px 8px', borderRadius: 20, fontSize: 11,
            fontWeight: 500, color: '#F1F5F9', background: bg,
          }}>
            {label} <strong>{value}</strong>
          </span>
        ))}
      </div>
    </div>
  )
}

export default function RecipeDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [recipe, setRecipe] = useState(null)
  const [loading, setLoading] = useState(true)
  const [editOpen, setEditOpen] = useState(false)
  const isMobile = useIsMobile()

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

  const tableColumns = [
    { title: 'Ingredient', dataIndex: 'ingredient_name' },
    { title: 'Amount', render: (_, r) => r.display_amount ? `${r.display_amount} ${r.display_unit || ''}`.trim() : `${r.quantity_g}g` },
    { title: 'Calories', dataIndex: 'calories', render: v => `${v} kcal` },
    { title: 'Protein', dataIndex: 'protein', render: v => `${v}g` },
    { title: 'Carbs', dataIndex: 'carbs', render: v => `${v}g` },
    { title: 'Fat', dataIndex: 'fat', render: v => `${v}g` },
  ]

  return (
    <div>
      <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/recipes')} style={{ marginBottom: 16 }}>
        Back to Recipes
      </Button>

      <Card
        title={<Typography.Title level={3} style={{ margin: 0, whiteSpace: 'normal', wordBreak: 'break-word' }}>{recipe.name}</Typography.Title>}
        extra={<Button icon={<EditOutlined />} onClick={() => setEditOpen(true)}>Edit</Button>}
      >
        {recipe.description && <Typography.Paragraph>{recipe.description}</Typography.Paragraph>}

        <Descriptions size="small" style={{ marginBottom: 16 }}>
          <Descriptions.Item label="Servings">{recipe.servings}</Descriptions.Item>
          {recipe.prep_time_minutes && <Descriptions.Item label="Prep">{recipe.prep_time_minutes} min</Descriptions.Item>}
          {recipe.cook_time_minutes && <Descriptions.Item label="Cook">{recipe.cook_time_minutes} min</Descriptions.Item>}
        </Descriptions>

        {recipe.tags?.length > 0 && (
          <div style={{ marginBottom: 16, display: 'flex', flexWrap: 'wrap', gap: 4 }}>
            {recipe.tags.map(t => <Tag key={t} color="green" style={{ margin: 0 }}>{t}</Tag>)}
          </div>
        )}

        {/* Macro stats — 2×2 grid on mobile, single row on desktop */}
        {n && (
          <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
            <Col xs={12} sm={6}><Statistic title="Calories" value={n.calories} suffix="kcal" /></Col>
            <Col xs={12} sm={6}><Statistic title="Protein" value={n.protein_g} suffix="g" /></Col>
            <Col xs={12} sm={6}><Statistic title="Carbs" value={n.carbs_g} suffix="g" /></Col>
            <Col xs={12} sm={6}><Statistic title="Fat" value={n.fat_g} suffix="g" /></Col>
          </Row>
        )}

        {/* Ingredient list: cards on mobile, table on desktop */}
        <Typography.Title level={5} style={{ marginBottom: 8 }}>Ingredients</Typography.Title>
        {isMobile ? (
          <div>
            {recipe.ingredients?.map((ing) => (
              <IngredientCard key={ing.id} record={ing} />
            ))}
          </div>
        ) : (
          <Table
            size="small"
            dataSource={recipe.ingredients}
            rowKey="id"
            pagination={false}
            columns={tableColumns}
          />
        )}

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
