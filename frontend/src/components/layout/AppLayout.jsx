import { useEffect, useState } from 'react'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { Layout, Menu, Avatar, Dropdown, Typography } from 'antd'
import {
  DashboardOutlined,
  CalendarOutlined,
  BookOutlined,
  DatabaseOutlined,
  SettingOutlined,
  UserOutlined,
  LogoutOutlined,
} from '@ant-design/icons'
import useAuthStore from '../../store/authStore'
import AppLogo from '../AppLogo'
import FloatingButton from "../meal-suggestion/FloatingButton"
import MealSuggestionDrawer from "../meal-suggestion/MealSuggestionDrawer"

const { Header, Content, Sider } = Layout

const navItems = [
  { key: '/dashboard', icon: <DashboardOutlined />, label: 'Dashboard' },
  { key: '/calendar', icon: <CalendarOutlined />, label: 'Calendar' },
  { key: '/recipes', icon: <BookOutlined />, label: 'Recipes' },
  { key: '/ingredients', icon: <DatabaseOutlined />, label: 'Ingredients' },
  { key: '/settings', icon: <SettingOutlined />, label: 'Settings' },
]

const LG_BREAKPOINT = 992

export default function AppLayout() {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, logout } = useAuthStore()
  const [isMobile, setIsMobile] = useState(window.innerWidth < LG_BREAKPOINT)

  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < LG_BREAKPOINT)
    window.addEventListener('resize', handler)
    return () => window.removeEventListener('resize', handler)
  }, [])

  const userMenu = {
    items: [
      { key: 'logout', icon: <LogoutOutlined />, label: 'Logout', danger: true },
    ],
    onClick: ({ key }) => { if (key === 'logout') { logout(); navigate('/login') } },
  }

  return (
    <Layout style={{ minHeight: '100dvh', background: '#0F172A' }}>
      {!isMobile && (
        <Sider
          width={220}
          style={{
            background: '#1E293B',
            borderRight: '1px solid #334155',
            position: 'fixed',
            height: '100vh',
            left: 0,
            top: 0,
            zIndex: 10,
            overflow: 'auto',
          }}
        >
          <div style={{
            padding: '20px 20px 16px',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            fontWeight: 700,
            fontSize: 17,
            color: '#34D399',
            letterSpacing: '-0.3px',
          }}>
            <AppLogo size={26} variant="icon" />
            MealPlanner
          </div>
          <Menu
            mode="inline"
            selectedKeys={[location.pathname]}
            items={navItems}
            onClick={({ key }) => navigate(key)}
            style={{ border: 'none', background: 'transparent' }}
          />
        </Sider>
      )}

      <Layout style={{ marginLeft: isMobile ? 0 : 220, background: '#0F172A' }}>
        <Header style={{
          background: '#1E293B',
          padding: '0 20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid #334155',
          height: 56,
          lineHeight: '56px',
          position: 'sticky',
          top: 0,
          zIndex: 9,
        }}>
          {isMobile ? (
            <span style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 700, fontSize: 17, color: '#34D399', letterSpacing: '-0.3px' }}>
              <AppLogo size={24} variant="icon" />
              MealPlanner
            </span>
          ) : (
            <span />
          )}
          <Dropdown menu={userMenu} placement="bottomRight" trigger={['click']}>
            <div style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, padding: '4px 0' }}>
              <Avatar
                icon={<UserOutlined />}
                size={32}
                style={{ background: '#059669', flexShrink: 0 }}
              />
              <Typography.Text style={{ color: '#F1F5F9', fontSize: 14 }}>
                {user?.username}
              </Typography.Text>
            </div>
          </Dropdown>
        </Header>

        <Content style={{
          padding: isMobile ? '16px 16px 80px' : '24px',
          minHeight: 0,
        }}>
          <Outlet />
        </Content>
      </Layout>

      {isMobile && (
        <nav
          className="mobile-bottom-nav"
          style={{
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
            background: '#1E293B',
            borderTop: '1px solid #334155',
            display: 'flex',
            zIndex: 100,
          }}
        >
          {navItems.map((item) => {
            const active = location.pathname === item.key ||
              (item.key !== '/dashboard' && location.pathname.startsWith(item.key))
            return (
              <button
                key={item.key}
                onClick={() => navigate(item.key)}
                style={{
                  flex: 1,
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '10px 0',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 3,
                  color: active ? '#34D399' : '#64748B',
                  transition: 'color 150ms ease',
                  minHeight: 60,
                  WebkitTapHighlightColor: 'transparent',
                }}
              >
                <span style={{ fontSize: 20, lineHeight: 1 }}>{item.icon}</span>
                <span style={{ fontSize: 11, fontWeight: active ? 600 : 400 }}>{item.label}</span>
              </button>
            )
          })}
        </nav>
      <FloatingButton />
      <MealSuggestionDrawer />
      )}
    </Layout>
  )
}
