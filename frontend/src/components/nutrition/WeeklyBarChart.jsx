import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts'

const DARK = { grid: '#334155', text: '#94A3B8', tooltip: '#1E293B', border: '#334155' }

export default function WeeklyBarChart({ data, calorieGoal }) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={DARK.grid} vertical={false} />
        <XAxis dataKey="day" tick={{ fill: DARK.text, fontSize: 12 }} axisLine={{ stroke: DARK.grid }} tickLine={false} />
        <YAxis tick={{ fill: DARK.text, fontSize: 12 }} axisLine={{ stroke: DARK.grid }} tickLine={false} width={36} />
        <Tooltip
          contentStyle={{ background: DARK.tooltip, border: `1px solid ${DARK.border}`, borderRadius: 8, color: '#F1F5F9' }}
          labelStyle={{ color: '#F1F5F9', fontWeight: 600 }}
          cursor={{ fill: 'rgba(52,211,153,0.05)' }}
        />
        <Legend wrapperStyle={{ color: DARK.text, fontSize: 12 }} />
        {calorieGoal && <ReferenceLine y={calorieGoal} stroke="#f87171" strokeDasharray="4 4" label={{ value: 'Goal', fill: '#f87171', fontSize: 11 }} />}
        <Bar dataKey="protein_g" name="Protein (g)" stackId="a" fill="#60a5fa" radius={[0, 0, 0, 0]} />
        <Bar dataKey="carbs_g" name="Carbs (g)" stackId="a" fill="#fbbf24" />
        <Bar dataKey="fat_g" name="Fat (g)" stackId="a" fill="#4ade80" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}
