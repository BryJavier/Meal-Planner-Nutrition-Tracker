import { useEffect, useState } from 'react'
import { Row, Col, Card, Typography, Spin, Button, Form, InputNumber, message } from 'antd'
import { SettingOutlined } from '@ant-design/icons'
import { getNutritionSummary, getWeeklyNutrition } from '../api/nutrition'
import { updateMe } from '../api/auth'
import useAuthStore from '../store/authStore'
import MacroCard from '../components/nutrition/MacroCard'
import MacroPieChart from '../components/nutrition/MacroPieChart'
import WeeklyBarChart from '../components/nutrition/WeeklyBarChart'

export default function DashboardPage() {
  const { user, setUser } = useAuthStore()
  const [summary, setSummary] = useState(null)
  const [weekly, setWeekly] = useState([])
  const [loading, setLoading] = useState(true)
  const [editGoals, setEditGoals] = useState(false)
  const [form] = Form.useForm()

  useEffect(() => {
    Promise.all([getNutritionSummary(), getWeeklyNutrition()])
      .then(([s, w]) => { setSummary(s.data); setWeekly(w.data) })
      .finally(() => setLoading(false))
  }, [])

  const saveGoals = async (values) => {
    try {
      const { data } = await updateMe(values)
      setUser(data)
      message.success('Goals updated')
      setEditGoals(false)
      const s = await getNutritionSummary()
      setSummary(s.data)
    } catch {
      message.error('Failed to update goals')
    }
  }

  if (loading) return <Spin />

  const a = summary?.actuals || {}
  const g = summary?.goals || {}

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Typography.Title level={3} style={{ margin: 0 }}>Today's Nutrition</Typography.Title>
        <Button icon={<SettingOutlined />} onClick={() => { setEditGoals(true); form.setFieldsValue(g) }}>
          Set Goals
        </Button>
      </div>

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={12} sm={6}><MacroCard label="Calories" actual={a.calories || 0} goal={g.calories} unit="kcal" colorKey="calories" /></Col>
        <Col xs={12} sm={6}><MacroCard label="Protein" actual={a.protein_g || 0} goal={g.protein_g} unit="g" colorKey="protein" /></Col>
        <Col xs={12} sm={6}><MacroCard label="Carbs" actual={a.carbs_g || 0} goal={g.carbs_g} unit="g" colorKey="carbs" /></Col>
        <Col xs={12} sm={6}><MacroCard label="Fat" actual={a.fat_g || 0} goal={g.fat_g} unit="g" colorKey="fat" /></Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} md={10}>
          <Card title="Calorie Split">
            <MacroPieChart protein={a.protein_g || 0} carbs={a.carbs_g || 0} fat={a.fat_g || 0} />
          </Card>
        </Col>
        <Col xs={24} md={14}>
          <Card title="This Week">
            <WeeklyBarChart data={weekly} calorieGoal={g.calories} />
          </Card>
        </Col>
      </Row>

      {editGoals && (
        <Card title="Daily Goals" style={{ marginTop: 24 }}>
          <Form form={form} layout="vertical" onFinish={saveGoals}>
            <Row gutter={[16, 0]}>
              <Col xs={12} sm={6}>
                <Form.Item name="calorie_goal" label="Calories (kcal)">
                  <InputNumber min={0} style={{ width: '100%' }} inputMode="numeric" />
                </Form.Item>
              </Col>
              <Col xs={12} sm={6}>
                <Form.Item name="protein_goal_g" label="Protein (g)">
                  <InputNumber min={0} style={{ width: '100%' }} inputMode="numeric" />
                </Form.Item>
              </Col>
              <Col xs={12} sm={6}>
                <Form.Item name="carbs_goal_g" label="Carbs (g)">
                  <InputNumber min={0} style={{ width: '100%' }} inputMode="numeric" />
                </Form.Item>
              </Col>
              <Col xs={12} sm={6}>
                <Form.Item name="fat_goal_g" label="Fat (g)">
                  <InputNumber min={0} style={{ width: '100%' }} inputMode="numeric" />
                </Form.Item>
              </Col>
            </Row>
            <Form.Item style={{ marginBottom: 0 }}>
              <Button type="primary" htmlType="submit">Save Goals</Button>
            </Form.Item>
          </Form>
        </Card>
      )}
    </div>
  )
}
