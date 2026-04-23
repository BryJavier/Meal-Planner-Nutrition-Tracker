import { Typography, Divider } from 'antd'
import MealSlot from './MealSlot'

const SLOTS = ['breakfast', 'lunch', 'dinner', 'snack']
const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

export default function DayColumn({ planId, dayIndex, dayDate, entries, onRemove }) {
  const isToday = dayDate === new Date().toISOString().slice(0, 10)

  return (
    <div
      style={{
        flex: '1 1 0',
        minWidth: 130,
        background: isToday ? 'rgba(5, 150, 105, 0.08)' : '#1E293B',
        border: isToday ? '2px solid #34D399' : '1px solid #334155',
        borderRadius: 8,
        padding: 8,
      }}
    >
      <Typography.Text strong style={{ fontSize: 13, color: isToday ? '#34D399' : '#F1F5F9' }}>
        {DAY_LABELS[dayIndex]}
      </Typography.Text>
      <div style={{ fontSize: 11, color: '#64748B', marginBottom: 8 }}>{dayDate}</div>

      {SLOTS.map((slot, i) => (
        <div key={slot}>
          <MealSlot
            planId={planId}
            dayIndex={dayIndex}
            slot={slot}
            entries={entries.filter(e => e.meal_slot === slot).sort((a, b) => a.position - b.position)}
            onRemove={onRemove}
          />
          {i < SLOTS.length - 1 && <Divider style={{ margin: '4px 0', borderColor: '#334155' }} />}
        </div>
      ))}
    </div>
  )
}
