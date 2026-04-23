import { Form, Input, Button, Card, Typography, message } from 'antd'
import { Link, useNavigate } from 'react-router-dom'
import { login } from '../api/auth'
import useAuthStore from '../store/authStore'

export default function LoginPage() {
  const navigate = useNavigate()
  const { setAuth } = useAuthStore()
  const [form] = Form.useForm()

  const onFinish = async (values) => {
    try {
      const { data } = await login(values)
      setAuth(null, data.access_token, data.refresh_token)
      navigate('/dashboard')
    } catch {
      message.error('Invalid email or password')
    }
  }

  return (
    <div style={{
      minHeight: '100dvh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#0F172A',
      padding: '16px',
    }}>
      <Card style={{ width: '100%', maxWidth: 400 }}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <Typography.Title level={3} style={{ margin: 0, color: '#34D399' }}>
            MealPlanner
          </Typography.Title>
          <Typography.Text style={{ color: '#64748B' }}>Track your nutrition, reach your goals</Typography.Text>
        </div>
        <Form form={form} layout="vertical" onFinish={onFinish} size="large">
          <Form.Item name="email" label="Email" rules={[{ required: true, type: 'email' }]}>
            <Input inputMode="email" autoComplete="email" />
          </Form.Item>
          <Form.Item name="password" label="Password" rules={[{ required: true }]}>
            <Input.Password autoComplete="current-password" />
          </Form.Item>
          <Form.Item style={{ marginBottom: 8 }}>
            <Button type="primary" htmlType="submit" block>Log In</Button>
          </Form.Item>
        </Form>
        <Typography.Text style={{ color: '#64748B' }}>
          Don't have an account?{' '}
          <Link to="/register" style={{ color: '#34D399' }}>Register</Link>
        </Typography.Text>
      </Card>
    </div>
  )
}
