import { useEffect, useState } from 'react'
import {
  Card, Form, Input, Button, Typography, Space, Popconfirm,
  Alert, Badge, message, Divider, Row, Col,
} from 'antd'
import {
  UserOutlined, LockOutlined, ApiOutlined,
  CheckCircleOutlined, WarningOutlined,
} from '@ant-design/icons'
import { getMe, updateMe, changePassword, updateApiKey } from '../api/auth'
import useAuthStore from '../store/authStore'

const { Title, Text } = Typography

export default function SettingsPage() {
  const { setUser } = useAuthStore()
  const [userData, setUserData] = useState(null)
  const [profileSaving, setProfileSaving] = useState(false)
  const [passwordSaving, setPasswordSaving] = useState(false)
  const [apiKeySaving, setApiKeySaving] = useState(false)
  const [apiKeyRemoving, setApiKeyRemoving] = useState(false)

  const [profileForm] = Form.useForm()
  const [passwordForm] = Form.useForm()
  const [apiKeyForm] = Form.useForm()

  useEffect(() => {
    getMe().then(({ data }) => {
      setUserData(data)
      profileForm.setFieldsValue({ username: data.username })
    })
  }, [])

  const saveProfile = async (values) => {
    setProfileSaving(true)
    try {
      const { data } = await updateMe({ username: values.username })
      setUser(data)
      setUserData(data)
      message.success('Profile updated')
    } catch (err) {
      const detail = err.response?.data?.detail
      if (detail === 'Username already taken') {
        profileForm.setFields([{ name: 'username', errors: ['Username already taken'] }])
      } else {
        message.error('Failed to update profile')
      }
    } finally {
      setProfileSaving(false)
    }
  }

  const savePassword = async (values) => {
    setPasswordSaving(true)
    try {
      await changePassword({ current_password: values.current_password, new_password: values.new_password })
      message.success('Password changed — please log in again if prompted')
      passwordForm.resetFields()
    } catch (err) {
      const detail = err.response?.data?.detail
      if (detail === 'Current password is incorrect') {
        passwordForm.setFields([{ name: 'current_password', errors: ['Incorrect password'] }])
      } else {
        message.error('Failed to change password')
      }
    } finally {
      setPasswordSaving(false)
    }
  }

  const saveApiKey = async (values) => {
    setApiKeySaving(true)
    try {
      const { data } = await updateApiKey({ api_key: values.api_key })
      setUserData(data)
      setUser(data)
      apiKeyForm.resetFields()
      message.success('API key saved')
    } catch {
      message.error('Failed to save API key')
    } finally {
      setApiKeySaving(false)
    }
  }

  const removeApiKey = async () => {
    setApiKeyRemoving(true)
    try {
      const { data } = await updateApiKey({ api_key: '' })
      setUserData(data)
      setUser(data)
      message.success('API key removed')
    } catch {
      message.error('Failed to remove API key')
    } finally {
      setApiKeyRemoving(false)
    }
  }

  const cardStyle = { marginBottom: 16 }
  const sectionIcon = (icon, title) => (
    <Space size={8}>
      {icon}
      <span>{title}</span>
    </Space>
  )

  return (
    <div style={{ maxWidth: 640, margin: '0 auto' }}>
      <Title level={3} style={{ marginBottom: 24 }}>Settings</Title>

      {/* ── Profile ──────────────────────────────────────── */}
      <Card title={sectionIcon(<UserOutlined />, 'Profile')} style={cardStyle}>
        <Form form={profileForm} layout="vertical" onFinish={saveProfile} size="large">
          <Form.Item label="Email">
            <Input value={userData?.email ?? ''} disabled autoComplete="off" />
          </Form.Item>
          <Form.Item
            name="username"
            label="Username"
            rules={[
              { required: true, message: 'Username is required' },
              { min: 3, message: 'At least 3 characters' },
              { max: 100, message: 'Max 100 characters' },
            ]}
          >
            <Input autoComplete="username" placeholder="Your display name" />
          </Form.Item>
          <Form.Item style={{ marginBottom: 0 }}>
            <Button type="primary" htmlType="submit" loading={profileSaving}>
              Save Profile
            </Button>
          </Form.Item>
        </Form>
      </Card>

      {/* ── Security ─────────────────────────────────────── */}
      <Card title={sectionIcon(<LockOutlined />, 'Security')} style={cardStyle}>
        <Form form={passwordForm} layout="vertical" onFinish={savePassword} size="large">
          <Form.Item
            name="current_password"
            label="Current Password"
            rules={[{ required: true, message: 'Enter your current password' }]}
          >
            <Input.Password autoComplete="current-password" />
          </Form.Item>
          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <Form.Item
                name="new_password"
                label="New Password"
                rules={[
                  { required: true, message: 'Enter a new password' },
                  { min: 8, message: 'At least 8 characters' },
                ]}
              >
                <Input.Password autoComplete="new-password" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item
                name="confirm_password"
                label="Confirm Password"
                dependencies={['new_password']}
                rules={[
                  { required: true, message: 'Confirm your new password' },
                  ({ getFieldValue }) => ({
                    validator(_, value) {
                      if (!value || getFieldValue('new_password') === value) return Promise.resolve()
                      return Promise.reject(new Error('Passwords do not match'))
                    },
                  }),
                ]}
              >
                <Input.Password autoComplete="new-password" />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item style={{ marginBottom: 0 }}>
            <Button type="primary" htmlType="submit" loading={passwordSaving}>
              Change Password
            </Button>
          </Form.Item>
        </Form>
      </Card>

      {/* ── AI Integration ───────────────────────────────── */}
      <Card title={sectionIcon(<ApiOutlined />, 'AI Integration')} style={cardStyle}>
        <Alert
          message="Your Anthropic API key powers AI meal suggestions. It is encrypted before being stored."
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
        />

        <div style={{ marginBottom: 16 }}>
          <Text style={{ color: '#94A3B8', fontSize: 13 }}>Status</Text>
          <div style={{ marginTop: 4 }}>
            {userData?.has_anthropic_key ? (
              <Space>
                <CheckCircleOutlined style={{ color: '#34D399' }} />
                <Text style={{ color: '#34D399' }}>API key saved</Text>
              </Space>
            ) : (
              <Space>
                <WarningOutlined style={{ color: '#FBBF24' }} />
                <Text style={{ color: '#FBBF24' }}>No API key set</Text>
              </Space>
            )}
          </div>
        </div>

        <Form form={apiKeyForm} layout="vertical" onFinish={saveApiKey} size="large">
          <Form.Item
            name="api_key"
            label={userData?.has_anthropic_key ? 'Replace API Key' : 'API Key'}
            rules={[{ required: true, message: 'Paste your Anthropic API key' }]}
            extra="Starts with sk-ant-… — find yours at console.anthropic.com"
          >
            <Input.Password
              placeholder="sk-ant-api03-…"
              autoComplete="off"
            />
          </Form.Item>
          <Form.Item style={{ marginBottom: 0 }}>
            <Space wrap>
              <Button type="primary" htmlType="submit" loading={apiKeySaving}>
                Save Key
              </Button>
              {userData?.has_anthropic_key && (
                <Popconfirm
                  title="Remove API key?"
                  description="AI meal suggestions will stop working until you add a new key."
                  onConfirm={removeApiKey}
                  okText="Remove"
                  okButtonProps={{ danger: true }}
                  cancelText="Cancel"
                >
                  <Button danger loading={apiKeyRemoving}>
                    Remove Key
                  </Button>
                </Popconfirm>
              )}
            </Space>
          </Form.Item>
        </Form>
      </Card>

      <Divider />
      <Text style={{ color: '#475569', fontSize: 12 }}>
        Member since {userData?.created_at ? new Date(userData.created_at).toLocaleDateString() : '—'}
      </Text>
    </div>
  )
}
