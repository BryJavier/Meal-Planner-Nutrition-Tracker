import React from 'react'
import { Button } from 'antd'
import { BgColorsOutlined } from '@ant-design/icons'
import useMealSuggestionStore from '../../store/mealSuggestionStore'

const FloatingButton = () => {
  const { isDrawerOpen, setDrawerOpen } = useMealSuggestionStore()

  const toggleDrawer = () => {
    setDrawerOpen(!isDrawerOpen)
  }

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '20px',
        right: '20px',
        zIndex: 100,
      }}
    >
      <Button
        type="primary"
        shape="circle"
        size="large"
        icon={<BgColorsOutlined style={{ fontSize: '20px' }} />}
        onClick={toggleDrawer}
        style={{
          width: '56px',
          height: '56px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
        }}
      />
    </div>
  )
}

export default FloatingButton
