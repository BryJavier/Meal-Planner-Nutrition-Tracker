import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { Tag } from 'antd'
import MealCard from './MealCard'

const SLOT_COLORS = {
  breakfast: '#92400e',
  lunch:     '#14532d',
  dinner:    '#1e3a5f',
  snack:     '#3b1f5e',
}
const SLOT_TEXT = {
  breakfast: '#fbbf24',
  lunch:     '#4ade80',
  dinner:    '#60a5fa',
  snack:     '#c084fc',
}

export default function MealSlot({ planId, dayIndex, slot, entries, onRemove }) {
  const id = `${dayIndex}-${slot}`
  const { setNodeRef, isOver } = useDroppable({ id })

  return (
    <div
      ref={setNodeRef}
      style={{
        minHeight: 80,
        padding: '4px 0',
        borderRadius: 6,
        background: isOver ? 'rgba(52, 211, 153, 0.07)' : 'transparent',
        transition: 'background 0.15s',
      }}
    >
      <Tag style={{ marginBottom: 4, textTransform: 'capitalize', fontSize: 11, background: SLOT_COLORS[slot], color: SLOT_TEXT[slot], border: 'none' }}>
        {slot}
      </Tag>
      <SortableContext items={entries.map(e => e.id)} strategy={verticalListSortingStrategy}>
        {entries.map(entry => (
          <MealCard key={entry.id} entry={entry} planId={planId} onRemove={onRemove} />
        ))}
      </SortableContext>
    </div>
  )
}
