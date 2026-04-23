import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts'

const COLORS = ['#60a5fa', '#fbbf24', '#4ade80']
const DARK = { tooltip: '#1E293B', border: '#334155', text: '#94A3B8' }

export default function MacroPieChart({ protein, carbs, fat }) {
  const data = [
    { name: 'Protein', value: Number((protein * 4).toFixed(1)) },
    { name: 'Carbs', value: Number((carbs * 4).toFixed(1)) },
    { name: 'Fat', value: Number((fat * 9).toFixed(1)) },
  ].filter(d => d.value > 0)

  return (
    <ResponsiveContainer width="100%" height={220}>
      <PieChart>
        <Pie
          data={data}
          dataKey="value"
          nameKey="name"
          cx="50%"
          cy="50%"
          outerRadius={80}
          innerRadius={36}
          paddingAngle={2}
          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
          labelLine={{ stroke: DARK.text }}
        >
          {data.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
        </Pie>
        <Tooltip
          formatter={(v) => `${v} kcal`}
          contentStyle={{ background: DARK.tooltip, border: `1px solid ${DARK.border}`, borderRadius: 8, color: '#F1F5F9' }}
          labelStyle={{ color: '#F1F5F9', fontWeight: 600 }}
        />
        <Legend wrapperStyle={{ color: DARK.text, fontSize: 12 }} />
      </PieChart>
    </ResponsiveContainer>
  )
}
