import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { ConfigProvider, theme } from 'antd'
import AppLayout from './components/layout/AppLayout'
import ProtectedRoute from './components/layout/ProtectedRoute'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import DashboardPage from './pages/DashboardPage'
import CalendarPage from './pages/CalendarPage'
import RecipesPage from './pages/RecipesPage'
import RecipeDetailPage from './pages/RecipeDetailPage'
import IngredientsPage from './pages/IngredientsPage'
import SettingsPage from './pages/SettingsPage'

const { darkAlgorithm } = theme

const appTheme = {
  algorithm: darkAlgorithm,
  token: {
    colorPrimary: '#059669',
    colorBgBase: '#0F172A',
    colorBgContainer: '#1E293B',
    colorBgElevated: '#273549',
    colorBgLayout: '#0F172A',
    colorBgSpotlight: '#273549',
    colorBorder: '#334155',
    colorBorderSecondary: '#334155',
    colorText: '#F1F5F9',
    colorTextSecondary: '#94A3B8',
    colorTextTertiary: '#64748B',
    colorTextPlaceholder: '#64748B',
    colorTextDisabled: '#475569',
    colorFill: 'rgba(255,255,255,0.06)',
    colorFillSecondary: 'rgba(255,255,255,0.04)',
    colorFillTertiary: 'rgba(255,255,255,0.02)',
    colorLink: '#34D399',
    colorLinkHover: '#6EE7B7',
    colorError: '#f87171',
    colorWarning: '#fbbf24',
    colorSuccess: '#34D399',
    borderRadius: 10,
    borderRadiusLG: 12,
    borderRadiusSM: 6,
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Inter', 'Segoe UI', sans-serif",
    fontSize: 14,
    controlHeight: 40,
    controlHeightLG: 48,
    boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
    boxShadowSecondary: '0 2px 8px rgba(0,0,0,0.3)',
  },
  components: {
    Menu: {
      itemBg: '#1E293B',
      itemSelectedBg: 'rgba(5, 150, 105, 0.15)',
      itemSelectedColor: '#34D399',
      itemHoverBg: 'rgba(5, 150, 105, 0.08)',
      itemColor: '#94A3B8',
    },
    Card: {
      colorBgContainer: '#1E293B',
      colorBorderSecondary: '#334155',
    },
    Table: {
      colorBgContainer: '#1E293B',
      headerBg: '#273549',
      rowHoverBg: 'rgba(5,150,105,0.08)',
      borderColor: '#334155',
    },
    Modal: {
      contentBg: '#1E293B',
      headerBg: '#1E293B',
    },
    Drawer: {
      colorBgContainer: '#1E293B',
    },
    Input: {
      colorBgContainer: '#273549',
      activeBorderColor: '#34D399',
      hoverBorderColor: '#475569',
    },
    InputNumber: {
      colorBgContainer: '#273549',
      activeBorderColor: '#34D399',
      hoverBorderColor: '#475569',
    },
    Select: {
      colorBgContainer: '#273549',
      optionSelectedBg: 'rgba(5,150,105,0.2)',
      optionActiveBg: 'rgba(5,150,105,0.1)',
    },
    Progress: {
      defaultColor: '#34D399',
      remainingColor: '#334155',
    },
    Descriptions: {
      colorBgContainer: '#1E293B',
      labelBg: '#273549',
    },
    Statistic: {
      titleFontSize: 13,
    },
  },
}

export default function App() {
  return (
    <ConfigProvider theme={appTheme}>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route element={<ProtectedRoute />}>
            <Route element={<AppLayout />}>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/calendar" element={<CalendarPage />} />
              <Route path="/recipes" element={<RecipesPage />} />
              <Route path="/recipes/:id" element={<RecipeDetailPage />} />
              <Route path="/ingredients" element={<IngredientsPage />} />
              <Route path="/settings" element={<SettingsPage />} />
            </Route>
          </Route>
        </Routes>
      </BrowserRouter>
    </ConfigProvider>
  )
}
