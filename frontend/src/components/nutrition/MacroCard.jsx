import { Card, Statistic, Progress } from 'antd'

const COLORS = {
  calories: '#fb923c',
  protein:  '#60a5fa',
  carbs:    '#fbbf24',
  fat:      '#4ade80',
}

export default function MacroCard({ label, actual, goal, unit, colorKey }) {
  const color = COLORS[colorKey] || '#34D399'
  const percent = goal ? Math.min(Math.round((actual / goal) * 100), 100) : null

  return (
    <Card size="small" style={{ textAlign: 'center' }}>
      <Statistic
        title={label}
        value={actual}
        suffix={unit}
        valueStyle={{ color, fontSize: 22, fontWeight: 700 }}
      />
      {goal && (
        <>
          <div style={{ fontSize: 12, color: '#94A3B8', marginTop: 4 }}>Goal: {goal}{unit}</div>
          <Progress
            percent={percent}
            strokeColor={color}
            trailColor="#334155"
            showInfo={false}
            size="small"
            style={{ marginTop: 4 }}
          />
        </>
      )}
    </Card>
  )
}
