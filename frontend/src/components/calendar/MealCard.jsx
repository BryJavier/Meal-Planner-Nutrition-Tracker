import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Card, Popconfirm, Typography } from 'antd'
import { DeleteOutlined, HolderOutlined } from '@ant-design/icons'
import { deleteEntry } from '../../api/mealPlans'

export default function MealCard({ entry, planId, onRemove }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: entry.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    marginBottom: 4,
    cursor: 'grab',
  }

  const handleRemove = async (e) => {
    e?.stopPropagation()
    await deleteEntry(planId, entry.id)
    onRemove(entry.id)
  }

  const recipe = entry.recipe
  const n = recipe?.nutrition_per_serving

  return (
    <div ref={setNodeRef} style={style} {...attributes}>
      <Card
        size="small"
        bodyStyle={{ padding: '6px 8px' }}
        style={{ borderRadius: 6, background: '#273549', borderColor: '#334155', boxShadow: isDragging ? '0 4px 16px rgba(0,0,0,0.5)' : 'none' }}
        extra={
          <Popconfirm title="Remove?" onConfirm={handleRemove} onPopupClick={e => e.stopPropagation()}>
            <DeleteOutlined style={{ color: '#ff4d4f', fontSize: 12 }} onClick={e => e.stopPropagation()} />
          </Popconfirm>
        }
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <HolderOutlined {...listeners} style={{ cursor: 'grab', color: '#475569' }} />
          <div>
            <Typography.Text style={{ fontSize: 12, fontWeight: 500, color: '#F1F5F9' }}>{recipe?.name}</Typography.Text>
            {n && (
              <div style={{ fontSize: 11, color: '#94A3B8' }}>
                {n.calories} kcal · ×{entry.servings}
              </div>
            )}
          </div>
        </div>
      </Card>
    </div>
  )
}
