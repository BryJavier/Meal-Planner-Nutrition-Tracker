import { Form, Input, Button, Card, Typography, message } from 'antd'
import { Link, useNavigate } from 'react-router-dom'
import { register } from '../api/auth'
import useAuthStore from '../store/authStore'
import AppLogo from '../components/AppLogo'

export default function RegisterPage() {
  const navigate = useNavigate()
  const { setAuth } = useAuthStore()
  const [form] = Form.useForm()

  const onFinish = async (values) => {
    try {
      const { data } = await register(values)
      setAuth(null, data.access_token, data.refresh_token)
      navigate('/dashboard')
    } catch (err) {
      message.error(err.response?.data?.detail || 'Registration failed')
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
      <Card style={{ width: '100%', maxWidth: 420 }}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 12 }}>
            <AppLogo size={56} variant="badge" />
          </div>
          <Typography.Title level={3} style={{ margin: 0, color: '#34D399' }}>
            Create Account
          </Typography.Title>
          <Typography.Text style={{ color: '#64748B' }}>Start tracking your nutrition today</Typography.Text>
        </div>
        <Form form={form} layout="vertical" onFinish={onFinish} size="large">
          <Form.Item name="email" label="Email" rules={[{ required: true, type: 'email' }]}>
            <Input inputMode="email" autoComplete="email" />
          </Form.Item>
          <Form.Item name="username" label="Username" rules={[{ required: true, min: 3 }]}>
            <Input autoComplete="username" />
          </Form.Item>
          <Form.Item name="password" label="Password" rules={[{ required: true, min: 8 }]}>
            <Input.Password autoComplete="new-password" />
          </Form.Item>
          <Form.Item style={{ marginBottom: 8 }}>
            <Button type="primary" htmlType="submit" block>Create Account</Button>
          </Form.Item>
        </Form>
        <Typography.Text style={{ color: '#64748B' }}>
          Already have an account?{' '}
          <Link to="/login" style={{ color: '#34D399' }}>Log In</Link>
        </Typography.Text>
      </Card>
    </div>
  )
}
